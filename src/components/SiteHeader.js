'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import SmartImage from './SmartImage';
import { useCart } from './CartProvider';
import { makeT } from '@/lib/i18n';

export default function SiteHeader({ settings, locale }) {
  const t = makeT(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const { count, open, setOpen } = useCart();
  const name = locale === 'en' ? settings.salonNameEn : settings.salonNameAr;

  const links = [
    { href: `/${locale}`, key: 'nav.home', exact: true },
    { href: `/${locale}/services`, key: 'nav.services' },
    { href: `/${locale}/barbers`, key: 'nav.barbers' },
    ...(settings.storeEnabled === '1' ? [{ href: `/${locale}/store`, key: 'nav.store' }] : []),
    { href: `/${locale}/gallery`, key: 'nav.gallery' },
    { href: `/${locale}/contact`, key: 'nav.contact' },
  ];

  const isActive = (l) => (l.exact ? pathname === l.href : pathname.startsWith(l.href));

  function switchLang(next) {
    if (next === locale) return;
    if (pathname.startsWith('/admin')) {
      document.cookie = `lang=${next}; path=/; max-age=31536000`;
      window.location.reload();
      return;
    }
    const parts = pathname.split('/');
    if (parts[1] === 'ar' || parts[1] === 'en') parts[1] = next;
    else parts.splice(1, 0, next);
    router.push(parts.join('/') || `/${next}`);
  }

  return (
    <>
      <header className="header" id="siteHeader">
        <div className="container">
          <div className="header-inner">
            <Link href={`/${locale}`} className="logo">
              {settings.logo ? (
                <SmartImage src={settings.logo} alt={name} style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10 }} />
              ) : (
                <span className="logo-mark"><Icon name="scissors" size={22} /></span>
              )}
              <span className="logo-text">
                <span>{name}</span>
                <small>{locale === 'en' ? settings.taglineEn : settings.taglineAr}</small>
              </span>
            </Link>

            <nav className="nav">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={isActive(l) ? 'active' : ''}>{t(l.key)}</Link>
              ))}
            </nav>

            <div className="header-actions">
              <div className="lang-switch">
                <button className={locale === 'ar' ? 'on' : ''} onClick={() => switchLang('ar')}>ع</button>
                <button className={locale === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>EN</button>
              </div>

              {settings.storeEnabled === '1' && (
                <button className="icon-btn" onClick={() => setOpen(true)} aria-label={t('nav.cart')}>
                  <Icon name="cart" size={19} />
                  {count > 0 && <span className="cart-count">{count}</span>}
                </button>
              )}

              <Link href={`/${locale}/booking`} className="btn btn-primary btn-sm hide-sm">
                <Icon name="calendar" size={16} /> {t('nav.book')}
              </Link>

              <button className="icon-btn burger" onClick={() => setMenu(!menu)} aria-label={t('nav.menu')}>
                <Icon name={menu ? 'close' : 'menu'} size={19} />
              </button>
            </div>
          </div>

          {menu && (
            <div className="mobile-nav open">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenu(false)}>{t(l.key)}</Link>
              ))}
              <Link href={`/${locale}/booking`} onClick={() => setMenu(false)} style={{ color: 'var(--primary)' }}>
                {t('nav.book')}
              </Link>
            </div>
          )}
        </div>
      </header>
      <CartDrawer locale={locale} settings={settings} />
    </>
  );
}

function CartDrawer({ locale, settings }) {
  const t = makeT(locale);
  const { items, open, setOpen, setQty, remove, subtotal, clear } = useCart();
  const ship = subtotal >= Number(settings.freeShippingOver || 0) || subtotal === 0 ? 0 : Number(settings.shippingCost || 0);

  return (
    <>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`cart-drawer ${open ? 'open' : ''}`}>
        <div className="cart-head">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="cart" size={19} className="primary-text" /> {t('nav.cart')}
          </h3>
          <button className="icon-btn" onClick={() => setOpen(false)}><Icon name="close" size={18} /></button>
        </div>

        <div className="cart-body">
          {items.length === 0 ? (
            <div className="empty">
              <Icon name="package" size={46} />
              <p>{t('store.cartEmpty')}</p>
              <p className="small">{t('store.cartEmptyMsg')}</p>
            </div>
          ) : items.map((i) => (
            <div className="cart-item" key={i.id}>
              <SmartImage src={i.image} alt={locale === 'en' ? i.nameEn : i.nameAr} />
              <div className="ci-info">
                <b>{locale === 'en' ? i.nameEn : i.nameAr}</b>
                <span className="primary-text small bold">{i.price} {settings.currency}</span>
                <div className="qty-ctrl">
                  <button onClick={() => setQty(i.id, i.qty - 1)}><Icon name="minus" size={13} /></button>
                  <span>{i.qty}</span>
                  <button onClick={() => setQty(i.id, i.qty + 1)}><Icon name="plus" size={13} /></button>
                  <button onClick={() => remove(i.id)} style={{ marginInlineStart: 'auto', color: '#f85149' }}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="cart-foot">
            <div className="summary-row"><span>{t('common.subtotal')}</span><span>{subtotal} {settings.currency}</span></div>
            <div className="summary-row">
              <span>{t('store.shipping')}</span>
              <span>{ship === 0 ? t('store.freeShipping') : `${ship} ${settings.currency}`}</span>
            </div>
            <div className="summary-row"><span className="bold">{t('common.total')}</span><b>{subtotal + ship} {settings.currency}</b></div>
            <Link href={`/${locale}/store/checkout`} className="btn btn-primary btn-block mt-2" onClick={() => setOpen(false)}>
              {t('store.checkout')}
            </Link>
            <button className="btn btn-ghost btn-block btn-sm mt-1" onClick={clear}>{t('common.delete')}</button>
          </div>
        )}
      </aside>
    </>
  );
}
