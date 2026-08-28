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
  cvAdvice: string[];
  mistakes: string[];
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
    keySkills: [
      "Specializzazioni (terapia intensiva, emergenza-urgenza, oncologia, pediatria)",
      "Turnistica e reperibilità",
      "Software di cartella clinica informatizzata",
      "BLSD/ACLS/PALS e certificazioni obbligatorie in corso di validità",
      "Iscrizione OPI (Ordine delle Professioni Infermieristiche)",
      "Gestione accessi vascolari (PICC, CVC) e triage",
      "Crediti ECM recenti e pertinenti al reparto target",
    ],
    cvAdvice: [
      "Nel pubblico il CV serve soprattutto per l'iscrizione alle graduatorie e i titoli contano in modo quasi automatico: specializzazioni, punteggio di laurea e anzianità vanno elencati in modo preciso e verificabile, con date esatte di conseguimento.",
      "Nel privato (RSA, cliniche, cooperative) pesa di più la disponibilità a turni e reperibilità, da dichiarare esplicitamente, insieme a competenze pratiche immediatamente spendibili (gestione accessi vascolari, wound care, terapia del dolore).",
      "Crea una sezione dedicata 'Licenze e certificazioni' separata dalla formazione accademica: indica per ciascuna l'ente erogatore (es. American Heart Association per ACLS) e la data di scadenza, non solo quella di conseguimento.",
      "Cita 2-3 corsi ECM recenti e coerenti con il reparto a cui ti candidi (es. corso di triage per il Pronto Soccorso, gestione ventilazione per la Terapia Intensiva): dimostra aggiornamento continuo, un requisito di fatto per la professione.",
      "Se punti al concorso pubblico, verifica il bando prima di scrivere il CV: punteggio di laurea, master e pubblicazioni vanno riportati nel formato richiesto dalla griglia di valutazione, non in prosa libera.",
    ],
    mistakes: [
      "Omettere le certificazioni con data di scadenza (BLSD, ACLS): molte strutture le richiedono valide, non solo conseguite in passato.",
      "Scrivere 'esperienza infermieristica generale' senza indicare il reparto (medicina, chirurgia, terapia intensiva, RSA): ogni reparto richiede competenze diverse e il selezionatore le cerca per nome.",
      "Dimenticare di indicare l'iscrizione all'OPI e il numero, spesso richiesto già in fase di prima selezione per verificare l'abilitazione.",
      "Usare lo stesso CV per pubblico e privato: il primo valuta soprattutto titoli e punteggi oggettivi, il secondo la disponibilità operativa immediata e le soft skill di reparto.",
    ],
    faq: [
      { q: "Quanto guadagna un infermiere in Lombardia nel 2026?", a: "Un infermiere neoassunto nel pubblico (SSN) parte da circa €1.550 netti al mese con il nuovo CCNL Sanità firmato il 27 ottobre 2025; con specializzazioni in terapia intensiva o emergenza-urgenza si superano facilmente i €2.000 netti. Nel privato lo stipendio di partenza è più basso, tra €1.300 e €1.450 netti." },
      { q: "È vero che in Lombardia mancano infermieri?", a: "Sì, la Regione Lombardia ha avviato un piano specifico perché la carenza è stimata in circa 3.000 infermieri, tra le più alte d'Italia in valore assoluto." },
      { q: "Cosa deve avere il CV di un infermiere per candidarsi in Lombardia?", a: "Specializzazioni con data, certificazioni obbligatorie (BLSD/ACLS) in corso di validità, esperienza di reparto specifica e, per il pubblico, punteggio di laurea e titoli valutabili in graduatoria elencati con precisione." },
      { q: "Quali certificazioni infermieristiche fanno davvero la differenza in Lombardia?", a: "Oltre a BLSD e ACLS, sono molto valutate le certificazioni di gestione accessi vascolari (PICC/CVC), triage e le specializzazioni post-base in area critica: sono competenze che riducono i tempi di formazione interna e per questo pesano nella selezione, sia pubblica sia privata." },
      { q: "Come si passa dal privato al pubblico (o viceversa) come infermiere?", a: "Il passaggio è comune: dal privato conviene documentare con precisione mansioni e reparti (utile per il punteggio titoli nei concorsi), mentre dal pubblico al privato conta di più mostrare flessibilità su turni e reperibilità, spesso richieste in modo più intenso nelle strutture private." },
      { q: "Conviene specializzarsi per lavorare in Lombardia?", a: "Sì: con una carenza stimata di circa 3.000 infermieri concentrata soprattutto nelle aree critiche (terapia intensiva, emergenza-urgenza), le specializzazioni post-base restano il modo più diretto per accedere a inquadramenti e stipendi più alti fin dall'assunzione." },
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
    keySkills: [
      "Linguaggi e framework specifici (non generico 'programmazione')",
      "Repository pubblici (GitHub/GitLab) linkati",
      "Metodologie Agile/Scrum",
      "Cloud (AWS/Azure/GCP) se pertinente",
      "CI/CD e containerizzazione (Docker, Kubernetes)",
      "Testing automatizzato (unit, integration)",
      "Certificazioni cloud (AWS Certified, Azure Fundamentals) se possedute",
    ],
    cvAdvice: [
      "Nel tech milanese lo screening iniziale è spesso automatico: elenca stack tecnologico preciso (linguaggio, framework, versione se rilevante) invece di descrizioni generiche come 'ottima conoscenza informatica'.",
      "Un link a portfolio o repository pubblico (GitHub/GitLab) con commit recenti e leggibili vale più di un paragrafo di autopresentazione: molti recruiter tech lo controllano prima ancora del CV.",
      "Descrivi i progetti passati con risultati misurabili, non solo attività svolte: 'ridotto il tempo di build del 40%' o 'ridisegnato l'API per gestire 3x il traffico' colpisce molto più di 'sviluppo backend'.",
      "Se hai certificazioni cloud (AWS, Azure, GCP) o esami su piattaforme come freeCodeCamp/Coursera pertinenti, inseriscile in una sezione dedicata: nello screening ATS milanese sono spesso parole chiave filtranti.",
      "Per chi arriva da un percorso non tradizionale (bootcamp, autodidatta), un portfolio con 2-3 progetti completi e ben documentati pesa più della formazione stessa in un mercato che assume soprattutto su competenze dimostrabili.",
    ],
    mistakes: [
      "Elencare troppe tecnologie 'toccate una volta' diluisce il segnale: meglio 4-5 competenze reali e verificabili che una lista di 20 buzzword.",
      "Non linkare repository o portfolio: in un mercato con 29.840 competenze introvabili su Milano, le aziende vogliono verificare il codice, non solo leggerne la descrizione.",
      "Scrivere esperienze senza numeri o impatto misurabile (performance, tempi, scalabilità): un CV tecnico che non quantifica i risultati fatica a superare lo screening.",
      "Ignorare le parole chiave dell'annuncio: molti ATS scartano automaticamente CV che non contengono gli stessi termini tecnici (linguaggio, framework, metodologia) usati nella job description.",
    ],
    faq: [
      { q: "Quanto guadagna uno sviluppatore software a Milano nel 2026?", a: "La RAL media a Milano è di circa €33.974, con un junior tra €23.775 e €30.350 e un senior developer che può superare i €47.000, leggermente sopra la media nazionale." },
      { q: "È difficile trovare sviluppatori a Milano?", a: "Sì: Milano ha 29.840 competenze introvabili su 64.320 posizioni aperte (46,4%), con i profili IT — sviluppatori, project manager IT, specialisti e-commerce — tra i più difficili da reperire per le aziende." },
      { q: "Cosa deve contenere il CV di uno sviluppatore per superare lo screening ATS?", a: "Stack tecnologico specifico e verificabile, link a repository pubblici, esperienza descritta con risultati misurabili (es. tempi di deploy ridotti, performance migliorate) e parole chiave coerenti con l'annuncio a cui ci si candida." },
      { q: "Come si entra nel settore tech a Milano senza esperienza diretta?", a: "Un portfolio con progetti personali completi (anche piccoli ma ben documentati e su repository pubblico), eventuali contributi open source e certificazioni cloud sono spesso più determinanti di un titolo di studio specifico: molte aziende milanesi assumono junior soprattutto su competenze dimostrabili." },
      { q: "Quali certificazioni tech contano di più per uno sviluppatore a Milano?", a: "Le certificazioni cloud (AWS Certified Solutions Architect, Azure Fundamentals, Google Cloud) sono tra le più riconosciute, seguite da eventuali certificazioni specifiche di framework o metodologie Agile/Scrum se il ruolo prevede coordinamento di team." },
      { q: "Conviene indicare progetti personali o freelance nel CV?", a: "Sì, soprattutto se pubblici e verificabili: nel tech lo screening valuta il codice reale più della descrizione, quindi un progetto personale ben fatto e documentato può contare quanto un'esperienza lavorativa breve." },
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
    keySkills: [
      "Patentino di saldatura UNI EN ISO 9606 (per materiale e procedimento)",
      "Lettura disegno tecnico e tolleranze dimensionali",
      "Programmazione e conduzione CNC (FANUC, Siemens, Heidenhain)",
      "Normative di sicurezza industriale (D.Lgs 81/08)",
      "Metrologia e strumenti di controllo qualità (calibro, micrometro, CMM)",
      "Lettura e rispetto delle WPS (Welding Procedure Specification)",
    ],
    cvAdvice: [
      "In un distretto tecnico come quello bresciano, il CV deve elencare le certificazioni di saldatura per nome esatto: lo standard di riferimento attuale è la UNI EN ISO 9606 (che ha sostituito la vecchia EN 287), specificando materiale, procedimento e data di scadenza (validità 2-3 anni a seconda della sezione della norma).",
      "Indica le marche e i modelli di macchine CNC utilizzate (FANUC, Siemens, Heidenhain): sono i dettagli che le aziende metalmeccaniche cercano per primi, molto prima di leggere l'esperienza generale.",
      "Specifica il tipo di lavorazione (tornitura, fresatura, saldatura MIG/MAG/TIG) e i materiali lavorati (acciaio, alluminio, leghe speciali): un CV generico da 'operaio metalmeccanico' non comunica il livello reale di specializzazione.",
      "Se possiedi certificazioni di controllo qualità o metrologia (uso di calibri, micrometri, macchine di misura a coordinate CMM), menzionale: nei distretti industriali più maturi come Brescia sono un differenziale sempre più richiesto.",
    ],
    mistakes: [
      "Scrivere solo 'esperienza in officina meccanica' senza specificare macchine, certificazioni o tipo di lavorazione è il modo più rapido per essere scartati in un settore così tecnico.",
      "Indicare un patentino di saldatura scaduto o senza data: la certificazione UNI EN ISO 9606 ha validità limitata (2-3 anni) e le aziende la richiedono in corso di validità, non solo come titolo conseguito in passato.",
      "Confondere o omettere il procedimento di saldatura (MIG, MAG, TIG, ad arco) e il materiale: la stessa persona può essere qualificata per un procedimento e non per un altro, e il selezionatore lo verifica sempre.",
      "Non menzionare la conoscenza delle norme di sicurezza (D.Lgs 81/08): in un ambiente industriale è spesso un requisito di ammissibilità, non solo un plus.",
    ],
    faq: [
      { q: "Gli stipendi nel metalmeccanico bresciano stanno davvero crescendo?", a: "Sì, tra il 2024 e il 2025 le retribuzioni nel settore siderurgico e metallurgico sono cresciute del 5,2%, una delle crescite salariali più marcate nell'industria lombarda, segno di una forte competizione tra aziende per attrarre tecnici qualificati." },
      { q: "Quali certificazioni servono per lavorare come saldatore o tecnico CNC a Brescia?", a: "Il patentino di saldatura secondo la norma UNI EN ISO 9606 (specifico per materiale e procedimento) e la conoscenza pratica dei controlli numerici più diffusi nel distretto (FANUC, Siemens, Heidenhain) sono i requisiti più richiesti." },
      { q: "Conviene indicare le macchine usate nel CV per questi ruoli?", a: "Sì, è uno degli elementi più determinanti: le aziende metalmeccaniche bresciane selezionano spesso per marca e modello di macchina, non solo per anni di esperienza generica." },
      { q: "Quanto dura il patentino di saldatura e come si rinnova?", a: "La certificazione secondo UNI EN ISO 9606-1 (acciai) ha validità 3 anni, mentre per le altre sezioni della norma (alluminio, nichel, rame) la validità è di 2 anni; va rinnovata con una nuova prova pratica presso un ente certificatore prima della scadenza, altrimenti il patentino decade." },
      { q: "Si può diventare tecnico CNC senza un percorso tecnico tradizionale?", a: "Sì, è comune l'ingresso tramite corsi professionali o percorsi ITS dedicati a meccanica e automazione: nel distretto bresciano, molte aziende valutano più la certificazione pratica e la conoscenza di specifiche macchine che il titolo di studio formale." },
      { q: "Conviene specializzarsi su più procedimenti di saldatura o su uno solo?", a: "Dipende dal tipo di azienda: nelle realtà più strutturate conviene una specializzazione profonda (es. solo TIG su acciaio inox), mentre nelle officine più piccole è spesso richiesta versatilità su più procedimenti e materiali." },
    ],
    sources: [
      { label: "Jooble — Stipendio operaio metalmeccanico Brescia", url: "https://it.jooble.org/salary/operaio-metalmeccanico/Brescia" },
      { label: "Bureau Veritas — Patentino saldatore UNI EN ISO 9606", url: "https://www.bureauveritas.it/servizi/formazione/formazione-tecnica/formazione-ambito-saldatura/patentino-saldatore-secondo-uni-9606" },
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
    keySkills: [
      "Patentino carrello elevatore (D.Lgs 81/08, validità quinquennale)",
      "Sistemi WMS (Warehouse Management System)",
      "Lettura documenti di trasporto (DDT) e picking list",
      "Disponibilità turni e flessibilità oraria",
      "Tecniche di picking e inventario (a voce, con scanner, RF)",
      "Nozioni di base di sicurezza in magazzino e movimentazione merci",
    ],
    cvAdvice: [
      "Per la logistica lodigiana un CV efficace indica con precisione il tipo di patentino carrello posseduto (frontale, retrattile, laterale) e la sua scadenza: l'abilitazione va rinnovata ogni 5 anni secondo l'Accordo Stato-Regioni, e un patentino scaduto blocca l'assunzione immediata.",
      "Cita il nome del sistema gestionale/WMS usato in esperienze precedenti (es. SAP WM, Zucchetti, gestionali proprietari): le aziende del polo logistico lo considerano un indicatore diretto di operatività, non solo di esperienza generica.",
      "Dichiara esplicitamente la disponibilità sui turni (mattina/pomeriggio/notte, weekend) fin dal CV: nella logistica la selezione è spesso guidata prima di tutto dalla copertura turni, più che dal profilo in astratto.",
      "Se hai esperienza con tecnologie di picking (scanner RF, voice picking) o controllo qualità in ingresso/uscita merce, specificalo: sono competenze pratiche che riducono i tempi di formazione interna e vengono valutate positivamente.",
    ],
    mistakes: [
      "Non indicare la scadenza del patentino carrello elevatore costringe il selezionatore a chiederlo separatamente, un attrito che spesso fa perdere priorità nella selezione rispetto a candidati più chiari.",
      "Ometter il tipo di carrello elevatore abilitato (frontale, retrattile, laterale): non tutte le abilitazioni coprono tutti i tipi di mezzo, e specificarlo evita scarti per mancata corrispondenza.",
      "Non dichiarare la disponibilità sui turni notturni o nei weekend se effettivamente disponibili: nella logistica è spesso il primo filtro di selezione, prima ancora delle competenze tecniche.",
      "Scrivere 'esperienza in magazzino' senza indicare il tipo di attività (picking, carico/scarico, gestione inventario, controllo qualità): il ruolo di magazziniere copre mansioni molto diverse tra loro.",
    ],
    faq: [
      { q: "Quanto guadagna un magazziniere a Lodi nel 2026?", a: "Lo stipendio netto mensile va da circa €1.350 per un profilo junior a oltre €1.700-1.800 per un magazziniere esperto con responsabilità di coordinamento, secondo il CCNL Trasporti e Logistica in vigore dal 2026." },
      { q: "Perché Lodi è un buon territorio per lavorare in logistica?", a: "Per la posizione strategica vicino a Milano e ai principali assi autostradali: la provincia ospita diversi poli logistici e ha un tasso di disoccupazione tra i più bassi della Lombardia (2,0%)." },
      { q: "Cosa deve avere il CV di un magazziniere per essere selezionato più in fretta?", a: "Tipo e scadenza del patentino carrello elevatore, il nome del sistema WMS/gestionale usato in esperienze precedenti e la disponibilità esplicita sui turni: sono le informazioni che i selezionatori del settore cercano per primi." },
      { q: "Quanto dura il patentino carrello elevatore e come si rinnova?", a: "L'abilitazione ha validità quinquennale secondo l'Accordo Stato-Regioni del 2012: allo scadere va rinnovata con un corso di aggiornamento di 4 ore (1 teorica e 3 pratiche) presso un ente formativo autorizzato." },
      { q: "Si può lavorare in magazzino senza patentino carrello elevatore?", a: "Sì, per mansioni di picking manuale, controllo merci o gestione ordini che non prevedono la guida di mezzi; il patentino diventa indispensabile solo per ruoli che includono la movimentazione con carrello elevatore, molto richiesti nei poli logistici come Lodi." },
      { q: "Come si passa da magazziniere a un ruolo di coordinamento?", a: "L'esperienza pratica su più mansioni (picking, gestione inventario, uso di WMS) unita alla conoscenza approfondita del sistema gestionale usato in azienda è il percorso più comune verso ruoli di team leader o responsabile di turno nei magazzini logistici." },
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
    keySkills: [
      "Abilitazione all'esercizio della professione ed eventuale specializzazione in Farmacia Ospedaliera",
      "Iscrizione all'Ordine dei Farmacisti provinciale",
      "Software di gestione farmacia e magazzino",
      "Galenica (preparazioni magistrali e officinali, se richiesta dalla farmacia territoriale)",
      "Normativa farmaceutica aggiornata e farmacovigilanza",
      "Crediti ECM recenti e pertinenti (utile citarne alcuni specifici)",
    ],
    cvAdvice: [
      "Per la farmacia territoriale il CV deve indicare eventuali competenze di galenica (preparazioni magistrali) e gestionali (software di farmacia, gestione magazzino e scorte), oltre a esperienza diretta con il pubblico e consulenza al banco.",
      "Per l'ospedaliera contano l'iscrizione all'albo, la Scuola di Specializzazione in Farmacia Ospedaliera (percorso di 4 anni) e l'inquadramento come dirigente sanitario fin dall'assunzione secondo il CCNL Dirigenza Sanitaria: vanno riportati con precisione nel CV, in linea con la griglia di valutazione del concorso.",
      "Cita esperienze di farmacovigilanza o collaborazione con reparti clinici se presenti: nella farmacia ospedaliera sono competenze distintive rispetto al profilo di farmacista territoriale.",
      "Indica alcuni corsi ECM recenti e pertinenti al contesto in cui ti candidi (es. gestione del rischio clinico per l'ospedaliera, dermocosmesi o nutraceutica per la territoriale): dimostrano aggiornamento continuo, elemento sempre più valutato.",
    ],
    mistakes: [
      "Candidarsi con lo stesso CV generico sia in farmacia territoriale sia in ambito ospedaliero è inefficace: i due contesti valutano competenze ed esperienze molto diverse tra loro.",
      "Non specificare se si possiede la Specializzazione in Farmacia Ospedaliera quando ci si candida per ruoli ospedalieri: è spesso un requisito di ammissibilità al concorso, non solo un titolo preferenziale.",
      "Omettere l'iscrizione all'Ordine dei Farmacisti e il numero: è un dato che molte strutture verificano già in fase di prima selezione.",
      "Non menzionare competenze di galenica quando si punta alla farmacia territoriale: è una delle attività che distingue un farmacista operativo da uno puramente gestionale/di banco.",
    ],
    faq: [
      { q: "Perché mancano farmacisti in Italia nel 2026?", a: "Il ruolo di farmacista registra un calo del 71% delle candidature rispetto alla domanda delle aziende, uno dei cali più marcati tra tutte le professioni monitorate, complice anche l'invecchiamento della popolazione e la crescente domanda di servizi in farmacia." },
      { q: "Quanto guadagna un farmacista a Pavia?", a: "In farmacia territoriale privata la RAL realistica è tra €26.000 e €36.000; in farmacia ospedaliera lo stipendio tabellare parte da circa €28.564-38.000 RAL, con l'indennità di esclusività che può aggiungere circa €8.000 per chi opta per il rapporto esclusivo con il SSN." },
      { q: "Il CV per farmacia territoriale e ospedaliera è uguale?", a: "No: la farmacia territoriale valuta soprattutto competenze gestionali e di galenica, mentre quella ospedaliera richiede l'iscrizione all'albo e valuta il profilo come dirigente sanitario fin dall'assunzione secondo il CCNL Dirigenza Sanitaria." },
      { q: "Serve la specializzazione per lavorare in farmacia ospedaliera?", a: "Sì, di norma i concorsi pubblici per farmacista ospedaliero richiedono la Scuola di Specializzazione in Farmacia Ospedaliera, un percorso post-laurea di 4 anni: è un requisito che va indicato con chiarezza nel CV insieme alla data di conseguimento." },
      { q: "Come si diventa titolari o si fa carriera in farmacia territoriale?", a: "Il percorso più comune parte da collaboratore/dipendente in farmacia territoriale, con crescita verso ruoli di responsabilità (direttore di farmacia) o, tramite concorso per titoli, verso la titolarità; l'esperienza di galenica e gestione magazzino/scorte è spesso valorizzata in questo passaggio." },
      { q: "Quali competenze aggiuntive aiutano un farmacista a distinguersi?", a: "Corsi ECM specifici (dermocosmesi, nutraceutica, farmacovigilanza), esperienza con software gestionali di farmacia e, per l'ambito ospedaliero, collaborazioni dirette con reparti clinici sono tra gli elementi che i selezionatori valutano oltre al titolo di base." },
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
    keySkills: [
      "Software CAD/CAM (SolidWorks, CATIA, NX, Siemens NX)",
      "Normative aeronautiche/di settore (es. AS9100, EASA Part 21, se aerospaziale)",
      "Gestione progetto e tolleranze di produzione",
      "Controllo qualità e certificazioni di processo",
      "Analisi FEM/simulazione strutturale",
      "Inglese tecnico (indispensabile in ambito aerospaziale internazionale)",
      "Iscrizione all'Albo degli Ingegneri (se richiesta per ruoli con responsabilità di firma)",
    ],
    cvAdvice: [
      "Nell'aerospaziale varesino le aziende cercano evidenze tecniche precise: software CAD/CAM usati (con versione), norme di settore conosciute (es. AS9100 per la qualità aerospaziale, EASA per la certificazione), e risultati quantificabili su progetti specifici (riduzione tempi, tolleranze raggiunte, costi ridotti).",
      "Un CV generico da 'ingegnere meccanico' senza questi dettagli si perde nella massa di candidature per un ruolo così iperspecializzato: distingui chiaramente se l'esperienza è in ambito aerospaziale, automotive o industriale generico.",
      "Se hai competenze di simulazione strutturale (analisi FEM) o esperienza con strumenti di controllo qualità di processo, evidenziale in una sezione a parte: nel comparto aerospaziale sono spesso richieste come competenze trasversali al ruolo di progettazione pura.",
      "L'inglese tecnico va dichiarato con un livello verificabile (es. B2/C1): nelle aziende aerospaziali varesine, spesso parte di gruppi multinazionali, è un requisito quasi sempre presente negli annunci, anche per ruoli non commerciali.",
    ],
    mistakes: [
      "Non distinguere tra esperienza aerospaziale, automotive e industriale generica nel CV è un errore: le aziende del settore aerospaziale di Varese cercano competenze specifiche del comparto, non genericamente 'meccaniche'.",
      "Ometter la versione del software CAD/CAM usato o il tipo di progetti seguiti (es. solo disegno vs. anche simulazione/validazione): il livello di dettaglio tecnico è ciò che distingue un CV credibile da uno generico in questo settore.",
      "Non menzionare il livello di inglese tecnico: in un settore fortemente internazionalizzato come l'aerospaziale, la sua assenza nel CV è spesso letta come un'incompletezza, non come un dato scontato.",
      "Descrivere l'esperienza per mansioni ('disegno tecnico', 'progettazione') invece che per risultati (tolleranze raggiunte, tempi di sviluppo ridotti, difettosità ridotta): in un ruolo tecnico-ingegneristico i numeri pesano più delle descrizioni.",
    ],
    faq: [
      { q: "Perché è difficile trovare ingegneri meccanici in Italia?", a: "Il ruolo registra un calo del 70% delle candidature rispetto alla domanda delle aziende, uno dei gap più ampi tra le figure tecniche monitorate, particolarmente sentito in poli industriali specializzati come Varese." },
      { q: "Quanto guadagna un ingegnere meccanico a Varese?", a: "La RAL varia tra €30.000 e €60.000 in base a specializzazione ed esperienza, con i profili senior in ambito aerospaziale che possono superare i €100.000 annui, grazie alla presenza di leader mondiali del settore sul territorio." },
      { q: "Cosa deve avere il CV di un ingegnere meccanico per il settore aerospaziale?", a: "Software CAD/CAM specifici, conoscenza delle normative aeronautiche di settore (es. AS9100, EASA), ed esempi di progetti con risultati misurabili (tolleranze raggiunte, tempi ridotti): la genericità è il principale motivo di scarto in un settore così tecnico." },
      { q: "Serve l'iscrizione all'Albo degli Ingegneri per lavorare nell'aerospaziale a Varese?", a: "Dipende dal ruolo: per posizioni di progettazione e sviluppo non è sempre obbligatoria, ma diventa necessaria per ruoli con responsabilità di firma tecnica su documentazione ufficiale o per esercitare la libera professione; molte aziende la richiedono comunque come titolo preferenziale." },
      { q: "Come ci si specializza in ambito aerospaziale partendo da una laurea generalista in ingegneria meccanica?", a: "Master di secondo livello in ingegneria aerospaziale, esperienza pratica su progetti con normative di settore (AS9100, EASA) e la padronanza di strumenti di simulazione (FEM) sono il percorso più diretto: molte aziende varesine assumono anche generalisti motivati, purché dimostrino di aver iniziato a costruire competenze specifiche del comparto." },
      { q: "Conviene puntare su automotive o aerospaziale a Varese?", a: "Varese è un polo storicamente più forte nell'aerospaziale e nella meccanica di precisione di alta gamma, con salari senior più alti in questo comparto; l'automotive resta comunque presente, ma con una domanda meno concentrata territorialmente rispetto all'aerospaziale." },
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
    keySkills: [
      "Lingue straniere (inglese indispensabile, tedesco/francese un vantaggio per il turismo internazionale)",
      "Disponibilità stagionale e sui turni weekend/festivi",
      "Esperienza di sala o cucina anche breve",
      "Flessibilità di alloggio in zona montana",
      "Attestato HACCP (obbligatorio per chi manipola alimenti)",
      "Conoscenza base di vini e abbinamenti (per il servizio di sala)",
    ],
    cvAdvice: [
      "Per il lavoro stagionale in Valtellina, soprattutto nell'anno olimpico, dichiarare esplicitamente la disponibilità di periodo (date precise di inizio e fine) velocizza moltissimo la selezione: le strutture assumono spesso in tempi molto stretti prima dell'alta stagione e scartano candidature vaghe.",
      "Indica il livello di conoscenza delle lingue straniere in modo concreto (es. inglese B2, tedesco base): con il turismo internazionale legato alle Olimpiadi, è spesso il primo requisito verificato in colloquio.",
      "Se possiedi l'attestato HACCP, citalo esplicitamente: è un requisito di legge per chi manipola alimenti e la sua assenza può escludere dalla selezione anche candidati con buona esperienza.",
      "Specifica la disponibilità o meno all'alloggio in loco: molte strutture montane offrono vitto e alloggio ma vogliono saperlo subito, non scoprirlo al colloquio, per organizzare la copertura del personale.",
    ],
    mistakes: [
      "Inviare un CV senza indicare le date di disponibilità è il motivo più comune di scarto per le posizioni stagionali: le strutture devono coprire periodi precisi e selezionano prima chi lo rende chiaro fin dal CV.",
      "Non menzionare il livello di lingua straniera o darlo per scontato: con l'affluenza internazionale legata alle Olimpiadi, è un'informazione che i selezionatori cercano esplicitamente, non solo un plus generico.",
      "Omettere l'attestato HACCP se posseduto (o non specificare la disponibilità a conseguirlo): per ruoli a contatto con gli alimenti è spesso un requisito, non un optional.",
      "Non indicare la disponibilità all'alloggio in zona montana: le strutture che lo offrono selezionano più rapidamente chi lo dichiara subito, evitando trattative dell'ultimo minuto prima dell'inizio stagione.",
    ],
    faq: [
      { q: "Le Olimpiadi 2026 stanno creando davvero lavoro stagionale in Valtellina?", a: "Sì: sono previste 7.050 assunzioni nel trimestre giugno-agosto 2026, in crescita rispetto al 2025, con il turismo montano e l'evento olimpico come motori principali della domanda." },
      { q: "Quanto si guadagna come cameriere stagionale in Valtellina?", a: "Il personale di sala guadagna tipicamente tra €1.200 e €1.600 netti al mese, mentre cuochi e chef con esperienza possono arrivare tra €1.400 e €2.500, spesso con vitto e alloggio inclusi nelle strutture montane." },
      { q: "Perché conviene indicare le date di disponibilità nel CV per un lavoro stagionale?", a: "Perché le strutture ricettive devono coprire periodi molto precisi (alta stagione, evento olimpico) e con una difficoltà di reperimento personale che sfiora il 46%, selezionano più rapidamente i candidati che dichiarano subito la propria disponibilità esatta." },
      { q: "Serve l'attestato HACCP per lavorare come cameriere stagionale?", a: "È obbligatorio per chi manipola alimenti direttamente (es. in cucina o nell'allestimento piatti), mentre per il solo servizio di sala non è sempre richiesto per legge, ma molte strutture lo preferiscono comunque come garanzia di formazione di base sull'igiene alimentare." },
      { q: "Come si trova lavoro stagionale in Valtellina senza esperienza precedente?", a: "La disponibilità dichiarata su date precise, la conoscenza anche base di una lingua straniera e la flessibilità sull'alloggio sono spesso sufficienti per una prima assunzione stagionale, soprattutto nell'anno olimpico in cui la difficoltà di reperimento personale sfiora il 46% e le strutture assumono anche profili junior da formare." },
      { q: "Conviene ripresentarsi nella stessa struttura stagione dopo stagione?", a: "Sì, è una prassi molto comune nel turismo montano: le strutture privilegiano chi ha già lavorato con loro perché riduce i tempi di formazione, e spesso propongono un rientro anticipato rispetto alla ricerca di nuovo personale sul mercato." },
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
