import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateCode } from '@/lib/slots';
import { notifyOrder } from '@/lib/notify';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, phone, email, city, address, notes, payment, items, coupon, discount = 0, shipping = 0, total = 0 } = body;

    if (!name || !phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const ids = items.map((i) => i.id).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });

    const orderItems = items.map((i) => {
      const p = products.find((x) => x.id === i.id);
      return {
        productId: p?.id || null,
        nameAr: p?.nameAr || i.nameAr || '',
        nameEn: p?.nameEn || i.nameEn || '',
        price: p?.price ?? i.price ?? 0,
        qty: Math.min(Math.max(1, Number(i.qty) || 1), 99),
        image: p?.image || i.image || '',
      };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

    const order = await prisma.order.create({
      data: {
        code: generateCode('ORD'),
        customerName: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email || '').trim(),
        city: String(city || '').trim(),
        address: String(address || '').trim(),
        notes: String(notes || '').trim(),
        payment: payment || 'cash',
        coupon: String(coupon || '').trim(),
        subtotal,
        shipping: Number(shipping) || 0,
        discount: Number(discount) || 0,
        total: Number(total) || subtotal + Number(shipping || 0) - Number(discount || 0),
        status: 'new',
        items: { create: orderItems },
      },
    });

    // خصم المخزون
    for (const i of orderItems) {
      if (!i.productId) continue;
      await prisma.product.update({ where: { id: i.productId }, data: { stock: { decrement: Math.min(i.qty, 999) } } }).catch(() => {});
    }
    if (coupon) {
      await prisma.coupon.updateMany({ where: { code: String(coupon).toUpperCase() }, data: { uses: { increment: 1 } } }).catch(() => {});
    }

    try { await notifyOrder(order, 'order_new', 'ar'); } catch (e) { console.log('notify error:', e.message); }

    return NextResponse.json({ ok: true, code: order.code, total: order.total, id: order.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
