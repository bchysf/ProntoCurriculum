import { Router, type IRouter, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { db, experiencesTable } from '@workspace/db';
import { generateText } from '../lib/ai';

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

type AssistantAction =
  | { type: 'add_experience'; experiences: ChatExperience[] }
  | { type: 'search_archive'; experiences: ChatExperience[] }
  | { type: 'update_summary'; summary: string }
  | { type: 'update_skills'; skills: string[] }
  | { type: 'save_cv' }
  | { type: 'tailor_cv'; jobText: string }
  | { type: 'none' };

function buildSystemPrompt(lang: string, hasArchive: boolean): string {
  const langName = LANG_NAMES[lang] ?? 'italiano';
  return `Sei l'assistente conversazionale integrato nel builder di CV di ProntoCurriculum.it. L'utente ti scrive messaggi liberi mentre compila il proprio CV. Devi classificare l'intento del messaggio in UNA delle seguenti azioni e restituire SOLO un JSON.

AZIONI DISPONIBILI:
1. "add_experience" — l'utente descrive una NUOVA esperienza secondaria (volontariato, freelance, progetto, stage) da aggiungere come testo libero, non prendendola da esperienze già salvate.
2. "search_archive" — l'utente chiede di riprendere/richiamare/usare una o più esperienze che ha GIÀ salvato nel suo archivio esperienze (es. "aggiungi la mia esperienza in Google", "usa il lavoro che ho salvato come cameriere", "prendi dal mio archivio X", "aggiungi tutto quello che ho salvato", "importa il mio archivio"). Se l'utente vuole TUTTE le esperienze salvate (non solo una specifica), imposta "searchQuery" a "*". Esegui SEMPRE questa azione quando riconosci l'intento — non chiedere conferma prima, il risultato verrà mostrato subito nel CV.${hasArchive ? '' : ' (l\'utente non ha esperienze salvate: se chiede questo, rispondi spiegando che non ha ancora nulla nell\'archivio, imposta "action" su "none")'}
3. "update_summary" — l'utente chiede di scrivere o riscrivere il profilo professionale/sommario del CV.
4. "update_skills" — l'utente elenca competenze da impostare come lista skill del CV.
5. "save_cv" — l'utente chiede esplicitamente di salvare il CV (es. "salva questo", "salvalo", "save this").
6. "tailor_cv" — l'utente chiede di creare/generare un CV per una specifica offerta di lavoro o ruolo, incollando o descrivendo la job description (es. "crea un cv per questo annuncio: ...", "fammi un cv per un ruolo di project manager in una startup").
7. "none" — saluto, domanda generica, richiesta che non rientra sopra, o richiesta di modificare sezioni non gestite qui (istruzione, lingue, certificazioni, contatti) — in questo caso spiega gentilmente di usare i controlli del builder per quella sezione.

REGOLE ASSOLUTE:
- Non inventare MAI fatti, aziende, ruoli, date o competenze che l'utente non ha menzionato.
- Quando riconosci una delle azioni 1-6, ESEGUILA SUBITO nella stessa risposta (compila i campi richiesti) — non rispondere chiedendo "come vuoi procedere?" o "vuoi che proceda?": l'utente ha già dato l'istruzione, la tua risposta stessa È l'esecuzione. Chiedi chiarimenti SOLO se l'istruzione è davvero ambigua al punto da non poter scegliere nessuna azione.
- Per "add_experience": crea una voce per ciascuna esperienza distinta descritta. Campo "desc": 1-3 bullet (max 25 parole ciascuno), forma impersonale, ogni bullet inizia con "• " separato da un vero \\n.
- Per "search_archive": restituisci in "searchQuery" le parole chiave (azienda, ruolo o settore), oppure "*" per tutto l'archivio — la ricerca viene eseguita dal server, non da te.
- Per "update_summary": scrivi il nuovo sommario in "summary" basandoti SOLO su quanto detto dall'utente nel messaggio (e nel contesto del CV se rilevante), 2-4 frasi, tono professionale.
- Per "update_skills": estrai la lista di competenze menzionate in "skills" (array di stringhe).
- Per "tailor_cv": copia in "jobText" il testo della job description o la descrizione del ruolo così come scritta dall'utente (non riassumere, non inventare).
- IMPORTANTE — lingua della risposta: il campo "reply" deve SEMPRE essere scritto nella STESSA lingua in cui l'utente ha scritto il suo messaggio, indipendentemente dalla lingua del CV. Se l'utente scrive in inglese, "reply" è in inglese; se scrive in italiano, "reply" è in italiano; e così via — rileva la lingua dal messaggio dell'utente, non usare ${langName} come lingua fissa per "reply". La lingua ${langName} vale invece per il contenuto strutturato che finisce nel CV (esperienze, sommario), perché il CV deve restare in una lingua coerente.

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "reply": "risposta conversazionale breve, nella stessa lingua del messaggio dell'utente",
  "action": "add_experience" | "search_archive" | "update_summary" | "update_skills" | "save_cv" | "tailor_cv" | "none",
  "experiences": [ { "company": "", "role": "", "city": "", "from": "", "to": "", "desc": "" } ] | null,
  "searchQuery": "parole chiave, o \"*\" per tutto l'archivio" | null,
  "summary": "nuovo sommario" | null,
  "skills": ["skill1", "skill2"] | null,
  "jobText": "testo della job description o del ruolo descritto" | null
}`;
}

router.post('/cv-assistant/chat', async (req: Request, res: Response) => {
  const { cvData, message, lang = 'IT' } = req.body as {
    cvData?: {
      title?: string;
      summary?: string;
      experiences?: ChatExperience[];
      additionalExperiences?: ChatExperience[];
    };
    message?: string;
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

  const existingAdditional = (cvData?.additionalExperiences ?? [])
    .map(e => `- ${e.role || ''} @ ${e.company || ''}`)
    .join('\n');

  const contextBlock = `Titolo professionale attuale del CV: ${cvData?.title ?? 'non specificato'}
Sommario attuale: ${cvData?.summary || 'vuoto'}
Esperienze aggiuntive già presenti (per evitare duplicati):
${existingAdditional || 'nessuna'}
Esperienze salvate nell'archivio dell'utente (disponibili per "search_archive"):
${archiveList}`;

  const prompt = `${buildSystemPrompt(lang, archiveRows.length > 0)}\n\nCONTESTO DEL CV:\n${contextBlock}\n\nMESSAGGIO DELL'UTENTE:\n"${message.trim().slice(0, 2000)}"`;

  try {
    const raw = await generateText(prompt, { temperature: 0.5, maxTokens: 1200 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as {
      reply?: string;
      action?: string;
      experiences?: ChatExperience[] | null;
      searchQuery?: string | null;
      summary?: string | null;
      skills?: string[] | null;
      jobText?: string | null;
    };

    const toStructuredExperiences = (list: ChatExperience[] | null | undefined) =>
      Array.isArray(list)
        ? list
            .filter(e => e.role || e.company || e.desc)
            .map(e => ({
              id: randomUUID(),
              company: e.company ?? '',
              role: e.role ?? '',
              city: e.city ?? '',
              from: e.from ?? '',
              to: e.to ?? '',
              desc: e.desc ?? '',
            }))
        : [];

    let action: AssistantAction = { type: 'none' };
    let reply = parsed.reply ?? '';

    switch (parsed.action) {
      case 'add_experience':
        action = { type: 'add_experience', experiences: toStructuredExperiences(parsed.experiences) };
        break;
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
      case 'update_summary':
        if (parsed.summary?.trim()) action = { type: 'update_summary', summary: parsed.summary.trim() };
        break;
      case 'update_skills':
        if (Array.isArray(parsed.skills) && parsed.skills.length) action = { type: 'update_skills', skills: parsed.skills };
        break;
      case 'save_cv':
        action = { type: 'save_cv' };
        break;
      case 'tailor_cv':
        if (parsed.jobText?.trim()) action = { type: 'tailor_cv', jobText: parsed.jobText.trim() };
        break;
      default:
        action = { type: 'none' };
    }

    res.json({ reply, action });
  } catch (err) {
    req.log.error({ err }, 'cv-assistant/chat error');
    res.status(500).json({ error: "Errore durante l'elaborazione del messaggio" });
  }
});

export default router;
