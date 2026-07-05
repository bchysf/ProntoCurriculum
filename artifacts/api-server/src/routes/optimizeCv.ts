import { Router, type IRouter } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router: IRouter = Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

const LANG_NAMES: Record<string, string> = {
  IT: 'italiano',
  EN: 'inglese (English)',
  FR: 'francese (Français)',
  DE: 'tedesco (Deutsch)',
  ES: 'spagnolo (Español)',
  PT: 'portoghese (Português)',
};

function buildMasterPrompt(lang: string): string {
  const langName = LANG_NAMES[lang] ?? 'italiano';
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

router.post('/optimize-cv', async (req, res) => {
  const { cvData, lang = 'IT' } = req.body as { cvData?: Record<string, unknown>; lang?: string };

  if (!cvData) {
    res.status(400).json({ error: 'CV data mancante' });
    return;
  }

  const langName = LANG_NAMES[lang] ?? 'italiano';
  const cvText = JSON.stringify(cvData, null, 2).slice(0, 7000);

  const existingLanguages = (
    (cvData.languages as Array<{ name?: string }> | undefined) ?? []
  )
    .map((l) => l.name)
    .filter(Boolean)
    .join(', ');
  const languageExclusionNote = existingLanguages
    ? `\nLINGUE GIÀ PRESENTI NEL CV (NON inserire nelle skill): ${existingLanguages}.`
    : '';

  const systemContent = `${buildMasterPrompt(lang)}\n\nAnalizza il CV e riscrivi il contenuto come farebbe l'HR manager che lo shortlisterebbe tra 1000 candidati:\n\nSUMMARY — il posizionamento che fa fermare il recruiter:\n- Chi è questa persona in una frase netta (titolo + settore + anni)\n- 2 prove concrete con numeri presi dal CV originale\n- Obiettivo professionale esplicito\n- Max 3 frasi. Zero banalità. Tutto in ${langName}.\n\nEXPERIENCES — solo risultati, mai mansioni:\n- 2-3 bullet MAX per ruolo, ognuno inizia con "• "\n- Ogni bullet: verbo forte al participio + risultato misurabile\n- Se esistono numeri nel testo originale (%, €, n. persone, mesi) usali obbligatoriamente\n- Tutto in ${langName}.\n\nSKILL CATEGORIES — competenze reali, pertinenti, verificabili:\n- 2-4 categorie pertinenti al profilo (es: Operazioni, Leadership, Digitale, Commerciale)\n- 3-6 skill per categoria\n- Solo skill reali che emergono dalle esperienze, NON skill inventate o generiche\n- ASSOLUTAMENTE VIETATO: includere lingue parlate (${existingLanguages || 'italiano, inglese, francese ecc.'}) — le lingue hanno già la loro sezione separata nel CV${languageExclusionNote}\n- Nomi categorie in ${langName}, skill in ${langName} salvo termini tecnici universali\n\nRestituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):\n{\n  "summary": "profilo riscritto in ${langName}, max 550 caratteri",\n  "experiences": [\n    { "id": "id originale invariata", "desc": "descrizione riscritta in ${langName}, max 380 caratteri, 2-3 bullet" }\n  ],\n  "skillCategories": [\n    { "name": "nome categoria in ${langName}", "skills": ["skill1", "skill2", "skill3"] }\n  ]\n}\n\nVINCOLI ASSOLUTI: mantieni le id originali delle esperienze. Non inventare fatti o numeri assenti nel CV.`;

  const userContent = `Ottimizza questo CV come farebbe l'HR manager che deve scegliere 10 persone su 1000. Sii spietato: solo impatto misurabile, niente mansioni, niente lingue nelle competenze.\n\n${cvText}`;

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' });
    const result = await model.generateContent(systemContent + '\n\n' + userContent);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, 'optimize-cv error');
    res.status(500).json({ error: "Errore durante l'ottimizzazione del CV" });
  }
});

router.post('/optimize-field', async (req, res) => {
  const { field, value, context, lang = 'IT', mode } = req.body as {
    field?: 'summary' | 'exp' | 'exp-tips';
    value?: string;
    context?: Record<string, unknown>;
    lang?: string;
    mode?: string;
  };

  if (!field || (!value && field !== 'exp-tips')) {
    res.status(400).json({ error: 'Parametri mancanti' });
    return;
  }

  const langName = LANG_NAMES[lang] ?? 'italiano';

  try {
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash' });

    if (field === 'exp-tips') {
      const role = (context?.role as string) ?? 'non specificato';
      const company = (context?.company as string) ?? 'azienda';
      const desc = (value ?? '').trim();

      const prompt = `Sei un HR Director senior. Hai appena letto la descrizione di un'esperienza lavorativa su un CV.\nIl tuo compito è dare 3 suggerimenti SPECIFICI e AZIONABILI per migliorarla.\nI suggerimenti devono riguardare: dati mancanti (numeri, %, budget, team size), risultati non quantificati, keyword di settore assenti, o formulazioni deboli.\nOgni suggerimento è una frase breve e diretta, in ${langName}, che dice esattamente cosa aggiungere o cambiare.\nRestituisci SOLO un array JSON con 3 stringhe. Zero testo prima o dopo. Zero markdown.\nEsempio: ["Aggiungi il numero di persone gestite — es. 'Coordinati 8 specialisti'","Specifica il risparmio o budget — es. 'Budget operativo €1.2M'","Cita il risultato finale — es. 'Progetto completato 2 mesi prima della scadenza'"]\n\nRuolo: ${role} presso ${company}\nDescrizione attuale: "${desc}"\n\nDammi 3 suggerimenti specifici per migliorare questa descrizione con dati verificabili e risultati concreti.`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const tips = JSON.parse(jsonStr) as string[];
      res.json({ tips });
      return;
    }

    let prompt: string;

    if (field === 'summary') {
      prompt = `${buildMasterPrompt(lang)}\n\nRiscrivi il profilo professionale in ${langName}. Sii assertivo e sintetico.\nRegole: max 3 frasi dense, nessuna banalità, posizionamento strategico chiaro.\nTutto il testo deve essere in ${langName}.\nRestituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne, niente spiegazioni. Max 550 caratteri.\n\nTitolo professionale: ${(context?.title as string) ?? 'non specificato'}\nProfilo attuale (da migliorare radicalmente): "${value}"\n${context?.experiences ? `Esperienze reali: ${JSON.stringify(context.experiences).slice(0, 800)}` : ''}\n\nRiscrivi con massimo impatto in ${langName}. Taglia tutto ciò che non è essenziale.`;
    } else if (mode === 'rephrase') {
      prompt = `${buildMasterPrompt(lang)}\n\nQuesta descrizione di esperienza è già stata ottimizzata. Scrivi una VARIAZIONE in ${langName}:\n- Usa parole diverse, diversa enfasi, diverso ordine dei bullet\n- Mantieni gli stessi fatti, numeri e risultati — non inventarne di nuovi\n- Stesso livello di impatto, stesso stile impersonale\n- Max 2-3 bullet con "• ", max 380 caratteri totali\nRestituisci SOLO il testo alternativo. Niente JSON, niente virgolette esterne.\n\nRuolo: ${(context?.role as string) ?? 'non specificato'} presso ${(context?.company as string) ?? 'azienda'}\nVersione attuale (da variare): "${value ?? ''}"\n\nScrivi una variazione diversa ma ugualmente efficace in ${langName}.`;
    } else {
      prompt = `${buildMasterPrompt(lang)}\n\nRiscrivi questa descrizione di esperienza lavorativa in ${langName}.\nRegole RIGIDE: max 2-3 bullet con "• ", verbo forte al participio, impatto concreto, zero verbosità.\nTutto il testo deve essere in ${langName}.\nRestituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne. Max 380 caratteri.\n\nRuolo: ${(context?.role as string) ?? 'non specificato'} presso ${(context?.company as string) ?? 'azienda'}\nDescrizione attuale (da riscrivere): "${value ?? ''}"\n\nRiscrivila in ${langName}. Sii spietato con le parole inutili. Solo impatto.`;
    }

    const result = await model.generateContent(prompt);
    const resultText = result.response.text().trim() ?? (value ?? '');
    res.json({ result: resultText });
  } catch (err) {
    req.log.error({ err }, 'optimize-field error');
    res.status(500).json({ error: "Errore durante l'ottimizzazione del campo" });
  }
});

export default router;
