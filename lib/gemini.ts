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

export async function generateWithFallback(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  }
) {
  let lastError: any = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...requestParams,
        model,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${model} failed, attempting next model:`, err.message || err);
    }
  }

  throw lastError;
}
