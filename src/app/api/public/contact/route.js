import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req) {
  try {
    const { name, phone, email, message } = await req.json();
    if (!name || !message) return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    await prisma.message.create({
      data: {
        name: String(name).slice(0, 120),
        phone: String(phone || '').slice(0, 40),
        email: String(email || '').slice(0, 120),
        message: String(message).slice(0, 2000),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
