// Experience "from"/"to" fields are free text (e.g. "Gen 2020", "03/2021",
// "Presente"), entered in whatever language the user picked for the CV — so
// this parses best-effort rather than assuming one fixed format.

const PRESENT_RE = /presente|present|ongoing|current|now\b|oggi|attuale|aujourd|heute|actualidad|atualidade|maintenant|derzeit|em curso/i;

const MONTHS: Record<string, number> = {
  gennaio: 1, gen: 1, jan: 1, january: 1, janvier: 1, januar: 1, enero: 1, janeiro: 1,
  febbraio: 2, feb: 2, february: 2, fevrier: 2, février: 2, februar: 2, febrero: 2, fevereiro: 2,
  marzo: 3, mar: 3, march: 3, mars: 3, marz: 3, märz: 3,
  aprile: 4, apr: 4, april: 4, avril: 4, abril: 4,
  maggio: 5, mag: 5, may: 5, mai: 5, mayo: 5,
  giugno: 6, giu: 6, jun: 6, june: 6, juin: 6, juni: 6, junio: 6, junho: 6,
  luglio: 7, lug: 7, jul: 7, july: 7, juillet: 7, juli: 7, julio: 7, julho: 7,
  agosto: 8, ago: 8, aug: 8, august: 8, aout: 8, août: 8,
  settembre: 9, set: 9, sep: 9, sept: 9, september: 9, septembre: 9, septiembre: 9, setembro: 9,
  ottobre: 10, ott: 10, oct: 10, october: 10, octobre: 10, oktober: 10, octubre: 10, outubro: 10,
  novembre: 11, nov: 11, november: 11, noviembre: 11, novembro: 11,
  dicembre: 12, dic: 12, dec: 12, december: 12, decembre: 12, dezember: 12, diciembre: 12, dezembro: 12,
};

function monthFromText(text: string): number {
  const lower = text.toLowerCase();
  for (const [name, num] of Object.entries(MONTHS)) {
    if (lower.includes(name)) return num;
  }
  const numeric = lower.match(/\b(0?[1-9]|1[0-2])[/\-.]\d{2,4}\b/) ?? lower.match(/\b\d{4}[/\-.](0?[1-9]|1[0-2])\b/);
  if (numeric) return parseInt(numeric[1], 10);
  return 0;
}

// Higher = more recent. Present/ongoing sorts as the most recent possible
// date; an unparseable or empty string sorts as the oldest.
function dateValue(raw: string | undefined): number {
  const s = (raw ?? '').trim();
  if (!s || PRESENT_RE.test(s)) return Infinity;
  const year = s.match(/\d{4}/);
  if (!year) return -Infinity;
  return parseInt(year[0], 10) * 12 + monthFromText(s);
}

// Descending compare that stays finite-safe when both sides are the same
// infinity (e.g. two "present" roles), where a plain subtraction gives NaN.
function compareDesc(a: number, b: number): number {
  return a === b ? 0 : b - a;
}

export function sortExperiencesChronologically<T extends { from: string; to: string }>(experiences: T[]): T[] {
  return [...experiences].sort((a, b) => {
    const byEnd = compareDesc(dateValue(a.to), dateValue(b.to));
    if (byEnd !== 0) return byEnd;
    return compareDesc(dateValue(a.from), dateValue(b.from));
  });
}
