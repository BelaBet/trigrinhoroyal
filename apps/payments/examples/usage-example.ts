// Exemplo de uso, com o mesmo caso do documento de planejamento:
// curso de R$ 497,00, afiliado com 50% de comissão sobre o líquido.

import { chargeWithSplit } from "../src/charge-with-split.js";
import { calculateHotmartSplit, formatBRL } from "../src/split-calculator.js";

async function main() {
  // 1) Simular a taxa antes de cobrar (útil pra mostrar o preço na UI,
  //    sem chamar a API de verdade):
  const preview = calculateHotmartSplit({
    grossAmountCents: 49700,
    producerRecipientId: "re_producer_exemplo",
    affiliateRecipientId: "re_affiliate_exemplo",
    affiliatePercentage: 50,
  });
  console.log("Taxa da plataforma:", formatBRL(preview.platformFeeCents));
  console.log("Líquido a dividir:", formatBRL(preview.netAmountCents));
  console.log("Divisão:", preview.legs.map((l) => `${l.role}: ${formatBRL(l.amount)}`));

  // 2) Cobrar de verdade (requer PAGARME_SECRET_KEY e
  //    PAGARME_PLATFORM_RECIPIENT_ID configurados no ambiente):
  const resultado = await chargeWithSplit({
    grossAmountCents: 49700,
    installments: 1,
    paymentMethod: "credit_card",
    producerRecipientId: "re_producer_real_do_seu_banco_de_dados",
    affiliateRecipientId: "re_affiliate_real_do_seu_banco_de_dados",
    affiliatePercentage: 50,
  });
  console.log(resultado);
}

main().catch(console.error);
