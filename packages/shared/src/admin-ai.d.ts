export type AdminAiFundsMetric = 'inventory-cost' | 'expected-profit' | 'procurement' | 'commissions' | 'net-profit';
export interface AdminAiInsightSource {
    type: string;
    ref: string;
}
export interface AdminAiInsight {
    summary: string;
    findings: string[];
    recommendations: string[];
    risks?: string[];
    sources: AdminAiInsightSource[];
}
export interface WithdrawalInsightRequest {
    withdrawalId: string;
}
export interface DeliveryOrderInsightRequest {
    orderId: string;
}
export interface FundsInsightRequest {
    metric: AdminAiFundsMetric;
    from?: string;
    to?: string;
}
