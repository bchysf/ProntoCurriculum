import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const MASTER_SYSTEM_PROMPT = `Sei un Executive Resume Writer di livello mondiale con 25 anni di esperienza nel posizionamento di figure C-suite, dirigenti e professionisti senior nei mercati italiano ed europeo.
Hai collaborato con headhunter di Spencer Stuart, Egon Zehnder, Korn Ferry e studi di executive search di primo piano.

IL TUO STANDARD È INFLESSIBILE:
- Ogni parola deve guadagnare il suo posto. Zero parole di riempimento, zero banalità.
- Il linguaggio è preciso, autorevole e orientato all'impatto strategico.
- Ogni affermazione deve trasmettere leadership, risultati misurabili e valore per il business.
- Il tono è professionale ma non burocratico: assertivo, diretto, calibrato per impressionare un Board o un CEO.

LINGUA: Italiano di alta qualità. Verbi all'indicativo passato prossimo o presente. MAI traduzioni letterali dall'inglese.
USA: "Ho guidato", "Ho orchestrato", "Ho definito la strategia", "Ho ridisegnato", "Ho scalato", "Gestisco", "Coordino", "Supervisiono".
NON USARE MAI: frasi banali come "team player", "buone doti comunicative", "problem solving", "dinamico e proattivo", "orientato ai risultati" da soli senza contesto.

REGOLE PER IL PROFILO PROFESSIONALE (summary):
- Inizia con il titolo professionale e un'affermazione di valore forte (NON con "Sono" o "Professionista con")
- Includi il settore, gli anni di esperienza rilevante e la specializzazione chiave
- Cita 2-3 aree di expertise strategica
- Chiudi con l'ambizione o il posizionamento di carriera
- Tono: come un opening statement di un executive briefing
- Esempio di QUALITÀ ACCETTABILE: "CFO con 15 anni di esperienza nella guida di trasformazioni finanziarie in contesti multinazionali. Ho supervisionato processi M&A per oltre €2 miliardi, ridefinito la struttura del capitale in 3 mercati europei e implementato sistemi ERP mission-critical. Expertise in corporate finance, investor relations e governance. Orientato a ruoli di leadership finanziaria in contesti di crescita accelerata o ristrutturazione."

REGOLE PER LE DESCRIZIONI ESPERIENZE:
- Inizia SEMPRE con un verbo d'azione forte che descrive il contributo principale
- Struttura: Azione → Scala/Contesto → Risultato misurabile (dove disponibile)
- Includi numeri reali se presenti nel testo originale, altrimenti descrivi la portata qualitativa
- Ogni frase deve rispondere alla domanda: "Perché questo è rilevante per chi assume?"
- Evita liste di mansioni — scrivi achievement e contributi strategici
- Esempio di QUALITÀ ACCETTABILE: "Ho guidato la trasformazione digitale dell'area Operations, coordinando un team di 45 risorse distribite su 4 sedi europee. Ho ridotto il time-to-market del 35% attraverso l'implementazione di metodologie Agile e l'integrazione di una piattaforma di workflow automation custom. Ho contribuito a un risparmio strutturale di €1,2M annui."`;

router.post("/optimize-cv", async (req, res) => {
  const { cvData } = req.body as { cvData?: Record<string, unknown> };

  if (!cvData) {
    res.status(400).json({ error: "CV data mancante" });
    return;
  }

  const cvText = JSON.stringify(cvData, null, 2).slice(0, 7000);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `${MASTER_SYSTEM_PROMPT}

Analizza il CV fornito e restituisci SOLO questo JSON (nessun testo prima o dopo):
{
  "summary": "profilo professionale riscritto al massimo livello qualitativo, max 600 caratteri",
  "experiences": [
    { "id": "stessa id dell'originale", "desc": "descrizione riscritta con impatto dirigenziale, max 450 caratteri" }
  ],
  "skillsToAdd": ["competenza1", "competenza2", "competenza3"]
}

Per skillsToAdd: suggerisci 3-5 competenze strategiche, metodologiche o tecnologiche di alto profilo pertinenti al ruolo, NON già presenti nel CV.
Mantieni le stesse id delle esperienze originali. Non inventare fatti non presenti nel CV originale.`,
        },
        {
          role: "user",
          content: `Riscrivi questo CV al massimo livello qualitativo executive:\n\n${cvText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "optimize-cv error");
    res.status(500).json({ error: "Errore durante l'ottimizzazione del CV" });
  }
});

router.post("/optimize-field", async (req, res) => {
  const { field, value, context } = req.body as {
    field?: "summary" | "exp";
    value?: string;
    context?: Record<string, unknown>;
  };

  if (!field || !value) {
    res.status(400).json({ error: "Parametri mancanti" });
    return;
  }

  try {
    let systemContent: string;
    let userContent: string;

    if (field === "summary") {
      systemContent = `${MASTER_SYSTEM_PROMPT}

Riscrivi il profilo professionale fornito portandolo al massimo livello qualitativo executive.
Restituisci SOLO il testo riscritto, senza JSON, senza virgolette extra, senza spiegazioni. Max 600 caratteri.`;
      userContent = `Titolo professionale: ${(context?.title as string) ?? "non specificato"}
Profilo attuale da migliorare: "${value}"
${context?.experiences ? `Esperienze principali: ${JSON.stringify(context.experiences).slice(0, 800)}` : ""}

Riscrivilo al massimo livello executive.`;
    } else {
      systemContent = `${MASTER_SYSTEM_PROMPT}

Riscrivi la descrizione dell'esperienza lavorativa fornita portandola al massimo livello qualitativo executive.
Restituisci SOLO il testo riscritto, senza JSON, senza virgolette extra, senza spiegazioni. Max 450 caratteri.`;
      userContent = `Ruolo: ${(context?.role as string) ?? "non specificato"} presso ${(context?.company as string) ?? "azienda"}
Descrizione attuale: "${value}"

Riscrivila al massimo livello executive con impatto strategico.`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 600,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? value;
    res.json({ result });
  } catch (err) {
    req.log.error({ err }, "optimize-field error");
    res.status(500).json({ error: "Errore durante l'ottimizzazione del campo" });
  }
});

export default router;
