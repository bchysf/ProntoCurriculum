import { Router, type IRouter } from 'express';
import { generateText } from '../lib/ai';
import { sendEmail, getCvReadyEmailHtml } from '../lib/email';
import {
  LANG_NAMES as STD_LANG_NAMES,
  buildGoldStandardGuide,
  buildAllowedNumbers,
  bulletCapFor,
  cleanSkillCategories,
  findCliches,
  hasFirstPerson,
  inventedNumbers,
  joinBullets,
  sortReverseChronological,
  splitBullets,
  metricsFirst,
  unsupportedSentences,
  paddingStart,
  sourceOverlap,
  buildSourceStems,
  totalYearsOfExperience,
  cumulativeYears,
  wordCount,
  type OptimizeFacts,
  type OptimizeInputExperience,
} from '../lib/cvStandard';

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
  IT: 'italiano',
  EN: 'inglese (English)',
  FR: 'francese (Français)',
  DE: 'tedesco (Deutsch)',
  ES: 'spagnolo (Español)',
  PT: 'portoghese (Português)',
};

// Single-field rewrites (summary, one experience) share the full-CV standard.
function buildMasterPrompt(lang: string): string {
  return buildGoldStandardGuide(STD_LANG_NAMES[lang] ? lang : 'IT');
}

interface RawOptimizeOutput {
  title?: unknown;
  summary?: unknown;
  experiences?: Array<{ id?: unknown; desc?: unknown }>;
  skillCategories?: unknown;
}

interface OptimizeResultOut {
  title?: string;
  summary: string;
  experiences: Array<{ id: string; desc: string }>;
  skillCategories: Array<{ name: string; skills: string[] }>;
  atsScore: number;
}

function str(v: unknown, max = 4000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function parseModelJson(raw: string): RawOptimizeOutput | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned) as RawOptimizeOutput;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)) as RawOptimizeOutput; } catch { return null; }
  }
}

// Structural score against the gold standard, computed from what was actually
// produced (used for the "CV ready" email subject).
function computeStructuralAtsScore(r: OptimizeResultOut): number {
  let score = 40;
  const sw = wordCount(r.summary);
  score += sw >= 40 && sw <= 80 ? 15 : sw > 0 ? 7 : 0;
  const totalSkills = r.skillCategories.reduce((n, c) => n + c.skills.length, 0);
  score += totalSkills >= 9 && totalSkills <= 15 ? 15 : totalSkills > 0 ? 7 : 0;
  const exps = r.experiences.filter(e => e.desc);
  if (exps.length) {
    score += Math.round((exps.filter(e => e.desc.includes('•')).length / exps.length) * 15);
    score += Math.round((exps.filter(e => /\d/.test(e.desc)).length / exps.length) * 15);
  }
  return Math.max(0, Math.min(100, score));
}

interface Assessment {
  result: OptimizeResultOut;
  issues: string[];
  // Bullets still carrying invented numbers, per experience id.
  badBullets: Map<string, Set<number>>;
  // Bullets whose tail adds claims not in the source: id → bullet index → cut position.
  padded: Map<string, Map<number, number>>;
  summaryBadNumbers: string[];
}

function assess(
  out: RawOptimizeOutput,
  ctx: {
    lang: string;
    exps: OptimizeInputExperience[];
    facts: OptimizeFacts;
    allowed: Set<string>;
    sourceStems: Set<string>;
    original: { title: string; summary: string; skillCategories: Array<{ name: string; skills: string[] }> };
    cvLanguages: string[];
  },
): Assessment {
  const { lang, exps, facts, allowed, sourceStems, original, cvLanguages } = ctx;
  const padded = new Map<string, Map<number, number>>();
  // Skip the padding check when the output is a translation of the source.
  const checkPadding = sourceOverlap((out.experiences ?? []).map(e => str(e?.desc)), sourceStems) >= 0.35;
  const issues: string[] = [];
  const badBullets = new Map<string, Set<number>>();

  // Title
  let title = str(out.title, 80).replace(/^["'“]+|["'”]+$/g, '');
  if (!title || wordCount(title) > 7) title = original.title;

  // Summary
  const summary = str(out.summary, 1200).replace(/\s*\n+\s*/g, ' ');
  const sw = wordCount(summary);
  const summaryBadNumbers = inventedNumbers(summary, allowed);
  if (!summary) issues.push('summary: missing.');
  else {
    if (sw < 35 || sw > 85) issues.push(`summary: ${sw} words — must be 45–75 words in 3–4 sentences.`);
    const sentences = summary.split(/(?<=[.!?])\s+/).filter(Boolean).length;
    if (sentences > 4) issues.push(`summary: ${sentences} sentences — use 3–4; keep identity, core expertise and the strongest proof point, drop duty lists.`);
    if (summaryBadNumbers.length) issues.push(`summary: contains numbers not present in the source (${summaryBadNumbers.join(', ')}) — remove them.`);
    if (hasFirstPerson(summary, lang)) issues.push('summary: uses first person — rewrite impersonally.');
    const c = findCliches(summary, lang);
    if (c.length) issues.push(`summary: clichés/filler (${c.join(', ')}) — replace with concrete content.`);
  }

  // Experiences
  const byId = new Map<string, string>();
  for (const e of out.experiences ?? []) {
    const id = str(e?.id, 100);
    if (id) byId.set(id, str(e?.desc));
  }
  const experiences = exps.map(src => {
    const produced = byId.get(src.id);
    if (!src.desc.trim()) return { id: src.id, desc: src.desc };
    if (produced === undefined || !produced.trim()) {
      issues.push(`experience ${src.id} (${src.role} @ ${src.company}): missing from your output.`);
      return { id: src.id, desc: src.desc };
    }
    const cap = facts.bulletCaps[src.id] ?? 3;
    let bullets = splitBullets(produced);
    if (bullets.length > cap) {
      issues.push(`experience ${src.id}: ${bullets.length} bullets, maximum is ${cap} — keep only the strongest.`);
      bullets = bullets.slice(0, cap);
    }
    const firstWords = new Map<string, number>();
    bullets.forEach((b, i) => {
      const bad = inventedNumbers(b, allowed);
      if (bad.length) {
        issues.push(`experience ${src.id}, bullet ${i + 1}: numbers not in the source (${bad.join(', ')}) — remove them or use the real figure.`);
        if (!badBullets.has(src.id)) badBullets.set(src.id, new Set());
        badBullets.get(src.id)!.add(i);
      }
      const pad = checkPadding ? paddingStart(b, sourceStems) : -1;
      if (pad >= 0) {
        issues.push(`experience ${src.id}, bullet ${i + 1}: the clause "${b.slice(pad).replace(/^[,;s—–]+/, "")}" states something the source never says — remove it or replace it with a fact from the source.`);
        if (!padded.has(src.id)) padded.set(src.id, new Map());
        padded.get(src.id)!.set(i, pad);
      }
      const wc = wordCount(b);
      if (wc > 30) issues.push(`experience ${src.id}, bullet ${i + 1}: ${wc} words — cut to 12–25.`);
      if (hasFirstPerson(b, lang)) issues.push(`experience ${src.id}, bullet ${i + 1}: first person — rewrite impersonally.`);
      const c = findCliches(b, lang);
      if (c.length) issues.push(`experience ${src.id}, bullet ${i + 1}: weak/duty phrasing (${c.join(', ')}) — lead with an action and result.`);
      const fw = b.split(/\s+/)[0]?.toLowerCase().replace(/[^\p{L}]/gu, '') ?? '';
      if (fw) firstWords.set(fw, (firstWords.get(fw) ?? 0) + 1);
    });
    for (const [w, n] of firstWords) {
      if (n > 1) issues.push(`experience ${src.id}: ${n} bullets start with "${w}" — vary the action verbs.`);
    }
    return { id: src.id, desc: joinBullets(bullets) };
  });

  // Skills
  let skillCategories = cleanSkillCategories(out.skillCategories, cvLanguages);
  const totalSkills = skillCategories.reduce((n, c) => n + c.skills.length, 0);
  if (!skillCategories.length) {
    issues.push('skillCategories: missing or empty.');
    skillCategories = original.skillCategories;
  } else if (totalSkills < 8) {
    issues.push(`skillCategories: only ${totalSkills} skills — aim for 9–15 evidenced hard skills.`);
  }

  const result: OptimizeResultOut = {
    title,
    summary: summary || original.summary,
    experiences,
    skillCategories,
    atsScore: 0,
  };
  return { result, issues, badBullets, padded, summaryBadNumbers };
}

// Last line of defence after the repair pass: anything still carrying an
// invented number is removed rather than shipped.
function enforceTruth(a: Assessment, exps: OptimizeInputExperience[], originalSummary: string): OptimizeResultOut {
  const r = a.result;
  const experiences = r.experiences.map(e => {
    const bad = a.badBullets.get(e.id);
    const pads = a.padded.get(e.id);
    if (!bad?.size && !pads?.size) return e;
    // Padding is cut off at the clause boundary (the true part stays);
    // bullets with invented numbers are dropped entirely.
    const kept = splitBullets(e.desc)
      .map((b, i) => {
        const cut = pads?.get(i);
        return cut === undefined ? b : b.slice(0, cut).replace(/[\s,;—–]+$/, '') + '.';
      })
      .filter((_, i) => !bad?.has(i));
    const src = exps.find(x => x.id === e.id);
    return { id: e.id, desc: kept.length ? joinBullets(kept) : (src?.desc ?? '') };
  });
  let summary = r.summary;
  if (a.summaryBadNumbers.length) {
    const sentences = summary.split(/(?<=[.!?])\s+/);
    const kept = sentences.filter(s => !a.summaryBadNumbers.some(n => s.includes(n)));
    summary = kept.length >= 2 ? kept.join(' ') : originalSummary || kept.join(' ');
  }
  return {
    ...r,
    summary,
    experiences: experiences.map(e => (e.desc.includes("•") ? { ...e, desc: joinBullets(metricsFirst(splitBullets(e.desc))) } : e)),
  };
}

router.post('/optimize-cv', async (req, res) => {
  const { cvData, lang: rawLang = 'IT' } = req.body as { cvData?: Record<string, unknown>; lang?: string };

  if (!cvData || typeof cvData !== 'object') {
    res.status(400).json({ error: 'CV data mancante' });
    return;
  }
  const lang = STD_LANG_NAMES[rawLang] ? rawLang : 'IT';

  // Lean, PII-free source: no photo (base64 would eat the whole context),
  // no contacts. Experiences in reverse-chronological order, which is also
  // the order the frontend renders them in.
  const asList = (v: unknown) => (Array.isArray(v) ? v : []) as Array<Record<string, unknown>>;
  const exps: OptimizeInputExperience[] = sortReverseChronological(
    asList(cvData.experiences).map(e => ({
      id: str(e.id, 100),
      role: str(e.role, 150),
      company: str(e.company, 150),
      city: str(e.city, 100),
      from: str(e.from, 40),
      to: str(e.to, 40),
      desc: str(e.desc, 2500),
    })).filter(e => e.id && (e.role || e.company || e.desc)),
  );

  const cvLanguages = asList(cvData.languages).map(l => str(l.name, 60)).filter(Boolean);
  const originalSkillCategories = cleanSkillCategories(cvData.skillCategories, []);
  const original = {
    title: str(cvData.title, 120),
    summary: str(cvData.summary, 2000),
    skillCategories: originalSkillCategories,
  };

  const facts: OptimizeFacts = {
    yearsOfExperience: totalYearsOfExperience(exps),
    yearsByRecentRoles: cumulativeYears(exps),
    currentRole: exps[0] && /presente|present|attuale|current|aujourd|heute|actualidad|atualidade|oggi|derzeit|em curso/i.test(exps[0].to) ? exps[0].role : null,
    bulletCaps: Object.fromEntries(exps.map((e, i) => [e.id, bulletCapFor(i, e.desc)])),
  };

  const source = {
    title: original.title,
    summary: original.summary,
    experiences: exps,
    education: sortReverseChronological(asList(cvData.education).map(e => ({
      degree: str(e.degree, 200), institution: str(e.institution, 200), grade: str(e.grade, 50), from: str(e.from, 40), to: str(e.to, 40),
    }))),
    certifications: asList(cvData.certifications).map(c => ({ name: str(c.name, 200), issuer: str(c.issuer, 150), date: str(c.date, 40) })),
    otherExperiences: asList(cvData.additionalExperiences).map(e => ({ role: str(e.role, 150), company: str(e.company, 150), desc: str(e.desc, 600) })),
    existingSkills: [...new Set([
      ...asList(cvData.skillCategories).flatMap(c => (Array.isArray(c.skills) ? c.skills : []).map(s => str(s, 60))),
      ...(Array.isArray(cvData.skills) ? cvData.skills : []).map(s => str(s, 60)),
    ].filter(Boolean))],
    languages: cvLanguages,
  };
  const sourceJson = JSON.stringify(source, null, 1);
  const allowed = buildAllowedNumbers(sourceJson, facts);
  const langName = STD_LANG_NAMES[lang];

  const outputSpec = `Return ONLY a JSON object with exactly this shape:
{
  "title": "standard role title in ${langName}",
  "summary": "45–75 words, 3–4 sentences, in ${langName}",
  "experiences": [ { "id": "<original id, unchanged>", "desc": "• bullet\\n• bullet" } ],
  "skillCategories": [ { "name": "category in ${langName}", "skills": ["skill", "skill"] } ]
}
Include every experience id from the input, in the same order.`;

  const prompt = `${buildGoldStandardGuide(lang)}

━━ FACTS (computed from the CV — you may use these numbers) ━━
${JSON.stringify({
    yearsByRecentRoles: facts.yearsByRecentRoles,
    currentRole: facts.currentRole ?? 'none',
    bulletCaps: facts.bulletCaps,
  }, null, 1)}

━━ CANDIDATE CV (source of truth) ━━
${sourceJson}

${outputSpec}`;

  try {
    let raw = await generateText(prompt, { temperature: 0.4, maxTokens: 8000, json: true });
    let parsed = parseModelJson(raw);
    if (!parsed) {
      raw = await generateText(prompt, { temperature: 0.3, maxTokens: 8000, json: true });
      parsed = parseModelJson(raw);
    }
    if (!parsed) throw new Error('Model returned invalid JSON twice');

    const ctx = { lang, exps, facts, allowed, sourceStems: buildSourceStems(sourceJson), original, cvLanguages };
    let assessment = assess(parsed, ctx);

    // One targeted repair pass: the model gets its own draft plus the exact
    // rule violations found by code, and fixes only those.
    if (assessment.issues.length) {
      req.log.info({ issues: assessment.issues }, 'optimize-cv: repairing draft');
      const repairPrompt = `${buildGoldStandardGuide(lang)}

━━ FACTS ━━
${JSON.stringify({ yearsByRecentRoles: facts.yearsByRecentRoles, bulletCaps: facts.bulletCaps }, null, 1)}

━━ CANDIDATE CV (source of truth) ━━
${sourceJson}

━━ YOUR DRAFT ━━
${JSON.stringify(parsed, null, 1)}

━━ PROBLEMS FOUND IN YOUR DRAFT (fix every one; keep everything else as good as it is) ━━
${assessment.issues.map(i => `- ${i}`).join('\n')}

${outputSpec}`;
      const repairedRaw = await generateText(repairPrompt, { temperature: 0.2, maxTokens: 8000, json: true }).catch(() => '');
      const repaired = repairedRaw ? parseModelJson(repairedRaw) : null;
      if (repaired) {
        const second = assess(repaired, ctx);
        // Keep the repair only if it actually reduced the problems.
        if (second.issues.length <= assessment.issues.length) assessment = second;
      }
    }

    const result = enforceTruth(assessment, exps, original.summary);
    result.atsScore = computeStructuralAtsScore(result);

    const user = (req as { user?: { email?: string; firstName?: string } }).user;
    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: `✨ Il tuo CV è pronto e ottimizzato (Punteggio ATS stimato: ${result.atsScore}/100)`,
        html: getCvReadyEmailHtml(String(cvData.title || 'Curriculum'), result.atsScore),
      }).catch(err => {
        req.log.error({ err }, 'Background cv-ready email failed');
      });
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, 'optimize-cv error');
    res.status(500).json({ error: "Errore durante l'ottimizzazione del CV" });
  }
});

router.post('/optimize-field', async (req, res) => {
  const { field, value, context, lang = 'IT', mode } = req.body as {
    field?: 'summary' | 'exp' | 'exp-tips' | 'exp-role' | 'exp-skills' | 'bio' | 'headline';
    value?: string;
    context?: Record<string, unknown>;
    lang?: string;
    mode?: string;
  };

  if (!field || (!value && field !== 'summary' && field !== 'exp-tips' && field !== 'exp-role' && field !== 'exp-skills')) {
    res.status(400).json({ error: 'Parametri mancanti' });
    return;
  }

  const langName = LANG_NAMES[lang] ?? 'italiano';

  try {
    if (field === 'headline') {
      const prompt = `Sei un HR Director senior. Migliora questo titolo professionale per una pagina profilo pubblica, in ${langName}.\nRegole: breve (2-6 parole), standard di settore, specifico, senza virgolette, senza nome azienda.\nTitolo attuale: "${value ?? ''}"\nRestituisci SOLO il titolo migliorato in ${langName}. Niente JSON, niente virgolette esterne, niente spiegazioni.`;
      const raw = await generateText(prompt);
      const result = raw.trim().replace(/^["'“]+|["'”]+$/g, '');
      res.json({ result });
      return;
    }

    if (field === 'bio') {
      const experiencesCtx = (context?.experiences as Array<{ role?: string; company?: string }> | undefined) ?? [];
      const expText = experiencesCtx.length
        ? `Esperienze recenti: ${experiencesCtx.map(e => `${e.role ?? ''} @ ${e.company ?? ''}`).join(', ')}.`
        : '';
      const prompt = `Sei un HR Director senior e copywriter di profili professionali pubblici (stile pagina "About" o LinkedIn "About", non un CV).\nScrivi una bio professionale in ${langName}, in prima o terza persona a scelta ma coerente, 3-5 frasi (60-110 parole), calorosa ma professionale, che comunichi chi è la persona, cosa sa fare e che valore porta. Zero banalità vuote ("dinamico", "proattivo") senza contesto concreto.\nTitolo professionale: ${(context?.headline as string) ?? 'non specificato'}\n${expText}\nBio attuale (da migliorare, o da riscrivere da zero se vuota): "${value ?? ''}"\nRestituisci SOLO il testo della bio in ${langName}. Niente JSON, niente virgolette esterne, niente spiegazioni.`;
      const raw = await generateText(prompt);
      res.json({ result: raw.trim() });
      return;
    }

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

    if (field === 'summary') {
      const stdLang = STD_LANG_NAMES[lang] ? lang : 'IT';
      const asList = (v: unknown) => (Array.isArray(v) ? v : []) as Array<Record<string, unknown>>;
      const exps = sortReverseChronological(asList(context?.experiences).map((e, i) => ({
        id: str(e.id, 100) || `x${i}`,
        role: str(e.role, 150),
        company: str(e.company, 150),
        from: str(e.from, 40),
        to: str(e.to, 40),
        desc: str(e.desc, 1500),
      })).filter(e => e.role || e.company || e.desc));
      const source = {
        title: str(context?.title, 120),
        currentSummary: str(value, 2000),
        experiences: exps,
        education: asList(context?.education).map(e => ({ degree: str(e.degree, 200), institution: str(e.institution, 200), grade: str(e.grade, 50) })),
        certifications: asList(context?.certifications).map(c => ({ name: str(c.name, 200), issuer: str(c.issuer, 150) })),
        skills: (Array.isArray(context?.skills) ? context.skills as unknown[] : []).map(s => str(s, 60)).filter(Boolean).slice(0, 40),
      };
      const facts: OptimizeFacts = {
        yearsOfExperience: totalYearsOfExperience(exps),
        yearsByRecentRoles: cumulativeYears(exps),
        currentRole: null,
        bulletCaps: {},
      };
      const sourceJson = JSON.stringify(source, null, 1);
      const allowed = buildAllowedNumbers(sourceJson, facts);
      const sourceStems = buildSourceStems(sourceJson);
      // Thin material = nothing beyond a title and a few words. The summary
      // must then stay short instead of inventing a career to fill 70 words.
      const materialWords = wordCount([...exps.map(e => e.desc), ...source.skills, ...source.certifications.map(c => c.name)].join(' '));
      const thin = materialWords < 25;

      const basePrompt = `${buildGoldStandardGuide(stdLang)}

TASK: write ONLY the PROFESSIONAL SUMMARY section for this CV, following section 2 of the standard above. Plain text, one paragraph, no quotes, no JSON, no heading.
${thin
  ? `The CV contains very little material. Write 1–2 short sentences (15–35 words) using ONLY the title and the facts below. Do NOT name any skill, task, tool, sector or achievement that is not literally in the CV — an honest short summary is far better than an invented one. The current summary's self-descriptions ("dinamico", "proattivo"…) are not facts: drop them.${exps.length ? "" : " The CV lists NO work experience: do not claim any experience, seniority or track record (no \"esperienza consolidata\", no \"proven\") — present the candidate by title and education/certifications only."}`
  : 'Use only facts present in the CV below; the current summary is a draft to improve, not a source of new claims beyond what the experiences support.'}

━━ FACTS (computed — you may use these numbers) ━━
${JSON.stringify({ yearsByRecentRoles: facts.yearsByRecentRoles }, null, 1)}

━━ CANDIDATE CV (source of truth) ━━
${sourceJson}`;

      const clean = (t: string) => t.trim().replace(/^["'“]+|["'”]+$/g, '').replace(/\s*\n+\s*/g, ' ');
      const problems = (t: string): string[] => {
        const p: string[] = [];
        const nums = inventedNumbers(t, allowed);
        if (nums.length) p.push(`numbers not in the CV (${nums.join(', ')}) — remove them.`);
        if (hasFirstPerson(t, stdLang)) p.push('first person — rewrite impersonally.');
        const c = findCliches(t, stdLang);
        if (c.length) p.push(`clichés (${c.join(', ')}) — remove them.`);
        for (const s of unsupportedSentences(t, sourceStems)) p.push(`"${s}" claims things the CV never mentions — remove or replace with a real fact.`);
        const wc = wordCount(t);
        if (!thin && wc > 85) p.push(`${wc} words — cut to 45–75.`);
        if (thin && wc > 45) p.push(`${wc} words — with this little material keep it under 35 words.`);
        return p;
      };

      let summary = clean(await generateText(basePrompt, { temperature: 0.4, maxTokens: 3000 }));
      let issues = problems(summary);
      if (issues.length) {
        const repaired = clean(await generateText(`${basePrompt}

━━ YOUR DRAFT ━━
${summary}

━━ PROBLEMS (fix every one) ━━
${issues.map(i => `- ${i}`).join('\n')}

Return ONLY the corrected summary text.`, { temperature: 0.2, maxTokens: 3000 }).catch(() => ''));
        if (repaired && problems(repaired).length <= issues.length) {
          summary = repaired;
          issues = problems(repaired);
        }
      }
      // Whatever is still unbacked after the repair is removed, not shipped.
      if (issues.length) {
        const bad = new Set(unsupportedSentences(summary, sourceStems));
        const nums = inventedNumbers(summary, allowed);
        const kept = summary.split(/(?<=[.!?])\s+/).filter((s, i) => i === 0 || (!bad.has(s) && !nums.some(n => s.includes(n))));
        summary = kept.join(' ');
      }
      res.json({ result: summary || (value ?? '') });
      return;
    }

    let prompt: string;

    if (mode === 'rephrase') {
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
