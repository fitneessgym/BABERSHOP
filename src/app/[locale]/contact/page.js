import prisma from '@/lib/db';
import { getSettings, workingHours, dayNames } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import ContactForm from '@/components/ContactForm';

export const dynamic = 'force-dynamic';

export default async function ContactPage({ params, searchParams }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = makeT(locale);
  const en = locale === 'en';
  const s = await getSettings();
  const hours = workingHours(s);
  const days = dayNames[locale];
  const today = new Date().getDay();

  return (
    <>
      <section className="section-sm" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <span className="eyebrow">{t('nav.contact')}</span>
          <h1 className="section-title">{t('contact.title')}</h1>
          <p className="section-sub">{t('contact.sub')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ gap: 40, alignItems: 'start' }}>
            <div className="col gap-2">
              <div className="info-card">
                <span className="ic"><Icon name="phone" size={20} /></span>
                <div><h4>{t('contact.phone')}</h4><a href={`tel:${s.phone}`} dir="ltr">{s.phone}</a></div>
              </div>
              <div className="info-card">
                <span className="ic"><Icon name="mail" size={20} /></span>
                <div><h4>{t('contact.email')}</h4><a href={`mailto:${s.email}`} dir="ltr">{s.email}</a></div>
              </div>
              <div className="info-card">
                <span className="ic"><Icon name="map" size={20} /></span>
                <div>
                  <h4>{t('contact.address')}</h4>
                  <p>{en ? s.addressEn || s.addressAr : s.addressAr}</p>
                  {s.mapsUrl && (
                    <a href={s.mapsUrl} target="_blank" rel="noreferrer" className="small primary-text">{t('contact.directions')} →</a>
                  )}
                </div>
              </div>

              <div className="card mt-2" style={{ padding: 22 }}>
                <h3 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name="clock" size={19} className="primary-text" /> {t('contact.hours')}
                </h3>
                <div className="hours-list">
                  {hours.map((h) => (
                    <div key={h.day} className={`hours-row ${h.day === today ? 'today' : ''} ${h.off ? 'closed' : ''}`}>
                      <b>{days[h.day]}</b>
                      <span className="time">{h.off ? t('admin.closed') : `${h.open} - ${h.close}`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 wrap mt-2">
                {s.phone && <a href={`tel:${s.phone}`} className="btn btn-primary"><Icon name="phone" size={17} /> {t('contact.callNow')}</a>}
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                    <Icon name="whatsapp" size={17} /> {t('contact.whatsapp')}
                  </a>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 18 }}>{t('contact.form')}</h3>
              <ContactForm locale={locale} defaultMsg={sp?.msg || ''} settings={s} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
