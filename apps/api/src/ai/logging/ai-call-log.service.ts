import { Injectable } from '@nestjs/common';
import type {
  AiCallLogItem,
  AiCallLogListQuery,
  AiFeature,
  PaginatedAiCallLogs,
} from '@meridian/shared';
import type {
  AiActorType as PrismaAiActorType,
  AiFeature as PrismaAiFeature,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RecordAiCallInput } from './ai-invocation.types';

@Injectable()
export class AiCallLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAiCallInput): Promise<string> {
    const row = await this.prisma.aiCallLog.create({
      data: {
        feature: input.feature as PrismaAiFeature,
        mode: input.mode,
        status: input.status,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        actorType: input.actorType as PrismaAiActorType | undefined,
        model: input.model,
        latencyMs: input.latencyMs,
        errorMessage: input.errorMessage,
        inputSummary: input.inputSummary,
        outputSummary: input.outputSummary,
      },
      select: { id: true },
    });
    return row.id;
  }

  async listForPlatform(
    query: AiCallLogListQuery,
  ): Promise<PaginatedAiCallLogs> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.AiCallLogWhereInput = {};
    if (query.feature) {
      where.feature = query.feature;
    }
    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.mode) {
      where.mode = query.mode;
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const [rows, total] = await Promise.all([
      this.prisma.aiCallLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tenant: {
            select: {
              merchantProfile: { select: { businessName: true } },
            },
          },
        },
      }),
      this.prisma.aiCallLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toItem(row)),
      total,
      page,
      limit,
    };
  }

  private toItem(
    row: Prisma.AiCallLogGetPayload<{
      include: {
        tenant: {
          select: {
            merchantProfile: { select: { businessName: true } };
          };
        };
      };
    }>,
  ): AiCallLogItem {
    return {
      id: row.id,
      feature: row.feature as AiFeature,
      mode: row.mode,
      status: row.status,
      tenantId: row.tenantId,
      tenantName: row.tenant?.merchantProfile?.businessName ?? null,
      actorUserId: row.actorUserId,
      actorType: row.actorType,
      model: row.model,
      latencyMs: row.latencyMs,
      errorMessage: row.errorMessage,
      inputSummary: row.inputSummary,
      outputSummary: row.outputSummary,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
