import React from 'react';

interface BrandLogoProps {
  onClick?: () => void;
  style?: React.CSSProperties;
  iconSize?: number;
  fontSize?: number;
  className?: string;
}

/**
 * Universal brand mark — mirrors the "Carta & Inchiostro" `.brand` style
 * (Switzer display type, accent→violet gradient) so the logo looks the same
 * on every page, inside or outside the `.dv3` scope.
 */
export default function BrandLogo({
  onClick,
  style,
  iconSize = 24,
  fontSize = 17,
  className = 'pc-brand-logo',
}: BrandLogoProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        fontFamily: "'Switzer', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontWeight: 700,
        fontSize,
        letterSpacing: '-0.03em',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src="/logo-icon.png"
        alt="ProntoCurriculum"
        style={{
          width: iconSize,
          height: iconSize,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          background: 'linear-gradient(90deg, #2F2AE5, #7C5CFF)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        ProntoCurriculum
      </span>
    </div>
  );
}
