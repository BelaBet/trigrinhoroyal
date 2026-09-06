import { Module } from "@nestjs/common";
import { BettingService } from "./betting.service";
import { BettingController } from "./betting.controller";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [LedgerModule],
  providers: [BettingService],
  controllers: [BettingController],
})
export class BettingModule {}
