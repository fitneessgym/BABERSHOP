import { NextResponse } from 'next/server';
import { verifyPassword, createSession, destroySession, hashPassword } from '@/lib/auth';
import { count, one, insert, update } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // أول تشغيل: إن لم يوجد أي حساب، أنشئ حساب المالك من متغيرات البيئة
    const adminsCount = await count('admins');
    if (adminsCount === 0) {
      const envEmail = process.env.ADMIN_EMAIL;
      const envPass = process.env.ADMIN_PASSWORD;
      if (!envEmail || !envPass) {
        return NextResponse.json({
          error: 'لا يوجد حساب مدير بعد. أضف ADMIN_EMAIL و ADMIN_PASSWORD في Environment Variables ثم أعد المحاولة.',
        }, { status: 400 });
      }
      await insert('admins', {
        email: String(envEmail).trim(), passwordHash: hashPassword(String(envPass)), name: 'مدير الصالون', role: 'owner',
      });
    }

    const admin = await one('admins', { where: { email: String(email || '').trim() } });
    if (!admin || !verifyPassword(String(password || ''), admin.passwordHash)) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }
    await createSession(admin.id);
    await update('admins', admin.id, { lastLogin: new Date().toISOString() }).catch(() => {});
    return NextResponse.json({ ok: true, role: admin.role, name: admin.name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
