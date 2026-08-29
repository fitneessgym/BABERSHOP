import Link from 'next/link';
import { list } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';

export default async function ServicesPage({ params }) {
  const { locale } = await params;
  const t = makeT(locale);
  const en = locale === 'en';
  const s = await getSettings();
  const services = await list('services', { where: { active: true }, order: { sort: 'asc' } });

  const cats = [...new Set(services.map((x) => x.category))];

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">{t('nav.services')}</span>
          <h1 className="section-title">{t('services.title')}</h1>
          <p className="section-sub">{t('services.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {cats.map((cat) => (
            <div key={cat} className="mb-4">
              <h2 style={{ fontSize: 22, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 22, background: 'var(--primary)', borderRadius: 4, display: 'inline-block' }} />
                {cat}
              </h2>
              <div className="grid grid-3">
                {services.filter((x) => x.category === cat).map((sv) => (
                  <div key={sv.id} className="card card-hover service-card">
                    <div className="service-icon"><Icon name={sv.icon || 'scissors'} size={26} /></div>
                    <h3>{en ? sv.nameEn : sv.nameAr}</h3>
                    <p>{en ? sv.descEn : sv.descAr}</p>
                    <div className="service-meta">
                      <span className="service-price">{sv.price} <small>{s.currency}</small></span>
                      <span className="service-dur"><Icon name="clock" size={14} /> {sv.durationMin} {t('common.min')}</span>
                    </div>
                    <Link href={`/${locale}/booking?service=${sv.slug}`} className="btn btn-primary btn-block btn-sm mt-2">
                      {t('services.book')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="empty"><Icon name="scissors" size={44} /><p>{t('common.empty')}</p></div>
          )}

          <div className="card mt-4" style={{ padding: 34, textAlign: 'center', background: 'linear-gradient(135deg, rgba(200,161,90,0.12), transparent)' }}>
            <h2 style={{ fontSize: 26, marginBottom: 10 }}>{t('home.heroCta')}</h2>
            <p className="muted mb-3">{en ? s.taglineEn : s.taglineAr}</p>
            <Link href={`/${locale}/booking`} className="btn btn-primary btn-lg">
              <Icon name="calendar" size={19} /> {t('nav.book')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
