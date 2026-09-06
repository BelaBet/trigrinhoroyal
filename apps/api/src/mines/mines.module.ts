import { Module } from "@nestjs/common";
import { MinesService } from "./mines.service";
import { MinesController } from "./mines.controller";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [LedgerModule],
  providers: [MinesService],
  controllers: [MinesController],
})
export class MinesModule {}
