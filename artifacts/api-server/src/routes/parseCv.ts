import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Sei un assistente specializzato nell'analisi di CV italiani ed europei.
Estrai le informazioni dal testo del CV fornito e restituisci SOLO un oggetto JSON valido con questa struttura esatta:

{
  "firstName": "stringa",
  "lastName": "stringa",
  "title": "titolo professionale principale (es. Operations Manager, Software Engineer)",
  "email": "stringa",
  "phone": "stringa",
  "city": "città di residenza o base principale",
  "linkedin": "solo il path linkedin.com/in/username, senza https://",
  "summary": "profilo professionale, max 500 caratteri",
  "experiences": [
    {
      "id": "uuid_unico",
      "company": "nome azienda",
      "role": "ruolo/titolo",
      "city": "città",
      "from": "mese e anno inizio es. Nov 2024",
      "to": "mese e anno fine es. Mar 2020 oppure Presente",
      "desc": "descrizione responsabilità e risultati, max 400 caratteri"
    }
  ],
  "education": [
    {
      "id": "uuid_unico",
      "institution": "nome istituto/università",
      "degree": "titolo di studio",
      "grade": "voto o lode se presente",
      "from": "anno inizio",
      "to": "anno fine"
    }
  ],
  "skills": ["skill1", "skill2"],
  "languages": [
    {
      "id": "uuid_unico",
      "name": "nome lingua",
      "level": "livello CEFR completo es. C2 - Madrelingua oppure C1 - Avanzato"
    }
  ]
}

Regole:
- Restituisci SOLO il JSON, nessun testo prima o dopo
- Se un campo non è presente nel CV, usa stringa vuota "" o array vuoto []
- Per i livelli lingua usa: C2 - Madrelingua, C1 - Avanzato, B2 - Intermedio superiore, B1 - Intermedio, A2 - Base, A1 - Principiante
- Per le esperienze usa id univoci come "exp1", "exp2" ecc.
- Per l'istruzione usa id univoci come "edu1", "edu2" ecc.
- Per le lingue usa id univoci come "lang1", "lang2" ecc.
- Il campo "title" deve essere solo il titolo professionale, NON includere il nome della persona`;

router.post("/parse-cv", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || text.trim().length < 20) {
    res.status(400).json({ error: "Testo CV mancante o troppo corto" });
    return;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Estrai le informazioni da questo CV:\n\n${text.slice(0, 8000)}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "parse-cv error");
    res.status(500).json({ error: "Errore durante l'analisi del CV" });
  }
});

export default router;
