'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { useCart } from './CartProvider';
import { makeT } from '@/lib/i18n';

export default function ProductBuy({ product, locale, currency = '₪' }) {
  const t = makeT(locale);
  const router = useRouter();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const out = (product.stock ?? 0) <= 0;

  return (
    <div className="flex gap-2 wrap mt-2">
      <div className="qty-ctrl">
        <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40 }}><Icon name="minus" size={15} /></button>
        <span style={{ minWidth: 34, fontSize: 16 }}>{qty}</span>
        <button onClick={() => setQty(Math.min(product.stock || 99, qty + 1))} style={{ width: 40, height: 40 }}><Icon name="plus" size={15} /></button>
      </div>
      <button
        className="btn btn-primary"
        style={{ flex: 1, minWidth: 170 }}
        disabled={out}
        onClick={() => add(product, qty)}
      >
        <Icon name="cart" size={17} /> {out ? t('store.outOfStock') : t('store.addToCart')}
      </button>
      <button
        className="btn btn-outline"
        style={{ flex: 1, minWidth: 150 }}
        disabled={out}
        onClick={() => { add(product, qty); router.push(`/${locale}/store/checkout`); }}
      >
        {t('store.checkout')} <Icon name="arrow" size={16} />
      </button>
    </div>
  );
}
