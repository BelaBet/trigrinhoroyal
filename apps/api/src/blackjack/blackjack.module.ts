import { Module } from "@nestjs/common";
import { BlackjackService } from "./blackjack.service";
import { BlackjackController } from "./blackjack.controller";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [LedgerModule],
  providers: [BlackjackService],
  controllers: [BlackjackController],
})
export class BlackjackModule {}
