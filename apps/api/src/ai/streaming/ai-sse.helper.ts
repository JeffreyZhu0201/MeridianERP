import type { Response } from 'express';
import type { AiStreamEvent } from '@meridian/shared';

export function initSseResponse(res: Response): void {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

export function writeSseEvent(res: Response, event: AiStreamEvent): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

const STREAM_EVENT_DELAY_MS = 30;

function streamDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, STREAM_EVENT_DELAY_MS));
}

export async function pipeAiStream(
  res: Response,
  source: AsyncIterable<AiStreamEvent>,
): Promise<void> {
  initSseResponse(res);
  try {
    for await (const event of source) {
      writeSseEvent(res, event);
      if (event.type !== 'done' && event.type !== 'error') {
        await streamDelay();
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stream failed';
    writeSseEvent(res, { type: 'error', message });
  } finally {
    res.end();
  }
}
