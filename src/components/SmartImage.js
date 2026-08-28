'use client';
import { useState } from 'react';

function fallbackData(label = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1e23"/><stop offset="55%" stop-color="#2a2a31"/><stop offset="100%" stop-color="#16161a"/>
    </linearGradient></defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <g stroke="#c8a15a" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.75" transform="translate(230 250) scale(5.6)">
      <path d="M6 3L18 15M18 3L6 15"/>
    </g>
    <text x="300" y="410" font-family="sans-serif" font-size="24" fill="#6b6b74" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function SmartImage({ src, alt = '', className = '', style, label = '', ...rest }) {
  const [failed, setFailed] = useState(!src);
  return (
    <img
      src={failed ? fallbackData(label) : src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
