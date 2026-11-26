import type { CVData } from '../types';
import { CV_LABELS, type CvLang } from '../components/CVPreview';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { consumeCvEntitlement } from './entitlement';
import { sanitizeDocText } from './pdfText';

// ── exact CSS variable values from index.css ──────────────────────────────────
const NAVY   = [11, 29, 58]   as [number, number, number]; // #0B1D3A
const GOLD   = [201, 168, 76] as [number, number, number]; // #C9A84C
const EU     = [0, 51, 153]   as [number, number, number]; // #003399
const GRAY5  = [122, 117, 106] as [number, number, number]; // --gray500 #7A756A
const GRAY7  = [61, 57, 48]   as [number, number, number]; // --gray700 #3D3930

interface TemplateSpec {
  headerBg: [number, number, number] | null; // null = no fill (minimal)
  headerText: [number, number, number];
  sectionColor: [number, number, number];
  accentColor: [number, number, number];
}

const CHARCOAL: [number,number,number] = [45, 55, 72];   // #2D3748
const TEAL:     [number,number,number] = [66, 153, 225];  // #4299E1
const BLACK:    [number,number,number] = [26, 26, 26];    // #1a1a1a

const SPECS: Record<string, TemplateSpec> = {
  modern:        { headerBg: NAVY,     headerText: [255,255,255], sectionColor: GOLD,    accentColor: GOLD    },
  minimal:       { headerBg: null,     headerText: NAVY,          sectionColor: NAVY,    accentColor: GOLD    },
  executive:     { headerBg: NAVY,     headerText: [255,255,255], sectionColor: GOLD,    accentColor: GOLD    },
  professionale: { headerBg: NAVY,     headerText: [255,255,255], sectionColor: NAVY,    accentColor: GOLD    },
  europass:      { headerBg: EU,       headerText: [255,255,255], sectionColor: EU,      accentColor: EU      },
  classico:      { headerBg: null,     headerText: BLACK,         sectionColor: BLACK,   accentColor: BLACK   },
  tecnico:       { headerBg: CHARCOAL, headerText: [255,255,255], sectionColor: CHARCOAL,accentColor: TEAL    },
  compatto:      { headerBg: NAVY,     headerText: [255,255,255], sectionColor: NAVY,    accentColor: GOLD    },
  milano:        { headerBg: null,     headerText: NAVY,          sectionColor: NAVY,    accentColor: GOLD    },
  elegante:      { headerBg: null,     headerText: BLACK,         sectionColor: [150,100,50], accentColor: GOLD },
  nordico:       { headerBg: null,     headerText: [30,78,52],    sectionColor: [30,78,52],  accentColor: [30,78,52] },
  corporate:     { headerBg: null,          headerText: BLACK,   sectionColor: BLACK,   accentColor: GRAY5   },
};

// ─────────────────────────────────────────────────────────────────────────────
// Fitting to one page tightens the layout in two stages: first whitespace and
// leading (`tightness` 0 → 1), and only if that is not enough, the font
// (down to MIN_FONT_RATIO of the user's chosen size). Past that floor the CV
// is rendered at its natural size on two pages instead of being crushed.
const MIN_FONT_RATIO = 0.8;
const MAX_LEADING_CUT = 0.15; // line height shrinks at most 15%
const MAX_GAP_CUT = 0.5;      // whitespace between blocks shrinks at most 50%

interface BuildPDFOptions {
  scale?: number;
  tightness?: number;
  // Skips pagination so `finalY` reports the true content height, used to
  // decide how much (if any) shrinking is needed to fit one page.
  measureOnly?: boolean;
}

async function buildPDF(cvData: CVData, template: string, lang: CvLang = 'IT', opts: BuildPDFOptions = {}) {
  const { scale = 1, tightness = 0, measureOnly = false } = opts;
  const { jsPDF } = await import('jspdf');
  const spec = SPECS[template] ?? SPECS.modern;
  const L = CV_LABELS[lang] ?? CV_LABELS.IT;

  // Every string is mapped to WinAnsi first — see pdfText.ts for why.
  const doc = sanitizeDocText(new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' }));
  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 15;
  const CW = PAGE_W - M * 2;

  let y = 0;

  // "Mar 2020 – Present", "2020", or nothing — never a dangling " – Present".
  const dateRange = (from?: string, to?: string) => {
    const f = (from ?? '').trim();
    const t = (to ?? '').trim();
    if (!f && !t) return '';
    if (!f) return t;
    return `${f} – ${t || L.present}`;
  };

  // fs = font size, lh = line advance (follows the font, with tighter leading
  // when fitting), gap = whitespace between blocks (compresses the most).
  const fs = (base: number) => Math.round(base * scale * 100) / 100;
  const lh = (base: number) => base * scale * (1 - MAX_LEADING_CUT * tightness);
  const gap = (base: number) => base * scale * (1 - MAX_GAP_CUT * tightness);
  // Multi-line text drawn one line at a time so the advance matches lh() exactly
  // (jsPDF's own multi-line leading would disagree with what we reserve).
  const textLines = (lines: string[], x: number, advance: number) => {
    for (const ln of lines) { doc.text(ln, x, y); y += advance; }
  };

  const checkPage = (need = 20) => {
    if (measureOnly) return;
    if (y > PAGE_H - lh(need)) { doc.addPage(); y = 20; }
  };

  const setBody = (bold = false, size = 10) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fs(size));
    doc.setTextColor(...GRAY7);
  };

  const sectionTitle = (title: string) => {
    checkPage(30);
    doc.setTextColor(...spec.sectionColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fs(10));
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(...spec.sectionColor);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, PAGE_W - M, y + 1.5);
    y += lh(5) + gap(2.5);
    setBody();
  };

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const fullName = `${cvData.firstName} ${cvData.lastName}`.trim() || 'Nome Cognome';

  const drawPhoto = (y0: number, size = 24) => {
    if (!cvData.photo) return;
    const match = /^data:image\/(png|jpe?g|webp);base64,/i.exec(cvData.photo);
    if (!match) return;
    const format = match[1].toLowerCase().startsWith('jpe') ? 'JPEG' : match[1].toUpperCase();
    try {
      doc.addImage(cvData.photo, format, PAGE_W - M - size, y0, size, size);
    } catch {
      // corrupted/unsupported image data — skip silently, rest of the CV still renders
    }
  };

  if (spec.headerBg) {
    // coloured block header (modern / executive / professionale / europass)
    doc.setFillColor(...spec.headerBg);
    doc.rect(0, 0, PAGE_W, 46, 'F');

    if (template === 'professionale') {
      // gold accent bar at the bottom of the header
      doc.setFillColor(...GOLD);
      doc.rect(0, 43, PAGE_W, 3, 'F');
    }
    if (template === 'europass') {
      // EU stars row
      doc.setFillColor(255, 215, 0);
      // ★ isn't in Helvetica's WinAnsi set, so draw the stars as dots.
      for (let i = 0; i < 5; i++) doc.circle(M + 1 + i * 4.5, 6.8, 0.9, 'F');
      doc.setFontSize(7);
      doc.setTextColor(200, 200, 200);
      doc.text('Curriculum Vitae', M, 13);
    }

    doc.setTextColor(...spec.headerText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(template === 'europass' ? 19 : 22);
    doc.text(fullName, M, template === 'europass' ? 24 : 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(cvData.title || '', M, template === 'europass' ? 31 : 27);

    doc.setFontSize(8.5);
    const contacts = [cvData.email, cvData.phone, cvData.city, cvData.linkedin].filter(Boolean);
    if (contacts.length) doc.text(contacts.join('   |   '), M, template === 'europass' ? 38 : 37);

    drawPhoto(11, 24);

    y = 46 + gap(8);
  } else {
    // minimal — no background, just name + navy bottom border
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(fullName, M, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...GRAY5);
    doc.text(cvData.title || '', M, 30);

    doc.setFontSize(9);
    const contacts = [cvData.email, cvData.phone, cvData.city, cvData.linkedin].filter(Boolean);
    if (contacts.length) doc.text(contacts.join('   |   '), M, 37);

    // navy bottom rule
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.6);
    doc.line(M, 41, PAGE_W - M, 41);

    drawPhoto(6, 24);

    y = 41 + gap(7);
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  if (cvData.summary?.trim()) {
    sectionTitle(L.profile);
    setBody(false, 9.5);
    doc.setTextColor(...GRAY7);
    textLines(doc.splitTextToSize(cvData.summary, CW), M, lh(5));
    y += gap(5);
  }

  // ── SKILLS ──────────────────────────────────────────────────────────────────
  const effectiveSkills = cvData.skillCategories?.length
    ? cvData.skillCategories.flatMap(c => c.skills ?? [])
    : cvData.skills;
  if (effectiveSkills?.length) {
    checkPage(25);
    sectionTitle(L.skills);
    setBody(false, 9.5);
    doc.setTextColor(...GRAY7);
    textLines(doc.splitTextToSize(effectiveSkills.join(' • '), CW), M, lh(5));
    y += gap(5);
  }

  // ── EXPERIENCES ──────────────────────────────────────────────────────────────
  if (cvData.experiences?.length) {
    sectionTitle(L.experience);
    for (const exp of cvData.experiences) {
      checkPage(25);

      setBody(true, 10.5);
      doc.setTextColor(...NAVY);
      doc.text(exp.role || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(...GRAY5);
      const meta = [exp.company, exp.city].filter(Boolean).join(', ');
      doc.text(meta, M, y + lh(5));
      const dates = dateRange(exp.from, exp.to);
      if (dates) doc.text(dates, PAGE_W - M, y + lh(5), { align: 'right' });
      doc.setTextColor(...GRAY7);

      if (template === 'minimal') {
        // gold left accent bar per experience
        doc.setFillColor(...GOLD);
        doc.rect(M - 3, y - 3, 1.5, 11, 'F');
      }

      y += lh(9.5) + gap(1.5);

      if (exp.desc?.trim()) {
        setBody(false, 9.5);
        doc.setTextColor(...GRAY7);
        const raw = exp.desc.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
        for (const line of raw) {
          const wrapped = doc.splitTextToSize(line, CW - 5);
          for (let i = 0; i < wrapped.length; i++) {
            checkPage(8);
            doc.text((i === 0 ? '• ' : '  ') + wrapped[i], M + 2, y);
            y += lh(4.5);
          }
        }
      }
      y += gap(4);
    }
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────────
  if (cvData.education?.length) {
    checkPage(35);
    sectionTitle(template === 'europass' ? L.educationEuro : L.education);
    for (const edu of cvData.education) {
      checkPage(20);

      setBody(true, 10.5);
      doc.setTextColor(...NAVY);
      doc.text(edu.degree || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(...GRAY5);
      const inst = [edu.institution, edu.grade ? `${L.grade}: ${edu.grade}` : ''].filter(Boolean).join('  —  ');
      doc.text(inst, M, y + lh(5));
      const dates = dateRange(edu.from, edu.to);
      if (dates) doc.text(dates, PAGE_W - M, y + lh(5), { align: 'right' });
      doc.setTextColor(...GRAY7);
      y += lh(10) + gap(3);
    }
    y += gap(2);
  }

  // ── CERTIFICATIONS ──────────────────────────────────────────────────────────
  if (cvData.certifications?.some(c => c.name)) {
    checkPage(25);
    sectionTitle(L.certifications);
    setBody(false, 9.5);
    for (const cert of cvData.certifications.filter(c => c.name)) {
      checkPage(8);
      doc.setTextColor(...GRAY7);
      const parts = [cert.name, cert.issuer, cert.date].filter(Boolean);
      doc.text(parts.join('  —  '), M, y);
      y += lh(5.5);
    }
    y += gap(2);
  }

  // ── LANGUAGES ────────────────────────────────────────────────────────────────
  if (cvData.languages?.length) {
    checkPage(25);
    sectionTitle(L.languages);
    setBody(false, 9.5);
    for (const cvLang of cvData.languages) {
      checkPage(8);
      doc.setTextColor(...GRAY7);
      doc.text(`${cvLang.name}${cvLang.level ? '  —  ' + cvLang.level : ''}`, M, y);
      y += lh(5.5);
    }
  }

  // ── ADDITIONAL EXPERIENCE ─────────────────────────────────────────────────────
  if (cvData.additionalExperiences?.some(e => e.company || e.role)) {
    sectionTitle(L.additionalExperience);
    for (const exp of cvData.additionalExperiences.filter(e => e.company || e.role)) {
      checkPage(25);

      setBody(true, 10.5);
      doc.setTextColor(...NAVY);
      doc.text(exp.role || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(...GRAY5);
      const meta = [exp.company, exp.city].filter(Boolean).join(', ');
      doc.text(meta, M, y + lh(5));
      const dates = dateRange(exp.from, exp.to);
      if (dates) doc.text(dates, PAGE_W - M, y + lh(5), { align: 'right' });
      doc.setTextColor(...GRAY7);

      y += lh(9.5) + gap(1.5);

      if (exp.desc?.trim()) {
        setBody(false, 9.5);
        doc.setTextColor(...GRAY7);
        const raw = exp.desc.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
        for (const line of raw) {
          const wrapped = doc.splitTextToSize(line, CW - 5);
          for (let i = 0; i < wrapped.length; i++) {
            checkPage(8);
            doc.text((i === 0 ? '• ' : '  ') + wrapped[i], M + 2, y);
            y += lh(4.5);
          }
        }
      }
      y += gap(4);
    }
  }

  // ── GDPR PRIVACY CLAUSE — opt-out for candidates applying outside the EU ────
  if (cvData.includePrivacyClause !== false) {
    checkPage(18);
    y += gap(6);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(fs(7));
    doc.setTextColor(150, 150, 150);
    textLines(doc.splitTextToSize(L.privacyClause, CW), M, lh(3.2));
  }

  return { doc, finalY: y };
}

// ─────────────────────────────────────────────────────────────────────────────
// Finds the least compression that fits the CV on one page. Measuring is a
// full layout pass (line wrapping changes with font size), so each step is a
// real measurement rather than a proportional guess.
async function fitToOnePage(cvData: CVData, template: string, lang: CvLang, baseScale: number, available: number) {
  const height = async (scale: number, tightness: number) =>
    (await buildPDF(cvData, template, lang, { scale, tightness, measureOnly: true })).finalY;
  const search = async (fits: (v: number) => Promise<boolean>, lo: number, hi: number) => {
    // smallest v in [lo, hi] for which fits(v) — assumes fits(hi) is true
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      if (await fits(mid)) hi = mid; else lo = mid;
    }
    return hi;
  };

  if (await height(baseScale, 0) <= available) return { scale: baseScale, tightness: 0 };

  // Stage 1: tighten whitespace and leading at the user's font size.
  if (await height(baseScale, 1) <= available) {
    const tightness = await search(async t => (await height(baseScale, t)) <= available, 0, 1);
    return { scale: baseScale, tightness };
  }

  // Stage 2: fully tightened, shrink the font as little as needed.
  const minScale = baseScale * MIN_FONT_RATIO;
  if (await height(minScale, 1) <= available) {
    const k = await search(async k => (await height(baseScale - (baseScale - minScale) * k, 1)) <= available, 0, 1);
    return { scale: baseScale - (baseScale - minScale) * k, tightness: 1 };
  }

  // Too long for one page at a readable size — natural layout over two pages.
  return { scale: baseScale, tightness: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Throws EntitlementError (AUTH_REQUIRED / NEEDS_PAYMENT) if the caller has no
// free trial or paid credit left — callers should catch it and route to the
// right modal instead of generating the file.
export async function downloadCVAsPDF(
  name: string,
  cvData: CVData,
  template = 'modern',
  lang: CvLang = 'IT',
): Promise<void> {
  await consumeCvEntitlement();

  // Best-effort — saves this CV's contact/skills/etc. to the account profile
  // so the next CV can be built from it. Never blocks the actual download.
  fetch('/api/profile/sync-from-cv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ cvData }),
  }).catch(() => {});

  const PAGE_H = 297;
  const BOTTOM_MARGIN = 15;

  // The user's own font-size choice from the editor is the starting scale;
  // we only shrink further from there (never enlarge past it) to fit one page.
  const baseScale = cvData.fontScale ?? 1;

  const { scale, tightness } = await fitToOnePage(cvData, template, lang, baseScale, PAGE_H - BOTTOM_MARGIN);
  const { doc } = await buildPDF(cvData, template, lang, { scale, tightness });
  const filename = name
    ? `CV_${name.replace(/\s+/g, '_')}.pdf`
    : 'CV_ProntoCurriculum.pdf';

  if (Capacitor.isNativePlatform()) {
    try {
      const pdfDataUri = doc.output('datauristring');
      const base64Data = pdfDataUri.split(',')[1];
      
      const fileResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: 'Condividi il tuo Curriculum',
        text: 'Ecco il mio curriculum vitae generato con ProntoCurriculum.',
        url: fileResult.uri,
        dialogTitle: 'Condividi PDF',
      });
    } catch (err) {
      console.error('Errore durante il salvataggio o la condivisione del PDF:', err);
      alert('Non è stato possibile salvare o condividere il PDF su questo dispositivo.');
    }
  } else {
    doc.save(filename);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview: renders the ACTUAL HTML template in a new tab — identical to builder
// ─────────────────────────────────────────────────────────────────────────────
export async function previewCVAsPDF(
  _name: string,
  _cvData: CVData,
  _template = 'modern',
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    alert('Usa il pulsante "Scarica PDF" per generare e visualizzare il tuo curriculum in anteprima.');
    return;
  }

  const cvEl = document.querySelector('.cv-doc') as HTMLElement | null;
  if (!cvEl) {
    alert('Anteprima non trovata. Assicurati che il builder sia aperto.');
    return;
  }

  // collect ALL CSS rules from every loaded stylesheet
  let css = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@700&display=swap');\n`;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules ?? []);
      css += rules.map(r => r.cssText).join('\n');
    } catch {
      // cross-origin — skip
    }
  }

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Anteprima CV</title>
  <style>${css}</style>
  <style>
    :root {
      --navy:#0B1D3A; --navy2:#132848; --gold:#C9A84C; --gold2:#F0C96A;
      --white:#FAFAF8; --gray50:#F4F3F0; --gray100:#E8E6E0; --gray300:#B8B4AB;
      --gray500:#7A756A; --gray700:#3D3930;
      --success:#1A6B45; --danger:#8B1A1A; --radius:8px; --radius-lg:14px;
    }
    body { margin:0; padding:40px 0; background:#e8e6e0; display:flex; flex-direction:column; align-items:center; font-family:'DM Sans',sans-serif; }
    .preview-wrap { background:white; width:595px; min-height:842px; box-shadow:0 8px 40px rgba(0,0,0,0.18); padding:32px 28px; box-sizing:border-box; position:relative; }
    .cv-watermark { display:none !important; }
    .cv-doc { box-shadow:none !important; min-height:unset !important; }
    .print-bar { position:fixed; top:0; left:0; right:0; background:${_template === 'europass' ? '#003399' : '#0B1D3A'}; color:white; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; font-family:'DM Sans',sans-serif; font-size:13px; z-index:999; }
    .print-bar button { background:#C9A84C; color:#0B1D3A; border:none; padding:6px 18px; border-radius:100px; font-weight:700; cursor:pointer; font-size:13px; }
    body { padding-top:56px; }
    @media print { .print-bar { display:none; } body { background:white; padding:0; } .preview-wrap { box-shadow:none; padding:0; width:100%; } }
    @page { size:A4 portrait; margin:12mm; }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>👁 Anteprima CV — ProntoCurriculum.it</span>
    <button onclick="window.print()">🖨 Stampa / Salva PDF</button>
  </div>
  <div class="preview-wrap">${cvEl.outerHTML}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
