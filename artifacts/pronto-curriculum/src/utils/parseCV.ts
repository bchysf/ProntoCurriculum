import { CVData } from '../types';

const ITALIAN_CITIES = [
  'Roma','Milano','Napoli','Torino','Palermo','Genova','Bologna','Firenze',
  'Bari','Catania','Venezia','Verona','Messina','Padova','Trieste','Taranto',
  'Brescia','Parma','Prato','Modena','Reggio','Perugia','Livorno','Ravenna',
  'Cagliari','Foggia','Rimini','Salerno','Ferrara','Sassari','Latina','Monza',
  'Siracusa','Pescara','Bergamo','Trento','Vicenza','Terni','Novara','Bolzano',
  'Piacenza','Ancona','Arezzo','Udine','Cesena','Lecce','La Spezia','Mугgio',
  'Muggiò','Sydney','Brisbane','London','Londra','Dubai','Berlin','Berlino',
  'Paris','Parigi','Amsterdam','Madrid','Barcelona','Vienna','Zurich','Zurigo',
];

const TITLE_KEYWORDS = [
  'engineer','ingegnere','developer','sviluppatore','manager','analyst','analista',
  'designer','architect','architetto','consultant','consulente','specialist',
  'specialista','coordinator','coordinatore','director','direttore','lead',
  'senior','junior','project','product','marketing','sales','hr','finance','cfo',
  'ceo','cto','coo','data scientist','devops','frontend','backend','fullstack',
  'operations','officer','executive','responsabile','amministratore','fondatore',
  'founder','teacher','insegnante','docente','professore','account','programmer',
  'programmatore','technician','tecnico','assistente','assistant',
];

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function cleanLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : '';
}

function extractPhone(text: string): string {
  const match = text.match(/(\+?[\d\s().-]{8,18})/);
  if (!match) return '';
  const cleaned = match[0].replace(/\s+/g, ' ').trim();
  if ((cleaned.match(/\d/g) || []).length < 7) return '';
  return cleaned;
}

function extractCity(text: string): string {
  const lower = text.toLowerCase();
  for (const city of ITALIAN_CITIES) {
    const re = new RegExp(`\\b${city.toLowerCase()}\\b`);
    if (re.test(lower)) return city;
  }
  return '';
}

function extractLinkedin(text: string): string {
  const match = text.match(/linkedin\.com\/in\/([\w%-]+)/i);
  return match ? `linkedin.com/in/${match[1]}` : '';
}

function extractName(lines: string[], email: string): { firstName: string; lastName: string } {
  const emailPrefix = email ? email.split('@')[0].toLowerCase() : '';

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = cleanLine(lines[i]);
    if (!line || line.length > 50 || line.length < 3) continue;
    if (/[@\d•|\/\\]/.test(line)) continue;
    if (/curriculum|vitae|resume|cv\b/i.test(line)) continue;

    const nameMatch = line.match(
      /^([A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+)\s+([A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+(?:\s+[A-ZÀÁÂÃÄÈÉÊËÌÍÎÏÒÓÔÙÚÛÜ][a-zA-ZÀ-ÿ'-]+)?)$/
    );
    if (!nameMatch) continue;

    const firstName = nameMatch[1];
    const lastName = nameMatch[2];
    const candidate = `${firstName}${lastName}`.toLowerCase().replace(/\s/g, '');

    if (emailPrefix && (emailPrefix.includes(firstName.toLowerCase()) || emailPrefix.includes(lastName.toLowerCase()))) {
      return { firstName, lastName };
    }
    if (!emailPrefix) return { firstName, lastName };
    if (candidate.length > 3) return { firstName, lastName };
  }
  return { firstName: '', lastName: '' };
}

function extractTitle(lines: string[], firstName: string, lastName: string): string {
  const nameLower = `${firstName} ${lastName}`.toLowerCase().trim();

  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const line = cleanLine(lines[i]);
    if (!line || line.length > 80 || line.length < 4) continue;
    if (/[@\d•|]/.test(line)) continue;
    if (nameLower && line.toLowerCase().includes(nameLower)) continue;

    const lower = line.toLowerCase();
    for (const kw of TITLE_KEYWORDS) {
      if (lower.includes(kw)) {
        return line.replace(/^[•\-–—·]\s*/, '').trim();
      }
    }
  }
  return '';
}

function extractSummary(text: string): string {
  const triggers = [
    /profil[oe]\s+professionale\s*[:\n]/i,
    /sommario\s*[:\n]/i,
    /presentazione\s*[:\n]/i,
    /about\s+me\s*[:\n]/i,
    /chi\s+sono\s*[:\n]/i,
    /objective\s*[:\n]/i,
    /summary\s*[:\n]/i,
    /profilo\s*[:\n]/i,
  ];

  for (const re of triggers) {
    const idx = text.search(re);
    if (idx === -1) continue;
    const after = text.slice(idx).replace(re, '').trim();
    const lines = after.split('\n');
    const para: string[] = [];
    for (const line of lines) {
      const l = cleanLine(line);
      if (!l) break;
      if (/^[A-Z\s]{4,}$/.test(l) && l.length > 15) break;
      para.push(l);
      if (para.join(' ').length > 600) break;
    }
    if (para.length) return para.join(' ').slice(0, 700).trim();
  }
  return '';
}

export function parseCVText(raw: string): Partial<CVData> {
  const text = normalizeText(raw);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const email = extractEmail(text);
  const phone = extractPhone(text);
  const city = extractCity(text);
  const linkedin = extractLinkedin(text);
  const { firstName, lastName } = extractName(lines, email);
  const title = extractTitle(lines, firstName, lastName);
  const summary = extractSummary(text);

  const result: Partial<CVData> = {};
  if (firstName) result.firstName = firstName;
  if (lastName) result.lastName = lastName;
  if (email) result.email = email;
  if (phone) result.phone = phone;
  if (city) result.city = city;
  if (linkedin) result.linkedin = linkedin;
  if (title) result.title = title;
  if (summary) result.summary = summary;

  return result;
}

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
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join('\n');
    pages.push(pageText);
  }
  return pages.join('\n');
}
