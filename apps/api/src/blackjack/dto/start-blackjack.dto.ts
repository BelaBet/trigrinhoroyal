import { IsNumber, Min } from "class-validator";

export class StartBlackjackDto {
  @IsNumber()
  @Min(0.01)
  stakeAmount!: number;
}
