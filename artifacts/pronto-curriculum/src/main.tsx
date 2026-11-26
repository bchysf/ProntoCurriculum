import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// After a deploy, a tab opened on the previous build still references the old
// hashed chunks, which no longer exist — lazy imports (e.g. the PDF export)
// then fail with "Failed to fetch dynamically imported module". Reload once to
// pick up the current build; the timestamp guard prevents a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  const KEY = "pc-chunk-reload-at";
  let last = 0;
  try { last = Number(sessionStorage.getItem(KEY) ?? 0); } catch { /* storage blocked */ }
  if (Date.now() - last < 10_000) return;
  try { sessionStorage.setItem(KEY, String(Date.now())); } catch { /* storage blocked */ }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
