// Cálculo de split no MODELO HOTMART (não é o modelo gross-up do LojaHub).
// Todos os valores em CENTAVOS.
//
// Como funciona na Hotmart, e como replicamos aqui:
//   - O comprador paga o valor CHEIO do produto (sem acréscimo de taxa).
//   - A plataforma retém sua taxa DE DENTRO desse valor (não soma por cima).
//   - O que sobra é dividido entre produtor, co-produtor e afiliado.
//
// Ou seja, ao contrário do gross-up (customer paga produto + taxas), aqui
// é "taxa por dentro": totalAmount = valor do produto, sempre.

export const MICROTRANSACTION_THRESHOLD_CENTS = 1000; // R$ 10,00
export const STANDARD_PERCENTAGE_FEE = 0.099; // 9,9%
export const STANDARD_FIXED_FEE_CENTS = 249; // R$ 2,49
export const MICROTRANSACTION_PERCENTAGE_FEE = 0.20; // 20%

/** Taxa da plataforma para uma venda de `grossAmountCents`, em centavos. */
export function calculatePlatformFeeCents(grossAmountCents: number): number {
  if (grossAmountCents <= MICROTRANSACTION_THRESHOLD_CENTS) {
    return Math.round(grossAmountCents * MICROTRANSACTION_PERCENTAGE_FEE);
  }
  return Math.round(grossAmountCents * STANDARD_PERCENTAGE_FEE) + STANDARD_FIXED_FEE_CENTS;
}

export type SplitLeg = {
  recipientId: string;
  amount: number;
  role: "producer" | "coproducer" | "affiliate";
};

export type HotmartSplitResult = {
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  legs: SplitLeg[];
};

export type HotmartSplitInput = {
  /** Valor total do produto, em centavos. É o que o comprador paga. */
  grossAmountCents: number;
  producerRecipientId: string;
  affiliateRecipientId?: string;
  /** % (0-100) da comissão do afiliado, calculada sobre o valor líquido
   * (após a taxa da plataforma) — igual à Hotmart. */
  affiliatePercentage?: number;
  coproducerRecipientId?: string;
  /** % (0-100) do co-produtor, também sobre o valor líquido. */
  coproducerPercentage?: number;
};

export function calculateHotmartSplit(input: HotmartSplitInput): HotmartSplitResult {
  const {
    grossAmountCents,
    producerRecipientId,
    affiliateRecipientId,
    affiliatePercentage = 0,
    coproducerRecipientId,
    coproducerPercentage = 0,
  } = input;

  if (!Number.isInteger(grossAmountCents) || grossAmountCents <= 0) {
    throw new Error("grossAmountCents precisa ser um inteiro positivo (centavos).");
  }
  if (!producerRecipientId) {
    throw new Error("producerRecipientId é obrigatório — todo produto tem um produtor.");
  }
  if (affiliatePercentage + coproducerPercentage > 100) {
    throw new Error("affiliatePercentage + coproducerPercentage não pode passar de 100.");
  }

  const platformFeeCents = calculatePlatformFeeCents(grossAmountCents);
  const netAmountCents = grossAmountCents - platformFeeCents;

  const affiliateCents = affiliateRecipientId
    ? Math.round((netAmountCents * affiliatePercentage) / 100)
    : 0;
  const coproducerCents = coproducerRecipientId
    ? Math.round((netAmountCents * coproducerPercentage) / 100)
    : 0;

  // O produtor recebe o restante — é ele quem "banca" o arredondamento e
  // a responsabilidade residual, igual ao papel do produtor na Hotmart.
  const producerCents = netAmountCents - affiliateCents - coproducerCents;

  const legs: SplitLeg[] = [
    { recipientId: producerRecipientId, amount: producerCents, role: "producer" },
  ];
  if (affiliateRecipientId && affiliateCents > 0) {
    legs.push({ recipientId: affiliateRecipientId, amount: affiliateCents, role: "affiliate" });
  }
  if (coproducerRecipientId && coproducerCents > 0) {
    legs.push({ recipientId: coproducerRecipientId, amount: coproducerCents, role: "coproducer" });
  }

  return { grossAmountCents, platformFeeCents, netAmountCents, legs };
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
