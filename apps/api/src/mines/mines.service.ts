import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@bet-platform/database";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { toWalletBalance } from "../wallet/wallet.mapper";
import { generateServerSeed, hashServerSeed } from "@bet-platform/shared";
import { GRID_SIZE, payoutMultiplier, resolveMinesRound } from "@bet-platform/game-engine-mines";
import type { MinesGameStateDto } from "@bet-platform/shared";

interface MinesBetState {
  minePositions: number[];
  revealedCells: number[];
}

/**
 * Mines é o único jogo com decisão incremental (revelar célula a célula e
 * escolher continuar ou retirar) — por isso tem seu próprio fluxo de
 * várias chamadas, ao contrário do POST /bets de disparo único usado por
 * Crash/Plinko/Roulette. As posições das minas ficam em Bet.state, nunca
 * expostas ao cliente enquanto a aposta segue PENDING.
 */
@Injectable()
export class MinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async start(userId: string, stakeAmount: number, minesCount: number): Promise<MinesGameStateDto> {
    const game = await this.prisma.game.findUnique({ where: { slug: "mines" } });
    if (!game || game.status !== "ACTIVE") {
      throw new NotFoundException("Jogo indisponível");
    }

    const minBet = game.minBet.toNumber();
    const maxBet = game.maxBet.toNumber();
    if (stakeAmount < minBet || stakeAmount > maxBet) {
      throw new BadRequestException(
        `Aposta deve estar entre R$${minBet.toFixed(2)} e R$${maxBet.toFixed(2)}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const bonusAvailable = wallet.bonusBalance.toNumber();
      const realAvailable = wallet.realBalance.toNumber();
      if (stakeAmount > bonusAvailable + realAvailable) {
        throw new BadRequestException("Saldo insuficiente para essa aposta");
      }
      const useBonus = bonusAvailable >= stakeAmount;

      await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: "BET",
        amount: -stakeAmount,
        bonusDelta: useBonus ? -stakeAmount : 0,
        realDelta: useBonus ? 0 : -stakeAmount,
        blockedDelta: stakeAmount,
        description: "Aposta em Mines",
        referenceType: "game",
        referenceId: game.id,
      });

      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = "betcore";
      const lastRound = await tx.gameRound.findFirst({
        where: { gameId: game.id },
        orderBy: { roundNumber: "desc" },
      });
      const roundNumber = (lastRound?.roundNumber ?? 0n) + 1n;

      const { minePositions } = resolveMinesRound({
        serverSeed,
        clientSeed,
        nonce: Number(roundNumber),
        minesCount,
      });

      const round = await tx.gameRound.create({
        data: {
          gameId: game.id,
          roundNumber,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: Number(roundNumber),
          status: "RUNNING",
        },
      });

      const state: MinesBetState = { minePositions, revealedCells: [] };
      const bet = await tx.bet.create({
        data: {
          userId,
          gameId: game.id,
          gameRoundId: round.id,
          stakeAmount,
          status: "PENDING",
          state: state as unknown as object,
        },
      });

      return {
        betId: bet.id,
        roundId: round.id,
        minesCount,
        gridSize: GRID_SIZE,
        revealedCells: [],
        status: "PENDING",
        currentMultiplier: "1.0000",
        potentialPayout: stakeAmount.toFixed(2),
        serverSeedHash,
      };
    });
  }

  async reveal(userId: string, betId: string, cellIndex: number): Promise<MinesGameStateDto> {
    return this.prisma.$transaction(async (tx) => {
      const bet = await tx.bet.findUnique({ where: { id: betId }, include: { game: true } });
      if (!bet || bet.userId !== userId || bet.game.slug !== "mines") {
        throw new NotFoundException("Aposta não encontrada");
      }
      if (bet.status !== "PENDING") {
        throw new BadRequestException("Essa rodada já foi encerrada");
      }

      const state = bet.state as unknown as MinesBetState;
      const minesCount = state.minePositions.length;
      if (state.revealedCells.includes(cellIndex)) {
        throw new BadRequestException("Célula já revelada");
      }

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const round = await tx.gameRound.findUniqueOrThrow({ where: { id: bet.gameRoundId! } });

      if (state.minePositions.includes(cellIndex)) {
        return this.settleLoss(tx, bet.id, wallet.id, bet.stakeAmount.toNumber(), state, round, minesCount);
      }

      const revealedCells = [...state.revealedCells, cellIndex];
      const safeTotal = GRID_SIZE - minesCount;
      const multiplier = payoutMultiplier(minesCount, revealedCells.length);

      if (revealedCells.length === safeTotal) {
        // Todas as células seguras reveladas — encerra automaticamente no maior multiplicador.
        return this.settleWin(
          tx,
          bet.id,
          wallet.id,
          bet.stakeAmount.toNumber(),
          multiplier,
          { ...state, revealedCells },
          round,
          minesCount,
        );
      }

      await tx.bet.update({
        where: { id: bet.id },
        data: { state: { ...state, revealedCells } as unknown as object },
      });

      return {
        betId: bet.id,
        roundId: round.id,
        minesCount,
        gridSize: GRID_SIZE,
        revealedCells,
        status: "PENDING",
        currentMultiplier: multiplier.toFixed(4),
        potentialPayout: round2(bet.stakeAmount.toNumber() * multiplier).toFixed(2),
        serverSeedHash: round.serverSeedHash,
      };
    });
  }

  async cashout(userId: string, betId: string): Promise<MinesGameStateDto> {
    return this.prisma.$transaction(async (tx) => {
      const bet = await tx.bet.findUnique({ where: { id: betId }, include: { game: true } });
      if (!bet || bet.userId !== userId || bet.game.slug !== "mines") {
        throw new NotFoundException("Aposta não encontrada");
      }
      if (bet.status !== "PENDING") {
        throw new BadRequestException("Essa rodada já foi encerrada");
      }

      const state = bet.state as unknown as MinesBetState;
      if (state.revealedCells.length === 0) {
        throw new BadRequestException("Revele ao menos uma célula antes de retirar");
      }

      const minesCount = state.minePositions.length;
      const multiplier = payoutMultiplier(minesCount, state.revealedCells.length);
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const round = await tx.gameRound.findUniqueOrThrow({ where: { id: bet.gameRoundId! } });

      return this.settleWin(
        tx,
        bet.id,
        wallet.id,
        bet.stakeAmount.toNumber(),
        multiplier,
        state,
        round,
        minesCount,
      );
    });
  }

  private async settleWin(
    tx: Prisma.TransactionClient,
    betId: string,
    walletId: string,
    stakeAmount: number,
    multiplier: number,
    state: MinesBetState,
    round: { id: string; serverSeedHash: string },
    minesCount: number,
  ): Promise<MinesGameStateDto> {
    const payoutAmount = round2(stakeAmount * multiplier);

    await tx.bet.update({
      where: { id: betId },
      data: {
        status: "WON",
        payoutAmount,
        multiplier,
        settledAt: new Date(),
        state: state as unknown as object,
      },
    });
    await tx.settlement.create({ data: { betId, outcome: "WON", payoutAmount } });
    await tx.gameRound.update({ where: { id: round.id }, data: { status: "SETTLED", endedAt: new Date() } });
    await tx.gameResult.create({
      data: {
        gameRoundId: round.id,
        outcome: { minePositions: state.minePositions, revealedCells: state.revealedCells } as unknown as Prisma.InputJsonValue,
      },
    });
    await this.ledger.applyMovement(tx, {
      walletId,
      type: "WIN",
      amount: payoutAmount,
      blockedDelta: -stakeAmount,
      realDelta: payoutAmount,
      description: "Prêmio — Mines",
      referenceType: "bet",
      referenceId: betId,
    });

    const finalWallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });

    return {
      betId,
      roundId: round.id,
      minesCount,
      gridSize: GRID_SIZE,
      revealedCells: state.revealedCells,
      status: "WON",
      currentMultiplier: multiplier.toFixed(4),
      potentialPayout: payoutAmount.toFixed(2),
      minePositions: state.minePositions,
      payoutAmount: payoutAmount.toFixed(2),
      wallet: toWalletBalance(finalWallet),
      serverSeedHash: round.serverSeedHash,
    };
  }

  private async settleLoss(
    tx: Prisma.TransactionClient,
    betId: string,
    walletId: string,
    stakeAmount: number,
    state: MinesBetState,
    round: { id: string; serverSeedHash: string },
    minesCount: number,
  ): Promise<MinesGameStateDto> {
    await tx.bet.update({
      where: { id: betId },
      data: { status: "LOST", payoutAmount: 0, multiplier: 0, settledAt: new Date(), state: state as unknown as object },
    });
    await tx.settlement.create({ data: { betId, outcome: "LOST", payoutAmount: 0 } });
    await tx.gameRound.update({ where: { id: round.id }, data: { status: "SETTLED", endedAt: new Date() } });
    await tx.gameResult.create({
      data: {
        gameRoundId: round.id,
        outcome: { minePositions: state.minePositions, revealedCells: state.revealedCells } as unknown as Prisma.InputJsonValue,
      },
    });
    await this.ledger.applyMovement(tx, {
      walletId,
      type: "LOSS",
      amount: 0,
      blockedDelta: -stakeAmount,
      description: "Resultado — Mines",
      referenceType: "bet",
      referenceId: betId,
    });

    const finalWallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });

    return {
      betId,
      roundId: round.id,
      minesCount,
      gridSize: GRID_SIZE,
      revealedCells: state.revealedCells,
      status: "LOST",
      currentMultiplier: "0.0000",
      potentialPayout: "0.00",
      minePositions: state.minePositions,
      payoutAmount: "0.00",
      wallet: toWalletBalance(finalWallet),
      serverSeedHash: round.serverSeedHash,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
