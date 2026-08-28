import { generateText } from "./ai";
import type { PublicProfilePageData } from "../ssr/publicProfilePage";

export const SUPPORTED_LANGS: Record<string, string> = {
  IT: "Italiano",
  EN: "English",
  FR: "Français",
  DE: "Deutsch",
  ES: "Español",
  PT: "Português",
};

interface TranslatablePayload {
  headline: string;
  bio: string;
  experiences: { id: string; role: string; desc: string }[];
  highlights: { id: string; title: string; desc: string }[];
  education: { id: string; degree: string }[];
  languages: { id: string; name: string; level: string }[];
  skills: string[];
}

// Best-effort in-memory cache — each serverless instance keeps its own, so this
// mainly helps warm invocations avoid re-translating on every reload; it is not
// a durable cache across deploys or cold starts.
const cache = new Map<string, { data: PublicProfilePageData; expiresAt: number }>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export async function getTranslatedProfile(data: PublicProfilePageData, lang: string): Promise<PublicProfilePageData> {
  if (lang === "IT" || !SUPPORTED_LANGS[lang]) return data;

  const cacheKey = `${data.slug}:${lang}:${data.updatedAt ?? ""}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const langName = SUPPORTED_LANGS[lang];

  const payload: TranslatablePayload = {
    headline: data.headline ?? "",
    bio: data.bio ?? "",
    experiences: data.experiences.map((e, i) => ({ id: String(i), role: e.role, desc: e.description ?? "" })),
    highlights: data.highlights.map((h, i) => ({ id: String(i), title: h.title, desc: h.description ?? "" })),
    education: data.education.map((e, i) => ({ id: String(i), degree: e.degree })),
    languages: data.languages.map((l, i) => ({ id: String(i), name: l.name, level: l.level })),
    skills: data.skills,
  };

  const prompt = `Sei un traduttore professionale specializzato in pagine profilo professionali.\n\nLINGUA TARGET: ${langName} (codice: ${lang})\n\nRicevi un JSON con SOLO i campi da tradurre. Traduci TUTTI i valori stringa non vuoti, mantenendo la stessa struttura e gli stessi "id":\n- "headline": titolo professionale, breve\n- "bio": bio professionale, stile naturale nella lingua target\n- "experiences[].role": titolo del ruolo\n- "experiences[].desc": descrizione mansioni (mantieni bullet "• " se presenti)\n- "highlights[].title": titolo di un progetto/riconoscimento/attività di volontariato\n- "highlights[].desc": descrizione\n- "education[].degree": titolo di studio\n- "languages[].name": nome della lingua parlata (es. "Inglese" → "English" in EN, "Anglais" in FR)\n- "languages[].level": livello linguistico (es. "C1 - Avanzato" → "C1 - Advanced" in EN)\n- "skills[]": ogni competenza\n\nSTILE: professionale, naturale nella lingua target, non letterale parola-per-parola.\nVINCOLO ASSOLUTO: restituisci SOLO il JSON con la stessa struttura e gli stessi "id". Zero testo extra, zero markdown.\n\nTraduci in ${langName}:\n\n${JSON.stringify(payload)}`;

  try {
    const raw = await generateText(prompt, { maxTokens: 3000 });
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const translated = JSON.parse(jsonStr) as TranslatablePayload;

    const result: PublicProfilePageData = {
      ...data,
      headline: translated.headline || data.headline,
      bio: translated.bio || data.bio,
      experiences: data.experiences.map((e, i) => {
        const tr = translated.experiences?.find((t) => t.id === String(i));
        if (!tr) return e;
        return { ...e, role: tr.role || e.role, description: tr.desc || e.description };
      }),
      highlights: data.highlights.map((h, i) => {
        const tr = translated.highlights?.find((t) => t.id === String(i));
        if (!tr) return h;
        return { ...h, title: tr.title || h.title, description: tr.desc || h.description };
      }),
      education: data.education.map((e, i) => {
        const tr = translated.education?.find((t) => t.id === String(i));
        if (!tr) return e;
        return { ...e, degree: tr.degree || e.degree };
      }),
      languages: data.languages.map((l, i) => {
        const tr = translated.languages?.find((t) => t.id === String(i));
        if (!tr) return l;
        return { ...l, name: tr.name || l.name, level: tr.level || l.level };
      }),
      skills: translated.skills?.length ? translated.skills : data.skills,
    };

    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  } catch {
    return data;
  }
}
