import { list } from '@/lib/supabase';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminServices() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';
  const rows = await list('services', { order: { sort: 'asc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.services')}</h1>
      <CrudManager
        model="services"
        locale={locale}
        rows={rows}
        title={t('admin.services')}
        addLabel={t('admin.addService')}
        searchKeys={['nameAr', 'nameEn', 'category']}
        extra={{ filters: [{ key: 'category', label: t('admin.category'), options: [...new Set(rows.map((r) => r.category))] }] }}
        columns={[
          { key: 'name', label: t('common.name'), type: 'localized', ar: 'nameAr', en: 'nameEn' },
          { key: 'category', label: t('admin.category') },
          { key: 'price', label: t('common.price'), type: 'price' },
          { key: 'durationMin', label: t('admin.duration'), type: 'duration' },
          { key: 'active', label: t('common.active'), type: 'bool' },
          { key: 'sort', label: t('admin.sort') },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'nameAr', label: t('admin.nameAr') },
          { name: 'nameEn', label: t('admin.nameEn') },
          { name: 'slug', label: 'Slug', dir: 'ltr', placeholder: 'classic-haircut' },
          { name: 'category', label: t('admin.category') },
          { name: 'price', label: `${t('common.price')} (₪)`, type: 'price', default: 40 },
          { name: 'durationMin', label: t('admin.duration'), type: 'number', default: 30 },
          { name: 'icon', label: t('admin.icon'), type: 'icon' },
          { name: 'sort', label: t('admin.sort'), type: 'number', default: 0 },
          { name: 'descAr', label: t('admin.descAr'), type: 'textarea' },
          { name: 'descEn', label: t('admin.descEn'), type: 'textarea' },
          { name: 'image', label: t('common.image'), type: 'image' },
          { name: 'active', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
