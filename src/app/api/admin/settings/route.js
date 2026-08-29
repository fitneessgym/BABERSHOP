import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { saveSettings, getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const admin = await requireAdmin();

    if (!admin) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // حفظ الإعدادات
    await saveSettings(data);

    // قراءة الإعدادات مباشرة بعد الحفظ للتأكد
    const saved = await getSettings();

    return NextResponse.json({
      ok: true,
      phone: saved.phone,
      workingHours: saved.workingHours,
      saved
    });
  } catch (error) {
    console.error('SETTINGS SAVE ERROR:', error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'فشل حفظ الإعدادات'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { error: 'غير مصرح' },
      { status: 401 }
    );
  }

  return NextResponse.json(await getSettings());
}