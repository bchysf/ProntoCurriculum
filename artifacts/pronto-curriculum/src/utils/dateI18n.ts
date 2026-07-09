import type { SupportedLanguage } from './aiTranslate';

// Deterministic month/"present" translation for date-range strings like "Mag 2018" or "Presente".
// No AI involved — this is a closed, well-defined vocabulary, so a lookup table is both
// faster and more reliable than asking an LLM to reformat dates.
const MONTHS: Record<SupportedLanguage, string[]> = {
  IT: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  EN: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  FR: ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
  DE: ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  ES: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  PT: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
};

const PRESENT: Record<SupportedLanguage, string> = {
  IT: 'Presente', EN: 'Present', FR: 'Présent', DE: 'Heute', ES: 'Actualidad', PT: 'Atual',
};

function findMonthIndex(token: string): number | null {
  const clean = token.toLowerCase().replace(/\.$/, '');
  for (const lang of Object.keys(MONTHS) as SupportedLanguage[]) {
    const idx = MONTHS[lang].findIndex(m => m.toLowerCase().startsWith(clean.slice(0, 3)) || clean.startsWith(m.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return null;
}

function isPresentWord(token: string): boolean {
  const clean = token.toLowerCase().trim();
  return Object.values(PRESENT).some(w => w.toLowerCase() === clean);
}

// Translates a single date-range field like "Mag 2018", "2018", or "Presente" into targetLang.
export function translateDateLabel(value: string, targetLang: SupportedLanguage): string {
  if (!value || !value.trim()) return value;
  const trimmed = value.trim();

  if (isPresentWord(trimmed)) return PRESENT[targetLang];

  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    const [monthTok, year] = parts;
    const idx = findMonthIndex(monthTok!);
    if (idx !== null && /^\d{4}$/.test(year!)) {
      return `${MONTHS[targetLang][idx]} ${year}`;
    }
  }

  // Plain year or unrecognized format — leave as-is.
  return trimmed;
}
