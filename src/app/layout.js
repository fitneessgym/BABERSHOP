import { headers } from 'next/headers';
import './globals.css';

export const metadata = {
  title: 'صالون حلاقة | نظام الحجز والمتجر',
  description: 'نظام متكامل لإدارة صالون الحلاقة: حجز مواعيد أونلاين، متجر منتجات العناية، ولوحة تحكم كاملة.',
};

export default async function RootLayout({ children }) {
  const h = await headers();
  const locale = h.get('x-locale') || 'ar';
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Tajawal:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
