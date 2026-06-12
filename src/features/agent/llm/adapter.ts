export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface LlmAdapter {
  name: string;
  isConfigured(): boolean;
  generate(messages: LlmMessage[]): Promise<string>;
}

class DeepSeekAdapter implements LlmAdapter {
  name = 'deepseek-v4-flash';

  private apiKey = process.env.DEEPSEEK_API_KEY;
  private baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  private model = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash';

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async generate(messages: LlmMessage[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured.');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        thinking: {
          type: 'disabled',
        },
        temperature: 0.2,
        max_tokens: 1200,
      }),
      cache: 'no-store',
    });

    const payload = (await response.json()) as DeepSeekChatCompletionResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `DeepSeek request failed with status ${response.status}.`);
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('DeepSeek returned an empty completion.');
    }

    return content;
  }
}

class DisabledLlmAdapter implements LlmAdapter {
  name = 'disabled';

  isConfigured() {
    return false;
  }

  async generate(): Promise<string> {
    throw new Error('No LLM adapter configured for this environment.');
  }
}

export function getLlmAdapter(): LlmAdapter {
  if (process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekAdapter();
  }
  return new DisabledLlmAdapter();
}
