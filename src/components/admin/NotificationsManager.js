'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

const CHANNELS = ['whatsapp', 'sms', 'email', 'inapp'];
const TYPES = ['booking_confirm', 'booking_reminder', 'booking_cancel', 'order_new', 'order_status', 'admin_booking', 'admin_order', 'custom'];
const STATUSES = ['pending', 'sent', 'failed', 'skipped'];

export default function NotificationsManager({ initialRows, initialCounts, locale, settings }) {
  const t = makeT(locale);
  const router = useRouter();
  const [rows, setRows] = useState(initialRows || []);
  const [counts, setCounts] = useState(initialCounts || {});
  const [filter, setFilter] = useState({ status: '', channel: '', type: '' });
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const p = new URLSearchParams(filter);
    const res = await fetch(`/api/admin/notifications?${p.toString()}`);
    const d = await res.json();
    setRows(d.rows || []);
    setCounts(d.counts || {});
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function act(action, extra = {}) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (d.link) window.open(d.link, '_blank');
      if (d.error) setToast('⚠️ ' + d.error);
      else if (d.ok_count !== undefined) setToast(`✅ تم الإرسال: ${d.ok_count} / فشل: ${d.fail_count}`);
      else if (d.processed !== undefined) setToast(`✅ تمت المعالجة: ${d.processed} — ناجح: ${d.sent} — فاشل: ${d.failed}`);
      else setToast('✅ تم');
      await load();
      router.refresh();
      setTimeout(() => setToast(''), 3000);
    } catch (e) { setToast('⚠️ ' + e.message); } finally { setBusy(false); }
  }

  const chLabel = (c) => ({ whatsapp: t('notify.chWhatsapp'), sms: t('notify.chSms'), email: t('notify.chEmail'), inapp: t('notify.chInapp') }[c] || c);
  const stLabel = (s) => ({ pending: t('notify.stPending'), sent: t('notify.stSent'), failed: t('notify.stFailed'), skipped: t('notify.stSkipped') }[s] || s);
  const tyLabel = (x) => ({
    booking_confirm: t('notify.tyBookingConfirm'), booking_reminder: t('notify.tyReminder'), booking_cancel: t('notify.tyCancel'),
    order_new: t('notify.tyOrderNew'), order_status: t('notify.tyOrderStatus'), admin_booking: t('notify.tyAdminBooking'),
    admin_order: t('notify.tyAdminOrder'), custom: t('notify.tyCustom'),
  }[x] || x);

  const badge = { pending: 'pending', sent: 'completed', failed: 'cancelled', skipped: 'gray' };

  return (
    <div>
      <div className="stats-grid mb-3">
        {STATUSES.map((s) => (
          <div className="stat-card" key={s} onClick={() => setFilter({ ...filter, status: filter.status === s ? '' : s })} style={{ cursor: 'pointer' }}>
            <div className="si" style={{
              background: s === 'sent' ? 'rgba(46,160,67,0.14)' : s === 'failed' ? 'rgba(229,72,77,0.14)' : s === 'pending' ? 'rgba(200,161,90,0.14)' : 'rgba(255,255,255,0.06)',
              color: s === 'sent' ? '#3fb950' : s === 'failed' ? '#f85149' : s === 'pending' ? 'var(--primary)' : 'var(--muted)',
            }}>
              <Icon name={s === 'sent' ? 'checkCircle' : s === 'failed' ? 'close' : s === 'pending' ? 'clock' : 'minus'} size={22} />
            </div>
            <div><div className="sv">{counts[s] || 0}</div><div className="sl">{stLabel(s)}</div></div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h3><Icon name="message" size={17} className="primary-text" /> {t('admin.notifications')} <span className="badge badge-gray">{rows.length}</span></h3>
          <div className="flex gap-1 wrap">
            <button className="btn btn-ghost btn-sm" onClick={() => act('markAllRead')}><Icon name="check" size={14} /> {t('notify.markAllRead')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => act('processDue')} disabled={busy}><Icon name="refresh" size={14} /> {t('notify.processDue')}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => act('sendAll')} disabled={busy}><Icon name="arrow" size={14} /> {t('notify.sendAll')}</button>
            <button className="btn btn-danger btn-sm" onClick={() => confirm(t('admin.confirmDelete')) && act('clear')}><Icon name="trash" size={14} /> {t('notify.clearAll')}</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setModal({ channel: 'whatsapp', to: '', title: '', body: '', type: 'custom' })}
            >
              <Icon name="plus" size={15} /> {t('notify.newManual')}
            </button>
          </div>
        </div>

        <div className="admin-card-body">
          <div className="filters">
            <select className="select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">{t('common.status')} — {t('common.all')}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{stLabel(s)}</option>)}
            </select>
            <select className="select" value={filter.channel} onChange={(e) => setFilter({ ...filter, channel: e.target.value })}>
              <option value="">{t('notify.channel')} — {t('common.all')}</option>
              {CHANNELS.map((c) => <option key={c} value={c}>{chLabel(c)}</option>)}
            </select>
            <select className="select" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">{t('notify.type')} — {t('common.all')}</option>
              {TYPES.map((x) => <option key={x} value={x}>{tyLabel(x)}</option>)}
            </select>
          </div>

          {settings.waProvider === 'link' && (
            <div className="alert alert-info">
              <Icon name="settings" size={16} />
              <span>{locale === 'en'
                ? 'WhatsApp provider is set to "Direct link" — messages open in WhatsApp to send manually. Add API keys in Settings → Notifications for automatic sending.'
                : 'مزوّد واتساب مضبوط على "رابط مباشر" — تُفتح الرسالة في واتساب للإرسال اليدوي. أضف مفاتيح API من الإعدادات ← الإشعارات للإرسال التلقائي.'}</span>
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('notify.type')}</th>
                  <th>{t('notify.channel')}</th>
                  <th>{t('notify.to')}</th>
                  <th>{t('notify.message')}</th>
                  <th>{t('notify.when')}</th>
                  <th>{t('common.status')}</th>
                  <th style={{ textAlign: 'end' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td><span className="badge badge-gray">{tyLabel(n.type)}</span></td>
                    <td>
                      <span className="flex items-center gap-1 small">
                        <Icon name={n.channel === 'whatsapp' ? 'whatsapp' : n.channel === 'sms' ? 'message' : n.channel === 'email' ? 'mail' : 'dashboard'} size={14} />
                        {chLabel(n.channel)}
                      </span>
                    </td>
                    <td dir="ltr" className="small">{n.to || '-'}</td>
                    <td style={{ maxWidth: 380 }}>
                      <div className="small" style={{ whiteSpace: 'pre-wrap', maxHeight: 62, overflow: 'hidden' }}>{n.body}</div>
                    </td>
                    <td className="small muted">
                      {n.scheduledAt && !n.sentAt ? `⏳ ${new Date(n.scheduledAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ar')}` : ''}
                      {n.sentAt ? `✅ ${new Date(n.sentAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ar')}` : ''}
                      {!n.sentAt && !n.scheduledAt ? new Date(n.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ar') : ''}
                    </td>
                    <td>
                      <span className={`badge badge-${badge[n.status]}`}>{stLabel(n.status)}</span>
                      {n.error && n.error !== 'link' && <div className="small" style={{ color: '#f85149', maxWidth: 160 }}>{n.error.slice(0, 60)}</div>}
                    </td>
                    <td style={{ textAlign: 'end' }}>
                      <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                        {n.status !== 'sent' && n.channel === 'whatsapp' && (
                          <button className="icon-btn" title={t('notify.openWhatsapp')} onClick={() => act('link', { id: n.id })} style={{ width: 32, height: 32, color: '#25D366' }}>
                            <Icon name="whatsapp" size={14} />
                          </button>
                        )}
                        {n.status !== 'sent' && n.channel !== 'inapp' && (
                          <button className="icon-btn" title={t('notify.send')} onClick={() => act('send', { id: n.id })} style={{ width: 32, height: 32 }}>
                            <Icon name="arrow" size={14} />
                          </button>
                        )}
                        <button className="icon-btn" onClick={() => act('delete', { id: n.id })} style={{ width: 32, height: 32, color: '#f85149' }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7}><div className="empty"><Icon name="message" size={40} /><p>{t('notify.empty')}</p></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal">
          <div className="overlay" onClick={() => setModal(null)} />
          <div className="modal-box">
            <div className="modal-head">
              <b>{t('notify.newManual')}</b>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="field">
                  <label className="label">{t('notify.channel')}</label>
                  <select className="select" value={modal.channel} onChange={(e) => setModal({ ...modal, channel: e.target.value })}>
                    {CHANNELS.filter((c) => c !== 'inapp').map((c) => <option key={c} value={c}>{chLabel(c)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">{t('notify.to')} (05XXXXXXXX أو بريد)</label>
                  <input className="input" dir="ltr" value={modal.to} onChange={(e) => setModal({ ...modal, to: e.target.value })} placeholder="0599123456" />
                </div>
              </div>
              <div className="field">
                <label className="label">{modal.channel === 'email' ? t('common.name') : t('notify.message')}</label>
                <textarea className="textarea" value={modal.body} onChange={(e) => setModal({ ...modal, body: e.target.value })} style={{ minHeight: 140 }} placeholder="اكتب رسالتك هنا..." />
              </div>
              <div className="alert alert-info">{t('notify.templatesHint')}</div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>{t('common.cancel')}</button>
              <button
                className="btn btn-primary"
                disabled={busy || !modal.to}
                onClick={async () => { await act('create', { data: { ...modal, sendNow: true } }); setModal(null); }}
              >
                <Icon name="arrow" size={16} /> {t('notify.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
