import { Router, type IRouter, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db, experiencesTable } from '@workspace/db';
import { generateText } from '../lib/ai';
import { HR_NORMS, UNIVERSAL_NORMS } from '../lib/hrNorms';

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
  IT: 'italiano',
  EN: 'inglese (English)',
  FR: 'francese (Français)',
  DE: 'tedesco (Deutsch)',
  ES: 'spagnolo (Español)',
  PT: 'portoghese (Português)',
};

interface ChatExperience {
  company?: string;
  role?: string;
  city?: string;
  from?: string;
  to?: string;
  desc?: string;
}

// ── Generic CV edits ─────────────────────────────────────────────────────────
// The chat can edit any part of the CV through this small operation language.
// Every op is validated against the CV the client sent (known fields, real
// item ids) before it goes back; the client applies them (applyCvEdits).

const PERSONAL_FIELDS = ['firstName', 'lastName', 'title', 'email', 'phone', 'city', 'linkedin', 'summary'] as const;
type PersonalField = typeof PERSONAL_FIELDS[number];

const SECTION_FIELDS = {
  experiences: ['company', 'role', 'city', 'from', 'to', 'desc'],
  additionalExperiences: ['company', 'role', 'city', 'from', 'to', 'desc'],
  education: ['institution', 'degree', 'grade', 'from', 'to'],
  languages: ['name', 'level'],
  certifications: ['name', 'issuer', 'date'],
} as const;
type ListSection = keyof typeof SECTION_FIELDS;

type CvEdit =
  | { op: 'set_field'; field: PersonalField; value: string }
  | { op: 'add_item'; section: ListSection; item: Record<string, string>; position: 'start' | 'end' }
  | { op: 'update_item'; section: ListSection; id: string; fields: Record<string, string> }
  | { op: 'remove_item'; section: ListSection; id: string }
  | { op: 'move_item'; section: ListSection; id: string; to: 'up' | 'down' | 'top' | 'bottom' }
  | { op: 'add_skills'; values: string[] }
  | { op: 'remove_skills'; values: string[] }
  | { op: 'set_skills'; values: string[] }
  | { op: 'set_privacy_clause'; value: boolean }
  | { op: 'remove_photo' }
  | { op: 'sort_experiences' };

type ChatCvData = Partial<Record<PersonalField, string>> & {
  [K in ListSection]?: Array<Record<string, string>>;
} & {
  skills?: string[];
  hasPhoto?: boolean;
  includePrivacyClause?: boolean;
};

function pickFields(section: ListSection, raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const f of SECTION_FIELDS[section]) {
    const v = (raw as Record<string, unknown>)[f];
    if (typeof v === 'string') out[f] = v.slice(0, 3000);
  }
  return out;
}

function validateEdits(raw: unknown, cv: ChatCvData): CvEdit[] {
  if (!Array.isArray(raw)) return [];
  const isSection = (s: unknown): s is ListSection => typeof s === 'string' && s in SECTION_FIELDS;
  const hasItem = (section: ListSection, id: unknown) => typeof id === 'string' && (cv[section] ?? []).some(i => i.id === id);
  const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map(x => x.trim()).filter(Boolean) : []);

  const edits: CvEdit[] = [];
  for (const e of raw.slice(0, 40)) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    switch (o.op) {
      case 'set_field':
        if ((PERSONAL_FIELDS as readonly string[]).includes(String(o.field)) && typeof o.value === 'string') {
          edits.push({ op: 'set_field', field: o.field as PersonalField, value: o.value.slice(0, 3000) });
        }
        break;
      case 'add_item':
        if (isSection(o.section)) {
          const item = pickFields(o.section, o.item);
          if (Object.values(item).some(v => v.trim())) {
            edits.push({ op: 'add_item', section: o.section, item: { ...item, id: randomUUID() }, position: o.position === 'start' ? 'start' : 'end' });
          }
        }
        break;
      case 'update_item':
        if (isSection(o.section) && hasItem(o.section, o.id)) {
          const fields = pickFields(o.section, o.fields);
          if (Object.keys(fields).length) edits.push({ op: 'update_item', section: o.section, id: o.id as string, fields });
        }
        break;
      case 'remove_item':
        if (isSection(o.section) && hasItem(o.section, o.id)) edits.push({ op: 'remove_item', section: o.section, id: o.id as string });
        break;
      case 'move_item':
        if (isSection(o.section) && hasItem(o.section, o.id) && ['up', 'down', 'top', 'bottom'].includes(String(o.to))) {
          edits.push({ op: 'move_item', section: o.section, id: o.id as string, to: o.to as 'up' | 'down' | 'top' | 'bottom' });
        }
        break;
      case 'add_skills':
      case 'remove_skills':
      case 'set_skills': {
        const values = strList(o.values);
        if (values.length || o.op === 'set_skills') edits.push({ op: o.op, values });
        break;
      }
      case 'set_privacy_clause':
        if (typeof o.value === 'boolean') edits.push({ op: 'set_privacy_clause', value: o.value });
        break;
      case 'remove_photo':
        if (cv.hasPhoto) edits.push({ op: 'remove_photo' });
        break;
      case 'sort_experiences':
        edits.push({ op: 'sort_experiences' });
        break;
    }
  }
  return edits;
}

type AssistantAction =
  | { type: 'edit_cv'; edits: CvEdit[] }
  | { type: 'search_archive'; experiences: ChatExperience[] }
  | { type: 'save_cv' }
  | { type: 'tailor_cv'; jobText: string }
  | { type: 'set_font_scale'; mode: 'smaller' | 'larger' | 'fit_one_page' | 'reset' }
  | { type: 'review_cv'; country: string | null }
  | { type: 'none' };

function buildSystemPrompt(lang: string, hasArchive: boolean): string {
  const langName = LANG_NAMES[lang] ?? 'italiano';
  return `Sei l'assistente conversazionale integrato nel builder di CV di ProntoCurriculum.it. L'utente ti scrive messaggi liberi mentre compila il proprio CV e tu puoi MODIFICARE DIRETTAMENTE qualsiasi parte del CV. Scegli UNA delle azioni seguenti e restituisci SOLO un JSON.

AZIONI DISPONIBILI:
1. "edit_cv" — QUALSIASI modifica al contenuto del CV: dati personali e contatti, titolo, sommario, esperienze lavorative, esperienze aggiuntive (volontariato, freelance, progetti), istruzione, lingue, certificazioni, competenze, foto, clausola privacy, ordine delle voci. Aggiungere, correggere, riscrivere, accorciare, tradurre, eliminare, spostare: tutto passa da qui, tramite la lista "edits" (vedi sotto). Puoi mettere più operazioni nella stessa risposta.
2. "search_archive" — l'utente chiede di riprendere una o più esperienze che ha GIÀ salvato nel suo archivio esperienze (es. "aggiungi la mia esperienza in Google dal mio archivio", "importa il mio archivio"). Imposta "searchQuery" con le parole chiave, oppure "*" per tutto l'archivio.${hasArchive ? '' : ' (l\'utente non ha esperienze salvate: se chiede questo, spiegalo e usa "none")'}
3. "save_cv" — l'utente chiede esplicitamente di salvare il CV.
4. "tailor_cv" — l'utente chiede di creare un CV per una specifica offerta di lavoro, incollando o descrivendo la job description. Copia il testo in "jobText".
5. "set_font_scale" — l'utente chiede di cambiare la dimensione del carattere o di far stare il CV in una pagina. "fontScaleMode": "smaller" | "larger" | "fit_one_page" | "reset".
6. "review_cv" — l'utente chiede una revisione/valutazione del CV o i suoi punti deboli, eventualmente per un paese. "country": codice ISO alpha-2 minuscolo o null. In "reply" solo una frase che annuncia la revisione.
7. "none" — saluti, domande, consigli senza modifica, o richieste davvero ambigue.

OPERAZIONI PER "edits" (ogni voce di lista ha un "id" nel CV sotto: usalo per modificarla):
- {"op":"set_field","field":"firstName"|"lastName"|"title"|"email"|"phone"|"city"|"linkedin"|"summary","value":"..."}
- {"op":"add_item","section":"<sezione>","item":{...campi},"position":"start"|"end"}
- {"op":"update_item","section":"<sezione>","id":"<id>","fields":{...solo i campi da cambiare}}
- {"op":"remove_item","section":"<sezione>","id":"<id>"}
- {"op":"move_item","section":"<sezione>","id":"<id>","to":"up"|"down"|"top"|"bottom"}
- {"op":"add_skills","values":[...]} · {"op":"remove_skills","values":[...]} · {"op":"set_skills","values":[...]} (sostituisce tutte le competenze)
- {"op":"set_privacy_clause","value":true|false} · {"op":"remove_photo"} · {"op":"sort_experiences"} (ordina le esperienze dalla più recente)
Sezioni e campi:
- "experiences" (esperienze lavorative principali) e "additionalExperiences" (volontariato, freelance, progetti, stage secondari): company, role, city, from, to, desc
- "education": institution, degree, grade, from, to
- "languages": name, level (preferibilmente livello QCER A1–C2 o "Madrelingua")
- "certifications": name, issuer, date
Formato "desc": bullet che iniziano con "• ", separati da un vero \\n, forma impersonale, max ~25 parole ciascuno.

REGOLE ASSOLUTE:
- ESEGUI SUBITO: quando l'utente chiede una modifica, la tua risposta È la modifica. Non chiedere "vuoi che proceda?". Chiedi chiarimenti solo se non riesci a capire COSA modificare (es. due esperienze possibili e nessun indizio).
- Non inventare MAI fatti: aziende, date, numeri, risultati, competenze o titoli che non sono nel CV o nel messaggio dell'utente. Riformulare, accorciare, migliorare lo stile o tradurre testo esistente va bene, ma quando riscrivi non aggiungere scopi, risultati o benefici che il testo originale non dice (es. "per aumentare il ROI", "migliorando le vendite").
- Modifica SOLO ciò che l'utente ha chiesto; non toccare il resto.
- Usa la cronologia della conversazione per capire riferimenti come "quella", "accorciala", "no, rimettila come prima" (per quest'ultimo, riscrivi il testo precedente se lo conosci dalla cronologia).
- In "reply" riassumi in una frase cosa hai modificato (o rispondi alla domanda).
- Lingua: "reply" va SEMPRE nella stessa lingua del messaggio dell'utente. Il contenuto che finisce nel CV va in ${langName} (la lingua del CV), salvo che l'utente chieda esplicitamente un'altra lingua.

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "reply": "risposta breve",
  "action": "edit_cv" | "search_archive" | "save_cv" | "tailor_cv" | "set_font_scale" | "review_cv" | "none",
  "edits": [ ... ] | null,
  "searchQuery": "..." | null,
  "jobText": "..." | null,
  "fontScaleMode": "smaller" | "larger" | "fit_one_page" | "reset" | null,
  "country": "xx" | null
}`;
}

router.post('/cv-assistant/chat', async (req: Request, res: Response) => {
  const { cvData = {}, message, history, lang = 'IT' } = req.body as {
    cvData?: ChatCvData;
    message?: string;
    history?: Array<{ role?: string; text?: string }>;
    lang?: string;
  };

  if (!message || typeof message !== 'string' || message.trim().length < 2) {
    res.status(400).json({ error: 'Messaggio mancante' });
    return;
  }

  const userId = req.isAuthenticated() ? req.user!.id : null;

  let archiveRows: Array<typeof experiencesTable.$inferSelect> = [];
  if (userId) {
    archiveRows = await db.select().from(experiencesTable).where(eq(experiencesTable.userId, userId));
  }
  const archiveList = archiveRows.length
    ? archiveRows.map(e => `- ${e.role} @ ${e.company}${e.city ? `, ${e.city}` : ''}`).join('\n')
    : 'nessuna';

  const cvJson = JSON.stringify({
    ...Object.fromEntries(PERSONAL_FIELDS.map(f => [f, cvData[f] ?? ''])),
    ...Object.fromEntries((Object.keys(SECTION_FIELDS) as ListSection[]).map(s => [s, cvData[s] ?? []])),
    skills: cvData.skills ?? [],
    hasPhoto: !!cvData.hasPhoto,
    privacyClauseShown: cvData.includePrivacyClause !== false,
  });

  const historyBlock = (Array.isArray(history) ? history : [])
    .slice(-8)
    .filter(h => typeof h?.text === 'string')
    .map(h => `${h.role === 'user' ? 'UTENTE' : 'ASSISTENTE'}: ${h.text!.slice(0, 800)}`)
    .join('\n');

  const prompt = `${buildSystemPrompt(lang, archiveRows.length > 0)}

CV ATTUALE (JSON):
${cvJson}

ESPERIENZE NELL'ARCHIVIO DELL'UTENTE (per "search_archive"):
${archiveList}

CRONOLOGIA RECENTE DELLA CONVERSAZIONE:
${historyBlock || 'nessuna'}

MESSAGGIO DELL'UTENTE:
"${message.trim().slice(0, 4000)}"

PROMEMORIA: scrivi "reply" nella stessa lingua di questo messaggio dell'utente (se è in inglese, rispondi in inglese), non in italiano per default.`;

  try {
    const raw = await generateText(prompt, { temperature: 0.4, maxTokens: 5000 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as {
      reply?: string;
      action?: string;
      edits?: unknown;
      searchQuery?: string | null;
      jobText?: string | null;
      fontScaleMode?: string | null;
      country?: string | null;
    };

    let action: AssistantAction = { type: 'none' };
    let reply = parsed.reply ?? '';

    switch (parsed.action) {
      case 'edit_cv': {
        const edits = validateEdits(parsed.edits, cvData);
        if (edits.length) action = { type: 'edit_cv', edits };
        break;
      }
      case 'search_archive': {
        const query = (parsed.searchQuery ?? '').toLowerCase().trim();
        // "*" (or the model leaving it blank on an "add everything" style
        // request) means the whole archive, not zero results.
        const matches = (!query || query === '*')
          ? archiveRows
          : archiveRows.filter(e =>
              e.role.toLowerCase().includes(query) ||
              e.company.toLowerCase().includes(query) ||
              (e.description ?? '').toLowerCase().includes(query));
        if (!matches.length) {
          reply = reply || (query
            ? `Non ho trovato nulla nel tuo archivio che corrisponda a "${parsed.searchQuery}".`
            : 'Non ho trovato l\'esperienza che cerchi nel tuo archivio.');
          action = { type: 'none' };
        } else {
          action = {
            type: 'search_archive',
            experiences: matches.map(e => ({
              company: e.company, role: e.role, city: e.city ?? '',
              from: e.startDate ?? '', to: e.isCurrent ? 'Presente' : (e.endDate ?? ''),
              desc: e.description ?? '',
            })),
          };
        }
        break;
      }
      case 'save_cv':
        action = { type: 'save_cv' };
        break;
      case 'tailor_cv':
        if (parsed.jobText?.trim()) action = { type: 'tailor_cv', jobText: parsed.jobText.trim() };
        break;
      case 'set_font_scale':
        if (parsed.fontScaleMode === 'smaller' || parsed.fontScaleMode === 'larger' || parsed.fontScaleMode === 'fit_one_page' || parsed.fontScaleMode === 'reset') {
          action = { type: 'set_font_scale', mode: parsed.fontScaleMode };
        }
        break;
      case 'review_cv': {
        const cc = (parsed.country ?? '').toLowerCase().trim();
        action = { type: 'review_cv', country: HR_NORMS[cc] ? cc : null };
        break;
      }
      default:
        action = { type: 'none' };
    }

    res.json({ reply, action });
  } catch (err) {
    req.log.error({ err }, 'cv-assistant/chat error');
    res.status(500).json({ error: "Errore durante l'elaborazione del messaggio" });
  }
});

// ── CV review ────────────────────────────────────────────────────────────────
// Recruiter-style critique of the whole CV against the hiring conventions of a
// target country (HR_NORMS). Each weakness may carry a structured fix the
// frontend can apply in one click; fixes that would require facts only the
// user knows (numbers, dates, missing roles) are returned as advice only.

type ReviewChange =
  | { type: 'set_title'; value: string }
  | { type: 'set_summary'; value: string }
  | { type: 'set_experience_desc'; experienceId: string; value: string }
  | { type: 'add_skills'; values: string[] }
  | { type: 'remove_skills'; values: string[] }
  | { type: 'remove_photo' }
  | { type: 'set_privacy_clause'; value: boolean }
  | { type: 'sort_experiences' };

interface ReviewCvData {
  title?: string;
  summary?: string;
  email?: string;
  phone?: string;
  city?: string;
  linkedin?: string;
  experiences?: Array<ChatExperience & { id?: string }>;
  education?: Array<{ institution?: string; degree?: string; grade?: string; from?: string; to?: string }>;
  skills?: string[];
  languages?: Array<{ name?: string; level?: string }>;
  certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
  additionalExperiences?: ChatExperience[];
  hasPhoto?: boolean;
  includePrivacyClause?: boolean;
  experiencesSorted?: boolean;
}

const SEVERITIES = new Set(['high', 'medium', 'low']);

function buildReviewPrompt(cv: ReviewCvData, countryCode: string, targetRole: string, uiLang: string, cvLang: string): string {
  const country = HR_NORMS[countryCode];
  const uiLangName = LANG_NAMES[uiLang] ?? 'italiano';
  const cvLangName = LANG_NAMES[cvLang] ?? 'italiano';

  const cvJson = JSON.stringify({
    title: cv.title ?? '',
    summary: cv.summary ?? '',
    contacts: { email: !!cv.email, phone: !!cv.phone, city: cv.city ?? '', linkedin: !!cv.linkedin },
    hasPhoto: !!cv.hasPhoto,
    gdprPrivacyClauseShown: cv.includePrivacyClause !== false,
    experiencesInReverseChronologicalOrder: cv.experiencesSorted !== false,
    experiences: (cv.experiences ?? []).map(e => ({ id: e.id, role: e.role, company: e.company, city: e.city, from: e.from, to: e.to, desc: e.desc })),
    additionalExperiences: (cv.additionalExperiences ?? []).map(e => ({ role: e.role, company: e.company, from: e.from, to: e.to })),
    education: cv.education ?? [],
    skills: cv.skills ?? [],
    languages: cv.languages ?? [],
    certifications: cv.certifications ?? [],
  });

  return `You are a senior HR recruiter in ${country.name} with 15+ years of screening CVs for that market. Review the candidate's CV below as you would when screening it for a job in ${country.name}${targetRole ? `, for a "${targetRole}" role` : ''}.

HIRING CONVENTIONS IN ${country.name.toUpperCase()} (base country-specific feedback on these):
${country.norms.map(n => `- ${n}`).join('\n')}

GENERAL SCREENING PRINCIPLES:
${UNIVERSAL_NORMS.map(n => `- ${n}`).join('\n')}

CV (JSON, content written in ${cvLangName}):
${cvJson}

TASK:
Identify the real weaknesses a recruiter in ${country.name} would notice, most damaging first (max 8). Cite the local convention when a weakness is country-specific. Do not invent problems: if something is fine, don't list it. For each weakness, propose a fix only if it can be applied WITHOUT inventing facts.

ALLOWED FIX TYPES ("change" object):
- {"type":"set_title","value":"..."} — reword the professional title.
- {"type":"set_summary","value":"..."} — rewrite the summary (2-4 sentences) using ONLY facts present in the CV.
- {"type":"set_experience_desc","experienceId":"<id from the CV>","value":"..."} — rewrite that experience's bullets. Keep every fact, rephrase with strong action verbs, one bullet per line, each starting with "• ", separated by \\n. NEVER add numbers, percentages, tools or results that are not already in the text.
- {"type":"add_skills","values":["..."]} — ONLY skills explicitly evidenced in the experience/education text but missing from the skills list.
- {"type":"remove_skills","values":["..."]} — remove filler/outdated skills that are in the list.
- {"type":"remove_photo"} — only if hasPhoto is true and the country's norms say no photo.
- {"type":"set_privacy_clause","value":true|false} — show/hide the Italian-style GDPR consent clause per the country's norms.
- {"type":"sort_experiences"} — reorder experiences most-recent-first; use it whenever experiencesInReverseChronologicalOrder is false (that flag is computed reliably — trust it over your own reading of the dates).
If the fix needs information only the candidate has (metrics, missing dates, gap explanations, work permit, a translation into another language), set "change" to null and explain what to add in "fix".

LANGUAGE RULES:
- "verdict", "title", "detail", "norm", "fix" must be written in ${uiLangName}.
- Any CV content inside "change" (title, summary, bullets, skills) must be written in ${cvLangName}, the CV's language.

Return ONLY this JSON (no markdown, no text before or after):
{
  "score": 0-100 integer (how ready this CV is for ${country.name}),
  "verdict": "one or two sentence overall assessment",
  "weaknesses": [
    {
      "severity": "high" | "medium" | "low",
      "section": "title" | "summary" | "experience" | "skills" | "education" | "languages" | "personal" | "format",
      "title": "short name of the problem",
      "detail": "what exactly is wrong in THIS CV",
      "norm": "the ${country.name} hiring convention or recruiter reasoning behind it (empty string if generic)",
      "fix": "what to do, in one sentence",
      "change": { ... } | null
    }
  ]
}`;
}

function validateChange(raw: unknown, cv: ReviewCvData): ReviewChange | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const strList = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

  switch (c.type) {
    case 'set_title': {
      const value = str(c.value);
      return value && value !== (cv.title ?? '').trim() ? { type: 'set_title', value: value.slice(0, 120) } : null;
    }
    case 'set_summary': {
      const value = str(c.value);
      return value && value !== (cv.summary ?? '').trim() ? { type: 'set_summary', value: value.slice(0, 1500) } : null;
    }
    case 'set_experience_desc': {
      const experienceId = str(c.experienceId);
      const exp = (cv.experiences ?? []).find(e => e.id === experienceId);
      const value = str(c.value);
      return exp && value && value !== (exp.desc ?? '').trim()
        ? { type: 'set_experience_desc', experienceId, value: value.slice(0, 2000) }
        : null;
    }
    case 'add_skills': {
      // Anti-hallucination guard: a skill can only be added if the CV text
      // already mentions it somewhere.
      const haystack = [
        cv.title, cv.summary,
        ...(cv.experiences ?? []).flatMap(e => [e.role, e.desc]),
        ...(cv.additionalExperiences ?? []).flatMap(e => [e.role, e.desc]),
        ...(cv.education ?? []).map(e => e.degree),
        ...(cv.certifications ?? []).map(c => c.name),
      ].filter(Boolean).join(' ').toLowerCase();
      const existing = new Set((cv.skills ?? []).map(s => s.toLowerCase()));
      const values = strList(c.values).filter(s => !existing.has(s.toLowerCase()) && haystack.includes(s.toLowerCase()));
      return values.length ? { type: 'add_skills', values } : null;
    }
    case 'remove_skills': {
      const existing = new Set((cv.skills ?? []).map(s => s.toLowerCase()));
      const values = strList(c.values).filter(s => existing.has(s.toLowerCase()));
      return values.length ? { type: 'remove_skills', values } : null;
    }
    case 'remove_photo':
      return cv.hasPhoto ? { type: 'remove_photo' } : null;
    case 'set_privacy_clause': {
      if (typeof c.value !== 'boolean') return null;
      const current = cv.includePrivacyClause !== false;
      return c.value !== current ? { type: 'set_privacy_clause', value: c.value } : null;
    }
    case 'sort_experiences':
      return cv.experiencesSorted === false ? { type: 'sort_experiences' } : null;
    default:
      return null;
  }
}

router.post('/cv-assistant/review', async (req: Request, res: Response) => {
  const { cvData, country, targetRole, uiLang = 'IT', cvLang = 'IT' } = req.body as {
    cvData?: ReviewCvData;
    country?: string;
    targetRole?: string;
    uiLang?: string;
    cvLang?: string;
  };

  const countryCode = (country ?? '').toLowerCase();
  if (!cvData || typeof cvData !== 'object' || !HR_NORMS[countryCode]) {
    res.status(400).json({ error: 'Dati CV o paese mancanti' });
    return;
  }
  const hasContent = (cvData.experiences ?? []).length > 0 || !!cvData.summary?.trim();
  if (!hasContent) {
    res.status(400).json({ error: 'Il CV è ancora vuoto' });
    return;
  }

  const prompt = buildReviewPrompt(cvData, countryCode, (targetRole ?? '').trim().slice(0, 120), uiLang, cvLang);

  try {
    const raw = await generateText(prompt, { temperature: 0.3, maxTokens: 6000 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as {
      score?: number;
      verdict?: string;
      weaknesses?: Array<Record<string, unknown>>;
    };

    const weaknesses = (Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [])
      .slice(0, 10)
      .map(w => ({
        id: randomUUID(),
        severity: SEVERITIES.has(String(w.severity)) ? String(w.severity) : 'medium',
        section: typeof w.section === 'string' ? w.section : 'format',
        title: typeof w.title === 'string' ? w.title : '',
        detail: typeof w.detail === 'string' ? w.detail : '',
        norm: typeof w.norm === 'string' ? w.norm : '',
        fix: typeof w.fix === 'string' ? w.fix : '',
        change: validateChange(w.change, cvData),
      }))
      .filter(w => w.title || w.detail);

    const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)));

    res.json({
      country: countryCode,
      countryName: HR_NORMS[countryCode].name,
      score,
      verdict: parsed.verdict ?? '',
      weaknesses,
    });
  } catch (err) {
    req.log.error({ err }, 'cv-assistant/review error');
    res.status(500).json({ error: 'Errore durante la revisione del CV' });
  }
});

export default router;
