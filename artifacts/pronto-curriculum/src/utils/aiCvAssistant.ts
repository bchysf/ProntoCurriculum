import { CVData, Experience } from '../types';

export interface CvAssistantReply {
  reply: string;
  additionalExperiences: Experience[] | null;
}

export async function aiCvAssistantChat(cvData: CVData, message: string, lang = 'IT'): Promise<CvAssistantReply> {
  const response = await fetch('/api/cv-assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lang,
      cvData: {
        title: cvData.title,
        summary: cvData.summary,
        additionalExperiences: cvData.additionalExperiences,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? "Errore durante l'elaborazione del messaggio");
  }

  return response.json() as Promise<CvAssistantReply>;
}
