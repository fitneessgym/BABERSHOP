import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminGallery() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';
  const rows = await prisma.galleryImage.findMany({ orderBy: { sort: 'asc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.gallery')}</h1>
      <CrudManager
        model="gallery"
        locale={locale}
        rows={rows}
        title={t('admin.gallery')}
        addLabel={t('admin.addImage')}
        searchKeys={['captionAr', 'captionEn']}
        columns={[
          { key: 'url', label: t('common.image'), type: 'img' },
          { key: 'cap', label: t('common.name'), type: 'localized', ar: 'captionAr', en: 'captionEn' },
          { key: 'sort', label: t('admin.sort') },
          { key: 'active', label: t('common.active'), type: 'bool' },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'captionAr', label: `${t('common.name')} (ع)` },
          { name: 'captionEn', label: `${t('common.name')} (en)` },
          { name: 'sort', label: t('admin.sort'), type: 'number', default: 0 },
          { name: 'url', label: t('common.image'), type: 'image' },
          { name: 'active', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
