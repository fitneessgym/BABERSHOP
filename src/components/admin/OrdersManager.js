'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import SmartImage from '../SmartImage';
import { makeT } from '@/lib/i18n';

const STATUS = ['new', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersManager({ orders, locale, settings }) {
  const t = makeT(locale);
  const en = locale === 'en';
  const router = useRouter();
  const [view, setView] = useState(null);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const label = (s) => ({
    new: t('admin.orderNew'), processing: t('admin.orderProcessing'), shipped: t('admin.orderShipped'),
    delivered: t('admin.orderDelivered'), cancelled: t('admin.orderCancelled'),
  }[s] || s);

  const list = orders
    .filter((o) => (status ? o.status === status : true))
    .filter((o) => (q ? (o.code + o.customerName + o.phone + o.city).toLowerCase().includes(q.toLowerCase()) : true));

  async function changeStatus(o, s) {
    await fetch('/api/admin/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: o.id, data: { status: s } }),
    });
    router.refresh();
  }

  async function remove(o) {
    if (!confirm(t('admin.confirmDelete'))) return;
    await fetch('/api/admin/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: o.id }),
    });
    router.refresh();
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3><Icon name="cart" size={17} className="primary-text" /> {t('admin.orders')} <span className="badge badge-gray">{list.length}</span></h3>
        <button className="btn btn-ghost btn-sm" onClick={() => window.print()}><Icon name="print" size={14} /> {t('admin.print')}</button>
      </div>

      <div className="admin-card-body">
        <div className="filters">
          <input className="input" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 200 }} />
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t('common.status')} — {t('common.all')}</option>
            {STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Code</th><th>{t('admin.customer')}</th><th>{t('store.city')}</th>
                <th>{t('admin.items')}</th><th>{t('common.total')}</th><th>{t('store.payment')}</th>
                <th>{t('common.date')}</th><th>{t('common.status')}</th><th style={{ textAlign: 'end' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td><b dir="ltr" style={{ color: 'var(--primary)' }}>{o.code}</b></td>
                  <td><b>{o.customerName}</b><div className="small muted" dir="ltr">{o.phone}</div></td>
                  <td>{o.city || '-'}</td>
                  <td>{o.items?.length || 0}</td>
                  <td><b>{o.total} {settings.currency}</b>{o.discount > 0 && <div className="small" style={{ color: '#3fb950' }}>-{o.discount}</div>}</td>
                  <td className="small">{o.payment === 'cash' ? t('store.payCash') : o.payment === 'card' ? t('store.payCard') : t('store.payOnline')}</td>
                  <td className="small" dir="ltr">{new Date(o.createdAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar')}</td>
                  <td>
                    <select className="select" value={o.status} onChange={(e) => changeStatus(o, e.target.value)} style={{ padding: '6px 10px', fontSize: 13, minWidth: 120 }}>
                      {STATUS.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'end' }}>
                    <button className="icon-btn" onClick={() => setView(o)} style={{ width: 32, height: 32 }}><Icon name="eye" size={14} /></button>
                    <button className="icon-btn" onClick={() => remove(o)} style={{ width: 32, height: 32, color: '#f85149', marginInlineStart: 6 }}><Icon name="trash" size={14} /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={9}><div className="empty"><Icon name="cart" size={40} /><p>{t('common.empty')}</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {view && (
        <div className="modal">
          <div className="overlay" onClick={() => setView(null)} />
          <div className="modal-box">
            <div className="modal-head">
              <b dir="ltr">{view.code}</b>
              <button className="icon-btn" onClick={() => setView(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2 mb-2" style={{ gap: 12 }}>
                <div><span className="small muted">{t('admin.customer')}</span><div><b>{view.customerName}</b></div></div>
                <div><span className="small muted">{t('common.phone')}</span><div dir="ltr"><b>{view.phone}</b></div></div>
                <div><span className="small muted">{t('store.city')}</span><div><b>{view.city || '-'}</b></div></div>
                <div><span className="small muted">{t('store.address')}</span><div><b>{view.address || '-'}</b></div></div>
              </div>
              {view.notes && <div className="alert alert-info">{view.notes}</div>}

              <div className="table-wrap">
                <table>
                  <thead><tr><th>{t('admin.items')}</th><th>{t('store.qty')}</th><th>{t('common.price')}</th></tr></thead>
                  <tbody>
                    {(view.items || []).map((i) => (
                      <tr key={i.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <SmartImage src={i.image} alt="" className="t-img" label="P" />
                            <span>{en ? i.nameEn : i.nameAr}</span>
                          </div>
                        </td>
                        <td>{i.qty}</td>
                        <td>{i.price * i.qty} {settings.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="summary-box mt-2">
                <div className="summary-row"><span>{t('common.subtotal')}</span><span>{view.subtotal} {settings.currency}</span></div>
                {view.discount > 0 && <div className="summary-row"><span>{t('store.coupon')}</span><span>-{view.discount}</span></div>}
                <div className="summary-row"><span>{t('store.shipping')}</span><span>{view.shipping} {settings.currency}</span></div>
                <div className="summary-row"><span className="bold">{t('common.total')}</span><b>{view.total} {settings.currency}</b></div>
              </div>

              {settings.whatsapp && (
                <a
                  className="btn btn-outline btn-block mt-2" target="_blank" rel="noreferrer"
                  href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`${t('store.orderCode')}: ${view.code}\n${view.customerName} - ${view.phone}`)}`}
                >
                  <Icon name="whatsapp" size={16} /> {t('contact.whatsapp')}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
