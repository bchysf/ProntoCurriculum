import { Router, type IRouter } from 'express';
import { generateText } from '../lib/ai';

const router: IRouter = Router();

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

router.post('/parse-cv', async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || text.trim().length < 20) {
    res.status(400).json({ error: 'Testo CV mancante o troppo corto' });
    return;
  }

  try {
    const raw = await generateText(
      SYSTEM_PROMPT + '\n\nEstrai le informazioni da questo CV:\n\n' + text.slice(0, 8000),
      { maxTokens: 3000 },
    );
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, 'parse-cv error');
    res.status(500).json({ error: "Errore durante l'analisi del CV" });
  }
});

const LINKEDIN_SYSTEM_PROMPT = `Sei un esperto di analisi e conversione profili LinkedIn nel formato strutturato di curriculum vitae ad altissima precisione.
Estrai e trasforma le informazioni dal profilo o dall'esportazione LinkedIn fornita nel nostro esatto schema JSON di CVData:

{
  "firstName": "stringa (nome estratto o dedutto dall'intestazione)",
  "lastName": "stringa (cognome)",
  "title": "titolo professionale o headline LinkedIn (es. Senior Product Designer | SaaS & AI)",
  "email": "stringa",
  "phone": "stringa",
  "city": "luogo di lavoro o residenza (es. Milano, Italia)",
  "linkedin": "url pulito del profilo o username",
  "summary": "sezione Informazioni/About di LinkedIn, riassunta o ripulita in max 500 caratteri ad alto impatto",
  "experiences": [
    {
      "id": "exp1",
      "company": "nome azienda",
      "role": "ruolo ricoperto",
      "city": "città o da remoto",
      "from": "mese anno inizio (es. Set 2022)",
      "to": "mese anno fine (es. Presente oppure Ott 2024)",
      "desc": "descrizione puntata e focalizzata sui risultati operativi misurabili"
    }
  ],
  "education": [
    {
      "id": "edu1",
      "institution": "università o istituto scolastico",
      "degree": "facoltà, master o diploma di laurea",
      "grade": "voto finale o lode se menzionato",
      "from": "anno inizio",
      "to": "anno fine"
    }
  ],
  "skills": ["skill 1", "skill 2", "skill 3"],
  "languages": [
    {
      "id": "lang1",
      "name": "nome lingua es. Italiano o Inglese",
      "level": "livello CEFR completo es. C2 - Madrelingua oppure C1 - Avanzato"
    }
  ]
}

Regole di conversione LinkedIn:
1. Restituisci ESCLUSIVAMENTE l'oggetto JSON puro. Nessun testo prima o dopo, nessun tag di blocco di codice markdown (\`\`\`json).
2. Per le date di LinkedIn (es. "gen 2021 - Presente · 3 anni 4 mesi"), estrai solo la data di inizio ("Gen 2021") e di fine ("Presente") e rimuovi la durata calcolata ("3 anni 4 mesi").
3. Se l'utente ha incollato anche elenchi di certificazioni o progetti all'interno delle descrizioni lavorative, sintetizzale in modo nitido nei bullet point di "desc".
4. Estrai fino a 15 competenze tecniche (hard skills e soft skills) dal blocco Competenze del profilo.`;

router.post('/parse-cv/linkedin', async (req, res) => {
  const { profileText, profileUrl } = req.body as { profileText?: string; profileUrl?: string };

  if (!profileText && !profileUrl) {
    res.status(400).json({ error: 'Testo o URL del profilo LinkedIn mancante' });
    return;
  }

  const contentToAnalyze = profileText ? profileText : `URL profilo LinkedIn da analizzare: ${profileUrl}\n(Dedurre ed estrarre le informazioni professionali se disponibili dal contesto fornito o generare una struttura standard coerente col ruolo associato all'URL).`;

  if (contentToAnalyze.trim().length < 15) {
    res.status(400).json({ error: 'Il testo incollato da LinkedIn è troppo breve per essere analizzato correttamente.' });
    return;
  }

  try {
    const raw = await generateText(
      LINKEDIN_SYSTEM_PROMPT + '\n\nProfilo LinkedIn da analizzare e trasformare:\n\n' + contentToAnalyze.slice(0, 12000),
      { maxTokens: 3500 },
    );
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    res.json({ success: true, data: parsed });
  } catch (err) {
    req.log.error({ err }, 'parse-cv/linkedin error');
    res.status(500).json({ success: false, error: "Impossibile convertire il profilo LinkedIn. Assicurati di aver incollato il testo completo della sezione Esperienze e Informazioni." });
  }
});

export default router;
