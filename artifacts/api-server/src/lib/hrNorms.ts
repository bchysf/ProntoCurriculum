// Country-specific CV conventions used to ground the AI CV review. The model
// is told to base "weaknesses" on these, so feedback reflects how recruiters
// in that market actually screen CVs instead of generic advice. Keys match
// the lowercase country codes used by the frontend's country pickers.

export interface CountryNorms {
  name: string;
  norms: string[];
}

const ANGLO_NO_PERSONAL_DATA =
  'Do NOT include a photo, date of birth/age, marital status, gender or religion: recruiters are trained to discard or ignore them to avoid discrimination claims, and a photo can get the CV rejected outright.';

const GULF: string[] = [
  'A professional headshot is commonly expected.',
  'Nationality, visa/residency status, date of birth and marital status are commonly listed and not considered inappropriate.',
  '2–3 pages are acceptable for experienced candidates.',
  'State notice period / availability and whether you hold a local driving licence (e.g. UAE licence) — both are screening criteria.',
  'Arabic language skills are a plus; English is the working language for most multinational roles.',
  'No GDPR consent clause.',
];

const NORDIC: string[] = [
  '1–2 pages; concise, factual and modest in tone — self-praise and buzzwords come across poorly, concrete results do not.',
  'A photo is optional and fairly common (especially in Sweden and Denmark); not required.',
  'A short personal profile and brief interests section are normal and read as culture-fit signals.',
  'References are usually "available on request" rather than listed.',
  'English CVs are accepted at international companies; the local language is expected for public sector and many local SMEs.',
  'No GDPR consent clause.',
];

export const HR_NORMS: Record<string, CountryNorms> = {
  it: {
    name: 'Italy',
    norms: [
      '1–2 pages; reverse-chronological order.',
      'A professional photo is common and accepted, but optional.',
      'Recruiters routinely expect the GDPR consent clause at the bottom ("Autorizzo il trattamento dei miei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003"); its absence is often noticed.',
      'Europass format is still standard for the public sector and "concorsi", but private companies and multinationals see it as dated and prefer a modern, concise layout.',
      'Language skills should use CEFR levels (A1–C2); English level is closely checked.',
      'For recent graduates the degree grade (e.g. 110/110 e lode) is relevant; driving licence (Patente B) is commonly listed.',
      'Date of birth is optional and increasingly omitted.',
    ],
  },
  gb: {
    name: 'United Kingdom',
    norms: [
      'Maximum 2 pages.',
      ANGLO_NO_PERSONAL_DATA + ' (Equality Act 2010).',
      'Open with a short personal statement / profile tailored to the role.',
      'Achievement-focused bullets with quantified results; British spelling.',
      '"References available on request" is outdated filler — omit it.',
      'No GDPR consent clause — it reads as a foreign CV.',
      'Non-UK candidates should state right-to-work / visa status.',
    ],
  },
  ie: {
    name: 'Ireland',
    norms: [
      '2 pages.',
      'No photo, date of birth or marital status (Employment Equality Acts).',
      'Short profile at top; achievement-focused bullets.',
      'Europass is uncommon in the private sector.',
      'No GDPR consent clause.',
      'Non-EU candidates should state work permit / Stamp status.',
    ],
  },
  us: {
    name: 'United States',
    norms: [
      'Called a "resume": 1 page for under ~10 years of experience, 2 pages maximum otherwise.',
      ANGLO_NO_PERSONAL_DATA + ' (EEO laws).',
      'Every bullet should start with an action verb and show a measurable result; duties-only bullets are a major weakness.',
      'US spelling; city + state only (no full street address).',
      'Simple ATS-friendly formatting; LinkedIn URL expected.',
      'No GDPR consent clause, no "References available on request".',
      'State work authorization if the candidate would need sponsorship.',
    ],
  },
  ca: {
    name: 'Canada',
    norms: [
      '1–2 pages.',
      ANGLO_NO_PERSONAL_DATA + ' (provincial Human Rights Codes).',
      'Achievement-focused bullets with measurable results.',
      'English/French bilingualism is a strong asset (essential for many Quebec and federal roles).',
      'No GDPR consent clause.',
      'State work permit / PR status if not a citizen.',
    ],
  },
  au: {
    name: 'Australia',
    norms: [
      '2–4 pages is normal (longer than US/UK).',
      'No photo, date of birth or marital status.',
      'Career summary at top; key achievements per role.',
      'Referees (usually two, with contact details) are commonly listed at the end.',
      'State visa / work rights clearly if not a citizen or PR.',
      'No GDPR consent clause.',
    ],
  },
  nz: {
    name: 'New Zealand',
    norms: [
      '2–3 pages.',
      'No photo, date of birth or marital status.',
      'Referees are commonly listed at the end.',
      'State visa / work rights if not a citizen or resident.',
      'No GDPR consent clause.',
    ],
  },
  de: {
    name: 'Germany',
    norms: [
      'The "Lebenslauf" is tabular, reverse-chronological, max 2 pages.',
      'A professional photo is still common, though legally optional under the AGG; date of birth and place of birth are often included.',
      'Exact dates in MM/YYYY format are expected; unexplained gaps ("Lücken") are scrutinised — gaps over ~3 months should be explained.',
      'Recruiters value formal qualifications, certificates and Arbeitszeugnisse; list certifications explicitly.',
      'German-language roles expect a German CV; an English CV is fine only if the job ad is in English.',
      'Language levels in CEFR (A1–C2); German level is a key screening criterion.',
      'No GDPR consent clause.',
    ],
  },
  at: {
    name: 'Austria',
    norms: [
      'Tabular Lebenslauf, reverse-chronological, 1–2 pages.',
      'A professional photo is common; date of birth often included.',
      'Exact MM/YYYY dates; gaps should be explained.',
      'German CV expected for German-language roles; CEFR language levels.',
      'No GDPR consent clause.',
    ],
  },
  ch: {
    name: 'Switzerland',
    norms: [
      '2 pages, tabular and precise.',
      'A professional photo is common; date of birth and nationality are usually included.',
      'Non-Swiss candidates should state their work permit (B, C, L, G) — employers screen on it.',
      'Languages are critical (German/French/Italian/English) with CEFR levels.',
      'References ("Referenzen") are often listed.',
      'No GDPR consent clause.',
    ],
  },
  fr: {
    name: 'France',
    norms: [
      '1 page strongly preferred for under ~10 years of experience; 2 max.',
      'A CV title stating the target role plus a short "accroche" (hook) at the top is standard.',
      'Photo is optional and increasingly omitted for anti-discrimination reasons.',
      'Driving licence (permis B) is commonly listed; languages with CEFR or clear levels.',
      'French CV expected for French-language roles.',
      'No GDPR consent clause.',
    ],
  },
  es: {
    name: 'Spain',
    norms: [
      '1–2 pages.',
      'A photo is still common and accepted.',
      'Europass is accepted, but a modern layout stands out in the private sector.',
      'Languages with CEFR levels; English level is closely checked.',
      'Driving licence (carnet de conducir) is commonly listed.',
      'No Italian-style GDPR clause.',
    ],
  },
  pt: {
    name: 'Portugal',
    norms: [
      '1–2 pages.',
      'A photo is common and accepted.',
      'Europass remains widely used and accepted.',
      'Languages with CEFR levels.',
      'No Italian-style GDPR clause.',
    ],
  },
  nl: {
    name: 'Netherlands',
    norms: [
      '1–2 pages; direct, concise tone — get to the point.',
      'Photo is optional.',
      'A short personal profile at top; results-focused bullets.',
      'English CVs are widely accepted at international companies.',
      'No GDPR consent clause.',
    ],
  },
  be: {
    name: 'Belgium',
    norms: [
      '1–2 pages.',
      'Photo is fairly common but optional.',
      'Languages are a key screening criterion (French/Dutch/English) — state levels clearly.',
      'No GDPR consent clause.',
    ],
  },
  se: { name: 'Sweden', norms: NORDIC },
  no: { name: 'Norway', norms: NORDIC },
  dk: { name: 'Denmark', norms: NORDIC },
  ae: { name: 'United Arab Emirates', norms: GULF },
  sa: { name: 'Saudi Arabia', norms: GULF },
  qa: { name: 'Qatar', norms: GULF },
  kw: { name: 'Kuwait', norms: GULF },
  bh: { name: 'Bahrain', norms: GULF },
  om: { name: 'Oman', norms: GULF },
  sg: {
    name: 'Singapore',
    norms: [
      '2 pages.',
      'Photo is optional; the Tripartite Guidelines on Fair Employment discourage age, race, religion and marital status.',
      'State nationality / work pass status (Citizen, PR, Employment Pass) — employers screen on it.',
      'Achievement-focused bullets; expected salary is sometimes asked for separately, not on the CV.',
      'No GDPR consent clause.',
    ],
  },
};

// Applies everywhere; country norms take precedence when they conflict.
export const UNIVERSAL_NORMS: string[] = [
  'Recruiters spend seconds on a first scan: the title and summary must immediately say who the candidate is and what they target.',
  'Bullets should describe achievements and impact, ideally quantified, not just duties.',
  'Consistent reverse-chronological order and consistent date formats.',
  'ATS parsing: standard section names, keywords matching the target role.',
  'CV content language should match the language of the target market / job ad.',
];
