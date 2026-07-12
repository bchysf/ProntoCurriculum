export interface BlogArticleData {
  slug: string;
  title: string;
  subtitle: string;
  category: 'GUIDE PRATICHE' | 'TECNOLOGIE & ATS' | 'MERCATO & TREND' | 'COLLOQUIO' | 'MODELLI & EUROPASS';
  author: {
    name: string;
    role: string;
    initials: string;
  };
  date: string;
  readTime: string;
  featured?: boolean;
  trending?: boolean;
  keyTakeaways: string[];
  sections: {
    id: string;
    title: string;
    content: string; // HTML string or structured paragraphs
    callout?: {
      title: string;
      text: string;
      type?: 'tip' | 'warning' | 'ats' | 'quote';
    };
  }[];
  relatedSlugs: string[];
}

export const BLOG_ARTICLES: BlogArticleData[] = [
  {
    slug: 'guida-cv',
    title: 'Guida al CV Perfetto nel 2026: Come Scrivere un Curriculum che Fissa il Colloquio',
    subtitle: 'I segreti dei top recruiter e le regole auree validate dagli algoritmi ATS per superare la selezione in meno di 6 secondi e distinguerti dalla massa.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Dott.ssa Elena Moretti',
      role: 'Head of Career Advisory · ProntoCurriculum',
      initials: 'EM',
    },
    date: '10 Luglio 2026',
    readTime: '6 min di lettura',
    featured: true,
    trending: true,
    keyTakeaways: [
      'Un recruiter dedica in media solo 6 secondi alla prima scansione del tuo CV: la chiarezza visiva e la sintesi sono tutto.',
      'Sostituisci elenchi infiniti di mansioni con la formula di impatto: Verbo d’azione + Attività svolta + Risultato quantificabile (KPI).',
      'Personalizza sempre il sommario e le competenze chiave (Tailoring) per ogni specifica offerta di lavoro per superare i filtri ATS.',
    ],
    sections: [
      {
        id: 'struttura-lunghezza',
        title: '1. Struttura e Lunghezza: La Regola della Pagina Singola',
        content: `<p>Salvo carriere accademiche o con oltre 15 anni di esperienza dirigenziale ad altissimo livello, il curriculum vitae perfetto deve stare in <b>una sola pagina A4</b> (o al massimo due). Ogni riga extra riduce l'attenzione del selezionatore e rischia di diluire i tuoi successi più rilevanti.</p>
        <p>I blocchi fondamentali da includere, in questo esatto ordine strategico per massimizzare la leggibilità, sono:</p>
        <ul>
          <li><b>Dati di contatto puliti ed essenziali:</b> Nome, Cognome, Telefono, Email professionale, Link al profilo LinkedIn e Città di domicilio. Evita dati obsoleti o non richiesti come stato civile, data di nascita o indirizzo di via completo.</li>
          <li><b>Profilo professionale (Summary ad alto impatto):</b> 3-4 righe ad alta densità posizionate subito sotto l'intestazione. È il tuo "elevator pitch" visivo e deve riassumere chi sei, quali sono i tuoi traguardi misurabili e quale valore aggiunto porterai all'azienda.</li>
          <li><b>Esperienze professionali:</b> Al centro del documento e rigorosamente in ordine cronologico inverso (dalla più recente alla meno recente).</li>
          <li><b>Formazione e Competenze tecniche:</b> Ben separate, preferendo un elenco strutturato di hard e soft skill strettamente attinenti al ruolo ricercato.</li>
        </ul>`,
        callout: {
          title: '💡 La Formula del Successo Quantificabile',
          text: 'Non scrivere mai frasi passive come "Mi occupavo della gestione dei social media". Trasformale subito in risultati attivi e misurabili: "Ideato e gestito la strategia di content marketing su LinkedIn e Instagram, generando una crescita organica dei follower del 140% in 6 mesi e un +35% di lead qualificati".',
          type: 'tip'
        }
      },
      {
        id: 'impatto-visivo',
        title: '2. L’Impatto Visivo e la Scelta Tipografica',
        content: `<p>L'estetica è il primo filtro di qualità assoluta. Un CV impaginato male, con font disomogenei o margini strettissimi, comunica disattenzione, disorganizzazione e scarsa cura per i dettagli prima ancora che venga letta una singola parola.</p>
        <p>Usa font moderni ad alta leggibilità su schermo e in stampa come <b>Inter</b>, <b>Satoshi</b>, <b>DM Sans</b> o <b>Helvetica Neue</b>. Mantieni un margine bianco respirabile di almeno 15-20 mm per lato e usa una gerarchia cromatica rigorosa ed elegante: un colore principale scuro per i testi (blu notte scuro o grigio antracite #1E293B) e un singolo colore d'accento di classe per i titoli delle sezioni.</p>`
      },
      {
        id: 'tailoring-ats',
        title: '3. Adattare il CV per Ogni Candidatura (Tailoring Semantico)',
        content: `<p>Inviare lo stesso curriculum generico a 50 aziende diverse è la causa principale di quel silenzio frustrante da parte dei recruiter. Le aziende moderne utilizzano software automatici di pre-selezione (ATS) che cercano corrispondenze semantiche esatte tra la descrizione dell'offerta (Job Description) e le parole chiave presenti all'interno del tuo CV.</p>
        <p>Se l'annuncio specifica chiaramente la richiesta di "Metodologia Agile e Scrum" e sul tuo documento è riportato solo "Gestione flessibile dei progetti", l'algoritmo non riconoscerà la corrispondenza e ti assegnerà un punteggio basso, scartando il profilo prima ancora dell'esame umano.</p>`,
        callout: {
          title: '⚡ Il vantaggio del Tailoring automatico AI',
          text: 'Con lo strumento "CV su Misura" (Tailoring AI) di ProntoCurriculum ti basta incollare il testo di qualsiasi offerta di lavoro: il nostro algoritmo adatta istantaneamente il tuo sommario, ottimizza l’elenco delle competenze e inserisce le keyword esatte richieste dal recruiter, aumentando la probabilità di colloquio dell’85%.',
          type: 'ats'
        }
      }
    ],
    relatedSlugs: ['punteggio-ats', 'cv-europass', 'lettera-presentazione']
  },
  {
    slug: 'punteggio-ats',
    title: 'Cos’è il Punteggio ATS e Come Superare i Filtri Automatici nel 2026',
    subtitle: 'Scopri come funzionano i software di pre-selezione aziendale (Workday, Taleo, Greenhouse) e perché scartano il 75% dei candidati qualificati.',
    category: 'TECNOLOGIE & ATS',
    author: {
      name: 'Ing. Marco Bellini',
      role: 'Lead AI Engineer & Recruiter Tech · ProntoCurriculum',
      initials: 'MB',
    },
    date: '8 Luglio 2026',
    readTime: '5 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'Oltre il 75% dei CV inviati alle medie e grandi aziende viene analizzato e filtrato da un software ATS prima di essere visto da un essere umano.',
      'Tabelle complesse, colonne intrecciate, infografiche e icone PNG impediscono al parser di estrarre correttamente le tue date e mansioni.',
      'Il punteggio ATS di compatibilità (da 0 a 100) si basa sulla corrispondenza esatta delle keyword tecniche e sulla pulizia strutturale del codice XML/DOCX del documento.',
    ],
    sections: [
      {
        id: 'che-cosa-e-ats',
        title: 'Che cos’è esattamente un ATS e come funziona dietro le quinte?',
        content: `<p>Gli <b>Applicant Tracking System (ATS)</b> come Workday, Taleo, Greenhouse, Lever o TeamSystem sono piattaforme software di gestione aziendale utilizzate per automatizzare l'acquisizione e la prima scrematura delle candidature.</p>
        <p>Quando invii il tuo curriculum tramite un portale aziendale o LinkedIn, il file (PDF o DOCX) viene elaborato da un modulo di <b>parsing semantico</b> che smonta il documento pezzo per pezzo, inserendo i tuoi dati nelle tabelle del database HR: Nome, Esperienza 1, Azienda 1, Data Inizio/Fine, Titolo di Studio e Competenze chiave.</p>`
      },
      {
        id: 'perche-scartano-cv',
        title: 'I 3 Errori Fatali che mandano il tuo CV nel cestino automatico',
        content: `<p>La maggior parte dei candidati viene scartata non per mancanza di competenze reali, ma per problemi tecnici di lettura da parte del software ATS:</p>
        <ul>
          <li><b>Tabelle nascoste, caselle di testo o colonne multiple irregolari:</b> Se crei il tuo CV su Word o Canva usando caselle fluttuanti o tabelle complesse per dividere lo schermo, il parser legge il testo da sinistra a destra ignorando i bordi della colonna. Risultato? Le date di fine rapporto si mescolano alle mansioni di un'altra azienda, creando un profilo incomprensibile.</li>
          <li><b>Grafiche a barre e icone per le competenze:</b> Inserire barre di riempimento grafiche (es. <i>Inglese: 4 pallini su 5</i> o barre progressive) è il modo più rapido per nascondere le tue skill. Gli ATS leggono solo i caratteri testuali alfabetici; l'immagine della barra viene ignorata completamente.</li>
          <li><b>Assenza di parole chiave standard (Keyword Mismatch):</b> Gli algoritmi confrontano le parole esatte del tuo CV con la descrizione del lavoro. Se l'azienda cerca "SEO Specialist" e tu scrivi solo "Ottimizzatore per i motori di ricerca", l'ATS calcolerà una compatibilità del 30%.</li>
        </ul>`,
        callout: {
          title: '🛡️ Come funziona il Calcolatore ATS in tempo reale di ProntoCurriculum',
          text: 'Il nostro editor integra un analizzatore semantico ATS nativo. Mentre digiti le tue esperienze, il motore scansiona la densità delle parole chiave, verifica la pulizia strutturale del markup e ti assegna un punteggio percentuale immediato da 0 a 100%, evidenziando esattamente le keyword mancanti da aggiungere prima di inviare.',
          type: 'ats'
        }
      }
    ],
    relatedSlugs: ['guida-cv', 'cv-europass', 'colloqui-domande-difficili']
  },
  {
    slug: 'cv-europass',
    title: 'CV Europass: Pro, Contro e Perché Molti Recruiter Privati lo Sconsigliano',
    subtitle: 'Analisi approfondita del formato europeo: quando è obbligatorio per i bandi pubblici e quando invece penalizza la tua candidatura nelle aziende moderne.',
    category: 'MODELLI & EUROPASS',
    author: {
      name: 'Dott.ssa Elena Moretti',
      role: 'Head of Career Advisory · ProntoCurriculum',
      initials: 'EM',
    },
    date: '4 Luglio 2026',
    readTime: '7 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'L’Europass è rigorosamente obbligatorio ed eccellente per Concorsi Pubblici in Italia, istituzioni UE e bandi accademici/universitari.',
      'Nel settore privato (startup, multinazionali, consulenza, PMI) viene sconsigliato perché occupa troppe pagine, spreca spazio e appiattisce la personalità del candidato.',
      'Con ProntoCurriculum puoi usare il modello "Europass Ottimizzato" per il pubblico o convertire lo stesso contenuto in formato "Modern" o "Executive" in 1 singolo clic.',
    ],
    sections: [
      {
        id: 'quando-usare-europass',
        title: 'Quando l’Europass è la scelta obbligata e vincente',
        content: `<p>Il formato Europass è nato nel 2004 con l'obiettivo istituzionale di creare uno standard comune per la mobilità dei lavoratori nell'Unione Europea. Nonostante le critiche nel settore privato, esistono scenari precisi in cui è indispensabile:</p>
        <ul>
          <li><b>Concorsi Pubblici italiani ed Enti Statali:</b> Quasi la totalità dei bandi di concorso per la Pubblica Amministrazione richiede esplicitamente la compilazione secondo il modello europeo per consentire alla commissione esaminatrice un controllo formale dei titoli di studio e dei punteggi di legge.</li>
          <li><b>Istituzioni dell’Unione Europea e Agenzie Internazionali:</b> Per candidature dirette a commissioni, ministeri o enti di ricerca europei.</li>
          <li><b>Bandi universitari, borse di studio e dottorati (Ph.D.):</b> Laddove è necessaria una catalogazione standardizzata e minuziosa delle pubblicazioni scientifiche e del quadro comune europeo di riferimento per le lingue (QCER A1-C2).</li>
        </ul>`
      },
      {
        id: 'limiti-settore-privato',
        title: 'I Gravi Difetti Strutturali nel Settore Privato e nelle Aziende Tech',
        content: `<p>Se ti candidi per una multinazionale privata, una società di consulenza direzionale, un'agenzia creativa o una PMI dinamica, inviare il classico Europass generato online presenta pesanti svantaggi:</p>
        <ul>
          <li><b>Eccessivo spreco di spazio bianco e impaginazione prolissa:</b> I margini larghissimi, il logo gigante, le etichette burocratiche ("Tipo di azienda o settore", "Principali mansioni e responsabilità") e le griglie linguistiche dilatano un curriculum che starebbe in 1 pagina fino a 4 o 5 pagine.</li>
          <li><b>Appiattimento del valore e omologazione visiva:</b> Quando un head hunter riceve 300 candidature Europass, tutti i profili sembrano identici. Non c'è alcuna flessibilità visiva per mettere in risalto i tuoi traguardi chiave o la tua unicità professionale.</li>
        </ul>`,
        callout: {
          title: '⚖️ La Soluzione Ibrida: Europass Ottimizzato vs Executive',
          text: 'In ProntoCurriculum abbiamo ridisegnato il modello Europass: rispetta tutti i campi formali richiesti dai bandi pubblici, ma elimina gli sprechi di margine e ottimizza la tipografia. Inoltre, se vuoi tentare una candidatura nel privato, con 1 clic puoi applicare il modello "Modern" o "Executive" scaricandolo in PDF o Word (.docx) nitido e professionale.',
          type: 'tip'
        }
      }
    ],
    relatedSlugs: ['guida-cv', 'punteggio-ats', 'esempi-cv']
  },
  {
    slug: 'lettera-presentazione',
    title: 'La Lettera di Presentazione Perfetta nel 2026: Esempi, Struttura e Modelli',
    subtitle: 'Come scrivere una cover letter che il recruiter leggerà davvero, senza frasi fatte o noiose autocelebrazioni. La guida con modelli pronti all’uso.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Dott.ssa Elena Moretti',
      role: 'Head of Career Advisory · ProntoCurriculum',
      initials: 'EM',
    },
    date: '1 Luglio 2026',
    readTime: '6 min di lettura',
    featured: false,
    trending: false,
    keyTakeaways: [
      'La lettera di presentazione non deve mai essere un riassunto duplicato del CV: deve raccontare il "perché" desideri proprio quell’azienda e quale problema specifico puoi risolvere per loro.',
      'Inizia con un’apertura a impatto immediato (Il Gancio/Hook) menzionando un traguardo recente o una sfida che l’azienda sta affrontando sul mercato.',
      'Mantieni la lunghezza tra le 250 e le 350 parole massime (3 o 4 brevi paragrafi) e chiudi sempre con una Call-To-Action chiara per richiedere un colloquio conoscitivo.',
    ],
    sections: [
      {
        id: 'errore-comune-cover-letter',
        title: 'L’Errore #1 da evitare: Non ripetere a papera il tuo Curriculum',
        content: `<p>Il 90% dei candidati inizia la lettera di presentazione con la classica formula stantia: <i>"Gentile Responsabile delle Risorse Umane, con la presente intendo sottoporre la mia candidatura per il ruolo di X. Come si evince dal mio CV, mi sono laureato nel 2021 e ho lavorato per..."</i></p>
        <p>Questa introduzione fa addormentare il selezionatore all'istante. La Cover Letter ha uno scopo completamente diverso dal CV: deve dimostrare <b>entusiasmo, conoscenza dell'azienda e motivazione intrinseca</b>. Deve rispondere alla domanda fondamentale del recruiter: <i>"Perché questo candidato ha scelto proprio noi e cosa può fare per il nostro team già dai primi 60 giorni?"</i></p>`
      },
      {
        id: 'struttura-vincente-4-parti',
        title: 'La Struttura Vincente in 4 Paragrafi Brevi',
        content: `<p>Una lettera ad alta conversione si articola in quattro sezioni chirurgiche e dirette:</p>
        <ul>
          <li><b>1. Il Gancio (Hook iniziale):</b> Cattura l'attenzione menzionando un successo recente dell'azienda (un nuovo lancio di prodotto, un'espansione internazionale o un articolo di giornale) e collegalo direttamente alla tua passione per il loro settore.</li>
          <li><b>2. Il Valore Concreto (Cosa porti sul tavolo):</b> Seleziona 1 o 2 risultati straordinari della tua carriera che corrispondono perfettamente alla sfida descritta nella Job Description. Usa numeri precisi per dimostrare l'impatto.</li>
          <li><b>3. L’Allineamento Culturale (Cultural Fit):</b> Spiega brevemente perché condividi i valori, il metodo di lavoro o la missione dell'azienda.</li>
          <li><b>4. La Call-to-Action (Chiusura assertiva):</b> Concludi chiedendo cordialmente un breve incontro di 15 minuti o una chiamata conoscitiva per approfondire come la tua esperienza potrà contribuire agli obiettivi del dipartimento.</li>
        </ul>`,
        callout: {
          title: '🔥 Esempio pratico di Apertura ad Alto Impatto',
          text: '"Gentile Dott. Conti, ho seguito con immenso entusiasmo il recente lancio della vostra nuova divisione Fintech in Spagna. Avendo guidato l’espansione dei canali di pagamento digitali per un brand e-commerce generando +1.8M€ di fatturato nel primo anno, sarei entusiasta di portare le mie competenze di Growth Management per accelerare il vostro ingresso sul mercato iberico."',
          type: 'tip'
        }
      }
    ],
    relatedSlugs: ['guida-cv', 'colloqui-domande-difficili', 'esempi-cv']
  },
  {
    slug: 'colloqui-domande-difficili',
    title: 'Colloquio di Lavoro: Come Rispondere alle 7 Domande Più Insidiose dei Recruiter',
    subtitle: 'Da "Mi parli di lei" a "Qual è il suo più grande difetto": le risposte strategiche usando il Metodo STAR per convincere anche gli head hunter più severi.',
    category: 'COLLOQUIO',
    author: {
      name: 'Ing. Marco Bellini',
      role: 'Lead AI Engineer & Recruiter Tech · ProntoCurriculum',
      initials: 'MB',
    },
    date: '28 Giugno 2026',
    readTime: '8 min di lettura',
    featured: false,
    trending: false,
    keyTakeaways: [
      'Quando ti chiedono "Mi parli di lei", non raccontare la tua biografia infantile: usa la formula Presente - Passato - Futuro incentrata sul valore professionale.',
      'Per le domande sui difetti o sugli insuccessi, applica sempre la trasparenza autentica seguita dalla strategia di miglioramento continuo che hai già messo in atto per risolverli.',
      'Usa il Metodo STAR (Situazione, Task, Azione, Risultato) per rispondere a qualsiasi domanda comportamentale ("Mi racconti di una volta in cui ha gestito un conflitto nel team").',
    ],
    sections: [
      {
        id: 'metodo-star',
        title: 'Il Segreto dei Candidati Top: Il Metodo STAR per le Domande Comportamentali',
        content: `<p>Le aziende moderne utilizzano sempre di più i <b>Colloqui Comportamentali (Behavioral Interviews)</b> basati sul principio che <i>il comportamento passato di un individuo è il miglior predittore delle sue performance future</i>.</p>
        <p>Per rispondere in modo strutturato, autorevole e memorabile, applica sempre l'acronimo <b>STAR</b>:</p>
        <ul>
          <li><b>S — Situazione (Situation):</b> Descrivi brevemente il contesto o la sfida iniziale (massimo 2 frasi).</li>
          <li><b>T — Obiettivo (Task):</b> Spiega qual era la tua responsabilità esatta o il traguardo da raggiungere.</li>
          <li><b>A — Azione (Action):</b> Descrivi nel dettaglio le azioni concrete e le decisioni di leadership che <i>tu personalmente</i> hai inteso e attuato per risolvere il problema.</li>
          <li><b>R — Risultato (Result):</b> Quantifica l'esito finale positivo con numeri, percentuali di risparmio tempo o incremento fatturato e condividi la lezione appresa.</li>
        </ul>`
      },
      {
        id: 'domande-classiche-risposte',
        title: 'Come affrontare la domanda tranello: "Qual è il suo maggior difetto?"',
        content: `<p>Questa è la domanda che mette in crisi il 60% dei candidati. Rispondere con falsi difetti che sembrano pregi (es. <i>"Sono troppo perfezionista"</i> o <i>"Lavoro troppo"</i>) è considerato un campanello d'allarme di scarsa consapevolezza e inautenticità.</p>
        <p><b>La strategia corretta:</b> Scegli un'area tecnica o relazionale su cui hai realmente incontrato difficoltà in passato, ma dimostra con esempi concreti e misurabili i passi che hai compiuto e stai compiendo ogni giorno per superarla con successo.</p>`,
        callout: {
          title: '💬 Esempio vincente di Risposta al Difetto',
          text: '"In passato tendevo ad assumermi troppi compiti operativi senza delegare a sufficienza al mio team, il che a volte causava colli di bottiglia sui miei tempi di revisione. Per risolvere questo aspetto, nell’ultimo anno ho implementato sessioni di stand-up giornaliere di 15 minuti su Asana per distribuire i carichi di lavoro in modo bilanciato: questo ha aumentato l’autonomia dei miei collaboratori e ha migliorato la puntualità di consegna del team del 30%."',
          type: 'quote'
        }
      }
    ],
    relatedSlugs: ['guida-cv', 'lettera-presentazione', 'punteggio-ats']
  },
  {
    slug: 'esempi-cv',
    title: 'Esempi di CV Vincenti nel 2026: Modelli Pronti per IT, Marketing, HR e Neo-laureati',
    subtitle: 'Confronta i modelli di curriculum vitae più efficaci per ogni settore lavorativo, con esempi di sommari e bullet point di successo da copiare.',
    category: 'GUIDE PRATICHE',
    author: {
      name: 'Dott.ssa Elena Moretti',
      role: 'Head of Career Advisory · ProntoCurriculum',
      initials: 'EM',
    },
    date: '25 Giugno 2026',
    readTime: '7 min di lettura',
    featured: false,
    trending: true,
    keyTakeaways: [
      'Ogni settore professionale richiede una gerarchia visiva differente: gli ingegneri IT devono mettere in risalto lo stack tecnico, mentre i sales executive devono evidenziare ROI e budget gestiti.',
      'I neo-laureati o junior senza esperienza diretta devono posizionare la sezione Formazione in alto e valorizzare tesi di laurea, stage, progetti universitari di gruppo e certificazioni extra.',
      'Tutti i modelli presentati sono disponibili all’interno dell’editor di ProntoCurriculum per il download immediato in formato PDF ad alta risoluzione e Word (.docx).',
    ],
    sections: [
      {
        id: 'settore-tech-it',
        title: '1. Sviluppatore Software & IT Engineer (Modelli consigliati: Tecnico o Compatto)',
        content: `<p>In ambito tecnologico e nello sviluppo software, i Technical Recruiter e gli Engineering Manager cercano immediatezza, chiarezza architettonica e una mappa rapida dello stack tecnologico dominato dal candidato.</p>
        <ul>
          <li><b>Focus primario:</b> Sezione Competenze tecniche categorizzata nitidamente per Linguaggi di programmazione, Framework, Cloud/DevOps e Database.</li>
          <li><b>Esempio di bullet point di impatto:</b> <i>"Progettato e implementato un'architettura a microservizi in Node.js e TypeScript su AWS ECS per 150.000 utenti attivi giornalieri, riducendo i tempi di risposta delle API del 42% e abbattendo i costi server del 20%"</i>.</li>
        </ul>`
      },
      {
        id: 'settore-marketing-sales',
        title: '2. Marketing Manager & Sales Director (Modelli consigliati: Executive o Modern)',
        content: `<p>Nel marketing, nella comunicazione e nelle vendite, il curriculum vitae stesso è la dimostrazione tangibile della tua capacità di posizionare un prodotto ad alto valore: te stesso.</p>
        <ul>
          <li><b>Focus primario:</b> Budget gestiti con precisione, tassi di crescita percentuale (YoY), riduzione dei costi di acquisizione (CAC/CPA) e gestione di team diretti o agenzie esterne.</li>
          <li><b>Esempio di bullet point di impatto:</b> <i>"Guidato la strategia di Digital & Performance Marketing con un budget annuo di €450.000, generando una crescita del fatturato e-commerce del +68% in 12 mesi tramite ottimizzazione SEO e campagne di Lead Generation mirate"</i>.</li>
        </ul>`,
        callout: {
          title: '🚀 Scegli e personalizza il modello perfetto per il tuo settore',
          text: 'Con il nostro generatore guidato AI puoi selezionare tra 12 template certificati, modificare i colori aziendali, verificare il punteggio ATS ed esportare il documento in PDF o Word (.docx) pronti per la selezione.',
          type: 'tip'
        }
      }
    ],
    relatedSlugs: ['guida-cv', 'cv-europass', 'punteggio-ats']
  }
];
