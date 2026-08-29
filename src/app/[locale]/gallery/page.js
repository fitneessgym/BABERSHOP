import Link from 'next/link';
import { list } from '@/lib/supabase';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import SmartImage from '@/components/SmartImage';

export const dynamic = 'force-dynamic';

export default async function GalleryPage({ params }) {
  const { locale } = await params;
  const t = makeT(locale);
  const en = locale === 'en';
  const items = await list('gallery_images', { where: { active: true }, order: { sort: 'asc' } });

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">{t('nav.gallery')}</span>
          <h1 className="section-title">{t('gallery.title')}</h1>
          <p className="section-sub">{t('gallery.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {items.map((g, i) => (
              <div key={g.id} className={`gallery-item ${i % 5 === 0 ? 'tall' : ''}`}>
                <SmartImage src={g.url} alt={en ? g.captionEn : g.captionAr} label="Work" />
                <div className="cap">{en ? g.captionEn : g.captionAr}</div>
              </div>
            ))}
          </div>
          {items.length === 0 && <div className="empty"><Icon name="image" size={44} /><p>{t('common.empty')}</p></div>}
          <div className="text-center mt-4">
            <Link href={`/${locale}/booking`} className="btn btn-primary btn-lg">
              <Icon name="calendar" size={19} /> {t('nav.book')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
