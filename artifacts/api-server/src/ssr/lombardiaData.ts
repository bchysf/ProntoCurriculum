// Structured data backing the /lavoro/lombardia pSEO hub and its city spokes.
// Every figure carries a source — see CITATIONS. Do not add a city profile
// here without first researching real, citable numbers for it (programmatic
// SEO content-authenticity rule: never fabricate labour-market data).

export interface CitySector {
  name: string;
  note: string;
}

export interface CityProfile {
  slug: string;
  name: string;
  province: string;
  intro: string;
  avgRal: string;
  unemploymentNote: string;
  sectors: CitySector[];
  advice: string[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  updated: string; // ISO date, tied to when the underlying stats were verified
}

export const REGION_STATS = {
  employmentRate: "70,3%",
  employmentRateNote: "popolazione 15-64 anni, I trimestre 2026",
  unemploymentRate: "2,8%",
  unemploymentRateNote: "I trimestre 2026, tra i più bassi d'Italia",
  employedTotal: "4,628 milioni",
  employedTotalNote: "occupati in Lombardia, I trimestre 2026 (+0,8% su base annua)",
  avgRal: "€35.137",
  avgRalNote: "retribuzione annua lorda media regionale",
  updated: "2026-08-28",
};

export const REGION_SOURCES = [
  { label: "Regione Lombardia — Lombardia Speciale, numeri del lavoro 2025", url: "https://www.lombardiaspeciale.regione.lombardia.it" },
  { label: "Unioncamere Lombardia — Osservatorio mercato del lavoro", url: "https://www.unioncamerelombardia.it" },
  { label: "Indeed — Stipendio medio in Lombardia", url: "https://it.indeed.com/guida-alla-carriera/retribuzione-stipendio/stipendio-medio-in-lombardia" },
];

export const CITY_PROFILES: CityProfile[] = [
  {
    slug: "milano",
    name: "Milano",
    province: "Città metropolitana di Milano",
    intro:
      "Milano è il principale mercato del lavoro della Lombardia e d'Italia: capitale della finanza, della moda e polo tech in crescita, con una RAL media tra le più alte del Paese.",
    avgRal: "€37.661–40.000",
    unemploymentNote: "in linea con il dato regionale lombardo del 2,8%, tra i più bassi d'Italia",
    sectors: [
      { name: "Finanza e servizi bancari", note: "RAL media di settore più alta d'Italia, circa €45.900; oltre €100.000 nel private banking senior" },
      { name: "Moda e lusso", note: "sede di Gucci, Prada, Versace, Armani, Dolce & Gabbana; forte domanda di ruoli merchandising, buying, digital" },
      { name: "Tecnologia e software", note: "software engineer e sviluppatori tra €40.000 e €55.000 di RAL" },
      { name: "Manifattura e industria", note: "buona tenuta per ingegneria, automazione e supply chain" },
      { name: "Sanità e life sciences", note: "policlinici e centri di ricerca clinica di rilievo nazionale (San Raffaele, Humanitas, Niguarda) generano una domanda costante di personale sanitario e di ricerca" },
      { name: "Media, editoria e comunicazione", note: "sede storica dei principali gruppi editoriali e pubblicitari italiani, con un mercato denso per ruoli di comunicazione, marketing e digital" },
    ],
    advice: [
      "A Milano il CV deve reggere il confronto con un mercato molto competitivo: numeri e risultati misurabili contano più delle descrizioni generiche, e per i settori finance/fashion la formattazione ATS-friendly resta decisiva perché la maggior parte delle grandi aziende filtra le candidature con software di screening prima che un recruiter le legga.",
      "Chi arriva da fuori città o dall'hinterland (Monza, Pavia, Lodi, Bergamo) può segnalare nel CV la disponibilità al pendolarismo o allo smart working ibrido: molte aziende milanesi, soprattutto nei settori tech e servizi, offrono 2-3 giorni di lavoro da remoto e valutano positivamente candidati che dichiarano esplicitamente questa flessibilità logistica.",
    ],
    faq: [
      { q: "Qual è lo stipendio medio a Milano nel 2026?", a: "La RAL media a Milano è tra €37.661 e €40.000 lordi annui, contro una media regionale lombarda di €35.137. I settori finanza e moda pagano sopra la media, mentre i ruoli entry-level junior si attestano più in basso." },
      { q: "Quali sono i settori che assumono di più a Milano?", a: "Finanza e servizi bancari, moda e lusso, tecnologia/software e manifattura ad alto contenuto tecnico sono i settori con la domanda più stabile a Milano." },
      { q: "Il tasso di disoccupazione a Milano è alto?", a: "No: la Lombardia nel suo complesso ha un tasso di disoccupazione del 2,8% (I trimestre 2026), tra i più bassi d'Italia, e Milano come motore economico regionale è in linea o sotto questo dato." },
      { q: "Il costo della vita a Milano è sostenibile con lo stipendio medio?", a: "Milano ha il costo della vita più alto d'Italia, in particolare per gli affitti: chi guadagna una RAL vicina alla media cittadina spesso valuta il pendolarismo dall'hinterland (Monza, Pavia, Lodi) come alternativa più sostenibile, un fattore che molte aziende milanesi considerano offrendo smart working parziale." },
      { q: "Conviene lavorare a Milano vivendo fuori città?", a: "Sì, è una scelta comune: la rete ferroviaria suburbana e le linee regionali collegano rapidamente Milano a Monza, Bergamo, Pavia e Lodi, e molte aziende milanesi offrono giorni di smart working settimanale, rendendo il pendolarismo quotidiano una strategia diffusa per contenere i costi abitativi." },
      { q: "Il CV per una grande azienda milanese è diverso da quello per una PMI?", a: "Sì: le grandi aziende e multinazionali con sede a Milano filtrano quasi sempre le candidature con sistemi ATS, quindi premiano parole chiave precise e formattazione lineare; le PMI del resto della Lombardia, invece, spesso leggono il CV direttamente e danno più peso al percorso complessivo e alle referenze dirette." },
    ],
    sources: [
      { label: "Indeed — Stipendio medio a Milano", url: "https://it.indeed.com/guida-alla-carriera/retribuzione-stipendio/stipendio-medio-milano" },
      { label: "Regione Lombardia — numeri del lavoro 2025", url: "https://www.lombardiaspeciale.regione.lombardia.it" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "bergamo",
    name: "Bergamo",
    province: "Provincia di Bergamo",
    intro:
      "Bergamo è il motore manifatturiero ed export-oriented della Lombardia: distretti industriali densi, filiere metalmeccaniche integrate con la Germania e il tasso di disoccupazione più basso della regione.",
    avgRal: "€35.961",
    unemploymentNote: "circa l'1,3%, il valore più basso tra tutte le province lombarde",
    sectors: [
      { name: "Manifattura ed export industriale", note: "distretti metalmeccanici tra i più densi d'Italia, forte integrazione con le filiere tedesche e centroeuropee" },
      { name: "Meccanica di precisione e componentistica", note: "domanda costante di tecnici di produzione, manutentori e programmatori CNC" },
      { name: "Logistica", note: "sostenuta dalla presenza dell'aeroporto di Orio al Serio, il principale scalo cargo/low-cost della Lombardia" },
      { name: "Automotive e componentistica di precisione", note: "sede di gruppi internazionali della frenatura e della componentistica auto, come Brembo, con quartier generale a Stezzano" },
      { name: "Turismo e Città Alta", note: "flusso turistico in crescita legato al centro storico patrimonio UNESCO e ai collegamenti low-cost dell'aeroporto di Orio al Serio" },
    ],
    advice: [
      "A Bergamo il mercato premia profili tecnici verificabili: certificazioni di macchina, esperienza su specifiche linee di produzione e conoscenza di almeno una lingua straniera per l'export contano più di un profilo generalista — il CV va scritto elencando competenze tecniche precise, non descrizioni vaghe di ruolo.",
      "A differenza delle grandi aziende milanesi, molte PMI bergamasche sono a conduzione familiare o gestite da imprenditori storici del territorio: un CV più diretto, con referenze verificabili e un percorso lineare, spesso pesa più della forma grafica o di un profilo internazionale generico.",
    ],
    faq: [
      { q: "Qual è lo stipendio medio a Bergamo nel 2026?", a: "La retribuzione media dei dipendenti a Bergamo è di circa €35.961 lordi annui (€2.997 al mese), leggermente sopra la media regionale lombarda di €35.137." },
      { q: "Perché a Bergamo la disoccupazione è così bassa?", a: "Bergamo ha il tasso di disoccupazione più basso di tutta la Lombardia, circa l'1,3%, grazie alla densità di piccole e medie imprese manifatturiere export-oriented che assorbono manodopera tecnica in modo continuativo." },
      { q: "Quali competenze cercano di più le aziende bergamasche?", a: "Competenze tecniche su macchine CNC, manutenzione industriale, gestione qualità e conoscenza di lingue straniere (soprattutto tedesco e inglese) per i rapporti con i mercati export." },
      { q: "Quali sono le grandi aziende che assumono a Bergamo?", a: "Il territorio ospita gruppi industriali di rilievo internazionale come Brembo (sistemi frenanti, sede a Stezzano) e una fitta rete di PMI metalmeccaniche fornitrici delle filiere automotive e industriale tedesca." },
      { q: "Il turismo a Bergamo genera occupazione stabile?", a: "È in crescita: la valorizzazione della Città Alta, patrimonio UNESCO, e i collegamenti low-cost dell'aeroporto di Orio al Serio hanno ampliato la domanda di personale nella ricettività, ristorazione e servizi turistici, anche se resta un mercato più stagionale rispetto alla manifattura." },
      { q: "È meglio cercare lavoro in provincia o candidarsi anche a Milano da Bergamo?", a: "Molti bergamaschi lavorano su entrambi i mercati grazie ai collegamenti ferroviari rapidi con Milano: chi cerca stipendi più alti guarda anche alle offerte milanesi, ma la densità di PMI manifatturiere locali garantisce spesso stabilità contrattuale superiore alla media regionale." },
    ],
    sources: [
      { label: "Jooble — Stipendio aziende Bergamo", url: "https://it.jooble.org/salary/aziende/Bergamo" },
      { label: "Regione Lombardia — numeri del lavoro 2025", url: "https://www.lombardiaspeciale.regione.lombardia.it" },
      { label: "Brembo — sede e centro R&S di Stezzano (Bergamo)", url: "https://en.wikipedia.org/wiki/Brembo" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "brescia",
    name: "Brescia",
    province: "Provincia di Brescia",
    intro:
      "Brescia è la capitale lombarda della siderurgia e della meccanica: uno dei distretti metalmeccanici più competitivi d'Italia, con forte domanda di tecnici specializzati e stipendi di settore in crescita.",
    avgRal: "sopra la media regionale (€35.137)",
    unemploymentNote: "in linea con i valori più bassi della Lombardia",
    sectors: [
      { name: "Siderurgia e metalmeccanica", note: "grandi realtà industriali e distretti di lavorazione dei metalli; retribuzioni di settore cresciute del 5,2% tra 2024 e 2025" },
      { name: "Automotive e componentistica", note: "produzione di componenti meccanici per l'automotive nazionale ed europeo" },
      { name: "Tecnici specializzati", note: "manutenzione, saldatura, meccanica industriale e operatori su macchine CNC sono i profili più ricercati" },
      { name: "Energia e utility", note: "presenza di A2A, tra le maggiori multiutility italiane per energia, ambiente e reti, con radici storiche a Brescia" },
      { name: "Automotive commerciale", note: "stabilimento storico ex OM-Iveco per la produzione di veicoli commerciali, motore di un indotto di componentistica e logistica" },
    ],
    advice: [
      "Nel distretto bresciano un CV tecnico deve mettere in evidenza le certificazioni di saldatura, l'esperienza su specifiche macchine CNC e la conoscenza delle normative di sicurezza industriale: sono questi i dettagli che fanno la differenza nello screening delle aziende metalmeccaniche, molto più di una descrizione generica delle mansioni.",
      "Le grandi realtà industriali come A2A e lo stabilimento Iveco applicano processi di selezione strutturati, con test tecnici e colloqui multipli; le PMI dell'indotto metalmeccanico, invece, spesso assumono più rapidamente sulla base di referenze dirette e prove pratiche in officina, quindi vale la pena calibrare il CV in base al tipo di azienda a cui ci si rivolge.",
    ],
    faq: [
      { q: "Quali sono i settori trainanti a Brescia?", a: "Siderurgia e metalmeccanica restano i settori storici e dominanti, insieme a automotive e componentistica; la domanda di tecnici di manutenzione, saldatori e operatori CNC è costante." },
      { q: "Gli stipendi nel metalmeccanico bresciano stanno crescendo?", a: "Sì: tra il 2024 e il 2025 le retribuzioni nel settore siderurgico e metallurgico sono cresciute del 5,2%, un aumento superiore alla media di molti altri settori industriali." },
      { q: "Che tipo di CV serve per il settore metalmeccanico a Brescia?", a: "Un CV che elenchi certificazioni specifiche (saldatura, patentini macchina), esperienza su impianti o linee particolari, e competenze di sicurezza industriale, con formato leggibile dai sistemi ATS delle agenzie del lavoro." },
      { q: "Quali sono i principali datori di lavoro industriali a Brescia?", a: "Tra i nomi di maggior peso ci sono A2A nell'energia e nelle utility e lo stabilimento Iveco (ex OM) per i veicoli commerciali, oltre a gruppi siderurgici storici del territorio e centinaia di PMI metalmeccaniche subfornitrici." },
      { q: "Il settore siderurgico bresciano sta assumendo?", a: "Il settore resta ciclico e sensibile ai costi energetici e alla domanda internazionale dell'acciaio: le retribuzioni sono cresciute negli ultimi anni, ma le assunzioni possono rallentare nei periodi di calo della domanda, quindi conviene monitorare più aziende del distretto in parallelo." },
      { q: "Conviene specializzarsi su una singola macchina o restare generalisti nel metalmeccanico bresciano?", a: "La specializzazione paga: le aziende del distretto cercano profili con certificazioni precise (saldatura a norma, patentini CNC, esperienza su specifici impianti), mentre i profili generalisti faticano di più a superare la prima selezione nelle grandi realtà industriali." },
    ],
    sources: [
      { label: "Jooble — Stipendio operaio metalmeccanico Brescia", url: "https://it.jooble.org/salary/operaio-metalmeccanico/Brescia" },
      { label: "TgCom24 — Mappa degli stipendi per settore", url: "https://www.tgcom24.mediaset.it/skuola/dimmi_115021232-202602k.shtml" },
      { label: "Money.it — Top 10 aziende di Brescia per fatturato", url: "https://www.money.it/top-10-aziende-di-brescia-per-fatturato" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "como",
    name: "Como",
    province: "Provincia di Como",
    intro:
      "Como unisce una tradizione tessile-serica riconosciuta a livello mondiale a un'economia turistica trainata dal lago: un mercato del lavoro più fragile rispetto alla media lombarda, con margini di recupero nei servizi.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "circa il 5,6%, tra i valori più alti della Lombardia",
    sectors: [
      { name: "Tessile e seta", note: "distretto serico storico, riconosciuto a livello internazionale per la produzione di seta e tessuti di alta gamma" },
      { name: "Turismo e ospitalità", note: "trainato dal lago di Como, con forte stagionalità estiva e una domanda crescente di personale di sala e ricettivo" },
      { name: "Servizi", note: "settore in espansione, indicato dagli osservatori locali come area su cui investire per assorbire la disoccupazione residua" },
      { name: "Lavoro transfrontaliero in Svizzera", note: "decine di migliaia di lavoratori frontalieri dell'area Como-Varese sono occupati nel Canton Ticino, attratti da retribuzioni nette superiori alla media italiana" },
      { name: "Finanza e servizi alle imprese", note: "presenza di realtà bancarie e assicurative locali, rafforzata dalla vicinanza a Milano e alla piazza finanziaria ticinese" },
    ],
    advice: [
      "A Como conviene costruire un CV che valorizzi la flessibilità stagionale se ti candidi nel turismo, oppure competenze tecniche di filiera (design tessile, controllo qualità, macchine per la lavorazione della seta) se punti al distretto serico: i due mercati hanno logiche di selezione molto diverse tra loro.",
      "Chi valuta il mercato svizzero deve preparare un CV con un formato leggermente diverso da quello italiano: in Svizzera è prassi includere una foto professionale, indicare con precisione le date di ogni esperienza senza lacune e allegare referenze verificabili, elementi meno centrali nel CV italiano standard.",
    ],
    faq: [
      { q: "Perché la disoccupazione a Como è più alta della media lombarda?", a: "Il tasso di disoccupazione a Como si attesta intorno al 5,6%, superiore alla media regionale del 2,8%: gli osservatori segnalano un calo degli occupati e un aumento degli inattivi negli ultimi anni, con il settore dei servizi indicato come leva di recupero." },
      { q: "Il distretto della seta a Como offre ancora lavoro?", a: "Sì, Como mantiene un distretto tessile-serico di rilievo internazionale, con domanda di profili tecnici legati a design, controllo qualità e lavorazione dei tessuti pregiati." },
      { q: "Come funziona il lavoro stagionale sul lago di Como?", a: "Il turismo lacustre genera una forte domanda stagionale, soprattutto in primavera-estate, per ruoli di sala, reception e servizi ricettivi: la flessibilità oraria e la conoscenza di lingue straniere sono un vantaggio competitivo nel CV." },
      { q: "Conviene lavorare in Svizzera vivendo a Como?", a: "È una scelta comune: decine di migliaia di persone dell'area di Como e Varese lavorano come frontalieri in Canton Ticino, attratte da stipendi netti più alti; va però considerato il nuovo accordo fiscale Italia-Svizzera in vigore dal 2024, che ha in parte ridotto il vantaggio economico rispetto al passato." },
      { q: "Il turismo a Como è solo stagionale?", a: "La stagione estiva resta la più intensa per ricettività e ristorazione, ma il turismo del lago genera anche occupazione più continuativa in strutture di alta gamma, eventi e servizi, soprattutto nelle zone di Como città, Cernobbio e Bellagio." },
      { q: "Che documenti servono per candidarsi come frontaliere in Svizzera?", a: "Oltre al CV, occorre un permesso di frontaliere (permesso G) rilasciato dalle autorità svizzere una volta ottenuta un'offerta di lavoro: è utile indicare nel CV la disponibilità a lavorare oltre confine e, se posseduta, la conoscenza del tedesco oltre all'italiano." },
    ],
    sources: [
      { label: "Portale Lavoro Provincia di Como — Analisi condizione occupazionale 2025", url: "https://lavoro.provincia.como.it/2025/03/17/analisi-della-condizione-occupazionale-della-popolazione-2025/" },
      { label: "TvSvizzera — Frontalieri in Svizzera, crescita costante ma il Ticino rallenta", url: "https://www.tvsvizzera.it/tvs/relazioni-italo-svizzere/frontalieri-in-svizzera-crescita-costante-ma-il-ticino-rallenta/90288479" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cremona",
    name: "Cremona",
    province: "Provincia di Cremona",
    intro:
      "Cremona combina un'agricoltura e zootecnia tra le più produttive della pianura padana con un'eccellenza artigianale unica al mondo, la liuteria: un mercato del lavoro solido ma in leggero rallentamento dopo il boom del 2024.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "tra i più bassi in Lombardia, con occupazione tuttavia in lieve calo",
    sectors: [
      { name: "Agroalimentare e zootecnia", note: "una delle filiere agricole e casearie più produttive della pianura padana" },
      { name: "Liuteria", note: "distretto artigianale unico al mondo per la costruzione di strumenti ad arco, riconosciuto dall'UNESCO come patrimonio immateriale" },
      { name: "Industria manifatturiera", note: "produzione industriale in crescita nel 2026, anche se le nuove assunzioni restano ai minimi storici" },
      { name: "Dolciario e trasformazione alimentare", note: "sede storica di Sperlari (dal 1836), tra i marchi simbolo del torrone italiano, insieme a numerose realtà di trasformazione lattiero-casearia legate al Grana Padano" },
      { name: "Logistica agroindustriale", note: "posizione strategica lungo il Po e vicino ai principali assi Milano-Bologna, utile per la distribuzione dei prodotti agroalimentari" },
    ],
    advice: [
      "Per l'agroalimentare cremonese conta l'esperienza diretta in filiera (caseificio, allevamento, trasformazione), mentre per i ruoli industriali le aziende locali cercano soprattutto affidabilità e continuità: un CV chiaro, con date coerenti e competenze tecniche specifiche, è più efficace di un profilo generalista.",
      "Chi proviene dal settore agroalimentare dovrebbe indicare nel CV certificazioni HACCP, esperienza diretta in caseificio o allevamento e conoscenza delle normative di filiera, mentre chi punta all'industria manifatturiera locale deve dare risalto a continuità occupazionale e affidabilità, valori molto apprezzati dalle PMI cremonesi.",
    ],
    faq: [
      { q: "Qual è il tasso di occupazione a Cremona nel 2025?", a: "Il tasso di attività della popolazione 15-64 anni in provincia di Cremona è al 70,6% nel 2025, in calo di un punto percentuale rispetto al 71,6% del 2024, con 154.000 occupati contro i 157.000 dell'anno precedente." },
      { q: "La liuteria a Cremona offre reali opportunità di lavoro?", a: "Cremona ospita un distretto liutario riconosciuto a livello mondiale, con botteghe artigiane che formano e impiegano liutai specializzati: è un settore di nicchia ma con forte prestigio internazionale e domanda dall'estero." },
      { q: "Il mercato del lavoro cremonese sta rallentando?", a: "Sì: dopo il boom occupazionale del 2024, il 2025-2026 mostra segnali di rallentamento nelle nuove assunzioni, pur restando l'occupazione a livelli storicamente alti e la disoccupazione tra le più basse della Lombardia." },
      { q: "Cremona ha aziende alimentari di rilievo nazionale?", a: "Sì: Cremona è sede storica di Sperlari, fondata nel 1836 e tra i marchi più noti del torrone italiano, oltre a un tessuto diffuso di caseifici e trasformatori legati alla filiera del Grana Padano." },
      { q: "Il distretto liutario cremonese offre sbocchi occupazionali reali o solo prestigio?", a: "È un settore di nicchia con numeri occupazionali contenuti rispetto all'industria, ma le botteghe liutarie cremonesi formano artigiani richiesti a livello internazionale, e il legame con il turismo culturale legato all'UNESCO genera un indotto di servizi collegato." },
      { q: "Come cambia il CV per l'agroalimentare rispetto all'industria a Cremona?", a: "Per l'agroalimentare contano tracciabilità, certificazioni HACCP ed esperienza diretta in filiera; per l'industria manifatturiera pesa di più la continuità occupazionale e le competenze tecniche specifiche, quindi vale la pena adattare il CV al settore invece di usarne uno generico." },
    ],
    sources: [
      { label: "Cremonaoggi — Occupazione al 68,9%, mercato del lavoro cremonese", url: "https://www.cremonaoggi.it/2026/07/06/occupazione-al-689-il-mercato-del-lavoro-cremonese-tiene-ma-restano-le-fragilita-strutturali/" },
      { label: "Provincia di Cremona — Osservatorio del mercato del lavoro", url: "https://www.provincia.cremona.it/lavoro/opml-newsletter/html/2026-1/index.html" },
      { label: "Wikipedia — Sperlari, storia dell'azienda cremonese del torrone", url: "https://it.wikipedia.org/wiki/Sperlari" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "lecco",
    name: "Lecco",
    province: "Provincia di Lecco",
    intro:
      "Lecco è un mercato del lavoro a due velocità: un'industria metalmeccanica storica che perde occupati mentre i servizi crescono, con un tasso di attività ai minimi degli ultimi vent'anni ma disoccupazione tra le più basse d'Italia.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "2,6%, tra i valori più bassi d'Italia nonostante il calo occupazionale",
    sectors: [
      { name: "Metalmeccanica industriale", note: "settore storico del territorio, ha perso oltre 10.000 addetti negli ultimi due anni" },
      { name: "Servizi", note: "in crescita costante, rappresenta circa il 46% degli occupati totali (quasi 64.000 persone)" },
      { name: "Turismo lacustre e montano", note: "sostenuto dalla vicinanza al lago di Como e alle Prealpi orobiche" },
      { name: "Ricerca e formazione tecnica", note: "il Politecnico di Milano ha un polo territoriale a Lecco attivo dal 1989, che alimenta un legame diretto tra formazione ingegneristica e industria locale" },
      { name: "Escursionismo e sport outdoor", note: "la vicinanza al lago di Como e alle Prealpi orobiche sostiene un indotto di alpinismo, arrampicata e sport all'aria aperta" },
    ],
    advice: [
      "A Lecco il 53% delle assunzioni pianificate dalle aziende è difficile da coprire per carenza di competenze adeguate: un CV che dichiari esplicitamente competenze tecniche verificabili e disponibilità alla formazione continua ha un vantaggio concreto in un mercato dove la selezione fatica a trovare profili adatti.",
      "Chi ha una formazione tecnica o ingegneristica può valorizzare nel CV il legame con il Politecnico di Milano - polo di Lecco, se pertinente, insieme a competenze pratiche verificabili: nel mercato lecchese la teoria da sola pesa meno dell'esperienza diretta su macchinari, impianti o progetti concreti.",
    ],
    faq: [
      { q: "Perché a Lecco l'occupazione cala ma la disoccupazione resta bassa?", a: "Perché molte persone che escono dal mercato del lavoro diventano inattive invece di cercare occupazione: il tasso di attività è sceso al 67,2%, il più basso degli ultimi vent'anni, mentre chi cerca lavoro attivamente lo trova comunque relativamente in fretta (disoccupazione al 2,6%)." },
      { q: "L'industria lecchese sta davvero perdendo posti di lavoro?", a: "Sì, il settore industriale ha perso oltre 10.000 addetti negli ultimi due anni, mentre il settore dei servizi ha continuato a crescere fino a rappresentare quasi la metà degli occupati totali della provincia." },
      { q: "Perché le aziende di Lecco faticano ad assumere nonostante il calo occupazionale?", a: "Oltre il 53% delle 24.020 assunzioni programmate nel 2025 risultano difficili da coprire per scarsità di candidati e disallineamento tra le competenze richieste e quelle disponibili sul territorio." },
      { q: "Che ruolo ha il Politecnico di Milano nell'economia lecchese?", a: "Il polo territoriale di Lecco del Politecnico di Milano, attivo dal 1989, forma ingegneri con un legame stretto con le aziende del territorio, contribuendo a mantenere competenze tecniche avanzate nonostante il calo occupazionale nell'industria tradizionale." },
      { q: "Il turismo outdoor a Lecco è un settore emergente?", a: "Sì: la posizione tra il lago di Como e le Prealpi orobiche rende Lecco un punto di riferimento per alpinismo ed escursionismo, con una domanda crescente di personale per ricettività, guide e servizi legati allo sport all'aria aperta, anche se resta un mercato più piccolo rispetto ai settori industriali." },
      { q: "Perché a Lecco è così difficile per le aziende trovare personale?", a: "Il disallineamento tra competenze richieste (spesso tecniche e specialistiche) e quelle disponibili sul mercato locale, unito al calo del tasso di attività, spinge molte imprese a competere su formazione interna e percorsi di apprendistato per assicurarsi personale qualificato." },
    ],
    sources: [
      { label: "Giornale di Lecco — 16° Rapporto sul mercato del lavoro", url: "https://giornaledilecco.it/economia/presentato-il-16-rapporto-sul-mercato-del-lavoro-lecco-a-due-velocita/" },
      { label: "Centri per l'impiego Provincia di Lecco — Osservatorio", url: "https://www.lavoro.provincia.lecco.it/osservatorio-mercato-del-lavoro/report-annuale/" },
      { label: "Politecnico di Milano — Polo territoriale di Lecco", url: "https://www.polimi.it/il-politecnico/governance/strutture/campuses/lecco" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "lodi",
    name: "Lodi",
    province: "Provincia di Lodi",
    intro:
      "Lodi è uno dei mercati del lavoro più solidi della Lombardia: agribusiness e logistica trainano un'occupazione in crescita e un tasso di disoccupazione tra i più bassi della regione.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "2,0%, secondo valore più basso in Lombardia dopo Bergamo",
    sectors: [
      { name: "Agroalimentare e agribusiness", note: "uno dei settori più resilienti del territorio, con forte vocazione produttiva e di trasformazione" },
      { name: "Logistica", note: "settore favorevole alle assunzioni per posizione geografica strategica vicino a Milano" },
      { name: "Meccanica", note: "settore dinamico con crescita attesa del 2,2% annuo" },
      { name: "Ricerca e formazione veterinaria", note: "sede dal 2018 della Facoltà di Medicina Veterinaria dell'Università degli Studi di Milano, con un campus dedicato e un ospedale veterinario universitario" },
      { name: "Servizi alle imprese e terziario", note: "in espansione grazie alla vicinanza a Milano, con una crescente domanda di ruoli amministrativi e di back-office" },
    ],
    advice: [
      "Per la logistica lodigiana contano precisione operativa, flessibilità sui turni e dimestichezza con strumenti digitali di gestione magazzino: meglio indicare nel CV esperienze concrete con sistemi WMS o gestionali specifici piuttosto che descrizioni generiche di 'esperienza in magazzino'.",
      "Chi vive a Lodi e lavora a Milano può indicare nel CV la disponibilità al pendolarismo giornaliero, un fattore che a Lodi non penalizza le candidature come altrove: la rete ferroviaria rende il capoluogo lombardo raggiungibile in tempi rapidi, e molte aziende locali lo considerano normale.",
    ],
    faq: [
      { q: "Qual è il tasso di disoccupazione a Lodi?", a: "Il tasso di disoccupazione a Lodi è sceso al 2,0% nel 2025, il secondo valore più basso della Lombardia dopo Bergamo (1,3%), con un tasso di occupazione al 66,7%." },
      { q: "Perché Lodi è un buon mercato per la logistica?", a: "Grazie alla posizione strategica vicino a Milano e ai principali assi autostradali, la provincia di Lodi ospita numerosi poli logistici che assumono con regolarità, soprattutto per ruoli operativi e di gestione magazzino." },
      { q: "L'agroalimentare a Lodi è in crescita?", a: "Sì, l'agribusiness resta tra i settori più resilienti del territorio lodigiano, insieme alla meccanica che nel 2026 mostra una crescita attesa del 2,2% annuo." },
      { q: "Lodi ha un polo universitario rilevante?", a: "Sì: dal 2018 Lodi ospita la Facoltà di Medicina Veterinaria dell'Università degli Studi di Milano, con un campus dedicato e un ospedale veterinario universitario, che genera occupazione qualificata in ricerca, docenza e servizi collegati." },
      { q: "Conviene vivere a Lodi e lavorare a Milano?", a: "È una scelta comune: la vicinanza ferroviaria a Milano rende Lodi un'alternativa abitativa più economica per chi lavora nel capoluogo, mentre l'economia locale resta comunque solida grazie ad agribusiness e logistica." },
      { q: "Che competenze cercano le aziende logistiche lodigiane?", a: "Precisione operativa, conoscenza di sistemi di gestione magazzino (WMS), disponibilità sui turni e, per i ruoli di coordinamento, esperienza pregressa in ambito supply chain: le competenze digitali di gestione dei flussi sono sempre più richieste anche nei ruoli operativi." },
    ],
    sources: [
      { label: "Osservatorio del mercato del lavoro della Provincia di Lodi", url: "https://cloud-ita.municipiumapp.it/s3/20287/allegati/report_osservatorio_annuale-2025_definitivo-1.pdf" },
      { label: "LM Servizi — Lodi, la spinta dell'agribusiness", url: "https://lmservizi.it/news/lodi-la-spinta-dellagribusiness/" },
      { label: "Università degli Studi di Milano — Facoltà di Medicina Veterinaria, campus di Lodi", url: "https://www.unimi.it/it/ateneo/organizzazione-e-strutture/facolta/medicina-veterinaria" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "mantova",
    name: "Mantova",
    province: "Provincia di Mantova",
    intro:
      "Mantova poggia su due filiere solide, meccanica e agroalimentare, ma affronta un mercato del lavoro segnato da una forte precarietà contrattuale: la maggior parte delle nuove assunzioni resta a termine.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "occupazione in rallentamento, con crescita concentrata nei contratti flessibili",
    sectors: [
      { name: "Industria manifatturiera e meccanica", note: "settore principale con il 35,5% degli addetti totali della provincia" },
      { name: "Filiera agroalimentare", note: "seconda colonna dell'economia mantovana, con poli di specializzazione a Viadana e Ostiglia" },
      { name: "Moda", note: "presente come terza specializzazione nei distretti di Viadana e Ostiglia, insieme a meccanica e agroalimentare" },
      { name: "Energia e servizi ambientali", note: "presenza di Tea S.p.A., multiutility mantovana attiva su acqua, rifiuti, energia e biometano, con investimenti industriali in crescita" },
      { name: "Turismo culturale", note: "sostenuto dal patrimonio storico-artistico della città, patrimonio UNESCO, con una domanda di personale in ricettività ed eventi ancora contenuta ma in crescita" },
    ],
    advice: [
      "A Mantova, dove l'83% dei nuovi avviamenti utilizza forme contrattuali flessibili, conviene costruire un CV che dimostri continuità di competenze anche attraverso esperienze brevi o a termine: mettere in evidenza risultati concreti in ogni singola esperienza, anche corta, aiuta a distinguersi in un mercato dove la stabilità contrattuale non è la norma.",
      "Per i settori più stabili come l'energia e i servizi ambientali, le aziende mantovane valutano positivamente percorsi con certificazioni tecniche specifiche; per chi si muove nell'agroalimentare o nella meccanica con contratti brevi, aiuta indicare nel CV con precisione le competenze acquisite in ogni esperienza, anche se di pochi mesi, per dimostrare continuità di crescita professionale.",
    ],
    faq: [
      { q: "Qual è il settore che offre più lavoro a Mantova?", a: "L'industria manifatturiera e meccanica è il settore dominante, con il 35,5% degli addetti totali, seguita dalla filiera agroalimentare." },
      { q: "Il lavoro a Mantova è stabile?", a: "Non del tutto: l'83% delle nuove forme contrattuali attivate nella provincia sono di tipo flessibile (tempo determinato, somministrazione), un dato che riflette una precarietà diffusa nonostante la tenuta occupazionale complessiva." },
      { q: "Cosa rende unico il mercato del lavoro mantovano?", a: "La compresenza di poli a tripla specializzazione come Viadana e Ostiglia, capaci di generare occupazione contemporaneamente in meccanica, moda e agroalimentare." },
      { q: "Mantova ha aziende energetiche di rilievo?", a: "Sì: Tea S.p.A., multiutility con sede a Mantova, gestisce servizi idrici, ambientali ed energetici e ha in corso investimenti industriali significativi, tra cui impianti di biometano, generando occupazione stabile nel settore." },
      { q: "Perché a Mantova la maggior parte dei contratti è a termine?", a: "L'83% dei nuovi avviamenti è a tempo flessibile, un dato che riflette sia la stagionalità di alcune filiere agroalimentari sia una tendenza più ampia delle imprese del territorio a testare i candidati prima di stabilizzarli: costruire un CV che dimostri affidabilità nelle esperienze brevi aiuta a favorire la conferma." },
      { q: "Il turismo a Mantova può diventare un settore trainante?", a: "Il patrimonio UNESCO della città (il centro storico e Sabbioneta) offre margini di crescita per ricettività ed eventi culturali, ma resta oggi un settore più piccolo rispetto a meccanica e agroalimentare, con occupazione ancora in fase di sviluppo." },
    ],
    sources: [
      { label: "Provincia di Mantova — Andamento mercato del lavoro 2025", url: "https://www.provincia.mantova.it/cs_context.jsp?ID_LINK=41&area=37&id_context=23726&COL0003=1&COL0003=2" },
      { label: "Gazzetta di Mantova — Occupati in aumento ma con contratti precari", url: "https://www.gazzettadimantova.it/argomenti/economia/economia-mantovana/mantova-provincia-occupati-contratti-precari-pesa-l-invecchiamento-1.13048713" },
      { label: "Gazzetta di Mantova — Tea, piano industriale da 276 milioni", url: "https://www.gazzettadimantova.it/territorio-mantovano/mantova-dalle-reti-idriche-alle-energie-alternative-per-tea-un-piano-industriale-da-276-milioni-1.11968053" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "monza-e-brianza",
    name: "Monza e Brianza",
    province: "Provincia di Monza e della Brianza",
    intro:
      "La Brianza è storicamente il distretto del legno-arredo e del design italiano, oggi in una fase di trasformazione strutturale: moda, arredo e automotive sono in flessione mentre il territorio cerca nuovi equilibri produttivi.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "mercato ancora attivo ma attraversato da fragilità settoriali",
    sectors: [
      { name: "Design e arredo", note: "settore storico del territorio, in flessione del 3,6% nell'ultimo periodo rilevato" },
      { name: "Moda", note: "in calo del 7,1%, tra i settori più colpiti dal rallentamento" },
      { name: "Automotive", note: "in flessione del 6,4%, coerente con la trasformazione del settore a livello nazionale" },
      { name: "Elettronica e manifattura diffusa", note: "resta un pilastro del tessuto produttivo, con un fatturato provinciale complessivo di 69,8 miliardi di euro" },
      { name: "Distretto del mobile e arredo", note: "la Brianza è la prima provincia italiana per numero di aziende del mobile, con circa 1.325 imprese e oltre 9.800 addetti concentrati soprattutto a Lissone e Meda" },
      { name: "Motorsport ed eventi", note: "l'Autodromo Nazionale di Monza, sede storica del Gran Premio d'Italia di Formula 1, genera un indotto di eventi, ospitalità e servizi legati al motorsport" },
    ],
    advice: [
      "In un territorio dove il design-arredo tradizionale rallenta, il CV più efficace è quello che affianca alla competenza di prodotto (materiali, lavorazione, progettazione) abilità digitali e di adattamento a settori affini: le aziende brianzole segnalano crescente difficoltà nel reperire personale qualificato, quindi la chiarezza delle competenze tecniche nel CV pesa più della sola esperienza settoriale.",
      "Nel distretto del mobile, un CV per ruoli di progettazione trae vantaggio da un portfolio allegato con progetti reali, mentre per i ruoli tecnici o commerciali del settore conviene restare su un formato sobrio: le aziende brianzole, spesso di dimensioni familiari, apprezzano la chiarezza più dell'originalità grafica.",
    ],
    faq: [
      { q: "Il settore del design-arredo in Brianza è ancora forte?", a: "Resta un pilastro identitario del territorio, ma il periodo più recente mostra una flessione del 3,6%, in un contesto di trasformazione strutturale che coinvolge anche moda (-7,1%) e automotive (-6,4%)." },
      { q: "Qual è il peso economico complessivo di Monza e Brianza?", a: "La provincia genera un fatturato complessivo di 69,8 miliardi di euro, ma le aziende segnalano un allarme crescente sulla difficoltà di reperire personale qualificato." },
      { q: "Che competenze cercano le aziende della Brianza oggi?", a: "Oltre alle competenze tecniche tradizionali di design e lavorazione, cresce la richiesta di competenze digitali e di flessibilità verso settori affini, in un mercato in fase di trasformazione strutturale." },
      { q: "La Brianza è davvero il primo distretto del mobile in Italia?", a: "Sì: Monza e Brianza è la provincia italiana con il maggior numero di aziende del mobile, circa 1.325, per quasi 9.900 addetti, davanti a Como e Lecco nello stesso comparto." },
      { q: "L'Autodromo di Monza genera occupazione stabile?", a: "Genera soprattutto occupazione legata a eventi, ospitalità e organizzazione durante il Gran Premio e le altre manifestazioni motoristiche annuali: è un indotto significativo ma più stagionale e concentrato rispetto ai settori industriali storici del territorio." },
      { q: "Conviene puntare su un CV creativo per il settore design-arredo brianzolo?", a: "Dipende dal ruolo: per posizioni di progettazione e design un portfolio visivo è quasi sempre richiesto insieme al CV, mentre per ruoli tecnici di produzione o vendita le aziende continuano a privilegiare un CV chiaro e sintetico, con competenze ed esperienze in primo piano." },
    ],
    sources: [
      { label: "Giornale di Monza — Il mercato del lavoro: sfide e trasformazioni", url: "https://giornaledimonza.it/economia/il-mercato-del-lavoro-sfide-e-trasformazioni-nel-2025/" },
      { label: "Il Giornale delle PMI — Monza Brianza, fatturato a 69,8 miliardi", url: "https://www.giornaledellepmi.it/monza-e-brianza-fatturato-a-698-miliardi-ma-cresce-lallarme-personale-qualificato/" },
      { label: "Forbes Italia — Monza-Brianza, Lecco e Como: il triangolo lombardo del mobile", url: "https://forbes.it/2025/01/28/alla-scoperta-triangolo-lombardo-mobile" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "pavia",
    name: "Pavia",
    province: "Provincia di Pavia",
    intro:
      "Pavia unisce una delle università più antiche d'Italia a un tessuto industriale specializzato in farmaceutica, chimica e agroalimentare: un mercato del lavoro che premia le competenze scientifiche e tecniche.",
    avgRal: "€18.000–28.000 per posizioni operative nel chimico-farmaceutico, superiore per profili specializzati",
    unemploymentNote: "in linea con i valori medio-bassi della Lombardia",
    sectors: [
      { name: "Farmaceutico e chimico", note: "settore storico del territorio, con stipendi però cresciuti poco nell'ultimo decennio (+0,6%)" },
      { name: "Agroalimentare", note: "filiera consolidata legata alla vocazione agricola della Lomellina e del pavese" },
      { name: "Ricerca e formazione universitaria", note: "l'Università di Pavia, tra le più antiche d'Italia, alimenta un ecosistema di ricerca e occupazione qualificata" },
      { name: "Sanità e ricerca clinica", note: "presenza di IRCCS di rilievo nazionale come il Policlinico San Matteo, che affianca all'assistenza ospedaliera un'intensa attività di ricerca biomedica in collaborazione con l'Università di Pavia" },
      { name: "Risicoltura e trasformazione agricola", note: "la Lomellina resta una delle principali aree risicole d'Italia, con un indotto di trasformazione e commercializzazione del riso" },
    ],
    advice: [
      "Per il settore chimico-farmaceutico pavese, un CV efficace deve indicare con precisione le certificazioni di laboratorio, la normativa GMP se pertinente e l'esperienza specifica di controllo qualità: è un mercato tecnico dove la genericità penalizza molto più che altrove.",
      "Chi punta alla ricerca clinica o farmaceutica pavese può valorizzare nel CV collaborazioni universitarie, pubblicazioni o tirocini svolti in laboratorio, elementi che spesso pesano più della sola laurea; per i ruoli operativi in produzione, invece, contano soprattutto le certificazioni tecniche e l'esperienza diretta su linee o impianti.",
    ],
    faq: [
      { q: "Il farmaceutico a Pavia paga bene?", a: "Le posizioni operative nel chimico-farmaceutico pavese partono da circa €18.000-28.000 lordi annui, ma le retribuzioni di settore sono cresciute molto poco nell'ultimo decennio (+0,6%), a fronte di un settore comunque tra i più remunerativi a livello nazionale per i profili specializzati." },
      { q: "L'Università di Pavia influenza il mercato del lavoro locale?", a: "Sì: essendo una delle università più antiche d'Italia, alimenta un ecosistema di ricerca, spin-off e occupazione qualificata che si intreccia con l'industria farmaceutica e chimica del territorio." },
      { q: "Quali altri settori sono forti a Pavia oltre al farmaceutico?", a: "L'agroalimentare resta una filiera consolidata, in particolare nella zona della Lomellina, storicamente vocata alla risicoltura e alla trasformazione agricola." },
      { q: "La sanità è un settore rilevante per l'occupazione a Pavia?", a: "Sì: il Policlinico San Matteo, IRCCS di rilievo nazionale, unisce assistenza ospedaliera e ricerca biomedica in stretta collaborazione con l'Università di Pavia, generando occupazione qualificata sia clinica sia di ricerca." },
      { q: "La Lomellina offre lavoro nell'agricoltura oltre al farmaceutico pavese?", a: "Sì: la Lomellina è una delle principali aree risicole d'Italia, con un indotto che va dalla coltivazione alla trasformazione e commercializzazione del riso, un settore diverso ma altrettanto radicato nell'economia della provincia." },
      { q: "Conviene un dottorato o master per lavorare nel farmaceutico pavese?", a: "Per i ruoli di ricerca e sviluppo spesso sì, è richiesto un percorso post-laurea; per i ruoli operativi di produzione e controllo qualità contano di più le certificazioni specifiche (GMP, laboratorio) e l'esperienza pratica, anche senza titoli avanzati." },
    ],
    sources: [
      { label: "Jooble — Offerte chimico a Pavia", url: "https://it.jooble.org/lavoro-chimico/Pavia-(PV)" },
      { label: "TgCom24 — Mappa degli stipendi per settore", url: "https://www.tgcom24.mediaset.it/skuola/dimmi_115021232-202602k.shtml" },
      { label: "Fondazione IRCCS Policlinico San Matteo — Pavia", url: "https://it.wikipedia.org/wiki/Fondazione_IRCCS_Policlinico_San_Matteo" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "sondrio",
    name: "Sondrio",
    province: "Provincia di Sondrio — Valtellina",
    intro:
      "Sondrio e la Valtellina vivono un momento eccezionale: l'economia montana, trainata da turismo e agroalimentare d'eccellenza, si prepara alle Olimpiadi invernali Milano-Cortina 2026, con migliaia di assunzioni stagionali previste.",
    avgRal: "in linea con la media lombarda (€35.137)",
    unemploymentNote: "mercato in forte espansione, con carenza di personale che sfiora il 46%",
    sectors: [
      { name: "Turismo montano", note: "settore trainante, con il distretto di Bormio che concentra oltre il 32% del flusso contrattuale provinciale" },
      { name: "Agroalimentare d'eccellenza", note: "bresaola e vini a denominazione con export complessivo della provincia sopra 1,1 miliardi di euro" },
      { name: "Eventi e ospitalità olimpica", note: "7.050 assunzioni previste nel trimestre giugno-agosto 2026 in vista delle Olimpiadi invernali Milano-Cortina" },
      { name: "Servizi finanziari", note: "sede storica di Banca Popolare di Sondrio, tra i principali istituti di credito indipendenti d'Italia, con un peso rilevante nell'occupazione terziaria locale" },
      { name: "Edilizia e infrastrutture olimpiche", note: "i cantieri collegati alle Olimpiadi invernali Milano-Cortina 2026 hanno sostenuto la domanda di manodopera edile e infrastrutturale negli ultimi anni" },
    ],
    advice: [
      "In un mercato dove quasi la metà delle assunzioni è difficile da coprire, un CV che dichiari chiaramente disponibilità stagionale, flessibilità sui turni e competenze linguistiche (fondamentali per il turismo internazionale legato alle Olimpiadi) ha un vantaggio immediato rispetto alla concorrenza.",
      "Chi cerca lavoro in vista o durante il periodo olimpico dovrebbe specificare nel CV la disponibilità a contratti stagionali o a termine, spesso il punto di ingresso più rapido nel mercato valtellinese: molte aziende del turismo e degli eventi convertono poi in stabile una parte del personale stagionale che dimostra affidabilità durante la stagione.",
    ],
    faq: [
      { q: "Le Olimpiadi 2026 stanno creando lavoro a Sondrio?", a: "Sì: le imprese della provincia prevedono 7.050 assunzioni nel trimestre giugno-agosto 2026, in crescita di 510 unità rispetto allo stesso periodo del 2025, con il turismo montano come motore principale." },
      { q: "Perché le aziende valtellinesi faticano a trovare personale?", a: "La difficoltà di reperimento del personale sfiora il 46% nel territorio, un dato molto alto che riflette lo squilibrio tra la forte domanda stagionale di turismo e agroalimentare e l'offerta di manodopera locale disponibile." },
      { q: "L'agroalimentare valtellinese è un settore rilevante?", a: "Sì: le filiere certificate come la bresaola e i vini a denominazione hanno un export complessivo che supera 1,1 miliardi di euro, rendendo l'agroalimentare un pilastro economico al pari del turismo." },
      { q: "Sondrio ha un settore finanziario rilevante?", a: "Sì: la provincia ospita la sede storica di Banca Popolare di Sondrio, uno dei principali istituti di credito indipendenti d'Italia, che rappresenta un datore di lavoro importante nel terziario locale accanto al turismo e all'agroalimentare." },
      { q: "Cosa succede al mercato del lavoro valtellinese dopo le Olimpiadi 2026?", a: "Molte delle assunzioni legate a eventi ed edilizia infrastrutturale sono temporanee e legate alla stagione olimpica: il territorio punta a consolidare l'indotto turistico generato dall'esposizione internazionale per mantenere parte dell'occupazione anche negli anni successivi." },
      { q: "Che lingue conviene indicare nel CV per lavorare nel turismo valtellinese?", a: "Inglese e tedesco sono le lingue più richieste per il turismo internazionale legato alle Olimpiadi e alla clientela centroeuropea storicamente presente in Valtellina; anche una conoscenza di base del francese può essere un vantaggio nei ruoli di ospitalità di fascia alta." },
    ],
    sources: [
      { label: "Il Giorno — Il mercato del lavoro a Sondrio, traina il turismo", url: "https://www.ilgiorno.it/sondrio/cronaca/sondrio-mercato-lavoro-rapporto-previsioni-industria-r3j6vfwp" },
      { label: "Sbircia la Notizia — Valtellina, agroalimentare record", url: "https://www.sbircialanotizia.it/articoli/2026/04/28/agrovaltellina-m8q4z/" },
      { label: "Wikipedia — Banca Popolare di Sondrio", url: "https://en.wikipedia.org/wiki/Banca_Popolare_di_Sondrio" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "varese",
    name: "Varese",
    province: "Provincia di Varese",
    intro:
      "Varese è un polo industriale di eccellenza per aerospazio e meccanica di precisione, con leader mondiali del settore e un comparto life sciences in forte crescita: tra i mercati del lavoro più remunerativi della Lombardia per i profili ingegneristici.",
    avgRal: "€36.000–43.800 per ingegneri, oltre €100.000 per profili senior in ambito aerospaziale",
    unemploymentNote: "in linea con i valori medio-bassi della Lombardia",
    sectors: [
      { name: "Aerospaziale e meccanica di precisione", note: "presenza di leader mondiali del settore, con domanda costante di ingegneri, tecnici specializzati e operai di precisione" },
      { name: "Life sciences e farmaceutico", note: "settore in forte crescita, cerca profili di ricerca scientifica, controllo qualità e produzione chimica" },
      { name: "Chimica industriale", note: "ingegneri chimici e meccanici con retribuzioni tra €30.000 e €60.000 annui" },
      { name: "Elicotteristica e difesa", note: "Leonardo gestisce a Vergiate e Cascina Costa i principali stabilimenti elicotteristici del gruppo, con circa 7.800 addetti complessivi tra le sedi lombarde di elicotteri, velivoli, spazio ed elettronica" },
      { name: "Manifattura diffusa e meccanica generale", note: "fitta rete di PMI subfornitrici per i settori aerospaziale, chimico e meccanico, storicamente legate ai grandi player del territorio" },
    ],
    advice: [
      "Per candidarti nell'aerospaziale varesino il CV deve mettere in primo piano certificazioni tecniche riconosciute a livello internazionale (es. normative aeronautiche, controllo qualità) e, per i ruoli ingegneristici, risultati misurabili su progetti specifici: è uno dei settori più selettivi della Lombardia e premia la precisione tecnica del profilo.",
      "Per candidarsi negli stabilimenti Leonardo o nel loro indotto, un CV che documenti percorsi ITS o tecnici specifici del settore aeronautico, anche senza esperienza diretta, ha più possibilità rispetto a un profilo generalista: le aziende della filiera aerospaziale varesina investono molto in formazione interna per chi dimostra le basi tecniche giuste.",
    ],
    faq: [
      { q: "Quanto guadagna un ingegnere a Varese?", a: "Un ingegnere aerospaziale o informatico a Varese può guadagnare tra €36.000 e €43.800 lordi annui nei primi anni di carriera, con i profili senior nell'aerospaziale che possono superare i €100.000." },
      { q: "Perché Varese è un polo per l'aerospaziale?", a: "Il territorio ospita leader mondiali del settore aerospaziale e della meccanica di precisione, che generano una domanda costante e strutturale di ingegneri e tecnici specializzati, rendendo Varese uno dei poli aerospaziali più rilevanti d'Italia." },
      { q: "Il settore life sciences a Varese è in crescita?", a: "Sì, il comparto life sciences e farmaceutico varesino è indicato come uno dei settori in maggiore crescita, con richiesta di profili di ricerca scientifica, controllo qualità e produzione chimica." },
      { q: "Quanti posti di lavoro genera Leonardo a Varese?", a: "Gli stabilimenti Leonardo di Vergiate e Cascina Costa sono i principali siti di assemblaggio elicotteri del gruppo; complessivamente Leonardo impiega circa 7.800 addetti nelle sue sedi lombarde tra elicotteri, velivoli, spazio, elettronica e cybersecurity." },
      { q: "Come si entra nel settore aerospaziale a Varese senza esperienza pregressa?", a: "I percorsi più comuni sono stage e apprendistati tecnici collegati a ITS e istituti tecnici del territorio, seguiti da certificazioni specifiche di settore (normative aeronautiche, controllo qualità): un CV che documenti anche solo una formazione tecnica di base può comunque essere preso in considerazione per ruoli junior." },
      { q: "Il settore chimico-farmaceutico varesino è in crescita?", a: "Sì, insieme all'aerospaziale è tra i comparti più solidi del territorio, con una domanda costante di ingegneri chimici, tecnici di laboratorio e profili di controllo qualità, anche se resta più piccolo rispetto al polo aerospaziale." },
    ],
    sources: [
      { label: "Calcolo Stipendio Ingegnere 2026", url: "https://calcolostipendionettoonline.it/stipendio-ingegnere/" },
      { label: "Mondo Uomo — I lavori che pagano davvero in Italia", url: "https://www.mondouomo.it/business-e-lavoro/i-lavori-che-pagano-davvero-in-italia-la-mappa-del-2025-2026/" },
      { label: "Lombardia Notizie — Leonardo Elicotteri, gioielli tecnologici prodotti in Lombardia", url: "https://www.lombardianotizie.online/leonardo-elicotteri/" },
    ],
    updated: "2026-08-28",
  },
];

export function getCityProfile(slug: string): CityProfile | undefined {
  return CITY_PROFILES.find((c) => c.slug === slug);
}

// All 12 Lombardy capoluoghi now have researched, sourced profiles.
// Extend this file (and CITY_PROFILES above) before adding any further
// province — never publish a profile without real, citable data.
export const PLANNED_CITIES: string[] = [];
