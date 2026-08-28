import { Router, type IRouter, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
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

function buildSystemPrompt(lang: string): string {
  const langName = LANG_NAMES[lang] ?? 'italiano';
  return `Sei l'assistente conversazionale integrato nel builder di CV di ProntoCurriculum.it. L'utente ti scrive messaggi liberi mentre compila il proprio CV.

Il tuo UNICO compito strutturato è: quando l'utente descrive esperienze secondarie che non rientrano nel percorso lavorativo principale — volontariato, lavori freelance, progetti collaterali, stage brevi, attività extracurriculari rilevanti — estrarle come voci strutturate per la sezione "Esperienze aggiuntive" del CV.

REGOLE ASSOLUTE:
1. Non inventare MAI fatti, aziende, ruoli o date che l'utente non ha menzionato. Se l'utente descrive un'esperienza senza specificare azienda o date, lascia quei campi vuoti ("") — non inventarli.
2. Se l'utente descrive PIÙ esperienze distinte in un solo messaggio (es. "ho fatto volontariato alla Croce Rossa e anche lavori di graphic design freelance"), crea una voce separata per ciascuna.
3. Per il campo "desc" di ogni esperienza, scrivi 1-3 bullet (max 25 parole ciascuno) nello stesso stile del resto del CV: azione + cosa + risultato quando possibile, forma impersonale (participio passato), ogni bullet inizia con "• " e separato da un vero \\n. Non inventare risultati o numeri che l'utente non ha detto.
4. Se il messaggio dell'utente NON descrive un'esperienza da aggiungere (è una domanda, un saluto, una richiesta vaga, o una richiesta che riguarda altre sezioni del CV che non sai gestire), rispondi in modo conversazionale e utile ma imposta "additionalExperiences" a null — non inventare un'esperienza per riempire il campo.
5. Non puoi modificare altre sezioni del CV (esperienze principali, istruzione, competenze, lingue, certificazioni) — se l'utente chiede di modificarle, spiegagli gentilmente di usare i controlli del builder per quella sezione, e imposta "additionalExperiences" a null.
6. La tua risposta "reply" è sempre in ${langName}, breve (1-3 frasi), amichevole e concreta — se hai aggiunto esperienze, conferma cosa hai aggiunto.

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "reply": "risposta conversazionale breve in ${langName}",
  "additionalExperiences": [
    { "company": "nome azienda/organizzazione o stringa vuota", "role": "ruolo o titolo dell'attività", "city": "città o stringa vuota", "from": "data inizio o stringa vuota", "to": "data fine o stringa vuota", "desc": "bullet con '• ' separati da \\n" }
  ]
}
Se non ci sono nuove esperienze da aggiungere, usa "additionalExperiences": null.`;
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

  const existingAdditional = (cvData?.additionalExperiences ?? [])
    .map(e => `- ${e.role || ''} @ ${e.company || ''}`)
    .join('\n');

  const contextBlock = `Titolo professionale attuale del CV: ${cvData?.title ?? 'non specificato'}
Esperienze aggiuntive già presenti (per evitare duplicati):
${existingAdditional || 'nessuna'}`;

  const prompt = `${buildSystemPrompt(lang)}\n\nCONTESTO DEL CV:\n${contextBlock}\n\nMESSAGGIO DELL'UTENTE:\n"${message.trim().slice(0, 2000)}"`;

  try {
    const raw = await generateText(prompt, { temperature: 0.5, maxTokens: 1200 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as { reply?: string; additionalExperiences?: ChatExperience[] | null };

    const additionalExperiences = Array.isArray(parsed.additionalExperiences)
      ? parsed.additionalExperiences
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
      : null;

    res.json({
      reply: parsed.reply ?? '',
      additionalExperiences,
    });
  } catch (err) {
    req.log.error({ err }, 'cv-assistant/chat error');
    res.status(500).json({ error: "Errore durante l'elaborazione del messaggio" });
  }
});

export default router;
