// Exemplo completo: monta o split no MODELO HOTMART e chama a API do
// Pagar.me/Stone. PRECISA rodar no servidor (Node, Deno, edge function,
// etc.) — nunca no navegador, porque usa a chave secreta.

import { calculateHotmartSplit, type SplitLeg } from "./split-calculator.js";
import { assertParticipantRecipientId, isPlatformRecipient } from "./recipient-guard.js";
import { getPagarmeConfig, getPagarmeSecretKey } from "./config.js";

const ROLE_LABEL: Record<SplitLeg["role"], "produtor" | "co-produtor" | "afiliado"> = {
  producer: "produtor",
  coproducer: "co-produtor",
  affiliate: "afiliado",
};

/**
 * Cada perna do split no modelo Hotmart:
 *   - produtor: charge_processing_fee true, liable true, charge_remainder_fee
 *     true — é ele quem banca taxa de processamento e arredondamento,
 *     igual ao papel do produtor na Hotmart.
 *   - co-produtor / afiliado: todas as três opções false — só recebem a
 *     fatia calculada, sem responsabilidade financeira extra.
 */
function buildSplitRules(legs: SplitLeg[]) {
  return legs.map((leg) => ({
    recipient_id: leg.recipientId,
    amount: leg.amount,
    type: "flat" as const,
    options: {
      charge_processing_fee: leg.role === "producer",
      liable: leg.role === "producer",
      charge_remainder_fee: leg.role === "producer",
    },
  }));
}

type ChargeInput = {
  /** Valor total do produto, em CENTAVOS — é o que o comprador paga (o
   * modelo Hotmart não soma taxa em cima; a taxa sai de dentro deste
   * valor). */
  grossAmountCents: number;
  /** 1 a 12. Só relevante pra crédito; débito/pix sempre 1. */
  installments: number;
  producerRecipientId: string;
  affiliateRecipientId?: string;
  affiliatePercentage?: number;
  coproducerRecipientId?: string;
  coproducerPercentage?: number;
  paymentMethod: "pix" | "credit_card" | "debit_card";
};

export async function chargeWithSplit(input: ChargeInput) {
  const {
    grossAmountCents,
    installments,
    producerRecipientId,
    affiliateRecipientId,
    affiliatePercentage,
    coproducerRecipientId,
    coproducerPercentage,
    paymentMethod,
  } = input;

  const { platformRecipientId, apiBaseUrl } = getPagarmeConfig();
  const secretKey = getPagarmeSecretKey();

  // 1) Recusa se algum recipient for inválido ou igual ao da plataforma
  //    (evita split quebrado / dinheiro indo pro lugar errado).
  for (const [recipientId, role] of [
    [producerRecipientId, "producer"],
    [affiliateRecipientId, "affiliate"],
    [coproducerRecipientId, "coproducer"],
  ] as const) {
    if (!recipientId) continue;
    if (isPlatformRecipient(recipientId, platformRecipientId)) {
      throw new Error(`Recipient do ${ROLE_LABEL[role]} não pode ser o mesmo da plataforma.`);
    }
    assertParticipantRecipientId(recipientId, platformRecipientId, ROLE_LABEL[role]);
  }

  // 2) Calcula a taxa da plataforma e a divisão entre produtor / co-produtor
  //    / afiliado, seguindo exatamente a tabela de taxas da Hotmart.
  const split = calculateHotmartSplit({
    grossAmountCents,
    producerRecipientId,
    affiliateRecipientId,
    affiliatePercentage,
    coproducerRecipientId,
    coproducerPercentage,
  });

  // 3) Monta as regras de split no formato que o Pagar.me/Stone espera.
  //    Repare que a taxa da plataforma NÃO entra aqui: ela fica
  //    implicitamente com a conta principal (dona da secret key), que é o
  //    comportamento padrão quando o split não cobre 100% do valor.
  const splitRules = buildSplitRules(split.legs);

  // 4) Monta o payload da cobrança (exemplo simplificado — adapte os
  //    campos de customer/items/card/pix conforme seu caso de uso real).
  const paymentBlock =
    paymentMethod === "pix"
      ? { payment_method: "pix", pix: { expires_in: 3600 }, amount: split.grossAmountCents, split: splitRules }
      : {
          payment_method: paymentMethod, // "credit_card" | "debit_card"
          amount: split.grossAmountCents,
          [paymentMethod]: {
            operation_type: "auth_and_capture",
            installments: paymentMethod === "credit_card" ? installments : 1,
            // card: { number, holder_name, exp_month, exp_year, cvv, billing_address }
          },
          split: splitRules,
        };

  const orderPayload = {
    closed: false,
    items: [{ amount: split.grossAmountCents, description: "Venda", quantity: 1 }],
    // customer: { name, email, type: "individual", document, phones: {...} },
    payments: [paymentBlock],
  };

  // 5) Chama a API. Autenticação é Basic Auth: usuário = chave secreta,
  //    senha vazia.
  const res = await fetch(`${apiBaseUrl}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${secretKey}:`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderPayload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? "Pagamento recusado");

  return {
    orderId: data.id,
    status: data.status,
    chargeStatus: data.charges?.[0]?.status ?? null,
    grossAmountCents: split.grossAmountCents,
    platformFeeCents: split.platformFeeCents,
    netAmountCents: split.netAmountCents,
    legs: split.legs,
  };
}
