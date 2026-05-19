import { CVData, Experience, Education, Language } from '../types';

/* ──────────────────────────── helpers ──────────────────────────── */

const MONTHS_IT = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const MONTHS_EN = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTHS_ALL = [...MONTHS_IT, ...MONTHS_EN];

const SECTION_ALIASES: Record<string, string> = {
  'profilo professionale': 'profilo', 'profilo': 'profilo',
  'professional summary': 'profilo', 'summary': 'profilo',
  'about me': 'profilo', 'chi sono': 'profilo', 'presentazione': 'profilo',
  'esperienza': 'esperienza', 'esperienze': 'esperienza',
  'esperienza lavorativa': 'esperienza', 'esperienze lavorative': 'esperienza',
  'work experience': 'esperienza', 'professional experience': 'esperienza',
  'istruzione': 'istruzione', 'formazione': 'istruzione',
  'education': 'istruzione', 'studi': 'istruzione',
  'competenze': 'competenze', 'skills': 'competenze',
  'competenze tecniche': 'competenze', 'technical skills': 'competenze',
  'lingue': 'lingue', 'languages': 'lingue', 'lingua': 'lingue',
  'links': 'links', 'interessi': 'interessi', 'interests': 'interessi',
  'certificazioni': 'certificazioni', 'certifications': 'certificazioni',
};

const ITALIAN_CITIES = [
  'Roma','Milano','Napoli','Torino','Palermo','Genova','Bologna','Firenze','Bari',
  'Catania','Venezia','Verona','Messina','Padova','Trieste','Taranto','Brescia',
  'Parma','Prato','Modena','Perugia','Livorno','Cagliari','Foggia','Rimini',
  'Salerno','Ferrara','Monza','Bergamo','Trento','Novara','Bolzano','Ancona',
  'Udine','Lecce','Muggiò','Muggio',
  // World cities common in Italian CVs
  'Sydney','Brisbane','Melbourne','London','Londra','Dubai','Berlin','Berlino',
  'Paris','Parigi','Amsterdam','Madrid','Barcelona','Vienna','Zurich','Auckland',
  'Remote','New York','Singapore','Toronto',
];

const LANG_LEVELS: Record<string, string> = {
  'madrelingua': 'C2 - Madrelingua', 'nativo': 'C2 - Madrelingua', 'native': 'C2 - Madrelingua',
  'fluente': 'C1 - Avanzato', 'fluent': 'C1 - Avanzato', 'avanzato': 'C1 - Avanzato',
  'intermedio': 'B1 - Intermedio', 'intermediate': 'B1 - Intermedio',
  'base': 'A2 - Base', 'elementare': 'A2 - Base', 'basic': 'A2 - Base',
  'b1': 'B1 - Intermedio', 'b2': 'B2 - Intermedio superiore',
  'c1': 'C1 - Avanzato', 'c2': 'C2 - Madrelingua',
  'a1': 'A1 - Principiante', 'a2': 'A2 - Base',
};

function clean(s: string) { return s.replace(/\s+/g, ' ').trim(); }
function stripBullet(s: string) { return s.replace(/^[•\-–—·▸▪*]\s*/, '').trim(); }

function normalizeRaw(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]{3,}/g, '  ')
    .trim();
}

/* ──────────────────────────── section splitter ──────────────────── */

interface Section { key: string; lines: string[] }

function splitSections(lines: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section = { key: 'header', lines: [] };
  let i = 0;

  while (i < lines.length) {
    const line = clean(lines[i]);
    const lower = line.toLowerCase();

    // Check if this line (or this + next) is a known section header
    const singleKey = SECTION_ALIASES[lower];
    const nextLine = i + 1 < lines.length ? clean(lines[i + 1]).toLowerCase() : '';
    const combined = lower + ' ' + nextLine;
    const doubleKey = SECTION_ALIASES[combined.trim()];

    if (singleKey || doubleKey) {
      sections.push(current);
      current = { key: singleKey || doubleKey, lines: [] };
      if (doubleKey) i++; // consumed next line too
    } else {
      current.lines.push(line);
    }
    i++;
  }
  sections.push(current);
  return sections;
}

/* ──────────────────────────── field extractors ──────────────────── */

function extractEmail(text: string): string {
  const m = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].toLowerCase() : '';
}

function extractPhone(text: string): string {
  const m = text.match(/(\+?\d[\d\s()./-]{7,17}\d)/);
  if (!m) return '';
  const digits = (m[1].match(/\d/g) || []).length;
  return digits >= 7 ? m[1].trim() : '';
}

function extractCity(text: string): string {
  const lower = text.toLowerCase();
  for (const city of ITALIAN_CITIES) {
    if (new RegExp(`\\b${city.toLowerCase()}\\b`).test(lower)) return city;
  }
  return '';
}

function extractLinkedin(text: string): string {
  const m = text.match(/linkedin\.com\/in\/([\w%-]+)\/?/i);
  return m ? `linkedin.com/in/${m[1]}` : '';
}

/**
 * Try "Firstname Lastname, Title" or "Firstname Lastname" on the very first non-empty line.
 * Also handle first line of section header lines.
 */
function extractNameAndTitle(lines: string[]): { firstName: string; lastName: string; title: string } {
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const line = clean(lines[i]);
    if (!line || line.length < 3) continue;

    // Pattern: "Name Surname, Title..." — most common in Italian CVs
    const withTitle = line.match(
      /^([A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+(?:\s+[A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+){1,2})\s*,\s*(.+)$/
    );
    if (withTitle) {
      const nameParts = withTitle[1].trim().split(/\s+/);
      return {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        title: clean(withTitle[2]),
      };
    }

    // Pattern: just "Name Surname" alone
    const nameOnly = line.match(
      /^([A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+)\s+([A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+(?:\s+[A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+)?)$/
    );
    if (nameOnly && !/@/.test(line) && !/\d/.test(line)) {
      return { firstName: nameOnly[1], lastName: nameOnly[2], title: '' };
    }
  }
  return { firstName: '', lastName: '', title: '' };
}

/* ──────────────────────────── date helpers ──────────────────────── */

const DATE_FRAG = `(?:(?:${MONTHS_ALL.join('|')})\\s+)?\\d{4}|presente|present|oggi|current`;
const DATE_RANGE_RE = new RegExp(
  `(${DATE_FRAG})\\s*[—–-]+\\s*(${DATE_FRAG})`,
  'i'
);

function parseDateRange(line: string): { from: string; to: string } | null {
  const m = line.match(DATE_RANGE_RE);
  if (!m) return null;
  return {
    from: clean(m[1]),
    to: clean(m[2]).toLowerCase() === 'presente' || clean(m[2]).toLowerCase() === 'present'
      ? 'Presente' : clean(m[2]),
  };
}

/* ──────────────────────────── experience parser ─────────────────── */

function parseExperiences(lines: string[]): Experience[] {
  const exps: Experience[] = [];
  let current: Partial<Experience> | null = null;
  const descLines: string[] = [];

  const flush = () => {
    if (current) {
      exps.push({
        id: Date.now().toString() + Math.random(),
        company: current.company || '',
        role: current.role || '',
        city: current.city || '',
        from: current.from || '',
        to: current.to || '',
        desc: descLines.map(stripBullet).filter(Boolean).join(' '),
      });
    }
    descLines.length = 0;
  };

  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) continue;

    const dr = parseDateRange(line);
    if (dr) {
      flush();
      current = { from: dr.from, to: dr.to };

      // Try to extract role/company from same line after the date range
      const afterDate = line.replace(DATE_RANGE_RE, '').trim();
      if (afterDate) {
        // afterDate might be "Role, Company   City" or "Role, Company"
        const roleCompanyCity = afterDate.match(/^([^,]+),\s*([^,]+?)(?:\s{2,}(.+))?$/);
        if (roleCompanyCity) {
          current.role = clean(roleCompanyCity[1]);
          current.company = clean(roleCompanyCity[2]);
          if (roleCompanyCity[3]) current.city = extractCity(roleCompanyCity[3]) || clean(roleCompanyCity[3]);
        } else {
          // No comma — might be just "Role  City"
          const parts = afterDate.split(/\s{2,}/);
          current.role = clean(parts[0]);
          if (parts[1]) current.city = extractCity(parts[1]) || clean(parts[1]);
        }
      }
    } else if (current) {
      // Check if this line has role/company info (no date yet set role/company)
      if (!current.role && !line.startsWith('•')) {
        const roleCompanyCity = line.match(/^([^,•\-]+),\s*([^,\-]+?)(?:\s{2,}(.+))?$/);
        if (roleCompanyCity) {
          current.role = clean(roleCompanyCity[1]);
          current.company = clean(roleCompanyCity[2]);
          if (roleCompanyCity[3]) current.city = extractCity(roleCompanyCity[3]) || clean(roleCompanyCity[3]);
        } else {
          const parts = line.split(/\s{2,}/);
          if (parts.length >= 2 && !line.includes('•')) {
            current.role = clean(parts[0]);
            current.city = extractCity(parts[parts.length - 1]) || '';
          } else {
            descLines.push(line);
          }
        }
      } else {
        descLines.push(line);
      }
    }
  }
  flush();
  return exps.filter(e => e.company || e.role);
}

/* ──────────────────────────── education parser ──────────────────── */

function parseEducation(lines: string[]): Education[] {
  const edu: Partial<Education> & { descLines?: string[] } = { descLines: [] };
  const results: Education[] = [];

  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) continue;

    const dr = parseDateRange(line);
    if (dr) {
      edu.from = dr.from; edu.to = dr.to;
    } else if (line.match(/diploma|laurea|bachelor|master|mba|phd|dottorato|liceo|istituto|università|university|college|scuola/i)) {
      const parts = line.split(/\s{2,}/);
      edu.degree = clean(stripBullet(parts[0]));
      if (parts[1]) edu.institution = clean(parts[1]);
    } else if (line.match(/\d{3}\/\d{3}|cum laude|con lode|voto/i)) {
      edu.grade = clean(line.replace(/\bvoto[:.\s]*/i, ''));
    } else if (stripBullet(line).length > 5) {
      if (!edu.institution && !line.match(/^[A-Z\s]{3,}$/)) {
        edu.institution = clean(stripBullet(line).split(/\s{2,}/)[0]);
      } else {
        edu.descLines?.push(stripBullet(line));
      }
    }
  }

  if (edu.degree || edu.institution) {
    results.push({
      id: Date.now().toString(),
      institution: edu.institution || '',
      degree: edu.degree || '',
      grade: edu.grade || '',
      from: edu.from || '',
      to: edu.to || '',
    });
  }
  return results;
}

/* ──────────────────────────── skills parser ────────────────────── */

function parseSkills(lines: string[]): string[] {
  const skills: string[] = [];
  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) continue;
    // Split by common delimiters: comma, 2+ spaces, bullet, pipe
    const parts = line.split(/[,|•·]|\s{2,}/).map(s => clean(stripBullet(s))).filter(s => s.length > 1 && s.length < 50);
    skills.push(...parts);
  }
  return [...new Set(skills)].filter(Boolean);
}

/* ──────────────────────────── language parser ──────────────────── */

function parseLanguages(lines: string[]): Language[] {
  const langs: Language[] = [];
  for (const rawLine of lines) {
    const line = clean(rawLine);
    if (!line) continue;
    // "Italiano  nativo  Inglese  fluente" type lines
    // Split by 2+ spaces or by named patterns
    const parts = line.split(/\s{2,}|\t/).map(clean).filter(Boolean);

    let i = 0;
    while (i < parts.length) {
      const lang = parts[i];
      const lvlRaw = parts[i + 1] || '';
      const lvlKey = lvlRaw.toLowerCase();
      const level = LANG_LEVELS[lvlKey] || lvlRaw;

      if (lang.length > 2 && lang.length < 30 && !lang.match(/^\d/)) {
        langs.push({ id: Date.now().toString() + Math.random(), name: lang, level: level || 'B1 - Intermedio' });
        i += level ? 2 : 1;
      } else {
        i++;
      }
    }
  }
  return langs.filter(l => l.name.length > 1);
}

/* ──────────────────────────── main export ──────────────────────── */

export function parseCVText(raw: string): Partial<CVData> {
  const text = normalizeRaw(raw);
  const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Global field extraction (works across full text)
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const city = extractCity(text);
  const linkedin = extractLinkedin(text);
  const { firstName, lastName, title } = extractNameAndTitle(allLines);

  // Section-based parsing
  const sections = splitSections(allLines);

  let summary = '';
  let experiences: Experience[] = [];
  let education: Education[] = [];
  let skills: string[] = [];
  let languages: Language[] = [];

  for (const sec of sections) {
    const { key, lines } = sec;

    if (key === 'profilo') {
      summary = lines.map(l => clean(stripBullet(l))).filter(Boolean).join(' ').slice(0, 700);
    } else if (key === 'esperienza') {
      experiences = parseExperiences(lines);
    } else if (key === 'istruzione') {
      education = parseEducation(lines);
    } else if (key === 'competenze') {
      skills = parseSkills(lines);
    } else if (key === 'lingue') {
      languages = parseLanguages(lines);
    }
  }

  const result: Partial<CVData> = {};
  if (firstName) result.firstName = firstName;
  if (lastName) result.lastName = lastName;
  if (email) result.email = email;
  if (phone) result.phone = phone;
  if (city) result.city = city;
  if (linkedin) result.linkedin = linkedin;
  if (title) result.title = title;
  if (summary) result.summary = summary;
  if (experiences.length) result.experiences = experiences;
  if (education.length) result.education = education;
  if (skills.length) result.skills = skills;
  if (languages.length) result.languages = languages;

  return result;
}

/* ──────────────────────────── PDF reader ───────────────────────── */

export async function extractTextFromPDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Filter to TextItem only (have str + transform), sort by y desc then x asc
    const items = content.items
      .filter((item) => 'str' in item && 'transform' in item) as Array<{ str: string; transform: number[] }>;

    items.sort((a, b) => {
      const yDiff = Math.round(b.transform[5] / 4) - Math.round(a.transform[5] / 4);
      return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
    });

    // Group by approximate Y position into lines
    const lineMap = new Map<number, string[]>();
    for (const item of items) {
      const yKey = Math.round(item.transform[5] / 4) * 4;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey)!.push(item.str);
    }

    const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
    const pageLines = sortedYs.map(y => lineMap.get(y)!.join('  '));
    pages.push(pageLines.join('\n'));
  }

  return pages.join('\n');
}
