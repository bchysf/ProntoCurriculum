// Background service worker: owns the authenticated fetch calls.
// Content scripts can't read the httpOnly "sid" cookie, and we'd rather not
// duplicate the site's login flow — chrome.cookies can read it directly
// (that's the one API allowed to see httpOnly cookies), and the API already
// accepts it as a Bearer token (see artifacts/api-server/src/lib/auth.ts).

// The bare domain 308-redirects here — the "sid" session cookie is scoped
// to www (host-only, no Domain attribute on the Set-Cookie), so this must
// match exactly or chrome.cookies.get() finds nothing.
const API_BASE = "https://www.prontocurriculum.it";
const SITE_URL = "https://www.prontocurriculum.it";

async function getSid() {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: API_BASE, name: "sid" }, (cookie) => {
      resolve(cookie ? cookie.value : null);
    });
  });
}

async function apiFetch(path, options = {}) {
  const sid = await getSid();
  if (!sid) {
    const err = new Error("Devi accedere su ProntoCurriculum per generare il CV.");
    err.code = "NOT_AUTHENTICATED";
    throw err;
  }

  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sid}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Errore ${res.status}`);
  }
  return data;
}

async function handleGenerate({ jobDescription, jobTitle, companyName, lang }) {
  const { cvData } = await apiFetch("/api/tailor-cv", {
    method: "POST",
    body: JSON.stringify({ jobDescription, lang }),
  });

  let savedCvId = null;
  try {
    const confirmRes = await apiFetch("/api/tailor-cv/confirm", {
      method: "POST",
      body: JSON.stringify({ cvData, jobDescription }),
    });
    savedCvId = confirmRes.savedCvId || null;
  } catch {
    // Non-fatal: the user still gets the generated CV/letter even if the
    // save-to-archive step fails for some reason.
  }

  let letter = null;
  try {
    const coverRes = await apiFetch("/api/cover-letter/generate", {
      method: "POST",
      body: JSON.stringify({
        cvData,
        jobTitle: jobTitle || cvData.title || "",
        companyName: companyName || "",
        jobDescription,
        tone: "human",
        language: lang,
      }),
    });
    letter = coverRes.data || null;

    if (letter) {
      try {
        await apiFetch("/api/cover-letter/save", {
          method: "POST",
          body: JSON.stringify({
            letterData: letter,
            jobTitle: jobTitle || cvData.title || "",
            companyName: companyName || "",
            tone: "human",
          }),
        });
      } catch {
        // Non-fatal: the user still gets the letter even if it doesn't
        // end up saved in their dashboard.
      }
    }
  } catch {
    // CV generation is the primary deliverable; a cover-letter failure
    // shouldn't blank out an otherwise successful CV.
  }

  return { cvData, letter, savedCvId };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "PC_CHECK_AUTH") {
    getSid().then((sid) => sendResponse({ authenticated: !!sid }));
    return true;
  }

  if (msg?.type === "PC_GENERATE") {
    handleGenerate(msg.payload)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) =>
        sendResponse({
          ok: false,
          error: err.message || String(err),
          code: err.code || null,
        }),
      );
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  // executeScript refuses chrome://, the Web Store, and other privileged
  // pages — that refusal throws, and with no handler the click just looked
  // like nothing happened. Surface it on the badge instead of failing silently.
  if (!/^https?:\/\//.test(tab.url)) {
    chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#b3261e" });
    chrome.action.setTitle({
      tabId: tab.id,
      title: "Non disponibile su questa pagina — apri un annuncio di lavoro in una scheda normale (http/https).",
    });
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch (err) {
    console.error("[ProntoCurriculum] executeScript failed:", err);
    chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#b3261e" });
    chrome.action.setTitle({
      tabId: tab.id,
      title: `Errore: ${err.message || err}`,
    });
  }
});
