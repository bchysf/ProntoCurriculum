import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

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
      max_completion_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `Sei un esperto selezionatore del personale italiano con 20 anni di esperienza.
Il tuo compito è ottimizzare un CV per il mercato del lavoro italiano e i sistemi ATS.

LINGUA: Scrivi ESCLUSIVAMENTE in italiano corretto e professionale. Non tradurre letteralmente dall'inglese.
USA verbi all'indicativo passato prossimo o presente: "Ho guidato", "Ho sviluppato", "Gestisco", "Coordino".
NON usare forme come "Lancio e scala", "Livero", "Drivia" o altre traduzioni letterali di termini inglesi.
Usa termini italiani corretti: "Ho avviato", "Ho scalato", "Ho implementato", "Ho coordinato".

Restituisci SOLO questo JSON, nessun testo prima o dopo:
{
  "summary": "profilo professionale in italiano professionale: prima persona singola, verbi al presente o passato prossimo, risultati concreti, max 550 caratteri",
  "experiences": [
    { "id": "stessa id dell'originale", "desc": "descrizione in italiano professionale: inizia con verbo all'indicativo (es. 'Ho guidato', 'Ho sviluppato', 'Ho gestito'), includi risultati numerici reali dal testo originale, max 400 caratteri" }
  ],
  "skillsToAdd": ["skill1", "skill2"]
}

Regole aggiuntive:
- Mantieni le stesse id delle esperienze originali
- Non inventare fatti, risultati o ruoli non presenti nel CV originale
- Se una descrizione è già buona in italiano, migliorala senza stravolgerne il senso
- skillsToAdd: 3-5 competenze tecniche o metodologiche pertinenti, NON già presenti`,
        },
        {
          role: "user",
          content: `Ottimizza questo CV:\n\n${cvText}`,
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

export default router;
