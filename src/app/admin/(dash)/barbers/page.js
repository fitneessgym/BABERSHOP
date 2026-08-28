import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminBarbers() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';

  const [rows, services] = await Promise.all([
    prisma.barber.findMany({ orderBy: { sort: 'asc' }, include: { services: { include: { service: true } } } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sort: 'asc' } }),
  ]);

  const rowsWithIds = rows.map((r) => ({ ...r, _serviceIds: r.services.map((s) => s.serviceId), serviceCount: r.services.length }));

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.barbers')}</h1>
      <CrudManager
        model="barbers"
        locale={locale}
        rows={rowsWithIds}
        title={t('admin.barbers')}
        addLabel={t('admin.addBarber')}
        searchKeys={['nameAr', 'nameEn', 'roleAr']}
        extraData={{ services }}
        columns={[
          { key: 'photo', label: t('common.image'), type: 'img' },
          { key: 'name', label: t('common.name'), type: 'localized', ar: 'nameAr', en: 'nameEn' },
          { key: 'role', label: t('admin.role'), type: 'localized', ar: 'roleAr', en: 'roleEn' },
          { key: 'rating', label: t('admin.rating'), type: 'stars' },
          { key: 'experience', label: t('admin.experience') },
          { key: 'serviceCount', label: t('admin.servicesOffered'), type: 'len', of: 'services' },
          { key: 'active', label: t('common.active'), type: 'bool' },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'nameAr', label: t('admin.nameAr') },
          { name: 'nameEn', label: t('admin.nameEn') },
          { name: 'slug', label: 'Slug', dir: 'ltr' },
          { name: 'roleAr', label: `${t('admin.role')} (ع)` },
          { name: 'roleEn', label: `${t('admin.role')} (en)` },
          { name: 'experience', label: t('admin.experience'), type: 'number', default: 5 },
          { name: 'rating', label: t('admin.rating'), type: 'number', default: 5 },
          { name: 'sort', label: t('admin.sort'), type: 'number', default: 0 },
          { name: 'photo', label: t('common.image'), type: 'image' },
          { name: 'bioAr', label: `${t('admin.bio')} (ع)`, type: 'textarea' },
          { name: 'bioEn', label: `${t('admin.bio')} (en)`, type: 'textarea' },
          { name: 'services', label: t('admin.servicesOffered'), type: 'multiselect', source: 'services' },
          { name: 'schedule', label: t('admin.schedule'), type: 'schedule' },
          { name: 'active', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
