import { headers, cookies } from 'next/headers';

export async function getAdminLocale() {
  const h = await headers();
  const j = await cookies();
  return j.get('lang')?.value === 'en' ? 'en' : (h.get('x-locale') || 'ar');
}
