import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { GameSlug, GameSummaryDto } from "@bet-platform/shared";

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive(): Promise<GameSummaryDto[]> {
    const games = await this.prisma.game.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    return games.map((game) => ({
      id: game.id,
      slug: game.slug as GameSlug,
      name: game.name,
      type: game.type,
      rtp: game.rtp.toFixed(2),
      minBet: game.minBet.toFixed(2),
      maxBet: game.maxBet.toFixed(2),
      status: game.status,
    }));
  }
}
