// Structured data backing the /lavoro/lombardia pSEO hub and its city spokes.
// Every figure carries a source — see CITATIONS. Do not add a city profile
// here without first researching real, citable numbers for it (programmatic
// SEO content-authenticity rule: never fabricate labour-market data).

export interface CitySector {
  name: string;
  note: string;
}

export interface CityProfile {
  slug: string;
  name: string;
  province: string;
  intro: string;
  avgRal: string;
  unemploymentNote: string;
  sectors: CitySector[];
  advice: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  updated: string; // ISO date, tied to when the underlying stats were verified
}

export const REGION_STATS = {
  employmentRate: "70,3%",
  employmentRateNote: "popolazione 15-64 anni, I trimestre 2026",
  unemploymentRate: "2,8%",
  unemploymentRateNote: "I trimestre 2026, tra i più bassi d'Italia",
  employedTotal: "4,628 milioni",
  employedTotalNote: "occupati in Lombardia, I trimestre 2026 (+0,8% su base annua)",
  avgRal: "€35.137",
  avgRalNote: "retribuzione annua lorda media regionale",
  updated: "2026-08-28",
};

export const REGION_SOURCES = [
  { label: "Regione Lombardia — Lombardia Speciale, numeri del lavoro 2025", url: "https://www.lombardiaspeciale.regione.lombardia.it" },
  { label: "Unioncamere Lombardia — Osservatorio mercato del lavoro", url: "https://www.unioncamerelombardia.it" },
  { label: "Indeed — Stipendio medio in Lombardia", url: "https://it.indeed.com/guida-alla-carriera/retribuzione-stipendio/stipendio-medio-in-lombardia" },
];

export const CITY_PROFILES: CityProfile[] = [
  {
    slug: "milano",
    name: "Milano",
    province: "Città metropolitana di Milano",
    intro:
      "Milano è il principale mercato del lavoro della Lombardia e d'Italia: capitale della finanza, della moda e polo tech in crescita, con una RAL media tra le più alte del Paese.",
    avgRal: "€37.661–40.000",
    unemploymentNote: "in linea con il dato regionale lombardo del 2,8%, tra i più bassi d'Italia",
    sectors: [
      { name: "Finanza e servizi bancari", note: "RAL media di settore più alta d'Italia, circa €45.900; oltre €100.000 nel private banking senior" },
      { name: "Moda e lusso", note: "sede di Gucci, Prada, Versace, Armani, Dolce & Gabbana; forte domanda di ruoli merchandising, buying, digital" },
      { name: "Tecnologia e software", note: "software engineer e sviluppatori tra €40.000 e €55.000 di RAL" },
      { name: "Manifattura e industria", note: "buona tenuta per ingegneria, automazione e supply chain" },
    ],
    advice:
      "A Milano il CV deve reggere il confronto con un mercato molto competitivo: numeri e risultati misurabili contano più delle descrizioni generiche, e per i settori finance/fashion la formattazione ATS-friendly resta decisiva perché la maggior parte delle grandi aziende filtra le candidature con software di screening prima che un recruiter le legga.",
    faq: [
      { q: "Qual è lo stipendio medio a Milano nel 2026?", a: "La RAL media a Milano è tra €37.661 e €40.000 lordi annui, contro una media regionale lombarda di €35.137. I settori finanza e moda pagano sopra la media, mentre i ruoli entry-level junior si attestano più in basso." },
      { q: "Quali sono i settori che assumono di più a Milano?", a: "Finanza e servizi bancari, moda e lusso, tecnologia/software e manifattura ad alto contenuto tecnico sono i settori con la domanda più stabile a Milano." },
      { q: "Il tasso di disoccupazione a Milano è alto?", a: "No: la Lombardia nel suo complesso ha un tasso di disoccupazione del 2,8% (I trimestre 2026), tra i più bassi d'Italia, e Milano come motore economico regionale è in linea o sotto questo dato." },
    ],
    sources: [
      { label: "Indeed — Stipendio medio a Milano", url: "https://it.indeed.com/guida-alla-carriera/retribuzione-stipendio/stipendio-medio-milano" },
      { label: "Regione Lombardia — numeri del lavoro 2025", url: "https://www.lombardiaspeciale.regione.lombardia.it" },
    ],
    updated: "2026-08-28",
  },
];

export function getCityProfile(slug: string): CityProfile | undefined {
  return CITY_PROFILES.find((c) => c.slug === slug);
}

// Capoluoghi still without a researched profile — listed on the hub as
// "in arrivo" so the hub page is honest about coverage instead of faking
// data for them. Populate CITY_PROFILES with real sourced data before
// promoting an entry out of this list.
export const PLANNED_CITIES = [
  "Bergamo", "Brescia", "Como", "Cremona", "Lecco",
  "Lodi", "Mantova", "Monza e Brianza", "Pavia", "Sondrio", "Varese",
];
