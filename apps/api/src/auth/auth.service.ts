import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { BonusesService } from "../bonuses/bonuses.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { User } from "@bet-platform/database";
import type { AuthSession, LoginInput, SignUpInput } from "@bet-platform/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly bonuses: BonusesService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Cadastro simples: nome + e-mail + senha. Sem KYC neste MVP. */
  async signup(input: SignUpInput): Promise<AuthSession> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException("Este e-mail já está cadastrado");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, passwordHash },
      });
      await tx.userProfile.create({ data: { userId: created.id } });
      await tx.wallet.create({ data: { userId: created.id } });
      return created;
    });

    const userBonus = await this.bonuses.grantWelcomeBonus(user.id);
    if (userBonus) {
      await this.notifications.create(user.id, {
        type: "BONUS_GRANTED",
        title: "Bônus de boas-vindas creditado!",
        body: `R$ ${userBonus.amountGranted.toFixed(2)} já estão na sua carteira — boa sorte.`,
      });
    }

    return this.buildSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("E-mail ou senha inválidos");
    }
    return this.buildSession(user);
  }

  private buildSession(user: User): AuthSession {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      user: { id: user.id, name: user.name, email: user.email },
      accessToken,
    };
  }
}
