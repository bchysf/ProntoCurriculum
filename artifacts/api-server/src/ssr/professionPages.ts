import { renderSsrPage, escapeHtml } from "./shell";
import { PROFESSION_PROFILES, getProfessionProfile, type ProfessionProfile } from "./professionData";
import { getCityProfile } from "./lombardiaData";

const HUB_PATH = "/lavoro/lombardia";

function pathFor(p: ProfessionProfile): string {
  return p.citySlug ? `${HUB_PATH}/${p.citySlug}/${p.slug}` : `${HUB_PATH}/${p.slug}`;
}

export function getProfessionHtml(citySlugOrNull: string | null, slug: string): string | null {
  const p = getProfessionProfile(citySlugOrNull, slug);
  if (!p) return null;
  const path = pathFor(p);
  const city = p.citySlug ? getCityProfile(p.citySlug) : undefined;

  const skillsHtml = p.keySkills.map((s) => `<li>${escapeHtml(s)}</li>`).join("\n");
  const faqHtml = p.faq
    .map((f, i) => `<details${i === 0 ? " open" : ""}><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`)
    .join("\n");

  const crumbCity = city
    ? `<span>/</span><a href="${HUB_PATH}/${city.slug}">${escapeHtml(city.name)}</a>`
    : "";

  const body = `
    <nav class="crumb" aria-label="breadcrumb"><a href="/">Home</a><span>/</span><a href="${HUB_PATH}">Lavoro in Lombardia</a>${crumbCity}<span>/</span><b>CV ${escapeHtml(p.profession)}</b></nav>
    <section class="hero">
      <h1>Come scrivere un CV da ${escapeHtml(p.profession)} a ${escapeHtml(p.locationLabel)}</h1>
      <p class="sub">${escapeHtml(p.intro)}</p>
    </section>

    <div class="answer"><b>In sintesi:</b> ${escapeHtml(p.demandFact)}. Stipendio indicativo: ${escapeHtml(p.salaryRange)}.</div>

    <div class="stats">
      <div class="stat"><div class="n">${escapeHtml(p.salaryRange.split(",")[0] ?? p.salaryRange)}</div><div class="l">${escapeHtml(p.salaryNote)}</div></div>
    </div>

    <section class="sec">
      <h2>Cosa deve contenere il CV di un ${escapeHtml(p.profession.toLowerCase())}</h2>
      <div class="prose"><p>${escapeHtml(p.cvAdvice)}</p></div>
      <ul class="prose" style="padding-left:22px">${skillsHtml}</ul>
    </section>

    <section class="sec">
      <h2>L'errore più comune da evitare</h2>
      <div class="prose"><p>${escapeHtml(p.mistakes)}</p></div>
    </section>

    <section class="sec">
      <h2>Domande frequenti</h2>
      <div class="faq">${faqHtml}</div>
    </section>

    <div class="cta-band">
      <div>
        <h3>Crea il tuo CV da ${escapeHtml(p.profession)}</h3>
        <p>Genera in pochi minuti un curriculum ottimizzato ATS, con le competenze giuste già in evidenza per questo ruolo.</p>
      </div>
      <a class="btn btn-ink" href="/crea-cv">Crea il tuo CV gratis</a>
    </div>

    <p class="src">Fonti: ${p.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`).join(" · ")}. Dati aggiornati al ${p.updated}.</p>
  `;

  const breadcrumbItems: Array<{ "@type": "ListItem"; position: number; name: string; item: string }> = [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://prontocurriculum.it/" },
    { "@type": "ListItem", position: 2, name: "Lavoro in Lombardia", item: `https://prontocurriculum.it${HUB_PATH}` },
  ];
  if (city) {
    breadcrumbItems.push({ "@type": "ListItem", position: 3, name: city.name, item: `https://prontocurriculum.it${HUB_PATH}/${city.slug}` });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: `CV ${p.profession}`,
    item: `https://prontocurriculum.it${path}`,
  });

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Come scrivere un CV da ${p.profession} a ${p.locationLabel}`,
      description: p.intro,
      dateModified: p.updated,
      datePublished: p.updated,
      author: { "@type": "Organization", name: "ProntoCurriculum" },
    },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbItems },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];

  return renderSsrPage({
    title: `CV ${p.profession} a ${p.locationLabel}: guida e stipendi 2026 | ProntoCurriculum`,
    description: `${p.demandFact}. Come scrivere un CV da ${p.profession.toLowerCase()} efficace a ${p.locationLabel}: stipendi reali, competenze richieste ed errori da evitare.`,
    canonicalPath: path,
    bodyHtml: body,
    schemaJson: schema,
  });
}

export function getProfessionLinksForCity(citySlug: string): { href: string; label: string }[] {
  return PROFESSION_PROFILES.filter((p) => p.citySlug === citySlug).map((p) => ({
    href: pathFor(p),
    label: `CV ${p.profession}`,
  }));
}

export function getRegionalProfessionLinks(): { href: string; label: string }[] {
  return PROFESSION_PROFILES.filter((p) => p.citySlug === null).map((p) => ({
    href: pathFor(p),
    label: `CV ${p.profession}`,
  }));
}
