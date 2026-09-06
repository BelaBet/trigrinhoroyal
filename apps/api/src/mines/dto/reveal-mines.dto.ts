import { IsInt, Max, Min } from "class-validator";

export class RevealMinesDto {
  @IsInt()
  @Min(0)
  @Max(24)
  cellIndex!: number;
}
