import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

// Initialize the Google Gen AI client.
// If GEMINI_API_KEY is defined, use Google AI Studio;
// otherwise, fallback to Vertex AI with Application Default Credentials (ADC).
const ai = new GoogleGenAI(
  process.env.GEMINI_API_KEY
    ? { apiKey: process.env.GEMINI_API_KEY }
    : {
        vertexai: true,
        project: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'project-401259c2-d5a5-4345-8d9',
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      }
);

async function generateWithGroq(prompt: string, temperature: number, maxTokens: number): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });
  return completion.choices[0]?.message?.content?.trim() ?? '';
}

async function generateWithGemini(prompt: string, temperature: number): Promise<string> {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature,
    },
  });
  return response.text?.trim() ?? '';
}

// Groq first (fast). Falls back to Gemini automatically on ANY Groq failure —
// rate limits, transient outages, or a model being renamed/deprecated
// (Groq has done this before and broke every AI feature with no fallback).
export async function generateText(prompt: string, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
  const temperature = opts?.temperature ?? 0.7;
  const maxTokens = opts?.maxTokens ?? 1500;

  try {
    return await generateWithGroq(prompt, temperature, maxTokens);
  } catch (groqErr) {
    console.warn('[ai] Groq call failed, falling back to Gemini:', (groqErr as { message?: string })?.message ?? groqErr);
    try {
      return await generateWithGemini(prompt, temperature);
    } catch (geminiErr) {
      console.error('[ai] Gemini fallback also failed:', (geminiErr as { message?: string })?.message ?? geminiErr);
      throw groqErr;
    }
  }
}

