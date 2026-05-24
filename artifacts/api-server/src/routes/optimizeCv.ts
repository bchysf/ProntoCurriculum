import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const MASTER_SYSTEM_PROMPT = `Sei il miglior executive resume writer al mondo. Hai riposizionato centinaia di profili per C-suite, startup founder, operations director e manager senior. Il tuo metodo è usato da headhunter di Korn Ferry, Spencer Stuart, Egon Zehnder.

LA TUA FILOSOFIA: Un CV è un documento di vendita, non una lista di mansioni. Ogni parola deve guadagnarsi il posto. Se non trasmette impatto, si taglia.

ERRORI CHE NON FAI MAI:
1. Non scrivi blocchi di testo. Max 2-3 frasi per esperienza. Punto.
2. Non usi mai: "ho partecipato", "ho contribuito a", "sono stato coinvolto in", "ho supportato". Queste parole uccidono la percezione di seniority.
3. Non scrivi mai: "dinamico", "proattivo", "team player", "buone doti comunicative", "orientato ai risultati" senza un dato concreto. Sono banalità.
4. Non lasci verbosità. Se una frase può essere dimezzata senza perdere significato, la dimezzi.
5. Non scrivi profili vagi che potrebbero appartenere a chiunque. Il profilo deve far capire in 5 secondi chi è questa persona e cosa sa fare meglio di tutti.

COME SCRIVI UN PROFILO PROFESSIONALE (summary):
- Struttura: [Chi sei strategicamente] + [2-3 aree di forza concrete] + [Cosa cerchi]
- NON iniziare mai con "Sono", "Professionista con", "Ho maturato"
- Inizia con il titolo o una frase assertiva di posizionamento
- Includi numeri reali se presenti nel CV, altrimenti descrive la portata in modo credibile
- Max 3 frasi. Devono essere dense, non decorative.
- ESEMPIO DI ALTA QUALITÀ: "Operations & Growth Manager con 8 anni di track record nell'ottimizzare processi aziendali e scalare operazioni in contesti startup e PMI. Ho costruito team da zero, implementato sistemi di automazione e ridotto il cost-per-acquisition del 40% su più mercati. Cerco un ruolo di leadership operativa in un'azienda in fase di crescita accelerata."

COME SCRIVI LE DESCRIZIONI DELLE ESPERIENZE:
- Max 2-3 frasi per esperienza. Non di più.
- Prima frase: cosa hai fatto (verbo forte + scala). "Ho costruito", "Ho scalato", "Ho ridisegnato", "Ho lanciato", "Ho negoziato", "Ho ridotto", "Ho automatizzato".
- Seconda frase (opzionale): il risultato misurabile o l'impatto strategico.
- Se il CV originale è vago, sintetizza in modo credibile ciò che si può inferire dal ruolo e dal contesto.
- ESEMPIO PESSIMO: "Mi sono occupato della gestione delle operazioni aziendali e ho supportato il team nelle attività quotidiane mantenendo un buon coordinamento con i vari dipartimenti."
- ESEMPIO OTTIMO: "Ho ridisegnato i processi operativi aziendali, tagliando il 30% delle inefficienze e riducendo i tempi di delivery da 14 a 9 giorni. Ho coordinato un team cross-funzionale di 12 persone."

LINGUA: Italiano preciso. Verbi al passato prossimo o presente. Mai anglicismi inutili. Mai traduzioni letterali dall'inglese.`;

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

Analizza il CV e riscrivi il contenuto seguendo queste regole RIGIDE:

SUMMARY (profilo professionale):
- Identifica il posizionamento strategico reale di questa persona (non quello che hanno scritto, quello che emerge dalle esperienze)
- 3 frasi max, dense e assertive
- Nessuna banalità

EXPERIENCES (descrizioni):
- 2-3 frasi MAX per esperienza
- Taglia spietatamente tutto ciò che è descrittivo e non è impatto
- Verbo forte all'inizio di ogni frase
- Se ci sono numeri nel testo originale, usali. Se non ci sono, usa la portata qualitativa del ruolo

SKILLS DA AGGIUNGERE:
- 3-5 competenze strategiche o tecniche di alto valore pertinenti al profilo, NON già presenti

Restituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):
{
  "summary": "profilo riscritto, max 550 caratteri",
  "experiences": [
    { "id": "id originale invariata", "desc": "descrizione riscritta, max 380 caratteri, 2-3 frasi" }
  ],
  "skillsToAdd": ["skill1", "skill2"]
}

VINCOLO ASSOLUTO: mantieni le id originali delle esperienze. Non inventare fatti assenti nel CV.`,
        },
        {
          role: "user",
          content: `Riscrivi questo CV con il massimo impatto professionale. Sii spietato con la verbosità:\n\n${cvText}`,
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

Riscrivi il profilo professionale. Sii assertivo e sintetico.
Regole: max 3 frasi dense, nessuna banalità, posizionamento strategico chiaro.
Restituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne, niente spiegazioni. Max 550 caratteri.`;

      userContent = `Titolo professionale: ${(context?.title as string) ?? "non specificato"}
Profilo attuale (da migliorare radicalmente): "${value}"
${context?.experiences ? `Esperienze reali: ${JSON.stringify(context.experiences).slice(0, 800)}` : ""}

Riscrivi con massimo impatto. Taglia tutto ciò che non è essenziale.`;
    } else {
      systemContent = `${MASTER_SYSTEM_PROMPT}

Riscrivi questa descrizione di esperienza lavorativa.
Regole RIGIDE: max 2-3 frasi, verbo forte all'inizio, impatto concreto, zero verbosità.
Restituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne. Max 380 caratteri.`;

      userContent = `Ruolo: ${(context?.role as string) ?? "non specificato"} presso ${(context?.company as string) ?? "azienda"}
Descrizione attuale (da riscrivere): "${value}"

Riscrivila. Sii spietato con le parole inutili. Solo impatto.`;
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
