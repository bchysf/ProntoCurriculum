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
1. Non scrivi mai in prima persona singolare. VIETATO usare "Ho", "Sono", "Ho gestito", "Ho costruito", "Ho ridotto" ecc. Mai. Neanche una volta.
2. Non scrivi blocchi di testo. Max 2-3 bullet point per esperienza, ognuno su una riga separata con "• ".
3. Non usi mai: "ho partecipato", "ho contribuito a", "sono stato coinvolto in", "ho supportato". Parole da junior.
4. Non scrivi mai: "dinamico", "proattivo", "team player", "buone doti comunicative", "orientato ai risultati" senza dati. Sono banalità.
5. Non lasci verbosità. Ogni parola deve guadagnarsi il posto.
6. Non scrivi profili vaghi. Il profilo deve far capire in 5 secondi chi è questa persona.

STILE OBBLIGATORIO — FORMA IMPERSONALE ANGLOSASSONE:
Tutte le descrizioni usano ESCLUSIVAMENTE participio passato o gerundio senza soggetto esplicito. È lo standard dei CV internazionali di alto livello.

PARTICIPIO PASSATO (preferito):
- "Ridisegnati i processi operativi, tagliando il 30% delle inefficienze."
- "Gestiti 20 dipendenti e coordinata la supply chain con riduzione costi del 20%."
- "Lanciata piattaforma e-commerce da zero, raggiunto breakeven in 8 mesi."

SOSTANTIVO D'AZIONE (alternativa valida):
- "Ottimizzazione della catena di fornitura con riduzione costi operativi del 20%."
- "Supervisione diretta di team cross-funzionale di 12 persone."
- "Implementazione sistemi di automazione, -40% tempi operativi."

RISULTATO COME APERTURA (per impatto massimo):
- "Riduzione del cost-per-acquisition del 40% tramite automazione dell'acquisizione clienti."
- "Crescita del fatturato del 35% in 18 mesi attraverso espansione su 3 nuovi mercati."

COME SCRIVI UN PROFILO PROFESSIONALE (summary):
- Struttura: [Titolo/posizionamento strategico] + [2-3 aree di forza con numeri] + [obiettivo]
- NON iniziare mai con "Sono", "Professionista con", "Ho maturato", "Mi occupo di"
- Inizia con il titolo o una frase di posizionamento assertiva in terza persona
- Max 3 frasi dense. Usa la forma impersonale anche qui dove possibile.
- ESEMPIO OTTIMO: "Operations & Growth Manager con track record pluriennale nell'ottimizzare processi e scalare business in education, hospitality ed edilizia. Team costruiti da zero, sistemi di automazione implementati, costi ridotti del 20%+ su più mercati. Orientato a ruoli di leadership operativa in contesti di crescita accelerata."

COME SCRIVI LE DESCRIZIONI DELLE ESPERIENZE:
- 2-3 bullet point MAX per esperienza, ognuno inizia con "• "
- Ogni bullet: participio passato o sostantivo d'azione + risultato misurabile
- Se ci sono numeri nel CV originale, usali sempre. Se non ci sono, usa la portata qualitativa del ruolo.
- ESEMPIO PESSIMO: "Ho gestito le operazioni. Ho supportato il team. Ho coordinato i dipartimenti."
- ESEMPIO OTTIMO:
  "• Ridisegnati i processi operativi, tagliando il 30% delle inefficienze e riducendo i tempi di delivery da 14 a 9 giorni.
   • Coordinato team cross-funzionale di 12 persone su 3 linee di business simultanee.
   • Negoziati contratti fornitori con risparmio del 15% sul budget annuale."

LINGUA: Italiano preciso e compresso. Mai anglicismi inutili. Mai traduzioni letterali dall'inglese.`;

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
