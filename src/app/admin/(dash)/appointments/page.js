import { list } from '@/lib/supabase';
import { getSettings } from '@/lib/settings';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import AppointmentsManager from '@/components/admin/AppointmentsManager';

export const dynamic = 'force-dynamic';

export default async function AdminAppointments() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const settings = await getSettings();

  const [bookings, services, barbers] = await Promise.all([
    list('bookings', { order: [{ date: 'desc' }, { time: 'asc' }], limit: 500 }),
    list('services', { order: { sort: 'asc' } }),
    list('barbers', { order: { sort: 'asc' } }),
  ]);

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.appointments')}</h1>
      <AppointmentsManager bookings={bookings} services={services} barbers={barbers} locale={locale} settings={settings} />
    </div>
  );
}
