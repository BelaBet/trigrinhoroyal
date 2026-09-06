import { Module } from "@nestjs/common";
import { BonusesService } from "./bonuses.service";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [LedgerModule],
  providers: [BonusesService],
  exports: [BonusesService],
})
export class BonusesModule {}
