import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { MinesService } from "./mines.service";
import { StartMinesDto } from "./dto/start-mines.dto";
import { RevealMinesDto } from "./dto/reveal-mines.dto";
import type { AuthUser } from "@bet-platform/shared";

@UseGuards(JwtAuthGuard)
@Controller("games/mines")
export class MinesController {
  constructor(private readonly mines: MinesService) {}

  @Post("start")
  start(@CurrentUser() user: AuthUser, @Body() dto: StartMinesDto) {
    return this.mines.start(user.id, dto.stakeAmount, dto.minesCount);
  }

  @Post(":betId/reveal")
  reveal(@CurrentUser() user: AuthUser, @Param("betId") betId: string, @Body() dto: RevealMinesDto) {
    return this.mines.reveal(user.id, betId, dto.cellIndex);
  }

  @Post(":betId/cashout")
  cashout(@CurrentUser() user: AuthUser, @Param("betId") betId: string) {
    return this.mines.cashout(user.id, betId);
  }
}
