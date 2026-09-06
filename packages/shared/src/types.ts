/**
 * DTOs compartilhados entre apps/api e as duas apps Next.js.
 * Mantidos independentes do Prisma Client para não vazar tipos de
 * infraestrutura de banco para o frontend.
 */

/**
 * O slug de um jogo específico (ex.: "crash", "fortune-cat") — não é um
 * union fechado porque o catálogo de Slots tem vários jogos com slugs
 * próprios sobre o mesmo motor. A validade real é conferida no backend
 * pela existência do registro em `games`.
 */
export type GameSlug = string;

export type GameCategory = "SLOTS" | "CRASH" | "MINES" | "PLINKO" | "ROULETTE" | "BLACKJACK";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface WalletBalance {
  realBalance: string;
  blockedBalance: string;
  bonusBalance: string;
  currency: string;
}

export interface LedgerEntryDto {
  id: string;
  type:
    | "DEPOSIT"
    | "BET"
    | "WIN"
    | "LOSS"
    | "REFUND"
    | "WITHDRAWAL"
    | "BONUS"
    | "BONUS_CONVERSION"
    | "ADMIN_ADJUSTMENT";
  amount: string;
  description?: string | null;
  createdAt: string;
}

export interface GameSummaryDto {
  id: string;
  slug: GameSlug;
  name: string;
  type: string;
  rtp: string;
  minBet: string;
  maxBet: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface PlaceBetInput {
  gameSlug: GameSlug;
  stakeAmount: number;
  /** Parâmetros específicos do jogo — ex.: autoCashout no Crash, minas/posições no Mines. */
  params?: Record<string, unknown>;
}

export interface BetResultDto {
  betId: string;
  status: "WON" | "LOST" | "PUSH";
  stakeAmount: string;
  payoutAmount: string;
  multiplier: string | null;
  wallet: WalletBalance;
  roundId: string;
  serverSeedHash: string;
  /** Detalhe do resultado do game engine (ex.: crashPoint, minePositions, número da roleta). */
  outcome: Record<string, unknown>;
}

export interface BetHistoryDto {
  id: string;
  gameSlug: GameSlug;
  gameName: string;
  stakeAmount: string;
  payoutAmount: string;
  status: "WON" | "LOST" | "PUSH";
  placedAt: string;
}

export interface DepositInput {
  amount: number;
}

/**
 * Mines é o único jogo com decisão incremental (revelar célula a célula e
 * escolher continuar ou retirar) — por isso tem um fluxo próprio de várias
 * chamadas (start -> reveal* -> cashout|hit), diferente do POST /bets de
 * disparo único usado por Crash/Plinko/Roulette.
 */
export interface StartMinesInput {
  stakeAmount: number;
  minesCount: number;
}

export interface RevealMinesInput {
  cellIndex: number;
}

export interface MinesGameStateDto {
  betId: string;
  roundId: string;
  minesCount: number;
  gridSize: number;
  revealedCells: number[];
  status: "PENDING" | "WON" | "LOST";
  /** Multiplicador se retirar agora (ou o multiplicador final, se já resolvido). */
  currentMultiplier: string;
  /** stakeAmount * currentMultiplier, formatado. */
  potentialPayout: string;
  /** Só presente quando status !== PENDING (fim de jogo). */
  minePositions?: number[];
  payoutAmount?: string;
  wallet?: WalletBalance;
  serverSeedHash: string;
}

/**
 * Blackjack também tem fluxo próprio (start -> hit, double ou stand), já
 * que o jogador decide ação a ação contra o dealer. Sem split nesta versão.
 */
export interface PlayingCard {
  rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
  suit: "♠" | "♥" | "♦" | "♣";
}

export interface StartBlackjackInput {
  stakeAmount: number;
}

export interface BlackjackGameStateDto {
  betId: string;
  roundId: string;
  stakeAmount: string;
  playerCards: PlayingCard[];
  playerTotal: number;
  /** Carta do dealer virada pra baixo não entra aqui enquanto status === PENDING. */
  dealerCards: PlayingCard[];
  dealerTotal: number | null;
  status: "PENDING" | "WON" | "LOST" | "PUSH";
  canHit: boolean;
  canDouble: boolean;
  payoutAmount?: string;
  wallet?: WalletBalance;
  serverSeedHash: string;
}
