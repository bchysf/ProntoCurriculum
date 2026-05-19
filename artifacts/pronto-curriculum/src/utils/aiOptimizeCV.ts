import { CVData } from '../types';

export interface OptimizeResult {
  summary: string;
  experiences: { id: string; desc: string }[];
  skillsToAdd: string[];
}

export async function aiOptimizeCV(cvData: CVData): Promise<OptimizeResult> {
  const response = await fetch('/api/optimize-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvData }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore ottimizzazione CV');
  }

  return response.json() as Promise<OptimizeResult>;
}
