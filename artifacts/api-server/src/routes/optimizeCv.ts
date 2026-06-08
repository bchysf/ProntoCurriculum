import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const LANG_NAMES: Record<string, string> = {
  IT: "italiano",
  EN: "inglese (English)",
  FR: "francese (Français)",
  DE: "tedesco (Deutsch)",
  ES: "spagnolo (Español)",
  PT: "portoghese (Português)",
};

function buildMasterPrompt(lang: string): string {
  const langName = LANG_NAMES[lang] ?? "italiano";
  return `Sei il miglior executive resume writer al mondo. Hai riposizionato centinaia di profili per C-suite, startup founder, operations director e manager senior. Il tuo metodo è usato da headhunter di Korn Ferry, Spencer Stuart, Egon Zehnder.

LA TUA FILOSOFIA: Un CV è un documento di vendita, non una lista di mansioni. Ogni parola deve guadagnarsi il posto. Se non trasmette impatto, si taglia.

LINGUA DI OUTPUT OBBLIGATORIA: ${langName}.
Tutto il testo che generi — summary, descrizioni esperienze, nomi delle categorie skill, nomi delle singole skill — deve essere ESCLUSIVAMENTE in ${langName}.
Regola assoluta: zero parole in altre lingue, incluso l'inglese, salvo termini tecnici universalmente accettati e non traducibili (es. React, TypeScript, Kubernetes, Scrum, KPI, P&L, SaaS).
Soft skill, competenze trasversali e titoli di categoria devono essere scritti nella lingua scelta.
Esempi in italiano: "Gestione del cambiamento", "Pianificazione strategica", "Comunicazione efficace".
Esempi in inglese: "Change Management", "Strategic Planning", "Effective Communication".

ERRORI CHE NON FAI MAI:
1. Non scrivi mai in prima persona singolare. VIETATO usare "Ho", "Sono", "Ho gestito", "Ho costruito", "Ho ridotto" ecc.
2. Non scrivi blocchi di testo. Max 2-3 bullet point per esperienza, ognuno su una riga separata con "• ".
3. Non usi mai: "ho partecipato", "ho contribuito a", "sono stato coinvolto in". Parole da junior.
4. Non scrivi mai: "dinamico", "proattivo", "team player", "buone doti comunicative" senza dati.
5. Non lasci verbosità. Ogni parola deve guadagnarsi il posto.
6. Non scrivi profili vaghi.

STILE OBBLIGATORIO — FORMA IMPERSONALE:
Tutte le descrizioni usano ESCLUSIVAMENTE participio passato o gerundio senza soggetto esplicito.
- "Ridisegnati i processi operativi, tagliando il 30% delle inefficienze."
- "Gestiti 20 dipendenti e coordinata la supply chain con riduzione costi del 20%."
- "Lanciata piattaforma e-commerce da zero, raggiunto breakeven in 8 mesi."

COME SCRIVI IL PROFILO PROFESSIONALE:
- Struttura: [Titolo/posizionamento strategico] + [2-3 aree di forza con numeri] + [obiettivo]
- NON iniziare mai con "Sono", "Professionista con", "Ho maturato"
- Max 3 frasi dense. Forma impersonale.

COME SCRIVI LE DESCRIZIONI DELLE ESPERIENZE:
- 2-3 bullet point MAX per esperienza, ognuno inizia con "• "
- Ogni bullet: participio passato o sostantivo d'azione + risultato misurabile
- Se ci sono numeri nel CV originale, usali sempre.

PULIZIA OBBLIGATORIA:
- Nei campi di testo non includere MAI la parola "Presente" o "Present" isolata.
- Non generare artefatti di formattazione come date orfane o testo incomprensibile.`;
}

router.post("/optimize-cv", async (req, res) => {
  const { cvData, lang = "IT" } = req.body as { cvData?: Record<string, unknown>; lang?: string };

  if (!cvData) {
    res.status(400).json({ error: "CV data mancante" });
    return;
  }

  const langName = LANG_NAMES[lang] ?? "italiano";
  const cvText = JSON.stringify(cvData, null, 2).slice(0, 7000);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `${buildMasterPrompt(lang)}

Analizza il CV e riscrivi il contenuto seguendo queste regole RIGIDE:

SUMMARY (profilo professionale):
- Identifica il posizionamento strategico reale di questa persona
- 3 frasi max, dense e assertive
- Nessuna banalità
- Tutto in ${langName}

EXPERIENCES (descrizioni):
- 2-3 frasi MAX per esperienza
- Taglia spietatamente tutto ciò che è descrittivo e non è impatto
- Se ci sono numeri nel testo originale, usali
- Tutto in ${langName}

CATEGORIZZAZIONE DELLE COMPETENZE:
- NON restituire un array piatto di skill
- Organizza in 2-4 categorie pertinenti al profilo
- I nomi delle categorie devono essere in ${langName}
- Le skill devono essere in ${langName} (salvo termini tecnici universali)
- 3-6 skill per categoria
- Esempi categorie (${langName}): in italiano → "Competenze Tecniche", "Competenze Manageriali", "Competenze Trasversali"; in inglese → "Technical Skills", "Management Skills", "Soft Skills"

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "summary": "profilo riscritto in ${langName}, max 550 caratteri",
  "experiences": [
    { "id": "id originale invariata", "desc": "descrizione riscritta in ${langName}, max 380 caratteri, 2-3 frasi" }
  ],
  "skillCategories": [
    { "name": "nome categoria in ${langName}", "skills": ["skill1", "skill2", "skill3"] }
  ]
}

VINCOLO ASSOLUTO: mantieni le id originali delle esperienze. Non inventare fatti assenti nel CV.`,
        },
        {
          role: "user",
          content: `Riscrivi questo CV con il massimo impatto professionale in ${langName}. Sii spietato con la verbosità:\n\n${cvText}`,
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
  const { field, value, context, lang = "IT" } = req.body as {
    field?: "summary" | "exp";
    value?: string;
    context?: Record<string, unknown>;
    lang?: string;
  };

  if (!field || !value) {
    res.status(400).json({ error: "Parametri mancanti" });
    return;
  }

  const langName = LANG_NAMES[lang] ?? "italiano";

  try {
    let systemContent: string;
    let userContent: string;

    if (field === "summary") {
      systemContent = `${buildMasterPrompt(lang)}

Riscrivi il profilo professionale in ${langName}. Sii assertivo e sintetico.
Regole: max 3 frasi dense, nessuna banalità, posizionamento strategico chiaro.
Tutto il testo deve essere in ${langName}.
Restituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne, niente spiegazioni. Max 550 caratteri.`;

      userContent = `Titolo professionale: ${(context?.title as string) ?? "non specificato"}
Profilo attuale (da migliorare radicalmente): "${value}"
${context?.experiences ? `Esperienze reali: ${JSON.stringify(context.experiences).slice(0, 800)}` : ""}

Riscrivi con massimo impatto in ${langName}. Taglia tutto ciò che non è essenziale.`;
    } else {
      systemContent = `${buildMasterPrompt(lang)}

Riscrivi questa descrizione di esperienza lavorativa in ${langName}.
Regole RIGIDE: max 2-3 frasi, verbo forte all'inizio, impatto concreto, zero verbosità.
Tutto il testo deve essere in ${langName}.
Restituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne. Max 380 caratteri.`;

      userContent = `Ruolo: ${(context?.role as string) ?? "non specificato"} presso ${(context?.company as string) ?? "azienda"}
Descrizione attuale (da riscrivere): "${value}"

Riscrivila in ${langName}. Sii spietato con le parole inutili. Solo impatto.`;
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
