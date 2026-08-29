import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one, list } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import SmartImage from '@/components/SmartImage';
import AddToCart from '@/components/AddToCart';
import ProductBuy from '@/components/ProductBuy';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await one('products', { where: { slug } });
  return { title: p ? `${p.nameAr} | ${p.nameEn}` : 'Product' };
}

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const t = makeT(locale);
  const en = locale === 'en';
  const s = await getSettings();

  const p = await one('products', { where: { slug } });
  if (!p || !p.active) notFound();

  const related = await list('products', {
    where: { active: true, categoryAr: p.categoryAr, NOT: { id: p.id } },
    limit: 4,
    order: { sort: 'asc' },
  });

  return (
    <section className="section">
      <div className="container">
        <div className="small muted mb-2" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={`/${locale}`}>{t('nav.home')}</Link> /
          <Link href={`/${locale}/store`}>{t('nav.store')}</Link> /
          <span className="primary-text">{en ? p.nameEn : p.nameAr}</span>
        </div>

        <div className="grid grid-2" style={{ gap: 44, alignItems: 'start' }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--surface-2)', aspectRatio: '1/1' }}>
              <SmartImage src={p.image} alt={en ? p.nameEn : p.nameAr} label="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          <div>
            <span className="badge badge-pending">{en ? p.categoryEn : p.categoryAr}</span>
            <h1 style={{ fontSize: 32, marginBlock: '12px 10px' }}>{en ? p.nameEn : p.nameAr}</h1>

            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)' }}>{p.price} {s.currency}</span>
              {p.compareAtPrice > p.price && (
                <>
                  <del className="muted">{p.compareAtPrice} {s.currency}</del>
                  <span className="badge badge-cancelled">%{Math.round((1 - p.price / p.compareAtPrice) * 100)}-</span>
                </>
              )}
            </div>

            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{en ? p.descEn : p.descAr}</p>

            <div className="grid grid-2 mb-3" style={{ gap: 10 }}>
              {p.brand && (
                <div className="info-card" style={{ padding: 14 }}>
                  <span className="ic" style={{ width: 38, height: 38 }}><Icon name="award" size={17} /></span>
                  <div><h4 className="small muted">{t('store.brand')}</h4><p className="small bold">{p.brand}</p></div>
                </div>
              )}
              {p.size && (
                <div className="info-card" style={{ padding: 14 }}>
                  <span className="ic" style={{ width: 38, height: 38 }}><Icon name="package" size={17} /></span>
                  <div><h4 className="small muted">{t('store.size')}</h4><p className="small bold">{p.size}</p></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Icon name={p.stock > 0 ? 'checkCircle' : 'close'} size={17} className={p.stock > 0 ? '' : 'muted'} />
              <span className="small bold" style={{ color: p.stock > 0 ? '#3fb950' : '#f85149' }}>
                {p.stock > 0 ? t('store.inStock') : t('store.outOfStock')}
              </span>
              {p.stock > 0 && p.stock <= 5 && <span className="small muted">({p.stock})</span>}
            </div>

            <ProductBuy product={p} locale={locale} currency={s.currency} />

            <div className="card mt-4" style={{ padding: 18, background: 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 small"><Icon name="truck" size={17} className="primary-text" />
                <b>{t('store.freeShipping')}</b> — {s.freeShippingOver} {s.currency}+</div>
              <div className="flex items-center gap-2 small mt-1"><Icon name="shield" size={17} className="primary-text" />
                <b>{t('store.payCash')}</b></div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-4">
            <h2 style={{ fontSize: 24, marginBottom: 22 }}>{t('store.related')}</h2>
            <div className="grid grid-4">
              {related.map((r) => (
                <div key={r.id} className="card card-hover product-card">
                  <Link href={`/${locale}/store/${r.slug}`} className="product-media">
                    <SmartImage src={r.image} alt={en ? r.nameEn : r.nameAr} label="Product" />
                  </Link>
                  <div className="product-body">
                    <Link href={`/${locale}/store/${r.slug}`} className="product-name">{en ? r.nameEn : r.nameAr}</Link>
                    <div className="product-price"><b>{r.price} {s.currency}</b></div>
                  </div>
                  <div className="product-actions"><AddToCart product={r} locale={locale} currency={s.currency} full /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
