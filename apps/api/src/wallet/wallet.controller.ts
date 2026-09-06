import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { WalletService } from "./wallet.service";
import { DepositDto } from "./dto/deposit.dto";
import type { AuthUser } from "@bet-platform/shared";

@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  getBalance(@CurrentUser() user: AuthUser) {
    return this.wallet.getBalance(user.id);
  }

  @Get("ledger")
  getLedger(@CurrentUser() user: AuthUser, @Query("limit") limit?: string) {
    return this.wallet.getLedger(user.id, limit ? Number(limit) : undefined);
  }

  @Post("deposit")
  deposit(@CurrentUser() user: AuthUser, @Body() dto: DepositDto) {
    return this.wallet.mockDeposit(user.id, dto.amount);
  }
}
