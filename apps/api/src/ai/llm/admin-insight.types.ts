export type AdminAiInsightScene = 'withdrawal' | 'delivery-order' | 'funds';

export interface AdminInsightContext {
  scene: AdminAiInsightScene;
  data: Record<string, unknown>;
}
