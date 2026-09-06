import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { LedgerModule } from "./ledger/ledger.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { WalletModule } from "./wallet/wallet.module";
import { BonusesModule } from "./bonuses/bonuses.module";
import { GamesModule } from "./games/games.module";
import { BettingModule } from "./betting/betting.module";
import { PaymentsModule } from "./payments/payments.module";
import { MinesModule } from "./mines/mines.module";
import { BlackjackModule } from "./blackjack/blackjack.module";
import { NotificationsModule } from "./notifications/notifications.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LedgerModule,
    AuthModule,
    UsersModule,
    WalletModule,
    BonusesModule,
    GamesModule,
    BettingModule,
    PaymentsModule,
    MinesModule,
    BlackjackModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
