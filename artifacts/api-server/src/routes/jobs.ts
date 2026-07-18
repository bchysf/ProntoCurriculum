import { Router, type Request, type Response, type IRouter } from "express";
import pino from "pino";
import { generateText } from "../lib/ai";

const logger = pino({ name: "JobsRouter" });
export const jobsRouter: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Normalized job posting shape returned to the frontend, whatever the source.
// ─────────────────────────────────────────────────────────────────────────────
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  description: string;
  url: string;
  source: string;
  postedAt: string | null;
  salary: string | null;
  remote: boolean;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|div|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Providers ────────────────────────────────────────────────────────────────
// Each provider is optional: it activates only if its env keys are present.
// Arbeitnow is keyless and always on, so the feature works out of the box.

async function searchAdzuna(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const cc = ["it", "gb", "us", "de", "fr", "es", "nl", "at", "ch", "pl", "br", "ca", "au"].includes(country) ? country : "it";
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "20",
    "content-type": "application/json",
  });
  if (q) params.set("what", q);
  if (location) params.set("where", location);

  const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}?${params}`);
  if (!res.ok) throw new Error(`Adzuna ${res.status}`);
  const data = await res.json() as {
    results?: Array<{
      id: string | number;
      title?: string;
      company?: { display_name?: string };
      location?: { display_name?: string };
      description?: string;
      redirect_url?: string;
      created?: string;
      salary_min?: number;
      salary_max?: number;
    }>;
  };

  return (data.results ?? []).map(r => ({
    id: `adzuna:${r.id}`,
    title: stripHtml(r.title ?? ""),
    company: r.company?.display_name ?? "Azienda riservata",
    location: r.location?.display_name ?? location ?? "",
    country: cc.toUpperCase(),
    description: stripHtml(r.description ?? ""),
    url: r.redirect_url ?? "",
    source: "Adzuna",
    postedAt: r.created ?? null,
    salary: r.salary_min || r.salary_max
      ? `${r.salary_min ? Math.round(r.salary_min).toLocaleString("it-IT") : "…"} – ${r.salary_max ? Math.round(r.salary_max).toLocaleString("it-IT") : "…"} €`
      : null,
    remote: /remote|smart\s*working|da\s+remoto/i.test(`${r.title} ${r.description}`),
  }));
}

async function searchJooble(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const res = await fetch(`https://jooble.org/api/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: q || "",
      location: location || (country === "it" ? "Italia" : ""),
      page,
    }),
  });
  if (!res.ok) throw new Error(`Jooble ${res.status}`);
  const data = await res.json() as {
    jobs?: Array<{
      id?: string | number;
      title?: string;
      company?: string;
      location?: string;
      snippet?: string;
      link?: string;
      updated?: string;
      salary?: string;
      source?: string;
    }>;
  };

  return (data.jobs ?? []).map(r => ({
    id: `jooble:${r.id ?? r.link}`,
    title: stripHtml(r.title ?? ""),
    company: r.company || "Azienda riservata",
    location: r.location ?? "",
    country: country.toUpperCase(),
    description: stripHtml(r.snippet ?? ""),
    url: r.link ?? "",
    source: r.source ? `Jooble · ${r.source}` : "Jooble",
    postedAt: r.updated ?? null,
    salary: r.salary || null,
    remote: /remote|smart\s*working|da\s+remoto/i.test(`${r.title} ${r.snippet}`),
  }));
}

async function searchArbeitnow(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  // Arbeitnow's board is exclusively German-market postings (city-name locations,
  // no country field) — only surface it when the user is actually searching Germany,
  // otherwise its constant stream of fresh listings crowds out the correctly
  // country-scoped results from providers that actually respect the filter.
  if (country && country !== "de") return [];

  const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
  if (!res.ok) throw new Error(`Arbeitnow ${res.status}`);
  const data = await res.json() as {
    data?: Array<{
      slug: string;
      company_name?: string;
      title?: string;
      description?: string;
      remote?: boolean;
      url?: string;
      tags?: string[];
      location?: string;
      created_at?: number;
    }>;
  };

  // Word-level OR matching: "senior software engineer" matches any of the terms.
  const terms = q.trim().toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const locNeedle = location.trim().toLowerCase();

  return (data.data ?? [])
    .filter(r => {
      const hay = `${r.title} ${r.description} ${(r.tags ?? []).join(" ")}`.toLowerCase();
      const okQ = terms.length === 0 || terms.some(w => hay.includes(w));
      const okLoc = !locNeedle || (r.location ?? "").toLowerCase().includes(locNeedle) || !!r.remote;
      return okQ && okLoc;
    })
    .map(r => ({
      id: `arbeitnow:${r.slug}`,
      title: stripHtml(r.title ?? ""),
      company: r.company_name ?? "Azienda riservata",
      location: r.location || (r.remote ? "Remote" : ""),
      country: "EU",
      description: stripHtml(r.description ?? ""),
      url: r.url ?? "",
      source: "Arbeitnow",
      postedAt: r.created_at ? new Date(r.created_at * 1000).toISOString() : null,
      salary: null,
      remote: !!r.remote,
    }));
}

// ── Search endpoint with a small in-memory TTL cache ────────────────────────
const searchCache = new Map<string, { at: number; data: JobPosting[]; providers: string[] }>();
const CACHE_TTL = 10 * 60 * 1000;

jobsRouter.get("/search", async (req: Request, res: Response) => {
  const q = String(req.query.q ?? "").slice(0, 120);
  const location = String(req.query.location ?? "").slice(0, 80);
  const country = String(req.query.country ?? "it").toLowerCase().slice(0, 2);
  const page = Math.max(1, Math.min(10, Number(req.query.page) || 1));

  const cacheKey = `${q}|${location}|${country}|${page}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    res.json({ jobs: cached.data, providers: cached.providers, cached: true });
    return;
  }

  const settled = await Promise.allSettled([
    searchAdzuna(q, location, country, page),
    searchJooble(q, location, country, page),
    searchArbeitnow(q, location, country, page),
  ]);

  const providerNames = ["Adzuna", "Jooble", "Arbeitnow"];
  const activeProviders: string[] = [];
  const perProvider: JobPosting[][] = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled") {
      if (s.value.length > 0) activeProviders.push(providerNames[i]!);
      perProvider.push(s.value);
    } else {
      perProvider.push([]);
      logger.warn({ provider: providerNames[i], err: String(s.reason) }, "job provider failed");
    }
  });

  // Round-robin across providers before capping the list: a provider with a
  // constant stream of freshly-dated postings (e.g. Arbeitnow) must not be able
  // to bury every result from a provider that actually scopes to the requested
  // country/query just because its dates happen to be newer.
  const jobs: JobPosting[] = [];
  const maxLen = Math.max(0, ...perProvider.map(p => p.length));
  for (let i = 0; i < maxLen; i++) {
    for (const list of perProvider) {
      if (list[i]) jobs.push(list[i]!);
    }
  }

  const trimmed = jobs.slice(0, 40)
    .map(j => ({ ...j, description: j.description.slice(0, 6000) }))
    .sort((a, b) => {
      const ta = a.postedAt ? Date.parse(a.postedAt) : 0;
      const tb = b.postedAt ? Date.parse(b.postedAt) : 0;
      return tb - ta;
    });

  if (searchCache.size > 60) {
    const oldest = [...searchCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) searchCache.delete(oldest[0]);
  }
  searchCache.set(cacheKey, { at: Date.now(), data: trimmed, providers: activeProviders });

  res.json({ jobs: trimmed, providers: activeProviders, cached: false });
});

// ── Salary data (Adzuna histogram, fallback: stats from live postings) ──────
const CURRENCY: Record<string, string> = { it: "€", de: "€", fr: "€", es: "€", nl: "€", at: "€", gb: "£", us: "$", ch: "CHF", pl: "zł", ca: "C$", au: "A$", br: "R$" };

interface SalaryStats {
  currency: string;
  p25: number;
  median: number;
  p75: number;
  samples: number;
  histogram: Array<{ bucket: number; count: number }>;
  source: string;
}

function percentilesFromBuckets(buckets: Array<{ bucket: number; count: number }>): { p25: number; median: number; p75: number; total: number } {
  const sorted = [...buckets].sort((a, b) => a.bucket - b.bucket);
  const total = sorted.reduce((s, b) => s + b.count, 0);
  const at = (p: number) => {
    let acc = 0;
    for (const b of sorted) {
      acc += b.count;
      if (acc >= total * p) return b.bucket;
    }
    return sorted[sorted.length - 1]?.bucket ?? 0;
  };
  return { p25: at(0.25), median: at(0.5), p75: at(0.75), total };
}

async function salaryFromAdzuna(title: string, location: string, country: string): Promise<SalaryStats | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;

  const cc = ["it", "gb", "us", "de", "fr", "es", "nl", "at", "ch", "pl", "br", "ca", "au"].includes(country) ? country : "it";
  const cur = CURRENCY[cc] ?? "€";

  // 1) Salary histogram for the query — aggregated market distribution.
  try {
    const params = new URLSearchParams({ app_id: appId, app_key: appKey, what: title });
    if (location) params.set("location0", location);
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/histogram?${params}`);
    if (res.ok) {
      const data = await res.json() as { histogram?: Record<string, number> };
      const buckets = Object.entries(data.histogram ?? {})
        .map(([k, v]) => ({ bucket: Number(k), count: Number(v) || 0 }))
        .filter(b => b.bucket > 0 && b.count > 0);
      if (buckets.length >= 3) {
        const { p25, median, p75, total } = percentilesFromBuckets(buckets);
        return { currency: cur, p25, median, p75, samples: total, histogram: buckets.sort((a, b) => a.bucket - b.bucket).slice(0, 12), source: "Adzuna · distribuzione annunci" };
      }
    }
  } catch (err) {
    logger.warn({ err: String(err) }, "adzuna histogram failed");
  }

  // 2) Fallback: compute from the salaries declared on live postings.
  try {
    const params = new URLSearchParams({
      app_id: appId, app_key: appKey, what: title, results_per_page: "50", "content-type": "application/json",
    });
    if (location) params.set("where", location);
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?${params}`);
    if (!res.ok) return null;
    const data = await res.json() as { results?: Array<{ salary_min?: number; salary_max?: number }> };
    const mids = (data.results ?? [])
      .map(r => (r.salary_min && r.salary_max) ? (r.salary_min + r.salary_max) / 2 : (r.salary_min || r.salary_max || 0))
      .filter(v => v > 1000)
      .sort((a, b) => a - b);
    if (mids.length < 4) return null;
    const at = (p: number) => Math.round(mids[Math.min(mids.length - 1, Math.floor(mids.length * p))] ?? 0);
    return { currency: cur, p25: at(0.25), median: at(0.5), p75: at(0.75), samples: mids.length, histogram: [], source: "Adzuna · annunci attivi" };
  } catch (err) {
    logger.warn({ err: String(err) }, "adzuna salary fallback failed");
    return null;
  }
}

const salaryCache = new Map<string, { at: number; stats: SalaryStats }>();

jobsRouter.get("/salary", async (req: Request, res: Response) => {
  const title = String(req.query.title ?? "").slice(0, 100).trim();
  const location = String(req.query.location ?? "").slice(0, 80).trim();
  const country = String(req.query.country ?? "it").toLowerCase().slice(0, 2);

  if (!title) {
    res.status(400).json({ error: "Indica un ruolo per la stima retributiva." });
    return;
  }

  const cacheKey = `${title}|${location}|${country}`;
  const cached = salaryCache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    res.json({ salary: cached.stats, cached: true });
    return;
  }

  const stats = await salaryFromAdzuna(title, location, country);
  if (!stats) {
    res.status(404).json({ error: "Dati retributivi non disponibili per questa ricerca. Prova con un ruolo più generico o senza città." });
    return;
  }

  if (salaryCache.size > 60) {
    const oldest = [...salaryCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) salaryCache.delete(oldest[0]);
  }
  salaryCache.set(cacheKey, { at: Date.now(), stats });
  res.json({ salary: stats, cached: false });
});

// ── AI compatibility analysis ────────────────────────────────────────────────
jobsRouter.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { job, cvData, experiences } = req.body as {
      job?: { title?: string; company?: string; description?: string };
      cvData?: {
        title?: string; summary?: string;
        experiences?: Array<{ role?: string; company?: string; desc?: string }>;
        skills?: string[];
        education?: Array<{ degree?: string; institution?: string }>;
      };
      experiences?: Array<{ id: string; role?: string; company?: string; description?: string | null }>;
    };

    if (!job?.description || job.description.trim().length < 40) {
      res.status(400).json({ error: "Descrizione dell'offerta mancante o troppo corta." });
      return;
    }
    if (!cvData) {
      res.status(400).json({ error: "Dati del CV mancanti." });
      return;
    }

    const cvText = [
      cvData.title,
      cvData.summary,
      ...(cvData.experiences ?? []).map(e => `${e.role} presso ${e.company}: ${e.desc}`),
      `Competenze: ${(cvData.skills ?? []).join(", ")}`,
      ...(cvData.education ?? []).map(e => `${e.degree} — ${e.institution}`),
    ].filter(Boolean).join("\n").slice(0, 4000);

    const archiveText = (experiences ?? []).length > 0
      ? (experiences ?? []).slice(0, 20).map(e =>
          `[id:${e.id}] ${e.role ?? ""} presso ${e.company ?? ""}: ${(e.description ?? "").slice(0, 220)}`
        ).join("\n")
      : "(archivio vuoto)";

    const prompt = `Sei un career coach e recruiter senior italiano. Analizza la compatibilità tra il CV del candidato e l'offerta di lavoro. Rispondi SOLO con JSON valido, senza markdown, con questa struttura esatta:
{
  "riassunto": "3-4 frasi in italiano che riassumono l'offerta: ruolo, azienda, cosa cercano davvero",
  "requisiti": ["i 5-8 requisiti chiave estratti dall'annuncio, brevi"],
  "compatibilita": 0-100,
  "puntiForti": ["2-4 punti del CV che matchano bene l'offerta"],
  "lacune": ["2-4 requisiti dell'offerta deboli o assenti nel CV"],
  "modificheCv": ["3-5 azioni concrete e specifiche per adattare il CV a QUESTA offerta (cosa riscrivere, quali keyword inserire, cosa spostare)"],
  "esperienzeConsigliate": ["gli id (solo l'id, es. abc123) delle esperienze in archivio rilevanti per questa offerta da aggiungere al CV; [] se nessuna"]
}

OFFERTA (${job.title ?? ""} — ${job.company ?? ""}):
${job.description.trim().slice(0, 5000)}

CV DEL CANDIDATO:
${cvText}

ARCHIVIO ESPERIENZE (non ancora nel CV):
${archiveText}`;

    const raw = await generateText(prompt, { maxTokens: 1400, temperature: 0.4 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as {
      riassunto?: string;
      requisiti?: string[];
      compatibilita?: number;
      puntiForti?: string[];
      lacune?: string[];
      modificheCv?: string[];
      esperienzeConsigliate?: string[];
    };

    const validIds = new Set((experiences ?? []).map(e => e.id));
    res.json({
      success: true,
      data: {
        riassunto: parsed.riassunto ?? "",
        requisiti: (parsed.requisiti ?? []).slice(0, 8),
        compatibilita: Math.max(0, Math.min(100, Math.round(Number(parsed.compatibilita) || 0))),
        puntiForti: (parsed.puntiForti ?? []).slice(0, 4),
        lacune: (parsed.lacune ?? []).slice(0, 4),
        modificheCv: (parsed.modificheCv ?? []).slice(0, 5),
        esperienzeConsigliate: (parsed.esperienzeConsigliate ?? []).filter(id => validIds.has(id)),
      },
    });
  } catch (err: unknown) {
    logger.error({ err }, "Error analyzing job compatibility");
    res.status(500).json({ error: "Errore durante l'analisi AI dell'offerta. Riprova tra qualche istante." });
  }
});

// ── AI translation of a foreign-language job ad ─────────────────────────────
jobsRouter.post("/translate", async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body as { title?: string; description?: string };
    if (!description || description.trim().length < 20) {
      res.status(400).json({ error: "Descrizione dell'offerta mancante o troppo corta." });
      return;
    }

    const prompt = `Traduci in italiano naturale e professionale il seguente annuncio di lavoro. Non tradurre nomi di aziende, tecnologie, acronimi o strumenti (es. React, AWS, SQL). Mantieni la struttura a paragrafi/elenchi dell'originale. Rispondi SOLO con JSON valido, senza markdown, con questa struttura esatta:
{"title": "titolo tradotto", "description": "descrizione tradotta"}

TITOLO ORIGINALE: ${(title ?? "").slice(0, 200)}

DESCRIZIONE ORIGINALE:
${description.trim().slice(0, 5000)}`;

    const raw = await generateText(prompt, { maxTokens: 1800, temperature: 0.3 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as { title?: string; description?: string };

    res.json({
      success: true,
      title: parsed.title || title || "",
      description: parsed.description || description,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Error translating job ad");
    res.status(500).json({ error: "Errore durante la traduzione dell'annuncio. Riprova tra qualche istante." });
  }
});
