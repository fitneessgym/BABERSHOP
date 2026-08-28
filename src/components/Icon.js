const P = {
  scissors: 'M6 3L18 15M18 3L6 15M14 14a3 3 0 106 0 3 3 0 10-6 0zM4 20a3 3 0 106 0 3 3 0 10-6 0z',
  razor: 'M4 20h16M6 20V8l10-4v16M6 12h10',
  beard: 'M8 4v6a4 4 0 008 0V4M12 14v7M9 21h6',
  crown: 'M3 8l4 4 5-7 5 7 4-4v11H3z',
  child: 'M12 3a4 4 0 100 8 4 4 0 100-8zM12 11v5m0 0l-3 7m3-7l3 7',
  palette: 'M12 21a9 9 0 110-18c5 0 9 3.5 9 8 0 2.5-2 4-4.5 4H15a2 2 0 00-1.4 3.4A1.8 1.8 0 0112 21zM7.5 11.5h.01M11 8h.01M15.5 9.5h.01',
  sparkle: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z',
  droplet: 'M12 3s6 6.5 6 10.5A6 6 0 016 13.5C6 9.5 12 3 12 3z',
  star: 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2',
  users: 'M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9.5 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  heart: 'M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21l8.8-8.3a5 5 0 000-7.1z',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  mail: 'M4 4h16v16H4zM4 6l8 6 8-6',
  map: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
  cart: 'M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2zM1 2h3l2.6 12.4a2 2 0 002 1.6h9.8a2 2 0 002-1.6L22 7H6',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  checkCircle: 'M22 11.1V12a10 10 0 11-5.9-9.1M22 4l-10 10-3-3',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
  edit: 'M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z',
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 11h18',
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 12h8v9h-8zM3 15h8v6H3z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H10a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V10a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  package: 'M21 16V8l-9-5-9 5v8l9 5zM3.3 7L12 12l8.7-5M12 22V12',
  tag: 'M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-7.2-7.2A2 2 0 013 12V4h8a2 2 0 011.4.6l7.2 7.2a2 2 0 010 2.8zM7.5 7.5h.01',
  image: 'M3 3h18v18H3zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  filter: 'M22 3H2l8 9.5V19l4 2v-8.5z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  instagram: 'M16 3h2a5 5 0 015 5v2M8 21H6a5 5 0 01-5-5v-2M21 12v4a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5h4M17 8a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zM12 16a4 4 0 100-8 4 4 0 000 8z',
  facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  tiktok: 'M9 12a4 4 0 104 4V4c1 0 2.5.5 3 2M13 4v12',
  whatsapp: 'M21 11.5a8.4 8.4 0 01-9 8.4 9.9 9.9 0 01-3.4-.6L3 21l1.8-5.4A8.4 8.4 0 1112 3a8.4 8.4 0 019 8.5zM8.5 9.5c0 5 4 9 9 9',
  snapchat: 'M12 3c3 0 6 2 6 5.5 0 .8.5 1.4 1 1.8.3.2.5.6.5 1 0 1.5-1 2.2-2 2.4-.2 2.5-1.8 4-3.5 4.2v2.1a1.3 1.3 0 01-2.6 0v-2.1C8.8 17.7 7 16 7 13c-1-.2-2-1-2-2.4 0-.4.2-.8.5-1 .5-.4 1-1 1-1.8C6.5 5 9 3 12 3z',
  x: 'M18 3L3 21M21 3L6 21',
  award: 'M12 15a6 6 0 100-12 6 6 0 000 12zM8.2 13.8L7 22l5-3 5 3-1.2-8.2',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7C10 7 7 7 7 4.5S10 2 12 2s5 .5 5 3-3 2-5 2z',
  truck: 'M1 3h13v13H1zM14 8h4l3 3v5h-7M5.5 20a2 2 0 100-4 2 2 0 000 4zM17.5 20a2 2 0 100-4 2 2 0 000 4z',
  percent: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z',
  wallet: 'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 000 4h4v-4z',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
  refresh: 'M23 4v6h-6M1 20v-6h6M20.5 9A9 9 0 005.6 5.6L1 10M3.5 15a9 9 0 0014.9 3.4L23 14',
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8, fill = 'none' }) {
  const d = P[name] || P.star;
  const solid = ['star'].includes(name) && fill === 'solid';
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={solid ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={{ flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

export function Stars({ rating = 5, size = 15 }) {
  const full = Math.round(rating);
  return (
    <span className="stars" style={{ gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < full ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={1.5} className={i < full ? '' : 'off'}>
          <path d={P.star} />
        </svg>
      ))}
    </span>
  );
}
