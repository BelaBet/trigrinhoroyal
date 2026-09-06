import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthUser } from "@bet-platform/shared";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
