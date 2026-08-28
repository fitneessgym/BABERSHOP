import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import MessagesManager from '@/components/admin/MessagesManager';

export const dynamic = 'force-dynamic';

export default async function AdminMessages() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const rows = await prisma.message.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('contact.form')}</h1>
      <MessagesManager rows={rows} locale={locale} />
    </div>
  );
}
