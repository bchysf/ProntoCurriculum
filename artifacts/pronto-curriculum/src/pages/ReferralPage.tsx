import React, { useState, useEffect } from 'react';
import type { Page } from '../types';
import { useT } from '../i18n/LanguageContext';

interface ReferralPageProps {
  onNavigate: (page: Page) => void;
}

interface ReferralStats {
  referralCode: string;
  referralUrl: string;
  invitesSent: number;
  friendsSignedUp: number;
  friendsCreatedCv: number;
  rewardedDaysPro: number;
  creditsEarned: number;
}

export default function ReferralPage({ onNavigate }: ReferralPageProps) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: 'PRONTO-IT2026',
    referralUrl: 'https://prontocurriculum.it/join?ref=PRONTO-IT2026',
    invitesSent: 14,
    friendsSignedUp: 4,
    friendsCreatedCv: 3,
    rewardedDaysPro: 90,
    creditsEarned: 15,
  });

  useEffect(() => {
    fetch('/api/referral/status')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.referralCode) {
          setStats(data);
        }
      })
      .catch(() => {
        // Keeps default demo fallback if offline
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${t('ref.whatsappMsg')} ${stats.referralUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(stats.referralUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', padding: '8px 24px 80px' }}>
      {/* Header */}
      <div className="head">
        <div>
          <h1>{t('ref.title')}</h1>
          <p>
            {t('ref.subtitle').replace('{code}', loading ? t('ref.loadingId') : stats.referralCode)}
          </p>
        </div>
      </div>

      {/* Hero Banner Box */}
      <div className="panel panel-cta" style={{ padding: '36px 40px', marginBottom: 36, textAlign: 'center' }}>
        <span className="mono" style={{ display: 'block', marginBottom: 12 }}>
          {t('ref.ambassadorProgram')}
        </span>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.3 }}>
          {t('ref.heroTitle')}
        </h2>
        <p style={{ fontSize: 14.5, color: 'var(--ink-60)', maxWidth: 680, margin: '0 auto 28px', lineHeight: 1.6 }}>
          {t('ref.heroSub')}
        </p>

        {/* Link Box */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px dashed rgba(47, 42, 229, 0.35)',
            borderRadius: 12,
            padding: '14px 20px',
            maxWidth: 580,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <code style={{ fontFamily: 'var(--f-mono)', fontSize: 13.5, fontWeight: 500, color: 'var(--ink)', wordBreak: 'break-all' }}>
            {stats.referralUrl}
          </code>
          <button
            className="btn btn-ink btn-sm"
            onClick={handleCopy}
            style={copied ? { background: '#12805C' } : undefined}
          >
            {copied ? t('ref.linkCopied') : t('ref.copyLink')}
          </button>
        </div>

        {/* Social Share buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <button
            onClick={handleShareWhatsApp}
            style={{ background: '#25D366', color: '#FFFFFF', border: 'none', padding: '9px 16px', borderRadius: 10, fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {t('ref.shareWhatsApp')}
          </button>
          <button
            onClick={handleShareLinkedIn}
            style={{ background: '#0A66C2', color: '#FFFFFF', border: 'none', padding: '9px 16px', borderRadius: 10, fontFamily: 'var(--f-body)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {t('ref.shareLinkedIn')}
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 36 }}>
        <div className="stat" style={{ cursor: 'default' }}>
          <span className="mono">{t('ref.visitsInvites')}</span>
          <div className="stat-num">{stats.invitesSent}</div>
          <div className="stat-sub">{t('ref.visitsSub')}</div>
        </div>

        <div className="stat" style={{ cursor: 'default' }}>
          <span className="mono">{t('ref.cvByFriends')}</span>
          <div className="stat-num" style={{ color: '#12805C' }}>{stats.friendsCreatedCv}</div>
          <div className="stat-sub up">{t('ref.cvByFriendsSub')}</div>
        </div>

        <div className="stat" style={{ cursor: 'default', background: 'var(--tint)', borderColor: 'rgba(47, 42, 229, 0.2)' }}>
          <span className="mono" style={{ color: 'var(--accent)' }}>{t('ref.proDaysUnlocked')}</span>
          <div className="stat-num" style={{ color: 'var(--accent)' }}>+{stats.rewardedDaysPro} {t('ref.days')}</div>
          <div className="stat-sub" style={{ color: 'var(--accent)' }}>{t('ref.proDaysSub')}</div>
        </div>
      </div>

      {/* How it works */}
      <div className="panel" style={{ padding: 32 }}>
        <h3 style={{ textAlign: 'center', fontSize: 18, marginBottom: 24 }}>
          {t('ref.howItWorks3Steps')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: 44, height: 44, background: 'var(--accent)', color: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 14px' }}>1</div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>{t('ref.step1Title')}</h4>
            <p style={{ fontSize: 13, color: 'var(--gray500)', lineHeight: 1.5, margin: 0 }}>
              {t('ref.step1Desc').split('{code}')[0]}<strong>{stats.referralCode}</strong>{t('ref.step1Desc').split('{code}')[1]}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: 44, height: 44, background: 'var(--accent)', color: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 14px' }}>2</div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>{t('ref.step2Title')}</h4>
            <p style={{ fontSize: 13, color: 'var(--gray500)', lineHeight: 1.5, margin: 0 }}>
              {t('ref.step2Desc')}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ width: 44, height: 44, background: '#12805C', color: '#FFFFFF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, margin: '0 auto 14px' }}>3</div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 8px' }}>{t('ref.step3Title')}</h4>
            <p style={{ fontSize: 13, color: 'var(--gray500)', lineHeight: 1.5, margin: 0 }}>
              {t('ref.step3Desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
