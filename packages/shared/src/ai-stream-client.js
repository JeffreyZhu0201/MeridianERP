"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeAiSseStream = consumeAiSseStream;
exports.streamAiPost = streamAiPost;
const SSE_DATA_PREFIX = 'data: ';
async function consumeAiSseStream(response, onEvent) {
    if (!response.ok) {
        const body = (await response.json().catch(() => ({})));
        throw new Error(body.message ?? response.statusText);
    }
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('Response body is not readable');
    }
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf('\n\n');
        while (boundary >= 0) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            parseSseChunk(chunk, onEvent);
            boundary = buffer.indexOf('\n\n');
        }
    }
    if (buffer.trim()) {
        parseSseChunk(buffer, onEvent);
    }
}
function parseSseChunk(chunk, onEvent) {
    for (const line of chunk.split('\n')) {
        if (!line.startsWith(SSE_DATA_PREFIX))
            continue;
        const payload = line.slice(SSE_DATA_PREFIX.length).trim();
        if (!payload)
            continue;
        onEvent(JSON.parse(payload));
    }
}
async function streamAiPost(apiBaseUrl, path, body, token, onEvent) {
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body ?? {}),
        cache: 'no-store',
    });
    await consumeAiSseStream(response, onEvent);
}
//# sourceMappingURL=ai-stream-client.js.map