import { deriveRoundHash, seededShuffle } from "@bet-platform/shared";

/**
 * Blackjack engine — baralho único embaralhado por rodada (provably fair),
 * mão do jogador contra o dealer. Dealer pede carta com menos de 17 e para
 * em qualquer 17. Sem split nesta versão — hit/stand/double apenas.
 */

export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type Suit = "♠" | "♥" | "♦" | "♣";
export interface Card {
  rank: Rank;
  suit: Suit;
}

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];

export interface BlackjackRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface BlackjackRoundResult {
  /** Baralho já embaralhado — draw() consome do início (`shift`). */
  deck: Card[];
  roundHash: string;
}

export function resolveBlackjackRound(input: BlackjackRoundInput): BlackjackRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return { deck: seededShuffle(deck, roundHash), roundHash };
}

export interface HandValue {
  total: number;
  /** true se um Ás está contando como 11 (mão "soft"). */
  soft: boolean;
}

export function computeHandValue(cards: Card[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces++;
      total += 11;
    } else if (card.rank === "J" || card.rank === "Q" || card.rank === "K" || card.rank === "10") {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  let soft = aces > 0;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
    soft = aces > 0;
  }
  return { total, soft };
}

export function isBust(cards: Card[]): boolean {
  return computeHandValue(cards).total > 21;
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && computeHandValue(cards).total === 21;
}

/** Dealer pede carta com <17; para em qualquer 17 (inclusive soft 17). */
export function dealerShouldHit(dealerCards: Card[]): boolean {
  return computeHandValue(dealerCards).total < 17;
}

export type RoundOutcome = "BLACKJACK" | "WIN" | "PUSH" | "LOSS";

export interface SettleResult {
  outcome: RoundOutcome;
  /** Multiplicador sobre a aposta — já inclui a aposta de volta numa vitória. */
  multiplier: number;
}

export function settleHand(params: {
  playerCards: Card[];
  dealerCards: Card[];
}): SettleResult {
  const playerBust = isBust(params.playerCards);
  const dealerBust = isBust(params.dealerCards);
  const playerBJ = isBlackjack(params.playerCards);
  const dealerBJ = isBlackjack(params.dealerCards);

  if (playerBust) return { outcome: "LOSS", multiplier: 0 };
  if (playerBJ && dealerBJ) return { outcome: "PUSH", multiplier: 1 };
  if (playerBJ) return { outcome: "BLACKJACK", multiplier: 2.5 };
  if (dealerBJ) return { outcome: "LOSS", multiplier: 0 };
  if (dealerBust) return { outcome: "WIN", multiplier: 2 };

  const playerTotal = computeHandValue(params.playerCards).total;
  const dealerTotal = computeHandValue(params.dealerCards).total;
  if (playerTotal > dealerTotal) return { outcome: "WIN", multiplier: 2 };
  if (playerTotal < dealerTotal) return { outcome: "LOSS", multiplier: 0 };
  return { outcome: "PUSH", multiplier: 1 };
}
