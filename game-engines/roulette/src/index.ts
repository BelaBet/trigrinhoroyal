import { deriveRoundHash, hashToInt } from "@bet-platform/shared";

/** Roulette engine — roda europeia de zero único (0-36). */

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

export type RouletteColor = "red" | "black" | "green";

export type RouletteBetType =
  | { kind: "straight"; number: number }
  | { kind: "color"; color: "red" | "black" }
  | { kind: "parity"; parity: "even" | "odd" }
  | { kind: "range"; range: "low" | "high" }; // low = 1-18, high = 19-36

export interface RouletteRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface RouletteRoundResult {
  number: number;
  color: RouletteColor;
  roundHash: string;
}

export function resolveRouletteRound(input: RouletteRoundInput): RouletteRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const number = hashToInt(roundHash, 37);
  return { number, color: colorOf(number), roundHash };
}

export function colorOf(number: number): RouletteColor {
  if (number === 0) return "green";
  return RED_NUMBERS.has(number) ? "red" : "black";
}

/** Paga 35:1 no número seco, 1:1 nas apostas de igual chance (cor/paridade/faixa). */
export function settleRouletteBet(params: {
  result: RouletteRoundResult;
  bet: RouletteBetType;
  stakeAmount: number;
}): { won: boolean; payoutAmount: number; multiplier: number } {
  const { result, bet, stakeAmount } = params;
  let won = false;

  switch (bet.kind) {
    case "straight":
      won = bet.number === result.number;
      return won
        ? { won, payoutAmount: round2(stakeAmount * 36), multiplier: 36 }
        : { won, payoutAmount: 0, multiplier: 0 };
    case "color":
      won = result.color === bet.color;
      break;
    case "parity":
      won = result.number !== 0 && result.number % 2 === (bet.parity === "even" ? 0 : 1);
      break;
    case "range":
      won =
        bet.range === "low"
          ? result.number >= 1 && result.number <= 18
          : result.number >= 19 && result.number <= 36;
      break;
  }

  return won
    ? { won, payoutAmount: round2(stakeAmount * 2), multiplier: 2 }
    : { won, payoutAmount: 0, multiplier: 0 };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
