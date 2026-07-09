import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AiStreamEvent,
  CrmFollowUpRequest,
  CrmFollowUpSuggestion,
} from '@meridian/shared';
import { AiLlmStreamService } from '../../../ai/llm/ai-llm-stream.service';
import { AiLlmService } from '../../../ai/llm/ai-llm.service';
import type { CrmFollowUpContext } from '../../../ai/llm/crm-follow-up.types';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CrmFollowUpService {
  private readonly logger = new Logger(CrmFollowUpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiLlm: AiLlmService,
    private readonly aiLlmStream: AiLlmStreamService,
  ) {}

  async followUp(
    tenantId: string,
    body: CrmFollowUpRequest,
  ): Promise<CrmFollowUpSuggestion> {
    const context = await this.buildContext(tenantId, body);
    this.logger.log(
      `CRM AI follow-up tenantId=${tenantId} subject=${context.subjectType}`,
    );

    const { result } = await this.aiLlm.suggestCrmFollowUp(context, {
      tenantId,
      actorType: 'MERCHANT',
    });
    return result;
  }

  async *followUpStream(
    tenantId: string,
    body: CrmFollowUpRequest,
  ): AsyncGenerator<AiStreamEvent> {
    const context = await this.buildContext(tenantId, body);
    this.logger.log(
      `CRM AI follow-up stream tenantId=${tenantId} subject=${context.subjectType}`,
    );
    yield* this.aiLlmStream.streamCrmFollowUp(context, tenantId);
  }

  private async buildContext(
    tenantId: string,
    body: CrmFollowUpRequest,
  ): Promise<CrmFollowUpContext> {
    const leadId = body.leadId?.trim();
    const contactId = body.contactId?.trim();

    if (Boolean(leadId) === Boolean(contactId)) {
      throw new BadRequestException(
        'Provide exactly one of leadId or contactId',
      );
    }

    return leadId
      ? this.buildLeadContext(tenantId, leadId)
      : this.buildContactContext(tenantId, contactId!);
  }

  private async buildLeadContext(
    tenantId: string,
    leadId: string,
  ): Promise<CrmFollowUpContext> {
    const lead = await this.prisma.crmLead.findFirst({
      where: { id: leadId, tenantId },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    let contact: CrmFollowUpContext['contact'];
    if (lead.contactId) {
      const row = await this.prisma.crmContact.findFirst({
        where: { id: lead.contactId, tenantId },
      });
      if (row) {
        contact = {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
        };
      }
    }

    const activities = await this.loadActivities(tenantId, {
      leadId: lead.id,
      contactId: lead.contactId,
    });

    return {
      subjectType: 'lead',
      lead: {
        id: lead.id,
        title: lead.title,
        stage: lead.stage,
        source: lead.source,
      },
      contact,
      activities,
      daysSinceLastActivity: this.daysSinceLast(activities),
    };
  }

  private async buildContactContext(
    tenantId: string,
    contactId: string,
  ): Promise<CrmFollowUpContext> {
    const contactRow = await this.prisma.crmContact.findFirst({
      where: { id: contactId, tenantId },
    });
    if (!contactRow) {
      throw new NotFoundException('Contact not found');
    }

    const relatedLeadsRows = await this.prisma.crmLead.findMany({
      where: { tenantId, contactId },
    });
    const relatedLeads = relatedLeadsRows
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);

    const activities = await this.loadActivities(tenantId, { contactId });

    return {
      subjectType: 'contact',
      contact: {
        id: contactRow.id,
        firstName: contactRow.firstName,
        lastName: contactRow.lastName,
        email: contactRow.email,
      },
      relatedLeads: relatedLeads.map((lead) => ({
        id: lead.id,
        title: lead.title,
        stage: lead.stage,
        source: lead.source,
      })),
      lead: relatedLeads[0]
        ? {
            id: relatedLeads[0].id,
            title: relatedLeads[0].title,
            stage: relatedLeads[0].stage,
            source: relatedLeads[0].source,
          }
        : undefined,
      activities,
      daysSinceLastActivity: this.daysSinceLast(activities),
    };
  }

  private async loadActivities(
    tenantId: string,
    ids: { leadId?: string | null; contactId?: string | null },
  ) {
    const rows = await this.prisma.crmActivity.findMany({
      where: { tenantId },
    });

    return rows
      .filter((activity) => {
        if (ids.leadId && activity.leadId === ids.leadId) {
          return true;
        }
        if (ids.contactId && activity.contactId === ids.contactId) {
          return true;
        }
        return false;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((activity) => ({
        type: activity.type,
        note: activity.note,
        createdAt: activity.createdAt.toISOString(),
      }));
  }

  private daysSinceLast(
    activities: CrmFollowUpContext['activities'],
  ): number | null {
    if (activities.length === 0) {
      return null;
    }
    const last = new Date(activities[0].createdAt);
    const diff = Date.now() - last.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}
