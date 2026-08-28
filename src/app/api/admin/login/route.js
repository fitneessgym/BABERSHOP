import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createSession, destroySession, hashPassword } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // أول تشغيل: إن لم يوجد أي حساب، أنشئ حساب المالك من متغيرات البيئة
    const count = await prisma.admin.count();
    if (count === 0) {
      const envEmail = process.env.ADMIN_EMAIL;
      const envPass = process.env.ADMIN_PASSWORD;
      if (!envEmail || !envPass) {
        return NextResponse.json({
          error: 'لا يوجد حساب مدير بعد. أضف ADMIN_EMAIL و ADMIN_PASSWORD في Environment Variables ثم أعد المحاولة.',
        }, { status: 400 });
      }
      await prisma.admin.create({
        data: { email: String(envEmail).trim(), passwordHash: hashPassword(String(envPass)), name: 'مدير الصالون', role: 'owner' },
      });
    }

    const admin = await prisma.admin.findFirst({ where: { email: String(email || '').trim() } });
    if (!admin || !verifyPassword(String(password || ''), admin.passwordHash)) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }
    await createSession(admin.id);
    await prisma.admin.update({ where: { id: admin.id }, data: { lastLogin: new Date() } }).catch(() => {});
    return NextResponse.json({ ok: true, role: admin.role, name: admin.name });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
