import Link from 'next/link';
import { list } from '@/lib/supabase';
import { makeT } from '@/lib/i18n';
import Icon, { Stars } from '@/components/Icon';
import SmartImage from '@/components/SmartImage';

export const dynamic = 'force-dynamic';

export default async function BarbersPage({ params }) {
  const { locale } = await params;
  const t = makeT(locale);
  const en = locale === 'en';

  const barbers = await list('barbers', {
    where: { active: true },
    order: { sort: 'asc' },
    select: '*, services:barber_services(service:services(*))',
  });

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">{t('nav.barbers')}</span>
          <h1 className="section-title">{t('barbers.title')}</h1>
          <p className="section-sub">{t('barbers.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {barbers.map((b) => (
              <div key={b.id} className="card card-hover barber-card">
                <div className="barber-photo">
                  <SmartImage src={b.photo} alt={en ? b.nameEn : b.nameAr} label="Barber" />
                </div>
                <div className="barber-body">
                  <h3>{en ? b.nameEn : b.nameAr}</h3>
                  <div className="barber-role">{en ? b.roleEn : b.roleAr}</div>
                  <p className="barber-bio">{en ? b.bioEn : b.bioAr}</p>
                  <div className="barber-meta">
                    <span><Stars rating={b.rating} size={13} /></span>
                    <span><Icon name="award" size={12} /> {b.experience} {t('barbers.experience')}</span>
                  </div>
                  {b.services.length > 0 && (
                    <div className="flex wrap gap-1 justify-center mb-2" style={{ marginBottom: 14 }}>
                      {b.services.slice(0, 3).map((bs) => (
                        <span key={bs.id} className="badge badge-gray" style={{ fontSize: 10 }}>
                          {en ? bs.service.nameEn : bs.service.nameAr}
                        </span>
                      ))}
                      {b.services.length > 3 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{b.services.length - 3}</span>}
                    </div>
                  )}
                  <Link href={`/${locale}/booking?barber=${b.slug}`} className="btn btn-primary btn-block btn-sm">
                    {t('barbers.book')}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {barbers.length === 0 && <div className="empty"><Icon name="users" size={44} /><p>{t('common.empty')}</p></div>}
        </div>
      </section>
    </>
  );
}
