import { Injectable } from "@nestjs/common";
import { LedgerEntryType, Prisma } from "@bet-platform/database";

export interface ApplyMovementParams {
  walletId: string;
  type: LedgerEntryType;
  /** Valor "de rosto" da movimentação, exibido no extrato (pode ser 0 para uma LOSS sem crédito). */
  amount: number;
  realDelta?: number;
  blockedDelta?: number;
  bonusDelta?: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Única porta de entrada para mexer em saldo. Nenhum outro serviço deve
 * escrever diretamente em Wallet — toda movimentação passa por aqui e
 * sempre gera um LedgerEntry (auditável) + um WalletTransaction (snapshot
 * de saldo pós-operação, usado pelo extrato da Carteira).
 */
@Injectable()
export class LedgerService {
  async applyMovement(tx: Prisma.TransactionClient, params: ApplyMovementParams) {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { id: params.walletId } });

    const realBalance = wallet.realBalance.toNumber() + (params.realDelta ?? 0);
    const blockedBalance = wallet.blockedBalance.toNumber() + (params.blockedDelta ?? 0);
    const bonusBalance = wallet.bonusBalance.toNumber() + (params.bonusDelta ?? 0);

    const EPSILON = 0.005;
    if (realBalance < -EPSILON || blockedBalance < -EPSILON || bonusBalance < -EPSILON) {
      throw new Error("Movimentação deixaria a carteira com saldo negativo");
    }

    const updated = await tx.wallet.update({
      where: { id: params.walletId },
      data: {
        realBalance: round2(Math.max(realBalance, 0)),
        blockedBalance: round2(Math.max(blockedBalance, 0)),
        bonusBalance: round2(Math.max(bonusBalance, 0)),
      },
    });

    await tx.ledgerEntry.create({
      data: {
        walletId: params.walletId,
        type: params.type,
        amount: params.amount,
        description: params.description,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        type: params.type,
        amount: params.amount,
        balanceAfterReal: updated.realBalance,
        balanceAfterBlocked: updated.blockedBalance,
        balanceAfterBonus: updated.bonusBalance,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
      },
    });

    return updated;
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
