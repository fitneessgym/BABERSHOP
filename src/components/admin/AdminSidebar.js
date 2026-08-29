'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

export default function AdminSidebar({ locale, counts = {}, settings, role = 'owner' }) {
  const t = makeT(locale);
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const items = [
    { href: '/admin', label: t('admin.dashboard'), icon: 'dashboard', exact: true },
    { href: '/admin/appointments', label: t('admin.appointments'), icon: 'calendar', n: counts.pendingBookings },
    { href: '/admin/services', label: t('admin.services'), icon: 'scissors', n: counts.services },
    { href: '/admin/barbers', label: t('admin.barbers'), icon: 'users' },
    { href: '/admin/products', label: t('admin.products'), icon: 'package', n: counts.products },
    { href: '/admin/orders', label: t('admin.orders'), icon: 'cart', n: counts.newOrders },
    { href: '/admin/coupons', label: t('admin.coupons'), icon: 'percent' },
    { href: '/admin/notifications', label: t('admin.notifications'), icon: 'message', n: counts.unreadNotifications },
    { href: '/admin/gallery', label: t('admin.gallery'), icon: 'image' },
    { href: '/admin/reviews', label: t('admin.reviews'), icon: 'star' },
    { href: '/admin/messages', label: t('contact.form'), icon: 'message' },
    { href: '/admin/users', label: t('admin.users'), icon: 'shield' },
    { href: '/admin/settings', label: t('admin.settings'), icon: 'settings' },
  ];

  async function logout() {
    setBusy(true);
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  }

  const visible = items.filter((it) => !(role === 'staff' && ['/admin/users', '/admin/settings', '/admin/coupons'].includes(it.href)));

  return (
    <aside className="admin-side">
      <div className="admin-brand">
        <span className="logo-mark"><Icon name="scissors" size={20} /></span>
        <span className="nav-label" style={{ fontWeight: 900, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {locale === 'en' ? settings.salonNameEn : settings.salonNameAr}
        </span>
      </div>

      <nav className="admin-nav">
        {visible.map((it) => {
          const active = it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link key={it.href} href={it.href} className={active ? 'on' : ''} title={it.label}>
              <Icon name={it.icon} size={18} />
              <span className="nav-label">{it.label}</span>
              {it.n > 0 && <span className="badge-n">{it.n}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="admin-foot" style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <a href={`/${locale}`} target="_blank" className="btn btn-ghost btn-sm btn-block" style={{ marginBottom: 8 }}>
          <Icon name="eye" size={15} /> <span className="nav-label">{t('admin.viewSite')}</span>
        </a>
        <button className="btn btn-danger btn-sm btn-block" onClick={logout} disabled={busy}>
          <Icon name="logout" size={15} /> <span className="nav-label">{t('admin.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
