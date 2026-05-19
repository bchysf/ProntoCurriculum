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
          content: `Sei un esperto recruiter italiano e specialista in ottimizzazione CV per sistemi ATS.
Ti viene fornito un CV in JSON. Restituisci SOLO un oggetto JSON con queste chiavi:

{
  "summary": "profilo professionale riscritto: più impattante, orientato ai risultati, ottimizzato ATS, usa verbi d'azione, max 550 caratteri",
  "experiences": [
    { "id": "stessa id dell'originale", "desc": "descrizione riscritta: include risultati quantitativi (%, numeri), verbi d'azione, impatto misurabile, max 400 caratteri" }
  ],
  "skillsToAdd": ["skill1", "skill2", "skill3"]
}

Regole:
- Restituisci SOLO il JSON, nessun testo prima o dopo
- Mantieni le stesse id delle esperienze originali
- Per summary: usa tono professionale e diretto, prima persona, verbi d'azione
- Per desc: inizia con verbo d'azione, includi almeno un risultato numerico se possibile
- Per skillsToAdd: suggerisci 3-5 competenze rilevanti basate sul ruolo/esperienze che non siano già presenti
- Se summary o esperienze sono già vuoti o minimi, crea contenuto plausibile basato sul titolo/ruolo`,
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
