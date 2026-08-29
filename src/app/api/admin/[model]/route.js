import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { insert, update, remove, removeWhere } from '@/lib/supabase';
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
// حقول مرتبطة بجداول أخرى: القيمة الفارغة تصبح null حتى لا يرفضها القيد المرجعي
const FK = new Set(['barberId', 'serviceId', 'productId', 'orderId']);

// خريطة النماذج إلى جداول Supabase
const MAP = {
  services: 'services',
  barbers: 'barbers',
  products: 'products',
  gallery: 'gallery_images',
  galleryimages: 'gallery_images',
  coupons: 'coupons',
  reviews: 'reviews',
  bookings: 'bookings',
  orders: 'orders',
  messages: 'messages',
  timeoff: 'time_off',
};

// نماذج لها حقل رابط (slug) فريد
const SLUG_MODELS = new Set(['services', 'barbers', 'products']);

const rand4 = () => Math.random().toString(36).slice(2, 6);

/** توليد رابط لاتيني مقروء من الاسم */
function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** يضمن وجود slug/code حتى لا تفشل الإضافة بسبب قيد الفريدية */
function ensureUniqueFields(modelKey, data) {
  if (SLUG_MODELS.has(modelKey) && !String(data.slug || '').trim()) {
    data.slug = slugify(data.nameEn) || slugify(data.nameAr) || `item-${rand4()}`;
  }
  if (modelKey === 'coupons' && !String(data.code || '').trim()) {
    data.code = `SAVE-${rand4().toUpperCase()}`;
  }
  return data;
}

function clean(model, data) {
  const allowed = FIELDS[model] || [];
  const out = {};
  for (const k of allowed) {
    if (data[k] === undefined) continue;
    if (BOOL.has(k)) out[k] = data[k] === true || data[k] === 'true' || data[k] === '1' || data[k] === 1;
    else if (NUM.has(k)) out[k] = Number(data[k]) || 0;
    else out[k] = data[k] === null ? '' : String(data[k]);
  }
  // مفاتيح مرتبطة فارغة → null
  for (const k of FK) if (out[k] === '') out[k] = null;
  return out;
}

/** مزامنة خدمات الحلاق (جدول الربط barber_services) */
async function syncBarberServices(barberId, serviceIds) {
  await removeWhere('barber_services', { barberId });
  for (const sid of serviceIds) {
    await insert('barber_services', { barberId, serviceId: sid }).catch(() => {});
  }
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
      const data = ensureUniqueFields(modelKey, clean(modelKey, body.data || {}));
      if (modelKey === 'coupons' && data.code) data.code = String(data.code).toUpperCase();
      let row;
      try {
        row = await insert(table, data);
      } catch (e) {
        // لو الرابط/الكود مكرر نضيف لاحقة عشوائية ونعيد المحاولة مرة واحدة
        if (/مستخدم مسبقاً|duplicate|unique/i.test(e.message) && (data.slug !== undefined || data.code !== undefined)) {
          if (data.slug !== undefined) data.slug = `${slugify(data.slug) || 'item'}-${rand4()}`;
          if (data.code !== undefined) data.code = `${String(data.code).split('-')[0]}-${rand4().toUpperCase()}`;
          row = await insert(table, data);
        } else {
          throw e;
        }
      }
      if (modelKey === 'barbers' && Array.isArray(body.serviceIds)) {
        await syncBarberServices(row.id, body.serviceIds);
      }
      return NextResponse.json({ ok: true, row });
    }

    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'معرّف مفقود' }, { status: 400 });
      const data = clean(modelKey, body.data || {});
      if (modelKey === 'coupons' && data.code) data.code = String(data.code).toUpperCase();
      const row = await update(table, id, data);
      if (modelKey === 'orders' && body.data?.status) {
        try { await notifyOrder(row, 'order_status', 'ar'); } catch (e) { console.log('notify error:', e.message); }
      }
      if (modelKey === 'barbers' && Array.isArray(body.serviceIds)) {
        await syncBarberServices(id, body.serviceIds);
      }
      return NextResponse.json({ ok: true, row });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'معرّف مفقود' }, { status: 400 });
      await remove(table, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
