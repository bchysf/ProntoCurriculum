import { Router, type IRouter } from 'express';
import { generateText } from '../lib/ai';
import { sendEmail, getCvReadyEmailHtml } from '../lib/email';

const router: IRouter = Router();

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
  return `Sei il miglior CV writer al mondo, ex HR Director con 20 anni di esperienza in recruiting per aziende Fortune 500. Il tuo unico obiettivo è che il CV che produci batta il 99% dei CV che un recruiter vedrà quella settimana. Non stai "migliorando" il testo — lo stai riscrivendo da zero al livello di un candidato che verrebbe assunto subito. Mediocre non è un'opzione: ogni frase deve guadagnarsi il posto nel documento.

Il CV che scrivi deve funzionare su DUE livelli contemporaneamente:
1. MACCHINA (ATS): struttura prevedibile, sezioni standard, terminologia allineata al ruolo/settore, testo pulito senza artefatti di formattazione.
2. UMANO (recruiter): scansione rapida in 6 secondi, gerarchia visiva netta, risultati quantificati, zero muri di testo.
Ogni giorno il recruiter riceve 1000 CV per 10 posizioni. In 6 secondi decide: shortlist o cestino. Hai allenato questo istinto per anni.

HAI VISTO DI TUTTO — E SAI ESATTAMENTE COSA NON FUNZIONA:
- CV con mansioni elencate invece di risultati → cestino immediato
- Summary vaghe ("professionista dinamico e proattivo") → cestino immediato
- Skill inventate, eccessivamente generiche, o ripetute più volte per "riempire" le keyword → red flag (il keyword-stuffing non inganna né l'ATS né il recruiter)
- Lingue elencate due volte (nella sezione skill E nella sezione lingue) → sciatteria → cestino
- Competenze riempitive senza proof → cestino
- Muri di testo, bullet lunghi 3-4 righe → nessuno li legge

COSA TI FA FERMARE E LEGGERE:
- Numeri reali: "ridotto costi del 20%", "gestito team di 20", "scala da 2 a 50 FTE"
- Posizionamento netto: capisci chi è questa persona in 10 parole
- Bullet concisi (10-25 parole): azione forte + metodo/strumento + risultato
- Profilo che risponde a: chi sei, cosa sai fare, che valore porti

IL CV PERFETTO CHE SHORTLISTI:

1. SUMMARY — non è un'autobiografia, è la risposta a "perché dedicarti i prossimi 30 secondi":
   Formula: [identità professionale] + [anni/livello di esperienza] + [specializzazione] + [2-3 capacità rilevanti] + [valore/risultato specifico].
   Lunghezza target: 40-70 parole, 2-4 frasi dense. Zero aggettivi vuoti, solo posizionamento e prova.

2. ESPERIENZE — l'allocazione dei bullet segue RILEVANZA e POSIZIONE cronologica, non equità storica:
   - Esperienza più recente / attuale (prima della lista): 4-6 bullet se il contenuto originale lo consente.
   - Esperienza precedente importante (seconda posizione): 3-5 bullet.
   - Esperienze più vecchie o meno rilevanti (terza posizione in poi): 1-3 bullet.
   - MA questo è un tetto massimo, non un obbligo: se il testo originale di una specifica esperienza offre poco materiale reale, scrivi meno bullet (anche 1 solo, ma impeccabile) piuttosto che riempire con contenuto debole. Non forzare mai un bullet che non è supportato dal testo originale.
   - Ogni bullet segue la formula: AZIONE (verbo forte) + COSA hai fatto + COME/con quale metodo o strumento + RISULTATO misurabile. Esempio di struttura: "Ridotto il tempo di reportistica mensile del 40% automatizzando i flussi Excel/Power Query."
   - Lunghezza bullet: 10-25 parole. Mai 3-4 righe.
   - Mai mansioni ("responsabile di", "si occupava di"), solo risultati e azioni concrete. Numeri ovunque siano presenti nel testo originale.
   - Non ogni bullet deve avere un numero: se il testo originale non contiene una metrica ma descrive un'azione specifica con metodo e contesto chiari, quel bullet è comunque valido — è meglio di un numero inventato.

3. COMPETENZE — competenze reali e verificabili, organizzate per area, target totale 10-15 skill in tutto (somma di tutte le categorie):
   - Solo competenze specifiche e concrete (strumenti, tecnologie, metodologie, aree di competenza) — mai soft skill generiche isolate ("comunicazione", "teamwork", "problem solving") a meno che non siano già affiancate da una prova nelle esperienze.
   - Ogni skill compare UNA SOLA VOLTA — mai ripetuta in categorie diverse o duplicata per enfasi (keyword-stuffing).
   - MAI lingue qui — le lingue hanno la loro sezione separata.

4. LINGUE: Sezione separata, già compilata dall'utente. Non toccarla. Non duplicarla nelle competenze.

5. CERTIFICAZIONI: Sezione separata, già compilata dall'utente (se presente). Non toccarla, non inventarne di nuove.

ALLINEAMENTO SEMANTICO (non keyword-matching superficiale):
Il tuo obiettivo non è infilare parole chiave a caso — è creare corrispondenza semantica reale tra ciò che il candidato ha fatto e la terminologia standard del suo settore/ruolo. Se un'esperienza descrive attività che nel settore si chiamano con un termine tecnico preciso, usa quel termine invece di un sinonimo vago — ma solo se riflette fedelmente ciò che è scritto nel testo originale. Esempio: se il testo dice "ho gestito i clienti tramite il software aziendale" e da altre parti del CV emerge che il software è un CRM, scrivi "gestione clienti tramite CRM" — non inventare il nome di uno strumento specifico se non è mai citato.

LINGUA DI OUTPUT OBBLIGATORIA: ${langName}.
Tutto il testo che generi — summary, descrizioni esperienze, nomi delle categorie skill, nomi delle singole skill — deve essere ESCLUSIVAMENTE in ${langName}.
Regola assoluta: zero parole in altre lingue, salvo termini tecnici universalmente accettati (es. React, TypeScript, Kubernetes, Scrum, KPI, P&L, SaaS, CRM, ERP).
Soft skill e titoli di categoria devono essere scritti nella lingua scelta.

ERRORI CHE NON FAI MAI:
1. Non scrivi mai in prima persona. VIETATO: "Ho", "Sono", "Ho gestito", "Ho costruito".
2. Non scrivi blocchi di testo. Bullet con "• ", nel numero e nella lunghezza indicati sopra — mai di più di quelli giustificati dal contenuto originale.
3. Non usi mai: "ho partecipato", "ho contribuito", "sono stato coinvolto". Parole da junior.
4. Non scrivi: "dinamico", "proattivo", "team player" senza dati o fatti concreti a supporto.
5. Non metti lingue (Inglese, Italiano, Francese ecc.) nelle skill — esistono già nella sezione lingue.
6. Non ripeti la stessa skill/keyword più volte per "rinforzarla" agli occhi dell'ATS — è keyword-stuffing, un ATS moderno non lo premia e un recruiter lo penalizza.
7. VIETATO ASSOLUTO — REGOLA PIÙ IMPORTANTE DI TUTTE: non scrivere MAI una percentuale, cifra, importo o metrica che non sia esplicitamente scritta nel testo originale del CV. Questo vale anche se sembra "plausibile" o "ragionevole" per quel tipo di ruolo — non lo è, è un dato inventato su una persona reale. Se il testo originale non contiene un numero preciso ma vuoi comunicare impatto, usa una formulazione qualitativa forte ("riduzione significativa", "miglioramento misurabile", "crescita costante") — MAI un numero specifico che non hai letto nel testo originale. Inventare un numero non è "ottimizzare", è mentire per conto del candidato: se in un colloquio gli chiedono di spiegare quel "30%" che non può giustificare, perde l'offerta ed è colpa tua. Prima di scrivere qualsiasi cifra, verifica che sia letteralmente presente nel testo originale fornito.

STILE OBBLIGATORIO — FORMA IMPERSONALE:
Tutte le descrizioni: participio passato o sostantivo d'azione senza soggetto.
- "Ridisegnati i processi operativi, tagliando il 30% delle inefficienze."
- "Gestiti 20 dipendenti, coordinata supply chain con riduzione costi del 20%."
- "Lanciata piattaforma da zero, raggiunto breakeven in 8 mesi."

ESEMPIO DI STANDARD QUALITATIVO — SOLO PER CAPIRE IL LIVELLO, NON PER I CONTENUTI:
⚠️ ATTENZIONE: qualsiasi numero, ruolo o dettaglio in questo esempio è INVENTATO a scopo puramente illustrativo dello STILE. Non riutilizzarli MAI, nemmeno se il CV che stai riscrivendo sembra simile — copiali sarebbe un errore grave, equivalente a inventare fatti falsi su una persona reale.
Esempio di testo debole (frasi vaghe, zero prove): "Mi sono occupato di varie attività organizzative e ho collaborato con il team per il raggiungimento degli obiettivi aziendali."
Esempio di testo forte allo stesso livello di dettaglio ORIGINALE (senza inventare numeri assenti): "• Coordinate le attività operative del team, allineando le priorità settimanali con gli obiettivi aziendali"
Esempio di bullet con dato reale presente nell'originale: "• Ridotto il tempo di reportistica mensile del 40% automatizzando i flussi Excel/Power Query, eliminando la preparazione manuale ripetitiva"
La differenza è la specificità dell'azione e del contesto, non l'aggiunta di numeri inventati. Se il testo originale CONTIENE già numeri, scala o portata (quante persone, quanti soldi, quanto tempo, quanto spesso) usali sempre e mettili in evidenza. Se il testo originale NON contiene alcun dato quantificabile, non inventarlo: migliora la specificità dell'azione e del risultato con verbi forti, restando rigorosamente fedele solo ai fatti presenti nell'originale.

PULIZIA OBBLIGATORIA:
- Non includere MAI "Presente" o "Present" come testo isolato nei campi.
- Non generare artefatti di formattazione o date orfane.`;
}

interface OptimizedCvResult {
  summary?: string;
  experiences?: Array<{ id?: string; desc?: string }>;
  skillCategories?: Array<{ name?: string; skills?: string[] }>;
}

// Structural score against the gold-standard spec (summary length, skill count,
// bullet presence/metrics) — reflects what was actually generated, not a guess.
function computeStructuralAtsScore(result: OptimizedCvResult): number {
  let score = 40; // baseline: standard sections, clean text, single column (guaranteed by our templates)

  const summaryWords = (result.summary ?? '').trim().split(/\s+/).filter(Boolean).length;
  if (summaryWords >= 40 && summaryWords <= 70) score += 15;
  else if (summaryWords > 0) score += 7;

  const totalSkills = (result.skillCategories ?? []).reduce((n, c) => n + (c.skills?.length ?? 0), 0);
  if (totalSkills >= 10 && totalSkills <= 15) score += 15;
  else if (totalSkills > 0) score += 7;

  const experiences = result.experiences ?? [];
  const withBullets = experiences.filter(e => (e.desc ?? '').includes('•'));
  const withMetrics = experiences.filter(e => /\d/.test(e.desc ?? ''));
  if (experiences.length > 0) {
    score += Math.round((withBullets.length / experiences.length) * 15);
    score += Math.round((withMetrics.length / experiences.length) * 15);
  }

  return Math.max(0, Math.min(100, score));
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

  const systemContent = `${buildMasterPrompt(lang)}\n\nAnalizza il CV e riscrivi il contenuto come farebbe l'HR manager che lo shortlisterebbe tra 1000 candidati:\n\nSUMMARY — il posizionamento che fa fermare il recruiter:\n- Formula: identità professionale + anni/livello di esperienza + specializzazione + 2-3 capacità rilevanti + valore/risultato specifico preso dal CV originale.\n- Lunghezza target: 40-70 parole (2-4 frasi dense). Zero banalità, zero aggettivi vuoti. Tutto in ${langName}.\n\nEXPERIENCES — solo risultati, mai mansioni, numero di bullet allocato per RILEVANZA e POSIZIONE nell'array (la prima esperienza nell'array è la più recente/rilevante):\n- Esperienza in posizione 1 (più recente): fino a 4-6 bullet, se il testo originale offre abbastanza materiale.\n- Esperienza in posizione 2: fino a 3-5 bullet.\n- Esperienze dalla posizione 3 in poi: fino a 1-3 bullet.\n- Questi numeri sono un TETTO MASSIMO, non un obbligo: se un'esperienza specifica ha poco materiale reale, scrivi meno bullet (anche 1 solo, ma impeccabile) piuttosto che riempire con contenuto debole o ripetitivo.\n- Ogni bullet segue la formula AZIONE + COSA + COME/con quale metodo o strumento + RISULTATO, lungo 10-25 parole, e inizia con "• ".\n- Se esistono numeri nel testo originale (%, €, n. persone, mesi) usali obbligatoriamente. Se non esistono, non inventarli: punta sulla specificità dell'azione.\n- OGNI bullet è separato dal successivo da un vero carattere newline (\\n) dentro la stringa JSON — MAI bullet concatenati sulla stessa riga con virgole. Esempio di formato corretto per due bullet: "• Primo risultato con dato numerico\\n• Secondo risultato con dato numerico"\n- Tutto in ${langName}.\n\nSKILL CATEGORIES — competenze reali, pertinenti, verificabili, target 10-15 skill TOTALI (somma di tutte le categorie):\n- 2-4 categorie pertinenti al profilo (es: Operazioni, Leadership, Digitale, Commerciale)\n- Distribuisci le skill tra le categorie in modo che il totale sia 10-15, non di più\n- Solo skill reali e specifiche che emergono dalle esperienze, NON skill inventate, generiche o duplicate tra categorie diverse (niente keyword-stuffing)\n- ASSOLUTAMENTE VIETATO: includere lingue parlate (${existingLanguages || 'italiano, inglese, francese ecc.'}) — le lingue hanno già la loro sezione separata nel CV${languageExclusionNote}\n- Nomi categorie in ${langName}, skill in ${langName} salvo termini tecnici universali\n\nRestituisci SOLO questo JSON (zero testo prima o dopo, zero markdown):\n{\n  "summary": "profilo riscritto in ${langName}, 40-70 parole",\n  "experiences": [\n    { "id": "id originale invariata", "desc": "descrizione riscritta in ${langName}, max 500 caratteri, numero di bullet allocato per posizione/rilevanza come indicato sopra (1-6)" }\n  ],\n  "skillCategories": [\n    { "name": "nome categoria in ${langName}", "skills": ["skill1", "skill2", "skill3"] }\n  ]\n}\n\nVINCOLI ASSOLUTI: mantieni le id originali delle esperienze, nello stesso ordine in cui appaiono nell'input (l'ordine determina l'allocazione dei bullet). Non inventare fatti o numeri assenti nel CV. Il totale delle skill in tutte le skillCategories deve essere tra 10 e 15.`;

  const userContent = `Ottimizza questo CV come farebbe l'HR manager che deve scegliere 10 persone su 1000. Sii spietato: solo impatto misurabile, niente mansioni, niente lingue nelle competenze.\n\n${cvText}`;

  try {
    const raw = await generateText(systemContent + '\n\n' + userContent, { temperature: 0.5, maxTokens: 3000 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonStr) as OptimizedCvResult;
    const atsScore = computeStructuralAtsScore(parsed);

    const user = (req as { user?: { email?: string; firstName?: string } }).user;
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: `✨ Il tuo CV è pronto e ottimizzato (Punteggio ATS stimato: ${atsScore}/100)`,
        html: getCvReadyEmailHtml(String(cvData.title || 'Curriculum Executive PA 2026'), atsScore),
      }).catch(err => {
        req.log.error({ err }, 'Background cv-ready email failed');
      });
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, 'optimize-cv error');
    res.status(500).json({ error: "Errore durante l'ottimizzazione del CV" });
  }
});

router.post('/optimize-field', async (req, res) => {
  const { field, value, context, lang = 'IT', mode } = req.body as {
    field?: 'summary' | 'exp' | 'exp-tips' | 'exp-role' | 'exp-skills';
    value?: string;
    context?: Record<string, unknown>;
    lang?: string;
    mode?: string;
  };

  if (!field || (!value && field !== 'exp-tips' && field !== 'exp-role' && field !== 'exp-skills')) {
    res.status(400).json({ error: 'Parametri mancanti' });
    return;
  }

  const langName = LANG_NAMES[lang] ?? 'italiano';

  try {
    if (field === 'exp-role') {
      const company = (context?.company as string) ?? 'azienda';
      const desc = (value ?? '').trim();
      const currentRole = ((context?.currentRole as string) ?? '').trim();

      const prompt = `Sei un HR Director senior. Devi ${currentRole ? 'migliorare la formulazione di' : 'dedurre'} il titolo professionale (job title) di un'esperienza lavorativa su un CV, in ${langName}.\nRegole: titolo breve (2-5 parole), standard di settore, senza azienda o date, senza virgolette.\n${currentRole ? `Titolo attuale (da rendere più professionale/standard, mantenendo il significato): "${currentRole}"` : 'Nessun titolo è stato ancora inserito: deducilo dalla descrizione sottostante.'}\nAzienda: ${company}\nDescrizione dell'esperienza: "${desc || 'non specificata'}"\nRestituisci SOLO il titolo in ${langName}. Niente JSON, niente virgolette esterne, niente spiegazioni.`;

      const raw = await generateText(prompt);
      const result = raw.trim().replace(/^["'“]+|["'”]+$/g, '');
      res.json({ result });
      return;
    }

    if (field === 'exp-skills') {
      const role = (context?.role as string) ?? 'non specificato';
      const company = (context?.company as string) ?? 'azienda';
      const desc = (value ?? '').trim();
      const existingSkills = (context?.existingSkills as string[] | undefined) ?? [];

      const prompt = `Sei un HR Director senior. Analizza questa esperienza lavorativa ed estrai/suggerisci le competenze (skill) realmente dimostrate, in ${langName}.\nRegole: 3-6 competenze specifiche e concrete (strumenti, tecnologie, metodologie, aree di competenza) — mai soft skill generiche isolate, mai lingue parlate.\nDeducile SOLO da ciò che è scritto nella descrizione e dal ruolo/azienda, non inventare strumenti o tecnologie mai citati né deducibili con certezza dal contesto.\n${existingSkills.length ? `Competenze già presenti (non ripeterle): ${existingSkills.join(', ')}.` : ''}\nRestituisci SOLO un array JSON di stringhe in ${langName}. Zero testo prima o dopo. Zero markdown.\nEsempio: ["Gestione budget", "Coordinamento fornitori", "Excel avanzato"]\n\nRuolo: ${role} presso ${company}\nDescrizione: "${desc || 'non specificata'}"`;

      const raw = await generateText(prompt);
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const skills = JSON.parse(jsonStr) as string[];
      res.json({ skills: Array.isArray(skills) ? skills : [] });
      return;
    }

    if (field === 'exp-tips') {
      const role = (context?.role as string) ?? 'non specificato';
      const company = (context?.company as string) ?? 'azienda';
      const desc = (value ?? '').trim();

      const prompt = `Sei un HR Director senior. Hai appena letto la descrizione di un'esperienza lavorativa su un CV.\nIl tuo compito è dare 3 suggerimenti SPECIFICI e AZIONABILI per migliorarla.\nI suggerimenti devono riguardare: dati mancanti (numeri, %, budget, team size), risultati non quantificati, keyword di settore assenti, o formulazioni deboli.\nOgni suggerimento è una frase breve e diretta, in ${langName}, che dice esattamente cosa aggiungere o cambiare.\nRestituisci SOLO un array JSON con 3 stringhe. Zero testo prima o dopo. Zero markdown.\nEsempio: ["Aggiungi il numero di persone gestite — es. 'Coordinati 8 specialisti'","Specifica il risparmio o budget — es. 'Budget operativo €1.2M'","Cita il risultato finale — es. 'Progetto completato 2 mesi prima della scadenza'"]\n\nRuolo: ${role} presso ${company}\nDescrizione attuale: "${desc}"\n\nDammi 3 suggerimenti specifici per migliorare questa descrizione con dati verificabili e risultati concreti.`;

      const raw = await generateText(prompt);
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const tips = JSON.parse(jsonStr) as string[];
      res.json({ tips });
      return;
    }

    let prompt: string;

    if (field === 'summary') {
      prompt = `${buildMasterPrompt(lang)}\n\nRiscrivi il profilo professionale in ${langName}. Sii assertivo e sintetico.\nFormula: identità professionale + anni/livello di esperienza + specializzazione + 2-3 capacità rilevanti + valore/risultato specifico.\nLunghezza target: 40-70 parole (2-4 frasi dense). Nessuna banalità, posizionamento strategico chiaro.\nTutto il testo deve essere in ${langName}.\nRestituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne, niente spiegazioni.\n\nTitolo professionale: ${(context?.title as string) ?? 'non specificato'}\nProfilo attuale (da migliorare radicalmente): "${value}"\n${context?.experiences ? `Esperienze reali: ${JSON.stringify(context.experiences).slice(0, 800)}` : ''}\n\nRiscrivi con massimo impatto in ${langName}. Taglia tutto ciò che non è essenziale.`;
    } else if (mode === 'rephrase') {
      prompt = `${buildMasterPrompt(lang)}\n\nQuesta descrizione di esperienza è già stata ottimizzata. Scrivi una VARIAZIONE in ${langName}:\n- Usa parole diverse, diversa enfasi, diverso ordine dei bullet\n- Mantieni gli stessi fatti, numeri e risultati — non inventarne di nuovi\n- Stesso livello di impatto, stesso stile impersonale\n- Max 2-3 bullet con "• ", ognuno 10-25 parole, formula AZIONE + COSA + COME + RISULTATO\nRestituisci SOLO il testo alternativo. Niente JSON, niente virgolette esterne.\n\nRuolo: ${(context?.role as string) ?? 'non specificato'} presso ${(context?.company as string) ?? 'azienda'}\nVersione attuale (da variare): "${value ?? ''}"\n\nScrivi una variazione diversa ma ugualmente efficace in ${langName}.`;
    } else if (mode === 'apply-tip') {
      const tip = (context?.tip as string) ?? '';
      prompt = `${buildMasterPrompt(lang)}\n\nHai dato questo suggerimento specifico per migliorare una descrizione di esperienza: "${tip}"\n\nRiscrivi la descrizione qui sotto APPLICANDO ESATTAMENTE questo suggerimento — non un rewrite generico, incorpora precisamente ciò che il suggerimento chiede (il dato, il numero, la keyword o la riformulazione indicata). Se il suggerimento chiede un dato che non è nel testo originale né deducibile con certezza, integra la struttura suggerita senza inventare il numero esatto (usa una formulazione qualitativa forte invece di un numero inventato).\nRegole: max 2-3 bullet con "• ", ognuno 10-25 parole, formula AZIONE + COSA + COME + RISULTATO, stile impersonale, tutto in ${langName}.\nRestituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne.\n\nRuolo: ${(context?.role as string) ?? 'non specificato'} presso ${(context?.company as string) ?? 'azienda'}\nDescrizione attuale: "${value ?? ''}"\n\nApplica il suggerimento e riscrivi in ${langName}.`;
    } else {
      prompt = `${buildMasterPrompt(lang)}\n\nRiscrivi questa descrizione di esperienza lavorativa in ${langName}.\nRegole RIGIDE: max 2-3 bullet con "• ", ognuno 10-25 parole, formula AZIONE (verbo forte) + COSA + COME/con quale metodo o strumento + RISULTATO, impatto concreto, zero verbosità.\nTutto il testo deve essere in ${langName}.\nRestituisci SOLO il testo riscritto. Niente JSON, niente virgolette esterne.\n\nRuolo: ${(context?.role as string) ?? 'non specificato'} presso ${(context?.company as string) ?? 'azienda'}\nDescrizione attuale (da riscrivere): "${value ?? ''}"\n\nRiscrivila in ${langName}. Sii spietato con le parole inutili. Solo impatto.`;
    }

    const resultText = (await generateText(prompt)) || (value ?? '');
    res.json({ result: resultText });
  } catch (err) {
    req.log.error({ err }, 'optimize-field error');
    res.status(500).json({ error: "Errore durante l'ottimizzazione del campo" });
  }
});

export default router;
