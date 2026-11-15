import { GoogleGenAI } from "@google/genai";

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
];

export function getGeminiClient(): { ai: GoogleGenAI; apiKey: string } | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return {
    ai: new GoogleGenAI({ apiKey }),
    apiKey,
  };
}

export interface FallbackGenerateParams {
  contents: string | Array<string | Record<string, unknown>>;
  config?: {
    systemInstruction?: string;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export async function generateWithFallback(
  ai: GoogleGenAI,
  requestParams: FallbackGenerateParams
) {
  let lastError: unknown = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...requestParams,
        model,
      });
      return response;
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini] Model ${model} failed, attempting next model in resilience chain:`, msg);
    }
  }

  throw lastError;
}
