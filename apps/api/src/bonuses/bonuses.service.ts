import { Injectable } from "@nestjs/common";
import type { UserBonus } from "@bet-platform/database";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";

@Injectable()
export class BonusesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Concede o bônus de boas-vindas ativo (campanha type=SIGNUP) ao usuário
   * recém-cadastrado. O valor e a expiração vêm do Admin (bonus_campaigns),
   * nunca ficam fixos no código.
   */
  async grantWelcomeBonus(userId: string): Promise<UserBonus | null> {
    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.bonusCampaign.findFirst({
        where: { type: "SIGNUP", status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
      if (!campaign) return null;

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
      const amount = campaign.amount.toNumber();
      const expiresAt = new Date(Date.now() + campaign.expirationDays * 24 * 60 * 60 * 1000);

      const userBonus = await tx.userBonus.create({
        data: {
          userId,
          campaignId: campaign.id,
          amountGranted: amount,
          amountRemaining: amount,
          status: "ACTIVE",
          expiresAt,
        },
      });

      await tx.bonusTransaction.create({
        data: { userBonusId: userBonus.id, type: "GRANT", amount },
      });

      await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: "BONUS",
        amount,
        bonusDelta: amount,
        description: `Bônus de boas-vindas — ${campaign.name}`,
        referenceType: "user_bonus",
        referenceId: userBonus.id,
      });

      return userBonus;
    });
  }
}
