import { Router, type IRouter, type Request, type Response } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const LANGUAGE_NAMES: Record<string, string> = {
  IT: "Italiano",
  EN: "English",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
  PT: "Português",
};

const ALLOWED_LANGUAGES = new Set(Object.keys(LANGUAGE_NAMES));

router.post("/translate-cv", async (req: Request, res: Response) => {
  const { cvData, targetLanguage } = req.body as {
    cvData?: Record<string, unknown>;
    targetLanguage?: unknown;
  };

  if (!cvData || typeof cvData !== "object") {
    res.status(400).json({ error: "cvData mancante" });
    return;
  }

  if (
    !targetLanguage ||
    typeof targetLanguage !== "string" ||
    !ALLOWED_LANGUAGES.has(targetLanguage.toUpperCase())
  ) {
    res.status(400).json({ error: `Lingua non supportata. Usa: ${[...ALLOWED_LANGUAGES].join(", ")}` });
    return;
  }

  const lang = targetLanguage.toUpperCase();
  const langName = LANGUAGE_NAMES[lang];

  const cvText = JSON.stringify(cvData, null, 2).slice(0, 8000);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `Sei un traduttore professionale specializzato in CV e documenti aziendali di alto livello.

LINGUA TARGET: ${langName} (codice: ${lang})

COSA TRADURRE — traduci TUTTI questi campi:
- "title" (titolo professionale)
- "summary" (profilo professionale)
- "experiences" → ogni elemento: "desc" (descrizione) e "role" (ruolo/titolo)
- "education" → ogni elemento: "degree" (titolo di studio)
- "skills" → ogni stringa nell'array (traduci nella lingua target)
- "languages" → ogni elemento: "name" (nome della lingua) e "level" (livello CEFR nella lingua target)

COSA NON TRADURRE — lascia INVARIATO:
- firstName, lastName, email, phone, city, linkedin, photo
- "company" (nome aziende), "institution" (nome università/scuole)
- "from", "to", "startDate", "endDate" (date)
- "grade" (voti numerici)

STILE OBBLIGATORIO:
- Mantieni la forma impersonale professionale (zero prima persona: no "I have", no "J'ai", no "Ich habe")
- Mantieni i bullet point "• " nelle descrizioni delle esperienze
- Usa terminologia professionale di alto livello nella lingua target
- Per l'inglese: usa l'imperativo/participio passato anglosassone standard dei CV (es. "Led", "Managed", "Reduced")
- Per le altre lingue: mantieni lo stile participio passato / sostantivo d'azione senza soggetto

VINCOLO ASSOLUTO: restituisci SOLO il JSON dell'intero cvData tradotto. Zero testo prima o dopo, zero markdown.`,
        },
        {
          role: "user",
          content: `Traduci questo CV in ${langName}:\n\n${cvText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const translated = JSON.parse(jsonStr);
    res.json({ cvData: translated });
  } catch (err) {
    req.log.error({ err }, "translate-cv error");
    res.status(500).json({ error: "Errore durante la traduzione del CV. Riprova tra qualche secondo." });
  }
});

router.post("/translate-field", async (req: Request, res: Response) => {
  const { field, value, targetLanguage, context } = req.body as {
    field?: "summary" | "exp-desc" | "title" | "degree";
    value?: string;
    targetLanguage?: unknown;
    context?: Record<string, unknown>;
  };

  if (!field || !value || typeof value !== "string") {
    res.status(400).json({ error: "Parametri mancanti" });
    return;
  }

  if (
    !targetLanguage ||
    typeof targetLanguage !== "string" ||
    !ALLOWED_LANGUAGES.has(targetLanguage.toUpperCase())
  ) {
    res.status(400).json({ error: "Lingua non supportata" });
    return;
  }

  const lang = targetLanguage.toUpperCase();
  const langName = LANGUAGE_NAMES[lang];

  const fieldDescriptions: Record<string, string> = {
    summary: "profilo professionale (summary) di un CV",
    "exp-desc": "descrizione di un'esperienza lavorativa in un CV",
    title: "titolo professionale di un CV",
    degree: "titolo di studio di un CV",
  };

  const styleNotes: Record<string, string> = {
    summary: `Max 3 frasi dense. Forma impersonale professionale. Inizia con il titolo/posizionamento.`,
    "exp-desc": `Mantieni i bullet point "• ". Forma impersonale (participio passato). Max 380 caratteri.`,
    title: `Breve, 2-5 parole. Solo il titolo professionale.`,
    degree: `Solo il nome del titolo di studio tradotto.`,
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 600,
      messages: [
        {
          role: "system",
          content: `Sei un traduttore professionale specializzato in CV di alto livello.
Traduci in ${langName} il seguente ${fieldDescriptions[field] ?? "testo di un CV"}.
${styleNotes[field] ?? ""}
Stile: zero prima persona, forma impersonale professionale standard dei CV internazionali.
Restituisci SOLO il testo tradotto. Niente JSON, niente virgolette esterne, niente spiegazioni.`,
        },
        {
          role: "user",
          content: context?.role
            ? `Ruolo: ${context.role as string} @ ${(context.company as string) ?? "azienda"}\nTesto originale: "${value}"`
            : `Testo originale: "${value}"`,
        },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? value;
    res.json({ result });
  } catch (err) {
    req.log.error({ err }, "translate-field error");
    res.status(500).json({ error: "Errore durante la traduzione. Riprova." });
  }
});

export default router;
