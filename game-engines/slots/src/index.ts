import { deriveRoundHash, hashToInt } from "@bet-platform/shared";

/**
 * Slots engine — grade 3 reels x 3 linhas, 5 linhas de pagamento fixas
 * (topo, meio, base, duas diagonais). Aposta total é dividida igualmente
 * entre as 5 linhas; cada linha paga se os 3 símbolos forem iguais
 * (WILD substitui qualquer símbolo). Suporta vários jogos (nomes/temas
 * diferentes) sobre o mesmo motor — o slug do jogo não importa aqui,
 * só o resultado matemático.
 */

export type SlotSymbolId = "CHERRY" | "LEMON" | "BELL" | "GEM" | "CROWN" | "WILD";

interface SymbolDef {
  id: SlotSymbolId;
  weight: number;
  /** Multiplicador pago quando os 3 símbolos da linha são iguais (ou WILD). */
  payout: number;
}

const SYMBOLS: SymbolDef[] = [
  { id: "CHERRY", weight: 30, payout: 1 },
  { id: "LEMON", weight: 25, payout: 1.5 },
  { id: "BELL", weight: 20, payout: 3 },
  { id: "GEM", weight: 15, payout: 6 },
  { id: "CROWN", weight: 8, payout: 15 },
  { id: "WILD", weight: 2, payout: 40 },
];
const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);

const REELS = 3;
const ROWS = 3;

/** [reel, row] por linha. */
const PAYLINES: Array<Array<[number, number]>> = [
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ], // topo
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ], // meio
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ], // base
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ], // diagonal ↘
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ], // diagonal ↗
];

export interface SlotsRoundInput {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export type SlotsGrid = SlotSymbolId[][]; // grid[reel][row]

export interface SlotsRoundResult {
  grid: SlotsGrid;
  roundHash: string;
}

function pickSymbol(hash: string, offset: number): SlotSymbolId {
  const roll = hashToInt(hash, TOTAL_WEIGHT, offset);
  let cursor = 0;
  for (const symbol of SYMBOLS) {
    cursor += symbol.weight;
    if (roll < cursor) return symbol.id;
  }
  return SYMBOLS[SYMBOLS.length - 1].id;
}

export function resolveSlotsRound(input: SlotsRoundInput): SlotsRoundResult {
  const roundHash = deriveRoundHash(input.serverSeed, input.clientSeed, input.nonce);
  const grid: SlotsGrid = [];
  let cell = 0;
  for (let reel = 0; reel < REELS; reel++) {
    const column: SlotSymbolId[] = [];
    for (let row = 0; row < ROWS; row++) {
      const offset = (cell * 4) % (roundHash.length - 8);
      column.push(pickSymbol(roundHash, offset));
      cell++;
    }
    grid.push(column);
  }
  return { grid, roundHash };
}

export interface PaylineWin {
  lineIndex: number;
  symbol: SlotSymbolId;
  multiplier: number;
  payoutAmount: number;
}

function payoutOf(symbol: SlotSymbolId): number {
  return SYMBOLS.find((s) => s.id === symbol)!.payout;
}

/** Símbolo que uma linha paga (considerando WILD), ou null se não formar combinação. */
function lineOutcome(symbols: SlotSymbolId[]): SlotSymbolId | null {
  const nonWild = symbols.filter((s) => s !== "WILD");
  if (nonWild.length === 0) return "WILD";
  const allSame = nonWild.every((s) => s === nonWild[0]);
  return allSame ? nonWild[0] : null;
}

export function settleSlotsBet(params: {
  grid: SlotsGrid;
  stakeAmount: number;
}): { won: boolean; payoutAmount: number; multiplier: number; wins: PaylineWin[] } {
  const lineStake = params.stakeAmount / PAYLINES.length;
  const wins: PaylineWin[] = [];

  PAYLINES.forEach((line, lineIndex) => {
    const symbols = line.map(([reel, row]) => params.grid[reel][row]);
    const winningSymbol = lineOutcome(symbols);
    if (!winningSymbol) return;
    const multiplier = payoutOf(winningSymbol);
    wins.push({ lineIndex, symbol: winningSymbol, multiplier, payoutAmount: round2(lineStake * multiplier) });
  });

  const payoutAmount = round2(wins.reduce((sum, w) => sum + w.payoutAmount, 0));
  return {
    won: payoutAmount > 0,
    payoutAmount,
    multiplier: params.stakeAmount > 0 ? round4(payoutAmount / params.stakeAmount) : 0,
    wins,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export { PAYLINES };
