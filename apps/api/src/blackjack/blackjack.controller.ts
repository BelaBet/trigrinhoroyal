import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { BlackjackService } from "./blackjack.service";
import { StartBlackjackDto } from "./dto/start-blackjack.dto";
import type { AuthUser } from "@bet-platform/shared";

@UseGuards(JwtAuthGuard)
@Controller("games/blackjack")
export class BlackjackController {
  constructor(private readonly blackjack: BlackjackService) {}

  @Post("start")
  start(@CurrentUser() user: AuthUser, @Body() dto: StartBlackjackDto) {
    return this.blackjack.start(user.id, dto.stakeAmount);
  }

  @Post(":betId/hit")
  hit(@CurrentUser() user: AuthUser, @Param("betId") betId: string) {
    return this.blackjack.hit(user.id, betId);
  }

  @Post(":betId/double")
  double(@CurrentUser() user: AuthUser, @Param("betId") betId: string) {
    return this.blackjack.double(user.id, betId);
  }

  @Post(":betId/stand")
  stand(@CurrentUser() user: AuthUser, @Param("betId") betId: string) {
    return this.blackjack.stand(user.id, betId);
  }
}
