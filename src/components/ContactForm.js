'use client';
import { useState } from 'react';
import Icon from './Icon';
import { makeT } from '@/lib/i18n';

export default function ContactForm({ locale, defaultMsg = '', settings }) {
  const t = makeT(locale);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: defaultMsg });
  const [state, setState] = useState({ loading: false, done: false, error: '' });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.message) { setState({ loading: false, done: false, error: t('store.fillRequired') }); return; }
    setState({ loading: true, done: false, error: '' });
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setState({ loading: false, done: true, error: '' });
      setForm({ name: '', phone: '', email: '', message: '' });
    } catch (err) {
      setState({ loading: false, done: false, error: err.message });
    }
  }

  if (state.done) {
    return (
      <div className="alert alert-success" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <b style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="checkCircle" size={18} /> {t('contact.sent')}</b>
        {settings?.whatsapp && (
          <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="small">
            {t('contact.whatsapp')} →
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      {state.error && <div className="alert alert-error">{state.error}</div>}
      <div className="form-row">
        <div className="field">
          <label className="label">{t('common.name')} <span>*</span></label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div className="field">
          <label className="label">{t('common.phone')}</label>
          <input className="input" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} />
        </div>
      </div>
      <div className="field">
        <label className="label">{t('common.email')}</label>
        <input className="input" type="email" dir="ltr" value={form.email} onChange={set('email')} />
      </div>
      <div className="field">
        <label className="label">{t('contact.message')} <span>*</span></label>
        <textarea className="textarea" value={form.message} onChange={set('message')} required />
      </div>
      <button className="btn btn-primary btn-block" disabled={state.loading}>
        {state.loading ? t('common.loading') : (<><Icon name="message" size={17} /> {t('contact.send')}</>)}
      </button>
    </form>
  );
}
