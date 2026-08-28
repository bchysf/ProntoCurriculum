// /strumenti — hub page listing every career tool, live or planned.
// Placeholder cards are honest about not being built yet (no fake links,
// no fabricated functionality) so the page can ship now and grow in place
// as each tool ships, without ever misleading a visitor or a crawler.
import { renderSsrPage, escapeHtml } from "./shell";

interface ToolEntry {
  name: string;
  description: string;
  href?: string; // omitted while planned
  status: "live" | "planned";
}

const TOOLS: ToolEntry[] = [
  {
    name: "Calcolo stipendio netto",
    description: "Converti la RAL in netto mensile, con trattenute e addizionali regionali aggiornate.",
    href: "/calcolo-stipendio",
    status: "live",
  },
  {
    name: "Bacheca offerte di lavoro",
    description: "Annunci di lavoro aggiornati, con possibilità di candidarti direttamente con il tuo CV.",
    href: "/offerte-lavoro",
    status: "live",
  },
  {
    name: "Concorsi pubblici",
    description: "Bandi di concorso pubblico aperti, con scadenze e requisiti.",
    href: "/concorsi-pubblici",
    status: "live",
  },
  {
    name: "Calcolo mutuo",
    description: "Simula rata, interessi e piano di ammortamento di un mutuo in base a reddito e importo richiesto.",
    status: "planned",
  },
  {
    name: "Calcolo pensione e previdenza",
    description: "Stima la pensione futura in base a contributi versati, età e tipo di gestione previdenziale.",
    status: "planned",
  },
  {
    name: "Azienda del mese",
    description: "Una selezione mensile di aziende che assumono, con profilo, settore e posizioni aperte.",
    status: "planned",
  },
];

export function getToolsHubHtml(): string {
  const cards = TOOLS.map((tool) => {
    if (tool.status === "live" && tool.href) {
      return `<a class="city-card" href="${tool.href}"><b>${escapeHtml(tool.name)}</b><span>${escapeHtml(tool.description)}</span></a>`;
    }
    return `<div class="city-card" style="opacity:.55;cursor:default"><b>${escapeHtml(tool.name)}</b><span>${escapeHtml(tool.description)}</span><br/><span class="mono" style="color:var(--accent);margin-top:8px;display:inline-block">In arrivo</span></div>`;
  }).join("\n");

  const body = `
    <nav class="crumb" aria-label="breadcrumb"><a href="/">Home</a><span>/</span><b>Strumenti</b></nav>
    <section class="hero">
      <h1>Strumenti gratuiti per il lavoro e la carriera</h1>
      <p class="sub">Calcolatori, bacheche e guide pratiche per ogni fase della tua carriera: dal primo CV alla ricerca di un mutuo. Alcuni strumenti sono già disponibili, altri sono in costruzione.</p>
    </section>

    <section class="sec" style="max-width:none">
      <h2>Tutti gli strumenti</h2>
      <div class="grid-cards">
        ${cards}
      </div>
    </section>

    <div class="cta-band">
      <div>
        <h3>Inizia dal CV</h3>
        <p>Il primo strumento da usare resta il curriculum: creane uno ottimizzato ATS in pochi minuti.</p>
      </div>
      <a class="btn btn-ink" href="/crea-cv">Crea il tuo CV gratis</a>
    </div>
  `;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Strumenti gratuiti per il lavoro e la carriera",
      description: "Calcolatori e strumenti per stipendio, mutuo, pensione e ricerca lavoro.",
      hasPart: TOOLS.filter((t) => t.status === "live").map((t) => ({
        "@type": "WebApplication",
        name: t.name,
        url: `https://prontocurriculum.it${t.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://prontocurriculum.it/" },
        { "@type": "ListItem", position: 2, name: "Strumenti", item: "https://prontocurriculum.it/strumenti" },
      ],
    },
  ];

  return renderSsrPage({
    title: "Strumenti gratuiti per il lavoro: stipendio, mutuo, pensione | ProntoCurriculum",
    description: "Calcolo stipendio, bacheca lavoro, concorsi pubblici e presto mutuo, pensione e altro: tutti gli strumenti gratuiti per la tua carriera in un unico posto.",
    canonicalPath: "/strumenti",
    bodyHtml: body,
    schemaJson: schema,
  });
}
