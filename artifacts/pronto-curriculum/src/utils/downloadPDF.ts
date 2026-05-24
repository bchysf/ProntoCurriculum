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

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener('afterprint', cleanup);
    document.body.classList.remove('cv-printing');
    if (portal.parentNode === document.body) {
      document.body.removeChild(portal);
    }
    document.title = originalTitle;
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
  setTimeout(cleanup, 4000);
}
