import { CVData } from '../types';

export async function aiOptimizeSummary(cvData: CVData, lang = 'IT'): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'summary',
      lang,
      value: cvData.summary,
      // Everything the summary may draw on — the server only allows claims
      // that are backed by this material.
      context: {
        title: cvData.title,
        experiences: cvData.experiences.map(e => ({ id: e.id, role: e.role, company: e.company, from: e.from, to: e.to, desc: e.desc })),
        education: cvData.education.map(e => ({ degree: e.degree, institution: e.institution, grade: e.grade, from: e.from, to: e.to })),
        certifications: (cvData.certifications ?? []).map(c => ({ name: c.name, issuer: c.issuer, date: c.date })),
        skills: [...new Set([...(cvData.skillCategories ?? []).flatMap(c => c.skills), ...cvData.skills])],
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

export async function aiRephraseExp(
  exp: { id: string; role: string; company: string; desc: string },
  lang = 'IT',
): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp',
      mode: 'rephrase',
      lang,
      value: exp.desc,
      context: { role: exp.role, company: exp.company },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore rigenerazione esperienza');
  }

  const data = await response.json() as { result: string };
  return data.result;
}

export async function aiApplyTip(
  exp: { role: string; company: string; desc: string },
  tip: string,
  lang = 'IT',
): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp',
      mode: 'apply-tip',
      lang,
      value: exp.desc,
      context: { role: exp.role, company: exp.company, tip },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore applicazione suggerimento');
  }

  const data = await response.json() as { result: string };
  return data.result;
}

export async function aiSuggestExpRole(
  exp: { company: string; desc: string; currentRole?: string },
  lang = 'IT',
): Promise<string> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp-role',
      lang,
      value: exp.desc,
      context: { company: exp.company, currentRole: exp.currentRole },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore suggerimento ruolo');
  }

  const data = await response.json() as { result: string };
  return data.result;
}

export async function aiSuggestExpSkills(
  exp: { role: string; company: string; desc: string; existingSkills?: string[] },
  lang = 'IT',
): Promise<string[]> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp-skills',
      lang,
      value: exp.desc,
      context: { role: exp.role, company: exp.company, existingSkills: exp.existingSkills },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore suggerimento competenze');
  }

  const data = await response.json() as { skills: string[] };
  return Array.isArray(data.skills) ? data.skills : [];
}

export async function aiExpTips(
  exp: { role: string; company: string; desc: string },
  lang = 'IT',
): Promise<string[]> {
  const response = await fetch('/api/optimize-field', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field: 'exp-tips',
      lang,
      value: exp.desc,
      context: { role: exp.role, company: exp.company },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Errore suggerimenti');
  }

  const data = await response.json() as { tips: string[] };
  return Array.isArray(data.tips) ? data.tips : [];
}
