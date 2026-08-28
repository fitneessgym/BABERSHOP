import prisma from '@/lib/db';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import CrudManager from '@/components/admin/CrudManager';

export const dynamic = 'force-dynamic';

export default async function AdminCoupons() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: 26, marginBottom: 22 }}>{t('admin.coupons')}</h1>
      <CrudManager
        model="coupons"
        locale={locale}
        rows={rows}
        title={t('admin.coupons')}
        addLabel={t('admin.addCoupon')}
        searchKeys={['code']}
        columns={[
          { key: 'code', label: 'Code', type: 'code' },
          { key: 'type', label: t('common.status'), type: 'map', labelMap: { percent: 'نسبة %', fixed: 'مبلغ ثابت' } },
          { key: 'value', label: t('common.price'), type: 'price' },
          { key: 'minTotal', label: 'min', type: 'suffix', suffix: '₪' },
          { key: 'uses', label: 'uses' },
          { key: 'active', label: t('common.active'), type: 'bool' },
          { key: 'actions', label: t('common.actions'), type: 'actions' },
        ]}
        fields={[
          { name: 'code', label: 'Code (WELCOME10)', dir: 'ltr' },
          { name: 'type', label: t('common.status'), type: 'select', options: [{ value: 'percent', label: 'نسبة مئوية %' }, { value: 'fixed', label: 'مبلغ ثابت' }], default: 'percent' },
          { name: 'value', label: t('common.price'), type: 'number', default: 10 },
          { name: 'minTotal', label: 'minTotal ₪', type: 'number', default: 0 },
          { name: 'active', label: t('common.active'), type: 'checkbox', default: true },
        ]}
      />
    </div>
  );
}
