/**
 * DTOs compartilhados entre apps/api e as duas apps Next.js.
 * Mantidos independentes do Prisma Client para não vazar tipos de
 * infraestrutura de banco para o frontend.
 */

export type GameSlug = "crash" | "mines" | "plinko" | "roulette";

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
  status: "WON" | "LOST";
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
  status: "WON" | "LOST";
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
