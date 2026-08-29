import { notFound } from 'next/navigation';
import { getSettings, fontOptions } from '@/lib/settings';
import { locales } from '@/lib/i18n';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { CartProvider } from '@/components/CartProvider';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  const settings = await getSettings();

  const css = `:root{
    --primary:${settings.primaryColor};
    --primary-dark:${settings.primaryDark};
    --accent:${settings.accentColor};
    --bg:${settings.bgColor};
    --surface:${settings.surfaceColor};
    --text:${settings.textColor};
    --muted:${settings.mutedColor};
    --radius:${settings.borderRadius}px;
    --font:${fontOptions[settings.fontFamily] || fontOptions.system};
  }`;

  return (
    <CartProvider>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SiteHeader settings={settings} locale={locale} />
      <main>{children}</main>
      <SiteFooter settings={settings} locale={locale} />
    </CartProvider>
  );
}
