import { Router, type IRouter, type Request, type Response } from "express";
import { eq, inArray, asc, count, and } from "drizzle-orm";
import { promises as dns } from "dns";
import OpenAI from "openai";
import { db, experiencesTable, tailoredCvsTable } from "@workspace/db";

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

function isPrivateIp(ip: string): boolean {
  // IPv4 private / loopback / link-local ranges
  const ipv4Private = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc[0-9a-f]{2}:/i,
    /^fd[0-9a-f]{2}:/i,
    /^fe80:/i,
  ];
  return ipv4Private.some(re => re.test(ip));
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",
]);

async function validateJobUrl(rawUrl: string): Promise<{ ok: true; url: URL } | { ok: false; reason: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL non valido." };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, reason: "Solo URL http:// e https:// sono accettati." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { ok: false, reason: "URL non consentito." };
  }

  // Resolve DNS and block private ranges (SSRF mitigation)
  try {
    const result = await dns.lookup(hostname, { all: true });
    for (const { address } of result) {
      if (isPrivateIp(address)) {
        return { ok: false, reason: "URL non consentito: l'indirizzo risolve su una rete interna." };
      }
    }
  } catch {
    return { ok: false, reason: "Impossibile risolvere il nome host dell'URL fornito." };
  }

  return { ok: true, url: parsed };
}

router.post("/fetch-job", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: unknown };
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    res.status(400).json({ error: "URL mancante" });
    return;
  }

  const validation = await validateJobUrl(url.trim());
  if (!validation.ok) {
    res.status(400).json({ error: validation.reason });
    return;
  }

  try {
    const response = await fetch(validation.url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(422).json({
        error: `Il sito ha risposto con errore ${response.status}. Incolla il testo manualmente.`,
      });
      return;
    }

    // Re-check after redirect: ensure final URL is not internal
    const finalUrl = response.url;
    if (finalUrl) {
      const recheck = await validateJobUrl(finalUrl);
      if (!recheck.ok) {
        res.status(400).json({ error: "Redirect verso URL non consentito." });
        return;
      }
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

const MAX_SAVED_CVS = 10;

router.post("/tailor-cv", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const { jobDescription, experienceIds, excludeExperienceIds } = req.body as {
    jobDescription?: unknown;
    experienceIds?: unknown;
    excludeExperienceIds?: unknown;
  };

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
    res.status(400).json({ error: "Descrizione dell'offerta troppo corta (minimo 50 caratteri)" });
    return;
  }

  const userId = req.user!.id;
  const user = req.user!;

  // Validate and normalise experienceIds (optional filter)
  const filteredIds: string[] | null =
    Array.isArray(experienceIds) && experienceIds.length > 0
      ? (experienceIds as unknown[]).filter((x): x is string => typeof x === "string")
      : null;

  // Validate and normalise excludeExperienceIds (IDs to exclude from the AI pool)
  const excludedIds: Set<string> =
    Array.isArray(excludeExperienceIds) && excludeExperienceIds.length > 0
      ? new Set((excludeExperienceIds as unknown[]).filter((x): x is string => typeof x === "string"))
      : new Set();

  // Fetch experiences: if caller supplied IDs, use them; otherwise all for user
  const allExperiences =
    filteredIds !== null
      ? await db
          .select()
          .from(experiencesTable)
          .where(inArray(experiencesTable.id, filteredIds))
          .then(rows => rows.filter(r => r.userId === userId)) // ownership check
      : await db
          .select()
          .from(experiencesTable)
          .where(eq(experiencesTable.userId, userId))
          .orderBy(experiencesTable.createdAt);

  // Filter out explicitly excluded experiences so the AI cannot re-select them
  const savedExperiences =
    excludedIds.size > 0
      ? allExperiences.filter(e => !excludedIds.has(e.id))
      : allExperiences;

  const experiencesText =
    savedExperiences.length > 0
      ? savedExperiences
          .map(
            (e) =>
              `[ID:${e.id}] ${e.role} @ ${e.company}${e.city ? ` (${e.city})` : ""}` +
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

VINCOLI: nel campo "id" di ogni esperienza usa ESATTAMENTE l'ID che appare dopo [ID:] nel testo dell'archivio. Seleziona MAX 4 esperienze. Non inventare aziende o ruoli non presenti nell'archivio.`,
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
      experiences: (aiResult.experiences ?? []).map((e) => ({
        id: e.id ?? "",
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

    // Auto-save the tailored CV; enforce max 10 per user by deleting oldest
    let savedCvId: string | undefined;
    try {
      const [{ total }] = await db
        .select({ total: count() })
        .from(tailoredCvsTable)
        .where(eq(tailoredCvsTable.userId, userId));

      if (total >= MAX_SAVED_CVS) {
        // Delete oldest entries to stay within limit
        const toDelete = await db
          .select({ id: tailoredCvsTable.id })
          .from(tailoredCvsTable)
          .where(eq(tailoredCvsTable.userId, userId))
          .orderBy(asc(tailoredCvsTable.createdAt))
          .limit(total - MAX_SAVED_CVS + 1);

        if (toDelete.length > 0) {
          await db
            .delete(tailoredCvsTable)
            .where(
              and(
                eq(tailoredCvsTable.userId, userId),
                inArray(tailoredCvsTable.id, toDelete.map(r => r.id)),
              ),
            );
        }
      }

      const [saved] = await db
        .insert(tailoredCvsTable)
        .values({
          userId,
          jobTitle: cvData.title || "CV su misura",
          jobDescription: jobDescription.trim().slice(0, 10000),
          cvData,
        })
        .returning({ id: tailoredCvsTable.id });

      savedCvId = saved?.id;
    } catch (saveErr) {
      // Non-fatal: log but don't fail the main response
      req.log.warn({ saveErr }, "tailor-cv: failed to auto-save");
    }

    res.json({ cvData, ...(savedCvId ? { savedCvId } : {}) });
  } catch (err) {
    req.log.error({ err }, "tailor-cv error");
    res.status(500).json({ error: "Errore durante la generazione del CV. Riprova tra qualche secondo." });
  }
});

router.get("/tailored-cvs", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(tailoredCvsTable)
    .where(eq(tailoredCvsTable.userId, userId))
    .orderBy(asc(tailoredCvsTable.createdAt));

  // Return newest first
  res.json({ tailoredCvs: rows.reverse() });
});

router.delete("/tailored-cvs/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const userId = req.user!.id;
  const id = String(req.params.id);

  const [row] = await db
    .delete(tailoredCvsTable)
    .where(and(eq(tailoredCvsTable.id, id), eq(tailoredCvsTable.userId, userId)))
    .returning({ id: tailoredCvsTable.id });

  if (!row) {
    res.status(404).json({ error: "CV non trovato" });
    return;
  }

  res.json({ success: true });
});

export default router;
