import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import UsersManager from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const me = await requireAdmin();
  if (!me) redirect('/admin/login');
  if (me.role === 'staff') redirect('/admin');

  const users = await prisma.admin.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, email: true, name: true, role: true, active: true, lastLogin: true, createdAt: true },
  });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 6 }}>{t('admin.users')}</h1>
      <p className="muted small mb-3">{t('admin.usersSub')}</p>
      <UsersManager users={users} me={{ id: me.id, role: me.role }} locale={locale} />
    </div>
  );
}
