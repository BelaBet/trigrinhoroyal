import { deriveRoundHash, hashToFloat } from "@bet-platform/shared";

/**
 * Plinko engine — 16 linhas de pinos. Cada linha é uma decisão
 * esquerda/direita derivada de um float do hash da rodada; o bucket final é
 * o número de "direitas" (distribuição binomial, mais denso no centro).
 */

const ROWS = 16;
const BUCKETS = ROWS + 1; // 17 buckets

export type RiskLevel = "low" | "medium" | "high";

// Tabelas simétricas: risco maior = cauda mais extrema, centro mais baixo.
const MULTIPLIER_TABLES: Record<RiskLevel, number[]> = {
  low: [8, 4, 2, 1.4, 1.2, 1.1, 1, 0.7, 0.5, 0.7, 1, 1.1, 1.2, 1.4, 2, 4, 8],
  medium: [43, 15, 7, 4, 2, 1.4, 1, 0.5, 0.3, 0.5, 1, 1.4, 2, 4, 7, 15, 43],
  high: [420, 60, 18, 8, 3, 1.5, 0.6, 0.2, 0.1, 0.2, 0.6, 1.5, 3, 8, 18, 60, 420],
};

export interface PlinkoRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  risk: RiskLevel;
}

export interface PlinkoRoundResult {
  path: Array<"L" | "R">;
  bucketIndex: number;
  multiplier: number;
  roundHash: string;
}

export function resolvePlinkoRound(input: PlinkoRoundInput): PlinkoRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const path: Array<"L" | "R"> = [];
  let bucketIndex = 0;

  for (let row = 0; row < ROWS; row++) {
    const offset = (row * 4) % (roundHash.length - 8);
    const goesRight = hashToFloat(roundHash, offset) >= 0.5;
    path.push(goesRight ? "R" : "L");
    if (goesRight) bucketIndex++;
  }

  const multiplier = MULTIPLIER_TABLES[input.risk][bucketIndex];
  return { path, bucketIndex, multiplier, roundHash };
}

export function settlePlinkoBet(params: { multiplier: number; stakeAmount: number }): {
  won: boolean;
  payoutAmount: number;
} {
  const payoutAmount = round2(params.stakeAmount * params.multiplier);
  return { won: params.multiplier >= 1, payoutAmount };
}

export function multiplierTable(risk: RiskLevel): number[] {
  return MULTIPLIER_TABLES[risk];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export { BUCKETS };
