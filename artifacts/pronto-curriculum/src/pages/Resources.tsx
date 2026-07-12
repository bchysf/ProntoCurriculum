import React, { useEffect } from 'react';
import type { Page } from '../types';
import BrandLogo from '../components/BrandLogo';

interface ResourcesProps {
  section: 'guida-cv' | 'punteggio-ats' | 'cv-europass' | 'esempi-cv';
  onNavigate: (page: Page) => void;
}

export default function Resources({ section, onNavigate }: ResourcesProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [section]);

  const renderContent = () => {
    switch (section) {
      case 'guida-cv':
        return (
          <>
            <div className="res-badge mono">GUIDA COMPLETA 2026</div>
            <h1 className="res-title">Guida al CV Perfetto: Come Scrivere un Curriculum che Fissa il Colloquio</h1>
            <p className="res-lead">
              Nel mercato del lavoro attuale, un recruiter impiega in media <b>6 secondi</b> per decidere se cestinare un curriculum o continuare a leggerlo. In questa guida scoprirai le regole esatte, validate dagli algoritmi ATS e dai professionisti del recruiting, per trasformare le tue esperienze in un documento di impatto.
            </p>

            <h2>1. Struttura e Lunghezza: La Regola della Pagina Singola</h2>
            <p>
              Salvo carriere accademiche o con oltre 15 anni di esperienza dirigenziale ad altissimo livello, il curriculum vitae perfetto deve stare in <b>una sola pagina A4</b> (o al massimo due). Ogni riga extra riduce l'attenzione del sezionatore.
            </p>
            <ul>
              <li><b>Dati di contatto essenziali:</b> Nome, Cognome, Telefono, Email professionale, Link al profilo LinkedIn e Città di domicilio. Evita dati obsoleti come stato civile o indirizzo di via completo.</li>
              <li><b>Profilo professionale (Summary):</b> 3-4 righe ad alta densità all'inizio del CV. Deve riassumere chi sei, quali sono i tuoi traguardi quantificabili e cosa puoi portare all'azienda.</li>
              <li><b>Esperienze professionali:</b> Al centro e in ordine cronologico inverso (dalla più recente alla meno recente).</li>
              <li><b>Formazione e Competenze:</b> Ben separate, preferendo un elenco pulito di hard e soft skill attinenti al ruolo.</li>
            </ul>

            <div className="res-callout">
              <h3>💡 Consiglio di ProntoCurriculum</h3>
              <p>
                Non inserire un elenco infinito di mansioni ("mi occupavo di gestire la posta..."). Sostituiscilo con la formula: <b>Verbo d'azione + Attività svolta + Risultato misurabile</b> (es. <i>"Guidato un team di 5 persone riducendo i tempi di consegna dei progetti del 22%"</i>).
              </p>
            </div>

            <h2>2. L'Impatto Visivo e la Scelta del Font</h2>
            <p>
              L'estetica è il primo filtro di qualità. Un CV impaginato male comunica disattenzione e scarsa professionalità prima ancora che venga letta una singola parola.
            </p>
            <p>
              Usa font moderni ad alta leggibilità su schermo e in stampa come <b>Inter</b>, <b>DM Sans</b>, <b>Satoshi</b> o <b>Helvetica</b>. Mantieni un margine bianco di almeno 15-20 mm per lato e usa una gerarchia cromatica rigorosa: un colore principale per i testi (blu notte scuro o grigio antracite) e un singolo colore d'accento elegante per i titoli.
            </p>

            <h2>3. Adattare il CV per Ogni Singola Candidatura (Tailoring)</h2>
            <p>
              Inviare lo stesso curriculum generico a 50 aziende diverse è la causa principale del silenzio da parte dei recruiter. Le aziende usano software di pre-selezione automatica (ATS) che cercano corrispondenze semantiche esatte tra la descrizione dell'offerta (Job Description) e le parole chiave presenti nel tuo CV.
            </p>

            <div className="res-cta-box">
              <h3>Pronto a scrivere un CV che passa ogni selezione?</h3>
              <p>Con il nostro generatore AI e i 12 modelli certificati ATS puoi creare il curriculum perfetto in meno di 5 minuti.</p>
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
                Crea il tuo CV Ora →
              </button>
            </div>
          </>
        );

      case 'punteggio-ats':
        return (
          <>
            <div className="res-badge mono">TECNOLOGIE DI SELEZIONE</div>
            <h1 className="res-title">Cos'è il Punteggio ATS e Come Superare i Filtri Automatici</h1>
            <p className="res-lead">
              Oltre il <b>75% dei curriculum</b> inviati alle grandi e medie aziende non viene mai letto da un essere umano. Viene infatti scartato o archiviato in bassa priorità da un software chiamato <b>ATS (Applicant Tracking System)</b>.
            </p>

            <h2>Che cos'è esattamente un ATS?</h2>
            <p>
              Gli ATS (come Workday, Taleo, Greenhouse o TeamSystem) sono sistemi informatici che scansionano i file CV inviati dai candidati, estraggono automaticamente il testo (parsing) e assegnano al profilo un <b>punteggio di compatibilità (ATS Score)</b> da 0 a 100% rispetto all'offerta lavorativa.
            </p>

            <h2>Perché un ATS scarta un Curriculum anche se il candidato è qualificato?</h2>
            <ul>
              <li><b>Formattazioni complesse e tabelle nascoste:</b> Se costruisci il CV con tabelle intrecciate o colonne multiple non standard, il parser dell'ATS mescola le parole e non riesce ad associare le tue date alle aziende.</li>
              <li><b>Grafiche, icone dentro immagini e infografiche:</b> Gli ATS leggono esclusivamente il testo stampabile. Se inserisci le tue competenze dentro barre grafiche o immagini PNG, per l'algoritmo quelle competenze <i>non esistono</i>.</li>
              <li><b>Parole chiave mancanti o sinonimi non riconosciuti:</b> Se l'annuncio richiede "Gestione Progetti Agile" e tu hai scritto "Coordinamento di lavoro flessibile", il software potrebbe non calcolare il match semantico.</li>
            </ul>

            <div className="res-callout">
              <h3>🛡️ Come funziona il calcolatore ATS di ProntoCurriculum</h3>
              <p>
                Il nostro editor integra un <b>analizzatore ATS in tempo reale</b>. Mentre compili o modifichi le tue esperienze, il nostro motore verifica la densità delle parole chiave, la pulizia del markup e la struttura cronologica, dandoti un punteggio esatto da 1 a 100 con suggerimenti di ottimizzazione AI.
              </p>
            </div>

            <div className="res-cta-box">
              <h3>Verifica ora il punteggio ATS del tuo Curriculum</h3>
              <p>Carica il tuo CV o creane uno da zero con i nostri template ad alta compatibilità algoritmica.</p>
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
                Testa il tuo CV Gratis →
              </button>
            </div>
          </>
        );

      case 'cv-europass':
        return (
          <>
            <div className="res-badge mono">ANALISI DEI MODELLI</div>
            <h1 className="res-title">CV Europass: Pro, Contro e Perché Molti Recruiter lo Sconsigliano</h1>
            <p className="res-lead">
              Il formato Europass è nato nel 2004 dall'Unione Europea con l'intento lodevole di standardizzare i curriculum tra i paesi membri. Tuttavia, nel mercato del lavoro privato odierno, è spesso oggetto di critiche severe da parte di head hunter e direttori delle risorse umane.
            </p>

            <h2>I Vantaggi dell'Europass (Quando usarlo)</h2>
            <p>
              Esistono ancora contesti specifici in cui l'Europass è la scelta preferibile o addirittura obbligatoria:
            </p>
            <ul>
              <li><b>Concorsi Pubblici in Italia ed Enti Statali:</b> Molti bandi di concorso richiedono esplicitamente il formato Europass per motivi burocratici di verifica formale dei titoli di studio.</li>
              <li><b>Istituzioni dell'Unione Europea:</b> Per candidature dirette ad agenzie, commissioni o ministeri connessi a Bruxelles.</li>
              <li><b>Bandi universitari e borse di ricerca:</b> Laddove è richiesta una griglia analitica rigorosa di tutte le pubblicazioni e delle scale linguistiche QCER (A1-C2).</li>
            </ul>

            <h2>I Limiti Critici nel Settore Privato</h2>
            <p>
              Se ti stai candidando per una startup, una multinazionale privata, una società di consulenza o una PMI moderna, l'Europass presenta gravi difetti strutturali:
            </p>
            <ul>
              <li><b>Eccessivo dispendio di spazio:</b> I margini larghi, il logo gigante e le griglie di autovalutazione delle lingue occupano intere pagine a vuoto. Un CV che potrebbe stare comodamente in 1 pagina diventa un blocco di 4 pagine.</li>
              <li><b>Mancanza di personalità e gerarchia visiva:</b> Tutti i candidati sembrano identici. Non c'è modo di mettere in risalto i risultati chiave (KPI) o i progetti di maggiore impatto.</li>
              <li><b>Scarsa ottimizzazione per la lettura rapida (Skimmability):</b> Il recruiter deve scorrere righe di testo burocratico ("Tipo di azienda o settore", "Principali mansioni e responsabilità") prima di arrivare al succo dell'esperienza.</li>
            </ul>

            <div className="res-callout">
              <h3>⚖️ La Soluzione Ibrida di ProntoCurriculum</h3>
              <p>
                In ProntoCurriculum abbiamo creato il modello <b>"Europass Ottimizzato"</b>: conserva la struttura formale e i campi richiesti dai bandi pubblici, ma elimina gli sprechi di spazio, migliora la tipografia e garantisce la massima chiarezza visiva. E se decidi di candidarti anche nel privato, ti basta un clic per commutare lo stesso contenuto nei modelli <b>Modern</b> o <b>Executive</b>.
              </p>
            </div>

            <div className="res-cta-box">
              <h3>Scegli il modello giusto per la tua carriera</h3>
              <p>Confronta i nostri 12 modelli professionali pronti per il download in PDF e Word (.docx).</p>
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
                Esplora i Modelli CV →
              </button>
            </div>
          </>
        );

      case 'esempi-cv':
        return (
          <>
            <div className="res-badge mono">ISPIRAZIONE PRATICA</div>
            <h1 className="res-title">Esempi di CV Vincenti per Settore e Livello di Carriera</h1>
            <p className="res-lead">
              Ogni settore professionale ha le proprie regole non scritte. Quello che funziona per un Senior Software Engineer è diverso da ciò che cerca il Direttore Marketing di un brand di moda o da ciò che serve a un neo-laureato in cerca di primo impiego.
            </p>

            <h2>1. Sviluppatore Software / IT Engineer (Template: Tecnico o Compatto)</h2>
            <p>
              In ambito tecnologico, i recruiter cercano chiarezza chirurgica, stack tecnologico ben evidenziato e link a progetti concreti o repository GitHub.
            </p>
            <ul>
              <li><b>Focus principale:</b> Sezione Competenze divisa per categorie (Linguaggi, Framework, Cloud/DevOps, Database).</li>
              <li><b>Esempio di bullet point efficace:</b> <i>"Progettato e implementato microservizi in Node.js su AWS ECS per 150k utenti attivi giornalieri, riducendo la latenza delle API del 40%"</i>.</li>
            </ul>

            <h2>2. Marketing Manager & Sales Executive (Template: Executive o Modern)</h2>
            <p>
              Nel marketing e nelle vendite, il curriculum è la dimostrazione pratica della tua capacità di vendere un prodotto: te stesso. I numeri e l'impatto sul fatturato (ROI) sono i veri protagonisti.
            </p>
            <ul>
              <li><b>Focus principale:</b> Budget gestiti, crescita percentuale (YoY), tassi di conversione e gestione di team.</li>
              <li><b>Esempio di bullet point efficace:</b> <i>"Aumentato la lead generation inbound del 65% in 8 mesi attraverso strategie SEO e campagne di Performance Marketing (Budget gestito: €250k/anno)"</i>.</li>
            </ul>

            <h2>3. Neo-laureato o Junior alla prima esperienza (Template: Minimal o Professionale)</h2>
            <p>
              Quando l'esperienza lavorativa diretta è limitata, la strategia migliore è posizionare la formazione in alto e dare valore a stage, tesi di laurea progettuali, attività associative e competenze trasversali dimostrabili.
            </p>
            <ul>
              <li><b>Focus principale:</b> Tesi di laurea, corsi di specializzazione, certificazioni extracurricolari, borse di studio o progetti universitari in team.</li>
              <li><b>Esempio di bullet point efficace:</b> <i>"Rappresentante degli studenti per 2 anni e coordinatore logistico di un evento universitario con 500+ partecipanti e 12 relatori"</i>.</li>
            </ul>

            <div className="res-cta-box">
              <h3>Ispirati e crea il tuo CV su misura in 5 minuti</h3>
              <p>Il nostro assistente AI adatta il linguaggio, il tono e le parole chiave in base alla tua professione specifica.</p>
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate('builder-step1')}>
                Inizia a Compilare Gratis →
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="res-page">
      <header className="res-header">
        <div className="res-header-inner">
          <BrandLogo onClick={() => onNavigate('home')} iconSize={36} fontSize={19} />
          <button className="btn btn-line btn-sm" onClick={() => onNavigate('home')}>
            ← Torna alla Home
          </button>
        </div>
      </header>

      <main className="res-main">
        <article className="res-article">
          {renderContent()}
        </article>
      </main>

      <footer className="res-footer">
        <div className="res-footer-inner">
          <span>© {new Date().getFullYear()} ProntoCurriculum. Tutti i diritti riservati.</span>
          <div className="res-footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}>Privacy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}>Termini</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('cookie'); }}>Cookie</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
