import { IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";
import type { GameSlug } from "@bet-platform/shared";

export class PlaceBetDto {
  @IsString()
  gameSlug!: GameSlug;

  @IsNumber()
  @Min(0.01)
  stakeAmount!: number;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
