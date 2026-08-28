import Link from 'next/link';
import Icon from './Icon';
import { makeT } from '@/lib/i18n';
import { workingHours } from '@/lib/settings';
import { dayNames } from '@/lib/i18n';

export default function SiteFooter({ settings, locale }) {
  const t = makeT(locale);
  const name = locale === 'en' ? settings.salonNameEn : settings.salonNameAr;
  const hours = workingHours(settings);
  const days = dayNames[locale];

  const socials = [
    ['facebook', settings.facebook, 'facebook'],
    ['instagram', settings.instagram, 'instagram'],
    ['tiktok', settings.tiktok, 'tiktok'],
    ['whatsapp', settings.whatsapp ? `https://wa.me/${settings.whatsapp}` : '', 'whatsapp'],
    ['x', settings.x, 'x'],
  ].filter((s) => s[1]);

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">
              <span className="logo-mark"><Icon name="scissors" size={22} /></span>
              <span className="logo-text"><span>{name}</span></span>
            </div>
            <p className="footer-about">
              {locale === 'en'
                ? (settings.aboutEn || settings.aboutAr || '').slice(0, 160)
                : (settings.aboutAr || settings.aboutEn || '').slice(0, 160)}
            </p>
            <div className="socials">
              {socials.map(([icon, url, key]) => (
                <a key={key} href={url} target="_blank" rel="noreferrer" aria-label={key}><Icon name={icon} size={17} /></a>
              ))}
            </div>
          </div>

          <div>
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              <li><Link href={`/${locale}`}>{t('nav.home')}</Link></li>
              <li><Link href={`/${locale}/services`}>{t('nav.services')}</Link></li>
              <li><Link href={`/${locale}/barbers`}>{t('nav.barbers')}</Link></li>
              {settings.storeEnabled === '1' && <li><Link href={`/${locale}/store`}>{t('nav.store')}</Link></li>}
              <li><Link href={`/${locale}/gallery`}>{t('nav.gallery')}</Link></li>
              <li><Link href={`/${locale}/booking`}>{t('nav.book')}</Link></li>
            </ul>
          </div>

          <div>
            <h4>{t('home.hoursTitle')}</h4>
            <ul>
              {hours.map((h) => (
                <li key={h.day} className="small" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span className="muted">{days[h.day]}</span>
                  <span>{h.off ? t('admin.closed') : `${h.open} - ${h.close}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t('footer.contact')}</h4>
            <ul>
              {settings.phone && (
                <li>
                  <a href={`tel:${settings.phone}`} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <Icon name="phone" size={15} /> <span dir="ltr">{settings.phone}</span>
                  </a>
                </li>
              )}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                    <Icon name="mail" size={15} /> <span dir="ltr">{settings.email}</span>
                  </a>
                </li>
              )}
              {settings.addressAr && (
                <li>
                  <span style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Icon name="map" size={15} />
                    <span>{locale === 'en' ? settings.addressEn || settings.addressAr : settings.addressAr}</span>
                  </span>
                </li>
              )}
            </ul>
            <form className="subscribe" action={`/${locale}/contact`} method="get">
              <input name="msg" placeholder={t('footer.newsletterMsg')} />
              <button className="btn btn-primary btn-sm" type="submit">{t('footer.subscribe')}</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {name}. {t('footer.rights')}</span>
          <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Link href="/admin" className="small muted">{t('nav.admin')}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
