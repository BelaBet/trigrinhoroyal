import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";
import { toWalletBalance } from "./wallet.mapper";
import type { LedgerEntryDto, WalletBalance } from "@bet-platform/shared";

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async getBalance(userId: string): Promise<WalletBalance> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId } });
    return toWalletBalance(wallet);
  }

  async getLedger(userId: string, limit = 20): Promise<LedgerEntryDto[]> {
    const wallet = await this.prisma.wallet.findUniqueOrThrow({ where: { userId } });
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      type: entry.type,
      amount: entry.amount.toFixed(2),
      description: entry.description,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  /**
   * Depósito simulado — sem gateway de pagamento real neste MVP de testes.
   * Confirma instantaneamente e credita o saldo real via Ledger.
   */
  async mockDeposit(userId: string, amount: number): Promise<WalletBalance> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });

      const deposit = await tx.deposit.create({
        data: { userId, amount, status: "CONFIRMED", confirmedAt: new Date() },
      });

      const updated = await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount,
        realDelta: amount,
        description: "Depósito (ambiente de teste)",
        referenceType: "deposit",
        referenceId: deposit.id,
      });

      return toWalletBalance(updated);
    });
  }
}
