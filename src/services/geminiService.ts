import type { ChatTurn, EntryMode } from '../types';

export interface GenerateGeminiParams {
  prompt: string;
  mode?: EntryMode;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  title?: string;
}

export interface GeminiResponse {
  reply: string;
  modelUsed: string;
  mode: string;
}

export async function generateGeminiReflection(params: GenerateGeminiParams): Promise<GeminiResponse> {
  const response = await fetch('/api/gemini/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: params.prompt,
      mode: params.mode || 'reflect',
      history: params.history || [],
      title: params.title || '',
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to generate Gemini reflection';
    try {
      const errorJson = await response.json();
      if (errorJson?.error) {
        errorMessage = errorJson.error;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return {
    reply: data.reply || '',
    modelUsed: data.modelUsed || 'gemini-3.6-flash',
    mode: data.mode || params.mode || 'reflect',
  };
}
