'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import SmartImage from './SmartImage';
import { Stars } from './Icon';
import { makeT, dayNames } from '@/lib/i18n';

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const DOW_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function BookingWizard({ services, barbers, settings, locale, initial = {} }) {
  const t = makeT(locale);
  const en = locale === 'en';

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(initial.serviceId || '');
  const [barberId, setBarberId] = useState(initial.barberId || '');
  const [date, setDate] = useState(initial.date || '');
  const [time, setTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [avail, setAvail] = useState({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: initial.phone || '', email: '', notes: '' });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const today = useMemo(() => fmt(new Date()), []);
  const todayObj = useMemo(() => new Date(), []);
  const [view, setView] = useState({ year: todayObj.getFullYear(), month: todayObj.getMonth() });
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (parseInt(settings.maxAdvanceDays || '30', 10) || 30));
    return fmt(d);
  }, [settings.maxAdvanceDays]);

  const service = services.find((s) => s.id === serviceId);
  const barber = barbers.find((b) => b.id === barberId);

  // الأوقات المتاحة لليوم المحدد
  useEffect(() => {
    if (!date || !serviceId) { setSlots([]); return; }
    setLoading(true);
    setTime('');
    fetch(`/api/public/slots?date=${date}&serviceId=${serviceId}${barberId ? `&barberId=${barberId}` : ''}`)
      .then((r) => r.json())
      .then((d) => setSlots(Array.isArray(d) ? d : []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, serviceId, barberId]);

  // توفر أيام الشهر
  useEffect(() => {
    if (!serviceId) { setAvail({}); return; }
    fetch(`/api/public/slots?month=${view.year}-${String(view.month + 1).padStart(2, '0')}&serviceId=${serviceId}${barberId ? `&barberId=${barberId}` : ''}`)
      .then((r) => r.json())
      .then((d) => setAvail(d && typeof d === 'object' && !Array.isArray(d) ? d : {}))
      .catch(() => setAvail({}));
  }, [view, serviceId, barberId]);

  // بناء شبكة التقويم
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startDow; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(view.year, view.month, d));
    return out;
  }, [view]);

  const moveMonth = (dir) => {
    setView((v) => {
      const n = new Date(v.year, v.month + dir, 1);
      return { year: n.getFullYear(), month: n.getMonth() };
    });
  };

  async function confirm() {
    setError('');
    if (!form.name.trim()) { setError(t('booking.enterName')); return; }
    if (!/^[\d\s+\-()]{6,}$/.test(form.phone.trim())) { setError(t('booking.enterPhone')); return; }
    setLoading(true);
    try {
      const slot = slots.find((s) => s.time === time);
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId, barberId: barberId || (slot?.barbers?.[0] || ''), date, time,
          ...form, locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- شاشة النجاح ---------- */
  if (result) {
    return (
      <div className="success-box">
        <div className="success-icon"><Icon name="check" size={46} /></div>
        <h2 style={{ fontSize: 30, marginBottom: 10 }}>{t('booking.success')}</h2>
        <p className="muted">{t('booking.successMsg')}</p>
        <div className="code-badge">{result.code}</div>
        <div className="summary-box text-center mt-2" style={{ maxWidth: 420, marginInline: 'auto' }}>
          <div className="summary-row"><span>{t('nav.services')}</span><span>{en ? result.serviceNameEn : result.serviceNameAr}</span></div>
          <div className="summary-row"><span>{t('nav.barbers')}</span><span>{result.barberName || t('booking.anyBarber')}</span></div>
          <div className="summary-row"><span>{t('common.date')}</span><span dir="ltr">{result.date}</span></div>
          <div className="summary-row"><span>{t('common.time')}</span><span dir="ltr">{result.time}</span></div>
          <div className="summary-row"><span>{t('common.price')}</span><b>{result.price} {settings.currency}</b></div>
        </div>
        <div className="flex gap-2 justify-center wrap mt-3">
          <Link href={`/${locale}`} className="btn btn-primary">{t('nav.home')}</Link>
          <button className="btn btn-ghost" onClick={() => { setResult(null); setStep(1); setDate(''); setTime(''); setServiceId(''); setBarberId(''); setForm({ name: '', phone: '', email: '', notes: '' }); }}>
            {t('booking.bookAgain')}
          </button>
          {settings.whatsapp && (
            <a
              className="btn btn-outline" target="_blank" rel="noreferrer"
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
                `${t('booking.code')}: ${result.code} | ${en ? result.serviceNameEn : result.serviceNameAr} | ${result.date} ${result.time}`
              )}`}
            >
              <Icon name="whatsapp" size={17} /> {t('contact.whatsapp')}
            </a>
          )}
        </div>
      </div>
    );
  }

  const steps = [
    { n: 1, label: t('booking.step1') },
    { n: 2, label: t('booking.step2') },
    { n: 3, label: t('booking.step3') },
    { n: 4, label: t('booking.step4') },
  ];

  return (
    <div>
      <div className="stepper">
        {steps.map((s) => (
          <div key={s.n} className={`step ${step === s.n ? 'on' : ''} ${step > s.n ? 'done' : ''}`}>
            <div className="step-num">{step > s.n ? <Icon name="check" size={20} /> : s.n}</div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error"><Icon name="close" size={16} /> {error}</div>}

      {/* ========== ١. الخدمة ========== */}
      {step === 1 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>{t('booking.chooseService')}</h2>
          <div className="option-grid">
            {services.map((s) => (
              <button
                key={s.id}
                className={`option ${serviceId === s.id ? 'on' : ''}`}
                onClick={() => { setServiceId(s.id); setStep(2); setDate(''); setTime(''); }}
              >
                <span className="service-icon" style={{ width: 46, height: 46, marginBottom: 0 }}>
                  <Icon name={s.icon || 'scissors'} size={22} />
                </span>
                <span style={{ flex: 1, textAlign: 'start' }}>
                  <h4>{en ? s.nameEn : s.nameAr}</h4>
                  <p>{en ? s.descEn : s.descAr}</p>
                  <p className="small muted mt-1"><Icon name="clock" size={13} /> {s.durationMin} {t('common.min')}</p>
                </span>
                <span className="price">{s.price} {settings.currency}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========== ٢. الحلاق ========== */}
      {step === 2 && (
        <div>
          <h2 style={{ marginBottom: 20 }}>{t('booking.chooseBarber')}</h2>
          <div className="option-grid">
            <button className={`option ${barberId === '' ? 'on' : ''}`} onClick={() => { setBarberId(''); setStep(3); setTime(''); }}>
              <span className="service-icon" style={{ width: 46, height: 46, marginBottom: 0 }}><Icon name="users" size={22} /></span>
              <span style={{ flex: 1, textAlign: 'start' }}>
                <h4>{t('booking.anyBarber')}</h4>
                <p>{t('booking.anyBarberDesc')}</p>
              </span>
            </button>
            {barbers.map((b) => (
              <button
                key={b.id}
                className={`option ${barberId === b.id ? 'on' : ''}`}
                onClick={() => { setBarberId(b.id); setStep(3); setTime(''); }}
              >
                <SmartImage src={b.photo} alt={en ? b.nameEn : b.nameAr} className="option-avatar" label="B" />
                <span style={{ flex: 1, textAlign: 'start' }}>
                  <h4>{en ? b.nameEn : b.nameAr}</h4>
                  <p>{en ? b.roleEn : b.roleAr}</p>
                  <span className="small" style={{ marginTop: 4, display: 'inline-flex' }}><Stars rating={b.rating} size={13} /></span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="btn btn-ghost" onClick={() => setStep(1)}><Icon name="chevronRight" size={16} className={en ? 'flip' : ''} /> {t('common.back')}</button>
          </div>
        </div>
      )}

      {/* ========== ٣. التاريخ والوقت ========== */}
      {step === 3 && (
        <div className="two-col-even">
          <div className="calendar-box">
            <div className="cal-head">
              <button onClick={() => moveMonth(-1)}><Icon name="chevronLeft" size={16} /></button>
              <b>{(en ? MONTHS_EN : MONTHS_AR)[view.month]} {view.year}</b>
              <button onClick={() => moveMonth(1)}><Icon name="chevronRight" size={16} /></button>
            </div>
            <div className="cal-grid">
              {(en ? DOW_EN : DOW_AR).map((d, i) => <div className="cal-dow" key={i}>{d}</div>)}
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const ds = fmt(d);
                const disabled = ds < today || ds > maxDate || (avail[ds] !== undefined && avail[ds] === 0);
                return (
                  <button
                    key={i}
                    className={`cal-day ${date === ds ? 'on' : ''} ${avail[ds] > 0 ? 'has' : ''}`}
                    disabled={disabled}
                    onClick={() => setDate(ds)}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <p className="small muted mt-2">{t('booking.pickDate')}</p>
          </div>

          <div>
            <h2 style={{ marginBottom: 8 }}>{t('booking.pickTime')}</h2>
            <p className="small muted mb-2">
              {date ? (
                <>
                  <Icon name="calendar" size={13} /> {date} — {en ? (dayNames.en[new Date(date + 'T00:00:00').getDay()]) : (dayNames.ar[new Date(date + 'T00:00:00').getDay()])}
                </>
              ) : t('booking.pickDate')}
            </p>

            {loading && <p className="muted">{t('common.loading')}</p>}

            {!loading && date && slots.length === 0 && (
              <div className="empty"><Icon name="clock" size={40} /><p>{t('booking.noSlots')}</p></div>
            )}

            {!loading && slots.length > 0 && (
              <div className="slot-grid">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    className={`slot ${time === s.time ? 'on' : ''}`}
                    disabled={!s.available}
                    onClick={() => { setTime(s.time); setStep(4); }}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>{t('common.back')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== ٤. البيانات والتأكيد ========== */}
      {step === 4 && (
        <div className="two-col">
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ marginBottom: 18 }}>{t('booking.step4')}</h2>
            <div className="form-row">
              <div className="field">
                <label className="label">{t('booking.yourName')} <span>*</span></label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">{t('booking.yourPhone')} <span>*</span></label>
                <input className="input" type="tel" dir="ltr" placeholder="05XXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label className="label">{t('common.email')} ({t('common.optional')})</label>
              <input className="input" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">{t('booking.notes')}</label>
              <textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ minHeight: 90 }} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={() => setStep(3)}>{t('common.back')}</button>
              <button className="btn btn-primary grow" onClick={confirm} disabled={loading}>
                <Icon name="checkCircle" size={18} /> {loading ? t('booking.sending') : t('booking.confirm')}
              </button>
            </div>
          </div>

          <aside className="summary-box">
            <h3 style={{ marginBottom: 12 }}>{t('booking.summary')}</h3>
            <div className="summary-row"><span>{t('booking.step1')}</span><b className="small">{en ? service?.nameEn : service?.nameAr}</b></div>
            <div className="summary-row"><span>{t('booking.step2')}</span><span>{barber ? (en ? barber.nameEn : barber.nameAr) : t('booking.anyBarber')}</span></div>
            <div className="summary-row"><span>{t('common.date')}</span><span dir="ltr">{date}</span></div>
            <div className="summary-row"><span>{t('common.time')}</span><span dir="ltr">{time}</span></div>
            <div className="summary-row"><span>{t('booking.duration')}</span><span>{service?.durationMin} {t('common.min')}</span></div>
            <div className="summary-row"><span>{t('common.total')}</span><b>{service?.price} {settings.currency}</b></div>
          </aside>
        </div>
      )}
    </div>
  );
}
