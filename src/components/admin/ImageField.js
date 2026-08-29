'use client';
import { useRef, useState } from 'react';
import Icon from '../Icon';
import SmartImage from '../SmartImage';
import { makeT } from '@/lib/i18n';

export default function ImageField({ label, value, onChange, locale }) {
  const t = makeT(locale);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch (e) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field">
      <label className="label">{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 62, height: 62, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)', flexShrink: 0, border: '1px solid var(--border)' }}>
          <SmartImage src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} label="IMG" />
        </div>
        <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://... أو ارفع صورة" dir="ltr" style={{ flex: 1 }} />
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Icon name="download" size={15} /> {uploading ? '...' : (locale === 'en' ? 'Upload' : 'رفع')}
        </button>
      </div>
    </div>
  );
}
