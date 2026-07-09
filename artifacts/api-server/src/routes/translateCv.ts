import { Router, type IRouter, type Request, type Response } from 'express';
import { generateText } from '../lib/ai';

const router: IRouter = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  IT: 'Italiano',
  EN: 'English',
  FR: 'Français',
  DE: 'Deutsch',
  ES: 'Español',
  PT: 'Português',
};

const ALLOWED_LANGUAGES = new Set(Object.keys(LANGUAGE_NAMES));

interface CvDataInput {
  title?: string;
  summary?: string;
  experiences?: { id?: string; role?: string; desc?: string }[];
  education?: { id?: string; degree?: string }[];
  skills?: string[];
  languages?: { id?: string; name?: string; level?: string }[];
  [key: string]: unknown;
}

interface TranslatablePayload {
  title: string;
  summary: string;
  experiences: { id: string; role: string; desc: string }[];
  education: { id: string; degree: string }[];
  skills: string[];
  languages: { id: string; name: string; level: string }[];
}

router.post('/translate-cv', async (req: Request, res: Response) => {
  const { cvData, targetLanguage } = req.body as {
    cvData?: CvDataInput;
    targetLanguage?: unknown;
  };

  if (!cvData || typeof cvData !== 'object') {
    res.status(400).json({ error: 'cvData mancante' });
    return;
  }

  if (
    !targetLanguage ||
    typeof targetLanguage !== 'string' ||
    !ALLOWED_LANGUAGES.has(targetLanguage.toUpperCase())
  ) {
    res.status(400).json({ error: `Lingua non supportata. Usa: ${[...ALLOWED_LANGUAGES].join(', ')}` });
    return;
  }

  const lang = targetLanguage.toUpperCase();
  const langName = LANGUAGE_NAMES[lang];

  const payload: TranslatablePayload = {
    title: (cvData.title as string) ?? '',
    summary: (cvData.summary as string) ?? '',
    experiences: (cvData.experiences ?? []).map((e, i) => ({
      id: (e.id as string) ?? String(i),
      role: (e.role as string) ?? '',
      desc: (e.desc as string) ?? '',
    })),
    education: (cvData.education ?? []).map((e, i) => ({
      id: (e.id as string) ?? String(i),
      degree: (e.degree as string) ?? '',
    })),
    skills: (cvData.skills as string[]) ?? [],
    languages: (cvData.languages ?? []).map((l, i) => ({
      id: (l.id as string) ?? String(i),
      name: (l.name as string) ?? '',
      level: (l.level as string) ?? '',
    })),
  };

  const prompt = `Sei un traduttore professionale specializzato in CV e documenti aziendali.\n\nLINGUA TARGET: ${langName} (codice: ${lang})\n\nRicevi un JSON con SOLO i campi da tradurre. Traduci TUTTI i valori stringa non vuoti:\n- "title": titolo professionale\n- "summary": profilo professionale\n- "experiences[].role": titolo del ruolo\n- "experiences[].desc": descrizione mansioni (mantieni bullet point "• " se presenti)\n- "education[].degree": titolo di studio\n- "skills[]": ogni competenza tecnica o soft skill\n- "languages[].name": nome della lingua (es. "Inglese" → "English" in EN, "Anglais" in FR)\n- "languages[].level": livello CEFR nella lingua target (es. "C1 - Avanzato" → "C1 - Advanced" in EN)\n\nSTILE:\n- Forma impersonale professionale (zero prima persona singolare)\n- Per l'inglese: imperativo/participio passato (Led, Managed, Reduced)\n- Per le altre lingue: stile participio passato senza soggetto\n- Mantieni bullet "• " e numeri/percentuali invariati\n\nVINCOLO ASSOLUTO: restituisci SOLO il JSON con la stessa struttura e gli stessi "id". Zero testo extra, zero markdown.\n\nTraduci in ${langName}:\n\n${JSON.stringify(payload)}`;

  try {
    const raw = await generateText(prompt, { maxTokens: 3000 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const translated = JSON.parse(jsonStr) as TranslatablePayload;

    const translated_result: CvDataInput = {
      ...cvData,
      title: translated.title ?? cvData.title,
      summary: translated.summary ?? cvData.summary,
      experiences: (cvData.experiences ?? []).map((exp, i) => {
        const tr = translated.experiences?.find(e => e.id === ((exp.id as string) ?? String(i)));
        if (!tr) return exp;
        return { ...exp, role: tr.role || exp.role, desc: tr.desc || exp.desc };
      }),
      education: (cvData.education ?? []).map((edu, i) => {
        const tr = translated.education?.find(e => e.id === ((edu.id as string) ?? String(i)));
        if (!tr) return edu;
        return { ...edu, degree: tr.degree || edu.degree };
      }),
      skills: translated.skills?.length ? translated.skills : cvData.skills,
      languages: (cvData.languages ?? []).map((lang2, i) => {
        const tr = translated.languages?.find(l => l.id === ((lang2.id as string) ?? String(i)));
        if (!tr) return lang2;
        return { ...lang2, name: tr.name || lang2.name, level: tr.level || lang2.level };
      }),
    };

    res.json({ cvData: translated_result });
  } catch (err) {
    req.log.error({ err }, 'translate-cv error');
    res.status(500).json({ error: 'Errore durante la traduzione del CV. Riprova tra qualche secondo.' });
  }
});

router.post('/translate-field', async (req: Request, res: Response) => {
  const { field, value, targetLanguage, context } = req.body as {
    field?: 'summary' | 'exp-desc' | 'title' | 'degree';
    value?: string;
    targetLanguage?: unknown;
    context?: Record<string, unknown>;
  };

  if (!field || !value || typeof value !== 'string') {
    res.status(400).json({ error: 'Parametri mancanti' });
    return;
  }

  if (
    !targetLanguage ||
    typeof targetLanguage !== 'string' ||
    !ALLOWED_LANGUAGES.has(targetLanguage.toUpperCase())
  ) {
    res.status(400).json({ error: 'Lingua non supportata' });
    return;
  }

  const lang = targetLanguage.toUpperCase();
  const langName = LANGUAGE_NAMES[lang];

  const fieldDescriptions: Record<string, string> = {
    summary: 'profilo professionale (summary) di un CV',
    'exp-desc': "descrizione di un'esperienza lavorativa in un CV",
    title: 'titolo professionale di un CV',
    degree: 'titolo di studio di un CV',
  };

  const styleNotes: Record<string, string> = {
    summary: 'Max 3 frasi dense. Forma impersonale professionale. Inizia con il titolo/posizionamento.',
    'exp-desc': 'Mantieni i bullet point "• ". Forma impersonale (participio passato). Max 380 caratteri.',
    title: 'Breve, 2-5 parole. Solo il titolo professionale.',
    degree: 'Solo il nome del titolo di studio tradotto.',
  };

  const contextText = context?.role
    ? `Ruolo: ${context.role as string} @ ${(context.company as string) ?? 'azienda'}\nTesto originale: "${value}"`
    : `Testo originale: "${value}"`;

  const prompt = `Sei un traduttore professionale specializzato in CV di alto livello.\nTraduci in ${langName} il seguente ${fieldDescriptions[field] ?? 'testo di un CV'}.\n${styleNotes[field] ?? ''}\nStile: zero prima persona, forma impersonale professionale standard dei CV internazionali.\nRestituisci SOLO il testo tradotto. Niente JSON, niente virgolette esterne, niente spiegazioni.\n\n${contextText}`;

  try {
    const resultText = (await generateText(prompt)) || value;
    res.json({ result: resultText });
  } catch (err) {
    req.log.error({ err }, 'translate-field error');
    res.status(500).json({ error: 'Errore durante la traduzione. Riprova.' });
  }
});

export default router;
