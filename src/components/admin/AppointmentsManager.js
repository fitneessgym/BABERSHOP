'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AppointmentsManager({ bookings, services, barbers, locale, settings }) {
  const t = makeT(locale);
  const en = locale === 'en';
  const router = useRouter();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [barberId, setBarberId] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const list = bookings
    .filter((b) => (date ? b.date === date : true))
    .filter((b) => (status ? b.status === status : true))
    .filter((b) => (barberId ? b.barberId === barberId : true))
    .filter((b) => (q ? (b.customerName + b.phone + b.code).toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  async function changeStatus(b, newStatus) {
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: b.id, data: { status: newStatus } }),
    });
    router.refresh();
  }

  async function remove(b) {
    if (!confirm(t('admin.confirmDelete'))) return;
    await fetch('/api/admin/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: b.id }),
    });
    router.refresh();
  }

  async function saveManual() {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', data: modal }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setModal(null);
      setDate(modal.date);
      router.refresh();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const statusLabel = (s) => ({
    pending: t('admin.stPending'), confirmed: t('admin.stConfirmed'),
    completed: t('admin.stCompleted'), cancelled: t('admin.stCancelled'),
  }[s] || s);

  const statusClass = { pending: 'pending', confirmed: 'confirmed', completed: 'completed', cancelled: 'cancelled' };

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3><Icon name="calendar" size={17} className="primary-text" /> {t('admin.appointments')} <span className="badge badge-gray">{list.length}</span></h3>
        <div className="flex gap-1 wrap">
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={14} /> {t('admin.print')}</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setModal({ date: date || fmt(new Date()), time: '10:00', status: 'confirmed', customerName: '', phone: '', serviceId: services[0]?.id || '', barberId: '', notes: '' })}
          >
            <Icon name="plus" size={15} /> {t('booking.newBooking')}
          </button>
        </div>
      </div>

      <div className="admin-card-body">
        <div className="filters">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={() => setDate(fmt(new Date()))}>{t('admin.todayAppointments')}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setDate('')}>{t('common.all')}</button>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('common.status')} — {t('common.all')}</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
          <select className="select" value={barberId} onChange={(e) => setBarberId(e.target.value)}>
            <option value="">{t('nav.barbers')} — {t('common.all')}</option>
            {barbers.map((b) => <option key={b.id} value={b.id}>{en ? b.nameEn : b.nameAr}</option>)}
          </select>
          <input className="input" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 160 }} />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.time')}</th>
                <th>{t('admin.customer')}</th>
                <th>{t('nav.services')}</th>
                <th>{t('nav.barbers')}</th>
                <th>{t('common.price')}</th>
                <th>{t('common.status')}</th>
                <th style={{ textAlign: 'end' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td><b dir="ltr" style={{ color: 'var(--primary)' }}>{b.time}</b><div className="small muted" dir="ltr">{b.date}</div></td>
                  <td>
                    <b>{b.customerName}</b>
                    <div className="small muted" dir="ltr">{b.phone}</div>
                    <div className="small muted">{b.code}</div>
                  </td>
                  <td>{(() => { const s = services.find((x) => x.id === b.serviceId); return s ? (en ? s.nameEn : s.nameAr) : b.serviceName; })()}</td>
                  <td>{(() => { const s = barbers.find((x) => x.id === b.barberId); return s ? (en ? s.nameEn : s.nameAr) : t('booking.anyBarber'); })()}</td>
                  <td><b>{b.price} {settings.currency}</b></td>
                  <td>
                    <select
                      className="select"
                      value={b.status}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 13, minWidth: 110 }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'end' }}>
                    <span className={`badge badge-${statusClass[b.status]}`} style={{ marginInlineEnd: 8 }}>{statusLabel(b.status)}</span>
                    <button className="icon-btn" onClick={() => remove(b)} style={{ width: 32, height: 32, color: '#f85149' }}>
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={7}><div className="empty"><Icon name="calendar" size={40} /><p>{t('common.empty')}</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal">
          <div className="overlay" onClick={() => setModal(null)} />
          <div className="modal-box">
            <div className="modal-head">
              <b>{t('booking.newBooking')}</b>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="grid-form">
                <div className="field"><label className="label">{t('common.name')}</label>
                  <input className="input" value={modal.customerName} onChange={(e) => setModal({ ...modal, customerName: e.target.value })} /></div>
                <div className="field"><label className="label">{t('common.phone')}</label>
                  <input className="input" dir="ltr" value={modal.phone} onChange={(e) => setModal({ ...modal, phone: e.target.value })} /></div>
                <div className="field"><label className="label">{t('nav.services')}</label>
                  <select className="select" value={modal.serviceId} onChange={(e) => setModal({ ...modal, serviceId: e.target.value })}>
                    {services.map((s) => <option key={s.id} value={s.id}>{en ? s.nameEn : s.nameAr}</option>)}
                  </select></div>
                <div className="field"><label className="label">{t('nav.barbers')}</label>
                  <select className="select" value={modal.barberId} onChange={(e) => setModal({ ...modal, barberId: e.target.value })}>
                    <option value="">{t('booking.anyBarber')}</option>
                    {barbers.map((b) => <option key={b.id} value={b.id}>{en ? b.nameEn : b.nameAr}</option>)}
                  </select></div>
                <div className="field"><label className="label">{t('common.date')}</label>
                  <input className="input" type="date" value={modal.date} onChange={(e) => setModal({ ...modal, date: e.target.value })} /></div>
                <div className="field"><label className="label">{t('common.time')}</label>
                  <input className="input" type="time" value={modal.time} onChange={(e) => setModal({ ...modal, time: e.target.value })} /></div>
                <div className="field"><label className="label">{t('common.status')}</label>
                  <select className="select" value={modal.status} onChange={(e) => setModal({ ...modal, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select></div>
                <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">{t('admin.note')}</label>
                  <textarea className="textarea" value={modal.notes} onChange={(e) => setModal({ ...modal, notes: e.target.value })} style={{ minHeight: 70 }} /></div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={saveManual} disabled={busy}><Icon name="save" size={16} /> {t('common.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
