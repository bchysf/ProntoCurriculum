# ProntoCurriculum — estensione Chrome (v1)

Genera un CV e una lettera di presentazione su misura per l'offerta di lavoro
aperta nella scheda corrente, usando il tuo profilo/archivio esperienze già
salvato su ProntoCurriculum. Il CV generato viene salvato automaticamente
nel tuo Archivio.

## Come provarla (unpacked)

1. Apri `chrome://extensions`
2. Attiva "Modalità sviluppatore" (in alto a destra)
3. "Carica estensione non pacchettizzata" → seleziona questa cartella (`extension/`)
4. Vai su un'offerta di lavoro (LinkedIn, Indeed, sito aziendale, ecc.), assicurati
   di essere loggato su prontocurriculum.it in un'altra scheda
5. Clicca l'icona dell'estensione nella toolbar → si apre un pannello in basso
   a destra con il testo dell'offerta già estratto (editabile) → "Genera CV e lettera"

## Come funziona

- **Nessun login separato**: legge il cookie di sessione `sid` già presente nel
  browser per prontocurriculum.it (via `chrome.cookies`, l'unica API che può
  leggere cookie `httpOnly`) e lo passa come `Authorization: Bearer` alle stesse
  API usate dal sito (`/api/tailor-cv`, `/api/tailor-cv/confirm`,
  `/api/cover-letter/generate`).
- **Estrazione annuncio**: cerca prima lo schema strutturato `JobPosting`
  (JSON-LD) che la maggior parte degli ATS/job board incorpora già
  (LinkedIn, Indeed, Greenhouse, Lever, ...); altrimenti usa euristiche sui
  contenitori della pagina, poi in ultima istanza il testo del `<body>`.
- **Permessi minimi**: nessun content script sempre attivo su tutti i siti —
  il pannello viene iniettato solo quando clicchi l'icona (`activeTab`), quindi
  Chrome non chiede il permesso "leggi i dati di tutti i siti".

## Limiti noti (v1)

- Un'offerta alla volta. La generazione multipla ("apro una pagina di risultati
  con 10 annunci e genero 10 CV") richiede scraper dedicati per struttura di
  ogni job board (le card dei risultati di LinkedIn/Indeed/Glassdoor sono tutte
  diverse) — è la feature naturale per la v2.
- Nessuna icona personalizzata ancora (Chrome mostra l'icona generica).
- Non pubblicata sul Chrome Web Store — solo caricamento "unpacked" per ora.

## Prossimi passi possibili

1. **Multi-annuncio**: scraper per pagina risultati di 1-2 job board (a scelta,
   es. LinkedIn + Indeed) che elenca gli annunci trovati con checkbox, genera
   in coda un CV+lettera per ciascuno selezionato.
2. Icone reali + pubblicazione sul Chrome Web Store (richiede zip, screenshot,
   privacy policy — l'estensione già non raccoglie né invia dati a terzi oltre
   l'API di prontocurriculum.it).
3. Badge/stato sull'icona toolbar quando rileva un `JobPosting` sulla pagina
   corrente (richiederebbe un content script leggero sempre attivo, quindi va
   pesato contro il permesso più ampio che questo comporta).
