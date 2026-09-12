import { PrismaClient, GameType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@betcore.app";
const DEMO_PASSWORD = "Demo@1234";
const DEMO_BALANCE = 500;

async function main() {
  const originals = await prisma.gameProvider.upsert({
    where: { slug: "betcore-originals" },
    update: {},
    create: {
      name: "BetCore Originals",
      slug: "betcore-originals",
      status: "ACTIVE",
    },
  });

  const games: Array<{
    name: string;
    slug: string;
    type: GameType;
    rtp: number;
    minBet: number;
    maxBet: number;
  }> = [
    { name: "Crash", slug: "crash", type: "CRASH", rtp: 97.0, minBet: 1, maxBet: 500 },
    { name: "Mines", slug: "mines", type: "MINES", rtp: 96.5, minBet: 1, maxBet: 500 },
    { name: "Plinko", slug: "plinko", type: "PLINKO", rtp: 96.0, minBet: 1, maxBet: 500 },
    { name: "Roulette", slug: "roulette", type: "ROULETTE", rtp: 97.3, minBet: 1, maxBet: 1000 },
    { name: "Fortune Cat", slug: "fortune-cat", type: "SLOTS", rtp: 96.2, minBet: 0.5, maxBet: 200 },
    { name: "Golden Reels", slug: "golden-reels", type: "SLOTS", rtp: 95.8, minBet: 0.5, maxBet: 200 },
    { name: "Blackjack", slug: "blackjack", type: "BLACKJACK", rtp: 99.5, minBet: 1, maxBet: 500 },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: {
        providerId: originals.id,
        name: game.name,
        slug: game.slug,
        type: game.type,
        rtp: game.rtp,
        minBet: game.minBet,
        maxBet: game.maxBet,
        status: "ACTIVE",
      },
    });
  }

  await prisma.bonusCampaign.upsert({
    where: { id: "welcome-bonus-seed" },
    update: {},
    create: {
      id: "welcome-bonus-seed",
      name: "Bônus de Boas-vindas",
      type: "SIGNUP",
      amount: 50,
      status: "ACTIVE",
      expirationDays: 7,
    },
  });

  const existingDemo = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!existingDemo) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const demoUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: "Jogador Demo", email: DEMO_EMAIL, passwordHash },
      });
      await tx.userProfile.create({ data: { userId: created.id } });
      const wallet = await tx.wallet.create({
        data: { userId: created.id, realBalance: DEMO_BALANCE },
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_ADJUSTMENT",
          amount: DEMO_BALANCE,
          description: "Saldo inicial de demonstração",
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "ADMIN_ADJUSTMENT",
          amount: DEMO_BALANCE,
          balanceAfterReal: DEMO_BALANCE,
          balanceAfterBlocked: 0,
          balanceAfterBonus: 0,
          referenceType: "seed",
        },
      });
      return created;
    });
    console.log(`Usuário demo criado: ${demoUser.email}`);
  }

  console.log("Seed concluído: provedor, catálogo de jogos, bônus de boas-vindas e conta demo.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
