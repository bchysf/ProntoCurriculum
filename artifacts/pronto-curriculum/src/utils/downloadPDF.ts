import type { CVData } from '../types';

const PRIMARY: Record<string, [number, number, number]> = {
  modern:        [37, 99, 235],
  minimal:       [30, 30, 30],
  executive:     [15, 40, 80],
  professionale: [180, 40, 40],
  europass:      [0, 51, 153],
};

async function buildPDF(cvData: CVData, template: string) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 15;
  const CW = PAGE_W - M * 2;
  const primary = PRIMARY[template] ?? PRIMARY.modern;

  let y = 0;

  const checkPage = (need = 20) => {
    if (y > PAGE_H - need) { doc.addPage(); y = 20; }
  };

  const setBody = (bold = false, size = 10) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(30, 30, 30);
  };

  const sectionTitle = (title: string) => {
    checkPage(30);
    doc.setTextColor(...primary);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(title.toUpperCase(), M, y);
    doc.setDrawColor(...primary);
    doc.setLineWidth(0.4);
    doc.line(M, y + 1.5, PAGE_W - M, y + 1.5);
    y += 7;
    setBody();
  };

  /* ── header ─────────────────────────────────── */
  doc.setFillColor(...primary);
  doc.rect(0, 0, PAGE_W, 46, 'F');

  const fullName = `${cvData.firstName} ${cvData.lastName}`.trim() || 'Nome Cognome';
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(fullName, M, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(cvData.title || '', M, 27);

  doc.setFontSize(8.5);
  const contacts = [cvData.email, cvData.phone, cvData.city, cvData.linkedin].filter(Boolean);
  if (contacts.length) doc.text(contacts.join('   |   '), M, 37);

  y = 54;

  /* ── summary ─────────────────────────────────── */
  if (cvData.summary?.trim()) {
    sectionTitle('Profilo Professionale');
    setBody(false, 9.5);
    const lines = doc.splitTextToSize(cvData.summary, CW);
    doc.text(lines, M, y);
    y += lines.length * 5 + 5;
  }

  /* ── experiences ──────────────────────────────── */
  if (cvData.experiences?.length) {
    sectionTitle('Esperienze Lavorative');
    for (const exp of cvData.experiences) {
      checkPage(25);

      setBody(true, 10.5);
      doc.text(exp.role || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(80, 80, 80);
      const meta = [exp.company, exp.city].filter(Boolean).join(', ');
      doc.text(meta, M, y + 5);
      doc.text(`${exp.from || ''} – ${exp.to || 'Presente'}`, PAGE_W - M, y + 5, { align: 'right' });
      doc.setTextColor(30, 30, 30);
      y += 10;

      if (exp.desc?.trim()) {
        setBody(false, 9.5);
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

  /* ── education ────────────────────────────────── */
  if (cvData.education?.length) {
    checkPage(35);
    sectionTitle('Formazione');
    for (const edu of cvData.education) {
      checkPage(20);

      setBody(true, 10.5);
      doc.text(edu.degree || '', M, y);

      setBody(false, 9.5);
      doc.setTextColor(80, 80, 80);
      const inst = [edu.institution, edu.grade ? `Voto: ${edu.grade}` : ''].filter(Boolean).join('  —  ');
      doc.text(inst, M, y + 5);
      doc.text(`${edu.from || ''} – ${edu.to || 'Presente'}`, PAGE_W - M, y + 5, { align: 'right' });
      doc.setTextColor(30, 30, 30);
      y += 13;
    }
    y += 2;
  }

  /* ── skills ───────────────────────────────────── */
  if (cvData.skills?.length) {
    checkPage(25);
    sectionTitle('Competenze');
    setBody(false, 9.5);
    const skillLines = doc.splitTextToSize(cvData.skills.join(' • '), CW);
    doc.text(skillLines, M, y);
    y += skillLines.length * 5 + 5;
  }

  /* ── languages ────────────────────────────────── */
  if (cvData.languages?.length) {
    checkPage(25);
    sectionTitle('Lingue');
    setBody(false, 9.5);
    for (const lang of cvData.languages) {
      checkPage(8);
      doc.text(`${lang.name}${lang.level ? '  —  ' + lang.level : ''}`, M, y);
      y += 5.5;
    }
  }

  return doc;
}

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

export async function previewCVAsPDF(
  name: string,
  cvData: CVData,
  template = 'modern',
): Promise<void> {
  const doc = await buildPDF(cvData, template);
  const filename = name
    ? `CV_${name.replace(/\s+/g, '_')}.pdf`
    : 'CV_ProntoCurriculum.pdf';
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  // open in new tab; browser will display the PDF inline
  window.open(url, '_blank', 'noopener');
  // revoke after a short delay so the tab can load it
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  void filename; // used for future save variant
}
