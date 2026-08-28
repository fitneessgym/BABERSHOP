import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminReviews() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';
  const rows = await prisma.review.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.reviews')}</h1>
      <CrudManager
        model="reviews"
        locale={locale}
        rows={rows}
        title={t('admin.reviews')}
        addLabel={t('common.add')}
        searchKeys={['name', 'commentAr', 'commentEn']}
        columns={[
          { key: 'name', label: t('common.name') },
          { key: 'rating', label: t('admin.rating'), type: 'stars' },
          { key: 'comment', label: t('admin.note'), type: 'truncate', ar: 'commentAr', en: 'commentEn', max: 60 },
          { key: 'approved', label: t('common.active'), type: 'bool' },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'name', label: t('common.name') },
          { name: 'rating', label: t('admin.rating'), type: 'number', default: 5 },
          { name: 'commentAr', label: `${t('admin.note')} (ع)`, type: 'textarea' },
          { name: 'commentEn', label: `${t('admin.note')} (en)`, type: 'textarea' },
          { name: 'approved', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
