// Public, unlisted profile page ("/p/:slug"). Reuses the same visual system as
// the pSEO pages (SHELL_CSS from ./shell.ts) but renders its own minimal <head>
// and chrome instead of shell.ts's renderSsrPage — that helper asserts a
// canonical/indexable page, which this page must never do (see the noindex
// meta + X-Robots-Tag header set by the caller).
import { SHELL_CSS, escapeHtml } from "./shell";
import { buildHeroSvg } from "./heroArt";
import type { PublicProfileSection } from "@workspace/db";

export interface PublicProfileExperience {
  company: string;
  role: string;
  city?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean | null;
  description?: string | null;
  skills?: string[] | null;
}

export interface PublicProfileHighlight {
  type: string;
  title: string;
  description?: string | null;
  date?: string | null;
  link?: string | null;
}

export interface PublicProfilePageData {
  slug: string;
  fullName: string;
  photo?: string | null;
  headline?: string | null;
  bio?: string | null;
  sections: PublicProfileSection[];
  experiences: PublicProfileExperience[];
  highlights: PublicProfileHighlight[];
  education: Array<{ institution: string; degree: string; grade?: string; from?: string; to?: string }>;
  languages: Array<{ name: string; level: string }>;
  skills: string[];
}

function dateRange(from?: string | null, to?: string | null, isCurrent?: boolean | null): string {
  const parts = [from, isCurrent ? "Presente" : to].filter(Boolean);
  return parts.join(" — ");
}

const HIGHLIGHT_LABELS: Record<string, string> = {
  volunteering: "Volontariato",
  honor: "Riconoscimento",
  project: "Progetto",
  other: "Altro",
};

function renderExperiences(items: PublicProfileExperience[]): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (e) => `<div class="pp-item">
        <div class="pp-item-head">
          <div>
            <b>${escapeHtml(e.role)}</b>
            <span class="pp-item-sub">${escapeHtml(e.company)}${e.city ? ` · ${escapeHtml(e.city)}` : ""}</span>
          </div>
          <span class="mono pp-item-date">${escapeHtml(dateRange(e.startDate, e.endDate, e.isCurrent))}</span>
        </div>
        ${e.description ? `<p class="pp-item-desc">${escapeHtml(e.description)}</p>` : ""}
        ${e.skills && e.skills.length ? `<div class="pp-tags">${e.skills.map((s) => `<span class="pp-tag">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
      </div>`,
    )
    .join("");
  return `<section class="sec"><h2>Esperienza</h2><div class="pp-list">${rows}</div></section>`;
}

function renderHighlights(items: PublicProfileHighlight[]): string {
  if (items.length === 0) return "";
  const cards = items
    .map(
      (h) => `<div class="pp-highlight">
        <span class="mono pp-item-date">${escapeHtml(HIGHLIGHT_LABELS[h.type] ?? h.type)}${h.date ? ` · ${escapeHtml(h.date)}` : ""}</span>
        <b>${h.link ? `<a href="${escapeHtml(h.link)}" target="_blank" rel="noopener nofollow noreferrer">${escapeHtml(h.title)}</a>` : escapeHtml(h.title)}</b>
        ${h.description ? `<p class="pp-item-desc">${escapeHtml(h.description)}</p>` : ""}
      </div>`,
    )
    .join("");
  return `<section class="sec"><h2>In evidenza</h2><div class="pp-grid">${cards}</div></section>`;
}

function renderEducation(items: PublicProfilePageData["education"]): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (ed) => `<div class="pp-item">
        <div class="pp-item-head">
          <div><b>${escapeHtml(ed.degree)}</b><span class="pp-item-sub">${escapeHtml(ed.institution)}</span></div>
          <span class="mono pp-item-date">${escapeHtml(dateRange(ed.from, ed.to))}</span>
        </div>
      </div>`,
    )
    .join("");
  return `<section class="sec"><h2>Formazione</h2><div class="pp-list">${rows}</div></section>`;
}

function renderLanguages(items: PublicProfilePageData["languages"]): string {
  if (items.length === 0) return "";
  const tags = items.map((l) => `<span class="pp-tag">${escapeHtml(l.name)} · ${escapeHtml(l.level)}</span>`).join("");
  return `<section class="sec"><h2>Lingue</h2><div class="pp-tags">${tags}</div></section>`;
}

function renderSkills(items: string[]): string {
  if (items.length === 0) return "";
  const tags = items.map((s) => `<span class="pp-tag">${escapeHtml(s)}</span>`).join("");
  return `<section class="sec"><h2>Competenze</h2><div class="pp-tags">${tags}</div></section>`;
}

const SECTION_RENDERERS: Record<PublicProfileSection["key"], (data: PublicProfilePageData) => string> = {
  experiences: (d) => renderExperiences(d.experiences),
  highlights: (d) => renderHighlights(d.highlights),
  education: (d) => renderEducation(d.education),
  languages: (d) => renderLanguages(d.languages),
  skills: (d) => renderSkills(d.skills),
};

const PROFILE_CSS = `
.pp-hero-wrap { position:relative; width:100%; max-width:1120px; aspect-ratio:21/7; border-radius:20px; overflow:hidden; border:1px solid var(--hair-soft); margin:8px 0 32px; }
.pp-hero-wrap svg { display:block; width:100%; height:100%; }
.pp-hero-overlay { position:absolute; inset:0; display:flex; align-items:flex-end; gap:20px; padding:28px 36px; }
.pp-photo { width:84px; height:84px; border-radius:50%; object-fit:cover; border:3px solid #fff; box-shadow:0 4px 16px rgba(20,23,31,.18); flex-shrink:0; }
.pp-photo-fallback { width:84px; height:84px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--violet)); flex-shrink:0; border:3px solid #fff; box-shadow:0 4px 16px rgba(20,23,31,.18); }
.pp-name { font-family:var(--f-display); font-weight:700; font-size:clamp(24px,3vw,34px); letter-spacing:-.03em; line-height:1.1; }
.pp-headline { font-size:14.5px; color:var(--ink-60); margin-top:4px; font-weight:500; }
.pp-bio { font-size:15.5px; color:var(--ink-60); line-height:1.75; max-width:720px; margin-bottom:8px; }
.pp-list { display:flex; flex-direction:column; gap:22px; }
.pp-item { border-bottom:1px solid var(--hair-soft); padding-bottom:20px; }
.pp-item-head { display:flex; justify-content:space-between; align-items:baseline; gap:16px; flex-wrap:wrap; }
.pp-item-head b { font-family:var(--f-display); font-weight:700; font-size:16.5px; }
.pp-item-sub { display:block; font-size:13.5px; color:var(--ink-60); margin-top:2px; }
.pp-item-date { white-space:nowrap; color:var(--ink-40); }
.pp-item-desc { font-size:14.5px; color:var(--ink-60); line-height:1.65; margin-top:10px; }
.pp-tags { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.pp-tag { font-size:12.5px; color:var(--ink-60); border:1px solid var(--hair-soft); border-radius:999px; padding:5px 12px; }
.pp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
.pp-highlight { border:1px solid var(--hair-soft); border-radius:14px; padding:18px 20px; display:flex; flex-direction:column; gap:8px; }
.pp-highlight a { color:var(--accent); text-decoration:none; }
.pp-highlight b { font-family:var(--f-display); font-weight:700; font-size:15px; }
`;

export function renderPublicProfileHtml(data: PublicProfilePageData): string {
  const title = `${data.fullName} — ProntoCurriculum`;
  const heroSvg = buildHeroSvg({ motif: "profile", seed: data.slug, width: 1120, height: 373 });
  const orderedSections = [...data.sections].filter((s) => s.visible).sort((a, b) => a.order - b.order);
  const sectionsHtml = orderedSections.map((s) => SECTION_RENDERERS[s.key]?.(data) ?? "").join("");

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="robots" content="noindex, nofollow" />
<link rel="icon" href="/logo-icon.png" />
<style>${SHELL_CSS}${PROFILE_CSS}</style>
</head>
<body>
<div class="pce">
  <div class="grain" aria-hidden="true"></div>
  <div class="aurora" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <header class="topbar">
    <div class="shell">
      <nav aria-label="Navigazione principale">
        <a class="brand" href="https://prontocurriculum.it"><img src="/logo-icon.png" alt="" /><span>ProntoCurriculum</span></a>
        <a class="btn btn-ink btn-sm" href="https://prontocurriculum.it/crea-cv">Crea la tua pagina</a>
      </nav>
    </div>
  </header>

  <div class="shell">
    <div class="pp-hero-wrap">
      ${heroSvg}
      <div class="pp-hero-overlay">
        ${data.photo ? `<img class="pp-photo" src="${escapeHtml(data.photo)}" alt="${escapeHtml(data.fullName)}" />` : `<div class="pp-photo-fallback"></div>`}
        <div>
          <div class="pp-name">${escapeHtml(data.fullName)}</div>
          ${data.headline ? `<div class="pp-headline">${escapeHtml(data.headline)}</div>` : ""}
        </div>
      </div>
    </div>
    ${data.bio ? `<p class="pp-bio">${escapeHtml(data.bio)}</p>` : ""}
    ${sectionsHtml}
  </div>

  <div class="shell">
    <footer>
      <div class="foot-bottom">
        <span class="mono">&copy; ${new Date().getFullYear()} ProntoCurriculum — fatto in Italia</span>
      </div>
    </footer>
  </div>
</div>
</body>
</html>`;
}
