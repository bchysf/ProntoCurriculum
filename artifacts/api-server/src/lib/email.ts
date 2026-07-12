import pino from "pino";

const logger = pino({ name: "EmailService" });

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sends an email using Resend API if RESEND_API_KEY is present,
 * otherwise logs the email payload cleanly for development and mock testing.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = "ProntoCurriculum <notifiche@prontocurriculum.it>",
}: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    logger.info({ to, subject, from }, "📧 [DEV EMAIL MOCK] Email triggered (RESEND_API_KEY not set)");
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ status: res.status, errText }, "❌ Error sending email via Resend");
      return { success: false, error: errText };
    }

    const data = await res.json() as { id?: string };
    logger.info({ to, subject, id: data.id }, "✅ Email successfully delivered via Resend");
    return { success: true, id: data.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message }, "❌ Exception in sendEmail");
    return { success: false, error: message };
  }
}

// ─── HTML EMAIL TEMPLATES (Exact Brand Styling) ──────────────────────────

const BASE_HEADER = `
  <div style="background-color: #0F172A; padding: 24px 32px; text-align: center; border-bottom: 2px solid #F59E0B;">
    <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.03em;">
      Pronto<span style="color: #F59E0B;">Curriculum</span>.it
    </span>
  </div>
`;

const BASE_FOOTER = `
  <div style="background-color: #F8FAFC; padding: 24px 32px; text-align: center; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
    <p style="margin: 0 0 8px;">© ${new Date().getFullYear()} ProntoCurriculum.it — Il punto di riferimento per il CV scientifico e certificato ATS in Italia.</p>
    <p style="margin: 0;">Hai domande o hai bisogno di supporto? Scrivici a <a href="mailto:assistenza@prontocurriculum.it" style="color: #A855F7; text-decoration: underline;">assistenza@prontocurriculum.it</a></p>
    <p style="margin: 8px 0 0; font-size: 11px; color: #94A3B8;">Ai sensi del Regolamento UE 2016/679 (GDPR), puoi gestire i tuoi dati o cancellarti dalle notifiche in qualsiasi momento dal tuo pannello.</p>
  </div>
`;

export function getWelcomeEmailHtml(name: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; font-family: 'Plus Jakarta Sans', Arial, sans-serif; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      ${BASE_HEADER}
      <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #0F172A; margin-top: 0;">
          Benvenuto in ProntoCurriculum, ${name || "Professionista"}! 🚀
        </h1>
        <p style="font-size: 16px;">
          Siamo entusiasti di averti a bordo. Il nostro obiettivo è aiutarti a superare i filtri di selezione automatica (<strong>ATS</strong>) e farti ottenere il <strong>3x di colloqui in più</strong> in Italia e in Europa.
        </p>
        <div style="background-color: #F1F5F9; border-left: 4px solid #F59E0B; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #334155;">
            💡 <strong>Consiglio del giorno:</strong> Il 75% dei recruiter scarta i CV non strutturati nei primi 6 secondi. Utilizza il nostro calcolatore ATS in tempo reale per verificare la nitidezza semantica prima di ogni invio.
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://prontocurriculum.it" style="background: linear-gradient(90deg, #F59E0B, #A855F7); color: #FFFFFF; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            Crea il Tuo Primo CV su Misura →
          </a>
        </div>
        <p style="font-size: 14px; color: #64748B;">
          A presto,<br/><strong>Il Team di ProntoCurriculum</strong>
        </p>
      </div>
      ${BASE_FOOTER}
    </div>
  `;
}

export function getCvReadyEmailHtml(cvTitle: string, atsScore: number): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; font-family: 'Plus Jakarta Sans', Arial, sans-serif; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      ${BASE_HEADER}
      <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #0F172A; margin-top: 0;">
          Il tuo CV "${cvTitle}" è pronto per il successo! ✨
        </h1>
        <p style="font-size: 16px;">
          Hai appena completato l'ottimizazione del tuo curriculum. Il nostro algoritmo ha calcolato un <strong>punteggio ATS di ${atsScore}/100</strong> per questo documento.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 600;">Punteggio di Conformità ATS</span>
          <div style="font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 700; color: ${atsScore >= 80 ? '#10B981' : atsScore >= 60 ? '#F59E0B' : '#EF4444'}; margin: 4px 0;">
            ${atsScore}<span style="font-size: 20px; color: #94A3B8;">/100</span>
          </div>
          <p style="margin: 0; font-size: 13px; color: #64748B;">
            ${atsScore >= 80 ? 'Eccellente! Il tuo CV supererà agevolmente i filtri automatici.' : 'Buono, ma puoi ancora ottimizzare le keyword specifiche per aumentare le probabilità di chiamata.'}
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://prontocurriculum.it" style="background-color: #0F172A; color: #FFFFFF; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
            Accedi all'Archivio per il Download →
          </a>
        </div>
      </div>
      ${BASE_FOOTER}
    </div>
  `;
}

export function getAbandonedCvEmailHtml(userName: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; font-family: 'Plus Jakarta Sans', Arial, sans-serif; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      ${BASE_HEADER}
      <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #0F172A; margin-top: 0;">
          Hai lasciato il tuo CV a metà, ${userName || "ciao"}! 💼
        </h1>
        <p style="font-size: 16px;">
          Abbiamo salvato automaticamente la tua bozza nel nostro cloud protetto. Non lasciare che quell'opportunità lavorativa ti sfugga per colpa di un CV incompleto!
        </p>
        <p style="font-size: 15px; color: #475569;">
          Con il nostro strumento <strong>CV su Misura (Tailoring AI)</strong>, ti basta incollare il testo dell'offerta di lavoro a cui vuoi candidarti: l'intelligenza artificiale estrarrà le keyword esatte richieste dall'azienda in meno di 10 secondi.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://prontocurriculum.it" style="background: linear-gradient(90deg, #F59E0B, #A855F7); color: #FFFFFF; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
            Riprendi la Compilazione del CV →
          </a>
        </div>
      </div>
      ${BASE_FOOTER}
    </div>
  `;
}

export function getTrialExpiryEmailHtml(userName: string, daysLeft: number): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; font-family: 'Plus Jakarta Sans', Arial, sans-serif; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      ${BASE_HEADER}
      <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #0F172A; margin-top: 0;">
          ⏳ Il tuo piano Pro scade tra ${daysLeft} ${daysLeft === 1 ? 'giorno' : 'giorni'}!
        </h1>
        <p style="font-size: 16px;">
          Ciao ${userName || "Professionista"}, ti ricordiamo che il tuo accesso illimitato alle funzionalità AI di ProntoCurriculum sta per terminare.
        </p>
        <p style="font-size: 15px; color: #475569;">
          Per continuare a utilizzare il calcolatore ATS, il generatore di Lettere di Presentazione su misura e i modelli Executive senza filigrana, assicurati di rinnovare il tuo piano.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://prontocurriculum.it" style="background-color: #0F172A; color: #F59E0B; border: 2px solid #F59E0B; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
            Gestisci la Tua Sottoscrizione →
          </a>
        </div>
      </div>
      ${BASE_FOOTER}
    </div>
  `;
}

export function getReferralRewardEmailHtml(userName: string, rewardedDays: number): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; font-family: 'Plus Jakarta Sans', Arial, sans-serif; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      ${BASE_HEADER}
      <div style="padding: 36px 32px; color: #1E293B; line-height: 1.6;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #0F172A; margin-top: 0;">
          🎉 Congratulazioni! Hai guadagnato +${rewardedDays} Giorni di Pro Gratis!
        </h1>
        <p style="font-size: 16px;">
          Ottimo lavoro, ${userName || "amico"}! Un tuo collega si è appena iscritto a ProntoCurriculum utilizzando il tuo link di invito e ha creato il suo primo curriculum professionale.
        </p>
        <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 14px; color: #92400E; font-weight: 700;">Bonus Ricompensa Attivato</span>
          <p style="margin: 6px 0 0; font-size: 18px; color: #B45309; font-weight: 800;">
            +${rewardedDays} Giorni di Accesso Pro Illimitato
          </p>
        </div>
        <p style="font-size: 15px; color: #475569; text-align: center;">
          Continua a condividere il tuo link per accumulare ancora più mesi gratuiti!
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://prontocurriculum.it" style="background: linear-gradient(90deg, #F59E0B, #A855F7); color: #FFFFFF; font-weight: 700; font-size: 16px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block;">
            Vedi il Tuo Saldo Referral →
          </a>
        </div>
      </div>
      ${BASE_FOOTER}
    </div>
  `;
}
