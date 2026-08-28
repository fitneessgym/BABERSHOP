import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createSession, destroySession } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
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
