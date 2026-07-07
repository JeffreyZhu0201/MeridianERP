'use client';

import type { AdminAiFundsMetric } from '@meridian/shared';

import { AdminAiInsightPanel } from './admin-ai-insight-panel';

interface AdminFundsAiInsightProps {
  token: string;
  metric: AdminAiFundsMetric;
  from?: string;
  to?: string;
}

export function AdminFundsAiInsight({
  token,
  metric,
  from,
  to,
}: AdminFundsAiInsightProps) {
  const body: Record<string, unknown> = { metric };
  if (from) body.from = from;
  if (to) body.to = to;

  return (
    <AdminAiInsightPanel
      token={token}
      endpoint="/platform/ai/insights/funds"
      body={body}
    />
  );
}
