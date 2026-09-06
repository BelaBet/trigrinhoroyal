import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { GameType, Prisma } from "@bet-platform/database";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { toWalletBalance } from "../wallet/wallet.mapper";
import { generateServerSeed, hashServerSeed } from "@bet-platform/shared";
import type { BetHistoryDto, BetResultDto, GameSlug, PlaceBetInput } from "@bet-platform/shared";
import { resolveCrashRound, settleCrashBet } from "@bet-platform/game-engine-crash";
import { resolveMinesRound, settleMinesBet } from "@bet-platform/game-engine-mines";
import { resolvePlinkoRound, settlePlinkoBet } from "@bet-platform/game-engine-plinko";
import type { RiskLevel } from "@bet-platform/game-engine-plinko";
import { resolveRouletteRound, settleRouletteBet } from "@bet-platform/game-engine-roulette";
import type { RouletteBetType } from "@bet-platform/game-engine-roulette";
import { resolveSlotsRound, settleSlotsBet } from "@bet-platform/game-engine-slots";

interface EngineOutcome {
  outcome: Record<string, unknown>;
  won: boolean;
  payoutAmount: number;
  multiplier: number | null;
}

/**
 * Fluxo de uma aposta (ver seção 8 da arquitetura):
 * valida -> bloqueia saldo -> game engine -> resultado -> settlement -> ledger -> wallet.
 * Tudo dentro de uma única transação de banco: ou tudo acontece, ou nada acontece.
 */
@Injectable()
export class BettingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async placeBet(userId: string, input: PlaceBetInput): Promise<BetResultDto> {
    const game = await this.prisma.game.findUnique({ where: { slug: input.gameSlug } });
    if (!game || game.status !== "ACTIVE") {
      throw new NotFoundException("Jogo indisponível");
    }

    const stake = input.stakeAmount;
    const minBet = game.minBet.toNumber();
    const maxBet = game.maxBet.toNumber();
    if (stake < minBet || stake > maxBet) {
      throw new BadRequestException(
        `Aposta deve estar entre R$${minBet.toFixed(2)} e R$${maxBet.toFixed(2)}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const bonusAvailable = wallet.bonusBalance.toNumber();
      const realAvailable = wallet.realBalance.toNumber();
      if (stake > bonusAvailable + realAvailable) {
        throw new BadRequestException("Saldo insuficiente para essa aposta");
      }
      const useBonus = bonusAvailable >= stake;

      // 1. bloqueia saldo
      await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: "BET",
        amount: -stake,
        bonusDelta: useBonus ? -stake : 0,
        realDelta: useBonus ? 0 : -stake,
        blockedDelta: stake,
        description: `Aposta em ${game.name}`,
        referenceType: "game",
        referenceId: game.id,
      });

      // 2. game engine resolve a rodada (provably fair)
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = "betcore";
      const lastRound = await tx.gameRound.findFirst({
        where: { gameId: game.id },
        orderBy: { roundNumber: "desc" },
      });
      const roundNumber = (lastRound?.roundNumber ?? 0n) + 1n;

      const engineResult = this.resolveGameOutcome(game.type, {
        serverSeed,
        clientSeed,
        nonce: Number(roundNumber),
        stakeAmount: stake,
        params: input.params ?? {},
      });

      const round = await tx.gameRound.create({
        data: {
          gameId: game.id,
          roundNumber,
          serverSeed,
          serverSeedHash,
          clientSeed,
          nonce: Number(roundNumber),
          status: "SETTLED",
          endedAt: new Date(),
        },
      });
      await tx.gameResult.create({
        data: { gameRoundId: round.id, outcome: engineResult.outcome as Prisma.InputJsonValue },
      });

      // 3. registra aposta + settlement
      const bet = await tx.bet.create({
        data: {
          userId,
          gameId: game.id,
          gameRoundId: round.id,
          stakeAmount: stake,
          status: engineResult.won ? "WON" : "LOST",
          multiplier: engineResult.multiplier,
          payoutAmount: engineResult.payoutAmount,
          settledAt: new Date(),
        },
      });
      await tx.settlement.create({
        data: {
          betId: bet.id,
          outcome: engineResult.won ? "WON" : "LOST",
          payoutAmount: engineResult.payoutAmount,
        },
      });

      // 4. libera bloqueio e credita o payout — mesmo quando "LOST" o Plinko
      // pode devolver uma fração da aposta (bucket com multiplicador <1x);
      // payoutAmount já vem 0 dos demais engines numa derrota real.
      await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: engineResult.won ? "WIN" : "LOSS",
        amount: engineResult.payoutAmount,
        blockedDelta: -stake,
        realDelta: engineResult.payoutAmount,
        description: engineResult.won ? `Prêmio — ${game.name}` : `Resultado — ${game.name}`,
        referenceType: "bet",
        referenceId: bet.id,
      });

      const finalWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

      return {
        betId: bet.id,
        status: engineResult.won ? "WON" : "LOST",
        stakeAmount: stake.toFixed(2),
        payoutAmount: engineResult.payoutAmount.toFixed(2),
        multiplier: engineResult.multiplier !== null ? engineResult.multiplier.toFixed(4) : null,
        wallet: toWalletBalance(finalWallet),
        roundId: round.id,
        serverSeedHash,
        outcome: engineResult.outcome,
      };
    });
  }

  async listMyBets(userId: string, limit = 30): Promise<BetHistoryDto[]> {
    const bets = await this.prisma.bet.findMany({
      where: { userId, status: { in: ["WON", "LOST"] } },
      include: { game: true },
      orderBy: { placedAt: "desc" },
      take: limit,
    });

    return bets.map((bet) => ({
      id: bet.id,
      gameSlug: bet.game.slug as GameSlug,
      gameName: bet.game.name,
      stakeAmount: bet.stakeAmount.toFixed(2),
      payoutAmount: (bet.payoutAmount ?? 0).toFixed(2),
      status: bet.status as "WON" | "LOST",
      placedAt: bet.placedAt.toISOString(),
    }));
  }

  private resolveGameOutcome(
    type: GameType,
    ctx: {
      serverSeed: string;
      clientSeed: string;
      nonce: number;
      stakeAmount: number;
      params: Record<string, unknown>;
    },
  ): EngineOutcome {
    switch (type) {
      case "CRASH": {
        const cashoutMultiplier = Number(ctx.params.cashoutMultiplier ?? 1.5);
        const round = resolveCrashRound({
          serverSeed: ctx.serverSeed,
          clientSeed: ctx.clientSeed,
          nonce: ctx.nonce,
        });
        const settle = settleCrashBet({
          crashPoint: round.crashPoint,
          stakeAmount: ctx.stakeAmount,
          cashoutMultiplier,
        });
        return {
          outcome: { crashPoint: round.crashPoint, cashoutMultiplier },
          won: settle.won,
          payoutAmount: settle.payoutAmount,
          multiplier: settle.multiplier,
        };
      }
      case "MINES": {
        const minesCount = Number(ctx.params.minesCount ?? 3);
        const revealedCells = Array.isArray(ctx.params.revealedCells)
          ? (ctx.params.revealedCells as number[])
          : [];
        const round = resolveMinesRound({
          serverSeed: ctx.serverSeed,
          clientSeed: ctx.clientSeed,
          nonce: ctx.nonce,
          minesCount,
        });
        const settle = settleMinesBet({
          minePositions: round.minePositions,
          revealedCells,
          minesCount,
          stakeAmount: ctx.stakeAmount,
        });
        return {
          outcome: { minePositions: round.minePositions, revealedCells },
          won: settle.won,
          payoutAmount: settle.payoutAmount,
          multiplier: settle.multiplier,
        };
      }
      case "PLINKO": {
        const risk = (ctx.params.risk as RiskLevel) ?? "medium";
        const round = resolvePlinkoRound({
          serverSeed: ctx.serverSeed,
          clientSeed: ctx.clientSeed,
          nonce: ctx.nonce,
          risk,
        });
        const settle = settlePlinkoBet({ multiplier: round.multiplier, stakeAmount: ctx.stakeAmount });
        return {
          outcome: { path: round.path, bucketIndex: round.bucketIndex, risk },
          won: settle.won,
          payoutAmount: settle.payoutAmount,
          multiplier: round.multiplier,
        };
      }
      case "ROULETTE": {
        const bet = ctx.params.bet as RouletteBetType;
        const round = resolveRouletteRound({
          serverSeed: ctx.serverSeed,
          clientSeed: ctx.clientSeed,
          nonce: ctx.nonce,
        });
        const settle = settleRouletteBet({ result: round, bet, stakeAmount: ctx.stakeAmount });
        return {
          outcome: { number: round.number, color: round.color, bet },
          won: settle.won,
          payoutAmount: settle.payoutAmount,
          multiplier: settle.multiplier,
        };
      }
      case "SLOTS": {
        const round = resolveSlotsRound({
          serverSeed: ctx.serverSeed,
          clientSeed: ctx.clientSeed,
          nonce: ctx.nonce,
        });
        const settle = settleSlotsBet({ grid: round.grid, stakeAmount: ctx.stakeAmount });
        return {
          outcome: { grid: round.grid, wins: settle.wins },
          won: settle.won,
          payoutAmount: settle.payoutAmount,
          multiplier: settle.multiplier,
        };
      }
      default:
        throw new BadRequestException("Jogo não suportado");
    }
  }
}
