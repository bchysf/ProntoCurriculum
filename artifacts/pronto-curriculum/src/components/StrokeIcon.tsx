// Shared minimal stroke icon set (lucide-style paths, pipe-separated)

export function Icon({ d, size = 15, className, style }: {
  d: string; size?: number; className?: string; style?: React.CSSProperties;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={className} style={style}>
      {d.split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

export const IC = {
  doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M16 13H8|M16 17H8',
  spark: 'M12 3l1.9 5.6 5.6 1.9-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z|M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M3 12h18|M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  trash: 'M3 6h18|M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2|M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36|M21 3v6h-6',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4|M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  upload: 'M12 15V3m0 0L8 7m4-4l4 4|M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z|M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  palette: 'M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-2 2v1a3 3 0 0 1-2 3z|M7.5 11a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z|M11.5 7a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z|M16 9a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z|M17 21v-8H7v8|M7 3v5h8',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18|M6 6l12 12',
  bulb: 'M9 18h6|M10 22h4|M12 2a7 7 0 0 1 4 12.7c-.6.5-1 1.2-1 2V17H9v-.3c0-.8-.4-1.5-1-2A7 7 0 0 1 12 2z',
  arrowRight: 'M5 12h14|M13 6l6 6-6 6',
  import: 'M12 3v12m0 0l-4-4m4 4l4-4|M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
};
