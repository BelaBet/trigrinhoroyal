import { Body, Controller, Headers, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PaymentsService } from "./payments.service";
import { PixDepositDto } from "./dto/pix-deposit.dto";
import { WebhookCallbackDto } from "./dto/webhook-callback.dto";
import type { AuthUser } from "@bet-platform/shared";

@Controller()
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("wallet/deposit/pix")
  createPixDeposit(@CurrentUser() user: AuthUser, @Body() dto: PixDepositDto) {
    return this.payments.createPixDeposit(user.id, dto.amount);
  }

  /** Chamado pelo apps/payments (server-to-server) — nunca pelo navegador do jogador. */
  @Post("payments/webhook")
  handleWebhook(@Headers("x-internal-secret") secret: string, @Body() dto: WebhookCallbackDto) {
    const expected = this.config.get<string>("BETCORE_INTERNAL_SECRET", "");
    if (!expected || secret !== expected) {
      throw new UnauthorizedException("Segredo interno inválido");
    }
    return this.payments.confirmDeposit(dto.orderId, dto.status);
  }
}
