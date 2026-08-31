// Injected on demand (toolbar icon click) via chrome.scripting.executeScript.
// Re-running this file toggles the panel instead of rebuilding it, since
// executeScript re-injects the whole file on every click.
(function () {
  const SITE_URL = "https://www.prontocurriculum.it";
  // Bump whenever this file changes meaningfully: a leftover panel from
  // before an extension reload is a *different build* still sitting in the
  // page, and toggling it back into view would just show stale markup
  // wired to a chrome.runtime connection the browser already tore down.
  const CONTENT_VERSION = "7";

  // chrome.runtime is only reachable while this content script's extension
  // context is alive. Reloading the extension in chrome://extensions
  // invalidates that context for scripts already injected into open tabs —
  // the panel stays on screen but can no longer message the background
  // worker. Detect that up front and force a rebuild with a clear message
  // instead of a silently-dead "Generate" button.
  const contextAlive = !!(chrome.runtime && chrome.runtime.id);

  const existing = document.getElementById("pc-ext-host");
  if (existing) {
    if (existing.dataset.pcVersion === CONTENT_VERSION && contextAlive) {
      existing.style.display = existing.style.display === "none" ? "block" : "none";
      return;
    }
    existing.remove();
  }

  if (!contextAlive) {
    // Can't reach chrome.runtime.sendMessage at all in this state, so build
    // a minimal notice instead of the full panel.
    const notice = document.createElement("div");
    notice.id = "pc-ext-host";
    notice.dataset.pcVersion = CONTENT_VERSION;
    Object.assign(notice.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "2147483647",
      background: "#0B1D3A",
      color: "#fff",
      padding: "12px 16px",
      borderRadius: "10px",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "13px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
      maxWidth: "280px",
    });
    notice.textContent =
      "L'estensione è stata aggiornata: ricarica questa pagina (F5) e riprova.";
    document.documentElement.appendChild(notice);
    return;
  }

  const LANGS = [
    ["IT", "Italiano"],
    ["EN", "English"],
    ["FR", "Français"],
    ["DE", "Deutsch"],
    ["ES", "Español"],
    ["PT", "Português"],
  ];

  function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.innerText || div.textContent || "").trim();
  }

  function firstMatchText(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el && (el.innerText || el.textContent);
      if (text && text.trim().length > 0) return text.trim();
    }
    return "";
  }

  // Job boards that render a list + detail-pane layout (Indeed, LinkedIn's
  // search view, ...) defeat generic "find the biggest text block" heuristics:
  // the page has plenty of unrelated text (sidebar listings, nav, "how this
  // matches your profile" UI copy) that can out-bulk the actual description.
  // Known hosts get hand-picked selectors for the one currently-open posting.
  const SITE_SELECTORS = [
    {
      test: /(^|\.)indeed\.[a-z.]+$/i,
      title: ['[data-testid="jobsearch-JobInfoHeader-title"]', "h1"],
      company: [
        '[data-testid="inlineHeader-companyName"]',
        '[data-testid="inlineHeader-companyName"] a',
        ".jobsearch-CompanyInfoContainer a",
      ],
      description: ["#jobDescriptionText", ".jobsearch-jobDescriptionText"],
    },
    {
      test: /(^|\.)linkedin\.com$/i,
      title: [".job-details-jobs-unified-top-card__job-title", "h1"],
      company: [
        ".job-details-jobs-unified-top-card__company-name a",
        ".job-details-jobs-unified-top-card__company-name",
        ".jobs-unified-top-card__company-name a",
      ],
      description: [
        ".jobs-description__content",
        ".jobs-box__html-content",
        "article.jobs-description__container",
      ],
    },
    {
      test: /(^|\.)glassdoor\.[a-z.]+$/i,
      title: ['[data-test="job-title"]', "h1"],
      company: ['[data-test="employer-name"]'],
      description: ['[data-test="jobDescriptionContent"]', ".jobDescriptionContent"],
    },
  ];

  function extractFromSiteSelectors() {
    const host = window.location.hostname;
    const site = SITE_SELECTORS.find((s) => s.test.test(host));
    if (!site) return null;

    const description = firstMatchText(site.description);
    if (description.length < 200) return null;

    return {
      title: firstMatchText(site.title) || document.title || "",
      company: firstMatchText(site.company) || "",
      description: description.slice(0, 8000),
      source: "site-selector",
    };
  }

  // Structured JobPosting schema (schema.org) most ATS/job boards embed —
  // clean and gives us title/company for free — but on list+detail-pane
  // layouts it may be missing or describe a different job than the one
  // currently open, so it's tried after the site-specific selectors above.
  function extractFromJsonLd() {
    const ldScripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]'),
    );
    for (const script of ldScripts) {
      try {
        const json = JSON.parse(script.textContent);
        const candidates = Array.isArray(json) ? json : json["@graph"] || [json];
        for (const item of candidates) {
          const type = item && item["@type"];
          const isJobPosting =
            type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"));
          if (isJobPosting) {
            return {
              title: item.title || document.title || "",
              company: (item.hiringOrganization && item.hiringOrganization.name) || "",
              description: stripHtml(item.description || "").slice(0, 8000),
              source: "jsonld",
            };
          }
        }
      } catch {
        // Malformed JSON-LD on the page — ignore and keep looking.
      }
    }
    return null;
  }

  function extractFromGenericHeuristics() {
    const selectors = [
      '[class*="job-description" i]',
      '[class*="jobdescription" i]',
      '[id*="job-description" i]',
      '[class*="description" i]',
      "article",
      "main",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      const text = el && el.innerText ? el.innerText.trim() : "";
      if (text.length > 200) {
        return { title: document.title || "", company: "", description: text.slice(0, 8000), source: "heuristic" };
      }
    }
    return null;
  }

  function extractJobData() {
    return (
      extractFromSiteSelectors() ||
      extractFromJsonLd() ||
      extractFromGenericHeuristics() || {
        title: document.title || "",
        company: "",
        description: (document.body.innerText || "").trim().slice(0, 8000),
        source: "fallback",
      }
    );
  }

  const host = document.createElement("div");
  host.id = "pc-ext-host";
  host.dataset.pcVersion = CONTENT_VERSION;
  // "all: initial" must be applied before the positioning properties below —
  // it resets every CSS property (that's the point: isolate from the host
  // page's styles), so if it came last it would silently wipe out
  // position/top/right/z-index too, leaving the host in normal document
  // flow instead of floating.
  host.style.all = "initial";
  Object.assign(host.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: "2147483647",
  });
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .panel {
      --ink: #14171F;
      --ink-60: #565B66;
      --ink-40: #9297A1;
      --hair: rgba(20, 23, 31, 0.12);
      --hair-soft: rgba(20, 23, 31, 0.07);
      --accent: #2F2AE5;
      --accent-ink: #221FB4;
      --tint: #EEEDFC;
      --page: #FAFAFC;
      width: 380px;
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(20,23,31,0.22), 0 0 0 1px var(--hair);
      overflow: hidden;
      color: var(--ink);
    }
    .header {
      background: var(--page);
      border-bottom: 1px solid var(--hair-soft);
      color: var(--ink);
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13.5px;
      font-weight: 700;
      letter-spacing: -0.01em;
      cursor: move;
      user-select: none;
      touch-action: none;
    }
    .header .brand { display: flex; align-items: center; gap: 8px; }
    .header .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    .header button {
      background: transparent;
      border: none;
      color: var(--ink-40);
      font-size: 18px;
      cursor: pointer;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .header button:hover { color: var(--ink); background: var(--hair-soft); }
    .body { padding: 16px; overflow-y: auto; font-size: 13px; }
    label { display: block; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 10px; font-weight: 500; color: var(--ink-40); margin: 12px 0 5px; text-transform: uppercase; letter-spacing: 0.08em; }
    label:first-child { margin-top: 0; }
    input[type="text"], select, textarea {
      width: 100%;
      border: 1px solid var(--hair);
      border-radius: 9px;
      padding: 8px 10px;
      font-size: 13px;
      color: var(--ink);
      background: #fff;
    }
    input[type="text"]:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--tint);
    }
    textarea { min-height: 140px; resize: vertical; line-height: 1.5; }
    .row { display: flex; gap: 8px; }
    .row > div { flex: 1; }
    .btn {
      margin-top: 14px;
      width: 100%;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 99px;
      padding: 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: -0.01em;
      cursor: pointer;
      transition: background .15s;
    }
    .btn:hover:not(:disabled) { background: var(--accent-ink); }
    .btn:disabled { opacity: 0.55; cursor: default; }
    .btn.secondary {
      background: var(--tint);
      color: var(--accent-ink);
    }
    .btn.secondary:hover:not(:disabled) { background: #E3E1FB; }
    .note { font-size: 11.5px; color: var(--ink-40); margin-top: 8px; }
    .auth-badge { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 10.5px; letter-spacing: 0.02em; padding: 7px 16px; background: var(--page); color: var(--ink-40); border-bottom: 1px solid var(--hair-soft); }
    .auth-badge.ok { color: #12805C; }
    .auth-badge.bad { color: #B3261E; }
    .auth-badge a { color: inherit; text-decoration: underline; }
    .error { background: #FDECEA; color: #B3261E; border-radius: 10px; padding: 10px 12px; font-size: 12px; margin-top: 10px; line-height: 1.5; }
    .success { background: #EAF6EF; color: #12805C; border-radius: 10px; padding: 10px 12px; font-size: 12px; margin-top: 10px; font-weight: 600; }

    .result { margin-top: 4px; }
    .cv-card {
      margin-top: 14px;
      padding: 16px;
      border: 1px solid var(--hair-soft);
      border-radius: 12px;
      background: var(--page);
    }
    .eyebrow {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent-ink);
      margin: 0 0 6px;
    }
    .cv-card h4 { margin: 0 0 6px; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink); }
    .cv-card p { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--ink-60); }

    .letter-card {
      margin-top: 16px;
      border: 1px solid var(--hair);
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 1px 0 var(--hair-soft);
      overflow: hidden;
    }
    .letter-card .lc-head {
      padding: 12px 20px;
      border-bottom: 1px solid var(--hair-soft);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .letter-card .lc-head .eyebrow { margin: 0; }
    .fit-pill {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 10px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 99px;
      background: var(--tint);
      color: var(--accent-ink);
    }
    .letter-card .lc-body { padding: 20px; font-size: 13.5px; line-height: 1.75; color: var(--ink); }
    .letter-card .lc-body p { margin: 0 0 14px; white-space: pre-wrap; }
    .letter-card .lc-body p:last-child { margin-bottom: 0; }
    .letter-card .lc-actions { display: flex; gap: 8px; padding: 0 20px 18px; }
    .letter-card .lc-actions .btn { margin-top: 0; }
    .fab {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: var(--accent, #2F2AE5);
      color: #fff;
      border: none;
      box-shadow: 0 6px 20px rgba(47,42,229,0.35);
      cursor: pointer;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.7s linear infinite;
      margin-right: 6px;
      vertical-align: -2px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  root.appendChild(style);

  const panel = document.createElement("div");
  panel.className = "panel";
  root.appendChild(panel);

  const job = extractJobData();

  panel.innerHTML = `
    <div class="header">
      <span class="brand"><span class="dot"></span>ProntoCurriculum</span>
      <button type="button" id="pc-close" title="Chiudi">×</button>
    </div>
    <div class="auth-badge" id="pc-auth-badge">Verifica accesso…</div>
    <div class="body">
      <label for="pc-title">Ruolo</label>
      <input type="text" id="pc-title" />
      <div class="row">
        <div>
          <label for="pc-company">Azienda</label>
          <input type="text" id="pc-company" />
        </div>
        <div>
          <label for="pc-lang">Lingua</label>
          <select id="pc-lang"></select>
        </div>
      </div>
      <label for="pc-desc">Testo offerta (modificabile)</label>
      <textarea id="pc-desc"></textarea>
      <button type="button" class="btn" id="pc-generate">Genera CV e lettera</button>
      <div id="pc-status"></div>
      <div id="pc-result" class="result"></div>
    </div>
  `;

  const titleInput = panel.querySelector("#pc-title");
  const companyInput = panel.querySelector("#pc-company");
  const langSelect = panel.querySelector("#pc-lang");
  const descTextarea = panel.querySelector("#pc-desc");
  const generateBtn = panel.querySelector("#pc-generate");
  const statusEl = panel.querySelector("#pc-status");
  const resultEl = panel.querySelector("#pc-result");

  titleInput.value = job.title;
  companyInput.value = job.company;
  descTextarea.value = job.description;

  const authBadge = panel.querySelector("#pc-auth-badge");
  chrome.runtime.sendMessage({ type: "PC_CHECK_AUTH" }, (res) => {
    if (chrome.runtime.lastError || !res) {
      authBadge.textContent = "Impossibile verificare l'accesso.";
      authBadge.className = "auth-badge bad";
      return;
    }
    if (res.authenticated) {
      authBadge.textContent = "✓ Connesso a ProntoCurriculum";
      authBadge.className = "auth-badge ok";
    } else {
      authBadge.innerHTML = `Non connesso — <a href="${SITE_URL}/dashboard" target="_blank">accedi su ProntoCurriculum</a>, poi ricarica questa pagina.`;
      authBadge.className = "auth-badge bad";
    }
  });

  for (const [code, label] of LANGS) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    langSelect.appendChild(opt);
  }

  chrome.storage.sync.get(["pcLang"], (res) => {
    langSelect.value = res.pcLang || "IT";
  });
  langSelect.addEventListener("change", () => {
    chrome.storage.sync.set({ pcLang: langSelect.value });
  });

  panel.querySelector("#pc-close").addEventListener("click", () => {
    host.style.display = "none";
  });

  const headerEl = panel.querySelector(".header");
  let drag = null;
  headerEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest("#pc-close")) return;
    const rect = host.getBoundingClientRect();
    drag = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
    headerEl.setPointerCapture(e.pointerId);
  });
  headerEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const left = drag.startLeft + (e.clientX - drag.startX);
    const top = drag.startTop + (e.clientY - drag.startY);
    host.style.left = `${Math.max(0, left)}px`;
    host.style.top = `${Math.max(0, top)}px`;
    host.style.right = "auto";
  });
  headerEl.addEventListener("pointerup", () => {
    drag = null;
  });

  function setStatus(html, cls) {
    statusEl.innerHTML = html ? `<div class="${cls}">${html}</div>` : "";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderResult({ cvData, letter, savedCvId }) {
    resultEl.innerHTML = "";

    if (savedCvId) {
      setStatus("✓ CV e lettera salvati nella tua Dashboard", "success");
    } else {
      setStatus("CV generato (non salvato automaticamente — apri il sito per salvarlo).", "note");
    }

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "btn secondary";
    openBtn.textContent = "Apri Dashboard";
    openBtn.addEventListener("click", () => {
      window.open(`${SITE_URL}/dashboard`, "_blank", "noopener");
    });
    resultEl.appendChild(openBtn);

    const cvCard = document.createElement("div");
    cvCard.className = "cv-card";
    const cvEyebrow = document.createElement("p");
    cvEyebrow.className = "eyebrow";
    cvEyebrow.textContent = "CV su misura";
    const cvTitle = document.createElement("h4");
    cvTitle.textContent = cvData.title || "CV";
    const cvSummary = document.createElement("p");
    cvSummary.textContent = cvData.summary || "";
    cvCard.appendChild(cvEyebrow);
    cvCard.appendChild(cvTitle);
    cvCard.appendChild(cvSummary);
    resultEl.appendChild(cvCard);

    if (letter) {
      const paragraphs = [letter.hookParagraph, letter.valueParagraph, letter.cultureParagraph, letter.closingParagraph].filter(
        Boolean,
      );
      const fullText = [letter.recipient, ...paragraphs, letter.signOff].filter(Boolean).join("\n\n");

      const letterCard = document.createElement("div");
      letterCard.className = "letter-card";

      const lcHead = document.createElement("div");
      lcHead.className = "lc-head";
      const lcEyebrow = document.createElement("p");
      lcEyebrow.className = "eyebrow";
      lcEyebrow.textContent = "Lettera di presentazione";
      lcHead.appendChild(lcEyebrow);
      if (typeof letter.fitScore === "number") {
        const fitPill = document.createElement("span");
        fitPill.className = "fit-pill";
        fitPill.textContent = `Match ${letter.fitScore}%`;
        fitPill.title = letter.fitNote || "";
        lcHead.appendChild(fitPill);
      }
      letterCard.appendChild(lcHead);

      const lcBody = document.createElement("div");
      lcBody.className = "lc-body";
      if (letter.recipient) {
        const recipientP = document.createElement("p");
        recipientP.textContent = letter.recipient;
        lcBody.appendChild(recipientP);
      }
      for (const para of paragraphs) {
        const p = document.createElement("p");
        p.textContent = para;
        lcBody.appendChild(p);
      }
      if (letter.signOff) {
        const signP = document.createElement("p");
        signP.textContent = letter.signOff;
        lcBody.appendChild(signP);
      }
      letterCard.appendChild(lcBody);

      const lcActions = document.createElement("div");
      lcActions.className = "lc-actions";
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn secondary";
      copyBtn.textContent = "Copia lettera";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(fullText);
          copyBtn.textContent = "Copiata ✓";
          setTimeout(() => (copyBtn.textContent = "Copia lettera"), 1500);
        } catch {
          copyBtn.textContent = "Copia manuale (clipboard bloccata)";
        }
      });
      lcActions.appendChild(copyBtn);
      letterCard.appendChild(lcActions);

      resultEl.appendChild(letterCard);
    }
  }

  generateBtn.addEventListener("click", () => {
    const jobDescription = descTextarea.value.trim();
    if (jobDescription.length < 50) {
      setStatus("Il testo dell'offerta è troppo corto (minimo 50 caratteri).", "error");
      return;
    }

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="spinner"></span>Generazione in corso…';
    setStatus("", "");
    resultEl.innerHTML = "";

    function handleResponse(response) {
      generateBtn.disabled = false;
      generateBtn.textContent = "Genera CV e lettera";

      if (chrome.runtime.lastError || !response) {
        setStatus(
          escapeHtml(
            chrome.runtime.lastError
              ? `${chrome.runtime.lastError.message} — ricarica questa pagina (F5) e riprova.`
              : "Nessuna risposta dall'estensione — ricarica questa pagina (F5) e riprova.",
          ),
          "error",
        );
        return;
      }

      if (!response.ok) {
        const msg = escapeHtml(response.error || "Errore imprevisto.");
        if (response.code === "NOT_AUTHENTICATED") {
          setStatus(
            `${msg} <a href="${SITE_URL}/dashboard" target="_blank" style="color:#b3261e;text-decoration:underline;">Accedi</a>`,
            "error",
          );
        } else {
          setStatus(msg, "error");
        }
        return;
      }

      renderResult(response.data);
    }

    try {
      chrome.runtime.sendMessage(
        {
          type: "PC_GENERATE",
          payload: {
            jobDescription,
            jobTitle: titleInput.value.trim(),
            companyName: companyInput.value.trim(),
            lang: langSelect.value,
          },
        },
        handleResponse,
      );
    } catch (err) {
      generateBtn.disabled = false;
      generateBtn.textContent = "Genera CV e lettera";
      setStatus(
        escapeHtml(`${err.message || err} — ricarica questa pagina (F5) e riprova.`),
        "error",
      );
    }
  });
})();
