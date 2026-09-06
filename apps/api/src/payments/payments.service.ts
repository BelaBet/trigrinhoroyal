import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { LedgerService } from "../ledger/ledger.service";

interface CheckoutResponse {
  orderId: string;
  status: string;
  chargeStatus: string | null;
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  legs: Array<{ recipientId: string; amount: number; role: "producer" | "coproducer" | "affiliate" }>;
}

interface DepositSplitMeta {
  platformFeeCents: number;
  netAmountCents: number;
  legs: CheckoutResponse["legs"];
  affiliateId: string | null;
}

/**
 * Depósito real via PIX, usando o @bet-platform/payments (vendorizado de
 * BelaBet/vc — split Stone/Pagar.me no modelo Hotmart). O crédito na
 * carteira só acontece em confirmDeposit(), chamado pelo webhook do
 * payments service — nunca na resposta síncrona do checkout (PIX confirma
 * de forma assíncrona).
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  async createPixDeposit(userId: string, amountReais: number): Promise<{ orderId: string; status: string }> {
    const producerRecipientId = this.config.get<string>("BETCORE_PRODUCER_RECIPIENT_ID");
    if (!producerRecipientId) {
      throw new BadRequestException(
        "Pagamento real não configurado (BETCORE_PRODUCER_RECIPIENT_ID ausente) — use o depósito de teste em /wallet/deposit.",
      );
    }

    const referral = await this.prisma.referral.findUnique({
      where: { referredUserId: userId },
      include: { affiliate: true },
    });
    const affiliate =
      referral?.affiliate?.pagarmeRecipientId && referral.affiliate.status === "active"
        ? referral.affiliate
        : null;

    const paymentsUrl = this.config.get<string>("PAYMENTS_SERVICE_URL", "http://localhost:3334");
    const res = await fetch(`${paymentsUrl}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grossAmountCents: Math.round(amountReais * 100),
        installments: 1,
        paymentMethod: "pix",
        producerRecipientId,
        ...(affiliate
          ? {
              affiliateRecipientId: affiliate.pagarmeRecipientId,
              affiliatePercentage: affiliate.commissionRate.toNumber(),
            }
          : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: undefined }));
      throw new BadRequestException(body.error ?? "Não foi possível iniciar o pagamento PIX");
    }
    const checkout: CheckoutResponse = await res.json();

    const splitMeta: DepositSplitMeta = {
      platformFeeCents: checkout.platformFeeCents,
      netAmountCents: checkout.netAmountCents,
      legs: checkout.legs,
      affiliateId: affiliate?.id ?? null,
    };

    await this.prisma.deposit.create({
      data: {
        userId,
        amount: amountReais,
        status: "PENDING",
        externalRef: checkout.orderId,
        splitMeta: splitMeta as unknown as object,
      },
    });

    return { orderId: checkout.orderId, status: checkout.status };
  }

  /** Chamado pelo apps/payments quando o webhook do Pagar.me confirma o pedido. */
  async confirmDeposit(orderId: string, status: "paid" | "payment_failed" | "refunded"): Promise<void> {
    const deposit = await this.prisma.deposit.findFirst({ where: { externalRef: orderId } });
    if (!deposit) {
      throw new NotFoundException("Depósito não encontrado para esse pedido");
    }
    if (deposit.status !== "PENDING") return; // idempotência — evento repetido

    if (status !== "paid") {
      await this.prisma.deposit.update({
        where: { id: deposit.id },
        data: { status: status === "refunded" ? "CANCELLED" : "FAILED" },
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: "CONFIRMED", confirmedAt: new Date() },
      });

      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: deposit.userId } });
      await this.ledger.applyMovement(tx, {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: deposit.amount.toNumber(),
        realDelta: deposit.amount.toNumber(),
        description: "Depósito via PIX",
        referenceType: "deposit",
        referenceId: deposit.id,
      });

      const meta = deposit.splitMeta as unknown as DepositSplitMeta | null;
      const affiliateLeg = meta?.legs?.find((leg) => leg.role === "affiliate");
      if (meta?.affiliateId && affiliateLeg) {
        await tx.commission.create({
          data: {
            affiliateId: meta.affiliateId,
            amount: affiliateLeg.amount / 100,
            status: "paid",
          },
        });
      }
    });
  }
}
