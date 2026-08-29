/**
 * ============================================================
 *  الاتصال بقاعدة البيانات — Supabase فقط
 * ============================================================
 *  المشروع يتصل حصرياً بخدمة Supabase عبر مكتبة @supabase/supabase-js.
 *
 *  متغيرات البيئة المطلوبة (انظر .env.example):
 *    SUPABASE_URL                => رابط المشروع  https://xxxx.supabase.co
 *    SUPABASE_SERVICE_ROLE_KEY   => مفتاح الخدمة (سري — للخادم فقط، يتجاوز RLS)
 *    SUPABASE_ANON_KEY           => (اختياري) المفتاح العام، يُستخدم احتياطاً
 *
 *  ⚠️ مفتاح الخدمة لا يُعرض أبداً في المتصفح — كل الاستعلامات هنا
 *     تجري على الخادم (Server Components و API Routes).
 * ============================================================
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;

/** عميل Supabase (يُنشأ مرة واحدة عند أول استخدام) */
export function supabase() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('⚠️ اتصال Supabase غير مضبوط: أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في متغيرات البيئة (انظر .env.example)');
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/* ============================================================
   أدوات بناء الاستعلام (تحويل صيغة شبيهة بـ Prisma إلى PostgREST)
   ============================================================ */

const clean = (v) => String(v).replace(/["\\]/g, '');

/** يبني نص شرط OR بلغة PostgREST */
function orString(conditions) {
  return conditions
    .map((cond) =>
      Object.entries(cond)
        .map(([k, v]) => {
          if (v !== null && typeof v === 'object') {
            if (v.contains !== undefined) return `${k}.ilike."%${clean(v.contains)}%"`;
            if (v.equals !== undefined) return `${k}.eq."${clean(v.equals)}"`;
          }
          return `${k}.eq."${clean(v)}"`;
        })
        .join(',')
    )
    .join(',');
}

/** يطبّق شروط where على استعلام */
function applyWhere(q, where = {}) {
  const entries = Object.entries(where).filter(([, v]) => v !== undefined);
  if (!entries.length) return q.not('id', 'is', null); // شرط شامل للجميع

  for (const [k, v] of entries) {
    if (k === 'OR') {
      q = q.or(orString(v));
      continue;
    }
    if (k === 'NOT') {
      for (const [nk, nv] of Object.entries(v)) q = q.neq(nk, nv);
      continue;
    }
    if (v !== null && typeof v === 'object') {
      if (Array.isArray(v.in)) q = q.in(k, v.in);
      else if ('not' in v) q = q.neq(k, v.not);
      else if ('contains' in v) q = q.ilike(k, `%${v.contains}%`);
      else if ('gte' in v) q = q.gte(k, v.gte);
      else if ('lte' in v) q = q.lte(k, v.lte);
      else if ('gt' in v) q = q.gt(k, v.gt);
      else if ('lt' in v) q = q.lt(k, v.lt);
      continue;
    }
    q = q.eq(k, v);
  }
  return q;
}

/** يطبّق الترتيب: 'field' أو {field:'asc'|'desc'} أو مصفوفة منهما */
function applyOrder(q, order) {
  const arr = Array.isArray(order) ? order : order ? [order] : [];
  for (const o of arr) {
    if (typeof o === 'string') {
      q = q.order(o, { ascending: true, nullsFirst: false });
      continue;
    }
    for (const [k, dir] of Object.entries(o)) {
      q = q.order(k, { ascending: dir !== 'desc', nullsFirst: false });
    }
  }
  return q;
}

/* ============================================================
   دوال الاستعلام الموحّدة
   ============================================================ */

/** جلب عدة صفوف: list('services', { where, order, limit, select }) */
export async function list(table, { where, order, limit, select = '*' } = {}) {
  let q = supabase().from(table).select(select);
  q = applyWhere(q, where);
  q = applyOrder(q, order);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data || [];
}

/** جلب صف واحد (أو null): one('services', { where: { slug } }) */
export async function one(table, { where, select = '*', order } = {}) {
  let q = supabase().from(table).select(select);
  q = applyWhere(q, where);
  q = applyOrder(q, order);
  const { data, error } = await q.limit(1);
  if (error) throw new Error(`[${table}] ${error.message}`);
  return data?.[0] ?? null;
}

/** عدّ الصفوف: count('bookings', { where: { status: 'pending' } }) */
export async function count(table, { where } = {}) {
  let q = supabase().from(table).select('*', { count: 'exact', head: true });
  q = applyWhere(q, where);
  const { count: c, error } = await q;
  if (error) throw new Error(`[${table}] ${error.message}`);
  return c || 0;
}

/** إدراج صف أو مصفوفة صفوف وإرجاعه */
export async function insert(table, data) {
  const { data: rows, error } = await supabase().from(table).insert(data).select();
  if (error) throw new Error(`[${table}] ${error.message}`);
  return Array.isArray(data) ? rows : (rows?.[0] ?? null);
}

/** تحديث صف بالمعرّف وإرجاعه */
export async function update(table, id, data) {
  const { data: rows, error } = await supabase()
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  if (error) throw new Error(`[${table}] ${error.message}`);
  return rows?.[0] ?? null;
}

/** تحديث كل الصفوف المطابقة للشرط */
export async function updateWhere(table, where, data) {
  let q = supabase().from(table).update(data);
  q = applyWhere(q, where);
  const { error } = await q;
  if (error) throw new Error(`[${table}] ${error.message}`);
}

/** حذف صف بالمعرّف */
export async function remove(table, id) {
  const { error } = await supabase().from(table).delete().eq('id', id);
  if (error) throw new Error(`[${table}] ${error.message}`);
}

/** حذف كل الصفوف المطابقة للشرط (شرط فارغ = حذف الكل) */
export async function removeWhere(table, where = {}) {
  let q = supabase().from(table).delete();
  q = applyWhere(q, where);
  const { error } = await q;
  if (error) throw new Error(`[${table}] ${error.message}`);
}

/** إدراج أو تحديث: upsert('settings', { key, value }, 'key') */
export async function upsert(table, data, onConflict) {
  const { error } = await supabase()
    .from(table)
    .upsert(data, onConflict ? { onConflict } : undefined);
  if (error) throw new Error(`[${table}] ${error.message}`);
  return true;
}
