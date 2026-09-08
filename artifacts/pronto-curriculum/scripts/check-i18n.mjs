#!/usr/bin/env node
// Scans .tsx files that already use the i18n system (useT) for hardcoded
// Italian text that bypasses it — JSX text nodes and title/placeholder/
// aria-label/alt attributes containing raw Italian strings instead of
// t('key'). A file that never adopted useT at all is out of scope: that's
// a product decision, not an i18n regression.
//
// This is a heuristic, not a parser — false positives happen (proper nouns,
// code-like tokens, intentional example placeholders). Silence a specific
// line with `// i18n-ok` at the end of it.
//
// Usage: node scripts/check-i18n.mjs [--fail] [--deep]
//   --fail   exit 1 if anything is found (wired into `npm run build`)
//   --deep   also scan plain string literals in JS/TS logic (toast/error
//            messages, array data, etc.), not just JSX. Much noisier —
//            picks up object keys, seed/demo content, and FAQ-style data
//            arrays alongside real bugs, so it's opt-in and not part of
//            the build gate. Run it by hand occasionally and triage.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, '..', 'src');

const EXCLUDED_PATHS = [
  path.join(SRC_DIR, 'i18n'),
  path.join(SRC_DIR, 'utils', 'dateI18n.ts'),
  path.join(SRC_DIR, 'data'),
  // Long-form editorial/legal content that is intentionally Italian-only
  // regardless of the app's UI language (site is Italian-market-first);
  // these pages still use useT() for their surrounding chrome, but their
  // body copy is content, not UI, so it's out of scope for this check.
  path.join(SRC_DIR, 'pages', 'Resources.tsx'),
  path.join(SRC_DIR, 'pages', 'Legal.tsx'),
];

// Common Italian function words / verbs that essentially never appear in
// legitimate English/French/German/Spanish/Portuguese UI copy or in proper
// nouns, URLs, or code tokens.
const ITALIAN_WORDS = [
  'il', 'lo', 'la', 'gli', 'le', 'dei', 'delle', 'degli', 'della', 'dello', 'del',
  'che', 'con', 'per', 'sono', 'hai', 'tuo', 'tua', 'tuoi', 'tue', 'nel', 'nella',
  'nei', 'nelle', 'questo', 'questa', 'questi', 'queste', 'come', 'più', 'già',
  'però', 'anche', 'senza', 'dopo', 'prima', 'salva', 'salvato', 'salvata',
  'elimina', 'aggiungi', 'aggiungere', 'modifica', 'cerca', 'carica', 'caricamento',
  'scarica', 'accedi', 'esci', 'annulla', 'conferma', 'attenzione', 'errore',
  'nome', 'cognome', 'inserisci', 'seleziona', 'scegli', 'continua', 'indietro',
  'chiudi', 'apri', 'esperienza', 'esperienze', 'competenze', 'formazione',
  'lingua', 'lingue', 'certificazioni', 'titolo', 'azienda', 'ruolo', 'città',
  'telefono', 'obbligatorio', 'campo', 'campi', 'oppure', 'oppure', 'grazie',
  'benvenuto', 'benvenuta', 'account', 'password', 'iscriviti', 'registrati',
  'accesso', 'disattiva', 'disattivala', 'abbiamo', 'trovato', 'bozza',
  'completato', 'nuovo', 'nuova', 'vuoi', 'lasciato', 'iniziarne', 'iniziare',
];
const WORD_RE = new RegExp(`\\b(${ITALIAN_WORDS.join('|')})\\b`, 'i');
const ACCENT_RE = /[àèéìòù]/i;

function isItalianish(text) {
  const t = text.trim();
  if (t.length < 3) return false;
  if (ACCENT_RE.test(t)) return true;
  return WORD_RE.test(t);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (EXCLUDED_PATHS.some(ex => full === ex || full.startsWith(ex + path.sep))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}

const ATTR_RE = /\b(title|placeholder|aria-label|alt)=["']([^"']+)["']/g;
// A JSX text node: '>' then non-tag/non-brace text then '<'.
const TEXT_NODE_RE = />([^<>{}\n][^<>{}]*)</g;
// A quoted string literal anywhere in JS/TS logic (not just JSX) — catches
// hardcoded user-facing strings pushed into arrays, returned, etc. outside
// any markup, e.g. `issues.push('Struttura lineare...')`.
const STRING_LITERAL_RE = /(['"`])((?:\\.|(?!\1)[^\\\n])+)\1/g;

const deep = process.argv.includes('--deep');

function scanFile(file) {
  const src = readFileSync(file, 'utf8');
  if (!/\buseT\s*\(/.test(src)) return [];

  const findings = [];
  const lines = src.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('i18n-ok')) return;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    let m;
    ATTR_RE.lastIndex = 0;
    while ((m = ATTR_RE.exec(line))) {
      if (isItalianish(m[2])) {
        findings.push({ line: idx + 1, snippet: m[0].slice(0, 100) });
      }
    }
    TEXT_NODE_RE.lastIndex = 0;
    while ((m = TEXT_NODE_RE.exec(line))) {
      if (isItalianish(m[1])) {
        findings.push({ line: idx + 1, snippet: m[1].trim().slice(0, 100) });
      }
    }
    // Plain string literals (outside JSX) — e.g. array pushes, returns.
    // Skip import/export lines to dodge module specifiers.
    if (deep && !/^\s*(import|export)\b/.test(line)) {
      STRING_LITERAL_RE.lastIndex = 0;
      while ((m = STRING_LITERAL_RE.exec(line))) {
        if (isItalianish(m[2])) {
          findings.push({ line: idx + 1, snippet: m[0].slice(0, 100) });
        }
      }
    }
  });
  return findings;
}

const files = walk(SRC_DIR);
let total = 0;
for (const file of files) {
  const findings = scanFile(file);
  if (findings.length === 0) continue;
  const rel = path.relative(process.cwd(), file);
  for (const f of findings) {
    console.log(`${rel}:${f.line}  ${f.snippet}`);
    total++;
  }
}

if (total === 0) {
  console.log('check-i18n: no hardcoded Italian UI text found in useT() files.');
} else {
  console.log(`\ncheck-i18n: ${total} possible untranslated string(s) found above.`);
  console.log('Wrap them with t(\'your.key\') and add the key to src/i18n/translations.ts,');
  console.log('or append "// i18n-ok" to a line to mark it as an intentional exception.');
}

if (process.argv.includes('--fail') && total > 0) {
  process.exit(1);
}
