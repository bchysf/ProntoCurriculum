import type { CVData } from '../types';

/**
 * Downloads the given CVData as a Word (.docx) file by calling our backend API.
 */
export async function downloadCVAsDOCX(
  name: string,
  cvData: CVData,
  template = 'modern',
  lang = 'IT',
): Promise<void> {
  try {
    const res = await fetch('/api/cvs/export/docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cvData,
        template,
        lang,
      }),
    });

    if (!res.ok) {
      let errText = 'Errore sconosciuto';
      try {
        const data = await res.json();
        if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
          errText = data.error;
        }
      } catch {
        errText = await res.text() || `HTTP ${res.status}`;
      }
      throw new Error(`Impossibile generare il file Word (.docx): ${errText}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const safeName = (name || `${cvData.firstName || 'Il_mio'}_${cvData.lastName || 'CV'}`)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_')
      .trim();
    a.download = `CV_${safeName}_ProntoCurriculum.docx`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } catch (err: unknown) {
    console.error('downloadCVAsDOCX error:', err);
    throw err;
  }
}
