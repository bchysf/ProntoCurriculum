import type { CVData } from '../types';

// Zero-cost, zero-latency proxy for "does this posting fit this CV" — used to
// rank/sort results instantly before (or in place of) the real AI compatibility
// score from POST /api/jobs/analyze, which is expensive and computed on demand.

interface MatchableJob {
  title: string;
  description: string;
}

interface MatchableExperience {
  role?: string;
  company?: string;
  description?: string | null;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'you', 'your', 'are', 'will', 'have',
  'has', 'our', 'about', 'into', 'per', 'una', 'uno', 'del', 'della', 'delle', 'degli', 'dei',
  'con', 'per', 'nel', 'nella', 'negli', 'alle', 'agli', 'come', 'anche', 'che', 'sono', 'essere',
  'lavoro', 'azienda', 'ricerca', 'candidato', 'offerta', 'ruolo',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w)),
  );
}

export function heuristicMatchScore(
  job: MatchableJob,
  cvData: CVData,
  experiences: MatchableExperience[] = [],
): number {
  const cvTokens = tokenize(
    [
      cvData.title,
      cvData.summary,
      ...(cvData.skills ?? []),
      ...(cvData.experiences ?? []).map(e => `${e.role} ${e.desc}`),
      ...experiences.map(e => `${e.role ?? ''} ${e.description ?? ''}`),
    ]
      .filter(Boolean)
      .join(' '),
  );
  const jobTokens = tokenize(`${job.title} ${job.description}`);
  if (cvTokens.size === 0 || jobTokens.size === 0) return 0;

  let overlap = 0;
  for (const t of jobTokens) if (cvTokens.has(t)) overlap++;

  // Jaccard-style overlap against the smaller vocabulary, so a long CV doesn't
  // trivially "match" every posting just by having more tokens overall.
  const score = overlap / Math.min(cvTokens.size, jobTokens.size);
  return Math.round(Math.min(1, score) * 100);
}
