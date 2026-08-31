import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, asc, count, inArray } from "drizzle-orm";
import { generateText } from "../lib/ai";
import { db, coverLettersTable } from "@workspace/db";
import * as docx from "docx";

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
  IT: "italiano",
  EN: "inglese (English)",
  FR: "francese (Français)",
  DE: "tedesco (Deutsch)",
  ES: "spagnolo (Español)",
  PT: "portoghese (Português)",
};

interface CoverLetterPayload {
  cvData?: {
    firstName?: string;
    lastName?: string;
    title?: string;
    summary?: string;
    experiences?: {
      company: string;
      role: string;
      city?: string;
      from?: string;
      to?: string;
      desc: string;
    }[];
    skills?: string[];
    skillCategories?: { name?: string; skills?: string[] }[];
  };
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  tone?: 'human' | 'formal' | 'enthusiastic' | 'concise' | 'executive';
  language?: string;
}

router.post("/cover-letter/generate", async (req: Request, res: Response) => {
  try {
    const {
      cvData,
      jobTitle = "Role",
      companyName = "Azienda",
      jobDescription = "",
      tone = "human",
      language = "IT"
    }: CoverLetterPayload = req.body;

    const langName = LANG_NAMES[language] ?? "italiano";

    let toneGuidance =
      "Scrivi come una persona vera scriverebbe a un'altra persona, non come un ufficio HR. Frasi brevi, dirette, zero gergo aziendale (\"sinergie\", \"track record\", \"proattivo\", \"problem solver\"). Va benissimo iniziare una frase con \"E\" o \"Ma\". Nessuna frase di circostanza: ogni riga deve dire qualcosa di specifico su questo candidato o questa azienda.";
    let wordTarget = "150-200";
    if (tone === "formal") {
      toneGuidance = "Usa un tono formale, istituzionale e professionale.";
      wordTarget = "220-280";
    } else if (tone === "enthusiastic") {
      toneGuidance = "Usa un tono dinamico, appassionato, entusiasta ed orientato alla crescita e all'innovazione.";
      wordTarget = "180-230";
    } else if (tone === "concise") {
      toneGuidance = "Usa un tono ultra-conciso, diretto, incentrato esclusivamente sui numeri, KPI e risultati rapidi. Frasi cortissime.";
      wordTarget = "100-140";
    } else if (tone === "executive") {
      toneGuidance = "Usa un tono executive di altissimo livello, di leadership strategica, visione del business e ROI aziendale.";
      wordTarget = "220-280";
    }

    const experiencesSummary = (cvData?.experiences ?? [])
      .slice(0, 3)
      .map(e => `- ${e.role} presso ${e.company}: ${e.desc}`)
      .join("\n");

    const effectiveSkills = cvData?.skillCategories?.length
      ? cvData.skillCategories.flatMap(c => c.skills ?? [])
      : (cvData?.skills ?? []);
    const hardSkills = effectiveSkills.slice(0, 8).join(", ");

const greetingStyle = tone === "formal" || tone === "executive"
      ? `"Gentile Responsabile della Selezione di ${companyName}," (o equivalente formale in ${langName})`
      : `un saluto breve e naturale — es. "Ciao," oppure "Gentile team di ${companyName}," in ${langName} — mai "Gentile Responsabile della Selezione"`;

    const prompt = `Sei un consulente di carriera che aiuta le persone a scrivere lettere di presentazione che sembrano scritte da loro, non da un ufficio HR.
Il tuo obiettivo è scrivere una Lettera di Presentazione su misura che un recruiter legga fino alla fine perché suona come una persona reale, non un modulo.

LINGUA DI OUTPUT OBBLIGATORIA: ${langName}.

DATI DEL CANDIDATO:
Nome e Cognome: ${cvData?.firstName ?? ""} ${cvData?.lastName ?? ""}
Titolo/Ruolo attuale: ${cvData?.title ?? ""}
Sommario del profilo: ${cvData?.summary ?? ""}
Principali esperienze passate:
${experiencesSummary}
Competenze chiave: ${hardSkills}

OFFERTA DI LAVORO TARGET:
Ruolo richiesto: ${jobTitle}
Azienda target: ${companyName}
Descrizione dell'annuncio (Job Description):
${jobDescription || "Nessuna descrizione fornita. Basati sul titolo del ruolo e sul settore dell'azienda per dedurre le sfide e le esigenze prioritarie."}

DIRETTIVE SUL TONO DI VOCE:
${toneGuidance}

VALUTAZIONE DI COMPATIBILITÀ (fai questo ragionamento PRIMA di scrivere la lettera):
Confronta onestamente l'esperienza del candidato con i requisiti dell'offerta. Stima un punteggio di compatibilità da 0 a 100 (fitScore) e scrivi una nota di 1 frase che lo giustifica (fitNote), in ${langName}.
- Se fitScore è ALTO (≥70): scrivi una lettera sicura e diretta, senza toccare eventuali gap — il candidato è un match solido.
- Se fitScore è MEDIO o BASSO (<70): nel GANCIO o nel VALORE CONCRETO, affronta la discrepanza con sicurezza e riformulazione positiva invece di ignorarla o scusarti — esempio di tono: "pur non avendo esperienza diretta in X, la mia esperienza in Y mi ha dato competenze direttamente trasferibili in Z". Non essere remissivo, sii propositivo: trasforma il gap in una prospettiva diversa che porta valore.
Non inventare esperienze o competenze che il candidato non ha per far salire artificialmente il punteggio — la valutazione deve riflettere onestamente i dati forniti.

LUNGHEZZA TOTALE OBBLIGATORIA: ${wordTarget} parole in tutto (somma dei 4 paragrafi). Non superarla — una lettera più corta e mirata batte sempre una più lunga e generica.

STRUTTURA (4 paragrafi brevi, ognuno 1-3 frasi):
1. APERTURA: Una riga che mostra che hai letto l'annuncio o sai qualcosa di vero su ${companyName} — non un'affermazione generica che andrebbe bene per qualsiasi azienda. Evita assolutamente "Con la presente" e formule da modulo.
2. LA PROVA: Un solo episodio concreto dal profilo del candidato che risponde direttamente a quello che l'offerta chiede. Se ci sono numeri reali usali, altrimenti descrivi cosa hai fatto e perché ha contato — niente statistiche inventate.
3. PERCHÉ QUESTO POSTO: Una riga onesta sul perché questo ruolo/azienda specifico interessa al candidato, non un elogio generico all'azienda.
4. CHIUSURA: Chiedi in modo diretto e naturale una chiamata o un colloquio — niente "rimango a disposizione" da modulo.

RESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON CON LA SEGUENTE STRUTTURA ESATTA (senza tag markdown \`\`\`json, solo JSON puro):
{
  "fitScore": 0,
  "fitNote": "breve nota di 1 frase sulla compatibilità, in ${langName}",
  "recipient": ${greetingStyle},
  "hookParagraph": "Testo del primo paragrafo (apertura)...",
  "valueParagraph": "Testo del secondo paragrafo (la prova)...",
  "cultureParagraph": "Testo del terzo paragrafo (perché questo posto)...",
  "closingParagraph": "Testo del quarto paragrafo (chiusura)...",
  "signOff": "un saluto breve e naturale coerente con il tono (non necessariamente 'Cordiali saluti' se il tono non è formale), seguito da \\n${cvData?.firstName ?? ""} ${cvData?.lastName ?? ""}"
}`;

    const rawJson = await generateText(prompt, { temperature: 0.7, maxTokens: 1300 });
    const cleanJsonStr = rawJson
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(cleanJsonStr);
    } catch {
      // Fallback if parsing fails
      parsedResult = {
        fitScore: null,
        fitNote: "",
        recipient: `Gentile Responsabile della Selezione di ${companyName},`,
        hookParagraph: cleanJsonStr,
        valueParagraph: "",
        cultureParagraph: "",
        closingParagraph: "Resto a disposizione per un colloquio conoscitivo.",
        signOff: `Cordiali saluti,\n${cvData?.firstName ?? ""} ${cvData?.lastName ?? ""}`
      };
    }

    return res.status(200).json({
      success: true,
      data: parsedResult
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Errore generazione Cover Letter AI:", message);
    return res.status(500).json({
      success: false,
      error: "Impossibile generare la lettera di presentazione: " + message
    });
  }
});

router.post("/cover-letter/export/docx", async (req: Request, res: Response) => {
  try {
    const {
      recipient = "Gentile Responsabile della Selezione,",
      hookParagraph = "",
      valueParagraph = "",
      cultureParagraph = "",
      closingParagraph = "",
      signOff = "Cordiali saluti",
      applicantName = "Candidato",
      applicantEmail = "email@esempio.it",
      applicantPhone = "+39 000 0000000",
      jobTitle = "Candidatura",
      companyName = "Azienda",
      template = "modern"
    } = req.body;

    // Determine font family and primary accent color matching CV templates
    let fontFamily = "DM Sans";
    let accentColorHex = "0B1D3A"; // Navy default
    if (template === "executive") {
      fontFamily = "Arial";
      accentColorHex = "1E293B";
    } else if (template === "minimal") {
      fontFamily = "Calibri";
      accentColorHex = "333333";
    } else if (template === "europass") {
      fontFamily = "Arial";
      accentColorHex = "0E4194"; // Europass Blue
    }

    const paragraphs: docx.Paragraph[] = [];

    // Header block with applicant info
    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: applicantName.toUpperCase(), bold: true, size: 32, color: accentColorHex, font: fontFamily })
        ],
        spacing: { after: 60 }
      })
    );

    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: `${jobTitle} · ${applicantEmail} · ${applicantPhone}`, size: 19, color: "555555", font: fontFamily })
        ],
        spacing: { after: 360 }
      })
    );

    // Horizontal divider
    paragraphs.push(
      new docx.Paragraph({
        border: {
          bottom: { color: accentColorHex, space: 1, style: docx.BorderStyle.SINGLE, size: 8 }
        },
        spacing: { after: 360 }
      })
    );

    // Date and Recipient
    const today = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
    paragraphs.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: today, size: 21, color: "777777", font: fontFamily })],
        spacing: { after: 240 }
      })
    );

    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: `Spett.le ${companyName}`, bold: true, size: 22, color: "222222", font: fontFamily })
        ],
        spacing: { after: 120 }
      })
    );

    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: `Oggetto: Candidatura per la posizione di ${jobTitle}`, bold: true, size: 22, color: accentColorHex, font: fontFamily })
        ],
        spacing: { after: 360 }
      })
    );

    // Recipient greeting
    paragraphs.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: recipient, bold: true, size: 22, color: "111111", font: fontFamily })],
        spacing: { after: 200 }
      })
    );

    // Body paragraphs
    const addBodyText = (text: string) => {
      if (!text || !text.trim()) return;
      paragraphs.push(
        new docx.Paragraph({
          children: [new docx.TextRun({ text: text.trim(), size: 22, color: "2D2A26", font: fontFamily })],
          spacing: { after: 240, line: 360 }
        })
      );
    };

    addBodyText(hookParagraph);
    addBodyText(valueParagraph);
    addBodyText(cultureParagraph);
    addBodyText(closingParagraph);

    // Sign off
    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({ text: signOff.replace(/\\n/g, "\n"), size: 22, bold: true, color: "111111", font: fontFamily })
        ],
        spacing: { before: 240, after: 360 }
      })
    );

    // Footer with GDPR compliance
    paragraphs.push(
      new docx.Paragraph({
        children: [
          new docx.TextRun({
            text: "Autorizzo il trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679 (GDPR).",
            size: 14,
            italics: true,
            color: "888888",
            font: fontFamily
          })
        ],
        spacing: { before: 480 }
      })
    );

    const doc = new docx.Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
            }
          },
          children: paragraphs
        }
      ]
    });

    const buffer = await docx.Packer.toBuffer(doc);
    const sanitizedName = (applicantName || "Candidato").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Lettera_Presentazione_${sanitizedName}_ProntoCurriculum.docx`;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    return res.end(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Errore esportazione Cover Letter DOCX:", message);
    return res.status(500).json({ success: false, error: "Errore durante l'esportazione in Word" });
  }
});

const MAX_SAVED_LETTERS = 10;

// POST /api/cover-letter/save — persists a generated letter so it shows up
// in the dashboard/candidature list, mirroring how tailor-cv/confirm saves
// a generated CV. Kept as a separate step (not auto-saved inside /generate)
// so a caller can regenerate a few times before deciding which one to keep.
router.post("/cover-letter/save", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const userId = req.user!.id;
  const { letterData, jobTitle, companyName, tone } = req.body as {
    letterData?: unknown;
    jobTitle?: string;
    companyName?: string;
    tone?: string;
  };

  if (!letterData || typeof letterData !== "object") {
    res.status(400).json({ error: "letterData mancante o non valido" });
    return;
  }

  try {
    const [{ total }] = await db
      .select({ total: count() })
      .from(coverLettersTable)
      .where(eq(coverLettersTable.userId, userId));

    if (total >= MAX_SAVED_LETTERS) {
      const toDelete = await db
        .select({ id: coverLettersTable.id })
        .from(coverLettersTable)
        .where(eq(coverLettersTable.userId, userId))
        .orderBy(asc(coverLettersTable.createdAt))
        .limit(total - MAX_SAVED_LETTERS + 1);

      if (toDelete.length > 0) {
        await db
          .delete(coverLettersTable)
          .where(
            and(
              eq(coverLettersTable.userId, userId),
              inArray(coverLettersTable.id, toDelete.map(r => r.id)),
            ),
          );
      }
    }

    const [saved] = await db
      .insert(coverLettersTable)
      .values({
        userId,
        jobTitle: (jobTitle ?? "").slice(0, 255),
        companyName: (companyName ?? "").slice(0, 255),
        tone: (tone ?? "human").slice(0, 32),
        letterData,
      })
      .returning({ id: coverLettersTable.id });

    res.json({ savedLetterId: saved!.id });
  } catch (err) {
    req.log.error({ err }, "cover-letter/save: save failed");
    res.status(500).json({ error: "Errore durante il salvataggio della lettera." });
  }
});

router.get("/cover-letters", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const userId = req.user!.id;

  const rows = await db
    .select()
    .from(coverLettersTable)
    .where(eq(coverLettersTable.userId, userId))
    .orderBy(asc(coverLettersTable.createdAt));

  res.json({ coverLetters: rows.reverse() });
});

router.delete("/cover-letters/:id", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const userId = req.user!.id;
  const id = String(req.params.id);

  const [row] = await db
    .delete(coverLettersTable)
    .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, userId)))
    .returning({ id: coverLettersTable.id });

  if (!row) {
    res.status(404).json({ error: "Lettera non trovata" });
    return;
  }

  res.json({ success: true });
});

export default router;
