import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { getSettings, fontOptions } from '@/lib/settings';
import { count } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminTop from '@/components/admin/AdminTop';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/admin/login');

  const h = await headers();
  const jar = await cookies();
  const locale = jar.get('lang')?.value === 'en' ? 'en' : (h.get('x-locale') || 'ar');

  const settings = await getSettings();
  const [pendingBookings, newOrders, services, products, messages, unreadNotifications] = await Promise.all([
    count('bookings', { where: { status: 'pending' } }),
    count('orders', { where: { status: 'new' } }),
    count('services', { where: { active: true } }),
    count('products', { where: { active: true } }),
    count('messages', { where: { read: false } }),
    count('notifications', { where: { read: false } }),
  ]);

  const css = `:root{
    --primary:${settings.primaryColor};
    --primary-dark:${settings.primaryDark};
    --accent:${settings.accentColor};
    --bg:${settings.bgColor};
    --surface:${settings.surfaceColor};
    --text:${settings.textColor};
    --muted:${settings.mutedColor};
    --radius:${settings.borderRadius}px;
    --font:${fontOptions[settings.fontFamily] || fontOptions.system};
  }`;

  return (
    <div className="admin-wrap">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <AdminSidebar locale={locale} settings={settings} role={admin.role} counts={{ pendingBookings, newOrders, services, products, messages, unreadNotifications }} />
      <div className="admin-main">
        <AdminTop locale={locale} settings={settings} admin={admin} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
