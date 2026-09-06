// Recebe e valida eventos assíncronos do Pagar.me/Stone. Libere o acesso
// ao produto (área de membros) SÓ depois de receber "order.paid" aqui —
// nunca na resposta síncrona do checkout, que só confirma que o pedido foi
// criado, não que o pagamento foi de fato aprovado (isso vale sobretudo
// pra boleto e Pix, que aprovam de forma assíncrona).

import { createHmac, timingSafeEqual } from "node:crypto";

export type PagarmeWebhookEvent = {
  type: string;
  data: {
    id: string;
    status?: string;
    charges?: Array<{ status?: string; last_transaction?: { split?: unknown } }>;
    [key: string]: unknown;
  };
};

/** Verifica a assinatura HMAC do header X-Hub-Signature contra o corpo
 * cru da requisição. `rawBody` precisa ser o texto exato recebido, antes
 * de qualquer JSON.parse — frameworks tipo Express exigem configurar um
 * middleware que preserve isso (ver server.ts). */
export function isValidWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  webhookSecret: string,
): boolean {
  if (!webhookSecret) return true; // pule a checagem só em dev, nunca em produção
  if (!signatureHeader) return false;

  const expected = createHmac("sha1", webhookSecret).update(rawBody).digest("hex");
  const expectedHeader = `sha1=${expected}`;

  // Comparação em tempo constante — evita vazar informação por timing.
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expectedHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type WebhookHandlers = {
  onPaid?: (event: PagarmeWebhookEvent) => void | Promise<void>;
  onPaymentFailed?: (event: PagarmeWebhookEvent) => void | Promise<void>;
  onRefunded?: (event: PagarmeWebhookEvent) => void | Promise<void>;
  onUnhandled?: (event: PagarmeWebhookEvent) => void | Promise<void>;
};

export async function dispatchWebhookEvent(event: PagarmeWebhookEvent, handlers: WebhookHandlers) {
  switch (event.type) {
    case "order.paid":
      await handlers.onPaid?.(event);
      break;
    case "order.payment_failed":
      await handlers.onPaymentFailed?.(event);
      break;
    case "order.refunded":
      await handlers.onRefunded?.(event);
      break;
    default:
      await handlers.onUnhandled?.(event);
  }
}
