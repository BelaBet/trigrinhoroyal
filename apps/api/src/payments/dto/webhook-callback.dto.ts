import { IsIn, IsString } from "class-validator";

export class WebhookCallbackDto {
  @IsString()
  orderId!: string;

  @IsIn(["paid", "payment_failed", "refunded"])
  status!: "paid" | "payment_failed" | "refunded";
}
