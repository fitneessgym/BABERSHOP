'use client';
import Icon from './Icon';
import { useCart } from './CartProvider';
import { makeT } from '@/lib/i18n';

export default function AddToCart({ product, locale, currency = '₪', full = false }) {
  const t = makeT(locale);
  const { add } = useCart();
  const out = (product.stock ?? 0) <= 0;

  return (
    <button
      className={`btn ${out ? 'btn-ghost' : 'btn-primary'} ${full ? 'btn-block' : ''} btn-sm`}
      disabled={out}
      onClick={(e) => { e.preventDefault(); add(product, 1); }}
      style={full ? { flex: 1 } : {}}
    >
      <Icon name={out ? 'close' : 'cart'} size={16} />
      {out ? t('store.outOfStock') : t('store.addToCart')}
    </button>
  );
}
