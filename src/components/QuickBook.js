'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { makeT } from '@/lib/i18n';

export default function QuickBook({ services, locale }) {
  const t = makeT(locale);
  const router = useRouter();
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  function submit(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (service) p.set('service', service);
    if (date) p.set('date', date);
    if (phone) p.set('phone', phone);
    router.push(`/${locale}/booking?${p.toString()}`);
  }

  return (
    <form className="quick-book" onSubmit={submit}>
      <h3><Icon name="calendar" size={20} className="primary-text" /> {t('nav.book')}</h3>

      <div className="field">
        <label className="label">{t('booking.chooseService')}</label>
        <select className="select" value={service} onChange={(e) => setService(e.target.value)} required>
          <option value="">— {t('booking.chooseService')} —</option>
          {services.map((s) => (
            <option key={s.id} value={s.slug}>
              {locale === 'en' ? s.nameEn : s.nameAr} · {s.price} ₪
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="label">{t('common.date')}</label>
          <input className="input" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">{t('common.phone')}</label>
          <input className="input" type="tel" dir="ltr" placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-primary btn-block" type="submit">
        {t('booking.confirm')} <Icon name="arrow" size={17} />
      </button>
    </form>
  );
}
