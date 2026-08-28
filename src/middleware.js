import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === '/') {
    const lang = req.cookies.get('lang')?.value === 'en' ? 'en' : 'ar';
    return NextResponse.redirect(new URL(`/${lang}`, req.url));
  }

  let locale = req.cookies.get('lang')?.value === 'en' ? 'en' : 'ar';
  const m = pathname.match(/^\/(ar|en)(\/|$)/);
  if (m) locale = m[1];

  const headers = new Headers(req.headers);
  headers.set('x-locale', locale);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api|uploads|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
