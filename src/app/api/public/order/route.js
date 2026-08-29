import { NextResponse } from 'next/server';
import { one, list, insert, update, updateWhere } from '@/lib/supabase';
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
    const products = await list('products', { where: { id: { in: ids } } });

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

    const order = await insert('orders', {
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
    });

    // عناصر الطلب
    await insert('order_items', orderItems.map((i) => ({ ...i, orderId: order.id })));

    // خصم المخزون
    for (const i of orderItems) {
      if (!i.productId) continue;
      try {
        const p = await one('products', { where: { id: i.productId }, select: 'stock' });
        if (p) await update('products', i.productId, { stock: Math.max(0, (p.stock || 0) - Math.min(i.qty, 999)) });
      } catch {}
    }
    if (coupon) {
      try {
        const c = await one('coupons', { where: { code: String(coupon).toUpperCase() }, select: 'uses' });
        if (c) await updateWhere('coupons', { code: String(coupon).toUpperCase() }, { uses: (c.uses || 0) + 1 });
      } catch {}
    }

    try { await notifyOrder(order, 'order_new', 'ar'); } catch (e) { console.log('notify error:', e.message); }

    return NextResponse.json({ ok: true, code: order.code, total: order.total, id: order.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
