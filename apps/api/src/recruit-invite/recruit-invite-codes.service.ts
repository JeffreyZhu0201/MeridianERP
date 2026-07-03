import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EnvService } from '../config/env.service';
import { PrismaService } from '../prisma/prisma.service';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

@Injectable()
export class RecruitInviteCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly env: EnvService,
  ) {}

  storeInviteBaseUrl(): string {
    return this.env.get('STORE_APP_URL') ?? 'http://localhost:3003';
  }

  inviteUrl(code: string): string {
    return `${this.storeInviteBaseUrl()}/open-shop?invite=${code}`;
  }

  toInviteRow(invite: {
    id: string;
    code: string;
    distributorId: string;
    expiresAt: Date | null;
    revokedAt: Date | null;
    useCount: number;
    createdAt?: Date;
  }) {
    return {
      id: invite.id,
      code: invite.code,
      distributorId: invite.distributorId,
      expiresAt: invite.expiresAt?.toISOString() ?? null,
      revokedAt: invite.revokedAt?.toISOString() ?? null,
      useCount: invite.useCount,
      url: this.inviteUrl(invite.code),
      createdAt: invite.createdAt?.toISOString() ?? null,
    };
  }

  async listInviteCodes(distributorId: string) {
    const invites = await this.prisma.merchantRecruitInviteCode.findMany({
      where: { distributorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return invites.map((inv) => this.toInviteRow(inv));
  }

  async createInviteCode(distributorId: string, expiresInDays?: number) {
    for (let i = 0; i < 10; i++) {
      const code = generateInviteCode();
      try {
        const invite = await this.prisma.merchantRecruitInviteCode.create({
          data: {
            code,
            distributorId,
            expiresAt: expiresInDays
              ? new Date(Date.now() + expiresInDays * 86400000)
              : null,
          },
        });
        return this.toInviteRow(invite);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          continue;
        }
        throw err;
      }
    }
    throw new ConflictException('Could not generate invite code');
  }

  async revokeInviteCode(distributorId: string, codeId: string) {
    const invite = await this.prisma.merchantRecruitInviteCode.findFirst({
      where: { id: codeId, distributorId },
    });
    if (!invite) throw new NotFoundException('Invite code not found');
    if (invite.revokedAt) {
      throw new BadRequestException('Invite code already revoked');
    }
    const updated = await this.prisma.merchantRecruitInviteCode.update({
      where: { id: codeId },
      data: { revokedAt: new Date() },
    });
    return this.toInviteRow(updated);
  }
}
