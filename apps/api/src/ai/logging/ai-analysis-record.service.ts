import { Injectable } from '@nestjs/common';
import type {
  PaginatedReplenishmentAnalysisHistory,
  ReplenishmentAnalysisHistoryItem,
  ReplenishmentAnalysisResponse,
  ReplenishmentSuggestion,
} from '@meridian/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiAnalysisRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async saveReplenishment(
    tenantId: string,
    userId: string | undefined,
    result: ReplenishmentSuggestion,
    callLogId: string | null,
  ): Promise<ReplenishmentAnalysisResponse> {
    const record = await this.prisma.aiAnalysisRecord.create({
      data: {
        tenantId,
        feature: 'MERCHANT_REPLENISHMENT',
        triggeredByUserId: userId,
        result: result as object,
        callLogId: callLogId ?? undefined,
      },
    });

    return {
      ...result,
      analysisId: record.id,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async getLatestReplenishment(
    tenantId: string,
  ): Promise<ReplenishmentAnalysisResponse | null> {
    const record = await this.prisma.aiAnalysisRecord.findFirst({
      where: {
        tenantId,
        feature: 'MERCHANT_REPLENISHMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return null;
    }

    return this.toResponse(record.id, record.createdAt, record.result);
  }

  async listReplenishmentHistory(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedReplenishmentAnalysisHistory> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where = {
      tenantId,
      feature: 'MERCHANT_REPLENISHMENT' as const,
    };

    const [rows, total] = await Promise.all([
      this.prisma.aiAnalysisRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
      }),
      this.prisma.aiAnalysisRecord.count({ where }),
    ]);

    return {
      items: rows.map((row) =>
        this.toHistoryItem(row.id, row.createdAt, row.result),
      ),
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  private toResponse(
    id: string,
    createdAt: Date,
    result: unknown,
  ): ReplenishmentAnalysisResponse {
    const parsed = result as ReplenishmentSuggestion;
    return {
      ...parsed,
      analysisId: id,
      createdAt: createdAt.toISOString(),
    };
  }

  private toHistoryItem(
    id: string,
    createdAt: Date,
    result: unknown,
  ): ReplenishmentAnalysisHistoryItem {
    const parsed = result as ReplenishmentSuggestion;
    return {
      id,
      createdAt: createdAt.toISOString(),
      summary: parsed.summary,
      priorityCount: parsed.priorities.length,
      result: parsed,
    };
  }
}
