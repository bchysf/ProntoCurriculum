import { CVData, Experience } from '../types';

export interface ChatExperienceInput {
  company: string;
  role: string;
  city: string;
  from: string;
  to: string;
  desc: string;
}

export type AssistantAction =
  | { type: 'add_experience'; experiences: ChatExperienceInput[] }
  | { type: 'search_archive'; experiences: ChatExperienceInput[] }
  | { type: 'update_summary'; summary: string }
  | { type: 'update_skills'; skills: string[] }
  | { type: 'save_cv' }
  | { type: 'tailor_cv'; jobText: string }
  | { type: 'none' };

export interface CvAssistantReply {
  reply: string;
  action: AssistantAction;
}

export async function aiCvAssistantChat(cvData: CVData, message: string, lang = 'IT'): Promise<CvAssistantReply> {
  const response = await fetch('/api/cv-assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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

export function experienceInputToExperience(e: ChatExperienceInput): Experience {
  return { id: crypto.randomUUID(), company: e.company, role: e.role, city: e.city, from: e.from, to: e.to, desc: e.desc };
}
