import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { db, experiencesTable } from "@workspace/db";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const TAILOR_SYSTEM_PROMPT = `Sei il miglior executive resume writer al mondo. Il tuo compito è creare un CV su misura per una specifica offerta di lavoro.

REGOLE ASSOLUTE:
1. Mai usare la prima persona ("Ho", "Sono", "Ho gestito"). SEMPRE participio passato o sostantivo d'azione.
2. Max 2-3 bullet per esperienza, ognuno inizia con "• "
3. Ogni bullet: verbo forte (participio passato) + risultato misurabile
4. Se ci sono numeri nelle esperienze originali, usali. Se non ci sono, usa la portata qualitativa.
5. Il summary: max 3 frasi, assertivo, con il titolo del ruolo target come apertura
6. Le skill: estrai le tecnologie/competenze più richieste dall'offerta e incrociale con quelle dell'utente

SELEZIONE DELLE ESPERIENZE:
- Seleziona MAX 4 esperienze tra quelle disponibili
- Dai priorità a quelle più rilevanti per l'offerta di lavoro
- Riscrivi le descrizioni integrando le keyword chiave dell'offerta
- Se un'esperienza non è rilevante, escludila

LINGUA: Italiano preciso e compresso.`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

router.post("/fetch-job", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL mancante" });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res
        .status(422)
        .json({ error: `Il sito ha risposto con errore ${response.status}. Incolla il testo manualmente.` });
      return;
    }

    const html = await response.text();
    const text = stripHtml(html).slice(0, 8000);

    if (text.length < 100) {
      res.status(422).json({
        error: "Impossibile estrarre testo dalla pagina. Incolla il testo manualmente.",
      });
      return;
    }

    res.json({ text });
  } catch (err) {
    req.log.warn({ err }, "fetch-job failed");
    res.status(422).json({
      error: "Impossibile raggiungere l'URL. Incolla il testo dell'offerta manualmente.",
    });
  }
});

router.post("/tailor-cv", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const { jobDescription } = req.body as { jobDescription?: string };
  if (!jobDescription || jobDescription.trim().length < 50) {
    res.status(400).json({ error: "Descrizione dell'offerta troppo corta (minimo 50 caratteri)" });
    return;
  }

  const userId = req.user!.id;
  const user = req.user!;

  const savedExperiences = await db
    .select()
    .from(experiencesTable)
    .where(eq(experiencesTable.userId, userId))
    .orderBy(experiencesTable.createdAt);

  const experiencesText =
    savedExperiences.length > 0
      ? savedExperiences
          .map(
            (e, i) =>
              `[${i + 1}] ${e.role} @ ${e.company}${e.city ? ` (${e.city})` : ""}` +
              `${e.startDate ? ` | ${e.startDate}` : ""}${e.endDate ? ` → ${e.endDate}` : ""}${e.isCurrent ? " → Presente" : ""}` +
              `${e.description ? `\nDescrizione: ${e.description}` : ""}` +
              `${e.skills?.length ? `\nSkill: ${e.skills.join(", ")}` : ""}`,
          )
          .join("\n\n")
      : "Nessuna esperienza salvata nell'archivio.";

  const userInfo = {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
  };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `${TAILOR_SYSTEM_PROMPT}

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "title": "titolo professionale ottimale per questa offerta (es. 'Senior Backend Engineer')",
  "summary": "profilo professionale su misura per l'offerta, max 550 caratteri, 3 frasi",
  "experiences": [
    {
      "id": "1",
      "company": "nome azienda",
      "role": "ruolo",
      "city": "città o stringa vuota",
      "from": "data inizio o stringa vuota",
      "to": "data fine o 'Presente' o stringa vuota",
      "desc": "2-3 bullet point con '• ', riscritti per l'offerta, max 450 caratteri"
    }
  ],
  "skills": ["skill1", "skill2", "skill3", "max 10 skill rilevanti per l'offerta"]
}

VINCOLI: usa gli id 1, 2, 3... come stringhe. Seleziona MAX 4 esperienze. Non inventare aziende o ruoli non presenti nell'archivio.`,
        },
        {
          role: "user",
          content: `OFFERTA DI LAVORO:
${jobDescription.trim().slice(0, 5000)}

ARCHIVIO ESPERIENZE DELL'UTENTE:
${experiencesText}

Crea il CV su misura selezionando le esperienze più rilevanti e riscrivendo le descrizioni per matchare le keyword dell'offerta.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const aiResult = JSON.parse(jsonStr) as {
      title: string;
      summary: string;
      experiences: Array<{
        id: string;
        company: string;
        role: string;
        city: string;
        from: string;
        to: string;
        desc: string;
      }>;
      skills: string[];
    };

    const cvData = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      title: aiResult.title ?? "",
      email: userInfo.email,
      phone: "",
      city: "",
      linkedin: "",
      summary: aiResult.summary ?? "",
      experiences: (aiResult.experiences ?? []).map((e, i) => ({
        id: String(i + 1),
        company: e.company ?? "",
        role: e.role ?? "",
        city: e.city ?? "",
        from: e.from ?? "",
        to: e.to ?? "",
        desc: e.desc ?? "",
      })),
      education: [],
      skills: aiResult.skills ?? [],
      languages: [],
    };

    res.json({ cvData });
  } catch (err) {
    req.log.error({ err }, "tailor-cv error");
    res.status(500).json({ error: "Errore durante la generazione del CV. Riprova tra qualche secondo." });
  }
});

export default router;
