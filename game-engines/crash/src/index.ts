import { deriveRoundHash, hashToInt } from "@bet-platform/shared";

/**
 * Crash engine.
 *
 * O ponto de crash é derivado do hash da rodada por um algoritmo público de
 * jogos crash provably-fair: um inteiro de 52 bits do hash decide tanto a
 * chance de "crash instantâneo" (1.00x, embute a margem da casa) quanto a
 * curva do multiplicador nos demais casos.
 */

const HOUSE_EDGE_MODULO = 33; // ~1/33 das rodadas crasham em 1.00x
const MAX_MULTIPLIER = 1_000_000; // trava de segurança (não representa RTP real)

export interface CrashRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface CrashRoundResult {
  crashPoint: number;
  roundHash: string;
}

export function resolveCrashRound(input: CrashRoundInput): CrashRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const h = hashToInt(roundHash, Number.MAX_SAFE_INTEGER);

  if (h % HOUSE_EDGE_MODULO === 0) {
    return { crashPoint: 1.0, roundHash };
  }

  const e = Math.pow(2, 52);
  const hBits = h % e;
  const raw = Math.floor((100 * e - hBits) / (e - hBits)) / 100;
  const crashPoint = Math.min(Math.max(raw, 1.0), MAX_MULTIPLIER);

  return { crashPoint, roundHash };
}

/** Aposta com cashout automático: ganha se conseguir sair antes do crash. */
export function settleCrashBet(params: {
  crashPoint: number;
  stakeAmount: number;
  cashoutMultiplier: number;
}): { won: boolean; payoutAmount: number; multiplier: number } {
  const won = params.cashoutMultiplier <= params.crashPoint;
  const payoutAmount = won ? round2(params.stakeAmount * params.cashoutMultiplier) : 0;
  return { won, payoutAmount, multiplier: params.cashoutMultiplier };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
