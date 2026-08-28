import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notifyOrder } from '@/lib/notify';

const FIELDS = {
  services: ['slug', 'nameAr', 'nameEn', 'descAr', 'descEn', 'price', 'durationMin', 'icon', 'image', 'category', 'active', 'sort'],
  barbers: ['slug', 'nameAr', 'nameEn', 'roleAr', 'roleEn', 'bioAr', 'bioEn', 'photo', 'rating', 'experience', 'active', 'sort', 'schedule'],
  products: ['slug', 'nameAr', 'nameEn', 'descAr', 'descEn', 'price', 'compareAtPrice', 'image', 'categoryAr', 'categoryEn', 'brand', 'size', 'stock', 'featured', 'active', 'sort'],
  gallery: ['url', 'captionAr', 'captionEn', 'sort', 'active'],
  coupons: ['code', 'type', 'value', 'minTotal', 'active'],
  reviews: ['name', 'rating', 'commentAr', 'commentEn', 'approved'],
  bookings: ['status', 'date', 'time', 'barberId', 'serviceId', 'notes', 'customerName', 'phone', 'price'],
  orders: ['status', 'notes', 'payment'],
  messages: ['read'],
  timeoff: ['barberId', 'date', 'time', 'reason'],
};

const NUM = new Set(['price', 'durationMin', 'sort', 'rating', 'experience', 'stock', 'compareAtPrice', 'value', 'minTotal']);
const BOOL = new Set(['active', 'featured', 'approved', 'read']);
const MAP = {
  services: prisma.service, barbers: prisma.barber, products: prisma.product,
  gallery: prisma.galleryImage, galleryimages: prisma.galleryImage,
  coupons: prisma.coupon, reviews: prisma.review, bookings: prisma.booking,
  orders: prisma.order, messages: prisma.message, timeoff: prisma.timeOff,
};

function clean(model, data) {
  const allowed = FIELDS[model] || [];
  const out = {};
  for (const k of allowed) {
    if (data[k] === undefined) continue;
    if (BOOL.has(k)) out[k] = data[k] === true || data[k] === 'true' || data[k] === '1' || data[k] === 1;
    else if (NUM.has(k)) out[k] = Number(data[k]) || 0;
    else out[k] = data[k] === null ? '' : String(data[k]);
  }
  return out;
}

export async function POST(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { model } = await params;
  const modelKey = String(model).toLowerCase();
  const table = MAP[modelKey];
  if (!table) return NextResponse.json({ error: 'نموذج غير معروف' }, { status: 404 });

  const body = await req.json();
  const { action = 'create', id } = body;

  try {
    if (action === 'create') {
      const data = clean(modelKey, body.data || {});
      if (modelKey === 'coupons' && data.code) data.code = String(data.code).toUpperCase();
      const row = await table.create({ data });
      if (modelKey === 'barbers' && Array.isArray(body.serviceIds)) {
        await prisma.barberService.deleteMany({ where: { barberId: row.id } });
        for (const sid of body.serviceIds) {
          await prisma.barberService.create({ data: { barberId: row.id, serviceId: sid } }).catch(() => {});
        }
      }
      return NextResponse.json({ ok: true, row });
    }

    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'معرّف مفقود' }, { status: 400 });
      const data = clean(modelKey, body.data || {});
      if (modelKey === 'coupons' && data.code) data.code = String(data.code).toUpperCase();
      const row = await table.update({ where: { id }, data });
      if (modelKey === 'orders' && body.data?.status) {
        try { await notifyOrder(row, 'order_status', 'ar'); } catch (e) { console.log('notify error:', e.message); }
      }
      if (modelKey === 'barbers' && Array.isArray(body.serviceIds)) {
        await prisma.barberService.deleteMany({ where: { barberId: id } });
        for (const sid of body.serviceIds) {
          await prisma.barberService.create({ data: { barberId: id, serviceId: sid } }).catch(() => {});
        }
      }
      return NextResponse.json({ ok: true, row });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'معرّف مفقود' }, { status: 400 });
      await table.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
