import { getSettings, DEFAULT_TEMPLATES } from '@/lib/settings';
import { getAdminLocale } from '@/lib/locale';
import { requireAdmin } from '@/lib/auth';
import SettingsForm from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const locale = await getAdminLocale();
  const settings = await getSettings();
  const admin = await requireAdmin();
  return <SettingsForm settings={settings} locale={locale} defaultTemplates={DEFAULT_TEMPLATES} admin={admin} />;
}
