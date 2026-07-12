// Google Analytics (GA4) Utility with GDPR Cookie Consent check

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let isInitialized = false;

export const DEFAULT_GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-PRONTOCV01";

/**
 * Initializes Google Analytics (GA4) dynamically when cookie consent is granted.
 */
export function initGA4(measurementId: string = DEFAULT_GA_ID): void {
  if (typeof window === "undefined" || isInitialized) return;
  if (localStorage.getItem("pc_cookie_consent") !== "all") return;

  // Check if script is already present
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    isInitialized = true;
    return;
  }

  const idToUse = measurementId === "G-XXXXXXXXXX" ? DEFAULT_GA_ID : measurementId;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${idToUse}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", idToUse, {
    send_page_view: false, // SPA will trigger page views manually via trackPageView
  });

  isInitialized = true;
}

/**
 * Tracks SPA page navigation.
 */
export function trackPageView(pageName: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("pc_cookie_consent") !== "all") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_title: pageName,
    page_location: window.location.origin + "/" + pageName,
    page_path: "/" + pageName,
  });
}

/**
 * Tracks custom events (e.g. CV created, PDF downloaded, pricing modal opened).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("pc_cookie_consent") !== "all") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, params);
}
