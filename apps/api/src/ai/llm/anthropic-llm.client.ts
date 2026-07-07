import { Injectable } from '@nestjs/common';
import { EnvService } from '../../config/env.service';

interface AnthropicMessageResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

@Injectable()
export class AnthropicLlmClient {
  constructor(private readonly env: EnvService) {}

  async completeMessages(
    system: string,
    userMessage: string,
    maxTokens = 2048,
  ): Promise<string> {
    const baseUrl = this.resolveBaseUrl();
    const apiKey = this.resolveApiKey();
    const model = this.resolveModel();

    if (!baseUrl || !apiKey) {
      throw new Error('Anthropic-compatible LLM is not configured');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/v1/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const body = (await response.json()) as AnthropicMessageResponse;

    if (!response.ok) {
      throw new Error(
        body.error?.message ??
          `Anthropic API error (${response.status} ${response.statusText})`,
      );
    }

    return (
      body.content
        ?.filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('\n')
        .trim() ?? ''
    );
  }

  resolveBaseUrl(): string | undefined {
    return (
      this.env.get('AI_ANTHROPIC_BASE_URL') ??
      this.env.get('AI_DIAGNOSIS_ANTHROPIC_BASE_URL') ??
      this.env.get('ANTHROPIC_BASE_URL')
    );
  }

  resolveApiKey(): string | undefined {
    return (
      this.env.get('AI_ANTHROPIC_API_KEY') ??
      this.env.get('AI_DIAGNOSIS_ANTHROPIC_API_KEY') ??
      this.env.get('ANTHROPIC_AUTH_TOKEN') ??
      this.env.get('ANTHROPIC_API_KEY')
    );
  }

  resolveModel(): string {
    return (
      this.env.get('AI_ANTHROPIC_MODEL') ??
      this.env.get('AI_DIAGNOSIS_ANTHROPIC_MODEL') ??
      this.env.get('ANTHROPIC_MODEL') ??
      'ark-code-latest'
    );
  }
}
