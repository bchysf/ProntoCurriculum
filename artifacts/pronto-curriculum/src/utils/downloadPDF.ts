import type { CVData } from '../types';

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

const SPECS: Record<string, TemplateSpec> = {
  modern:        { headerBg: NAVY,  headerText: [255,255,255], sectionColor: GOLD,  accentColor: GOLD  },
  minimal:       { headerBg: null,  headerText: NAVY,          sectionColor: NAVY,  accentColor: GOLD  },
  executive:     { headerBg: NAVY,  headerText: [255,255,255], sectionColor: GOLD,  accentColor: GOLD  },
  professionale: { headerBg: NAVY,  headerText: [255,255,255], sectionColor: NAVY,  accentColor: GOLD  },
  europass:      { headerBg: EU,    headerText: [255,255,255], sectionColor: EU,    accentColor: EU    },
};

// ─────────────────────────────────────────────────────────────────────────────
async function buildPDF(cvData: CVData, template: string) {
  const { jsPDF } = await import('jspdf');
  const spec = SPECS[template] ?? SPECS.modern;

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 15;
  const CW = PAGE_W - M * 2;

  let y = 0;

  const checkPage = (need = 20) => {
    if (y > PAGE_H - need) { doc.addPage(); y = 20; }
  };

  const setBody = (bold = false, size = 10) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...GRAY7);
  };

  const sectionTitle = (title: string) => {
    checkPage(30);
    doc.setTextColor(...spec.sectionColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(...spec.sectionColor);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, PAGE_W - M, y + 1.5);
    y += 7;
    setBody();
  };

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const fullName = `${cvData.firstName} ${cvData.lastName}`.trim() || 'Nome Cognome';

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
      doc.setTextColor(255, 215, 0);
      doc.setFontSize(9);
      doc.text('★  ★  ★  ★  ★', M, 8);
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

    y = 54;
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

    y = 48;
  }

  // ── SUMMARY ─────────────────────────────────────────────────────────────────
  if (cvData.summary?.trim()) {
    sectionTitle('Profilo Professionale');
    setBody(false, 9.5);
    doc.setTextColor(...GRAY7);
    const lines = doc.splitTextToSize(cvData.summary, CW);
    doc.text(lines, M, y);
    y += lines.length * 5 + 5;
  }

  // ── EXPERIENCES ──────────────────────────────────────────────────────────────
  if (cvData.experiences?.length) {
    sectionTitle('Esperienze Lavorative');
    for (const exp of cvData.experiences) {
      checkPage(25);

      setBody(true, 10.5);
      doc.setTextColor(...NAVY);
      doc.text(exp.role || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(...GRAY5);
      const meta = [exp.company, exp.city].filter(Boolean).join(', ');
      doc.text(meta, M, y + 5);
      doc.text(`${exp.from || ''} – ${exp.to || 'Presente'}`, PAGE_W - M, y + 5, { align: 'right' });
      doc.setTextColor(...GRAY7);

      if (template === 'minimal') {
        // gold left accent bar per experience
        doc.setFillColor(...GOLD);
        doc.rect(M - 3, y - 3, 1.5, 11, 'F');
      }

      y += 10;

      if (exp.desc?.trim()) {
        setBody(false, 9.5);
        doc.setTextColor(...GRAY7);
        const raw = exp.desc.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
        for (const line of raw) {
          const wrapped = doc.splitTextToSize(line, CW - 5);
          for (let i = 0; i < wrapped.length; i++) {
            checkPage(8);
            doc.text((i === 0 ? '• ' : '  ') + wrapped[i], M + 2, y);
            y += 4.5;
          }
        }
      }
      y += 4;
    }
  }

  // ── EDUCATION ────────────────────────────────────────────────────────────────
  if (cvData.education?.length) {
    checkPage(35);
    sectionTitle('Formazione');
    for (const edu of cvData.education) {
      checkPage(20);

      setBody(true, 10.5);
      doc.setTextColor(...NAVY);
      doc.text(edu.degree || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(...GRAY5);
      const inst = [edu.institution, edu.grade ? `Voto: ${edu.grade}` : ''].filter(Boolean).join('  —  ');
      doc.text(inst, M, y + 5);
      doc.text(`${edu.from || ''} – ${edu.to || 'Presente'}`, PAGE_W - M, y + 5, { align: 'right' });
      doc.setTextColor(...GRAY7);
      y += 13;
    }
    y += 2;
  }

  // ── SKILLS ──────────────────────────────────────────────────────────────────
  if (cvData.skills?.length) {
    checkPage(25);
    sectionTitle('Competenze');
    setBody(false, 9.5);
    doc.setTextColor(...GRAY7);
    const skillLines = doc.splitTextToSize(cvData.skills.join(' • '), CW);
    doc.text(skillLines, M, y);
    y += skillLines.length * 5 + 5;
  }

  // ── LANGUAGES ────────────────────────────────────────────────────────────────
  if (cvData.languages?.length) {
    checkPage(25);
    sectionTitle('Lingue');
    setBody(false, 9.5);
    for (const lang of cvData.languages) {
      checkPage(8);
      doc.setTextColor(...GRAY7);
      doc.text(`${lang.name}${lang.level ? '  —  ' + lang.level : ''}`, M, y);
      y += 5.5;
    }
  }

  return doc;
}

// ─────────────────────────────────────────────────────────────────────────────
export async function downloadCVAsPDF(
  name: string,
  cvData: CVData,
  template = 'modern',
): Promise<void> {
  const doc = await buildPDF(cvData, template);
  const filename = name
    ? `CV_${name.replace(/\s+/g, '_')}.pdf`
    : 'CV_ProntoCurriculum.pdf';
  doc.save(filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview: renders the ACTUAL HTML template in a new tab — identical to builder
// ─────────────────────────────────────────────────────────────────────────────
export async function previewCVAsPDF(
  _name: string,
  _cvData: CVData,
  _template = 'modern',
): Promise<void> {
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
