import Link from 'next/link';
import { getSettings } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import CheckoutForm from '@/components/CheckoutForm';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }) {
  const { locale } = await params;
  const t = makeT(locale);
  const settings = await getSettings();

  return (
    <section className="section">
      <div className="container container-sm">
        <div className="small muted mb-2" style={{ display: 'flex', gap: 8 }}>
          <Link href={`/${locale}/store`}>{t('nav.store')}</Link> / <span className="primary-text">{t('store.checkout')}</span>
        </div>
        <h1 className="section-title mb-3">{t('store.checkout')}</h1>
        <CheckoutForm locale={locale} settings={settings} />
      </div>
    </section>
  );
}
