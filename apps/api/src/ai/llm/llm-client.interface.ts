import type { DiagnosisResult } from '@meridian/shared';
import type { ToolRunResult } from './tool-run-result';

export interface LlmClient {
  synthesize(query: string, toolRuns: ToolRunResult[]): Promise<DiagnosisResult>;
}
