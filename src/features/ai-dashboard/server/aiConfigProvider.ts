import 'server-only';

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export function getAiConfig(): AiConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.');
  }

  return {
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash',
  };
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? 'bihu2025';
}
