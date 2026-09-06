import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "@bet-platform/shared";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
