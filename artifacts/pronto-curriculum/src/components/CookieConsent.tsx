import { useState, useEffect } from "react";
import { initGA4 } from "../utils/analytics";
import type { Page } from "../types";

interface CookieConsentProps {
  onNavigate: (page: Page) => void;
}

export default function CookieConsent({ onNavigate }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("pc_cookie_consent");
    if (!consent) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    if (consent === "all") {
      initGA4();
    }
    return undefined;
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    localStorage.setItem("pc_cookie_consent", "all");
    initGA4();
    setVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem("pc_cookie_consent", "necessary");
    setVisible(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        right: 24,
        maxWidth: 680,
        margin: "0 auto",
        background: "rgba(20, 23, 31, 0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
        zIndex: 9999,
        color: "#f8fafc",
        fontFamily: "'Switzer', 'Plus Jakarta Sans', sans-serif",
        animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .cc-btn-gold {
            background: var(--gold, #2F2AE5);
            color: #FFFFFF;
            border: none;
            font-weight: 600;
            padding: 10px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13.5px;
            transition: transform 0.15s, opacity 0.15s;
          }
          .cc-btn-gold:hover {
            opacity: 0.92;
            transform: translateY(-1px);
          }
          .cc-btn-outline {
            background: transparent;
            color: #cbd5e1;
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-weight: 500;
            padding: 10px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13.5px;
            transition: background 0.15s, color 0.15s;
          }
          .cc-btn-outline:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
          }
          .cc-link {
            color: #BE9CFF;
            text-decoration: underline;
            cursor: pointer;
            margin: 0 4px;
          }
        `}
      </style>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🍪</span> Trasparenza e rispetto della tua privacy
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "#cbd5e1",
            }}
          >
            Utilizziamo cookie tecnici essenziali per il funzionamento e cookie
            analitici (opzionali) per migliorare l&apos;esperienza su
            ProntoCurriculum ai sensi del D.Lgs. 196/2003 e del GDPR. Leggi la
            nostra
            <span
              className="cc-link"
              onClick={() => {
                onNavigate("privacy" as Page);
              }}
            >
              Informativa Privacy
            </span>
            e la
            <span
              className="cc-link"
              onClick={() => {
                onNavigate("cookie" as Page);
              }}
            >
              Cookie Policy
            </span>
            .
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            className="cc-btn-outline"
            onClick={handleAcceptNecessary}
          >
            Solo necessari
          </button>
          <button
            type="button"
            className="cc-btn-gold"
            onClick={handleAcceptAll}
          >
            Accetta tutti
          </button>
        </div>
      </div>
    </div>
  );
}
