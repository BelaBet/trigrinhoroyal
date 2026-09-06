// Serviço HTTP único que os seus outros projetos chamam — em vez de cada
// um reimplementar a lógica de split, todos batem nesses endpoints.
//
//   seu-site / seu-app / painel  ──HTTP──►  este servidor  ──►  Stone/Pagar.me
//
// Adaptado do stone-split-service para o monorepo BetCore: a única
// mudança em relação ao upstream é o handler do webhook, que agora avisa
// o apps/api (ver betcore-callback.ts) em vez de só logar no console.

import express, { type Request, type Response } from "express";
import "dotenv/config";
import { getPagarmeConfig } from "./config.js";
import { createRecipient, getRecipient } from "./recipients.js";
import { getOrder } from "./orders.js";
import { chargeWithSplit } from "./charge-with-split.js";
import { calculateHotmartSplit } from "./split-calculator.js";
import { isValidWebhookSignature, dispatchWebhookEvent, type PagarmeWebhookEvent } from "./webhook.js";
import { notifyBetCoreDepositConfirmed } from "./betcore-callback.js";

const app = express();

// Guarda o corpo cru da requisição — necessário pra validar a assinatura
// do webhook (ver isValidWebhookSignature). Precisa vir ANTES de qualquer
// outra coisa usar o body já parseado.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as Request & { rawBody?: string }).rawBody = buf.toString();
    },
  }),
);

function sendError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : "Erro desconhecido";
  res.status(400).json({ error: message });
}

// --- Recebedores (produtor, co-produtor, afiliado) ---

app.post("/recipients", async (req: Request, res: Response) => {
  try {
    const recipient = await createRecipient(req.body);
    res.status(201).json(recipient);
  } catch (err) {
    sendError(res, err);
  }
});

app.get("/recipients/:id", async (req: Request, res: Response) => {
  try {
    res.json(await getRecipient(req.params.id));
  } catch (err) {
    sendError(res, err);
  }
});

// --- Simulação de taxa, sem cobrar nada (útil pra UI de checkout) ---

app.post("/split/simulate", (req: Request, res: Response) => {
  try {
    res.json(calculateHotmartSplit(req.body));
  } catch (err) {
    sendError(res, err);
  }
});

// --- Checkout com split ---

app.post("/checkout", async (req: Request, res: Response) => {
  try {
    res.status(201).json(await chargeWithSplit(req.body));
  } catch (err) {
    sendError(res, err);
  }
});

app.get("/orders/:id", async (req: Request, res: Response) => {
  try {
    res.json(await getOrder(req.params.id));
  } catch (err) {
    sendError(res, err);
  }
});

// --- Webhook ---

app.post("/webhooks/pagarme", async (req: Request, res: Response) => {
  const { webhookSecret } = getPagarmeConfig();
  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? "";
  const signature = req.header("x-hub-signature");

  if (!isValidWebhookSignature(rawBody, signature, webhookSecret)) {
    return res.status(401).json({ error: "assinatura inválida" });
  }

  const event = req.body as PagarmeWebhookEvent;

  await dispatchWebhookEvent(event, {
    onPaid: async (e) => {
      await notifyBetCoreDepositConfirmed({ orderId: e.data.id, status: "paid" });
    },
    onPaymentFailed: async (e) => {
      await notifyBetCoreDepositConfirmed({ orderId: e.data.id, status: "payment_failed" });
    },
    onRefunded: async (e) => {
      await notifyBetCoreDepositConfirmed({ orderId: e.data.id, status: "refunded" });
    },
    onUnhandled: async (e) => console.log(`Evento não tratado: ${e.type}`),
  });

  res.status(200).json({ received: true });
});

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true, service: "betcore-payments" }));

const { port } = getPagarmeConfig();
app.listen(port, () => {
  console.log(`BetCore payments (stone-split-service) rodando em http://localhost:${port}`);
});
