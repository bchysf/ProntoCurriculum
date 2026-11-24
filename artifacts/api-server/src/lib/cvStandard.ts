// The "gold standard" a senior recruiter screens a CV against, plus the
// deterministic checks that enforce it on whatever the model returns.
// Used by POST /optimize-cv (full rewrite) and the per-field rewrites.
//
// Design rule: the model writes, the code verifies. Anything the model is
// told never to do (invent numbers, first person, clichés, languages in the
// skills, too many bullets) is also checked here, because LLMs follow those
// rules most of the time, not all of the time.

export const LANG_NAMES: Record<string, string> = {
  IT: 'Italian',
  EN: 'English',
  FR: 'French',
  DE: 'German',
  ES: 'Spanish',
  PT: 'Portuguese',
};

// ─── Dates ──────────────────────────────────────────────────────────────────
// Mirrors pronto-curriculum/src/utils/sortExperiences.ts (free-text dates in
// any of the six CV languages).

const PRESENT_RE = /presente|present|ongoing|current|now\b|oggi|attuale|aujourd|heute|actualidad|atualidade|maintenant|derzeit|em curso/i;

const MONTHS: Record<string, number> = {
  gennaio: 1, gen: 1, jan: 1, january: 1, janvier: 1, januar: 1, enero: 1, janeiro: 1,
  febbraio: 2, feb: 2, february: 2, fevrier: 2, février: 2, februar: 2, febrero: 2, fevereiro: 2,
  marzo: 3, mar: 3, march: 3, mars: 3, marz: 3, märz: 3,
  aprile: 4, apr: 4, april: 4, avril: 4, abril: 4,
  maggio: 5, mag: 5, may: 5, mai: 5, mayo: 5,
  giugno: 6, giu: 6, jun: 6, june: 6, juin: 6, juni: 6, junio: 6, junho: 6,
  luglio: 7, lug: 7, jul: 7, july: 7, juillet: 7, juli: 7, julio: 7, julho: 7,
  agosto: 8, ago: 8, aug: 8, august: 8, aout: 8, août: 8,
  settembre: 9, set: 9, sep: 9, sept: 9, september: 9, septembre: 9, septiembre: 9, setembro: 9,
  ottobre: 10, ott: 10, oct: 10, october: 10, octobre: 10, oktober: 10, octubre: 10, outubro: 10,
  novembre: 11, nov: 11, november: 11, noviembre: 11, novembro: 11,
  dicembre: 12, dic: 12, dec: 12, december: 12, decembre: 12, dezember: 12, diciembre: 12, dezembro: 12,
};

function monthFromText(text: string): number {
  const lower = text.toLowerCase();
  for (const [name, num] of Object.entries(MONTHS)) {
    if (lower.includes(name)) return num;
  }
  const numeric = lower.match(/\b(0?[1-9]|1[0-2])[/\-.]\d{2,4}\b/) ?? lower.match(/\b\d{4}[/\-.](0?[1-9]|1[0-2])\b/);
  return numeric ? parseInt(numeric[1], 10) : 0;
}

function isPresent(raw: string | undefined): boolean {
  return PRESENT_RE.test((raw ?? '').trim());
}

// Months since year 0; null when unparseable. Present → now.
function toMonthIndex(raw: string | undefined, now: Date): number | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  if (isPresent(s)) return now.getFullYear() * 12 + now.getMonth() + 1;
  const year = s.match(/\d{4}/);
  if (!year) return null;
  return parseInt(year[0], 10) * 12 + (monthFromText(s) || 1);
}

function sortValue(raw: string | undefined): number {
  const s = (raw ?? '').trim();
  if (!s || isPresent(s)) return Infinity;
  const year = s.match(/\d{4}/);
  if (!year) return -Infinity;
  return parseInt(year[0], 10) * 12 + monthFromText(s);
}

const desc = (a: number, b: number) => (a === b ? 0 : b - a);

export function sortReverseChronological<T extends { from?: string; to?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => desc(sortValue(a.to), sortValue(b.to)) || desc(sortValue(a.from), sortValue(b.from)));
}

// Whole years of professional experience, merging overlapping roles so two
// parallel jobs don't double-count. Null when the dates can't support a claim.
export function totalYearsOfExperience(exps: Array<{ from?: string; to?: string }>, now = new Date()): number | null {
  const ranges: Array<[number, number]> = [];
  for (const e of exps) {
    const start = toMonthIndex(e.from, now);
    const end = toMonthIndex(e.to || (e.from ? 'present' : ''), now);
    if (start !== null && end !== null && end >= start) ranges.push([start, end]);
  }
  if (!ranges.length) return null;
  ranges.sort((a, b) => a[0] - b[0]);
  let months = 0;
  let [curS, curE] = ranges[0];
  for (const [s, e] of ranges.slice(1)) {
    if (s <= curE) curE = Math.max(curE, e);
    else { months += curE - curS + 1; [curS, curE] = [s, e]; }
  }
  months += curE - curS + 1;
  const years = Math.floor(months / 12);
  return years >= 1 ? years : null;
}

// Years counted from the most recent role backwards: { "e2": 7, "e2+e1": 10,
// ... }. Lets the model claim "N years in <field>" over only the roles that
// are actually in that field (a past waiter job shouldn't inflate "years in
// logistics"), while every possible N is still a computed, verifiable number.
export function cumulativeYears(
  exps: Array<{ id: string; role?: string; company?: string; from?: string; to?: string }>,
  now = new Date(),
): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < exps.length; i++) {
    const subset = exps.slice(0, i + 1);
    const y = totalYearsOfExperience(subset, now);
    if (y) out[subset.map(e => `${e.role || '?'} @ ${e.company || '?'}`).join(' + ')] = y;
  }
  return out;
}

// Quantified results lead: within a role, bullets with a %, currency or other
// number move to the top (stable — the model's order is kept otherwise).
export function metricsFirst(bullets: string[]): string[] {
  const weight = (b: string) => (/%|€|\$|£|\bk€|\bmln\b|\bmio\b/i.test(b) ? 2 : /\d/.test(b) ? 1 : 0);
  return bullets.map((b, i) => ({ b, i, w: weight(b) })).sort((x, y) => y.w - x.w || x.i - y.i).map(x => x.b);
}

// ─── Per-language writing conventions ──────────────────────────────────────

const STYLE: Record<string, string> = {
  IT: `- Bullet: use the Italian CV nominal style consistently — start with an ACTION NOUN, no subject: "Riduzione del 18% degli errori di prelievo tramite un nuovo layout delle postazioni di picking", "Coordinamento di un team di 12 operatori su turni", "Gestione dei rapporti con i corrieri e delle non conformità". Do not mix with participles ("Gestito…", "Ridotto…") — participle agreement errors look careless to Italian recruiters. Never "Ho…", "Sono…", "Mi sono occupato di…", "Responsabile di…", "Si occupava di…".
- Summary: impersonal / implied third person, no "Io", no "Sono un…". Start with the professional identity ("Project Manager con 8 anni di esperienza…").
- Use Italian typography: "%" attached to the number (20%), decimals with comma (1,5), thousands with dot (1.200), "€" before or after consistently.`,
  EN: `- Bullets: start with a strong past-tense action verb ("Led", "Cut", "Launched", "Negotiated"); present tense only for the current role. No pronouns, no articles at the start, never "Responsible for", "Duties included", "Worked on", "Helped".
- Summary: implied first person — no "I", "me", "my". Start with the professional identity ("Operations Manager with 8 years…").
- Use digits for all numbers, "%" attached (20%).`,
  FR: `- Puces : commencer par un nom d'action ("Pilotage de…", "Réduction de…", "Mise en place de…") ou un verbe à l'infinitif, de façon cohérente dans tout le CV. Jamais "je", jamais "Chargé de…" seul, jamais "Participation à…".
- Accroche (summary) : sans "je", commencer par l'identité professionnelle ("Chef de projet avec 8 ans d'expérience…").
- Typographie française : espace avant "%" (20 %), décimales avec virgule.`,
  DE: `- Stichpunkte im Nominalstil oder mit Partizip, ohne "ich" ("Leitung eines Teams von 8 Mitarbeitenden", "Senkung der Durchlaufzeit um 20 %", "Eingeführt: …"). Niemals "Verantwortlich für…" allein, niemals "Mitarbeit bei…".
- Profil (summary): ohne "ich", beginnt mit der beruflichen Identität ("Projektmanager mit 8 Jahren Erfahrung…").
- Deutsche Typografie: Leerzeichen vor "%" (20 %), Dezimalkomma.`,
  ES: `- Viñetas: empezar con un verbo de acción en pasado sin pronombre ("Lideré", "Reduje", "Implanté") o un sustantivo de acción ("Gestión de…"), de forma coherente. Nunca "Yo", nunca "Encargado de…" solo, nunca "Participé en…".
- Perfil (summary): sin "yo", empieza por la identidad profesional ("Project Manager con 8 años de experiencia…").
- "%" pegado al número (20%), decimales con coma.`,
  PT: `- Tópicos: começar com verbo de ação no passado sem pronome ("Liderei", "Reduzi", "Implementei") ou substantivo de ação ("Gestão de…"), de forma coerente. Nunca "Eu", nunca "Responsável por…" sozinho, nunca "Participei em…".
- Perfil (summary): sem "eu", começa pela identidade profissional ("Gestor de Projetos com 8 anos de experiência…").
- "%" junto ao número (20%), decimais com vírgula.`,
};

// Phrases recruiters read as empty filler. Checked case-insensitively.
const CLICHES: Record<string, string[]> = {
  IT: ['dinamico', 'dinamica', 'proattivo', 'proattiva', 'team player', 'orientato ai risultati', 'orientata ai risultati', 'forte motivazione', 'altamente motivat', 'problem solver', 'capacità di lavorare in team', 'ottime capacità comunicative', 'flessibile e', 'versatile', 'appassionato', 'appassionata', 'ho contribuito', 'ho partecipato', 'mi sono occupat', 'responsabile di', 'si occupava'],
  EN: ['dynamic', 'proactive', 'team player', 'results-driven', 'results-oriented', 'hard-working', 'hardworking', 'self-motivated', 'highly motivated', 'go-getter', 'detail-oriented', 'think outside the box', 'synergy', 'passionate', 'responsible for', 'duties included', 'helped with', 'worked on'],
  FR: ['dynamique', 'proactif', 'proactive', 'esprit d\'équipe', 'motivé', 'motivée', 'polyvalent', 'passionné', 'passionnée', 'participation à', 'chargé de'],
  DE: ['dynamisch', 'proaktiv', 'teamplayer', 'teamfähig', 'motiviert', 'belastbar', 'leidenschaftlich', 'verantwortlich für', 'mitarbeit bei'],
  ES: ['dinámico', 'dinámica', 'proactivo', 'proactiva', 'trabajo en equipo', 'orientado a resultados', 'motivado', 'motivada', 'apasionado', 'apasionada', 'encargado de', 'participé en'],
  PT: ['dinâmico', 'dinâmica', 'proativo', 'proativa', 'trabalho em equipe', 'trabalho em equipa', 'orientado para resultados', 'motivado', 'motivada', 'apaixonado', 'apaixonada', 'responsável por', 'participei'],
};

const FIRST_PERSON: Record<string, RegExp> = {
  IT: /(^|[\s•,;:(])(io|ho|mi sono|sono stat[oa]|il mio|la mia|i miei|le mie)\s/i,
  EN: /(^|[\s•,;:(])(I|I'm|I've|my|me)(\s|[.,;:)])/,
  FR: /(^|[\s•,;:(])(je|j'|mon|ma|mes)\s?/i,
  DE: /(^|[\s•,;:(])(ich|mein|meine|meinen|meiner)\s/i,
  ES: /(^|[\s•,;:(])(yo|mi|mis)\s/i,
  PT: /(^|[\s•,;:(])(eu|meu|minha|meus|minhas)\s/i,
};

// Spoken-language names in all six CV languages, so "Inglese C1" can't sneak
// into the skills when the CV's language section was left empty.
const LANGUAGE_WORDS = [
  'italiano', 'italian', 'italien', 'italienisch', 'inglese', 'english', 'anglais', 'englisch', 'inglés', 'ingles', 'inglês',
  'francese', 'french', 'français', 'francais', 'französisch', 'francés', 'francês', 'tedesco', 'german', 'allemand', 'deutsch', 'alemán', 'alemão',
  'spagnolo', 'spanish', 'espagnol', 'spanisch', 'español', 'espanhol', 'portoghese', 'portuguese', 'portugais', 'portugiesisch', 'portugués', 'português',
  'cinese', 'chinese', 'mandarino', 'mandarin', 'arabo', 'arabic', 'arabe', 'russo', 'russian', 'russe', 'giapponese', 'japanese', 'rumeno', 'romanian',
  'olandese', 'dutch', 'polacco', 'polish', 'madrelingua', 'native speaker', 'bilingue', 'bilingual',
];

// ─── Prompt ─────────────────────────────────────────────────────────────────

export interface OptimizeInputExperience {
  id: string;
  role: string;
  company: string;
  city: string;
  from: string;
  to: string;
  desc: string;
}

export interface OptimizeFacts {
  yearsOfExperience: number | null;
  yearsByRecentRoles: Record<string, number>;
  currentRole: string | null;
  bulletCaps: Record<string, number>;
}

// How many bullets each role has earned. A recruiter reads the top of page 1;
// space goes to the most recent roles, and old roles shrink to their essence.
export function bulletCapFor(index: number, desc: string): number {
  const base = index === 0 ? 6 : index === 1 ? 5 : index <= 3 ? 3 : 2;
  // Never more bullets than the source can support: ~1 bullet per 12 words
  // of real material, minimum 1.
  const words = desc.trim().split(/\s+/).filter(Boolean).length;
  const supported = Math.max(1, Math.ceil(words / 12));
  return Math.min(base, supported);
}

export function buildGoldStandardGuide(lang: string): string {
  const langName = LANG_NAMES[lang] ?? 'Italian';
  return `You are a senior recruiter and executive CV writer. You have screened tens of thousands of CVs and you know exactly what makes a hiring manager put one on the shortlist in the first 7 seconds and what makes them reject it. Your job is to rewrite this candidate's CV content to that gold standard — WITHOUT inventing a single fact.

OUTPUT LANGUAGE: ${langName}, for every word you write (summary, bullets, skill names, category names). Only universally-used technical terms stay in English (Excel, SAP, CRM, KPI, Scrum, React, P&L, B2B…).

━━ NON-NEGOTIABLE: TRUTH ━━
- Every number (%, €, $, team size, clients, volumes, years, durations) must appear literally in the candidate's original text or in the FACTS block. Never estimate, round up, or "make plausible" a number. An invented "30%" gets the candidate caught in the interview.
- Never add tools, certifications, employers, responsibilities, seniority or outcomes that the source does not state. You may use the standard industry term for something the source clearly describes (e.g. "gestione clienti nel gestionale" + a CRM mentioned elsewhere → "gestione clienti via CRM").
- When there is no number, show impact qualitatively and specifically (scope, frequency, who benefited, what changed) — specificity beats a fake metric.

━━ WHAT THE EXAMINER LOOKS FOR, SECTION BY SECTION ━━

1. TITLE (headline under the name)
- The standard market name for the candidate's target/current role, 2–6 words, as a recruiter would type it into a search ("Senior Accountant", "Responsabile Logistica").
- Keep the user's title if it is already standard. Never raise seniority, never change role family, no company names, no slogans.

2. PROFESSIONAL SUMMARY — 3 to 4 sentences, 45–75 words total, one paragraph
- Sentence 1: identity + experience level + domain. "[Title] with [N] years of experience in [sector/domain]". N comes ONLY from FACTS.yearsByRecentRoles: pick the LARGEST entry whose roles all belong to the field you name — earlier junior roles in the same field count (warehouse operative → warehouse team leader is all logistics; marketing assistant → marketing specialist is all marketing); only an unrelated job (e.g. a waiter before a logistics career) ends the span. Understating experience undersells the candidate. If no entry fits, or FACTS has none, describe the level without a number.
- Sentence 2: core expertise — the 2–3 hard skills / areas most relevant to the title, taken from the experiences.
- Sentence 3: the single strongest proof point in the whole CV (a real result, scope or achievement — with its real number if one exists).
- Optional sentence 4: only if there is a further CONCRETE fact (a second domain, a certification, a scope). Never a generic capability claim ("ability to lead teams to superior performance", "ready to deliver growth", "seeking a challenging role") — if you have nothing concrete, stop at 3 sentences.
- No pronouns, no clichés, no soft-skill adjectives, no list of every job held.

3. EXPERIENCE BULLETS — the heart of the CV
- Formula per bullet (Google XYZ): ACTION VERB + WHAT was done + HOW (method, tool, scope) + RESULT / impact. Where the result is a number from the source, put it in the bullet — ideally early, numbers catch the eye.
- 12–25 words per bullet, ONE line of meaning. No sub-clauses chained with "and… and…".
- Strong verbs, but HONEST verbs: the verb must match the level of ownership the source describes. "Was responsible for the newsletter" → "Managed the newsletter", NOT "Launched". "Helped account managers" → "Supported / Prepared…", NOT "Led". Upgrading ownership is a lie an interviewer will expose.
- Order bullets inside each role by impact: the most impressive / most relevant to the title FIRST. Duties that every person in that job does go last or are cut.
- Show scope signals whenever the source gives them: team size, budget, number of clients/sites/projects, geography, volumes, stakeholders' level.
- Do not start two bullets of the same role with the same verb; vary verbs across the CV.
- Coverage: every distinct real activity or achievement in the source should survive in some bullet unless the bullet cap forces a cut — then cut routine duties, never achievements.
- Merge source sentences that describe the same activity; drop pure filler ("varie attività", "supporto generico") unless it is the only material.
- NO PADDING: never append an outcome clause the source doesn't state ("…ensuring safety standards", "…garantendo la soddisfazione del cliente", "…contribuendo a…"). A short true bullet beats a long embellished one. Never write a bullet that restates another bullet or the summary.
- Unrelated early jobs (e.g. a student job before a career in another field): one short factual bullet, no embellishment.
- Maximum bullets per role is given in FACTS (bulletCaps) — it reflects recency and how much real material exists. It is a ceiling, not a target: 2 excellent bullets beat 5 padded ones.
- If a role's original description is empty, return an empty string for it — never invent duties from the job title.
- Each bullet starts with "• " and bullets are separated by "\\n".

4. SKILLS — 9 to 15 skills total, in 2–4 categories
- Hard, verifiable skills only: tools, software, methods, domain expertise, regulations. Soft skills are proven in bullets, not listed (at most one category of 2–3 specific ones like "Stakeholder management" if strongly evidenced).
- Every skill must be evidenced by the experiences, education, certifications or the user's existing skill list.
- Categories ordered by relevance to the title; inside each category, most relevant first.
- Use the official / standard spelling ("Microsoft Excel", "SAP S/4HANA", "Google Analytics 4" only if 4 is in the source).
- Each skill appears once. NEVER spoken languages (they have their own section). 1–4 words per skill.

━━ STYLE FOR ${langName.toUpperCase()} ━━
${STYLE[lang] ?? STYLE.IT}

━━ SELF-CHECK BEFORE ANSWERING ━━
For every number you wrote: is it in the source or FACTS? If not, remove it. Any pronoun, cliché, or duty-phrase ("responsible for")? Rewrite it. Any bullet over 25 words? Split or cut. Any language in skills? Remove it.`;
}

// ─── Validation & normalisation ────────────────────────────────────────────

const NUMBER_RE = /(?<![A-Za-zÀ-ÿ])\d+(?:[.,\s]\d{3})*(?:[.,]\d+)?/g;

function canonicalNumbers(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(NUMBER_RE)) {
    const raw = m[0].trim();
    out.add(raw);
    out.add(raw.replace(/[.,\s]/g, ''));            // 1.200 / 1,200 / 1 200 → 1200
    out.add(raw.replace(',', '.'));                 // 1,5 → 1.5
    out.add(String(parseFloat(raw.replace(/\s/g, '').replace(',', '.'))));
  }
  return out;
}

// Numbers in `text` that don't occur anywhere in the source material.
export function inventedNumbers(text: string, allowed: Set<string>): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(NUMBER_RE)) {
    const raw = m[0].trim();
    const variants = [raw, raw.replace(/[.,\s]/g, ''), raw.replace(',', '.'), String(parseFloat(raw.replace(/\s/g, '').replace(',', '.')))];
    if (!variants.some(v => allowed.has(v))) bad.push(raw);
  }
  return bad;
}

export function buildAllowedNumbers(sourceText: string, facts: OptimizeFacts): Set<string> {
  const allowed = canonicalNumbers(sourceText);
  if (facts.yearsOfExperience) allowed.add(String(facts.yearsOfExperience));
  for (const y of Object.values(facts.yearsByRecentRoles)) allowed.add(String(y));
  return allowed;
}

export function splitBullets(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/\n|(?:^|\s)•\s*/)
    .map(l => l.replace(/^[\s•\-–—*·▪◦]+/, '').trim())
    .filter(l => l && !/^(presente|present|attuale|current)$/i.test(l));
}

export function joinBullets(bullets: string[]): string {
  return bullets.map(b => `• ${b}`).join('\n');
}

// ─── Padding detector ──────────────────────────────────────────────────────
// LLMs love appending an outcome nobody stated: "…, ensuring compliance",
// "…, garantendo la soddisfazione del cliente". We compare each trailing
// clause's content words (5-letter stems, accents folded) against the whole
// source CV; a clause that is mostly new vocabulary is an unsupported claim.

const PAD_STOP = new Set(['della', 'delle', 'degli', 'dello', 'nella', 'nelle', 'negli', 'sulla', 'sulle', 'tramite', 'attraverso', 'mediante', 'quale', 'questo', 'questa', 'which', 'their', 'there', 'these', 'those', 'through', 'about', 'other', 'where', 'while', 'avec', 'dans', 'leurs', 'einer', 'eines', 'durch', 'sowie', 'entre', 'sobre', 'desde', 'hasta', 'através']);

function stems(text: string): string[] {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length >= 5 && !PAD_STOP.has(w) && !/^\d+$/.test(w))
    .map(w => w.slice(0, 5));
}

export function buildSourceStems(sourceText: string): Set<string> {
  return new Set(stems(sourceText));
}

// Returns the index (in characters) where unsupported padding starts, or -1.
export function paddingStart(bullet: string, sourceStems: Set<string>): number {
  const re = /,\s+|\s+[—–]\s+|;\s+/g;
  let m: RegExpExecArray | null;
  const cuts: number[] = [];
  while ((m = re.exec(bullet))) cuts.push(m.index);
  for (let i = 0; i < cuts.length; i++) {
    const clause = bullet.slice(cuts[i], cuts[i + 1] ?? bullet.length);
    const st = stems(clause);
    if (st.length < 2) continue;
    const novel = st.filter(s => !sourceStems.has(s)).length;
    if (novel >= 2 && novel / st.length >= 0.5) return cuts[i];
  }
  return -1;
}

// Framing vocabulary every summary uses ("experience", "specialised",
// "sector"…) — not claims about the candidate, so never counted as novel.
const SUMMARY_GENERIC = new Set(stems(`
  esperienza esperienze anni settore ambito specializzato specializzata competenze competenza gestione professionista
  solida comprovata consolidata maturata capacità attività aziendale aziende operativo operativa
  experience years sector field specialised specialized specializing expertise skills management professional proven solid background
  expérience années secteur spécialisé spécialisée compétences gestion professionnel professionnelle
  erfahrung jahren jahre branche spezialisiert kenntnisse fachkenntnisse management berufserfahrung
  experiencia años sector especializado especializada competencias gestión profesional
  experiência anos setor especializado especializada competências gestão profissional
`));

// Summary sentences (other than the first, identity sentence) whose content
// words mostly don't occur anywhere in the CV: claims with no backing.
export function unsupportedSentences(summary: string, sourceStems: Set<string>): string[] {
  const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(1).filter(s => {
    const st = stems(s).filter(x => !SUMMARY_GENERIC.has(x));
    if (st.length < 2) return false;
    const novel = st.filter(x => !sourceStems.has(x)).length;
    return novel >= 2 && novel / st.length >= 0.5;
  });
}

// Share of the output's content words found in the source. Low overlap means
// the output is a translation of the source, where the padding check would
// misfire on every clause.
export function sourceOverlap(texts: string[], sourceStems: Set<string>): number {
  const all = texts.flatMap(stems);
  if (!all.length) return 1;
  return all.filter(s => sourceStems.has(s)).length / all.length;
}

export function findCliches(text: string, lang: string): string[] {
  const lower = text.toLowerCase();
  return (CLICHES[lang] ?? CLICHES.IT).filter(c => lower.includes(c));
}

export function hasFirstPerson(text: string, lang: string): boolean {
  return (FIRST_PERSON[lang] ?? FIRST_PERSON.IT).test(text);
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isLanguageSkill(skill: string, cvLanguages: string[]): boolean {
  const s = skill.toLowerCase().replace(/\b(a1|a2|b1|b2|c1|c2)\b|[()\-:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (cvLanguages.some(l => l && s.includes(l.toLowerCase()))) return true;
  return LANGUAGE_WORDS.some(w => s === w || s.startsWith(w + ' ') || s.endsWith(' ' + w));
}

export function cleanSkillCategories(
  raw: unknown,
  cvLanguages: string[],
): Array<{ name: string; skills: string[] }> {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Array<{ name: string; skills: string[] }> = [];
  let total = 0;
  for (const cat of raw.slice(0, 4)) {
    if (!cat || typeof cat !== 'object') continue;
    const name = String((cat as { name?: unknown }).name ?? '').trim();
    const skillsRaw = (cat as { skills?: unknown }).skills;
    if (!name || !Array.isArray(skillsRaw)) continue;
    const skills: string[] = [];
    for (const s of skillsRaw) {
      const skill = String(s ?? '').trim().replace(/[.;]+$/, '');
      const key = skill.toLowerCase();
      if (!skill || skill.length > 40 || seen.has(key) || isLanguageSkill(skill, cvLanguages)) continue;
      if (total >= 15) break;
      seen.add(key);
      skills.push(skill);
      total++;
    }
    if (skills.length) out.push({ name, skills });
  }
  return out;
}
