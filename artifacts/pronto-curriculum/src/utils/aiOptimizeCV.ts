import { CVData, SkillCategory } from '../types';

export interface OptimizeResult {
  title?: string;
  summary: string;
  experiences: { id: string; desc: string }[];
  skillCategories: SkillCategory[];
  atsScore?: number;
}

export async function aiOptimizeCV(cvData: CVData, lang = 'IT'): Promise<OptimizeResult> {
  // The photo (base64) and contact details are irrelevant to the rewrite and
  // shouldn't leave the browser for an AI call.
  const { photo: _photo, email: _email, phone: _phone, linkedin: _linkedin, ...content } = cvData;
  const response = await fetch('/api/optimize-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvData: content, lang }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore ottimizzazione CV');
  }

  return response.json() as Promise<OptimizeResult>;
}
