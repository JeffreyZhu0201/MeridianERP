export interface CrmFollowUpRequest {
  leadId?: string;
  contactId?: string;
}

export interface CrmFollowUpSource {
  type: string;
  ref: string;
}

export interface CrmFollowUpSuggestion {
  summary: string;
  nextSteps: string[];
  talkingPoints: string[];
  stageInsight?: string;
  risks?: string[];
  sources: CrmFollowUpSource[];
}
