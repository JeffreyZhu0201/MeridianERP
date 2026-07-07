import type { LeadStage } from '@prisma/client';
import type { ActivityType } from '@prisma/client';

export interface CrmFollowUpActivityContext {
  type: ActivityType;
  note: string;
  createdAt: string;
}

export interface CrmFollowUpLeadContext {
  id: string;
  title: string;
  stage: LeadStage;
  source: string | null;
}

export interface CrmFollowUpContactContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export interface CrmFollowUpContext {
  subjectType: 'lead' | 'contact';
  lead?: CrmFollowUpLeadContext;
  contact?: CrmFollowUpContactContext;
  relatedLeads?: CrmFollowUpLeadContext[];
  activities: CrmFollowUpActivityContext[];
  daysSinceLastActivity: number | null;
}
