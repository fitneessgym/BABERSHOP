import Link from 'next/link';
import prisma from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import SmartImage from '@/components/SmartImage';
import AddToCart from '@/components/AddToCart';
import StoreFilters from '@/components/StoreFilters';

export const dynamic = 'force-dynamic';

export default async function StorePage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = makeT(locale);
  const en = locale === 'en';
  const s = await getSettings();

  const q = (sp?.q || '').trim();
  const cat = sp?.cat || '';
  const sort = sp?.sort || '';

  const where = { active: true };
  if (q) where.OR = [{ nameAr: { contains: q } }, { nameEn: { contains: q } }, { descAr: { contains: q } }, { descEn: { contains: q } }];
  if (cat) where.OR = [...(where.OR || []), { categoryAr: { equals: cat } }, { categoryEn: { equals: cat } }];

  const orderBy = sort === 'asc' ? { price: 'asc' } : sort === 'desc' ? { price: 'desc' } : { sort: 'asc' };

  const products = await prisma.product.findMany({ where, orderBy });
  const all = await prisma.product.findMany({ where: { active: true } });
  const categories = [...new Set(all.map((p) => (en ? p.categoryEn : p.categoryAr)))];

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">{t('nav.store')}</span>
          <h1 className="section-title">{t('store.title')}</h1>
          <p className="section-sub">{t('store.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <StoreFilters locale={locale} categories={categories} current={{ q, cat, sort }} />

          <div className="grid grid-4">
            {products.map((p) => (
              <div key={p.id} className="card card-hover product-card">
                <Link href={`/${locale}/store/${p.slug}`} className="product-media">
                  <SmartImage src={p.image} alt={en ? p.nameEn : p.nameAr} label="Product" />
                  {p.compareAtPrice > p.price && <span className="product-tag sale">%{Math.round((1 - p.price / p.compareAtPrice) * 100)}-</span>}
                  {p.stock <= 0 && <span className="product-tag out">{t('store.outOfStock')}</span>}
                  {p.featured && p.stock > 0 && <span className="product-tag" style={{ insetInlineStart: 'auto', insetInlineEnd: 12 }}>{t('store.featured')}</span>}
                </Link>
                <div className="product-body">
                  <span className="product-cat">{en ? p.categoryEn : p.categoryAr}</span>
                  <Link href={`/${locale}/store/${p.slug}`} className="product-name">{en ? p.nameEn : p.nameAr}</Link>
                  <p className="product-desc">{en ? p.descEn : p.descAr}</p>
                  <div className="product-price">
                    <b>{p.price} {s.currency}</b>
                    {p.compareAtPrice > p.price && <del>{p.compareAtPrice} {s.currency}</del>}
                  </div>
                </div>
                <div className="product-actions">
                  <AddToCart product={p} locale={locale} currency={s.currency} full />
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="empty">
              <Icon name="package" size={46} />
              <p>{t('common.empty')}</p>
              <Link href={`/${locale}/store`} className="btn btn-outline btn-sm mt-2">{t('common.viewAll')}</Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
