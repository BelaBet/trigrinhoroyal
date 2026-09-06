import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, Wallet } from "@bet-platform/database";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { toWalletBalance } from "../wallet/wallet.mapper";
import { generateServerSeed, hashServerSeed } from "@bet-platform/shared";
import {
  computeHandValue,
  dealerShouldHit,
  isBlackjack,
  isBust,
  resolveBlackjackRound,
  settleHand,
  type Card,
} from "@bet-platform/game-engine-blackjack";
import type { BlackjackGameStateDto } from "@bet-platform/shared";

interface BlackjackState {
  deck: Card[];
  playerCards: Card[];
  dealerCards: Card[];
  stake: number;
}

type SettledStatus = "WON" | "LOST" | "PUSH";
type BjStatus = "PENDING" | SettledStatus;

/**
 * Blackjack — baralho embaralhado no start(), depois hit/double/stand vão
 * mutando Bet.state até a mão fechar. Sem split nesta versão.
 */
@Injectable()
export class BlackjackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async start(userId: string, stakeAmount: number): Promise<BlackjackGameStateDto> {
    const game = await this.prisma.game.findUnique({ where: { slug: "blackjack" } });
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
      await this.blockStake(tx, wallet, stakeAmount, "Aposta em Blackjack", game.id);

      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = "betcore";
      const lastRound = await tx.gameRound.findFirst({
        where: { gameId: game.id },
        orderBy: { roundNumber: "desc" },
      });
      const roundNumber = (lastRound?.roundNumber ?? 0n) + 1n;

      const { deck } = resolveBlackjackRound({ serverSeed, clientSeed, nonce: Number(roundNumber) });
      const playerCards = [deck[0], deck[1]];
      const dealerCards = [deck[2], deck[3]];

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

      const state: BlackjackState = { deck: deck.slice(4), playerCards, dealerCards, stake: stakeAmount };
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

      if (isBlackjack(playerCards) || isBlackjack(dealerCards)) {
        return this.settle(tx, bet.id, wallet.id, round, state);
      }

      await tx.bet.update({ where: { id: bet.id }, data: { state: state as unknown as object } });
      return this.toDto(bet.id, round.id, state, "PENDING", round.serverSeedHash);
    });
  }

  async hit(userId: string, betId: string): Promise<BlackjackGameStateDto> {
    return this.prisma.$transaction(async (tx) => {
      const { bet, state, round } = await this.loadPendingBet(tx, userId, betId);
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

      const card = state.deck.shift();
      if (!card) throw new BadRequestException("Baralho esgotado");
      state.playerCards.push(card);

      if (isBust(state.playerCards)) {
        return this.settle(tx, bet.id, wallet.id, round, state);
      }

      await tx.bet.update({ where: { id: bet.id }, data: { state: state as unknown as object } });
      return this.toDto(bet.id, round.id, state, "PENDING", round.serverSeedHash);
    });
  }

  async double(userId: string, betId: string): Promise<BlackjackGameStateDto> {
    return this.prisma.$transaction(async (tx) => {
      const { bet, state, round } = await this.loadPendingBet(tx, userId, betId);
      if (state.playerCards.length !== 2) {
        throw new BadRequestException("Só pode dobrar na primeira ação da mão");
      }

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      await this.blockStake(tx, wallet, state.stake, "Dobrar — Blackjack", bet.gameId);
      state.stake *= 2;

      const card = state.deck.shift();
      if (!card) throw new BadRequestException("Baralho esgotado");
      state.playerCards.push(card);

      if (isBust(state.playerCards)) {
        return this.settle(tx, bet.id, wallet.id, round, state);
      }
      return this.playDealerAndSettle(tx, bet.id, wallet.id, round, state);
    });
  }

  async stand(userId: string, betId: string): Promise<BlackjackGameStateDto> {
    return this.prisma.$transaction(async (tx) => {
      const { bet, state, round } = await this.loadPendingBet(tx, userId, betId);
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      return this.playDealerAndSettle(tx, bet.id, wallet.id, round, state);
    });
  }

  private async blockStake(
    tx: Prisma.TransactionClient,
    wallet: Wallet,
    stake: number,
    description: string,
    gameId: string,
  ) {
    const bonusAvailable = wallet.bonusBalance.toNumber();
    const realAvailable = wallet.realBalance.toNumber();
    if (stake > bonusAvailable + realAvailable) {
      throw new BadRequestException("Saldo insuficiente para essa ação");
    }
    const useBonus = bonusAvailable >= stake;
    await this.ledger.applyMovement(tx, {
      walletId: wallet.id,
      type: "BET",
      amount: -stake,
      bonusDelta: useBonus ? -stake : 0,
      realDelta: useBonus ? 0 : -stake,
      blockedDelta: stake,
      description,
      referenceType: "game",
      referenceId: gameId,
    });
  }

  private async loadPendingBet(tx: Prisma.TransactionClient, userId: string, betId: string) {
    const bet = await tx.bet.findUnique({ where: { id: betId }, include: { game: true } });
    if (!bet || bet.userId !== userId || bet.game.slug !== "blackjack") {
      throw new NotFoundException("Aposta não encontrada");
    }
    if (bet.status !== "PENDING") {
      throw new BadRequestException("Essa rodada já foi encerrada");
    }
    const round = await tx.gameRound.findUniqueOrThrow({ where: { id: bet.gameRoundId! } });
    return { bet, state: bet.state as unknown as BlackjackState, round };
  }

  private async playDealerAndSettle(
    tx: Prisma.TransactionClient,
    betId: string,
    walletId: string,
    round: { id: string; serverSeedHash: string },
    state: BlackjackState,
  ): Promise<BlackjackGameStateDto> {
    while (dealerShouldHit(state.dealerCards)) {
      const card = state.deck.shift();
      if (!card) break;
      state.dealerCards.push(card);
    }
    return this.settle(tx, betId, walletId, round, state);
  }

  private async settle(
    tx: Prisma.TransactionClient,
    betId: string,
    walletId: string,
    round: { id: string; serverSeedHash: string },
    state: BlackjackState,
  ): Promise<BlackjackGameStateDto> {
    const result = settleHand({ playerCards: state.playerCards, dealerCards: state.dealerCards });
    const payoutAmount = round2(state.stake * result.multiplier);
    const status: SettledStatus = result.outcome === "PUSH" ? "PUSH" : result.outcome === "LOSS" ? "LOST" : "WON";

    await tx.bet.update({
      where: { id: betId },
      data: {
        status,
        payoutAmount,
        multiplier: result.multiplier,
        settledAt: new Date(),
        stakeAmount: state.stake,
        state: state as unknown as object,
      },
    });
    await tx.settlement.create({ data: { betId, outcome: status, payoutAmount } });
    await tx.gameRound.update({ where: { id: round.id }, data: { status: "SETTLED", endedAt: new Date() } });
    await tx.gameResult.create({
      data: {
        gameRoundId: round.id,
        outcome: {
          playerCards: state.playerCards,
          dealerCards: state.dealerCards,
          result: result.outcome,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    await this.ledger.applyMovement(tx, {
      walletId,
      type: status === "WON" ? "WIN" : status === "PUSH" ? "REFUND" : "LOSS",
      amount: payoutAmount,
      blockedDelta: -state.stake,
      realDelta: payoutAmount,
      description:
        status === "WON" ? "Prêmio — Blackjack" : status === "PUSH" ? "Empate — Blackjack" : "Resultado — Blackjack",
      referenceType: "bet",
      referenceId: betId,
    });

    const finalWallet = await tx.wallet.findUniqueOrThrow({ where: { id: walletId } });
    return this.toDto(betId, round.id, state, status, round.serverSeedHash, payoutAmount, finalWallet);
  }

  private toDto(
    betId: string,
    roundId: string,
    state: BlackjackState,
    status: BjStatus,
    serverSeedHash: string,
    payoutAmount?: number,
    wallet?: Wallet,
  ): BlackjackGameStateDto {
    const resolved = status !== "PENDING";
    const dealerCards = resolved ? state.dealerCards : state.dealerCards.slice(0, 1);
    return {
      betId,
      roundId,
      stakeAmount: state.stake.toFixed(2),
      playerCards: state.playerCards,
      playerTotal: computeHandValue(state.playerCards).total,
      dealerCards,
      dealerTotal: resolved ? computeHandValue(state.dealerCards).total : null,
      status,
      canHit: !resolved,
      canDouble: !resolved && state.playerCards.length === 2,
      payoutAmount: payoutAmount !== undefined ? payoutAmount.toFixed(2) : undefined,
      wallet: wallet ? toWalletBalance(wallet) : undefined,
      serverSeedHash,
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
