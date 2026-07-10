export type DiagnosisDomain = 'order' | 'commission' | 'inventory' | 'fund';
export type DiagnosisCardStatus = 'normal' | 'warning' | 'error';
export interface DiagnosisRequest {
    query: string;
}
export interface DiagnosisCard {
    domain: DiagnosisDomain;
    title: string;
    status: DiagnosisCardStatus;
    value: string;
    detail?: Record<string, unknown>;
}
export interface Source {
    domain: string;
    ref: string;
    description: string;
}
export interface DiagnosisResult {
    report: string;
    cards: DiagnosisCard[];
    sources: Source[];
}
