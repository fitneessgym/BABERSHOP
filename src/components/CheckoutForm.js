'use client';
import { useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import SmartImage from './SmartImage';
import { useCart } from './CartProvider';
import { makeT } from '@/lib/i18n';

export default function CheckoutForm({ locale, settings }) {
  const t = makeT(locale);
  const en = locale === 'en';
  const { items, subtotal, setQty, remove, clear, loaded } = useCart();

  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', address: '', notes: '', payment: 'cash' });
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState('');
  const [state, setState] = useState({ loading: false, error: '', order: null });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const shippingBase = subtotal >= Number(settings.freeShippingOver || 0) || subtotal === 0 ? 0 : Number(settings.shippingCost || 0);
  const shipping = subtotal - discount >= Number(settings.freeShippingOver || 0) ? 0 : shippingBase;
  const tax = (subtotal - discount) * (Number(settings.taxPercent || 0) / 100);
  const total = Math.max(0, subtotal - discount + shipping + tax);

  async function applyCoupon() {
    setCouponMsg('');
    try {
      const res = await fetch('/api/public/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon, total: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscount(0); setCouponMsg(data.error || t('store.invalidCoupon')); return; }
      setDiscount(data.discount);
      setCouponMsg(t('store.couponApplied'));
    } catch { setCouponMsg(t('store.invalidCoupon')); }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setState({ ...state, error: t('store.fillRequired') }); return; }
    setState({ loading: true, error: '', order: null });
    try {
      const res = await fetch('/api/public/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items, coupon, subtotal, discount, shipping, total, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setState({ loading: false, error: '', order: data });
      clear();
    } catch (err) {
      setState({ loading: false, error: err.message, order: null });
    }
  }

  if (state.order) {
    return (
      <div className="success-box">
        <div className="success-icon"><Icon name="check" size={46} /></div>
        <h2 style={{ fontSize: 28, marginBottom: 10 }}>{t('store.orderPlaced')}</h2>
        <p className="muted">{t('store.orderPlacedMsg')}</p>
        <div className="code-badge">{state.order.code}</div>
        <div className="flex gap-2 justify-center wrap mt-3">
          <Link href={`/${locale}/store`} className="btn btn-primary">{t('store.continueShopping')}</Link>
          {settings.whatsapp && (
            <a
              className="btn btn-outline"
              target="_blank" rel="noreferrer"
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
                `${t('store.orderCode')}: ${state.order.code}\n${t('common.total')}: ${state.order.total} ${settings.currency}`
              )}`}
            >
              <Icon name="whatsapp" size={17} /> {t('contact.whatsapp')}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (loaded && items.length === 0) {
    return (
      <div className="empty">
        <Icon name="cart" size={48} />
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{t('store.cartEmpty')}</p>
        <p className="small">{t('store.cartEmptyMsg')}</p>
        <Link href={`/${locale}/store`} className="btn btn-primary mt-3">{t('store.continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div className="two-col">
      <form className="card" style={{ padding: 26 }} onSubmit={submit}>
        {state.error && <div className="alert alert-error">{state.error}</div>}

        <h3 style={{ marginBottom: 16, display: 'flex', gap: 9, alignItems: 'center' }}>
          <Icon name="user" size={19} className="primary-text" /> {t('admin.customer')}
        </h3>
        <div className="form-row">
          <div className="field">
            <label className="label">{t('common.name')} <span>*</span></label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div className="field">
            <label className="label">{t('common.phone')} <span>*</span></label>
            <input className="input" type="tel" dir="ltr" placeholder="05XXXXXXXX" value={form.phone} onChange={set('phone')} required />
          </div>
        </div>
        <div className="field">
          <label className="label">{t('common.email')} ({t('common.optional')})</label>
          <input className="input" type="email" dir="ltr" value={form.email} onChange={set('email')} />
        </div>

        <h3 style={{ margin: '24px 0 16px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <Icon name="truck" size={19} className="primary-text" /> {t('store.address')}
        </h3>
        <div className="form-row">
          <div className="field">
            <label className="label">{t('store.city')}</label>
            <input className="input" value={form.city} onChange={set('city')} />
          </div>
          <div className="field">
            <label className="label">{t('store.address')}</label>
            <input className="input" value={form.address} onChange={set('address')} />
          </div>
        </div>
        <div className="field">
          <label className="label">{t('admin.note')} ({t('common.optional')})</label>
          <textarea className="textarea" value={form.notes} onChange={set('notes')} style={{ minHeight: 80 }} />
        </div>

        <h3 style={{ margin: '24px 0 16px', display: 'flex', gap: 9, alignItems: 'center' }}>
          <Icon name="wallet" size={19} className="primary-text" /> {t('store.payment')}
        </h3>
        <div className="grid grid-3" style={{ gap: 10 }}>
          {[['cash', t('store.payCash'), 'wallet'], ['card', t('store.payCard'), 'package'], ['online', t('store.payOnline'), 'globe']].map(([v, label, ic]) => (
            <button
              type="button" key={v}
              onClick={() => setForm({ ...form, payment: v })}
              className="option"
              style={form.payment === v ? { borderColor: 'var(--primary)', background: 'rgba(200,161,90,0.09)' } : {}}
            >
              <Icon name={ic} size={20} className="primary-text" />
              <span className="small bold">{label}</span>
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-lg btn-block mt-3" disabled={state.loading}>
          {state.loading ? t('common.loading') : (<><Icon name="checkCircle" size={18} /> {t('store.checkout')}</>)}
        </button>
      </form>

      <aside className="summary-box" style={{ position: 'sticky', top: 90 }}>
        <h3 style={{ marginBottom: 14 }}>{t('nav.cart')} ({items.reduce((s, i) => s + i.qty, 0)})</h3>
        <div className="col gap-2 mb-2">
          {items.map((i) => (
            <div className="cart-item" key={i.id}>
              <SmartImage src={i.image} alt={en ? i.nameEn : i.nameAr} />
              <div className="ci-info">
                <b>{en ? i.nameEn : i.nameAr}</b>
                <span className="small muted">{i.price} {settings.currency}</span>
                <div className="qty-ctrl">
                  <button onClick={() => setQty(i.id, i.qty - 1)}><Icon name="minus" size={13} /></button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)}><Icon name="plus" size={13} /></button>
                  <button onClick={() => remove(i.id)} style={{ marginInlineStart: 'auto', color: '#f85149' }}><Icon name="trash" size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mb-2">
          <input className="input" placeholder={t('store.coupon')} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <button type="button" className="btn btn-outline btn-sm" onClick={applyCoupon}>{t('store.applyCoupon')}</button>
        </div>
        {couponMsg && <div className={`alert ${discount > 0 ? 'alert-success' : 'alert-error'}`} style={{ padding: '8px 12px' }}>{couponMsg}</div>}

        <div className="summary-row"><span>{t('common.subtotal')}</span><span>{subtotal} {settings.currency}</span></div>
        {discount > 0 && <div className="summary-row"><span>{t('store.coupon')}</span><span style={{ color: '#3fb950' }}>-{discount} {settings.currency}</span></div>}
        <div className="summary-row"><span>{t('store.shipping')}</span><span>{shipping === 0 ? t('store.freeShipping') : `${shipping} ${settings.currency}`}</span></div>
        {tax > 0 && <div className="summary-row"><span>{t('admin.taxPercent')}</span><span>{tax.toFixed(0)} {settings.currency}</span></div>}
        <div className="summary-row"><span className="bold">{t('common.total')}</span><b>{total.toFixed(0)} {settings.currency}</b></div>

        <Link href={`/${locale}/store`} className="btn btn-ghost btn-sm btn-block mt-2">{t('store.continueShopping')}</Link>
      </aside>
    </div>
  );
}
