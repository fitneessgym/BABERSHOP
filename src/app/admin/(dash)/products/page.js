import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';
  const rows = await prisma.product.findMany({ orderBy: { sort: 'asc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.products')}</h1>
      <CrudManager
        model="products"
        locale={locale}
        rows={rows}
        title={t('admin.products')}
        addLabel={t('admin.addProduct')}
        searchKeys={['nameAr', 'nameEn', 'brand', 'categoryAr']}
        extra={{ filters: [{ key: 'categoryAr', label: t('admin.category'), options: [...new Set(rows.map((r) => r.categoryAr))] }] }}
        columns={[
          { key: 'image', label: t('common.image'), type: 'img' },
          { key: 'name', label: t('common.name'), type: 'localized', ar: 'nameAr', en: 'nameEn' },
          { key: 'cat', label: t('admin.category'), type: 'localized', ar: 'categoryAr', en: 'categoryEn' },
          { key: 'price', label: t('common.price'), type: 'price' },
          { key: 'stock', label: t('admin.stock'), type: 'number', low: 3 },
          { key: 'featured', label: t('admin.featured'), type: 'bool' },
          { key: 'active', label: t('common.active'), type: 'bool' },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'nameAr', label: t('admin.nameAr') },
          { name: 'nameEn', label: t('admin.nameEn') },
          { name: 'slug', label: 'Slug', dir: 'ltr' },
          { name: 'categoryAr', label: `${t('admin.category')} (ع)`, default: 'عام' },
          { name: 'categoryEn', label: `${t('admin.category')} (en)`, default: 'General' },
          { name: 'price', label: `${t('common.price')} (₪)`, type: 'price', default: 50 },
          { name: 'compareAtPrice', label: `${t('common.price')} قبل (₪)`, type: 'price', default: 0 },
          { name: 'stock', label: t('admin.stock'), type: 'number', default: 10 },
          { name: 'brand', label: t('store.brand') },
          { name: 'size', label: t('store.size') },
          { name: 'sort', label: t('admin.sort'), type: 'number', default: 0 },
          { name: 'descAr', label: t('admin.descAr'), type: 'textarea' },
          { name: 'descEn', label: t('admin.descEn'), type: 'textarea' },
          { name: 'image', label: t('common.image'), type: 'image' },
          { name: 'featured', label: t('admin.featured'), type: 'checkbox' },
          { name: 'active', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
