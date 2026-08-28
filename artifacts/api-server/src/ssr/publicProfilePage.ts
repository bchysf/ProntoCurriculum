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
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedin?: string | null;
  website?: string | null;
  sections: PublicProfileSection[];
  experiences: PublicProfileExperience[];
  highlights: PublicProfileHighlight[];
  education: Array<{ institution: string; degree: string; grade?: string; from?: string; to?: string }>;
  languages: Array<{ name: string; level: string }>;
  skills: string[];
  updatedAt?: string;
}

export type LangCode = "IT" | "EN" | "FR" | "DE" | "ES" | "PT";

interface UiStrings {
  present: string;
  sections: Record<PublicProfileSection["key"], string>;
  highlightTypes: Record<string, string>;
  createYourPage: string;
  madeInItaly: string;
}

const UI_STRINGS: Record<LangCode, UiStrings> = {
  IT: {
    present: "Presente",
    sections: { experiences: "Esperienza", highlights: "In evidenza", education: "Formazione", skills: "Competenze", languages: "Lingue" },
    highlightTypes: { volunteering: "Volontariato", honor: "Riconoscimento", project: "Progetto", other: "Altro" },
    createYourPage: "Crea la tua pagina",
    madeInItaly: "fatto in Italia",
  },
  EN: {
    present: "Present",
    sections: { experiences: "Experience", highlights: "Highlights", education: "Education", skills: "Skills", languages: "Languages" },
    highlightTypes: { volunteering: "Volunteering", honor: "Honor", project: "Project", other: "Other" },
    createYourPage: "Create your page",
    madeInItaly: "made in Italy",
  },
  FR: {
    present: "Présent",
    sections: { experiences: "Expérience", highlights: "En vedette", education: "Formation", skills: "Compétences", languages: "Langues" },
    highlightTypes: { volunteering: "Bénévolat", honor: "Distinction", project: "Projet", other: "Autre" },
    createYourPage: "Créez votre page",
    madeInItaly: "fait en Italie",
  },
  DE: {
    present: "Aktuell",
    sections: { experiences: "Erfahrung", highlights: "Hervorhebungen", education: "Ausbildung", skills: "Kompetenzen", languages: "Sprachen" },
    highlightTypes: { volunteering: "Ehrenamt", honor: "Auszeichnung", project: "Projekt", other: "Sonstiges" },
    createYourPage: "Erstelle deine Seite",
    madeInItaly: "gemacht in Italien",
  },
  ES: {
    present: "Actualidad",
    sections: { experiences: "Experiencia", highlights: "Destacados", education: "Formación", skills: "Competencias", languages: "Idiomas" },
    highlightTypes: { volunteering: "Voluntariado", honor: "Reconocimiento", project: "Proyecto", other: "Otro" },
    createYourPage: "Crea tu página",
    madeInItaly: "hecho en Italia",
  },
  PT: {
    present: "Atual",
    sections: { experiences: "Experiência", highlights: "Destaques", education: "Formação", skills: "Competências", languages: "Idiomas" },
    highlightTypes: { volunteering: "Voluntariado", honor: "Reconhecimento", project: "Projeto", other: "Outro" },
    createYourPage: "Crie a sua página",
    madeInItaly: "feito na Itália",
  },
};

function dateRange(ui: UiStrings, from?: string | null, to?: string | null, isCurrent?: boolean | null): string {
  const parts = [from, isCurrent ? ui.present : to].filter(Boolean);
  return parts.join(" — ");
}

function renderExperiences(items: PublicProfileExperience[], ui: UiStrings): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (e) => `<div class="pp-item">
        <div class="pp-item-head">
          <div>
            <b>${escapeHtml(e.role)}</b>
            <span class="pp-item-sub">${escapeHtml(e.company)}${e.city ? ` · ${escapeHtml(e.city)}` : ""}</span>
          </div>
          <span class="mono pp-item-date">${escapeHtml(dateRange(ui, e.startDate, e.endDate, e.isCurrent))}</span>
        </div>
        ${e.description ? `<p class="pp-item-desc">${escapeHtml(e.description)}</p>` : ""}
        ${e.skills && e.skills.length ? `<div class="pp-tags">${e.skills.map((s) => `<span class="pp-tag">${escapeHtml(s)}</span>`).join("")}</div>` : ""}
      </div>`,
    )
    .join("");
  return `<h2>${escapeHtml(ui.sections.experiences)}</h2><div class="pp-list">${rows}</div>`;
}

function renderHighlights(items: PublicProfileHighlight[], ui: UiStrings): string {
  if (items.length === 0) return "";
  const cards = items
    .map(
      (h) => `<div class="pp-highlight">
        <span class="mono pp-item-date">${escapeHtml(ui.highlightTypes[h.type] ?? h.type)}${h.date ? ` · ${escapeHtml(h.date)}` : ""}</span>
        <b>${h.link ? `<a href="${escapeHtml(h.link)}" target="_blank" rel="noopener nofollow noreferrer">${escapeHtml(h.title)}</a>` : escapeHtml(h.title)}</b>
        ${h.description ? `<p class="pp-item-desc">${escapeHtml(h.description)}</p>` : ""}
      </div>`,
    )
    .join("");
  return `<h2>${escapeHtml(ui.sections.highlights)}</h2><div class="pp-grid">${cards}</div>`;
}

function renderEducation(items: PublicProfilePageData["education"], ui: UiStrings): string {
  if (items.length === 0) return "";
  const rows = items
    .map(
      (ed) => `<div class="pp-item">
        <div class="pp-item-head">
          <div><b>${escapeHtml(ed.degree)}</b><span class="pp-item-sub">${escapeHtml(ed.institution)}</span></div>
          <span class="mono pp-item-date">${escapeHtml(dateRange(ui, ed.from, ed.to))}</span>
        </div>
      </div>`,
    )
    .join("");
  return `<h2>${escapeHtml(ui.sections.education)}</h2><div class="pp-list">${rows}</div>`;
}

function renderLanguages(items: PublicProfilePageData["languages"], ui: UiStrings): string {
  if (items.length === 0) return "";
  const tags = items.map((l) => `<span class="pp-tag">${escapeHtml(l.name)} · ${escapeHtml(l.level)}</span>`).join("");
  return `<h2>${escapeHtml(ui.sections.languages)}</h2><div class="pp-tags">${tags}</div>`;
}

function renderSkills(items: string[], ui: UiStrings): string {
  if (items.length === 0) return "";
  const tags = items.map((s) => `<span class="pp-tag">${escapeHtml(s)}</span>`).join("");
  return `<h2>${escapeHtml(ui.sections.skills)}</h2><div class="pp-tags">${tags}</div>`;
}

const SECTION_RENDERERS: Record<PublicProfileSection["key"], (data: PublicProfilePageData, ui: UiStrings) => string> = {
  experiences: (d, ui) => renderExperiences(d.experiences, ui),
  highlights: (d, ui) => renderHighlights(d.highlights, ui),
  education: (d, ui) => renderEducation(d.education, ui),
  languages: (d, ui) => renderLanguages(d.languages, ui),
  skills: (d, ui) => renderSkills(d.skills, ui),
};

const PROFILE_CSS = `
.pp-hero-wrap { position:relative; width:100%; max-width:1120px; aspect-ratio:21/5; border-radius:20px 20px 0 0; overflow:hidden; border:1px solid var(--hair-soft); border-bottom:none; margin-top:8px; }
.pp-hero-wrap svg { display:block; width:100%; height:100%; }
.pp-header-card { max-width:1120px; border:1px solid var(--hair-soft); border-top:none; border-radius:0 0 20px 20px; padding:0 36px 28px; margin-bottom:36px; position:relative; }
.pp-photo { width:132px; height:132px; border-radius:50%; object-fit:cover; border:5px solid #fff; box-shadow:0 8px 24px rgba(20,23,31,.16); margin-top:-66px; background:#fff; }
.pp-photo-fallback { width:132px; height:132px; border-radius:50%; background:linear-gradient(135deg,var(--accent),var(--violet)); margin-top:-66px; border:5px solid #fff; box-shadow:0 8px 24px rgba(20,23,31,.16); }
.pp-name { font-family:var(--f-display); font-weight:700; font-size:clamp(26px,3.2vw,38px); letter-spacing:-.03em; line-height:1.1; margin-top:16px; }
.pp-headline { font-size:15px; color:var(--ink-60); margin-top:6px; font-weight:500; }
.pp-contact { display:flex; flex-wrap:wrap; gap:6px 14px; margin-top:10px; font-size:13px; color:var(--ink-60); }
.pp-contact a { color:var(--ink-60); text-decoration:none; }
.pp-contact a:hover { color:var(--accent); }
.pp-bio { font-size:15.5px; color:var(--ink-60); line-height:1.75; max-width:720px; margin-top:16px; }
.pp-layout { display:grid; grid-template-columns:200px 1fr; gap:48px; align-items:start; max-width:1120px; }
.pp-pagenav { position:sticky; top:88px; display:flex; flex-direction:column; gap:2px; }
.pp-pagenav a { font-size:13px; font-weight:600; color:var(--ink-40); text-decoration:none; padding:8px 12px; border-radius:9px; border-left:2px solid transparent; }
.pp-pagenav a:hover { color:var(--ink); background:#F4F4F8; }
.pp-pagenav a.pp-nav-active { color:var(--accent); border-left-color:var(--accent); background:rgba(47,42,229,.06); }
.pp-main { min-width:0; }
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
@media (max-width:900px) {
  .pp-layout { grid-template-columns:1fr; gap:20px; }
  .pp-pagenav { position:static; flex-direction:row; overflow-x:auto; gap:4px; padding-bottom:4px; border-bottom:1px solid var(--hair-soft); margin-bottom:8px; }
  .pp-pagenav a { white-space:nowrap; border-left:none; border-bottom:2px solid transparent; border-radius:0; }
  .pp-pagenav a.pp-nav-active { border-left-color:transparent; border-bottom-color:var(--accent); background:none; }
  .pp-photo, .pp-photo-fallback { width:96px; height:96px; margin-top:-48px; }
  .pp-header-card { padding:0 20px 22px; }
}
`;

export function renderPublicProfileHtml(data: PublicProfilePageData, currentLang: LangCode = "IT"): string {
  const ui = UI_STRINGS[currentLang];
  const title = `${data.fullName} — ProntoCurriculum`;
  const heroSvg = buildHeroSvg({ seed: data.slug, width: 1120, height: 224 });
  const orderedSections = [...data.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ key: s.key, content: SECTION_RENDERERS[s.key]?.(data, ui) ?? "" }))
    .filter((s) => s.content);
  const sectionsHtml = orderedSections.map((s) => `<section class="sec" id="sec-${s.key}">${s.content}</section>`).join("");
  const navLinks = orderedSections.map((s) => `<a href="#sec-${s.key}" data-nav="${s.key}">${escapeHtml(ui.sections[s.key])}</a>`).join("");

  const contactParts: string[] = [];
  if (data.city) contactParts.push(escapeHtml(data.city));
  if (data.email) contactParts.push(`<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`);
  if (data.phone) contactParts.push(escapeHtml(data.phone));
  if (data.linkedin) contactParts.push(`<a href="${escapeHtml(data.linkedin)}" target="_blank" rel="noopener nofollow noreferrer">LinkedIn</a>`);
  if (data.website) contactParts.push(`<a href="${escapeHtml(data.website)}" target="_blank" rel="noopener nofollow noreferrer">${escapeHtml(data.website.replace(/^https?:\/\//, ""))}</a>`);
  const contactHtml = contactParts.length ? `<div class="pp-contact">${contactParts.join('<span aria-hidden="true">·</span>')}</div>` : "";

  return `<!DOCTYPE html>
<html lang="${currentLang.toLowerCase()}">
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
        <a class="btn btn-ink btn-sm" href="https://prontocurriculum.it/crea-cv">${escapeHtml(ui.createYourPage)}</a>
      </nav>
    </div>
  </header>

  <div class="shell">
    <div class="pp-hero-wrap">${heroSvg}</div>
    <div class="pp-header-card">
      ${data.photo ? `<img class="pp-photo" src="${escapeHtml(data.photo)}" alt="${escapeHtml(data.fullName)}" />` : `<div class="pp-photo-fallback"></div>`}
      <div class="pp-name">${escapeHtml(data.fullName)}</div>
      ${data.headline ? `<div class="pp-headline">${escapeHtml(data.headline)}</div>` : ""}
      ${contactHtml}
      ${data.bio ? `<p class="pp-bio">${escapeHtml(data.bio)}</p>` : ""}
    </div>

    <div class="pp-layout">
      <nav class="pp-pagenav" aria-label="Sezioni della pagina">${navLinks}</nav>
      <div class="pp-main">${sectionsHtml}</div>
    </div>
  </div>

  <div class="shell">
    <footer>
      <div class="foot-bottom">
        <span class="mono">&copy; ${new Date().getFullYear()} ProntoCurriculum — ${escapeHtml(ui.madeInItaly)}</span>
      </div>
    </footer>
  </div>
</div>
<script>
(function(){
  var links = Array.prototype.slice.call(document.querySelectorAll('.pp-pagenav a'));
  var sections = links.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var id = entry.target.getAttribute('id');
      links.forEach(function(a){ a.classList.toggle('pp-nav-active', a.getAttribute('href') === '#' + id); });
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  sections.forEach(function(s){ observer.observe(s); });
})();
</script>
</body>
</html>`;
}
