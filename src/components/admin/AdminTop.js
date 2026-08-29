'use client';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import NotifyBell from './NotifyBell';
import { makeT } from '@/lib/i18n';

export default function AdminTop({ locale, settings, admin }) {
  const t = makeT(locale);
  const router = useRouter();

  function switchLang(next) {
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <div className="admin-top">
      <div>
        <b style={{ fontSize: 15 }}>{t('admin.welcome')}</b>
        <div className="small muted">{admin?.name}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="badge badge-completed hide-sm">● {t('common.active')}</span>
        <div className="lang-switch">
          <button className={locale === 'ar' ? 'on' : ''} onClick={() => switchLang('ar')}>ع</button>
          <button className={locale === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>EN</button>
        </div>
        <NotifyBell locale={locale} />
        <a href={`/${locale}`} target="_blank" className="icon-btn hide-sm" title={t('admin.viewSite')}>
          <Icon name="eye" size={17} />
        </a>
      </div>
    </div>
  );
}
