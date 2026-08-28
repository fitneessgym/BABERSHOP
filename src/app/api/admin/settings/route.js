import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { saveSettings, getSettings } from '@/lib/settings';

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const data = await req.json();
  await saveSettings(data);
  return NextResponse.json({ ok: true, settings: await getSettings() });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  return NextResponse.json(await getSettings());
}
