import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { getCurrentAdmin } from '@/lib/auth';
import { getSettings, fontOptions } from '@/lib/settings';
import LoginForm from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect('/admin');

  const h = await headers();
  const jar = await cookies();
  const locale = jar.get('lang')?.value === 'en' ? 'en' : (h.get('x-locale') || 'ar');
  const settings = await getSettings();

  const css = `:root{
    --primary:${settings.primaryColor};--primary-dark:${settings.primaryDark};--accent:${settings.accentColor};
    --bg:${settings.bgColor};--surface:${settings.surfaceColor};--text:${settings.textColor};
    --muted:${settings.mutedColor};--radius:${settings.borderRadius}px;
    --font:${fontOptions[settings.fontFamily] || fontOptions.system};
  }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="login-wrap">
        <div className="login-bg" style={{ backgroundImage: `url(${settings.heroImage || '/uploads/hero.jpg'})` }} />
        <div className="login-card">
          <div className="logo" style={{ justifyContent: 'center' }}>
            <span className="logo-mark"><span style={{ display: 'grid' }}>✂</span></span>
            <span className="logo-text">
              <span>{locale === 'en' ? settings.salonNameEn : settings.salonNameAr}</span>
              <small>{locale === 'en' ? settings.taglineEn : settings.taglineAr}</small>
            </span>
          </div>
          <h2 style={{ textAlign: 'center', fontSize: 22, marginBottom: 6 }}>{locale === 'en' ? 'Admin Sign in' : 'تسجيل الدخول للإدارة'}</h2>

          <LoginForm locale={locale} />
        </div>
      </div>
    </>
  );
}
