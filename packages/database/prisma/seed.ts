import { PrismaClient, GameType } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log("Seed concluído: provedor, catálogo de jogos e bônus de boas-vindas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
