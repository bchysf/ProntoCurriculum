import { Router, type IRouter, type Request, type Response } from "express";
import { generateText } from "../lib/ai";
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
    skills?: {
      hard?: string[];
      soft?: string[];
    };
  };
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  tone?: 'formal' | 'enthusiastic' | 'concise' | 'executive';
  language?: string;
}

router.post("/cover-letter/generate", async (req: Request, res: Response) => {
  try {
    const {
      cvData,
      jobTitle = "Role",
      companyName = "Azienda",
      jobDescription = "",
      tone = "formal",
      language = "IT"
    }: CoverLetterPayload = req.body;

    const langName = LANG_NAMES[language] ?? "italiano";

    let toneGuidance = "Usa un tono formale, istituzionale ed estremamente professionale.";
    if (tone === "enthusiastic") {
      toneGuidance = "Usa un tono dinamico, appassionato, entusiasta ed orientato alla crescita e all'innovazione.";
    } else if (tone === "concise") {
      toneGuidance = "Usa un tono ultra-conciso, diretto, incentrato esclusivamente sui numeri, KPI e risultati rapidi.";
    } else if (tone === "executive") {
      toneGuidance = "Usa un tono executive di altissimo livello, di leadership strategica, visione del business e ROI aziendale.";
    }

    const experiencesSummary = (cvData?.experiences ?? [])
      .slice(0, 3)
      .map(e => `- ${e.role} presso ${e.company}: ${e.desc}`)
      .join("\n");

    const hardSkills = (cvData?.skills?.hard ?? []).slice(0, 8).join(", ");

    const prompt = `Sei il più autorevole consulente di carriera e copywriter di Cover Letter al mondo.
Il tuo obiettivo è scrivere una Lettera di Presentazione (Cover Letter) su misura che convinca il selezionatore (recruiter o hiring manager) a convocare il candidato a colloquio nei primi 30 secondi di lettura.

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

STRUTTURA OBBLIGATORIA (in 4 parti concise ma persuasive, max 300-350 parole totali):
1. IL GANCIO (Hook): Evita formule noiose o stantie ("Con la presente..."). Inizia subito dimostrando conoscenza dell'azienda (${companyName}), del suo posizionamento sul mercato o delle sue recenti sfide, collegando la tua passione per il loro settore.
2. IL VALORE CONCRETO (KPI & Impatto): Scegli 1 o 2 traguardi specifici o esperienze del profilo del candidato che corrispondono esattamente ai requisiti dell'annuncio. Usa numeri, percentuali o risultati misurabili.
3. ALLINEAMENTO CULTURALE E METODO: Spiega brevemente perché il metodo di lavoro, la leadership o l'approccio del candidato si integreranno alla perfezione nel team di ${companyName}.
4. CALL-TO-ACTION (Chiusura): Concludi chiedendo assertivamente ma con cortesia una breve chiamata o colloquio conoscitivo di 15 minuti per approfondire il contributo che potrai portare al dipartimento fin dai primi 60 giorni.

RESTITUISCI ESCLUSIVAMENTE UN OGGETTO JSON CON LA SEGUENTE STRUTTURA ESATTA (senza tag markdown \`\`\`json, solo JSON puro):
{
  "recipient": "Gentile Responsabile della Selezione di ${companyName},",
  "hookParagraph": "Testo del primo paragrafo...",
  "valueParagraph": "Testo del secondo paragrafo con risultati e KPI...",
  "cultureParagraph": "Testo del terzo paragrafo con allineamento culturale...",
  "closingParagraph": "Testo del quarto paragrafo di Call-to-Action...",
  "signOff": "Cordiali saluti,\\n${cvData?.firstName ?? ""} ${cvData?.lastName ?? ""}"
}`;

    const rawJson = await generateText(prompt, { temperature: 0.7, maxTokens: 1200 });
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

export default router;
