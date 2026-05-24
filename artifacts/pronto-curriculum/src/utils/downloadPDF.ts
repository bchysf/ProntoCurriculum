export async function downloadCVAsPDF(name: string): Promise<void> {
  const cvEl = document.querySelector('.cv-doc') as HTMLElement | null;
  if (!cvEl) {
    alert('Anteprima CV non trovata. Apri prima il builder.');
    return;
  }

  const filename = name
    ? `CV_${name.replace(/\s+/g, '_')}`
    : 'CV_ProntoCurriculum';

  const originalTitle = document.title;
  document.title = filename;

  const portal = document.createElement('div');
  portal.id = 'cv-print-portal';
  portal.appendChild(cvEl.cloneNode(true));
  document.body.appendChild(portal);
  document.body.classList.add('cv-printing');

  await new Promise<void>(resolve => {
    const handler = () => {
      window.removeEventListener('afterprint', handler);
      document.body.classList.remove('cv-printing');
      document.body.removeChild(portal);
      document.title = originalTitle;
      resolve();
    };
    window.addEventListener('afterprint', handler);
    window.print();
    setTimeout(handler, 3000);
  });
}
