import { CVData } from '../types';

export async function aiOptimizeSummary(cvData: CVData, lang = 'IT'): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'summary',
      lang,
      value: cvData.summary,
      context: {
        title: cvData.title,
        experiences: cvData.experiences.map(e => ({ role: e.role, company: e.company, desc: e.desc })),
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore ottimizzazione profilo');
  }

  const data = await response.json() as { result: string };
  return data.result;
}

export async function aiOptimizeExp(
  exp: { id: string; role: string; company: string; desc: string },
  lang = 'IT',
): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp',
      lang,
      value: exp.desc,
      context: { role: exp.role, company: exp.company },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore ottimizzazione esperienza');
  }

  const data = await response.json() as { result: string };
  return data.result;
}
