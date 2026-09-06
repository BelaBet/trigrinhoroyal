import { IsInt, IsNumber, Max, Min } from "class-validator";

export class StartMinesDto {
  @IsNumber()
  @Min(0.01)
  stakeAmount!: number;

  @IsInt()
  @Min(1)
  @Max(24)
  minesCount!: number;
}
