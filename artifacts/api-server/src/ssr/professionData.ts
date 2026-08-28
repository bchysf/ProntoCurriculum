// Structured data backing the "CV per professione" pSEO spokes. Each entry
// is deliberately paired with the one city/region whose economic profile
// (see lombardiaData.ts) already documents real demand for that role —
// e.g. tecnico CNC only pairs with Brescia, where the steel/metalworking
// district data lives. This avoids a generic profession×city matrix where
// only the entity name changes between pages.

export interface ProfessionProfile {
  slug: string; // full path segment after /lavoro/lombardia(/:city)
  citySlug: string | null; // null = regional page, not under a city
  profession: string;
  locationLabel: string; // "Lombardia" or the city name, for copy
  intro: string;
  demandFact: string; // the real shortage/demand stat that justifies this page existing
  salaryRange: string;
  salaryNote: string;
  keySkills: string[];
  cvAdvice: string;
  mistakes: string;
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
  updated: string;
}

export const PROFESSION_PROFILES: ProfessionProfile[] = [
  {
    slug: "cv-infermiere",
    citySlug: null,
    profession: "Infermiere",
    locationLabel: "Lombardia",
    intro:
      "La Lombardia ha una carenza strutturale di infermieri stimata in circa 3.000 unità: per chi ha il titolo, è uno dei mercati del lavoro sanitari più favorevoli d'Italia, ma la selezione tra pubblico e privato segue logiche diverse che il CV deve intercettare.",
    demandFact: "carenza stimata di circa 3.000 infermieri in Lombardia (Regione Lombardia, 2026)",
    salaryRange: "€1.550–2.000+ netti/mese nel pubblico (SSN), €1.300–1.450 netti/mese nel privato",
    salaryNote: "CCNL Sanità firmato il 27 ottobre 2025; RAL pubblica tabellare €22.549, complessiva €27.000–29.000 con indennità",
    keySkills: ["Specializzazioni (terapia intensiva, emergenza-urgenza)", "Turnistica e reperibilità", "Software di cartella clinica informatizzata", "BLSD/ACLS e certificazioni obbligatorie"],
    cvAdvice:
      "Nel pubblico il CV serve soprattutto per l'iscrizione alle graduatorie e i titoli contano in modo quasi automatico: specializzazioni, punteggio di laurea e anzianità vanno elencati in modo preciso e verificabile. Nel privato (RSA, cliniche, cooperative) pesa di più la disponibilità a turni e reperibilità, da dichiarare esplicitamente.",
    mistakes:
      "L'errore più comune è omettere le certificazioni con data di scadenza (BLSD, ACLS): molte strutture le richiedono valide, non solo conseguite in passato.",
    faq: [
      { q: "Quanto guadagna un infermiere in Lombardia nel 2026?", a: "Un infermiere neoassunto nel pubblico (SSN) parte da circa €1.550 netti al mese con il nuovo CCNL Sanità firmato il 27 ottobre 2025; con specializzazioni in terapia intensiva o emergenza-urgenza si superano facilmente i €2.000 netti. Nel privato lo stipendio di partenza è più basso, tra €1.300 e €1.450 netti." },
      { q: "È vero che in Lombardia mancano infermieri?", a: "Sì, la Regione Lombardia ha avviato un piano specifico perché la carenza è stimata in circa 3.000 infermieri, tra le più alte d'Italia in valore assoluto." },
      { q: "Cosa deve avere il CV di un infermiere per candidarsi in Lombardia?", a: "Specializzazioni con data, certificazioni obbligatorie (BLSD/ACLS) in corso di validità, esperienza di reparto specifica e, per il pubblico, punteggio di laurea e titoli valutabili in graduatoria elencati con precisione." },
    ],
    sources: [
      { label: "Nurse24 — Infermieri introvabili in Lombardia", url: "https://www.nurse24.it/infermiere/attualita-infermieri/infermieri-introvabili-lombardia-piano-regionale.html" },
      { label: "Randstad — Stipendio infermieri 2026", url: "https://www.randstad.it/come-trovare-lavoro/stipendio-infermieri-costo-della-vita-italia-2026/" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-sviluppatore-software",
    citySlug: "milano",
    profession: "Sviluppatore Software",
    locationLabel: "Milano",
    intro:
      "Milano è il principale mercato tech della Lombardia, ma le aziende faticano a coprire i profili IT: sviluppatori, project manager IT e specialisti e-commerce sono tra le figure più difficili da reperire in città.",
    demandFact: "Milano registra 29.840 competenze introvabili su 64.320 posizioni aperte (46,4%), con sviluppatori e project manager IT tra le figure più richieste",
    salaryRange: "€23.775–30.350 RAL junior, €33.974 media, fino a €47.423 senior",
    salaryNote: "dati Milano, Lombardia; media nazionale sviluppatore €32.011, senior developer €43.075",
    keySkills: ["Linguaggi e framework specifici (non generico 'programmazione')", "Repository pubblici (GitHub/GitLab) linkati", "Metodologie Agile/Scrum", "Cloud (AWS/Azure/GCP) se pertinente"],
    cvAdvice:
      "Nel tech milanese lo screening iniziale è spesso automatico: elenca stack tecnologico preciso (linguaggio, framework, versione se rilevante) invece di descrizioni generiche come 'ottima conoscenza informatica'. Un link a portfolio o repository pubblico vale più di un paragrafo di autopresentazione.",
    mistakes:
      "Elencare troppe tecnologie 'toccate una volta' diluisce il segnale: meglio 4-5 competenze reali e verificabili che una lista di 20 buzzword.",
    faq: [
      { q: "Quanto guadagna uno sviluppatore software a Milano nel 2026?", a: "La RAL media a Milano è di circa €33.974, con un junior tra €23.775 e €30.350 e un senior developer che può superare i €47.000, leggermente sopra la media nazionale." },
      { q: "È difficile trovare sviluppatori a Milano?", a: "Sì: Milano ha 29.840 competenze introvabili su 64.320 posizioni aperte (46,4%), con i profili IT — sviluppatori, project manager IT, specialisti e-commerce — tra i più difficili da reperire per le aziende." },
      { q: "Cosa deve contenere il CV di uno sviluppatore per superare lo screening ATS?", a: "Stack tecnologico specifico e verificabile, link a repository pubblici, esperienza descritta con risultati misurabili (es. tempi di deploy ridotti, performance migliorate) e parole chiave coerenti con l'annuncio a cui ci si candida." },
    ],
    sources: [
      { label: "MilanoToday — 30mila profili introvabili", url: "https://www.milanotoday.it/economia/offerte-lavoro-milano-profili-agosto-2026.html" },
      { label: "Indeed — Stipendio sviluppatore software Milano", url: "https://it.indeed.com/career/sviluppatore-software/salaries/Milano--Lombardia" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-tecnico-cnc",
    citySlug: "brescia",
    profession: "Tecnico CNC e Saldatore",
    locationLabel: "Brescia",
    intro:
      "Nel distretto siderurgico e metalmeccanico bresciano la domanda di tecnici di produzione, saldatori e operatori CNC è costante: le retribuzioni di settore sono cresciute del 5,2% tra 2024 e 2025, un segnale di forte competizione tra le aziende per questi profili.",
    demandFact: "retribuzioni del settore siderurgico e metallurgico cresciute del 5,2% tra 2024 e 2025 (crescita salariale tra le più alte dell'industria lombarda)",
    salaryRange: "da circa €23.238 RAL per un operatore metalmeccanico, di più con patentini e specializzazioni",
    salaryNote: "media Italia per operatore metalmeccanico; i profili con certificazioni di saldatura specifiche partono più in alto",
    keySkills: ["Patentini macchina e certificazioni di saldatura", "Lettura disegno tecnico", "Programmazione CNC (FANUC, Siemens, Heidenhain)", "Normative di sicurezza industriale"],
    cvAdvice:
      "In un distretto tecnico come quello bresciano, il CV deve elencare le certificazioni di saldatura per nome esatto (es. patentino EN 287, WPS specifiche) e le marche di macchine CNC utilizzate: sono i dettagli che le aziende metalmeccaniche cercano per primi, molto prima di leggere l'esperienza generale.",
    mistakes:
      "Scrivere solo 'esperienza in officina meccanica' senza specificare macchine, certificazioni o tipo di lavorazione è il modo più rapido per essere scartati in un settore così tecnico.",
    faq: [
      { q: "Gli stipendi nel metalmeccanico bresciano stanno davvero crescendo?", a: "Sì, tra il 2024 e il 2025 le retribuzioni nel settore siderurgico e metallurgico sono cresciute del 5,2%, una delle crescite salariali più marcate nell'industria lombarda, segno di una forte competizione tra aziende per attrarre tecnici qualificati." },
      { q: "Quali certificazioni servono per lavorare come saldatore o tecnico CNC a Brescia?", a: "Patentini di saldatura specifici (es. certificazione EN 287 per tipo di materiale e procedimento) e la conoscenza pratica dei controlli numerici più diffusi nel distretto (FANUC, Siemens, Heidenhain) sono i requisiti più richiesti." },
      { q: "Conviene indicare le macchine usate nel CV per questi ruoli?", a: "Sì, è uno degli elementi più determinanti: le aziende metalmeccaniche bresciane selezionano spesso per marca e modello di macchina, non solo per anni di esperienza generica." },
    ],
    sources: [
      { label: "Jooble — Stipendio operaio metalmeccanico Brescia", url: "https://it.jooble.org/salary/operaio-metalmeccanico/Brescia" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-magazziniere",
    citySlug: "lodi",
    profession: "Magazziniere e Addetto Logistica",
    locationLabel: "Lodi",
    intro:
      "La provincia di Lodi, snodo logistico strategico vicino a Milano, ha uno dei mercati del lavoro più solidi della Lombardia: la logistica resta un settore favorevole alle assunzioni, con stipendi regolati dal CCNL Trasporti e Logistica.",
    demandFact: "Lodi ha il secondo tasso di disoccupazione più basso della Lombardia (2,0%), sostenuto anche dai poli logistici del territorio",
    salaryRange: "RAL €22.000–27.000, netto mensile da €1.350 (junior) a oltre €1.700–1.800 (esperti con coordinamento)",
    salaryNote: "CCNL Trasporti e Logistica 2026; minimi tabellari mensili lordi da €1.771 a €2.589 secondo livello",
    keySkills: ["Patentino carrello elevatore", "Sistemi WMS (Warehouse Management System)", "Lettura documenti di trasporto (DDT)", "Disponibilità turni e flessibilità oraria"],
    cvAdvice:
      "Per la logistica lodigiana un CV efficace indica con precisione il tipo di patentino carrello posseduto (con scadenza), il sistema gestionale/WMS usato in precedenza e la disponibilità sui turni: le aziende del polo logistico selezionano velocemente su questi tre elementi, prima ancora del colloquio.",
    mistakes:
      "Non indicare la scadenza del patentino carrello elevatore costringe il selezionatore a chiederlo separatamente, un attrito che spesso fa perdere priorità nella selezione rispetto a candidati più chiari.",
    faq: [
      { q: "Quanto guadagna un magazziniere a Lodi nel 2026?", a: "Lo stipendio netto mensile va da circa €1.350 per un profilo junior a oltre €1.700-1.800 per un magazziniere esperto con responsabilità di coordinamento, secondo il CCNL Trasporti e Logistica in vigore dal 2026." },
      { q: "Perché Lodi è un buon territorio per lavorare in logistica?", a: "Per la posizione strategica vicino a Milano e ai principali assi autostradali: la provincia ospita diversi poli logistici e ha un tasso di disoccupazione tra i più bassi della Lombardia (2,0%)." },
      { q: "Cosa deve avere il CV di un magazziniere per essere selezionato più in fretta?", a: "Tipo e scadenza del patentino carrello elevatore, il nome del sistema WMS/gestionale usato in esperienze precedenti e la disponibilità esplicita sui turni: sono le informazioni che i selezionatori del settore cercano per primi." },
    ],
    sources: [
      { label: "Portale Lavoro — Quanto guadagna un addetto logistica nel 2026", url: "https://www.portalelavoro.org/quanto-guadagna-un-addetto-logistica-nel-2026" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-farmacista",
    citySlug: "pavia",
    profession: "Farmacista",
    locationLabel: "Pavia",
    intro:
      "A livello nazionale i farmacisti sono tra i profili con il maggior calo di candidature (-71%), e Pavia — con la sua tradizione farmaceutica e universitaria — è uno dei territori dove questa carenza si fa sentire di più.",
    demandFact: "-71% di candidature per il ruolo di farmacista a livello nazionale, tra i cali più marcati di tutte le professioni monitorate",
    salaryRange: "€26.000–36.000 RAL in farmacia territoriale, da €28.564 a oltre €38.000 RAL tabellare in farmacia ospedaliera",
    salaryNote: "farmacia ospedaliera: indennità di esclusività aggiuntiva di circa €8.000 al primo scaglione; CCNL Dirigenza Sanitaria",
    keySkills: ["Abilitazione ed eventuale specializzazione ospedaliera", "Software di gestione farmacia", "Galenica (se richiesta dalla farmacia territoriale)", "Normativa farmaceutica aggiornata"],
    cvAdvice:
      "Per la farmacia territoriale il CV deve indicare eventuali competenze di galenica e gestionali (software di farmacia, magazzino), mentre per l'ospedaliera contano l'iscrizione all'albo, la specializzazione e l'inquadramento come dirigente sanitario fin dall'assunzione: sono due mercati distinti che richiedono un CV tarato diversamente.",
    mistakes:
      "Candidarsi con lo stesso CV generico sia in farmacia territoriale sia in ambito ospedaliero è inefficace: i due contesti valutano competenze ed esperienze molto diverse tra loro.",
    faq: [
      { q: "Perché mancano farmacisti in Italia nel 2026?", a: "Il ruolo di farmacista registra un calo del 71% delle candidature rispetto alla domanda delle aziende, uno dei cali più marcati tra tutte le professioni monitorate, complice anche l'invecchiamento della popolazione e la crescente domanda di servizi in farmacia." },
      { q: "Quanto guadagna un farmacista a Pavia?", a: "In farmacia territoriale privata la RAL realistica è tra €26.000 e €36.000; in farmacia ospedaliera lo stipendio tabellare parte da circa €28.564-38.000 RAL, con l'indennità di esclusività che può aggiungere circa €8.000 per chi opta per il rapporto esclusivo con il SSN." },
      { q: "Il CV per farmacia territoriale e ospedaliera è uguale?", a: "No: la farmacia territoriale valuta soprattutto competenze gestionali e di galenica, mentre quella ospedaliera richiede l'iscrizione all'albo e valuta il profilo come dirigente sanitario fin dall'assunzione secondo il CCNL Dirigenza Sanitaria." },
    ],
    sources: [
      { label: "Torino Cronaca — Le figure più introvabili in Italia", url: "https://www.torinocronaca.it/news/tendenze/684326/lavoro-e-caccia-ai-professionisti-ecco-le-figure-piu-introvabili-in-italia.html" },
      { label: "Indeed — Quanto guadagna un farmacista ospedaliero", url: "https://it.indeed.com/guida-alla-carriera/retribuzione-stipendio/quanto-guadagna-farmacista-ospedaliero" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-ingegnere-meccanico",
    citySlug: "varese",
    profession: "Ingegnere Meccanico",
    locationLabel: "Varese",
    intro:
      "Varese, polo mondiale dell'aerospaziale e della meccanica di precisione, è anche uno dei territori dove il gap tra domanda e offerta di ingegneri meccanici è più ampio: -70% di candidature rispetto alle posizioni aperte a livello nazionale.",
    demandFact: "-70% di candidature per il ruolo di ingegnere meccanico a livello nazionale, tra i profili tecnici più difficili da reperire",
    salaryRange: "€30.000–60.000 RAL, oltre €100.000 per profili senior in ambito aerospaziale",
    salaryNote: "range ampio in base a specializzazione (aerospaziale, automotive, generalista) e seniority",
    keySkills: ["Software CAD/CAM (SolidWorks, CATIA, NX)", "Normative aeronautiche/di settore (se aerospaziale)", "Gestione progetto e tolleranze di produzione", "Controllo qualità e certificazioni di processo"],
    cvAdvice:
      "Nell'aerospaziale varesino le aziende cercano evidenze tecniche precise: software CAD/CAM usati, norme di settore conosciute (es. certificazioni aeronautiche), e risultati quantificabili su progetti specifici (riduzione tempi, tolleranze raggiunte). Un CV generico da 'ingegnere meccanico' senza questi dettagli si perde nella massa di candidature per un ruolo così iperspecializzato.",
    mistakes:
      "Non distinguere tra esperienza aerospaziale, automotive e industriale generica nel CV è un errore: le aziende del settore aerospaziale di Varese cercano competenze specifiche del comparto, non genericamente 'meccaniche'.",
    faq: [
      { q: "Perché è difficile trovare ingegneri meccanici in Italia?", a: "Il ruolo registra un calo del 70% delle candidature rispetto alla domanda delle aziende, uno dei gap più ampi tra le figure tecniche monitorate, particolarmente sentito in poli industriali specializzati come Varese." },
      { q: "Quanto guadagna un ingegnere meccanico a Varese?", a: "La RAL varia tra €30.000 e €60.000 in base a specializzazione ed esperienza, con i profili senior in ambito aerospaziale che possono superare i €100.000 annui, grazie alla presenza di leader mondiali del settore sul territorio." },
      { q: "Cosa deve avere il CV di un ingegnere meccanico per il settore aerospaziale?", a: "Software CAD/CAM specifici, conoscenza delle normative aeronautiche di settore, ed esempi di progetti con risultati misurabili (tolleranze raggiunte, tempi ridotti): la genericità è il principale motivo di scarto in un settore così tecnico." },
    ],
    sources: [
      { label: "Torino Cronaca — Le figure più introvabili in Italia", url: "https://www.torinocronaca.it/news/tendenze/684326/lavoro-e-caccia-ai-professionisti-ecco-le-figure-piu-introvabili-in-italia.html" },
      { label: "Calcolo Stipendio Ingegnere 2026", url: "https://calcolostipendionettoonline.it/stipendio-ingegnere/" },
    ],
    updated: "2026-08-28",
  },
  {
    slug: "cv-cameriere-stagionale",
    citySlug: "sondrio",
    profession: "Cameriere e Personale di Sala Stagionale",
    locationLabel: "Sondrio",
    intro:
      "Con le Olimpiadi invernali Milano-Cortina 2026 e l'alta stagione turistica, la Valtellina prevede migliaia di assunzioni stagionali nel turismo: quasi la metà di queste posizioni resta però difficile da coprire per mancanza di candidati disponibili.",
    demandFact: "7.050 assunzioni stagionali previste nel trimestre giugno-agosto 2026 in Valtellina, con difficoltà di reperimento personale al 46%",
    salaryRange: "€1.200–1.600 netti/mese per personale di sala, €1.400–2.500 per cuochi/chef in base all'esperienza",
    salaryNote: "dati nazionali per il settore turismo-ristorazione; la stagione olimpica può offrire premi e vitto/alloggio aggiuntivi",
    keySkills: ["Lingue straniere (inglese indispensabile, tedesco/francese un vantaggio per il turismo internazionale)", "Disponibilità stagionale e sui turni weekend/festivi", "Esperienza di sala o cucina anche breve", "Flessibilità di alloggio in zona montana"],
    cvAdvice:
      "Per il lavoro stagionale in Valtellina, soprattutto nell'anno olimpico, dichiarare esplicitamente la disponibilità di periodo (date precise), la conoscenza di lingue straniere e la disponibilità a un eventuale alloggio in loco velocizza moltissimo la selezione: le strutture assumono spesso in tempi molto stretti prima dell'alta stagione.",
    mistakes:
      "Inviare un CV senza indicare le date di disponibilità è il motivo più comune di scarto per le posizioni stagionali: le strutture devono coprire periodi precisi e selezionano prima chi lo rende chiaro fin dal CV.",
    faq: [
      { q: "Le Olimpiadi 2026 stanno creando davvero lavoro stagionale in Valtellina?", a: "Sì: sono previste 7.050 assunzioni nel trimestre giugno-agosto 2026, in crescita rispetto al 2025, con il turismo montano e l'evento olimpico come motori principali della domanda." },
      { q: "Quanto si guadagna come cameriere stagionale in Valtellina?", a: "Il personale di sala guadagna tipicamente tra €1.200 e €1.600 netti al mese, mentre cuochi e chef con esperienza possono arrivare tra €1.400 e €2.500, spesso con vitto e alloggio inclusi nelle strutture montane." },
      { q: "Perché conviene indicare le date di disponibilità nel CV per un lavoro stagionale?", a: "Perché le strutture ricettive devono coprire periodi molto precisi (alta stagione, evento olimpico) e con una difficoltà di reperimento personale che sfiora il 46%, selezionano più rapidamente i candidati che dichiarano subito la propria disponibilità esatta." },
    ],
    sources: [
      { label: "Il Giorno — Il mercato del lavoro a Sondrio", url: "https://www.ilgiorno.it/sondrio/cronaca/sondrio-mercato-lavoro-rapporto-previsioni-industria-r3j6vfwp" },
    ],
    updated: "2026-08-28",
  },
];

export function getProfessionProfile(citySlugOrNull: string | null, slug: string): ProfessionProfile | undefined {
  return PROFESSION_PROFILES.find((p) => p.citySlug === citySlugOrNull && p.slug === slug);
}
