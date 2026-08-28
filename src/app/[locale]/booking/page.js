import prisma from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import BookingWizard from '@/components/BookingWizard';

export const dynamic = 'force-dynamic';

export default async function BookingPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = makeT(locale);
  const s = await getSettings();

  const [services, barbers] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
    prisma.barber.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
  ]);

  const svc = sp?.service ? services.find((x) => x.slug === sp.service) : null;
  const brb = sp?.barber ? barbers.find((x) => x.slug === sp.barber) : null;

  const initial = {
    serviceId: svc?.id || '',
    barberId: brb?.id || '',
    date: sp?.date || '',
    phone: sp?.phone || '',
  };

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container text-center">
          <span className="eyebrow" style={{ justifyContent: 'center' }}>{t('nav.book')}</span>
          <h1 className="section-title">{t('booking.title')}</h1>
          <p className="section-sub" style={{ marginInline: 'auto' }}>{t('booking.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {services.length === 0 ? (
            <div className="empty"><Icon name="scissors" size={46} /><p>{t('common.empty')}</p></div>
          ) : (
            <BookingWizard services={services} barbers={barbers} settings={s} locale={locale} initial={initial} />
          )}

          <div className="grid grid-3 mt-4">
            <div className="info-card">
              <span className="ic"><Icon name="clock" size={20} /></span>
              <div><h4>{t('home.hoursTitle')}</h4><p className="small">{s.phone}</p></div>
            </div>
            <div className="info-card">
              <span className="ic"><Icon name="phone" size={20} /></span>
              <div><h4>{t('contact.callNow')}</h4><a href={`tel:${s.phone}`} dir="ltr" className="small">{s.phone}</a></div>
            </div>
            <div className="info-card">
              <span className="ic"><Icon name="map" size={20} /></span>
              <div><h4>{t('contact.address')}</h4><p className="small">{locale === 'en' ? s.addressEn || s.addressAr : s.addressAr}</p></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
