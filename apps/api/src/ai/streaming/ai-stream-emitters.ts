import type { AiStreamEvent } from '@meridian/shared';

export async function* emitStructuredFromJson<
  T extends Record<string, unknown>,
>(
  parsed: T,
  emitters: Array<(value: T) => AiStreamEvent[]>,
): AsyncGenerator<AiStreamEvent> {
  for (const emit of emitters) {
    for (const event of emit(parsed)) {
      yield event;
    }
  }
}

export function chunkText(text: string, size = 12): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

export async function* emitTextDeltas(
  text: string,
  type: 'report_delta' | 'summary_delta' | 'title_delta' | 'description_delta',
  chunkSize = 24,
): AsyncGenerator<AiStreamEvent> {
  for (const chunk of chunkText(text, chunkSize)) {
    yield { type, text: chunk } as AiStreamEvent;
  }
}
