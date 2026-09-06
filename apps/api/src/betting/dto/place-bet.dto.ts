import { IsIn, IsNumber, IsObject, IsOptional, Min } from "class-validator";
import type { GameSlug } from "@bet-platform/shared";

export class PlaceBetDto {
  @IsIn(["crash", "mines", "plinko", "roulette"])
  gameSlug!: GameSlug;

  @IsNumber()
  @Min(0.01)
  stakeAmount!: number;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
