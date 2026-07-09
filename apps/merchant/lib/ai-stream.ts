import { streamAiPost, type AiStreamEvent } from '@meridian/shared';

import { API_URL } from './api';

export function streamAi(
  path: string,
  body: unknown,
  token: string | undefined,
  onEvent: (event: AiStreamEvent) => void,
): Promise<void> {
  const streamPath = path.endsWith('/stream') ? path : `${path}/stream`;
  return streamAiPost(API_URL, streamPath, body, token, onEvent);
}
