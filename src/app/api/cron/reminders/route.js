import { NextResponse } from 'next/server';
import { processDue } from '@/lib/notify';

/**
 * نقطة نهاية للجدولة الخارجية (cron):
 * GET /api/cron/reminders?key=SECRET&reminderHours=24
 * يمكن استدعاؤها كل ساعة من cron job أو من زر داخل لوحة التحكم (مع جلسة أدمن).
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const secret = process.env.CRON_SECRET;
  if (secret && key !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const r = await processDue(Number(searchParams.get('limit') || 100));
    return NextResponse.json({ ok: true, ...r, at: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
