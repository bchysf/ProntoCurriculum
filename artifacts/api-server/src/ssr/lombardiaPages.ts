import { renderSsrPage, escapeHtml } from "./shell";
import { REGION_STATS, REGION_SOURCES, CITY_PROFILES, PLANNED_CITIES, getCityProfile } from "./lombardiaData";
import { getProfessionLinksForCity, getRegionalProfessionLinks } from "./professionPages";

const HUB_PATH = "/lavoro/lombardia";

export function getHubHtml(): string {
  const regionalProfessionLinks = getRegionalProfessionLinks();
  const regionalProfessionLinksHtml = regionalProfessionLinks.length
    ? `<section class="sec">
        <h2>Guide CV per professione, a livello regionale</h2>
        <div class="grid-cards">
          ${regionalProfessionLinks.map((l) => `<a class="city-card" href="${l.href}"><b>${escapeHtml(l.label)}</b></a>`).join("\n")}
        </div>
      </section>`
    : "";
  const cityCards = CITY_PROFILES.map(
    (c) => `<a class="city-card" href="${HUB_PATH}/${c.slug}"><b>${escapeHtml(c.name)}</b><span>${escapeHtml(c.avgRal)} RAL media</span></a>`,
  ).join("\n");
  const plannedCards = PLANNED_CITIES.map(
    (name) => `<div class="city-card" style="opacity:.55;cursor:default"><b>${escapeHtml(name)}</b><span>Profilo in arrivo</span></div>`,
  ).join("\n");

  const body = `
    <nav class="crumb" aria-label="breadcrumb"><a href="/">Home</a><span>/</span><b>Lavoro in Lombardia</b></nav>
    <section class="hero">
      <h1>Lavoro in Lombardia: dati aggiornati su stipendi, occupazione e settori per provincia</h1>
      <p class="sub">Una mappa dati, provincia per provincia, per chi cerca lavoro o sta scrivendo il proprio CV per il mercato lombardo — occupazione, RAL media e settori trainanti, con fonti verificate.</p>
    </section>

    <div class="answer">
      <b>In sintesi:</b> la Lombardia ha un tasso di occupazione del ${REGION_STATS.employmentRate} (${REGION_STATS.employmentRateNote}) e un tasso di disoccupazione del ${REGION_STATS.unemploymentRate} (${REGION_STATS.unemploymentRateNote}) — tra i migliori dati regionali d'Italia. La retribuzione annua lorda media è di ${REGION_STATS.avgRal}, con Milano sopra la media grazie a finanza, moda e tech.
    </div>

    <div class="stats">
      <div class="stat"><div class="n">${REGION_STATS.employedTotal}</div><div class="l">occupati in Lombardia — ${REGION_STATS.employedTotalNote}</div></div>
      <div class="stat"><div class="n">${REGION_STATS.unemploymentRate}</div><div class="l">tasso di disoccupazione — ${REGION_STATS.unemploymentRateNote}</div></div>
      <div class="stat"><div class="n">${REGION_STATS.employmentRate}</div><div class="l">tasso di occupazione — ${REGION_STATS.employmentRateNote}</div></div>
      <div class="stat"><div class="n">${REGION_STATS.avgRal}</div><div class="l">${REGION_STATS.avgRalNote}</div></div>
    </div>

    <section class="sec">
      <h2>Il mercato del lavoro, provincia per provincia</h2>
      <p class="prose">Ogni provincia lombarda ha un'economia distinta: Milano guida su finanza e moda, Bergamo e Brescia sono il cuore della manifattura export-oriented, Varese punta su aerospazio e life sciences, Sondrio vive l'anno olimpico 2026, Cremona conserva l'unica tradizione liutaria al mondo. Tutte e 12 le province capoluogo sono coperte qui sotto, con dati e fonti verificate.</p>
      <div class="grid-cards">
        ${cityCards}
        ${plannedCards}
      </div>
    </section>

    ${regionalProfessionLinksHtml}

    <section class="sec">
      <h2>Domande frequenti</h2>
      <div class="faq">
        <details open>
          <summary>Qual è lo stipendio medio in Lombardia nel 2026?</summary>
          <p>La retribuzione annua lorda (RAL) media in Lombardia è di ${REGION_STATS.avgRal}. Milano è sopra la media regionale grazie a finanza e moda, mentre le altre province si avvicinano più alla media nazionale.</p>
        </details>
        <details>
          <summary>La Lombardia ha un tasso di disoccupazione basso?</summary>
          <p>Sì: il tasso di disoccupazione lombardo è al ${REGION_STATS.unemploymentRate} nel primo trimestre 2026, tra i più bassi d'Italia, con un tasso di occupazione salito al ${REGION_STATS.employmentRate}.</p>
        </details>
        <details>
          <summary>Come si scrive un CV efficace per il mercato lombardo?</summary>
          <p>La maggior parte delle aziende lombarde di medie e grandi dimensioni usa sistemi ATS per filtrare le candidature: un CV con formattazione pulita, parole chiave del settore e risultati misurabili passa lo screening automatico più facilmente di un CV grafico. Vedi la <a href="/guida-cv">guida completa al CV</a>.</p>
        </details>
      </div>
    </section>

    <div class="cta-band">
      <div>
        <h3>Crea un CV ottimizzato per il mercato lombardo</h3>
        <p>Genera in pochi minuti un curriculum in italiano, ottimizzato ATS, pronto per candidarti nei settori più richiesti in Lombardia.</p>
      </div>
      <a class="btn btn-ink" href="/crea-cv">Crea il tuo CV gratis</a>
    </div>

    <p class="src">Fonti: ${REGION_SOURCES.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`).join(" · ")}. Dati aggiornati al ${REGION_STATS.updated}.</p>
  `;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "Mercato del lavoro in Lombardia — occupazione, stipendi e settori",
      description: "Dati su tasso di occupazione, disoccupazione, RAL media e settori trainanti in Lombardia, per provincia.",
      spatialCoverage: { "@type": "Place", name: "Lombardia, Italia" },
      dateModified: REGION_STATS.updated,
      creator: { "@type": "Organization", name: "ProntoCurriculum" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://prontocurriculum.it/" },
        { "@type": "ListItem", position: 2, name: "Lavoro in Lombardia", item: `https://prontocurriculum.it${HUB_PATH}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Qual è lo stipendio medio in Lombardia nel 2026?", acceptedAnswer: { "@type": "Answer", text: `La retribuzione annua lorda media in Lombardia è di ${REGION_STATS.avgRal}.` } },
        { "@type": "Question", name: "La Lombardia ha un tasso di disoccupazione basso?", acceptedAnswer: { "@type": "Answer", text: `Sì, il tasso di disoccupazione lombardo è al ${REGION_STATS.unemploymentRate} nel primo trimestre 2026.` } },
      ],
    },
  ];

  return renderSsrPage({
    title: "Lavoro in Lombardia 2026: stipendi, occupazione e settori per provincia | ProntoCurriculum",
    description: `Dati aggiornati su occupazione (${REGION_STATS.employmentRate}), disoccupazione (${REGION_STATS.unemploymentRate}) e stipendi medi (${REGION_STATS.avgRal}) in Lombardia, provincia per provincia, con fonti verificate.`,
    canonicalPath: HUB_PATH,
    bodyHtml: body,
    schemaJson: schema,
  });
}

export function getCityHtml(slug: string): string | null {
  const city = getCityProfile(slug);
  if (!city) return null;
  const path = `${HUB_PATH}/${city.slug}`;

  const sectorRows = city.sectors
    .map((s) => `<tr><td><b style="color:var(--ink)">${escapeHtml(s.name)}</b></td><td>${escapeHtml(s.note)}</td></tr>`)
    .join("\n");
  const faqHtml = city.faq
    .map(
      (f, i) => `<details${i === 0 ? " open" : ""}><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`,
    )
    .join("\n");

  const professionLinks = getProfessionLinksForCity(city.slug);
  const professionLinksHtml = professionLinks.length
    ? `<section class="sec">
        <h2>Guide CV per professione a ${escapeHtml(city.name)}</h2>
        <div class="grid-cards">
          ${professionLinks.map((l) => `<a class="city-card" href="${l.href}"><b>${escapeHtml(l.label)}</b></a>`).join("\n")}
        </div>
      </section>`
    : "";

  const body = `
    <nav class="crumb" aria-label="breadcrumb"><a href="/">Home</a><span>/</span><a href="${HUB_PATH}">Lavoro in Lombardia</a><span>/</span><b>${escapeHtml(city.name)}</b></nav>
    <section class="hero">
      <h1>Lavoro a ${escapeHtml(city.name)}: stipendi, settori e come scrivere il CV giusto</h1>
      <p class="sub">${escapeHtml(city.intro)}</p>
    </section>

    <div class="answer"><b>In sintesi:</b> a ${escapeHtml(city.name)} la RAL media è ${escapeHtml(city.avgRal)}, con il tasso di disoccupazione ${escapeHtml(city.unemploymentNote)}. I settori più forti sono ${city.sectors.map((s) => s.name.toLowerCase()).join(", ")}.</div>

    <section class="sec">
      <h2>Settori trainanti a ${escapeHtml(city.name)}</h2>
      <table class="data">
        <thead><tr><th>Settore</th><th>Dettaglio</th></tr></thead>
        <tbody>${sectorRows}</tbody>
      </table>
    </section>

    <section class="sec">
      <h2>Come impostare il CV per candidarti a ${escapeHtml(city.name)}</h2>
      <div class="prose"><p>${escapeHtml(city.advice)}</p></div>
    </section>
    ${professionLinksHtml}

    <section class="sec">
      <h2>Domande frequenti su lavoro e stipendi a ${escapeHtml(city.name)}</h2>
      <div class="faq">${faqHtml}</div>
    </section>

    <div class="cta-band">
      <div>
        <h3>Candidati a ${escapeHtml(city.name)} con un CV a prova di ATS</h3>
        <p>Crea gratis un curriculum ottimizzato per i settori più richiesti nella tua zona.</p>
      </div>
      <a class="btn btn-ink" href="/crea-cv">Crea il tuo CV gratis</a>
    </div>

    <p class="src">Fonti: ${city.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>`).join(" · ")}. Dati aggiornati al ${city.updated}.</p>
  `;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      name: `${city.name}, Lombardia`,
      containedInPlace: { "@type": "AdministrativeArea", name: "Lombardia, Italia" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://prontocurriculum.it/" },
        { "@type": "ListItem", position: 2, name: "Lavoro in Lombardia", item: `https://prontocurriculum.it${HUB_PATH}` },
        { "@type": "ListItem", position: 3, name: city.name, item: `https://prontocurriculum.it${path}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: city.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return renderSsrPage({
    title: `Lavoro a ${city.name} 2026: stipendi e settori | ProntoCurriculum`,
    description: `RAL media, tasso di occupazione e settori trainanti a ${city.name}: dati aggiornati con fonti verificate per chi cerca lavoro o scrive il proprio CV.`,
    canonicalPath: path,
    bodyHtml: body,
    schemaJson: schema,
  });
}
