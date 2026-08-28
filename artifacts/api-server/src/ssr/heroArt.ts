// Server-side duplicate of the SPA's deterministic hero-art generator
// (artifacts/pronto-curriculum/src/components/HeroArt.tsx). Pure string/SVG
// generation with no React dependency, so it's safe to mirror here — same
// precedent as shell.ts already manually mirroring the SPA's CSS tokens,
// since there's no shared package between api-server and the frontend.
// Keep the 'profile' motif addition in sync if the SPA file changes.

export type HeroMotif = "guide" | "ats" | "market" | "interview" | "europass" | "city" | "profession" | "profile";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const MOTIF_PATHS: Record<HeroMotif, string> = {
  guide: `<rect x="30" y="18" width="40" height="54" rx="4"/>
    <line x1="38" y1="32" x2="62" y2="32"/>
    <line x1="38" y1="42" x2="62" y2="42"/>
    <line x1="38" y1="52" x2="54" y2="52"/>
    <path d="M58 58 L78 38 L84 44 L64 64 L56 66 Z"/>`,
  ats: `<rect x="26" y="20" width="48" height="58" rx="4"/>
    <line x1="34" y1="34" x2="66" y2="34"/>
    <line x1="34" y1="44" x2="66" y2="44"/>
    <line x1="34" y1="54" x2="52" y2="54"/>
    <line x1="20" y1="49" x2="80" y2="49" stroke-dasharray="3 4"/>
    <path d="M20 26 L20 20 L26 20 M74 20 L80 20 L80 26 M80 72 L80 78 L74 78 M26 78 L20 78 L20 72"/>`,
  market: `<line x1="22" y1="78" x2="82" y2="78"/>
    <rect x="28" y="58" width="10" height="20"/>
    <rect x="44" y="46" width="10" height="32"/>
    <rect x="60" y="34" width="10" height="44"/>
    <path d="M26 52 L42 38 L52 44 L74 22"/>
    <path d="M66 22 L74 22 L74 30"/>`,
  interview: `<rect x="16" y="24" width="44" height="30" rx="10"/>
    <path d="M26 54 L26 62 L36 54 Z"/>
    <rect x="42" y="46" width="40" height="26" rx="10"/>
    <path d="M74 72 L74 80 L64 72 Z"/>
    <circle cx="30" cy="39" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="38" cy="39" r="1.6" fill="currentColor" stroke="none"/>
    <circle cx="46" cy="39" r="1.6" fill="currentColor" stroke="none"/>`,
  europass: `<circle cx="50" cy="42" r="24"/>
    <path d="M40 62 L34 82 L50 72 L66 82 L60 62"/>
    <path d="M40 42 L47 49 L61 34"/>`,
  city: `<line x1="14" y1="80" x2="86" y2="80"/>
    <rect x="18" y="56" width="12" height="24"/>
    <rect x="34" y="40" width="14" height="40"/>
    <rect x="52" y="50" width="12" height="30"/>
    <rect x="68" y="28" width="14" height="52"/>
    <line x1="75" y1="28" x2="75" y2="18"/>`,
  profession: `<rect x="22" y="38" width="56" height="36" rx="4"/>
    <path d="M38 38 L38 28 Q38 22 44 22 L56 22 Q62 22 62 28 L62 38"/>
    <line x1="22" y1="52" x2="78" y2="52"/>
    <rect x="46" y="48" width="8" height="8" rx="1"/>`,
  profile: `<circle cx="50" cy="34" r="16"/>
    <path d="M22 82 C22 60 34 50 50 50 C66 50 78 60 78 82"/>`,
};

export function buildHeroSvg(opts: { motif?: HeroMotif; seed: string; width?: number; height?: number }): string {
  const { motif, seed } = opts;
  const width = opts.width ?? 800;
  const height = opts.height ?? 450;
  const h = hashSeed(seed);
  const angle = h % 360;
  const gid = `hg-${(h % 100000).toString(36)}`;
  const scale = Math.min(width, height) / 170;
  const tx = width / 2 - 50 * scale;
  const ty = height / 2 - 50 * scale;

  const dots = Array.from({ length: 6 })
    .map((_, i) => {
      const dh = hashSeed(`${seed}-${i}`);
      const cx = ((dh % 100) / 100) * width;
      const cy = (((dh >> 4) % 100) / 100) * height;
      const r = 1.4 + (dh % 3);
      const violet = dh % 3 === 0;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${violet ? "#7C5CFF" : "#2F2AE5"}" opacity="${(0.08 + (dh % 10) / 90).toFixed(2)}"/>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="${gid}" gradientTransform="rotate(${angle} 0.5 0.5)">
        <stop offset="0%" stop-color="#EEF1FF"/>
        <stop offset="55%" stop-color="#F6F4FF"/>
        <stop offset="100%" stop-color="#FFFFFF"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#${gid})"/>
    ${dots}
    ${motif ? `<g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(3)})" fill="none" stroke="#2F2AE5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${MOTIF_PATHS[motif]}
    </g>` : ""}
  </svg>`;
}
