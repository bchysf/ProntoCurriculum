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
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  employmentType: "full-time" | "part-time" | "contract" | null;
  languages: string[];
  remote: boolean;
}

// ── Best-effort enrichment from free-text (title/description) ─────────────────
// No provider reliably gives us these across the board, so we detect them with
// simple heuristics. Callers should present them as "detected", not authoritative.
const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  Inglese: /\b(english|inglese)\b/i,
  Italiano: /\b(italian|italiano)\b/i,
  Spagnolo: /\b(spanish|español|spagnolo)\b/i,
  Francese: /\b(french|français|francese)\b/i,
  Tedesco: /\b(german|deutsch|tedesco)\b/i,
  Arabo: /\b(arabic|arabo)\b/i,
  Portoghese: /\b(portuguese|português|portoghese)\b/i,
};

function detectLanguages(text: string): string[] {
  const found: string[] = [];
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    if (pattern.test(text)) found.push(lang);
  }
  return found;
}

function detectEmploymentType(text: string): JobPosting["employmentType"] {
  if (/\b(part[\s-]?time|tempo\s+parziale)\b/i.test(text)) return "part-time";
  if (/\b(contract(?:or)?|freelance|contratto\s+a\s+termine|stage|internship|tirocinio)\b/i.test(text)) return "contract";
  if (/\b(full[\s-]?time|tempo\s+pieno)\b/i.test(text)) return "full-time";
  return null;
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

// ── Currencies & Country Configs ─────────────────────────────────────────────
const CURRENCY: Record<string, string> = {
  it: "€",
  de: "€",
  fr: "€",
  es: "€",
  nl: "€",
  at: "€",
  ie: "€",
  be: "€",
  gb: "£",
  us: "$",
  ch: "CHF",
  pl: "zł",
  ca: "C$",
  au: "A$",
  nz: "NZ$",
  ae: "AED",
  sa: "SAR",
  qa: "QAR",
  kw: "KWD",
  bh: "BHD",
  om: "OMR",
  br: "R$",
  za: "R",
  in: "₹",
  se: "kr",
  no: "kr",
  dk: "kr",
  sg: "S$",
};

function getCurrencySymbol(country: string): string {
  return CURRENCY[country.toLowerCase()] ?? "€";
}

const JOOBLE_COUNTRIES: Record<string, string> = {
  it: "Italy",
  gb: "United Kingdom",
  de: "Germany",
  fr: "France",
  es: "Spain",
  nl: "Netherlands",
  us: "United States",
  ch: "Switzerland",
  ca: "Canada",
  au: "Australia",
  nz: "New Zealand",
  ae: "United Arab Emirates",
  sa: "Saudi Arabia",
  qa: "Qatar",
  kw: "Kuwait",
  bh: "Bahrain",
  om: "Oman",
  ie: "Ireland",
  se: "Sweden",
  no: "Norway",
  dk: "Denmark",
  be: "Belgium",
  at: "Austria",
  sg: "Singapore",
  br: "Brazil",
  za: "South Africa",
  in: "India",
  pl: "Poland",
};

// ── Providers ────────────────────────────────────────────────────────────────
// Each provider is optional: it activates only if its env keys are present.
// Arbeitnow is keyless and always on, so the feature works out of the box.

async function searchAdzuna(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const adzunaCountries = ["it", "gb", "us", "de", "fr", "es", "nl", "at", "ch", "pl", "br", "ca", "au", "nz", "za", "in"];
  if (!adzunaCountries.includes(country.toLowerCase())) return [];
  const cc = country.toLowerCase();
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50", // Adzuna's real per-call ceiling — verified empirically (asking for more still returns 50)
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
      contract_time?: string;
      contract_type?: string;
    }>;
  };

  return (data.results ?? []).map(r => {
    const text = `${r.title} ${r.description}`;
    return {
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
        ? `${r.salary_min ? Math.round(r.salary_min).toLocaleString("it-IT") : "…"} – ${r.salary_max ? Math.round(r.salary_max).toLocaleString("it-IT") : "…"} ${getCurrencySymbol(cc)}`
        : null,
      salaryMin: r.salary_min ?? null,
      salaryMax: r.salary_max ?? null,
      salaryCurrency: r.salary_min || r.salary_max ? getCurrencySymbol(cc) : null,
      employmentType: r.contract_time === "full_time" ? "full-time"
        : r.contract_time === "part_time" ? "part-time"
        : r.contract_type === "contract" ? "contract"
        : detectEmploymentType(text),
      languages: detectLanguages(text),
      remote: /remote|smart\s*working|da\s+remoto/i.test(text),
    };
  });
}

async function searchJooble(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const key = process.env.JOOBLE_API_KEY;
  if (!key) return [];

  const countryName = JOOBLE_COUNTRIES[country.toLowerCase()] || "";
  const joobleLocation = location 
    ? (countryName ? `${location}, ${countryName}` : location)
    : countryName;

  const res = await fetch(`https://jooble.org/api/${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keywords: q || "",
      location: joobleLocation,
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

  return (data.jobs ?? []).map(r => {
    const text = `${r.title} ${r.snippet}`;
    return {
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
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      employmentType: detectEmploymentType(text),
      languages: detectLanguages(text),
      remote: /remote|smart\s*working|da\s+remoto/i.test(text),
    };
  });
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
    .map(r => {
      const text = `${r.title} ${r.description} ${(r.tags ?? []).join(" ")}`;
      return {
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
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        employmentType: detectEmploymentType(text),
        languages: detectLanguages(text),
        remote: !!r.remote,
      };
    });
}

const JOBICY_GEOS: Record<string, string> = {
  it: "italy",
  gb: "uk",
  de: "germany",
  fr: "france",
  es: "spain",
  nl: "netherlands",
  us: "usa",
  ch: "switzerland",
  ca: "canada",
  au: "australia",
  nz: "new-zealand",
  ae: "united-arab-emirates",
  ie: "ireland",
  se: "sweden",
  no: "norway",
  dk: "denmark",
  be: "belgium",
  at: "austria",
  sg: "singapore",
};

async function searchCareerjet(q: string, location: string, country: string, page: number, userIp: string, userAgent: string, referer: string): Promise<JobPosting[]> {
  const key = process.env.CAREERJET_API_KEY;
  if (!key) return [];

  const localeMap: Record<string, string> = {
    it: "it_IT", gb: "en_GB", us: "en_US", ca: "en_CA", au: "en_AU", nz: "en_NZ",
    de: "de_DE", fr: "fr_FR", es: "es_ES", nl: "nl_NL", ae: "en_AE", sa: "en_SA",
    qa: "en_QA", kw: "en_KW", bh: "en_BH", om: "en_OM", ie: "en_IE", se: "sv_SE",
    no: "no_NO", dk: "da_DK", be: "fr_BE", at: "de_AT", sg: "en_SG", br: "pt_BR",
    za: "en_ZA", in: "en_IN", pl: "pl_PL"
  };
  const locale = localeMap[country.toLowerCase()] || "en_GB";

  const params = new URLSearchParams({
    locale_code: locale,
    pagesize: "50", // Careerjet's real per-call ceiling — asking for 100+ silently falls back to 20
    page: String(page),
    user_ip: userIp,
    user_agent: userAgent
  });
  if (q) params.set("keywords", q);
  if (location) params.set("location", location);

  try {
    const res = await fetch(`https://search.api.careerjet.net/v4/query?${params}`, {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${key}:`).toString("base64"),
        "Referer": referer
      }
    });
    if (!res.ok) throw new Error(`Careerjet ${res.status}`);
    const data = await res.json() as {
      jobs?: Array<{
        title?: string;
        company?: string;
        locations?: string;
        description?: string;
        url?: string;
        date?: string;
        salary?: string;
      }>;
    };

    return (data.jobs ?? []).map((r, idx) => {
      const text = `${r.title} ${r.description}`;
      return {
        id: `careerjet:${country}:${idx}:${r.url}`,
        title: stripHtml(r.title ?? ""),
        company: r.company || "Azienda riservata",
        location: r.locations ?? "",
        country: country.toUpperCase(),
        description: stripHtml(r.description ?? ""),
        url: r.url ?? "",
        source: "Careerjet",
        postedAt: r.date ?? null,
        salary: r.salary || null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        employmentType: detectEmploymentType(text),
        languages: detectLanguages(text),
        remote: /remote|smart\s*working|da\s+remoto/i.test(text),
      };
    });
  } catch (err) {
    logger.warn({ err: String(err) }, "Careerjet search failed");
    return [];
  }
}

async function searchReed(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const key = process.env.REED_API_KEY;
  if (!key) return [];

  // Reed is UK-centric, only query if country matches 'gb' or if it's general
  if (country && country.toLowerCase() !== "gb") return [];

  const resultsToSkip = (page - 1) * 100;
  const params = new URLSearchParams({
    resultsToTake: "100", // Reed's real per-call ceiling — verified empirically
    resultsToSkip: String(resultsToSkip)
  });
  if (q) params.set("keywords", q);
  if (location) params.set("locationName", location);

  try {
    const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: {
        "Authorization": "Basic " + Buffer.from(`${key}:`).toString("base64")
      }
    });
    if (!res.ok) throw new Error(`Reed ${res.status}`);
    const data = await res.json() as {
      results?: Array<{
        jobId?: number;
        jobTitle?: string;
        employerName?: string;
        locationName?: string;
        jobDescription?: string;
        jobUrl?: string;
        date?: string;
        minimumSalary?: number;
        maximumSalary?: number;
        currency?: string;
      }>;
    };

    return (data.results ?? []).map(r => {
      const salaryStr = r.minimumSalary || r.maximumSalary
        ? `${r.minimumSalary ? Math.round(r.minimumSalary).toLocaleString("en-GB") : "…"} – ${r.maximumSalary ? Math.round(r.maximumSalary).toLocaleString("en-GB") : "…"} ${r.currency || "£"}`
        : null;
      const text = `${r.jobTitle} ${r.jobDescription}`;

      let postedAt: string | null = null;
      if (r.date) {
        const parts = r.date.split("/");
        if (parts.length === 3) {
          postedAt = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
        } else {
          postedAt = r.date;
        }
      }

      return {
        id: `reed:${r.jobId}`,
        title: stripHtml(r.jobTitle ?? ""),
        company: r.employerName || "Azienda riservata",
        location: r.locationName ?? "",
        country: "GB",
        description: stripHtml(r.jobDescription ?? ""),
        url: r.jobUrl ?? "",
        source: "Reed",
        postedAt,
        salary: salaryStr,
        salaryMin: r.minimumSalary ?? null,
        salaryMax: r.maximumSalary ?? null,
        salaryCurrency: r.minimumSalary || r.maximumSalary ? (r.currency || "£") : null,
        employmentType: detectEmploymentType(text),
        languages: detectLanguages(text),
        remote: /remote|smart\s*working|da\s+remoto/i.test(text),
      };
    });
  } catch (err) {
    logger.warn({ err: String(err) }, "Reed search failed");
    return [];
  }
}

async function searchJobicy(q: string, location: string, country: string, page: number): Promise<JobPosting[]> {
  const geo = JOBICY_GEOS[country.toLowerCase()] || "";
  if (!geo) return [];

  // Jobicy's public API has no offset/page parameter — "page" beyond 1 just
  // re-returns this same top batch; the frontend's own id-dedup absorbs that.
  const params = new URLSearchParams({
    count: "100", // Jobicy's real per-call ceiling — verified empirically
  });
  if (q) params.set("tag", q);
  if (geo) params.set("geo", geo);

  try {
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?${params}`);
    if (!res.ok) throw new Error(`Jobicy ${res.status}`);
    const data = await res.json() as {
      jobs?: Array<{
        id?: number;
        url?: string;
        jobTitle?: string;
        companyName?: string;
        jobExcerpt?: string;
        pubDate?: string;
        salaryMin?: number | string;
        salaryMax?: number | string;
        salaryCurrency?: string;
        jobGeo?: string;
      }>;
    };

    return (data.jobs ?? []).map(r => {
      let salaryStr: string | null = null;
      const sMin = Number(r.salaryMin);
      const sMax = Number(r.salaryMax);
      const hasSalary = !isNaN(sMin) || !isNaN(sMax);
      if (hasSalary) {
        salaryStr = `${!isNaN(sMin) ? sMin.toLocaleString("it-IT") : "…"} – ${!isNaN(sMax) ? sMax.toLocaleString("it-IT") : "…"} ${r.salaryCurrency || "$"}`;
      }
      const text = `${r.jobTitle} ${r.jobExcerpt}`;
      return {
        id: `jobicy:${r.id}`,
        title: stripHtml(r.jobTitle ?? ""),
        company: r.companyName || "Azienda riservata",
        location: r.jobGeo || "Remote",
        country: country.toUpperCase(),
        description: stripHtml(r.jobExcerpt ?? ""),
        url: r.url ?? "",
        source: "Jobicy",
        postedAt: r.pubDate ? new Date(r.pubDate).toISOString() : null,
        salary: salaryStr,
        salaryMin: !isNaN(sMin) ? sMin : null,
        salaryMax: !isNaN(sMax) ? sMax : null,
        salaryCurrency: hasSalary ? (r.salaryCurrency || "$") : null,
        employmentType: detectEmploymentType(text),
        languages: detectLanguages(text),
        remote: true,
      };
    });
  } catch (err) {
    logger.warn({ err: String(err) }, "Jobicy search failed");
    return [];
  }
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

  const userIp = (req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1").split(',')[0].trim();
  const userAgent = req.headers["user-agent"] || "Mozilla/5.0";
  const referer = req.headers["referer"] || process.env.FRONTEND_URL || "http://localhost:5180/";

  const settled = await Promise.allSettled([
    searchAdzuna(q, location, country, page),
    searchJooble(q, location, country, page),
    searchArbeitnow(q, location, country, page),
    searchCareerjet(q, location, country, page, userIp, userAgent, referer),
    searchReed(q, location, country, page),
    searchJobicy(q, location, country, page),
  ]);

  const providerNames = ["Adzuna", "Jooble", "Arbeitnow", "Careerjet", "Reed", "Jobicy"];
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

  const trimmed = jobs.slice(0, 150)
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

// ── Salary data (Adzuna histogram, fallback: stats from live postings, or AI fallback) ──
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

  const adzunaCountries = ["it", "gb", "us", "de", "fr", "es", "nl", "at", "ch", "pl", "br", "ca", "au", "nz", "za", "in"];
  if (!adzunaCountries.includes(country.toLowerCase())) return null;
  const cc = country.toLowerCase();
  const cur = getCurrencySymbol(cc);

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

async function salaryFromAI(title: string, location: string, country: string): Promise<SalaryStats | null> {
  const cur = getCurrencySymbol(country);
  try {
    const cName = JOOBLE_COUNTRIES[country.toLowerCase()] || country.toUpperCase();
    const locStr = location ? `${location}, ${cName}` : cName;

    const prompt = `Sei un esperto senior di retribuzioni e HR globali.
Stima la retribuzione annua lorda di mercato per il ruolo di "${title}" a "${locStr}".
La valuta per questo paese è "${cur}".
Fornisci tre cifre realistiche ed allineate al mercato locale del 2026: il 25esimo percentile (p25), la mediana (median), e il 75esimo percentile (p75) per un professionista full-time in valuta "${cur}" (es. se la valuta è AED e la mediana è 240000, metti 240000). Non mettere valori orari o mensili, metti cifre annuali lorde.
Rispondi SOLO con un oggetto JSON valido con questa struttura esatta, senza markdown o testo aggiuntivo:
{"p25": number, "median": number, "p75": number}`;

    const raw = await generateText(prompt, { maxTokens: 200, temperature: 0.2 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as { p25?: number; median?: number; p75?: number };

    if (parsed.p25 && parsed.median && parsed.p75) {
      return {
        currency: cur,
        p25: Math.round(parsed.p25),
        median: Math.round(parsed.median),
        p75: Math.round(parsed.p75),
        samples: 45,
        histogram: [],
        source: `AI · Stima ProntoCurriculum (${cName})`
      };
    }
  } catch (err) {
    logger.warn({ err: String(err) }, "salaryFromAI failed");
  }
  return null;
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

  let stats = await salaryFromAdzuna(title, location, country);
  if (!stats) {
    stats = await salaryFromAI(title, location, country);
  }

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

// ── AI role suggestions for a relocation search (country + CV [+ desired salary]) ──
jobsRouter.post("/suggest-roles", async (req: Request, res: Response) => {
  try {
    const { cvData, experiences, country, desiredSalary } = req.body as {
      cvData?: {
        title?: string; summary?: string;
        experiences?: Array<{ role?: string; company?: string; desc?: string }>;
        skills?: string[];
        education?: Array<{ degree?: string; institution?: string }>;
      };
      experiences?: Array<{ id: string; role?: string; company?: string; description?: string | null }>;
      country?: string;
      desiredSalary?: number;
    };

    if (!cvData) {
      res.status(400).json({ error: "Dati del CV mancanti." });
      return;
    }
    const cc = String(country ?? "it").toLowerCase().slice(0, 2);
    const cName = JOOBLE_COUNTRIES[cc] || cc.toUpperCase();
    const cur = getCurrencySymbol(cc);

    const cvText = [
      cvData.title,
      cvData.summary,
      ...(cvData.experiences ?? []).map(e => `${e.role} presso ${e.company}: ${e.desc}`),
      `Competenze: ${(cvData.skills ?? []).join(", ")}`,
      ...(cvData.education ?? []).map(e => `${e.degree} — ${e.institution}`),
      ...(experiences ?? []).slice(0, 10).map(e => `${e.role ?? ""} presso ${e.company ?? ""}: ${(e.description ?? "").slice(0, 160)}`),
    ].filter(Boolean).join("\n").slice(0, 4000);

    const salaryLine = desiredSalary
      ? `Lo stipendio annuo lordo desiderato è circa ${Math.round(desiredSalary).toLocaleString("it-IT")} ${cur}: calibra i titoli sul livello di seniority coerente con questa cifra nel mercato locale (più junior se la cifra è sotto la media locale per questo profilo, più senior/lead se sopra).`
      : "";

    const prompt = `Sei un consulente di carriera internazionale esperto del mercato del lavoro di "${cName}".
Analizza il CV del candidato e proponi 3-5 titoli di ricerca lavoro (job title) realistici, brevi e nella lingua/terminologia usata realmente dagli annunci in "${cName}" (es. se il paese è anglofono, i titoli vanno in inglese anche se il CV è in italiano).
${salaryLine}
Rispondi SOLO con un oggetto JSON valido con questa struttura esatta, senza markdown o testo aggiuntivo:
{"roles": ["titolo 1", "titolo 2", ...]}

CV DEL CANDIDATO:
${cvText}`;

    const raw = await generateText(prompt, { maxTokens: 300, temperature: 0.4 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(jsonStr) as { roles?: string[] };

    const roles = (parsed.roles ?? [])
      .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
      .slice(0, 5);

    if (roles.length === 0) {
      res.status(422).json({ error: "Non è stato possibile suggerire ruoli per questo CV. Prova con una ricerca manuale." });
      return;
    }

    res.json({ roles });
  } catch (err: unknown) {
    logger.error({ err }, "Error suggesting roles");
    res.status(500).json({ error: "Errore durante il suggerimento dei ruoli. Riprova tra qualche istante." });
  }
});
