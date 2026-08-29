import { list } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import NotificationsManager from '@/components/admin/NotificationsManager';

export const dynamic = 'force-dynamic';

export default async function AdminNotifications() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const settings = await getSettings();

  const [rows, counts] = await Promise.all([
    list('notifications', { order: { createdAt: 'desc' }, limit: 200 }),
    list('notifications', { select: 'status' }),
  ]);

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 6 }}>{t('admin.notifications')}</h1>
      <p className="muted small mb-3">{t('notify.sub')}</p>
      <NotificationsManager
        initialRows={rows}
        initialCounts={counts.reduce((acc, c) => ({ ...acc, [c.status]: (acc[c.status] || 0) + 1 }), {})}
        locale={locale}
        settings={settings}
      />
    </div>
  );
}
