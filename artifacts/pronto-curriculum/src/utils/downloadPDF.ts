export async function downloadCVAsPDF(name: string): Promise<void> {
  const element = document.querySelector('.cv-doc') as HTMLElement | null;
  if (!element) {
    alert('Anteprima CV non trovata. Apri prima il builder.');
    return;
  }

  // Dynamically import html2pdf to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const filename = name
    ? `CV_${name.replace(/\s+/g, '_')}.pdf`
    : 'CV_ProntoCurriculum.pdf';

  const opt = {
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await html2pdf().set(opt).from(element).save();
}
