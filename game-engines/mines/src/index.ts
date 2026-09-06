import { deriveRoundHash, seededShuffle } from "@bet-platform/shared";

/**
 * Mines engine — grade 5x5 (25 células), N minas escolhidas por embaralhamento
 * determinístico do hash da rodada. O multiplicador de cada célula segura
 * revelada segue a combinatória exata (sem casa) multiplicada pelo RTP alvo.
 */

const GRID_SIZE = 25;
const RTP = 0.97;

export interface MinesRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  minesCount: number;
}

export interface MinesRoundResult {
  minePositions: number[];
  roundHash: string;
}

export function resolveMinesRound(input: MinesRoundInput): MinesRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const cells = Array.from({ length: GRID_SIZE }, (_, i) => i);
  const shuffled = seededShuffle(cells, roundHash);
  const minePositions = shuffled.slice(0, input.minesCount).sort((a, b) => a - b);
  return { minePositions, roundHash };
}

/** Multiplicador justo (sem margem) após revelar `safeReveals` células seguras. */
export function fairMultiplier(minesCount: number, safeReveals: number): number {
  let probability = 1;
  for (let i = 0; i < safeReveals; i++) {
    probability *= (GRID_SIZE - minesCount - i) / (GRID_SIZE - i);
  }
  return 1 / probability;
}

export function payoutMultiplier(minesCount: number, safeReveals: number): number {
  return round4(fairMultiplier(minesCount, safeReveals) * RTP);
}

export function settleMinesBet(params: {
  minePositions: number[];
  revealedCells: number[];
  minesCount: number;
  stakeAmount: number;
}): { won: boolean; payoutAmount: number; multiplier: number } {
  const hitMine = params.revealedCells.some((cell) => params.minePositions.includes(cell));
  if (hitMine) {
    return { won: false, payoutAmount: 0, multiplier: 0 };
  }
  const multiplier = payoutMultiplier(params.minesCount, params.revealedCells.length);
  return { won: true, payoutAmount: round2(params.stakeAmount * multiplier), multiplier };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export { GRID_SIZE };
