import type { AiStreamEvent } from './ai-stream.js';
export declare function consumeAiSseStream(response: Response, onEvent: (event: AiStreamEvent) => void): Promise<void>;
export declare function streamAiPost(apiBaseUrl: string, path: string, body: unknown, token: string | undefined, onEvent: (event: AiStreamEvent) => void): Promise<void>;
