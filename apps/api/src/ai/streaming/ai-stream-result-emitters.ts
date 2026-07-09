import type {
  AdminAiInsight,
  AiStreamEvent,
  CrmFollowUpSuggestion,
  DiagnosisResult,
  ProductCopySuggestion,
  ReplenishmentSuggestion,
} from '@meridian/shared';
import { chunkText } from './ai-stream-emitters';

export async function* emitDiagnosisEvents(
  result: DiagnosisResult,
): AsyncGenerator<AiStreamEvent> {
  yield { type: 'cards', cards: result.cards };
  for (const chunk of chunkText(result.report)) {
    yield { type: 'report_delta', text: chunk };
  }
}

export async function* emitAdminInsightEvents(
  result: AdminAiInsight,
): AsyncGenerator<AiStreamEvent> {
  for (const chunk of chunkText(result.summary)) {
    yield { type: 'summary_delta', text: chunk };
  }
  for (const finding of result.findings) {
    yield { type: 'finding', text: finding };
  }
  for (const recommendation of result.recommendations) {
    yield { type: 'recommendation', text: recommendation };
  }
  for (const risk of result.risks ?? []) {
    yield { type: 'risk', text: risk };
  }
}

export async function* emitReplenishmentEvents(
  result: ReplenishmentSuggestion,
): AsyncGenerator<AiStreamEvent> {
  for (const chunk of chunkText(result.summary)) {
    yield { type: 'summary_delta', text: chunk };
  }
  for (const item of result.priorities) {
    yield { type: 'priority', item };
  }
  for (const recommendation of result.recommendations) {
    yield { type: 'recommendation', text: recommendation };
  }
}

export async function* emitProductCopyEvents(
  result: ProductCopySuggestion,
): AsyncGenerator<AiStreamEvent> {
  for (const chunk of chunkText(result.title, 12)) {
    yield { type: 'title_delta', text: chunk };
  }
  for (const chunk of chunkText(result.description)) {
    yield { type: 'description_delta', text: chunk };
  }
  for (const bullet of result.bulletPoints ?? []) {
    yield { type: 'bullet', text: bullet };
  }
}

export async function* emitCrmFollowUpEvents(
  result: CrmFollowUpSuggestion,
): AsyncGenerator<AiStreamEvent> {
  for (const chunk of chunkText(result.summary)) {
    yield { type: 'summary_delta', text: chunk };
  }
  for (const step of result.nextSteps) {
    yield { type: 'next_step', text: step };
  }
  for (const point of result.talkingPoints) {
    yield { type: 'talking_point', text: point };
  }
}
