import prisma from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import OrdersManager from '@/components/admin/OrdersManager';

export const dynamic = 'force-dynamic';

export default async function AdminOrders() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const settings = await getSettings();
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.orders')}</h1>
      <OrdersManager orders={orders} locale={locale} settings={settings} />
    </div>
  );
}
