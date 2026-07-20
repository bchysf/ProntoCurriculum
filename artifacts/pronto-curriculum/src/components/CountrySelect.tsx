import { useState, useRef, useEffect } from 'react';

// Real flag images instead of emoji flags: Windows renders 🇮🇹 as the bare
// letters "IT", so every country/language picker uses these instead.
// Flags served by flagcdn.com (flagpedia CDN, free for any use).

export function FlagImg({ cc, size = 20, style }: { cc: string; size?: number; style?: React.CSSProperties }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${cc.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w40/${cc.toLowerCase()}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt=""
      aria-hidden
      style={{
        borderRadius: 3,
        border: '1px solid rgba(20,23,31,.10)',
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export interface CountryOption {
  code: string;
  label: string;
  /** country code for the flag image — defaults to `code` (use e.g. 'gb' for language 'EN') */
  flag?: string;
}

/** Shared country list for job/salary searches (same codes the API supports). */
export const JOB_COUNTRIES: CountryOption[] = [
  { code: 'it', label: 'Italia' },
  { code: 'gb', label: 'Regno Unito' },
  { code: 'de', label: 'Germania' },
  { code: 'fr', label: 'Francia' },
  { code: 'es', label: 'Spagna' },
  { code: 'nl', label: 'Paesi Bassi' },
  { code: 'us', label: 'Stati Uniti' },
  { code: 'ch', label: 'Svizzera' },
  { code: 'ca', label: 'Canada' },
  { code: 'au', label: 'Australia' },
  { code: 'nz', label: 'Nuova Zelanda' },
  { code: 'ae', label: 'Emirati Arabi Uniti' },
  { code: 'sa', label: 'Arabia Saudita' },
  { code: 'qa', label: 'Qatar' },
  { code: 'kw', label: 'Kuwait' },
  { code: 'bh', label: 'Bahrein' },
  { code: 'om', label: 'Oman' },
  { code: 'ie', label: 'Irlanda' },
  { code: 'se', label: 'Svezia' },
  { code: 'no', label: 'Norvegia' },
  { code: 'dk', label: 'Danimarca' },
  { code: 'be', label: 'Belgio' },
  { code: 'at', label: 'Austria' },
  { code: 'sg', label: 'Singapore' },
];

interface CountrySelectProps {
  options: CountryOption[];
  value: string;
  onChange: (code: string) => void;
  /** 'bare' = borderless (inside a composed bar) · 'field' = filled gray input look · 'mini' = compact bordered (sidebar) */
  variant?: 'bare' | 'field' | 'mini';
  /** show only the code (uppercase) instead of the full label in the closed trigger */
  short?: boolean;
  /** open the list above the trigger (for triggers near the bottom of the viewport) */
  dropUp?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function CountrySelect({
  options, value, onChange, variant = 'field', short = false, dropUp = false, disabled = false, className, style, ariaLabel,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.code === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`cselect ${variant}${className ? ` ${className}` : ''}`} style={style}>
      <button
        type="button"
        className="cselect-trigger"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {selected && <FlagImg cc={selected.flag ?? selected.code} size={variant === 'mini' ? 18 : 20} />}
        <span className="cselect-label">{selected ? (short ? selected.code.toUpperCase() : selected.label) : ''}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="cselect-chev">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={`cselect-pop${dropUp ? ' up' : ''}`} role="listbox">
          {options.map(o => (
            <button
              type="button"
              key={o.code}
              role="option"
              aria-selected={o.code === value}
              className={`cselect-opt${o.code === value ? ' on' : ''}`}
              onClick={() => { onChange(o.code); setOpen(false); }}
            >
              <FlagImg cc={o.flag ?? o.code} size={20} />
              <span>{o.label}</span>
              {o.code === value && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
