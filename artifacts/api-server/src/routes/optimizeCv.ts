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
  return `Sei un HR Director senior con 20 anni di esperienza. Ogni giorno ricevi 1000 CV per 10 posizioni. In 6 secondi decidi: shortlist o cestino. Hai allenato questo istinto per anni.

HAI VISTO DI TUTTO — E SAI ESATTAMENTE COSA NON FUNZIONA:
- CV con mansioni elencate invece di risultati → cestino immediato
- Summary vaghe ("professionista dinamico e proattivo") → cestino immediato
- Skill inventate o eccessivamente generiche → red flag
- Lingue elencate due volte (nella sezione skill E nella sezione lingue) → sciatteria → cestino
- Competenze riempitive senza proof → cestino
- Muri di testo → nessuno li legge

COSA TI FA FERMARE E LEGGERE:
- Numeri reali: "ridotto costi del 20%", "gestito team di 20", "scala da 2 a 50 FTE"
- Posizionamento netto: capisci chi è questa persona in 10 parole
- Bullet concisi: impatto > 3 parole + numero o esito
- Profilo che risponde a: chi sei, cosa sai fare, che valore porti, dove vuoi andare

IL CV PERFETTO CHE SHORTLISTI:
1. SUMMARY: 3 frasi. Posizionamento → 2-3 prove concrete con numeri → obiettivo chiaro.
2. ESPERIENZE: 2-3 bullet per ruolo. Mai mansioni. Solo risultati. Numeri ovunque possibile.
3. COMPETENZE: Solo competenze reali e verificabili, organizzate per area. MAI lingue qui — le lingue hanno la loro sezione separata.
4. LINGUE: Sezione separata, già compilata dall'utente. Non toccarla. Non duplicarla nelle competenze.

LINGUA DI OUTPUT OBBLIGATORIA: ${langName}.
Tutto il testo che generi — summary, descrizioni esperienze, nomi delle categorie skill, nomi delle singole skill — deve essere ESCLUSIVAMENTE in ${langName}.
Regola assoluta: zero parole in altre lingue, salvo termini tecnici universalmente accettati (es. React, TypeScript, Kubernetes, Scrum, KPI, P&L, SaaS, CRM, ERP).
Soft skill e titoli di categoria devono essere scritti nella lingua scelta.

ERRORI CHE NON FAI MAI:
1. Non scrivi mai in prima persona. VIETATO: "Ho", "Sono", "Ho gestito", "Ho costruito".
2. Non scrivi blocchi di testo. Max 3 bullet per esperienza, con "• ".
3. Non usi mai: "ho partecipato", "ho contribuito", "sono stato coinvolto". Parole da junior.
4. Non scrivi: "dinamico", "proattivo", "team player" senza dati numerici a supporto.
5. Non metti lingue (Inglese, Italiano, Francese ecc.) nelle skill — esistono già nella sezione lingue.
6. Non inventi fatti o numeri assenti nel CV originale.

STILE OBBLIGATORIO — FORMA IMPERSONALE:
Tutte le descrizioni: participio passato o sostantivo d'azione senza soggetto.
- "Ridisegnati i processi operativi, tagliando il 30% delle inefficienze."
- "Gestiti 20 dipendenti, coordinata supply chain con riduzione costi del 20%."
- "Lanciata piattaforma da zero, raggiunto breakeven in 8 mesi."

PULIZIA OBBLIGATORIA:
- Non includere MAI "Presente" o "Present" come testo isolato nei campi.
- Non generare artefatti di formattazione o date orfane.`;
}

router.post("/optimize-cv", async (req, res) => {
  const { cvData, lang = "IT" } = req.body as { cvData?: Record<string, unknown>; lang?: string };

  if (!cvData) {
    res.status(400).json({ error: "CV data mancante" });
    return;
  }

  const langName = LANG_NAMES[lang] ?? "italiano";
  const cvText = JSON.stringify(cvData, null, 2).slice(0, 7000);

  // Extract existing languages so the AI knows not to duplicate them in skills
  const existingLanguages = (
    (cvData.languages as Array<{ name?: string }> | undefined) ?? []
  )
    .map((l) => l.name)
    .filter(Boolean)
    .join(", ");
  const languageExclusionNote = existingLanguages
    ? `\nLINGUE GIÀ PRESENTI NEL CV (NON inserire nelle skill): ${existingLanguages}.`
    : "";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `${buildMasterPrompt(lang)}

Analizza il CV e riscrivi il contenuto come farebbe l'HR manager che lo shortlisterebbe tra 1000 candidati:

SUMMARY — il posizionamento che fa fermare il recruiter:
- Chi è questa persona in una frase netta (titolo + settore + anni)
- 2 prove concrete con numeri presi dal CV originale
- Obiettivo professionale esplicito
- Max 3 frasi. Zero banalità. Tutto in ${langName}.

EXPERIENCES — solo risultati, mai mansioni:
- 2-3 bullet MAX per ruolo, ognuno inizia con "• "
- Ogni bullet: verbo forte al participio + risultato misurabile
- Se esistono numeri nel testo originale (%, €, n. persone, mesi) usali obbligatoriamente
- Tutto in ${langName}.

SKILL CATEGORIES — competenze reali, pertinenti, verificabili:
- 2-4 categorie pertinenti al profilo (es: Operazioni, Leadership, Digitale, Commerciale)
- 3-6 skill per categoria
- Solo skill reali che emergono dalle esperienze, NON skill inventate o generiche
- ASSOLUTAMENTE VIETATO: includere lingue parlate (${existingLanguages || "italiano, inglese, francese ecc."}) — le lingue hanno già la loro sezione separata nel CV${languageExclusionNote}
- Nomi categorie in ${langName}, skill in ${langName} salvo termini tecnici universali

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "summary": "profilo riscritto in ${langName}, max 550 caratteri",
  "experiences": [
    { "id": "id originale invariata", "desc": "descrizione riscritta in ${langName}, max 380 caratteri, 2-3 bullet" }
  ],
  "skillCategories": [
    { "name": "nome categoria in ${langName}", "skills": ["skill1", "skill2", "skill3"] }
  ]
}

VINCOLI ASSOLUTI: mantieni le id originali delle esperienze. Non inventare fatti o numeri assenti nel CV.`,
        },
        {
          role: "user",
          content: `Ottimizza questo CV come farebbe l'HR manager che deve scegliere 10 persone su 1000. Sii spietato: solo impatto misurabile, niente mansioni, niente lingue nelle competenze.\n\n${cvText}`,
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
