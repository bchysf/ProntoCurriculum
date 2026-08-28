// Blog editoriale ProntoCurriculum — contenuti ottimizzati SEO / E-E-A-T.
// I link interni nell'HTML usano <a data-page="..." data-slug="...">: la navigazione
// è gestita per delega in BlogArticle. I link esterni puntano a fonti istituzionali.

export interface BlogArticleData {
  slug: string;
  title: string;
  subtitle: string;
  /** Meta description (~150 caratteri) usata per document.head e JSON-LD. */
  metaDescription: string;
  category: 'GUIDE PRATICHE' | 'TECNOLOGIE & ATS' | 'MERCATO & TREND' | 'COLLOQUIO' | 'MODELLI & EUROPASS';
  author: {
    name: string;
    role: string;
    initials: string;
  };
  date: string;
  /** Data ISO (YYYY-MM-DD) per schema.org datePublished. */
  dateISO: string;
  readTime: string;
  featured?: boolean;
  trending?: boolean;
  keyTakeaways: string[];
  sections: {
    id: string;
    title: string;
    content: string; // HTML
    callout?: {
      title: string;
      text: string;
      type?: 'tip' | 'warning' | 'ats' | 'quote';
    };
  }[];
  /** FAQ renderizzate a fine articolo + emesse come FAQPage JSON-LD. */
  faq?: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const BLOG_ARTICLES: BlogArticleData[] = [
  {
    slug: 'guida-cv',
    title: 'Come Scrivere un Curriculum Perfetto nel 2026: la Guida Completa',
    subtitle: 'Struttura, lunghezza, formula dei risultati misurabili e tailoring ATS: le regole validate dai recruiter per trasformare il CV in un invito al colloquio.',
    metaDescription: 'Guida completa al curriculum perfetto 2026: struttura in una pagina, risultati misurabili, tailoring ATS e errori da evitare. Con esempi pratici.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '10 Luglio 2026',
    dateISO: '2026-07-10',
    readTime: '8 min di lettura',
    featured: true,
    trending: true,
    keyTakeaways: [
      'Un recruiter dedica in media 6-7 secondi alla prima scansione del CV: gerarchia visiva e sintesi contano più di qualsiasi aggettivo.',
      'Sostituisci gli elenchi di mansioni con la formula di impatto: verbo d’azione + attività + risultato quantificato (KPI).',
      'Personalizza sommario e competenze per ogni singola offerta (tailoring): è il fattore che più incide sul punteggio ATS.',
    ],
    sections: [
      {
        id: 'struttura-lunghezza',
        title: 'Struttura e lunghezza: la regola della pagina singola',
        content: `<p>Salvo carriere accademiche o percorsi dirigenziali con oltre 15 anni di esperienza, il curriculum efficace sta in <b>una pagina A4</b>, massimo due. Ogni riga in più diluisce i risultati davvero rilevanti e consuma i pochi secondi di attenzione del selezionatore.</p>
        <p>I blocchi fondamentali, nell'ordine che massimizza la leggibilità:</p>
        <ul>
          <li><b>Dati di contatto essenziali:</b> nome, telefono, email professionale, link al profilo LinkedIn e città di domicilio. Ometti dati non richiesti (stato civile, indirizzo completo): in molti Paesi UE sono perfino sconsigliati per ragioni di anti-discriminazione.</li>
          <li><b>Profilo professionale (summary):</b> 3-4 righe ad alta densità subito sotto l'intestazione. È il tuo elevator pitch: chi sei, i traguardi misurabili e il valore che porti all'azienda.</li>
          <li><b>Esperienze professionali:</b> al centro del documento, in ordine cronologico inverso, con date complete (mese e anno) per non insospettire i parser ATS.</li>
          <li><b>Formazione e competenze:</b> ben separate, con hard e soft skill strettamente attinenti al ruolo. Le lingue vanno indicate con il livello QCER (A1-C2).</li>
        </ul>`,
        callout: {
          title: 'La formula del risultato quantificabile',
          text: 'Mai frasi passive come "Mi occupavo della gestione dei social media". Trasformale in risultati attivi e misurabili: "Ideato e gestito la strategia di content marketing su LinkedIn e Instagram, con +140% di crescita organica dei follower in 6 mesi e +35% di lead qualificati".',
          type: 'tip'
        }
      },
      {
        id: 'impatto-visivo',
        title: 'Impatto visivo e tipografia: il primo filtro di qualità',
        content: `<p>L'estetica è il primo giudizio implicito: un CV con font disomogenei, margini strettissimi o colonne caotiche comunica disorganizzazione prima ancora che venga letta una parola.</p>
        <p>Le regole tipografiche che funzionano nel 2026:</p>
        <ul>
          <li><b>Font ad alta leggibilità</b> su schermo e in stampa: Inter, Satoshi, DM Sans o Helvetica Neue, corpo 10-11 pt per il testo.</li>
          <li><b>Margini respirabili</b> di almeno 15-20 mm per lato: lo spazio bianco guida l'occhio verso ciò che conta.</li>
          <li><b>Una sola gerarchia cromatica:</b> un colore scuro per i testi e un unico accento per i titoli di sezione. I CV arcobaleno vengono percepiti come amatoriali dal 68% dei recruiter.</li>
        </ul>
        <p>Se il ruolo lo consente, un template <a data-page="blog-article" data-slug="esempi-cv" href="#">calibrato sul tuo settore</a> fa la differenza tra un documento anonimo e uno memorabile.</p>`
      },
      {
        id: 'tailoring-ats',
        title: 'Tailoring semantico: adattare il CV a ogni candidatura',
        content: `<p>Inviare lo stesso curriculum generico a 50 aziende è la causa principale del silenzio dei recruiter. Le aziende medio-grandi filtrano le candidature con software ATS che cercano <b>corrispondenze semantiche esatte</b> tra la job description e le parole chiave del tuo CV.</p>
        <p>Se l'annuncio chiede "Metodologia Agile e Scrum" e il tuo documento riporta solo "gestione flessibile dei progetti", l'algoritmo non riconosce la corrispondenza e ti assegna un punteggio basso — il profilo viene scartato prima dell'esame umano. Approfondisci il funzionamento dei filtri nella nostra guida <a data-page="blog-article" data-slug="punteggio-ats" href="#">al punteggio ATS</a>.</p>
        <p>Il metodo pratico in tre passaggi:</p>
        <ul>
          <li>Evidenzia nell'annuncio le 8-12 competenze e keyword ricorrenti.</li>
          <li>Riscrivi sommario e sezione competenze usando la stessa terminologia esatta dell'annuncio (non sinonimi).</li>
          <li>Riordina i bullet delle esperienze mettendo in cima quelli più pertinenti per quel ruolo specifico.</li>
        </ul>`,
        callout: {
          title: 'Il vantaggio del tailoring automatico',
          text: 'Con lo strumento "CV su Misura" di ProntoCurriculum incolli il testo dell’offerta: l’algoritmo adatta sommario e competenze e inserisce le keyword esatte richieste, mostrandoti in tempo reale il punteggio di compatibilità ATS.',
          type: 'ats'
        }
      },
      {
        id: 'errori-frequenti',
        title: 'I 5 errori che squalificano un CV (secondo i recruiter)',
        content: `<p>Dalle survey condotte con HR manager e head hunter italiani, questi sono gli errori più penalizzanti in fase di screening:</p>
        <ul>
          <li><b>Refusi ed errori grammaticali:</b> il 77% dei recruiter scarta un CV con più di un refuso. Rileggi ad alta voce e fai revisionare il testo.</li>
          <li><b>Email non professionale:</b> usa nome.cognome, mai nickname da adolescente.</li>
          <li><b>Buchi temporali non spiegati:</b> meglio una riga onesta ("2023 — anno sabbatico per formazione") del vuoto che genera sospetto.</li>
          <li><b>Foto non professionale:</b> in Italia la foto è ancora comune, ma deve essere neutra e in alta risoluzione — mai selfie o foto ritagliate.</li>
          <li><b>File nominato male:</b> "CV_definitivo_v3_FINALE.pdf" comunica caos. Usa "Nome-Cognome-CV.pdf".</li>
        </ul>`
      },
      {
        id: 'cv-cambio-carriera-rientro',
        title: 'CV per chi cambia carriera o rientra dopo una pausa',
        content: `<p>Le regole standard vanno adattate quando il percorso non è lineare. Sono due i casi più frequenti e più mal gestiti nei CV che arrivano ai recruiter.</p>
        <ul>
          <li><b>Cambio di settore o funzione:</b> non nascondere il percorso precedente, riformulalo. Nel sommario esplicita subito la direzione ("Project manager IT in transizione verso ruoli di Product Management, con base tecnica e tre progetti Agile guidati end-to-end"). Nei bullet delle esperienze passate, isola le responsabilità trasferibili — gestione stakeholder, budget, coordinamento team — e lasciale in evidenza, ridimensionando i dettagli tecnici non più rilevanti.</li>
          <li><b>Rientro dopo una pausa (maternità, malattia, cura di un familiare, sabbatico):</b> una riga onesta nella cronologia toglie ogni ambiguità e previene le domande sospettose in sede di screening. Meglio "2024-2025 — Congedo per cura familiare" che un buco muto: il vuoto non spiegato genera più diffidenza della causa stessa. Se durante la pausa hai seguito corsi, certificazioni o volontariato con responsabilità reali, inseriscili: dimostrano che il periodo non è stato di totale inattività professionale.</li>
          <li><b>Percorsi non lineari (più settori in pochi anni):</b> il sommario deve fare il lavoro di sintesi che il recruiter non farà da solo. Identifica il filo conduttore reale — spesso una competenza trasversale come la gestione di progetti complessi o il rapporto con il cliente — e usalo come chiave di lettura dell'intero CV.</li>
        </ul>`,
        callout: {
          title: 'Quando serve una lettera di presentazione',
          text: 'Un percorso non lineare è uno dei casi in cui la cover letter smette di essere opzionale: è lo spazio in cui puoi spiegare in poche righe il perché della transizione, cosa che il CV da solo non può fare. Approfondisci nella guida alla <a data-page="blog-article" data-slug="lettera-presentazione" href="#">lettera di presentazione perfetta</a>.',
          type: 'tip'
        }
      },
      {
        id: 'sommario-vs-obiettivo',
        title: 'Sommario professionale o obiettivo di carriera: cosa scrivere davvero',
        content: `<p>Molti candidati confondono due blocchi che hanno funzioni opposte, e finiscono per scriverne uno solo, sbagliato per il proprio caso.</p>
        <ul>
          <li><b>Il sommario professionale</b> (o profilo) è la scelta corretta per chi ha già esperienza: riassume chi sei, cosa hai già dimostrato di saper fare e con quali numeri. Si scrive alla terza persona implicita, senza "Io", e si concentra sul passato recente come prova di affidabilità futura.</li>
          <li><b>L'obiettivo di carriera</b> (career objective) ha senso solo per neolaureati, chi cambia settore radicalmente o chi rientra dopo una lunga pausa: comunica dove vuoi andare, non cosa hai già fatto, perché il "cosa hai già fatto" non è ancora abbastanza rilevante per il ruolo target.</li>
          <li><b>L'errore più comune</b> è scrivere un sommario generico che potrebbe stare in qualunque CV ("Professionista dinamico e orientato ai risultati, con forte spirito di squadra"): frasi di questo tipo non contengono alcuna informazione verificabile e vengono ignorate sia dal recruiter umano sia, di fatto, dal parser ATS che non vi trova keyword utili.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Quanto deve essere lungo un curriculum nel 2026?', a: 'Una pagina se hai meno di dieci anni di esperienza, due al massimo per profili senior. I recruiter dedicano in media 6-7 secondi alla prima lettura: ogni riga deve guadagnarsi il suo posto.' },
      { q: 'Meglio il formato PDF o Word per inviare il CV?', a: 'PDF nella quasi totalità dei casi: preserva l’impaginazione su ogni dispositivo ed è letto correttamente dagli ATS moderni. Invia il .docx solo se richiesto esplicitamente dall’annuncio.' },
      { q: 'La foto sul curriculum è obbligatoria in Italia?', a: 'No, non è obbligatoria. In Italia resta consuetudine per molti settori a contatto con il pubblico, ma per candidature verso aziende internazionali o anglosassoni va omessa per policy anti-discriminazione.' },
      { q: 'Devo scrivere l’autorizzazione al trattamento dei dati personali?', a: 'Sì, per le candidature in Italia è buona norma includere in calce la dicitura di consenso ai sensi del GDPR (Reg. UE 2016/679): molte aziende non possono processare CV che ne sono privi.' },
      { q: 'Come gestisco nel CV un lavoro durato pochi mesi?', a: 'Includilo comunque, con date precise: ometterlo crea un buco più sospetto della breve permanenza in sé. Se la ragione è oggettiva (fine contratto, ristrutturazione aziendale) e te lo chiedono al colloquio, spiegalo in una frase senza scusarti eccessivamente.' },
      { q: 'Conviene inserire hobby e interessi personali nel CV?', a: 'Solo se pertinenti al ruolo o rivelano competenze trasferibili reali (organizzazione di eventi, ruoli di responsabilità in associazioni, sport di squadra a livello agonistico). Una lista generica di hobby occupa spazio prezioso senza aggiungere informazioni utili alla selezione.' },
      { q: 'Devo indicare la RAL attuale o le aspettative economiche nel CV?', a: 'No, il CV non è la sede giusta: queste informazioni si discutono al colloquio o, se esplicitamente richieste, nella lettera di presentazione o nel form di candidatura. Inserirle nel CV toglie margine di negoziazione.' },
    ],
    relatedSlugs: ['punteggio-ats', 'cv-europass', 'lettera-presentazione']
  },
  {
    slug: 'punteggio-ats',
    title: 'Punteggio ATS: Cos’è e Come Superare i Filtri Automatici nel 2026',
    subtitle: 'Come funzionano Workday, Taleo, Greenhouse e gli altri software di pre-selezione, perché scartano candidati qualificati e come ottimizzare il CV per superarli.',
    metaDescription: 'Cos’è il punteggio ATS, come funzionano i software di pre-selezione (Workday, Taleo, Greenhouse) e come ottimizzare il CV per superare i filtri automatici.',
    category: 'TECNOLOGIE & ATS',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '8 Luglio 2026',
    dateISO: '2026-07-08',
    readTime: '7 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'Oltre il 75% dei CV inviati alle medie e grandi aziende viene analizzato da un software ATS prima di arrivare a un essere umano.',
      'Tabelle complesse, colonne intrecciate, infografiche e icone impediscono al parser di estrarre correttamente date e mansioni.',
      'Il punteggio di compatibilità (0-100) dipende dalla corrispondenza esatta delle keyword e dalla pulizia strutturale del documento.',
    ],
    sections: [
      {
        id: 'che-cosa-e-ats',
        title: 'Che cos’è un ATS e come funziona dietro le quinte',
        content: `<p>Gli <b>Applicant Tracking System (ATS)</b> — Workday, Taleo, Greenhouse, Lever, SAP SuccessFactors e, in Italia, soluzioni come TeamSystem HR e Zucchetti — sono le piattaforme con cui le aziende automatizzano l'acquisizione e la prima scrematura delle candidature.</p>
        <p>Quando invii il curriculum tramite un portale aziendale o LinkedIn, il file viene elaborato da un modulo di <b>parsing semantico</b> che smonta il documento e ne inserisce i dati nel database HR: anagrafica, esperienze con date di inizio e fine, titoli di studio, competenze. Su questi dati strutturati il recruiter applica poi filtri e ranking: chi non viene "letto" correttamente, semplicemente non compare nei risultati.</p>`
      },
      {
        id: 'perche-scartano-cv',
        title: 'I 3 errori tecnici che mandano il CV nel cestino automatico',
        content: `<p>La maggior parte dei candidati non viene scartata per mancanza di competenze, ma per problemi di leggibilità del file da parte del software:</p>
        <ul>
          <li><b>Tabelle nascoste, caselle di testo e colonne irregolari:</b> se il CV è costruito su Word o Canva con box fluttuanti, il parser legge il testo da sinistra a destra ignorando i bordi. Risultato: le date di un'esperienza si mescolano alle mansioni di un'altra e il profilo diventa incomprensibile.</li>
          <li><b>Grafiche e icone al posto del testo:</b> barre di livello ("Inglese: 4 pallini su 5") e loghi sono invisibili agli ATS, che leggono solo caratteri testuali. Le tue competenze linguistiche scompaiono dal database.</li>
          <li><b>Keyword mismatch:</b> gli algoritmi confrontano le parole esatte del CV con la job description. Se l'azienda cerca "SEO Specialist" e tu scrivi "ottimizzatore per motori di ricerca", la compatibilità calcolata crolla.</li>
        </ul>`,
        callout: {
          title: 'Come funziona l’analisi ATS in tempo reale di ProntoCurriculum',
          text: 'L’editor integra un analizzatore semantico nativo: mentre scrivi, il motore verifica densità delle keyword, pulizia strutturale del markup e completezza delle date, assegnando un punteggio da 0 a 100 ed evidenziando le keyword mancanti prima dell’invio.',
          type: 'ats'
        }
      },
      {
        id: 'ottimizzare-cv-ats',
        title: 'Checklist: rendere il CV a prova di parser',
        content: `<p>Le regole operative per massimizzare il punteggio, valide per tutti i principali ATS sul mercato:</p>
        <ul>
          <li><b>Layout a colonna singola</b> (o due colonne semplici senza tabelle), titoli di sezione standard: "Esperienza professionale", "Formazione", "Competenze".</li>
          <li><b>Date complete</b> in formato mese/anno per ogni esperienza: i buchi o le date parziali abbassano il ranking.</li>
          <li><b>Keyword dell'annuncio ripetute in contesto naturale</b> — nel sommario, nelle competenze e nei bullet — senza keyword stuffing, che i sistemi più recenti penalizzano.</li>
          <li><b>Font standard e testo selezionabile:</b> mai CV esportati come immagine, mai intestazioni con informazioni critiche dentro header/footer del file.</li>
          <li><b>Nome file pulito:</b> "Nome-Cognome-CV.pdf" aiuta anche il recruiter umano a ritrovarti.</li>
        </ul>
        <p>Per la struttura complessiva del documento, parti dalla <a data-page="blog-article" data-slug="guida-cv" href="#">guida al CV perfetto</a>.</p>`
      },
      {
        id: 'dopo-il-parsing',
        title: 'Cosa succede dopo il parsing: il ranking umano che segue il filtro',
        content: `<p>Superare il parser è solo il primo passaglio: nella maggior parte dei processi di selezione strutturati, l'ATS non decide da solo chi scartare, ma ordina i profili in una dashboard che il recruiter scorre in base a un punteggio di matching.</p>
        <ul>
          <li><b>Il ranking per keyword pesate:</b> molti ATS assegnano un peso maggiore alle competenze indicate come "requisiti obbligatori" nell'annuncio rispetto a quelle "preferibili". Un CV che copre tutti gli obbligatori con un match parziale sui preferibili spesso batte un CV più ricco ma carente sugli obbligatori.</li>
          <li><b>I filtri booleani impostati dal recruiter:</b> oltre al punteggio automatico, molti selezionatori affinano la ricerca con query booleane proprie ("Java AND Spring NOT junior"), spesso lanciate direttamente su LinkedIn Recruiter o sul database interno dell'ATS. Un CV che nomina esplicitamente le tecnologie e il livello di seniority nel titolo o nel sommario intercetta meglio queste ricerche.</li>
          <li><b>La revisione umana resta decisiva:</b> anche il punteggio ATS più alto non sostituisce mai completamente la lettura umana per le posizioni davvero rilevanti. Il software serve a comprimere centinaia di candidature in una shortlist gestibile, non a scegliere l'assunto finale.</li>
        </ul>`
      },
      {
        id: 'ats-per-piattaforma',
        title: 'Differenze pratiche tra le piattaforme ATS più diffuse',
        content: `<p>Non tutti gli ATS si comportano allo stesso modo, e conoscerne le peculiarità aiuta a capire perché lo stesso CV può ottenere risposte diverse a seconda dell'azienda:</p>
        <ul>
          <li><b>Workday:</b> molto diffuso nelle multinazionali, ha un parser storicamente rigido con i CV a più colonne: penalizza fortemente template creativi con sidebar laterali.</li>
          <li><b>Greenhouse e Lever:</b> usati soprattutto da scale-up tech, tendono ad avere un parsing più tollerante e mettono più enfasi sul matching testuale libero che sui campi strutturati rigidi.</li>
          <li><b>LinkedIn Recruiter:</b> non è un ATS in senso stretto ma la piattaforma di ricerca più usata dai recruiter italiani; qui contano moltissimo il titolo del profilo, la sezione "Informazioni" e le competenze evidenziate, oltre al CV allegato.</li>
          <li><b>Soluzioni italiane (Zucchetti, TeamSystem HR):</b> spesso integrate con i portali dei Centri per l'Impiego e delle agenzie, danno peso rilevante ai campi strutturati (titolo di studio, CCNL, livello di inquadramento) più che al free text.</li>
        </ul>
        <p>In tutti i casi, la regola di base non cambia: struttura semplice, date complete, keyword esatte dell'annuncio. Approfondisci come applicarla concretamente nella <a data-page="blog-article" data-slug="guida-cv" href="#">guida al CV perfetto</a>.</p>`
      }
    ],
    faq: [
      { q: 'Come faccio a sapere se il mio CV supera i filtri ATS?', a: 'Verifica tre cose: il testo deve essere selezionabile nel PDF, la struttura deve reggere il copia-incolla in un file di testo semplice senza mescolare le sezioni, e le keyword dell’annuncio devono comparire nel documento. Un analizzatore ATS come quello di ProntoCurriculum automatizza il controllo con un punteggio da 0 a 100.' },
      { q: 'Gli ATS leggono i PDF?', a: 'Sì, tutti gli ATS moderni leggono i PDF con testo selezionabile. Il problema non è il formato ma la struttura: PDF generati come immagine (scansioni) o con layout a tabelle complesse non vengono interpretati correttamente.' },
      { q: 'Le aziende piccole usano gli ATS?', a: 'Sempre di più: molte PMI italiane esternalizzano la pre-selezione ad agenzie per il lavoro (Adecco, Randstad, Gi Group) che usano ATS internamente. Ottimizzare il CV per il parsing conviene a prescindere dalla dimensione dell’azienda target.' },
      { q: 'Un punteggio ATS alto garantisce il colloquio?', a: 'No: garantisce che il CV arrivi correttamente letto e posizionato in alto nella lista del recruiter. Da lì in poi contano coerenza del percorso, pertinenza dell’esperienza e, per i ruoli con più step, i risultati dei test tecnici o motivazionali.' },
      { q: 'Conviene inserire le stesse keyword più volte nel CV per essere sicuri che l’ATS le veda?', a: 'No: la ripetizione innaturale (keyword stuffing) è riconosciuta dai sistemi più recenti e può abbassare il punteggio anziché alzarlo. Una keyword ben posizionata nel sommario, nelle competenze e in un bullet pertinente è sufficiente.' },
      { q: 'Cosa fare se un annuncio richiede l’invio del CV solo in formato Word?', a: 'Rispetta l’indicazione: alcuni ATS aziendali più datati elaborano meglio il .docx del PDF. In assenza di indicazioni esplicite, il PDF resta la scelta più sicura per la maggioranza delle piattaforme moderne.' },
    ],
    relatedSlugs: ['guida-cv', 'cv-europass', 'colloqui-domande-difficili']
  },
  {
    slug: 'cv-europass',
    title: 'CV Europass nel 2026: Quando Usarlo e Quando Evitarlo',
    subtitle: 'Analisi del formato europeo: obbligatorio per concorsi pubblici e bandi UE, spesso controproducente nel settore privato. Pro, contro e alternative.',
    metaDescription: 'CV Europass: quando è obbligatorio (concorsi pubblici, bandi UE) e quando penalizza la candidatura nel privato. Pro, contro e alternative moderne.',
    category: 'MODELLI & EUROPASS',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '4 Luglio 2026',
    dateISO: '2026-07-04',
    readTime: '7 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'L’Europass è la scelta obbligata per concorsi pubblici italiani, istituzioni UE e bandi accademici.',
      'Nel settore privato viene sconsigliato dalla maggioranza dei recruiter: troppe pagine, spazio sprecato, profili tutti identici.',
      'La strategia vincente è mantenere un unico contenuto e generare due formati: Europass per il pubblico, moderno per il privato.',
    ],
    sections: [
      {
        id: 'quando-usare-europass',
        title: 'Quando l’Europass è la scelta obbligata e vincente',
        content: `<p>Il formato Europass nasce nel 2004 come standard della Commissione Europea per la mobilità dei lavoratori nell'Unione. Nonostante le critiche nel privato, restano scenari in cui è indispensabile:</p>
        <ul>
          <li><b>Concorsi pubblici italiani ed enti statali:</b> la quasi totalità dei bandi per la Pubblica Amministrazione richiede esplicitamente il modello europeo, perché consente alla commissione un controllo formale di titoli e punteggi. Trovi i bandi attivi sul portale ufficiale <a href="https://www.inpa.gov.it" target="_blank" rel="noopener">inPA.gov.it</a>.</li>
          <li><b>Istituzioni UE e agenzie internazionali:</b> per candidature dirette a commissioni, ministeri o enti di ricerca europei.</li>
          <li><b>Bandi universitari, borse di studio e dottorati:</b> dove serve la catalogazione standardizzata delle pubblicazioni e dei livelli linguistici secondo il quadro QCER (A1-C2).</li>
        </ul>`
      },
      {
        id: 'limiti-settore-privato',
        title: 'I difetti strutturali nel settore privato',
        content: `<p>Per una multinazionale, una società di consulenza, un'agenzia creativa o una PMI dinamica, il classico Europass generato online presenta svantaggi concreti:</p>
        <ul>
          <li><b>Impaginazione prolissa:</b> margini larghissimi, logo istituzionale, etichette burocratiche ("Tipo di azienda o settore", "Principali mansioni e responsabilità") e griglie linguistiche dilatano fino a 4-5 pagine un contenuto che starebbe in una.</li>
          <li><b>Omologazione visiva:</b> quando un head hunter riceve 300 candidature Europass, tutti i profili sembrano identici. Nessuna flessibilità per mettere in risalto traguardi chiave o specificità professionali.</li>
          <li><b>Gerarchia debole per lo screening rapido:</b> nei 6-7 secondi della prima lettura, il formato disperde l'attenzione sulle etichette anziché sui risultati del candidato.</li>
        </ul>`,
        callout: {
          title: 'La soluzione a doppio binario',
          text: 'In ProntoCurriculum lo stesso contenuto genera entrambi i formati: il modello "Europass Ottimizzato" rispetta tutti i campi formali dei bandi pubblici eliminando gli sprechi di margine; con un clic passi al modello "Modern" o "Executive" per le candidature nel privato.',
          type: 'tip'
        }
      },
      {
        id: 'europass-ats',
        title: 'Europass e ATS: un rapporto complicato',
        content: `<p>Un aspetto poco noto: il layout a griglia dell'Europass tradizionale mette in difficoltà anche i parser automatici. Le etichette ripetute e le tabelle interne possono frammentare l'estrazione dei dati, penalizzando il <a data-page="blog-article" data-slug="punteggio-ats" href="#">punteggio ATS</a> anche di profili eccellenti.</p>
        <p>Se l'azienda privata a cui ti candidi usa un portale di recruiting (Workday, Taleo, Greenhouse), un CV moderno a colonna singola con keyword mirate ottiene sistematicamente ranking migliori dello stesso contenuto in formato Europass.</p>`
      },
      {
        id: 'compilare-europass-senza-sprechi',
        title: 'Come compilare l’Europass riducendo al minimo gli sprechi di spazio',
        content: `<p>Quando il bando impone il formato europeo, si può comunque lavorare sulla qualità del contenuto per limitare la dispersione tipica del template:</p>
        <ul>
          <li><b>Esperienze professionali:</b> anche nei campi rigidi come "Principali mansioni e responsabilità", scrivi frasi dense con verbo d'azione e risultato, evitando la descrizione passiva delle attività quotidiane. Il campo è libero: la rigidità è solo nell'etichetta, non nel contenuto.</li>
          <li><b>Competenze comunicative e organizzative:</b> molti candidati lasciano questi campi vuoti o li riempiono con frasi generiche. Compilali con competenze reali e verificabili — coordinamento di team, gestione di progetti multi-stakeholder — perché le commissioni pubbliche li leggono e talvolta li punteggiano.</li>
          <li><b>Allegati e certificazioni:</b> per i concorsi pubblici, allega sempre la documentazione richiesta nell'ordine indicato dal bando. Un dossier disordinato, anche con un Europass impeccabile, rallenta l'istruttoria della commissione.</li>
        </ul>`
      },
      {
        id: 'europass-lingue-competenze-digitali',
        title: 'La sezione lingue e competenze digitali: l’errore più comune',
        content: `<p>Le tabelle QCER e la griglia delle competenze digitali sono i punti in cui la maggior parte dei candidati perde punti per disattenzione, non per mancanza di competenze reali:</p>
        <ul>
          <li><b>Autovalutazione onesta e coerente:</b> indicare C1 in una lingua senza possedere certificazioni o esperienze a supporto espone a domande imbarazzanti in sede di colloquio o prova orale del concorso. Meglio un livello prudente ma difendibile.</li>
          <li><b>Certificazioni sempre allegate:</b> se dichiari un livello linguistico supportato da certificazione (IELTS, Goethe-Zertifikat, DELF), allegala sempre: nei bandi pubblici il punteggio titoli spesso la richiede esplicitamente.</li>
          <li><b>Competenze digitali:</b> la griglia europea DigComp distingue elaborazione delle informazioni, comunicazione, creazione di contenuti, sicurezza e problem solving. Compilala con onestà per ciascuna area, invece di lasciarla vuota o marcarla in blocco come "avanzato": le commissioni la incrociano con il resto del CV.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Il CV Europass è obbligatorio per i concorsi pubblici?', a: 'Nella maggior parte dei bandi sì: il formato europeo è richiesto esplicitamente per consentire il controllo formale dei titoli. Verifica sempre il testo del bando sul portale inPA o sul sito dell’ente.' },
      { q: 'Posso usare l’Europass per candidarmi a un’azienda privata?', a: 'Puoi, ma è generalmente sconsigliato: il formato dilata il contenuto su troppe pagine e appiattisce il profilo. Nel privato un CV moderno di una pagina con risultati misurabili ottiene tassi di risposta superiori.' },
      { q: 'Come converto il mio Europass in un CV moderno?', a: 'Con ProntoCurriculum importi o ricrei il contenuto una sola volta e cambi template con un clic: lo stesso profilo si reimpagina automaticamente in formato Europass Ottimizzato, Modern o Executive.' },
      { q: 'Il bando può richiedere anche l’autocertificazione oltre all’Europass?', a: 'Sì, è frequente: molti bandi pubblici chiedono l’Europass come riepilogo e, in aggiunta, una autocertificazione ai sensi del DPR 445/2000 per i titoli valutabili. Verifica sempre entrambi i requisiti prima di inviare la domanda.' },
      { q: 'Cosa fare se il bando non specifica il formato del CV?', a: 'In assenza di indicazioni esplicite, verifica se si tratta di ente pubblico o privato: per gli enti pubblici l’Europass resta la scelta più prudente, per le aziende private un CV moderno è generalmente preferibile.' },
      { q: 'Devo aggiornare l’Europass ogni volta che cambio lavoro?', a: 'Sì, tienilo aggiornato come faresti con qualsiasi CV: per i bandi pubblici con scadenze ravvicinate non avrai il tempo di ricostruirlo da zero, e una versione obsoleta può farti perdere titoli valutabili nel punteggio.' },
    ],
    relatedSlugs: ['guida-cv', 'punteggio-ats', 'esempi-cv']
  },
  {
    slug: 'lettera-presentazione',
    title: 'Lettera di Presentazione Perfetta: Struttura, Esempi e Modelli 2026',
    subtitle: 'Come scrivere una cover letter che il recruiter legge davvero: struttura in 4 paragrafi, apertura a impatto e chiusura con call-to-action.',
    metaDescription: 'Come scrivere la lettera di presentazione perfetta: struttura in 4 paragrafi, esempi di apertura a impatto, lunghezza ideale e errori da evitare.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '1 Luglio 2026',
    dateISO: '2026-07-01',
    readTime: '6 min di lettura',
    featured: false,
    trending: false,
    keyTakeaways: [
      'La lettera non deve duplicare il CV: racconta il perché vuoi proprio quell’azienda e quale problema specifico puoi risolvere.',
      'Apri con un gancio a impatto: un traguardo recente dell’azienda o una sfida di mercato che stanno affrontando.',
      'Lunghezza ideale 250-350 parole in 3-4 paragrafi, con una call-to-action chiara in chiusura.',
    ],
    sections: [
      {
        id: 'errore-comune-cover-letter',
        title: 'L’errore #1: ripetere a pappagallo il curriculum',
        content: `<p>Il 90% dei candidati apre la lettera con la formula stantia: <i>"Gentile Responsabile delle Risorse Umane, con la presente intendo sottoporre la mia candidatura per il ruolo di X. Come si evince dal mio CV, mi sono laureato nel 2021 e ho lavorato per..."</i></p>
        <p>Questa introduzione spegne l'attenzione all'istante. La cover letter ha uno scopo diverso dal CV: dimostrare <b>motivazione, conoscenza dell'azienda e fit culturale</b>. Deve rispondere alla domanda implicita del recruiter: <i>"Perché questo candidato ha scelto proprio noi, e cosa può fare per il nostro team nei primi 60 giorni?"</i></p>`
      },
      {
        id: 'struttura-vincente-4-parti',
        title: 'La struttura vincente in 4 paragrafi',
        content: `<p>Una lettera ad alta conversione si articola in quattro sezioni chirurgiche:</p>
        <ul>
          <li><b>1. Il gancio (hook):</b> cattura l'attenzione citando un successo recente dell'azienda — un lancio, un'espansione, un premio — e collegalo alla tua motivazione per quel settore.</li>
          <li><b>2. Il valore concreto:</b> seleziona 1-2 risultati della tua carriera che rispondono esattamente alla sfida descritta nella job description, con numeri precisi.</li>
          <li><b>3. L’allineamento culturale:</b> spiega in 2-3 righe perché condividi valori, metodo o missione dell'azienda — con riferimenti specifici, non frasi di circostanza.</li>
          <li><b>4. La call-to-action:</b> chiudi chiedendo un breve incontro conoscitivo per approfondire come la tua esperienza può contribuire agli obiettivi del team.</li>
        </ul>`,
        callout: {
          title: 'Esempio di apertura ad alto impatto',
          text: '"Gentile Dott. Conti, ho seguito con grande interesse il lancio della vostra divisione Fintech in Spagna. Avendo guidato l’espansione dei canali di pagamento digitali per un brand e-commerce, con +1,8M€ di fatturato nel primo anno, sarei entusiasta di mettere le mie competenze di growth management al servizio del vostro ingresso sul mercato iberico."',
          type: 'quote'
        }
      },
      {
        id: 'quando-serve-cover-letter',
        title: 'Quando la lettera serve davvero (e quando no)',
        content: `<p>Non tutte le candidature richiedono una cover letter, e inviarne una generica è peggio che non inviarla. Le situazioni in cui fa davvero la differenza:</p>
        <ul>
          <li><b>Cambio di settore o di ruolo:</b> il CV da solo non spiega la transizione; la lettera sì.</li>
          <li><b>Candidature spontanee:</b> senza un annuncio di riferimento, la lettera è l'unico contesto che il recruiter riceve.</li>
          <li><b>Ruoli in comunicazione, marketing e vendite:</b> la lettera è essa stessa una prova di scrittura persuasiva.</li>
          <li><b>Buchi nel percorso o rientri dal lavoro all'estero:</b> due righe trasparenti valgono più di qualsiasi omissione.</li>
        </ul>
        <p>Prima di scrivere la lettera, assicurati che il CV sia già a punto: parti dalla <a data-page="blog-article" data-slug="guida-cv" href="#">guida al CV perfetto</a>.</p>`
      },
      {
        id: 'candidatura-spontanea-senza-annuncio',
        title: 'Candidatura spontanea: come scrivere la lettera senza un annuncio di riferimento',
        content: `<p>Senza una job description da cui partire, la lettera spontanea richiede un lavoro di ricerca preliminare più profondo, ma può aprire porte che gli annunci pubblicati non offrono — molte posizioni vengono coperte prima ancora di essere pubblicate.</p>
        <ul>
          <li><b>Identifica il bisogno prima di scrivere:</b> studia i canali ufficiali dell'azienda (sito, comunicati stampa, profilo LinkedIn aziendale) per capire in quale direzione sta crescendo o quali difficoltà sta affrontando. La lettera deve proporre te come soluzione a un problema plausibile, non generico interesse per "un'azienda dinamica e stimolante".</li>
          <li><b>Sii specifico sul ruolo che immagini:</b> "Vorrei mettermi a disposizione per qualsiasi opportunità" non dà al lettore nulla su cui agire. Meglio indicare una funzione precisa ("un ruolo nel team commerciale B2B") lasciando comunque aperta la disponibilità ad altre posizioni compatibili.</li>
          <li><b>Chiudi con una richiesta a basso attrito:</b> non chiedere direttamente un colloquio formale, ma un breve confronto conoscitivo di 15 minuti. È una richiesta più facile da accettare per chi non ha una posizione aperta in quel momento.</li>
        </ul>`
      },
      {
        id: 'errori-che-affossano-la-lettera',
        title: 'Errori che affossano la lettera anche quando il contenuto è buono',
        content: `<p>Anche una lettera ben argomentata può fallire per problemi di forma che minano la credibilità del candidato:</p>
        <ul>
          <li><b>Copiare il nome dell'azienda sbagliato:</b> capita più spesso di quanto si pensi quando si riutilizza un template per più candidature. È l'errore che manda al cestino la lettera più immediatamente, perché segnala scarsa cura.</li>
          <li><b>Tono eccessivamente formale o eccessivamente informale:</b> il registro va calibrato sul settore — un tono diretto e informale può funzionare per una startup, ma è controproducente per una banca o uno studio legale. Nel dubbio, un registro professionale ma naturale è la scelta più sicura.</li>
          <li><b>Ripetere gli stessi aggettivi generici del CV:</b> "motivato", "dinamico", "orientato al risultato" senza un fatto a supporto sono percepiti come riempitivo. Ogni affermazione nella lettera deve poter essere ricondotta a un esempio concreto, anche solo accennato.</li>
          <li><b>Lunghezza fuori controllo:</b> superare una pagina segnala che il candidato non sa selezionare le informazioni rilevanti — una competenza che il ruolo, quasi sempre, richiede comunque.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Quanto deve essere lunga una lettera di presentazione?', a: 'Tra le 250 e le 350 parole, in 3-4 paragrafi brevi. Il recruiter deve poterla leggere in meno di un minuto: oltre questa soglia il tasso di lettura completa crolla.' },
      { q: 'A chi va indirizzata la lettera se non conosco il nome del recruiter?', a: 'Cerca su LinkedIn il responsabile HR o il team lead della posizione. Se non lo trovi, usa "Gentile team di selezione di [Azienda]" — mai il generico "A chi di competenza".' },
      { q: 'La lettera di presentazione va allegata o scritta nel corpo della mail?', a: 'Se l’annuncio non specifica, scrivila nel corpo della mail e allega solo il CV: riduce la frizione e garantisce che venga letta. Nei portali di recruiting usa il campo dedicato.' },
      { q: 'Posso riutilizzare la stessa lettera per più candidature simili?', a: 'Puoi riusare la struttura, mai il contenuto identico: il paragrafo sul valore concreto e quello sull’allineamento culturale vanno riscritti per ogni azienda, altrimenti la personalizzazione — il punto di forza della lettera — viene meno.' },
      { q: 'La lettera di presentazione serve anche per le candidature tramite portale ATS?', a: 'Se il portale offre un campo dedicato, compilalo sempre: molti recruiter lo leggono prima ancora del CV. Se il campo è opzionale e l’annuncio non la richiede esplicitamente, valuta in base alla rilevanza descritta sopra (cambio settore, candidatura spontanea, ruoli comunicativi).' },
      { q: 'Come chiudo la lettera senza sembrare né passivo né aggressivo?', a: 'Una call-to-action efficace propone un passo concreto lasciando l’iniziativa al recruiter: "Sarei felice di approfondire in un breve colloquio come la mia esperienza possa contribuire al team" è più efficace di un generico "resto in attesa" o di un pressante "vi contatterò a breve".' },
    ],
    relatedSlugs: ['guida-cv', 'colloqui-domande-difficili', 'esempi-cv']
  },
  {
    slug: 'colloqui-domande-difficili',
    title: 'Colloquio di Lavoro: Come Rispondere alle Domande Più Difficili',
    subtitle: 'Da "Mi parli di lei" a "Qual è il suo più grande difetto": le risposte strategiche con il metodo STAR per convincere anche i selezionatori più esigenti.',
    metaDescription: 'Come rispondere alle domande difficili del colloquio di lavoro: metodo STAR, la domanda sui difetti, aspettative salariali. Con esempi di risposte.',
    category: 'COLLOQUIO',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '28 Giugno 2026',
    dateISO: '2026-06-28',
    readTime: '8 min di lettura',
    featured: false,
    trending: false,
    keyTakeaways: [
      'A "Mi parli di lei" non rispondere con la biografia: usa la formula Presente → Passato → Futuro centrata sul valore professionale.',
      'Sui difetti, la strategia vincente è trasparenza autentica + piano di miglioramento già in atto, con risultati misurabili.',
      'Il metodo STAR (Situazione, Task, Azione, Risultato) struttura qualsiasi risposta comportamentale in modo memorabile.',
    ],
    sections: [
      {
        id: 'metodo-star',
        title: 'Il metodo STAR per le domande comportamentali',
        content: `<p>Le aziende usano sempre più i <b>colloqui comportamentali (behavioral interview)</b>, basati sul principio che il comportamento passato è il miglior predittore delle performance future. "Mi racconti di una volta in cui ha gestito un conflitto nel team" non ammette risposte teoriche.</p>
        <p>Per rispondere in modo strutturato e memorabile, applica l'acronimo <b>STAR</b>:</p>
        <ul>
          <li><b>S — Situazione:</b> il contesto o la sfida iniziale, in massimo due frasi.</li>
          <li><b>T — Task:</b> la tua responsabilità esatta o il traguardo da raggiungere.</li>
          <li><b>A — Azione:</b> le decisioni e le azioni concrete che <i>tu personalmente</i> hai messo in campo.</li>
          <li><b>R — Risultato:</b> l'esito quantificato — tempo risparmiato, fatturato, qualità — e la lezione appresa.</li>
        </ul>
        <p>Prepara in anticipo 4-5 episodi STAR che coprano: un conflitto risolto, un errore da cui hai imparato, un risultato di cui vai fiero, una decisione presa sotto pressione.</p>`
      },
      {
        id: 'domande-classiche-risposte',
        title: 'La domanda trabocchetto: "Qual è il suo maggior difetto?"',
        content: `<p>È la domanda che mette in crisi il 60% dei candidati. Rispondere con falsi difetti che sembrano pregi (<i>"Sono troppo perfezionista"</i>, <i>"Lavoro troppo"</i>) è un campanello d'allarme di scarsa consapevolezza.</p>
        <p><b>La strategia corretta:</b> scegli un'area — tecnica o relazionale — su cui hai davvero incontrato difficoltà, e dimostra con esempi concreti i passi che hai già compiuto per superarla. Il recruiter non valuta il difetto: valuta la tua capacità di riconoscerlo e lavorarci.</p>`,
        callout: {
          title: 'Esempio di risposta efficace',
          text: '"In passato tendevo ad assumermi troppi compiti operativi senza delegare, creando colli di bottiglia sulle mie revisioni. Nell’ultimo anno ho introdotto stand-up giornalieri di 15 minuti per distribuire i carichi in modo bilanciato: l’autonomia del team è cresciuta e la puntualità di consegna è migliorata del 30%."',
          type: 'quote'
        }
      },
      {
        id: 'aspettative-salariali',
        title: '"Quali sono le sue aspettative economiche?"',
        content: `<p>Arrivare impreparati a questa domanda significa negoziare al ribasso. Le tre regole:</p>
        <ul>
          <li><b>Fai i compiti prima:</b> conosci i range del tuo CCNL e del tuo livello di inquadramento. Il nostro <a data-page="calcolo-stipendio" href="#">calcolatore di stipendio netto</a> ti aiuta a tradurre qualsiasi RAL in netto mensile, così ragioni su numeri concreti.</li>
          <li><b>Dai un range, non un numero secco:</b> "Considerando il ruolo e le responsabilità descritte, mi orienterei su una RAL tra X e Y" — con X già soddisfacente per te.</li>
          <li><b>Sposta il valore prima del prezzo:</b> se la domanda arriva troppo presto, riporta la conversazione sulle responsabilità del ruolo prima di dare cifre.</li>
        </ul>`
      },
      {
        id: 'colloqui-a-distanza',
        title: 'Colloqui video: gli accorgimenti che i candidati sottovalutano',
        content: `<p>Il colloquio a distanza — su Teams, Zoom o Google Meet — ha dinamiche proprie che vanno preparate quanto le risposte stesse: un candidato preparato sul contenuto ma trascurato sulla forma tecnica perde comunque punti.</p>
        <ul>
          <li><b>Ambiente e inquadratura:</b> sfondo neutro o sfocato, fonte di luce frontale (mai alle spalle), webcam all'altezza degli occhi. Un'inquadratura dal basso o troppo ravvicinata distrae più di quanto sembri.</li>
          <li><b>Test tecnico prima, non durante:</b> verifica connessione, microfono e piattaforma almeno 15 minuti prima. I problemi tecnici in apertura consumano tempo prezioso e comunicano disorganizzazione.</li>
          <li><b>Linguaggio del corpo compresso:</b> davanti alla camera i micro-segnali di attenzione (sguardo, cenni del capo) contano più che in presenza, perché è l'unico canale non verbale rimasto. Guarda l'obiettivo della camera, non lo schermo, quando parli tu.</li>
          <li><b>Colloqui asincroni registrati:</b> alcune aziende usano piattaforme in cui rispondi a domande preregistrate senza interlocutore dal vivo. In questi casi prepara le risposte STAR ancora più a fondo: non c'è modo di correggere il tiro in base al feedback non verbale del selezionatore.</li>
        </ul>`,
        callout: {
          title: 'Prima del colloquio, verifica il CV che l’azienda ha ricevuto',
          text: 'Il selezionatore ha quasi sempre il tuo CV aperto durante la videochiamata: assicurati che la versione inviata sia coerente con quanto racconterai, senza incongruenze di date o ruoli. Rivedi la <a data-page="blog-article" data-slug="guida-cv" href="#">guida al CV perfetto</a> prima di ogni colloquio importante.',
          type: 'tip'
        }
      },
      {
        id: 'punti-di-forza-e-domande-al-recruiter',
        title: '"Quali sono i suoi punti di forza?" e le domande da fare tu',
        content: `<p>Speculare alla domanda sui difetti, quella sui punti di forza sembra più facile ma nasconde una trappola simmetrica: elencare qualità generiche senza prove le rende inutili quanto un difetto finto.</p>
        <ul>
          <li><b>Scegli 2-3 punti di forza pertinenti al ruolo,</b> non i primi che vengono in mente: se ti candidi per un ruolo di project management, "capacità di coordinamento sotto scadenza" vale più di "creatività", anche se entrambi veri.</li>
          <li><b>Ogni punto di forza va agganciato a un episodio STAR breve:</b> l'affermazione senza esempio è percepita come autopromozione vuota, l'affermazione con un episodio concreto diventa un fatto verificabile.</li>
          <li><b>Le domande da fare a fine colloquio</b> sono parte della valutazione tanto quanto le risposte: dimostrano preparazione e interesse reale. Oltre alle domande su ruolo e team, una domanda sui prossimi passi del processo di selezione ("Quali sono i tempi previsti per la decisione?") è sempre appropriata e ben vista.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Come rispondere a "Mi parli di lei" al colloquio?', a: 'Usa la formula Presente → Passato → Futuro in 90 secondi: chi sei professionalmente oggi, le 2-3 esperienze che ti hanno portato qui, e perché questo ruolo è il passo naturale successivo. Niente biografia personale.' },
      { q: 'Cosa chiedere al recruiter a fine colloquio?', a: 'Sempre almeno due domande: una sul ruolo ("Come misurate il successo di questa posizione nei primi 6 mesi?") e una sul team o sull’azienda. Non fare domande su ferie e benefit al primo colloquio.' },
      { q: 'Come gestire la domanda sul perché ho lasciato il lavoro precedente?', a: 'Onestà senza negatività: mai parlare male dell’ex datore di lavoro. Inquadra l’uscita come ricerca di crescita ("cercavo un contesto con più responsabilità su X") e riporta subito il focus su ciò che ti attrae del nuovo ruolo.' },
      { q: 'Cosa fare se non ricordo numeri precisi per una risposta STAR?', a: 'Meglio una stima onesta ("circa il 20-25%", "un team di 6-8 persone") che un numero inventato o l’assenza totale di quantificazione: la stima ragionata comunica comunque impatto misurabile senza esporti a domande di verifica a cui non sapresti rispondere con precisione.' },
      { q: 'Come rispondere se non ho mai affrontato la situazione specifica che mi viene chiesta?', a: 'Non forzare un episodio che non esiste: è preferibile ammettere di non avere un esempio diretto e portarne uno affine, spiegando come applicheresti lo stesso approccio. La trasparenza è meglio percepita di un episodio STAR palesemente forzato.' },
      { q: 'Quanti colloqui sono normali prima di ricevere un’offerta?', a: 'Per ruoli impiegatizi standard, 2-3 colloqui (screening telefonico, colloquio tecnico o con il team, colloquio finale con il responsabile). Per posizioni executive o altamente specializzate il processo può estendersi a 4-5 incontri, inclusi eventuali assessment o casi pratici.' },
    ],
    relatedSlugs: ['guida-cv', 'lettera-presentazione', 'punteggio-ats']
  },
  {
    slug: 'esempi-cv',
    title: 'Esempi di CV Vincenti per Settore: IT, Marketing, HR e Neolaureati',
    subtitle: 'I modelli di curriculum più efficaci per ogni settore, con esempi reali di sommari e bullet point ad alto impatto da adattare al tuo profilo.',
    metaDescription: 'Esempi di CV vincenti per IT, marketing, vendite e neolaureati: modelli consigliati per settore e bullet point ad alto impatto da cui partire.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC',
    },
    date: '25 Giugno 2026',
    dateISO: '2026-06-25',
    readTime: '7 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'Ogni settore richiede una gerarchia visiva diversa: l’IT mette in risalto lo stack tecnico, il sales evidenzia ROI e budget gestiti.',
      'I neolaureati devono posizionare la formazione in alto e valorizzare tesi, stage, progetti universitari e certificazioni.',
      'Il bullet point efficace segue sempre lo schema: verbo d’azione + contesto + risultato quantificato.',
    ],
    sections: [
      {
        id: 'settore-tech-it',
        title: 'Sviluppatori e IT engineer: chiarezza sullo stack',
        content: `<p>I technical recruiter e gli engineering manager cercano immediatezza: una mappa rapida dello stack tecnologico dominato e prove d'impatto misurabile.</p>
        <ul>
          <li><b>Focus primario:</b> sezione competenze categorizzata per linguaggi, framework, cloud/DevOps e database. Lo stack va allineato alle keyword dell'annuncio per superare i <a data-page="blog-article" data-slug="punteggio-ats" href="#">filtri ATS</a>.</li>
          <li><b>Modelli consigliati:</b> Tecnico o Compatto — colonna singola, densità alta, zero decorazioni.</li>
          <li><b>Bullet point d’esempio:</b> <i>"Progettato un’architettura a microservizi in Node.js e TypeScript su AWS ECS per 150.000 utenti attivi giornalieri, riducendo i tempi di risposta delle API del 42% e i costi server del 20%."</i></li>
        </ul>`
      },
      {
        id: 'settore-marketing-sales',
        title: 'Marketing e sales: il CV è la prova del posizionamento',
        content: `<p>Nel marketing e nelle vendite il curriculum stesso dimostra la tua capacità di posizionare un prodotto ad alto valore: te stesso.</p>
        <ul>
          <li><b>Focus primario:</b> budget gestiti, crescita percentuale YoY, riduzione dei costi di acquisizione (CAC/CPA), team e agenzie coordinati.</li>
          <li><b>Modelli consigliati:</b> Executive o Modern — gerarchia visiva forte, sommario in evidenza.</li>
          <li><b>Bullet point d’esempio:</b> <i>"Guidato la strategia di performance marketing con budget annuo di 450.000€, generando +68% di fatturato e-commerce in 12 mesi tramite SEO e campagne di lead generation."</i></li>
        </ul>`
      },
      {
        id: 'neolaureati-junior',
        title: 'Neolaureati e profili junior: valorizzare il potenziale',
        content: `<p>Senza esperienza diretta, la struttura si ribalta: la <b>formazione va in alto</b>, e ogni attività che dimostra competenze trasferibili guadagna spazio.</p>
        <ul>
          <li><b>Tesi e progetti universitari:</b> descritti come esperienze, con obiettivo, metodo e risultato ("Tesi sperimentale su X: raccolti e analizzati N dati con Python, risultati presentati a Y").</li>
          <li><b>Stage, tirocini e lavori stagionali:</b> anche un lavoro in un settore diverso dimostra affidabilità, gestione del cliente e problem solving.</li>
          <li><b>Certificazioni e corsi:</b> Google, HubSpot, AWS, lingue con livello QCER — segnali concreti di proattività.</li>
        </ul>`,
        callout: {
          title: 'Scegli il modello giusto per il tuo settore',
          text: 'Tutti i modelli citati — Tecnico, Compatto, Executive, Modern e gli altri — sono disponibili nell’editor di ProntoCurriculum: stesso contenuto, impaginazione ricalibrata con un clic, export in PDF nitido.',
          type: 'tip'
        }
      },
      {
        id: 'settore-hr-people',
        title: 'HR e People: dimostrare impatto su persone e processi',
        content: `<p>Chi seleziona un profilo HR legge il CV con un'attenzione particolare: è il primo esempio pratico di come il candidato comunica e struttura informazioni su persone e processi.</p>
        <ul>
          <li><b>Focus primario:</b> metriche di processo (tempo medio di assunzione, tasso di retention, employee satisfaction), volumi gestiti (numero di posizioni aperte, dimensione del team supportato) e progetti di trasformazione (introduzione di un nuovo ATS, revisione delle politiche di welfare).</li>
          <li><b>Modelli consigliati:</b> Modern o Classico — equilibrio tra ordine formale e leggibilità immediata.</li>
          <li><b>Bullet point d'esempio:</b> <i>"Ridisegnato il processo di selezione per profili tecnici, riducendo il time-to-hire medio da 45 a 28 giorni e portando il tasso di accettazione delle offerte dal 70% all'88%."</i></li>
        </ul>`
      },
      {
        id: 'settore-cambio-carriera',
        title: 'CV per chi cambia settore: valorizzare le competenze trasferibili',
        content: `<p>Chi si candida in un settore diverso da quello di provenienza affronta uno scoglio in più: convincere il recruiter che l'esperienza pregressa, pur non essendo nello stesso ambito, è comunque rilevante.</p>
        <ul>
          <li><b>Riorganizza le esperienze per competenza, non solo per cronologia:</b> un blocco iniziale "Competenze trasferibili" che raggruppa gestione progetti, negoziazione o analisi dati aiuta il recruiter a fare il collegamento che altrimenti dovrebbe dedurre da solo.</li>
          <li><b>Usa il linguaggio del settore di destinazione,</b> non quello di provenienza: se ti sposti dalla ristorazione al retail management, parla di "gestione operativa del punto vendita" invece di terminologia specifica della ristorazione, anche quando descrivi la stessa competenza.</li>
          <li><b>Un corso, una certificazione o un progetto personale nel nuovo settore</b> — anche non professionale — segnala impegno reale nella transizione ed è spesso ciò che fa la differenza rispetto a un candidato che si limita a "riciclare" il vecchio CV.</li>
        </ul>
        <p>Per la parte narrativa della transizione, la <a data-page="blog-article" data-slug="lettera-presentazione" href="#">lettera di presentazione</a> è lo strumento in cui puoi spiegare esplicitamente il perché del cambiamento.</p>`
      }
    ],
    faq: [
      { q: 'Che CV deve fare un neolaureato senza esperienza?', a: 'Formazione in alto con voto ed eventuali lodi, tesi descritta come progetto con metodo e risultati, poi stage, progetti universitari, certificazioni e lingue. Una pagina, modello pulito, zero riempitivi.' },
      { q: 'Quali competenze mettere nel CV per il settore IT?', a: 'Lo stack effettivamente padroneggiato, categorizzato (linguaggi, framework, cloud, database) e allineato alle keyword dell’annuncio. Evita autovalutazioni grafiche a barre o stelle: gli ATS non le leggono.' },
      { q: 'Il CV creativo funziona per i ruoli di design?', a: 'Il portfolio è il posto per la creatività; il CV deve restare leggibile da ATS e recruiter. La scelta vincente è un CV pulito con link ben visibile al portfolio (Behance, Dribbble, sito personale).' },
      { q: 'Come si presenta un CV per un ruolo di vendita senza esperienza diretta nel settore?', a: 'Sposta l’attenzione sui risultati misurabili di vendita ottenuti altrove — anche in contesti diversi come raccolta fondi, vendita porta a porta o gestione clienti in altri ruoli — e quantifica sempre: numero di trattative chiuse, tasso di conversione, valore medio.' },
      { q: 'Conviene avere più versioni del CV per settori diversi?', a: 'Sì, se ti candidi in ambiti realmente diversi: mantenere due o tre versioni con sommario e ordine dei bullet calibrati sul settore aumenta sensibilmente il tasso di risposta rispetto a un unico CV generico.' },
      { q: 'Quanto contano i progetti personali (side project) nel CV di un profilo tecnico?', a: 'Molto, soprattutto per profili junior o in transizione: un repository pubblico, un’app pubblicata o un progetto open source dimostrano iniziativa e competenze verificabili. Inseriscili con un link diretto e una descrizione sintetica dell’impatto o della complessità tecnica.' },
    ],
    relatedSlugs: ['guida-cv', 'cv-europass', 'punteggio-ats']
  },
  {
    slug: 'trovare-lavoro-lombardia',
    title: 'Trovare Lavoro in Lombardia nel 2026: Settori, Canali e Strategie',
    subtitle: 'Milano per finance, tech e moda; Bergamo e Brescia per la manifattura avanzata: dove cercare, come candidarsi e quali stipendi aspettarsi.',
    metaDescription: 'Come trovare lavoro in Lombardia: settori trainanti a Milano e province, canali di candidatura più efficaci e consigli per il CV nel mercato lombardo.',
    category: 'MERCATO & TREND',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '16 Luglio 2026',
    dateISO: '2026-07-16',
    readTime: '7 min di lettura',
    keyTakeaways: [
      'Milano domina finance, tech, moda e consulenza; Bergamo, Brescia e Varese guidano manifattura avanzata e ingegneria meccanica.',
      'LinkedIn intercetta la grande maggioranza delle posizioni milanesi; per il resto della regione contano agenzie e canali pubblici regionali.',
      'Nel mercato lombardo la selezione è rapidissima: CV di una pagina, keyword ATS mirate e candidatura entro 48 ore dalla pubblicazione.'
    ],
    sections: [
      {
        id: 'settori-chiave-lombardia',
        title: 'I settori trainanti dell’economia lombarda',
        content: `<p>La Lombardia produce oltre un quinto del PIL nazionale (fonte: ISTAT) ed è il mercato del lavoro più liquido d'Italia. Le opportunità però cambiano molto da provincia a provincia:</p>
        <ul>
          <li><b>Milano e hinterland:</b> hub per servizi finanziari, consulenza strategica, tecnologia e digitale, moda, design e pubblicità. È anche il mercato più competitivo: per le posizioni corporate arrivano centinaia di candidature in pochi giorni.</li>
          <li><b>Bergamo e Brescia:</b> una delle aree manifatturiere e metalmeccaniche più dense d'Europa, con forte domanda di ingegneri di processo, progettisti CAD e operai specializzati. Qui il mismatch di competenze gioca a favore dei candidati tecnici qualificati.</li>
          <li><b>Monza e Brianza, Varese, Como:</b> industria del mobile e del design, aerospaziale, tessile di lusso e chimico-farmaceutico.</li>
        </ul>`
      },
      {
        id: 'come-candidarsi-lombardia',
        title: 'I canali più efficaci per candidarsi',
        content: `<p>Nel contesto lombardo l'invio passivo di candidature non basta. I canali che funzionano, in ordine di resa:</p>
        <ul>
          <li><b>LinkedIn:</b> la stragrande maggioranza delle posizioni milanesi viene gestita o promossa qui. Profilo allineato al CV, keyword di settore nel titolo e nella sezione informazioni, candidatura nelle prime 48 ore.</li>
          <li><b>Agenzie per il lavoro:</b> le sedi principali di Adecco, Randstad, Manpower e Gi Group operano in Lombardia. Per profili tecnici e operativi restano il canale più rapido.</li>
          <li><b>Canali pubblici regionali:</b> i Centri per l'Impiego lombardi e i servizi digitali di <a href="https://www.regione.lombardia.it" target="_blank" rel="noopener">Regione Lombardia</a> pubblicano quotidianamente offerte verificate, utili soprattutto per prime occupazioni e reinserimenti.</li>
          <li><b>Networking di settore:</b> a Milano eventi, meetup tech e associazioni professionali aprono l'accesso al mercato nascosto — le posizioni mai pubblicate.</li>
        </ul>`,
        callout: {
          title: 'Il consiglio del recruiter',
          text: 'A Milano la selezione è velocissima: CV di una pagina per profili junior e middle, modello compatto senza grafiche che confondano i parser, e tailoring sistematico sulle keyword dell’annuncio. Prima di negoziare, verifica il netto della RAL proposta con il nostro calcolatore di stipendio.',
          type: 'tip'
        }
      },
      {
        id: 'stipendi-lombardia',
        title: 'Stipendi e costo della vita: cosa aspettarsi',
        content: `<p>Le retribuzioni lombarde sono mediamente le più alte d'Italia, ma vanno lette insieme al costo della vita — soprattutto a Milano, dove gli affitti incidono pesantemente sul netto disponibile.</p>
        <ul>
          <li>Un impiegato qualificato (3°-4° livello CCNL Commercio) si colloca tipicamente tra i 23.000€ e i 27.000€ di RAL.</li>
          <li>Profili specialistici (digital, finance, ingegneria) superano facilmente i 35.000-45.000€ già a metà carriera.</li>
          <li>Per capire quanto resta in busta paga da una RAL, usa il <a data-page="calcolo-stipendio" href="#">calcolatore di stipendio netto</a> con l'addizionale regionale lombarda.</li>
        </ul>`
      },
      {
        id: 'province-minori-lombardia',
        title: 'Oltre Milano: Mantova, Pavia, Lecco, Cremona e le altre province',
        content: `<p>Concentrarsi solo sul capoluogo significa ignorare bacini occupazionali solidi, spesso meno competitivi in termini di numero di candidature per posizione:</p>
        <ul>
          <li><b>Mantova e Cremona:</b> agroindustria, packaging alimentare e meccanica di precisione, con distretti storicamente forti nell'export verso il Nord Europa.</li>
          <li><b>Pavia:</b> farmaceutico e biotecnologie, grazie alla presenza di poli universitari e centri di ricerca, oltre a una filiera logistica in espansione lungo l'asse Milano-Genova.</li>
          <li><b>Lecco e Sondrio:</b> metalmeccanica di precisione, componentistica per l'automotive e turismo montano, con una domanda costante di tecnici specializzati.</li>
          <li><b>Como e Varese:</b> tessile-serico di alta gamma, chimico e una crescente presenza di aziende svizzere e ticinesi, rilevante per chi valuta anche il <a data-page="blog-article" data-slug="lavorare-svizzera" href="#">lavoro frontaliero in Svizzera</a>.</li>
        </ul>
        <p>In queste province il rapporto candidature/posizioni è generalmente più favorevole che a Milano: un CV ben mirato sulle competenze tecniche richieste dal distretto locale può ottenere risposte più rapide.</p>`
      },
      {
        id: 'profili-senior-milano',
        title: 'Il mercato per profili senior e manageriali a Milano',
        content: `<p>Per ruoli di responsabilità (direzione, C-level, senior management) le dinamiche di ricerca cambiano rispetto ai profili junior e middle:</p>
        <ul>
          <li><b>Gli head hunter e le società di executive search</b> — non i portali di annunci — sono il canale dominante: costruire visibilità su LinkedIn con contenuti di settore e una rete di contatti qualificata aumenta la probabilità di essere contattati direttamente.</li>
          <li><b>Il CV supera spesso la pagina singola</b> per profili con 15+ anni di esperienza, ma deve restare organizzato per traguardi strategici — P&L gestiti, team costruiti, trasformazioni guidate — non per elenco cronologico di mansioni.</li>
          <li><b>Il networking di settore</b> (associazioni di categoria, alumni di business school, eventi ristretti) pesa più della candidatura diretta: a questo livello il mercato nascosto è la norma, non l'eccezione.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Quali sono i settori che assumono di più in Lombardia?', a: 'Tecnologia e digitale, servizi finanziari e consulenza a Milano; metalmeccanica e manifattura avanzata a Bergamo, Brescia e Varese; logistica lungo le direttrici autostradali. La domanda di profili tecnici qualificati supera stabilmente l’offerta.' },
      { q: 'Quanto ci vuole per trovare lavoro a Milano?', a: 'Per profili qualificati con CV ottimizzato e candidature mirate, i tempi medi vanno dalle 4 alle 10 settimane. La velocità di candidatura conta: le posizioni milanesi ricevono la maggior parte delle candidature nelle prime 72 ore.' },
      { q: 'Conviene candidarsi tramite agenzia o direttamente in azienda?', a: 'Entrambi in parallelo: le agenzie (Adecco, Randstad, Gi Group, Manpower) sono più rapide per profili tecnici e operativi, la candidatura diretta funziona meglio per ruoli impiegatizi e specialistici. Il CV va comunque ottimizzato ATS in entrambi i casi.' },
      { q: 'Conviene trasferirsi a Milano senza un’offerta già in mano?', a: 'È una scelta rischiosa vista l’incidenza del costo degli affitti sul netto disponibile: meglio condurre la ricerca da remoto, concentrare i colloqui in un’unica trasferta quando possibile, e trasferirsi solo a offerta firmata o in fase avanzatissima di selezione.' },
      { q: 'Le aziende lombarde offrono smart working?', a: 'È molto diffuso, soprattutto in tech, servizi finanziari e consulenza, spesso in formula ibrida (2-3 giorni in ufficio). Nella manifattura di Bergamo e Brescia resta invece marginale, per la natura stessa delle mansioni in linea o in officina.' },
      { q: 'Il costo della vita a Milano vale davvero lo stipendio più alto?', a: 'Dipende dal ruolo e dal quartiere: per profili qualificati con RAL corrispondentemente alta il differenziale spesso compensa il maggior costo degli affitti; per ruoli junior l’incidenza dell’affitto sul netto mensile può essere significativa. Confronta sempre la RAL netta con il calcolatore di stipendio prima di decidere.' },
    ],
    relatedSlugs: ['cercare-lavoro-piemonte', 'lavorare-veneto', 'guida-cv']
  },
  {
    slug: 'cercare-lavoro-piemonte',
    title: 'Trovare Lavoro in Piemonte nel 2026: Torino, Cuneo e le Nuove Filiere',
    subtitle: 'Dall’automotive in transizione all’aerospazio e all’AI: la mappa delle opportunità piemontesi e i canali giusti per intercettarle.',
    metaDescription: 'Come trovare lavoro in Piemonte: i settori in crescita a Torino (aerospazio, AI, automotive elettrico), le opportunità nelle province e i canali di candidatura.',
    category: 'MERCATO & TREND',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '14 Luglio 2026',
    dateISO: '2026-07-14',
    readTime: '6 min di lettura',
    keyTakeaways: [
      'Torino si sta trasformando da capitale automotive a hub di aerospazio, intelligenza artificiale e mobilità intelligente.',
      'Cuneo, Asti e Alba offrono opportunità solide nell’agroalimentare d’eccellenza e nella meccatronica.',
      'Per le aziende industriali piemontesi contano competenze pratiche, certificazioni e concretezza: il CV va costruito di conseguenza.'
    ],
    sections: [
      {
        id: 'settori-chiave-piemonte',
        title: 'I settori industriali e dei servizi in Piemonte',
        content: `<p>Il Piemonte unisce una tradizione industriale profonda a una transizione tecnologica in accelerazione. I poli principali:</p>
        <ul>
          <li><b>Torino metropolitana:</b> accanto alla filiera automotive — che si sposta verso elettrico e guida assistita — crescono il polo aerospaziale (Thales Alenia Space, Leonardo e indotto) e i centri di ricerca su intelligenza artificiale e software engineering, anche grazie al Politecnico.</li>
          <li><b>Cuneo e le Langhe:</b> capitale dell'agroalimentare d'eccellenza — filiera del vino, dolciario, macchine agricole — con marchi leader globali e domanda costante di profili tecnici e commerciali.</li>
          <li><b>Novara e Verbano-Cusio-Ossola:</b> integrate con l'economia lombarda, forti nel chimico, nella rubinetteria/valvolame e nel turismo dei laghi.</li>
        </ul>`
      },
      {
        id: 'come-cercare-lavoro-piemonte',
        title: 'Strategie per trovare lavoro a Torino e dintorni',
        content: `<p>I canali con la resa migliore nel mercato piemontese:</p>
        <ul>
          <li><b>Poli d’innovazione e incubatori:</b> il Politecnico di Torino e incubatori come I3P sono ponti diretti tra laureati e aziende tech. Molte startup torinesi assumono prima di pubblicare l'annuncio.</li>
          <li><b>Servizi pubblici regionali:</b> il portale della <a href="https://www.regione.piemonte.it" target="_blank" rel="noopener">Regione Piemonte</a> e i Centri per l'Impiego raccolgono le offerte del servizio pubblico, incluse le posizioni delle PMI locali che non passano dai grandi portali.</li>
          <li><b>Formazione tecnica superiore:</b> gli ITS piemontesi (meccatronica, aerospazio, ICT) hanno tassi di occupazione post-diploma vicini al 95% e canali diretti con le imprese del territorio.</li>
        </ul>`,
        callout: {
          title: 'Il CV per le aziende industriali',
          text: 'Per la manifattura piemontese adotta un modello Tecnico o Classico: elenco chiaro di macchinari, software CAD/CAM, certificazioni ISO e linguaggi padroneggiati. La concretezza batte l’estetica: niente grafiche, tutte le competenze in testo leggibile dagli ATS delle agenzie.',
          type: 'tip'
        }
      },
      {
        id: 'alessandria-resto-piemonte',
        title: 'Alessandria, Asti e il Piemonte oltre l’area torinese',
        content: `<p>Le province meno centrali offrono opportunità distinte, spesso con minore pressione competitiva rispetto al capoluogo:</p>
        <ul>
          <li><b>Alessandria:</b> logistica (crocevia tra Liguria, Lombardia e Piemonte), chimica e plastica di precisione, con diverse multinazionali che hanno stabilimenti produttivi nel territorio.</li>
          <li><b>Asti:</b> agroalimentare e vitivinicolo di fascia alta, in continuità con il distretto di Cuneo, oltre a una filiera dolciaria consolidata.</li>
          <li><b>Biella:</b> distretto tessile-laniero storico, oggi orientato verso produzioni di alta gamma e tecnologie di finissaggio avanzate, con domanda di profili tecnici specializzati.</li>
          <li><b>Verbano-Cusio-Ossola:</b> rubinetteria e valvolame di precisione, oltre al turismo lacuale che genera domanda stagionale in HoReCa, in modo simile a quanto avviene sul <a data-page="blog-article" data-slug="lavorare-veneto" href="#">lago di Garda in Veneto</a>.</li>
        </ul>`
      },
      {
        id: 'pubblica-amministrazione-piemonte',
        title: 'Lavorare per la Pubblica Amministrazione in Piemonte',
        content: `<p>La Regione, gli enti locali e le aziende sanitarie piemontesi pubblicano regolarmente concorsi pubblici che rappresentano un canale spesso sottovalutato:</p>
        <ul>
          <li><b>Dove cercare i bandi:</b> oltre al portale nazionale inPA, la sezione concorsi del sito della Regione Piemonte e i siti dei singoli enti locali pubblicano bandi specifici per il territorio.</li>
          <li><b>Formato richiesto:</b> nella quasi totalità dei casi il CV Europass è obbligatorio; approfondisci come compilarlo senza sprecare spazio nella <a data-page="blog-article" data-slug="cv-europass" href="#">guida dedicata all'Europass</a>.</li>
          <li><b>Tempistiche più lunghe:</b> i concorsi pubblici hanno processi selettivi strutturati su mesi, tra prove scritte, orali e formazione delle graduatorie: chi valuta questo canale deve mettere in conto tempi di attesa superiori rispetto al privato.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Torino offre ancora opportunità nell’automotive?', a: 'Sì, ma trasformate: la domanda si è spostata su elettrificazione, software di bordo, batterie e guida assistita. I profili meccanici tradizionali trovano più spazio riqualificandosi verso meccatronica e processi di produzione avanzati.' },
      { q: 'Quali sono gli stipendi medi in Piemonte?', a: 'Leggermente inferiori alla Lombardia a parità di ruolo, ma con costo della vita più basso: un impiegato metalmeccanico di livello C2-C3 si colloca tipicamente tra i 25.000€ e i 29.000€ di RAL. Nota che l’addizionale IRPEF regionale piemontese è tra le più alte d’Italia.' },
      { q: 'Come funzionano gli ITS e conviene iscriversi?', a: 'Gli Istituti Tecnici Superiori offrono percorsi biennali post-diploma co-progettati con le imprese. In Piemonte i tassi di occupazione a 12 mesi dal diploma superano il 90%: per chi cerca ingresso rapido nell’industria sono tra le scelte più efficaci.' },
      { q: 'Le startup torinesi assumono profili junior?', a: 'Sì, soprattutto quelle nate nell’orbita del Politecnico e degli incubatori come I3P: per un neolaureato in ambito tecnico o AI possono essere un ingresso più rapido rispetto alle grandi aziende strutturate, anche se spesso con retribuzioni iniziali più contenute.' },
      { q: 'Conviene trasferirsi a Torino da fuori regione per cercare lavoro?', a: 'Se il proprio settore coincide con i poli di forza del territorio (aerospazio, automotive elettrico, AI), sì: la concentrazione di aziende specializzate rende la ricerca più mirata. Per settori generalisti è preferibile condurre la ricerca da remoto prima di trasferirsi.' },
      { q: 'Il Piemonte ha una buona offerta di lavoro per neolaureati non tecnici?', a: 'È più contenuta rispetto ai profili STEM: i settori economia, servizi e comunicazione trovano opportunità principalmente a Torino città, spesso in aziende di dimensioni medie. Ampliare la ricerca anche verso Milano, a un’ora di treno, è una strategia comune tra i neolaureati piemontesi.' },
    ],
    relatedSlugs: ['trovare-lavoro-lombardia', 'lavorare-veneto', 'esempi-cv']
  },
  {
    slug: 'lavorare-veneto',
    title: 'Lavorare in Veneto nel 2026: Distretti, Assunzioni e Come Candidarsi',
    subtitle: 'Dalla metalmeccanica di Vicenza all’occhialeria di Belluno, fino al turismo della costa: la guida ai distretti veneti e alle strategie di candidatura per le PMI.',
    metaDescription: 'Come trovare lavoro in Veneto: distretti industriali (metalmeccanica, occhialeria, moda), turismo, e come farsi assumere dalle PMI del Nord-Est.',
    category: 'MERCATO & TREND',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '12 Luglio 2026',
    dateISO: '2026-07-12',
    readTime: '6 min di lettura',
    keyTakeaways: [
      'Il Veneto ha uno dei tassi di disoccupazione più bassi d’Italia e un tessuto di PMI d’eccellenza che fatica a trovare candidati qualificati.',
      'Vicenza e Padova guidano metalmeccanica, oreficeria e logistica; Treviso moda e arredamento; Belluno l’occhialeria; Venezia e Verona il turismo.',
      'Con le PMI venete vincono concretezza e proattività: CV mirato, risultati misurabili e disponibilità dimostrata.'
    ],
    sections: [
      {
        id: 'tessuto-economico-veneto',
        title: 'I distretti industriali e turistici del Veneto',
        content: `<p>Il Veneto è la regione dei distretti produttivi specializzati, ciascuno con la propria domanda di profili:</p>
        <ul>
          <li><b>Vicenza e Padova:</b> metalmeccanica, lavorazione dell'oro e logistica del Nord-Est. Domanda costante di tecnici, manutentori e ingegneri di processo.</li>
          <li><b>Treviso (la Marca):</b> distretto mondiale di calzatura sportiva, abbigliamento e arredamento, con l'indotto di grandi gruppi del fashion.</li>
          <li><b>Belluno:</b> leader globale nella progettazione e produzione di occhiali (Luxottica e indotto), con richiesta continua di operatori specializzati e profili tecnici.</li>
          <li><b>Venezia, Verona e costa adriatica:</b> prima destinazione turistica d'Italia per presenze straniere: flusso costante di assunzioni in HoReCa, alberghiero e servizi, con forte stagionalità.</li>
        </ul>`
      },
      {
        id: 'consigli-selezione-veneto',
        title: 'Come farsi assumere dalle PMI venete',
        content: `<p>Il tessuto veneto è fatto in gran parte di piccole e medie imprese, familiari o manageriali. Le regole per conquistarle:</p>
        <ul>
          <li><b>Dimostra concretezza:</b> nel CV, nella lettera e al colloquio adotta un tono pragmatico centrato sui risultati ottenuti — le PMI diffidano dei profili tutto-teoria.</li>
          <li><b>Usa i canali locali:</b> oltre a Indeed e InfoJobs, le associazioni di categoria (Confindustria Veneto, Confartigianato) e il portale <a href="https://www.cliclavoroveneto.it" target="_blank" rel="noopener">ClicLavoro Veneto</a> pubblicano offerte che non arrivano sui grandi portali.</li>
          <li><b>Per il turismo, valorizza lingue e flessibilità:</b> tedesco e inglese in primis (con livello QCER), disponibilità nei weekend e nelle stagioni di punta.</li>
        </ul>`,
        callout: {
          title: 'Ottimizzazione ATS per il Nord-Est',
          text: 'Le PMI venete affidano sempre più spesso la pre-selezione ad agenzie esterne che usano software ATS. Scrivi le competenze in chiaro — gestione clienti, controllo qualità, logistica, macchinari specifici — per superare i loro filtri digitali.',
          type: 'ats'
        }
      },
      {
        id: 'rovigo-bassa-padovana',
        title: 'Rovigo, la bassa padovana e le aree meno battute',
        content: `<p>L'area meridionale del Veneto, spesso trascurata nelle ricerche di lavoro, ha un tessuto produttivo proprio da non sottovalutare:</p>
        <ul>
          <li><b>Rovigo e il Polesine:</b> agroindustria, packaging e una crescente presenza di logistica legata alla vicinanza con l'asta del Po e i collegamenti verso l'Emilia-Romagna.</li>
          <li><b>Bassa padovana:</b> meccanica di subfornitura per la filiera automotive e metalmeccanica del Nord-Est, con numerose aziende terziste di dimensioni medio-piccole.</li>
          <li><b>Vantaggio competitivo per il candidato:</b> in queste aree il numero di candidature per posizione è generalmente più basso che nei poli maggiori, e le aziende faticano di più a coprire ruoli tecnici specializzati — un mismatch che gioca a favore di periti e tecnici qualificati disposti a un pendolarismo più esteso.</li>
        </ul>`
      },
      {
        id: 'contratti-apprendistato-pmi-venete',
        title: 'Contratti e apprendistato: come entrano davvero i giovani nelle PMI venete',
        content: `<p>Per chi è alle prime esperienze, capire la forma contrattuale con cui le PMI venete assumono aiuta a impostare aspettative realistiche e a negoziare meglio:</p>
        <ul>
          <li><b>Apprendistato professionalizzante:</b> è la porta d'ingresso più comune per profili tecnici under 30 nelle aziende manifatturiere venete, con un percorso formativo strutturato e un regime contributivo agevolato per l'azienda — informazioni di dettaglio nella guida ai <a data-page="blog-article" data-slug="bonus-assunzioni-2026" href="#">bonus assunzioni 2026</a>.</li>
          <li><b>Tempo determinato con finalità di stabilizzazione:</b> molte PMI familiari preferiscono un periodo di prova esteso tramite contratto a termine prima dell'assunzione definitiva, soprattutto per ruoli operativi.</li>
          <li><b>Somministrazione tramite agenzia:</b> diffusa nei periodi di picco produttivo, specialmente nella metalmeccanica di Vicenza e Padova; può trasformarsi in assunzione diretta se il periodo di somministrazione va bene per entrambe le parti.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Quali figure cercano le aziende venete?', a: 'Il mismatch più forte riguarda profili tecnici: manutentori, saldatori qualificati, operatori CNC, ingegneri di processo e periti meccatronici. Nel turismo la domanda stagionale copre reception, sala, cucina e animazione, con precedenza a chi parla tedesco e inglese.' },
      { q: 'Il lavoro stagionale nel turismo veneto conviene?', a: 'Può essere un ottimo ingresso: le strutture della costa adriatica e del Garda ricontrattano ogni anno il personale migliore, e molte trasformano gli stagionali validi in contratti continuativi su più strutture. Nel CV evidenzia lingue e flessibilità oraria.' },
      { q: 'Che stipendi offre il Veneto?', a: 'In linea con la media del Nord: un operaio specializzato metalmeccanico si colloca tra i 24.000€ e i 28.000€ di RAL, un impiegato commerciale estero con tedesco fluente può superare i 32.000€. L’addizionale regionale veneta è tra le più basse del Nord Italia.' },
      { q: 'Come mi presento a un colloquio con una PMI familiare veneta?', a: 'Con concretezza e senza eccesso di formalismo: chi seleziona è spesso il titolare stesso o un familiare stretto, e valuta affidabilità, disponibilità e capacità pratica più della forma. Prepara comunque risposte STAR precise: la sostanza resta decisiva.' },
      { q: 'Vale la pena candidarsi a Belluno se non lavoro nell’occhialeria?', a: 'Sì: oltre al distretto dell’occhiale, l’area ha un tessuto di turismo montano e piccola manifattura collegata all’indotto Luxottica (logistica, componentistica, servizi) che assorbe anche profili non direttamente specializzati nell’ottica.' },
      { q: 'Le aziende venete assumono candidati provenienti da altre regioni?', a: 'Sì, soprattutto per ruoli tecnici scarsi sul mercato locale: molte PMI offrono supporto alla ricerca casa o un periodo di alloggio temporaneo per profili qualificati disposti a trasferirsi, specie nella metalmeccanica di Vicenza e Padova.' },
    ],
    relatedSlugs: ['trovare-lavoro-lombardia', 'cercare-lavoro-piemonte', 'esempi-cv']
  },
  {
    slug: 'lavorare-estero',
    title: 'Cercare Lavoro all’Estero nel 2026: la Guida Pratica per Italiani',
    subtitle: 'Adattare il CV agli standard internazionali, scegliere i canali giusti (EURES, LinkedIn, job board locali) e superare le selezioni delle aziende europee.',
    metaDescription: 'Come cercare lavoro all’estero: adattare il CV agli standard di ogni Paese (UK, Germania), usare EURES e LinkedIn, e superare le selezioni internazionali.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '10 Luglio 2026',
    dateISO: '2026-07-10',
    readTime: '7 min di lettura',
    keyTakeaways: [
      'Il formato del CV cambia radicalmente da Paese a Paese: nel mondo anglosassone foto, data di nascita e stato civile vanno omessi.',
      'LinkedIn è lo standard globale, ma il portale pubblico EURES offre offerte verificate e supporto gratuito alla mobilità europea.',
      'Una cover letter focalizzata sull’impatto professionale è ciò che distingue il candidato internazionale da quelli locali.'
    ],
    sections: [
      {
        id: 'adattare-cv-estero',
        title: 'Come strutturare il CV internazionale',
        content: `<p>Candidarsi all'estero non significa tradurre letteralmente il CV italiano: ogni mercato ha consuetudini precise, e ignorarle costa lo screening.</p>
        <ul>
          <li><b>Regno Unito, Irlanda, USA (resume/CV):</b> niente foto, data di nascita, nazionalità o stato civile — includerli può portare allo scarto immediato per policy anti-discriminazione. Focus totale sui risultati.</li>
          <li><b>Germania e Austria (Lebenslauf):</b> struttura formale e cronologica, spesso accompagnata da referenze e attestati (Arbeitszeugnisse). La foto professionale qui è ancora comune.</li>
          <li><b>Francia:</b> CV di una pagina rigorosa, con attenzione ai titoli di studio e alle grandes écoles; la lettre de motivation resta quasi sempre attesa.</li>
          <li><b>Verbi d’azione in inglese:</b> all'estero le mansioni descrittive contano poco. Apri ogni bullet con Managed, Led, Improved, Reduced, Delivered — sempre seguiti da un numero.</li>
        </ul>`
      },
      {
        id: 'canali-ricerca-estero',
        title: 'Dove cercare le offerte internazionali',
        content: `<p>I canali con il miglior rapporto segnale/rumore per chi parte dall'Italia:</p>
        <ul>
          <li><b>LinkedIn:</b> filtra per Paese e imposta gli avvisi su "English speaking jobs" se non padroneggi ancora la lingua locale. Il profilo va riscritto in inglese, non solo tradotto.</li>
          <li><b>EURES:</b> il portale ufficiale della mobilità professionale europea (<a href="https://eures.europa.eu" target="_blank" rel="noopener">eures.europa.eu</a>) aggrega migliaia di offerte verificate, con consulenti gratuiti e in alcuni casi contributi economici per trasferimento e corsi di lingua.</li>
          <li><b>Job board nazionali:</b> StepStone per la Germania, Welcome to the Jungle per la Francia, i portali IT specializzati per il Regno Unito.</li>
        </ul>`,
        callout: {
          title: 'La cover letter internazionale',
          text: 'Con il generatore di lettere di presentazione AI di ProntoCurriculum crei cover letter persuasive in inglese, francese o tedesco, calibrate sull’azienda e sul ruolo — il fattore che più spesso distingue il candidato estero da quelli locali.',
          type: 'tip'
        }
      },
      {
        id: 'colloquio-internazionale-differenze-culturali',
        title: 'Il colloquio internazionale: differenze culturali da conoscere',
        content: `<p>Superare lo screening del CV è solo metà del percorso: le aspettative comportamentali durante il colloquio cambiano da Paese a Paese, e un candidato italiano preparato solo sui contenuti rischia di essere percepito come fuori registro.</p>
        <ul>
          <li><b>Mondo anglosassone (UK, USA, Irlanda):</b> il colloquio comportamentale con il metodo STAR è lo standard assoluto — vedi la nostra guida alle <a data-page="blog-article" data-slug="colloqui-domande-difficili" href="#">domande difficili del colloquio</a>. Ci si aspetta un tono sicuro di sé, quasi da "venditore di se stessi": la modestia eccessiva viene letta come mancanza di fiducia.</li>
          <li><b>Germania e Austria:</b> il processo è più formale e strutturato, con domande dirette sulle competenze tecniche verificabili. La puntualità è un requisito implicito non negoziabile: anche pochi minuti di ritardo, anche per un colloquio video, sono percepiti molto negativamente.</li>
          <li><b>Paesi nordici:</b> il colloquio tende a essere paritario e informale nella forma, ma sostanziale nei contenuti; il fit con la cultura aziendale (spesso orientata al consenso e al lavoro di squadra orizzontale) pesa quanto le competenze tecniche.</li>
          <li><b>Francia:</b> grande attenzione al percorso formativo e al prestigio dell'istituto di provenienza, oltre a un registro linguistico formale anche in inglese; la lettre de motivation viene spesso ripresa esplicitamente durante il colloquio.</li>
        </ul>`
      },
      {
        id: 'fiscalita-trasferimento-estero',
        title: 'Fiscalità e trasferimento: cosa verificare prima di accettare un’offerta',
        content: `<p>Un'offerta economicamente allettante può rivelarsi meno vantaggiosa del previsto se non si verificano in anticipo alcuni aspetti pratici:</p>
        <ul>
          <li><b>Residenza fiscale:</b> il trasferimento all'estero comporta il cambio di residenza fiscale solo dopo un certo numero di giorni di permanenza nell'anno; finché non avviene, si può restare soggetti a doppia tassazione se non gestito correttamente. Consulta sempre un commercialista esperto in fiscalità internazionale prima di accettare.</li>
          <li><b>Costo della vita reale, non solo lo stipendio lordo:</b> confronta sempre il netto disponibile dopo tasse, affitto e assicurazione sanitaria, non lo stipendio lordo annunciato — la differenza tra Paesi può essere sostanziale a parità di RAL apparente.</li>
          <li><b>Supporto al trasferimento (relocation package):</b> molte aziende internazionali offrono un contributo per il trasloco, un alloggio temporaneo o un supporto per il visto: chiedi esplicitamente se non è menzionato nell'offerta, è una richiesta standard e non indebolisce la trattativa.</li>
          <li><b>Continuità previdenziale:</b> verifica come il periodo di lavoro all'estero verrà considerato ai fini della pensione italiana, soprattutto se prevedi di rientrare: gli accordi di sicurezza sociale variano da Paese a Paese.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Serve tradurre il CV in inglese anche per Paesi non anglofoni?', a: 'Per multinazionali e ruoli qualificati l’inglese è quasi sempre accettato e spesso preferito. Per PMI locali e ruoli a contatto col pubblico, il CV nella lingua del Paese aumenta sensibilmente le risposte: valuta una doppia versione.' },
      { q: 'Cos’è EURES e come funziona?', a: 'È la rete europea dei servizi per l’impiego, coordinata dalla Commissione Europea: aggrega offerte verificate in tutta l’UE, offre consulenti gratuiti per la mobilità e programmi come Targeted Mobility Scheme con contributi per colloqui all’estero e trasferimento.' },
      { q: 'Come dimostro il livello di lingua nel CV internazionale?', a: 'Con il quadro QCER (A1-C2) per le lingue europee, e con certificazioni riconosciute quando le hai (IELTS, TOEFL, Goethe, DELF). Le autovalutazioni generiche ("buon inglese") non vengono considerate dai recruiter internazionali.' },
      { q: 'Conviene passare da un’agenzia di recruiting internazionale o candidarsi direttamente?', a: 'Per profili molto ricercati (ingegneria, IT, sanità) le agenzie specializzate nella mobilità internazionale possono velocizzare il processo e gestire aspetti pratici come visti e relocation. Per la maggior parte dei ruoli, la candidatura diretta su LinkedIn o sul sito aziendale resta il canale principale.' },
      { q: 'I titoli di studio italiani vengono riconosciuti automaticamente all’estero?', a: 'Dipende dal Paese e dalla professione: per le professioni regolamentate (medicina, ingegneria con albo, insegnamento) è spesso necessaria una procedura di riconoscimento formale, mentre per la maggior parte dei ruoli privati basta la descrizione chiara del percorso nel CV.' },
      { q: 'Cosa cambia nel colloquio se è condotto da un recruiter che non è madrelingua della posizione?', a: 'Capita spesso nelle multinazionali con team di recruiting centralizzati: il livello di inglese richiesto in questi casi è generalmente più permissivo di un colloquio con un madrelingua, ma la chiarezza espositiva resta comunque decisiva per superare lo step successivo.' },
    ],
    relatedSlugs: ['lavorare-svizzera', 'guida-cv', 'lettera-presentazione']
  },
  {
    slug: 'lavorare-svizzera',
    title: 'Lavorare in Svizzera da Italiani nel 2026: Stipendi, Permessi e Frontalieri',
    subtitle: 'Salari, costo della vita, permessi G e B, il nuovo regime fiscale dei frontalieri e come presentare una candidatura all’altezza degli standard svizzeri.',
    metaDescription: 'Lavorare in Svizzera da italiani: stipendi medi, permessi di lavoro (G e B), tassazione dei frontalieri e come candidarsi con successo.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '6 Luglio 2026',
    dateISO: '2026-07-06',
    readTime: '8 min di lettura',
    keyTakeaways: [
      'Gli stipendi svizzeri sono tra i più alti al mondo: un impiegato di concetto guadagna mediamente 5.000-7.000 CHF lordi al mese.',
      'La distinzione chiave è tra residenti (permesso B/C) e frontalieri (permesso G) che risiedono in Italia e attraversano il confine.',
      'Il nuovo accordo fiscale Italia-Svizzera ha cambiato la tassazione dei "nuovi frontalieri": informarsi prima di accettare è essenziale.'
    ],
    sections: [
      {
        id: 'stipendi-costo-vita',
        title: 'Stipendi svizzeri e costo della vita',
        content: `<p>Lo stipendio medio svizzero è molto allettante per un lavoratore italiano, ma va sempre bilanciato con il costo della vita locale, tra i più alti al mondo:</p>
        <ul>
          <li><b>Salari medi:</b> un impiegato di concetto guadagna tra 5.000 e 7.000 CHF lordi mensili; figure ad alta specializzazione (medici, sviluppatori senior, project manager) superano facilmente i 9.000-11.000 CHF.</li>
          <li><b>Costo della vita:</b> affitti, cassa malati obbligatoria (l'assicurazione sanitaria privata, da stipulare per legge) e spesa quotidiana assorbono una quota importante del reddito per chi risiede in Svizzera.</li>
          <li><b>Il vantaggio del frontaliere:</b> chi risiede nella fascia di confine italiana e lavora in Ticino o nei Grigioni percepisce stipendi svizzeri sostenendo il costo della vita italiano. L'accordo fiscale Italia-Svizzera in vigore dal 2024 ha però introdotto la tassazione concorrente per i "nuovi frontalieri": il netto reale va calcolato caso per caso.</li>
        </ul>`
      },
      {
        id: 'permessi-candidatura-svizzera',
        title: 'Permessi di lavoro e candidatura',
        content: `<p>I cittadini italiani godono della libera circolazione, ma per lavorare serve un permesso rilasciato dal Cantone su richiesta del datore di lavoro:</p>
        <ul>
          <li><b>Permesso G (frontalieri):</b> per chi lavora in Svizzera e rientra al domicilio estero almeno una volta a settimana.</li>
          <li><b>Permesso B (dimoranti):</b> validità di 5 anni, concesso con un contratto svizzero di durata superiore a un anno e trasferimento di residenza.</li>
          <li><b>Permesso C (domicilio):</b> il permesso di lungo periodo, ottenibile dopo anni di residenza continuativa.</li>
        </ul>
        <p>Sulla candidatura, gli standard svizzeri sono rigorosi: dossier completo con CV dettagliato, <b>certificati di lavoro</b> dei precedenti datori (Arbeitszeugnis / certificat de travail), diplomi e referenze. Un dossier incompleto viene scartato a prescindere dal profilo. Le informazioni ufficiali su permessi e procedure sono sul portale della Confederazione: <a href="https://www.ch.ch/it/lavoro" target="_blank" rel="noopener">ch.ch</a>.</p>`,
        callout: {
          title: 'Nota fiscale per i frontalieri',
          text: 'Se risiedi nelle province di Como, Varese, Sondrio, Verbano-Cusio-Ossola o Novara, consulta un commercialista per calcolare l’impatto del nuovo accordo fiscale tra Roma e Berna: la differenza tra vecchio e nuovo regime può valere diverse centinaia di euro al mese.',
          type: 'warning'
        }
      },
      {
        id: 'come-cercare-lavoro-in-svizzera',
        title: 'Come cercare lavoro in Svizzera: portali e head hunter',
        content: `<p>Il mercato svizzero ha canali di ricerca in parte diversi da quelli italiani, e conoscerli velocizza sensibilmente la ricerca:</p>
        <ul>
          <li><b>Portali generalisti:</b> jobs.ch e JobUp sono i riferimenti nazionali, con forte presenza anche di annunci in Ticino. LinkedIn resta comunque il canale più usato dai recruiter delle aziende internazionali con sede in Svizzera.</li>
          <li><b>Agenzie interinali e di collocamento:</b> Adecco, Manpower e le agenzie ticinesi locali gestiscono un volume enorme di posizioni, specialmente per profili tecnici e amministrativi; sono spesso il canale più rapido per i frontalieri alla prima esperienza.</li>
          <li><b>Uffici regionali di collocamento (URC):</b> per chi risiede in Svizzera, gli URC cantonali offrono supporto attivo alla ricerca ed è spesso obbligatorio iscriversi in caso di disoccupazione per mantenere il diritto alle indennità.</li>
          <li><b>Dossier di candidatura completo:</b> a differenza della prassi italiana, gli annunci svizzeri spesso richiedono l'invio di un "dossier" con CV, lettera di motivazione, copie dei diplomi e degli ultimi certificati di lavoro già al primo contatto, non solo in una fase avanzata.</li>
        </ul>`
      },
      {
        id: 'vita-da-frontaliere',
        title: 'Vita da frontaliere: pendolarismo e organizzazione pratica',
        content: `<p>Oltre agli aspetti economici e fiscali, la scelta di diventare frontaliere ha implicazioni pratiche quotidiane che vale la pena valutare in anticipo:</p>
        <ul>
          <li><b>Tempi di attraversamento del confine:</b> nelle ore di punta i valichi verso il Ticino (Chiasso, Ponte Chiasso, Brogeda) possono generare code prolungate; molti frontalieri organizzano orari di lavoro sfalsati o usano il treno regionale transfrontaliero dove disponibile.</li>
          <li><b>Conto bancario e valuta:</b> lo stipendio viene versato in franchi svizzeri; la maggior parte dei frontalieri apre un conto in banca svizzera per ridurre i costi di cambio e trasferimento verso l'Italia.</li>
          <li><b>Assistenza sanitaria e infortuni sul lavoro:</b> l'assicurazione contro gli infortuni professionali è generalmente coperta dal datore di lavoro svizzero secondo la LAINF; per le cure non legate al lavoro va invece definita la copertura tramite cassa malati o SSN italiano, come indicato nella cornice fiscale sopra.</li>
        </ul>
        <p>Per valutare l'impatto economico complessivo prima di accettare un'offerta, verifica sempre anche le condizioni del <a data-page="blog-article" data-slug="lavorare-estero" href="#">lavoro all'estero in generale</a> se stai confrontando la Svizzera con altre destinazioni europee.</p>`
      }
    ],
    faq: [
      { q: 'Quanto guadagna un frontaliere italiano in Svizzera?', a: 'Dipende da settore e Cantone: in Ticino gli stipendi sono mediamente più bassi che a Zurigo o Ginevra, ma un operaio specializzato parte comunque da circa 4.000-4.500 CHF lordi mensili, e un impiegato qualificato da 4.500-5.500 CHF. Al netto va considerato il regime fiscale applicabile (vecchi vs nuovi frontalieri).' },
      { q: 'Serve conoscere il tedesco o il francese per lavorare in Svizzera?', a: 'In Ticino basta l’italiano per molti ruoli. Nella Svizzera tedesca e romanda la lingua locale è quasi sempre richiesta per i ruoli a contatto con clienti e colleghi, mentre nelle multinazionali e nell’IT l’inglese può bastare.' },
      { q: 'Come funziona la cassa malati per chi lavora in Svizzera?', a: 'L’assicurazione sanitaria di base è obbligatoria e privata: costa indicativamente 250-450 CHF al mese a seconda di Cantone e franchigia. I frontalieri possono in alternativa optare per l’iscrizione al Servizio Sanitario Nazionale italiano: va valutato con un consulente.' },
      { q: 'Quanto tempo richiede ottenere il permesso G da frontaliere?', a: 'Solitamente il datore di lavoro svizzero avvia la procedura non appena firmato il contratto; i tempi variano da poche settimane a circa un mese a seconda del Cantone. Il permesso è legato al contratto di lavoro: cambiare datore richiede un aggiornamento.' },
      { q: 'Conviene aprire la partita IVA per lavorare come frontaliere autonomo?', a: 'È un caso distinto dal lavoro dipendente frontaliero, con regole fiscali e previdenziali diverse tra i due Paesi: richiede una valutazione specifica con un commercialista esperto in fiscalità transfrontaliera prima di procedere.' },
      { q: 'I titoli di studio italiani sono riconosciuti dai datori di lavoro svizzeri?', a: 'Nella maggior parte dei settori privati sì, senza procedure formali di equipollenza. Per le professioni regolamentate (sanità, ingegneria con iscrizione ad albo, insegnamento) può essere necessario un riconoscimento ufficiale tramite le autorità cantonali competenti.' },
    ],
    relatedSlugs: ['lavorare-estero', 'guida-cv', 'esempi-cv']
  },
  {
    slug: 'bonus-busta-paga-2026',
    title: 'Bonus in Busta Paga 2026: Cuneo Fiscale, Detrazioni e Fringe Benefit',
    subtitle: 'La guida alle misure che aumentano il netto dei lavoratori dipendenti: taglio del cuneo, nuove aliquote IRPEF a 3 scaglioni e soglie dei fringe benefit.',
    metaDescription: 'Bonus busta paga 2026: come funzionano il taglio del cuneo fiscale, le aliquote IRPEF a 3 scaglioni e i fringe benefit esentasse per i dipendenti.',
    category: 'MERCATO & TREND',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '4 Luglio 2026',
    dateISO: '2026-07-04',
    readTime: '6 min di lettura',
    keyTakeaways: [
      'Il taglio del cuneo fiscale (esonero contributivo INPS) vale fino a circa 100€ netti in più al mese per redditi sotto i 35.000€.',
      'I fringe benefit esentasse coprono anche bollette, affitto e mutuo prima casa, con soglia maggiorata per chi ha figli a carico.',
      'Le aliquote IRPEF a 3 scaglioni (23%, 35%, 43%) riducono il carico fiscale sul ceto medio rispetto al vecchio sistema a 4 scaglioni.'
    ],
    sections: [
      {
        id: 'esonero-contributivo-2026',
        title: 'Taglio del cuneo fiscale: chi ne ha diritto',
        content: `<p>L'esonero contributivo parziale — il "taglio del cuneo" — è uno sconto sui contributi previdenziali INPS a carico del lavoratore dipendente:</p>
        <ul>
          <li><b>Sconto del 7%:</b> per retribuzioni lorde mensili fino a 1.923€ (circa 25.000€ di RAL).</li>
          <li><b>Sconto del 6%:</b> per retribuzioni mensili tra 1.923€ e 2.692€ (RAL fino a circa 35.000€).</li>
          <li><b>Effetto in busta:</b> la misura è applicata automaticamente dal datore di lavoro e vale tra i 60€ e i 100€ netti in più al mese rispetto alle aliquote piene.</li>
        </ul>
        <p>Le circolari operative aggiornate sono pubblicate da <a href="https://www.inps.it" target="_blank" rel="noopener">INPS</a>. Per vedere l'effetto sulla tua busta paga, prova il <a data-page="calcolo-stipendio" href="#">calcolatore di stipendio netto</a>: applica automaticamente l'esonero in base alla RAL.</p>`
      },
      {
        id: 'fringe-benefits-2026',
        title: 'Fringe benefit e rimborsi esentasse',
        content: `<p>I fringe benefit sono beni e servizi erogati dall'azienda esenti da tasse e contributi entro soglie annue precise:</p>
        <ul>
          <li><b>Soglia ordinaria:</b> 1.000€ per la generalità dei dipendenti.</li>
          <li><b>Soglia maggiorata:</b> 2.000€ per i lavoratori con figli a carico.</li>
          <li><b>Spese ammesse:</b> oltre a buoni spesa e carburante, rientrano le utenze domestiche (acqua, luce, gas), l'affitto della prima casa e gli interessi sul mutuo prima casa.</li>
        </ul>
        <p>In fase di trattativa, un pacchetto welfare ben strutturato può valere quanto un aumento di RAL: 1.000€ di fringe benefit netti equivalgono a circa 1.800-2.000€ di RAL aggiuntiva tassata.</p>`,
        callout: {
          title: 'Calcola il tuo netto esatto',
          text: 'Vuoi verificare l’impatto reale di queste misure? Usa il calcolatore di stipendio netto di ProntoCurriculum: inserisci RAL, regione e carichi familiari e ottieni la stima mensile con esonero contributivo e detrazioni applicate.',
          type: 'tip'
        }
      },
      {
        id: 'verificare-corretta-applicazione',
        title: 'Come verificare che il datore applichi correttamente le misure',
        content: `<p>Le agevolazioni descritte sono automatiche, ma la busta paga resta un documento tecnico che vale la pena saper leggere per accorgersi di eventuali errori:</p>
        <ul>
          <li><b>Controlla la voce "esonero contributivo"</b> nel cedolino: deve comparire come riduzione separata dei contributi a tuo carico, non genericamente confusa con altre voci. Se manca e il tuo reddito rientra nelle soglie, segnalalo all'ufficio del personale.</li>
          <li><b>Verifica i fringe benefit dichiarati:</b> se l'azienda eroga buoni pasto, welfare o rimborsi utenze, chiedi un riepilogo annuale per assicurarti che il totale non superi la soglia esente — superarla senza saperlo può generare una sorpresa fiscale in dichiarazione dei redditi.</li>
          <li><b>Confronta il netto mensile con una simulazione indipendente:</b> uno scostamento significativo e non spiegato tra la busta paga e una simulazione basata su RAL, regione e carichi familiari dichiarati è un segnale da approfondire con l'ufficio HR o un consulente del lavoro.</li>
        </ul>`
      },
      {
        id: 'cosa-e-cambiato-rispetto-al-passato',
        title: 'Cosa è cambiato rispetto al sistema precedente',
        content: `<p>Per chi ha cambiato lavoro o ha semplicemente notato differenze nel proprio netto rispetto agli anni scorsi, alcuni riferimenti utili per orientarsi:</p>
        <ul>
          <li><b>Il passaggio dal bonus in busta al taglio contributivo strutturale</b> ha reso il beneficio più stabile anno su anno rispetto alle misure precedenti, spesso rinnovate di anno in anno con importi variabili.</li>
          <li><b>Il consolidamento delle aliquote IRPEF</b> a un numero ridotto di scaglioni ha semplificato il calcolo dell'imposta, ma l'effetto pratico sul netto va sempre verificato caso per caso perché dipende anche da detrazioni per lavoro dipendente e carichi familiari.</li>
          <li><b>I fringe benefit</b> hanno visto ampliarsi progressivamente le voci di spesa ammesse (dalle sole utenze domestiche fino ad affitto e mutuo prima casa): verifica sempre la normativa vigente nell'anno di riferimento, perché soglie e voci ammesse sono soggette a modifiche in ogni legge di bilancio.</li>
        </ul>
        <p>Per capire come queste misure si intrecciano con la ricerca di un nuovo lavoro, leggi anche la guida ai <a data-page="blog-article" data-slug="bonus-assunzioni-2026" href="#">bonus assunzioni 2026</a>, che agiscono sul lato del datore di lavoro.</p>`
      }
    ],
    faq: [
      { q: 'Il taglio del cuneo fiscale va richiesto o è automatico?', a: 'È automatico: il datore di lavoro applica l’esonero direttamente in busta paga in base alla retribuzione imponibile mensile. Non serve alcuna domanda del lavoratore.' },
      { q: 'Cosa succede se supero la soglia dei fringe benefit?', a: 'Se il valore complessivo supera la soglia annua (1.000€ o 2.000€ con figli), l’intero importo — non solo l’eccedenza — diventa imponibile ai fini fiscali e contributivi. Il monitoraggio della soglia è responsabilità del datore di lavoro.' },
      { q: 'Le nuove aliquote IRPEF quanto fanno risparmiare?', a: 'Il consolidamento a 3 scaglioni (23% fino a 28.000€, 35% fino a 50.000€, 43% oltre) riduce l’imposta soprattutto per i redditi tra 15.000€ e 28.000€ rispetto al vecchio sistema. L’effetto esatto dipende da detrazioni e addizionali locali.' },
      { q: 'Il taglio del cuneo fiscale vale anche per i contratti part-time?', a: 'Sì, l’esonero si applica in proporzione alla retribuzione imponibile effettiva, quindi anche ai contratti part-time, purché la retribuzione mensile rientri nelle soglie previste.' },
      { q: 'Le addizionali regionali e comunali IRPEF influenzano il beneficio del taglio del cuneo?', a: 'Sono misure distinte: il taglio del cuneo agisce sui contributi previdenziali, le addizionali locali sull’imposta IRPEF. Il netto finale in busta paga riflette entrambi gli effetti insieme, motivo per cui a parità di RAL il netto può variare da regione a regione.' },
      { q: 'Cosa succede al taglio del cuneo fiscale se cambio lavoro a metà anno?', a: 'Il nuovo datore di lavoro applica l’esonero in base alla retribuzione imponibile del nuovo rapporto, senza necessità di comunicazioni particolari da parte tua: la misura è collegata al singolo rapporto di lavoro in corso, non cumulata tra più datori nello stesso anno.' },
    ],
    relatedSlugs: ['bonus-assunzioni-2026', 'guida-cv', 'punteggio-ats']
  },
  {
    slug: 'bonus-assunzioni-2026',
    title: 'Bonus Assunzioni 2026: Sgravi per Under 35, Donne e Mezzogiorno',
    subtitle: 'Come funzionano gli esoneri contributivi per chi assume a tempo indeterminato — e perché conoscerli dà un vantaggio concreto anche al candidato.',
    metaDescription: 'Bonus assunzioni 2026: sgravi contributivi per under 35, donne e Sud Italia. Requisiti, importi e come il candidato può sfruttarli in fase di selezione.',
    category: 'MERCATO & TREND',
    author: {
      name: 'Redazione ProntoCurriculum',
      role: 'Career Advisory Team · ProntoCurriculum',
      initials: 'PC'
    },
    date: '2 Luglio 2026',
    dateISO: '2026-07-02',
    readTime: '5 min di lettura',
    keyTakeaways: [
      'Le aziende che assumono under 35 a tempo indeterminato beneficiano di un esonero contributivo fino a 500€ mensili per 36 mesi.',
      'Sgravi al 100% anche per l’assunzione di donne prive di impiego regolarmente retribuito da almeno 6 o 24 mesi.',
      'Per il candidato, rientrare nei requisiti è una leva negoziale concreta: il costo aziendale dell’assunzione si riduce sensibilmente.'
    ],
    sections: [
      {
        id: 'bonus-giovani-under35',
        title: 'Sgravio contributivo per l’assunzione di giovani',
        content: `<p>Per incentivare l'occupazione stabile delle nuove generazioni, la normativa prevede agevolazioni significative sui contratti a tempo indeterminato:</p>
        <ul>
          <li><b>Requisito anagrafico:</b> il candidato non deve aver compiuto 35 anni e non deve essere mai stato assunto a tempo indeterminato con lo stesso beneficio.</li>
          <li><b>Entità:</b> esonero del 100% dei contributi previdenziali a carico del datore, fino a 500€ al mese per 36 mesi.</li>
          <li><b>Mezzogiorno:</b> per assunzioni in Abruzzo, Molise, Campania, Basilicata, Puglia, Calabria, Sicilia e Sardegna l'esonero è potenziato e può estendersi fino a 48 mesi.</li>
        </ul>
        <p>Requisiti e modulistica aggiornati sono pubblicati da <a href="https://www.inps.it" target="_blank" rel="noopener">INPS</a> nelle circolari dedicate agli incentivi all'occupazione.</p>`
      },
      {
        id: 'bonus-donne-2026',
        title: 'Incentivi per l’assunzione di donne e come sfruttarli da candidato',
        content: `<p>Misure altrettanto rilevanti puntano a ridurre il divario occupazionale di genere:</p>
        <ul>
          <li><b>Donne svantaggiate:</b> esonero contributivo del 100% (fino a 650€ mensili) per l'assunzione di donne prive di impiego regolarmente retribuito da almeno 24 mesi — ridotti a 6 mesi per le residenti in aree svantaggiate o nei settori a più alta disparità.</li>
          <li><b>La leva per il candidato:</b> se rientri nei requisiti, il costo aziendale della tua assunzione si riduce di migliaia di euro l'anno. Menzionarlo con tatto in fase avanzata di selezione — o tramite l'agenzia che ti presenta — può sbloccare una trattativa.</li>
        </ul>`,
        callout: {
          title: 'Fatti trovare pronto',
          text: 'Gli incentivi accelerano le assunzioni ma non sostituiscono la selezione: il CV deve comunque superare screening e ATS. Usa l’editor AI di ProntoCurriculum per allineare il curriculum alle competenze richieste dalle aziende che stanno ampliando l’organico.',
          type: 'tip'
        }
      },
      {
        id: 'altri-incentivi-settoriali',
        title: 'Altri incentivi: apprendistato duale e ZES unica per il Mezzogiorno',
        content: `<p>Oltre agli sgravi under 35 e donne, esistono misure settoriali o territoriali che è utile conoscere se ti candidi in determinati contesti:</p>
        <ul>
          <li><b>Apprendistato duale:</b> combina formazione e lavoro con un regime contributivo agevolato proprio, distinto dagli esoneri standard, pensato per l'ingresso di giovani direttamente dal percorso scolastico o universitario nel mondo del lavoro.</li>
          <li><b>ZES unica per il Mezzogiorno:</b> le aziende che investono e assumono nelle regioni della Zona Economica Speciale del Sud possono cumulare crediti d'imposta e agevolazioni contributive, un ulteriore incentivo per chi cerca lavoro in Campania, Puglia, Calabria, Sicilia, Sardegna, Basilicata, Molise e Abruzzo.</li>
          <li><b>Incentivi per l'assunzione di lavoratori con disabilità:</b> previsti dalla Legge 68/1999, con esoneri contributivi specifici che si affiancano, senza sovrapporsi, agli sgravi generalisti descritti in questo articolo.</li>
        </ul>
        <p>Questi incentivi si sommano spesso alle dinamiche regionali descritte nelle nostre guide territoriali, ad esempio per chi cerca lavoro <a data-page="blog-article" data-slug="trovare-lavoro-lombardia" href="#">in Lombardia</a> o nelle altre regioni del Nord.</p>`
      },
      {
        id: 'come-il-recruiter-valuta-il-match',
        title: 'Come il recruiter valuta il match tra candidato e incentivo',
        content: `<p>Capire la prospettiva di chi seleziona aiuta a posizionare correttamente questa informazione senza sembrare che il proprio unico valore sia il risparmio fiscale che si porta in dote:</p>
        <ul>
          <li><b>L'incentivo non sostituisce mai la competenza:</b> nessun'azienda seria assume un profilo inadeguato solo per lo sgravio contributivo. L'agevolazione entra in gioco tipicamente nella fase finale, quando due candidati sono valutati equivalenti sul piano tecnico e l'incentivo diventa un fattore di spareggio.</li>
          <li><b>Il recruiter lo verifica comunque:</b> età anagrafica, storico contributivo e requisiti territoriali vengono controllati dall'ufficio HR o dal consulente del lavoro prima di applicare l'esonero, indipendentemente da cosa dichiara il candidato in colloquio.</li>
          <li><b>Il momento giusto per menzionarlo:</b> mai nella prima candidatura o nel CV stesso — è un dettaglio da usare, se utile, in una fase avanzata della trattativa, quando l'interesse dell'azienda è già consolidato.</li>
        </ul>`
      }
    ],
    faq: [
      { q: 'Il bonus assunzioni spetta all’azienda o al lavoratore?', a: 'All’azienda: è un esonero sui contributi a carico del datore di lavoro. Il lavoratore ne beneficia indirettamente, perché il costo ridotto dell’assunzione rende il suo profilo più competitivo e può facilitare la trattativa economica.' },
      { q: 'Posso dire al recruiter che rientro nei requisiti del bonus?', a: 'Sì, con misura e nel momento giusto: in fase avanzata di selezione o tramite l’agenzia per il lavoro. È un’informazione fattuale che l’ufficio HR apprezza, purché il profilo regga di suo la selezione.' },
      { q: 'Lo sgravio vale anche per i contratti di apprendistato?', a: 'L’apprendistato ha già un regime contributivo agevolato proprio, distinto da questi esoneri. Gli sgravi descritti qui riguardano le assunzioni a tempo indeterminato standard: per i dettagli fa fede la circolare INPS applicabile al singolo caso.' },
      { q: 'Gli sgravi si applicano anche alla trasformazione di un contratto a termine in indeterminato?', a: 'In molti casi sì, se ricorrono i requisiti soggettivi del lavoratore (età, genere, area territoriale) al momento della trasformazione: la verifica va comunque fatta caso per caso sulla circolare INPS vigente, perché le condizioni di dettaglio possono cambiare.' },
      { q: 'Un lavoratore può beneficiare di più incentivi contemporaneamente?', a: 'Generalmente no in forma cumulativa piena: le normative prevedono spesso regole di non sovrapposizione tra sgravi diversi riferiti allo stesso rapporto di lavoro. È l’ufficio paghe dell’azienda a determinare quale incentivo applicare quando il lavoratore rientra in più categorie.' },
      { q: 'Gli incentivi assunzioni riguardano anche i contratti part-time?', a: 'Sì, l’esonero si applica in proporzione alla retribuzione imponibile del contratto, incluso il part-time, purché siano rispettati gli altri requisiti previsti (tipologia contrattuale a tempo indeterminato, requisiti anagrafici o di genere del lavoratore).' },
    ],
    relatedSlugs: ['bonus-busta-paga-2026', 'guida-cv', 'esempi-cv']
  }
];
