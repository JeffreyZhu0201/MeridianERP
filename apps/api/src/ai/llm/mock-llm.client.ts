import { Injectable } from '@nestjs/common';
import type { DiagnosisResult } from '@meridian/shared';
import {
  buildCards,
  buildDiagnosisResult,
  buildMockReport,
} from './diagnosis-result.builder';
import type { LlmClient } from './llm-client.interface';
import type { ToolRunResult } from './tool-run-result';

@Injectable()
export class MockLlmClient implements LlmClient {
  synthesize(query: string, toolRuns: ToolRunResult[]): Promise<DiagnosisResult> {
    const cards = buildCards(toolRuns);
    return Promise.resolve(
      buildDiagnosisResult(query, toolRuns, buildMockReport(query, cards)),
    );
  }
}
