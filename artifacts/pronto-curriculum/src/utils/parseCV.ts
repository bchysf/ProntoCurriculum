import { CVData } from '../types';

const ITALIAN_CITIES = [
  'Roma','Milano','Napoli','Torino','Palermo','Genova','Bologna','Firenze',
  'Bari','Catania','Venezia','Verona','Messina','Padova','Trieste','Taranto',
  'Brescia','Parma','Prato','Modena','Reggio Calabria','Reggio Emilia',
  'Perugia','Livorno','Ravenna','Cagliari','Foggia','Rimini','Salerno','Ferrara',
  'Sassari','Latina','Giugliano','Monza','Siracusa','Pescara','Bergamo',
  'Forlì','Trento','Vicenza','Terni','Novara','Bolzano','Piacenza','Ancona',
  'Andria','Arezzo','Udine','Cesena','Lecce','Barletta','La Spezia',
];

const TITLE_KEYWORDS = [
  'engineer','ingegnere','developer','sviluppatore','manager','analyst','analista',
  'designer','architect','architetto','consultant','consulente','specialist',
  'specialista','coordinator','coordinatore','director','direttore','lead',
  'senior','junior','project','product','marketing','sales','hr','finance',
  'data scientist','devops','frontend','backend','fullstack','full stack',
];

function cleanLine(line: string) {
  return line.replace(/\s+/g, ' ').trim();
}

function extractEmail(text: string): string {
  const match = text.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

function extractPhone(text: string): string {
  const match = text.match(/(\+39[\s.-]?)?([0-9]{2,3}[\s.-]?[0-9]{3,4}[\s.-]?[0-9]{3,4})/);
  return match ? match[0].trim() : '';
}

function extractCity(text: string): string {
  const lower = text.toLowerCase();
  for (const city of ITALIAN_CITIES) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return '';
}

function extractLinkedin(text: string): string {
  const match = text.match(/linkedin\.com\/in\/([\w-]+)/i);
  return match ? `linkedin.com/in/${match[1]}` : '';
}

function extractName(lines: string[]): { firstName: string; lastName: string } {
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = cleanLine(lines[i]);
    if (!line) continue;
    if (line.match(/^[A-ZÀ-Ü][a-zA-ZÀ-ü'-]+ [A-ZÀ-Ü][a-zA-ZÀ-ü'-]+$/)) {
      const parts = line.split(' ');
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
  }
  return { firstName: '', lastName: '' };
}

function extractTitle(lines: string[]): string {
  for (let i = 0; i < Math.min(8, lines.length); i++) {
    const line = cleanLine(lines[i]).toLowerCase();
    if (!line) continue;
    for (const kw of TITLE_KEYWORDS) {
      if (line.includes(kw)) return cleanLine(lines[i]);
    }
  }
  return '';
}

function extractSummary(text: string): string {
  const triggers = [
    /profil[oe]\s+professionale\s*[:\n]/i,
    /sommario\s*[:\n]/i,
    /presentazione\s*[:\n]/i,
    /about\s*[:\n]/i,
    /chi\s+sono\s*[:\n]/i,
    /objective\s*[:\n]/i,
  ];
  for (const re of triggers) {
    const m = text.search(re);
    if (m !== -1) {
      const after = text.slice(m).split('\n').slice(1);
      const para: string[] = [];
      for (const line of after) {
        const l = cleanLine(line);
        if (!l) break;
        if (l.length > 200) break;
        para.push(l);
        if (para.join(' ').length > 300) break;
      }
      if (para.length) return para.join(' ').slice(0, 500);
    }
  }
  return '';
}

export function parseCVText(text: string): Partial<CVData> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const { firstName, lastName } = extractName(lines);

  return {
    firstName,
    lastName,
    email: extractEmail(text),
    phone: extractPhone(text),
    city: extractCity(text),
    linkedin: extractLinkedin(text),
    title: extractTitle(lines),
    summary: extractSummary(text),
  };
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
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(pageText);
  }
  return pages.join('\n');
}
