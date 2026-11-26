// jsPDF's built-in fonts (Helvetica etc.) only cover WinAnsi / Windows-1252.
// A single character outside that set — typically the non-breaking hyphen
// U+2011 that AI rewrites love ("large‑scale", "2015‑2019") — makes jsPDF
// encode the whole string as UTF-16: the line comes out letter-spaced, the
// offending glyph vanishes, and since splitTextToSize measured the normal
// width, the text runs off the right edge of the page.
//
// Everything that goes into the PDF passes through toWinAnsi() first.

// Non-ASCII characters that ARE in Windows-1252 (beyond Latin-1 U+00A0–U+00FF).
const CP1252_EXTRA = new Set(
  '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''),
);

const REPLACEMENTS: Record<string, string> = {
  '‐': '-', // hyphen
  '‑': '-', // non-breaking hyphen
  '‒': '–', // figure dash
  '―': '—', // horizontal bar
  '−': '-', // minus sign
  '⁃': '-', // hyphen bullet
  '­': '',  // soft hyphen
  '​': '', '‌': '', '‍': '', '⁠': '', '﻿': '', // zero-width
  '′': "'", '″': '"', '‛': '’', '‟': '”',
  '‹': '‹', '›': '›',
  '•': '•', '‣': '•', '●': '•', '▪': '•', '◦': '•', '∙': '•', '·': '·',
  '→': '->', '←': '<-', '↔': '<->', '⇒': '=>',
  '✓': '', '✔': '', '✅': '',
  '≤': '<=', '≥': '>=', '≈': '~', '≠': '!=',
  '…': '…',
};

function isWinAnsi(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || c === 0x0a || CP1252_EXTRA.has(ch);
}

export function toWinAnsi(input: string): string {
  if (!input) return input;
  let out = '';
  for (const ch of input) {
    if (isWinAnsi(ch)) { out += ch; continue; }
    if (ch in REPLACEMENTS) { out += REPLACEMENTS[ch]; continue; }
    const c = ch.codePointAt(0)!;
    // All Unicode space variants (NBSP-likes, thin/en/em spaces, ideographic).
    if (/\s/u.test(ch) || (c >= 0x2000 && c <= 0x200a) || c === 0x202f || c === 0x205f || c === 0x3000) { out += ' '; continue; }
    // Accented letters outside Latin-1 (č, ć, ł, ő, ș…): drop the accent.
    const base = ch.normalize('NFKD').replace(/\p{M}/gu, '');
    out += [...base].every(isWinAnsi) ? base : '';
  }
  return out;
}

/** Patch a jsPDF document so every text/measure call is sanitised. */
export function sanitizeDocText<T extends {
  text: (...args: any[]) => any;
  splitTextToSize: (...args: any[]) => any;
  getTextWidth: (...args: any[]) => any;
}>(doc: T): T {
  const clean = (v: unknown): unknown =>
    typeof v === 'string' ? toWinAnsi(v) : Array.isArray(v) ? v.map(clean) : v;
  const text = doc.text.bind(doc);
  const split = doc.splitTextToSize.bind(doc);
  const width = doc.getTextWidth.bind(doc);
  doc.text = ((t: unknown, ...rest: unknown[]) => text(clean(t), ...rest)) as T['text'];
  doc.splitTextToSize = ((t: unknown, ...rest: unknown[]) => split(clean(t), ...rest)) as T['splitTextToSize'];
  doc.getTextWidth = ((t: unknown) => width(clean(t))) as T['getTextWidth'];
  return doc;
}
