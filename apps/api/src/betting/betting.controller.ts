import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { BettingService } from "./betting.service";
import { PlaceBetDto } from "./dto/place-bet.dto";
import type { AuthUser } from "@bet-platform/shared";

@UseGuards(JwtAuthGuard)
@Controller("bets")
export class BettingController {
  constructor(private readonly betting: BettingService) {}

  @Post()
  place(@CurrentUser() user: AuthUser, @Body() dto: PlaceBetDto) {
    return this.betting.placeBet(user.id, dto);
  }

  @Get("me")
  mine(@CurrentUser() user: AuthUser) {
    return this.betting.listMyBets(user.id);
  }
}
