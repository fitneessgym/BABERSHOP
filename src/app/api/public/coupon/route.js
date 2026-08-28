import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req) {
  const { code, total } = await req.json();
  if (!code) return NextResponse.json({ error: 'no code' }, { status: 400 });
  const c = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase() } });
  if (!c || !c.active) return NextResponse.json({ error: 'invalid' }, { status: 404 });
  if (c.minTotal && total < c.minTotal) return NextResponse.json({ error: `min ${c.minTotal}` }, { status: 400 });
  const discount = c.type === 'percent' ? (total * c.value) / 100 : Math.min(c.value, total);
  return NextResponse.json({ ok: true, discount: Math.round(discount), code: c.code });
}
