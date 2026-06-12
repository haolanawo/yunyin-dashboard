export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmAdapter {
  name: string;
  isConfigured(): boolean;
  generate(messages: LlmMessage[]): Promise<string>;
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
  return new DisabledLlmAdapter();
}
