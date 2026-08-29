-- ============================================================
--  مخطط قاعدة بيانات Supabase — نظام صالون الحلاقة
-- ============================================================
--  طريقة التشغيل:
--  1) افتح مشروعك في supabase.com
--  2) من القائمة الجانبية: SQL Editor ← New query
--  3) الصق محتوى هذا الملف كاملاً واضغط Run
--
--  ملاحظة: يمكنك إعادة تشغيله بأمان — لن يحذف بيانات موجودة.
-- ============================================================

-- ---------- 1) الإعدادات ----------
create table if not exists public.settings (
  "key"   text primary key,
  "value" text not null default ''
);

-- ---------- 2) حسابات الإدارة ----------
create table if not exists public.admins (
  "id"           text primary key default gen_random_uuid()::text,
  "email"        text not null unique,
  "passwordHash" text not null,
  "name"         text not null default 'المدير',
  "role"         text not null default 'admin',      -- owner | admin | staff
  "active"       boolean not null default true,
  "lastLogin"    timestamptz,
  "createdAt"    timestamptz not null default now()
);

-- ---------- 3) الخدمات ----------
create table if not exists public.services (
  "id"          text primary key default gen_random_uuid()::text,
  "slug"        text not null unique,
  "nameAr"      text not null,
  "nameEn"      text not null,
  "descAr"      text not null default '',
  "descEn"      text not null default '',
  "price"       double precision not null default 0,
  "durationMin" int not null default 30,
  "icon"        text not null default 'scissors',
  "image"       text not null default '',
  "category"    text not null default 'عام',
  "active"      boolean not null default true,
  "sort"        int not null default 0,
  "createdAt"   timestamptz not null default now()
);

-- ---------- 4) الحلاقون ----------
create table if not exists public.barbers (
  "id"         text primary key default gen_random_uuid()::text,
  "slug"       text not null unique,
  "nameAr"     text not null,
  "nameEn"     text not null,
  "roleAr"     text not null default 'حلاق محترف',
  "roleEn"     text not null default 'Professional Barber',
  "bioAr"      text not null default '',
  "bioEn"      text not null default '',
  "photo"      text not null default '',
  "rating"     double precision not null default 5,
  "experience" int not null default 5,
  "active"     boolean not null default true,
  "sort"       int not null default 0,
  "schedule"   text not null default '',
  "createdAt"  timestamptz not null default now()
);

-- ---------- 5) ربط الحلاقين بالخدمات ----------
create table if not exists public.barber_services (
  "id"        text primary key default gen_random_uuid()::text,
  "barberId"  text not null references public.barbers("id") on delete cascade,
  "serviceId" text not null references public.services("id") on delete cascade
);
create index if not exists barber_services_barber_idx on public.barber_services ("barberId");
create index if not exists barber_services_service_idx on public.barber_services ("serviceId");

-- ---------- 6) أوقات الإجازة ----------
create table if not exists public.time_off (
  "id"       text primary key default gen_random_uuid()::text,
  "barberId" text references public.barbers("id") on delete cascade,
  "date"     text not null,             -- YYYY-MM-DD
  "time"     text not null default '',  -- فارغ = اليوم كله
  "reason"   text not null default ''
);
create index if not exists time_off_barber_idx on public.time_off ("barberId");
create index if not exists time_off_date_idx on public.time_off ("date");

-- ---------- 7) الحجوزات ----------
create table if not exists public.bookings (
  "id"           text primary key default gen_random_uuid()::text,
  "code"         text not null unique,
  "customerName" text not null,
  "phone"        text not null,
  "email"        text not null default '',
  "serviceId"    text not null references public.services("id"),
  "barberId"     text references public.barbers("id"),
  "barberName"   text not null default '',
  "serviceName"  text not null default '',
  "date"         text not null,          -- YYYY-MM-DD
  "time"         text not null,          -- HH:MM
  "endTime"      text not null default '',
  "durationMin"  int not null default 30,
  "price"        double precision not null default 0,
  "status"       text not null default 'pending',  -- pending | confirmed | completed | cancelled
  "notes"        text not null default '',
  "source"       text not null default 'website',
  "createdAt"    timestamptz not null default now()
);
create index if not exists bookings_date_idx on public.bookings ("date");
create index if not exists bookings_phone_idx on public.bookings ("phone");
create index if not exists bookings_barber_idx on public.bookings ("barberId");

-- ---------- 8) المنتجات ----------
create table if not exists public.products (
  "id"             text primary key default gen_random_uuid()::text,
  "slug"           text not null unique,
  "nameAr"         text not null,
  "nameEn"         text not null,
  "descAr"         text not null default '',
  "descEn"         text not null default '',
  "price"          double precision not null default 0,
  "compareAtPrice" double precision not null default 0,
  "image"          text not null default '',
  "categoryAr"     text not null default 'عام',
  "categoryEn"     text not null default 'General',
  "brand"          text not null default '',
  "size"           text not null default '',
  "stock"          int not null default 0,
  "featured"       boolean not null default false,
  "active"         boolean not null default true,
  "sort"           int not null default 0,
  "createdAt"      timestamptz not null default now()
);

-- ---------- 9) الطلبات ----------
create table if not exists public.orders (
  "id"           text primary key default gen_random_uuid()::text,
  "code"         text not null unique,
  "customerName" text not null,
  "phone"        text not null,
  "email"        text not null default '',
  "address"      text not null default '',
  "city"         text not null default '',
  "notes"        text not null default '',
  "subtotal"     double precision not null default 0,
  "shipping"     double precision not null default 0,
  "discount"     double precision not null default 0,
  "total"        double precision not null default 0,
  "coupon"       text not null default '',
  "payment"      text not null default 'cash',   -- cash | card | online
  "status"       text not null default 'new',    -- new | processing | shipped | delivered | cancelled
  "createdAt"    timestamptz not null default now()
);
create index if not exists orders_status_idx on public.orders ("status");

-- ---------- 10) عناصر الطلبات ----------
create table if not exists public.order_items (
  "id"        text primary key default gen_random_uuid()::text,
  "orderId"   text not null references public.orders("id") on delete cascade,
  "productId" text references public.products("id"),
  "nameAr"    text not null,
  "nameEn"    text not null,
  "price"     double precision not null default 0,
  "qty"       int not null default 1,
  "image"     text not null default ''
);
create index if not exists order_items_order_idx on public.order_items ("orderId");

-- ---------- 11) أكواد الخصم ----------
create table if not exists public.coupons (
  "id"       text primary key default gen_random_uuid()::text,
  "code"     text not null unique,
  "type"     text not null default 'percent',  -- percent | fixed
  "value"    double precision not null default 0,
  "minTotal" double precision not null default 0,
  "active"   boolean not null default true,
  "uses"     int not null default 0,
  "createdAt" timestamptz not null default now()
);

-- ---------- 12) معرض الصور ----------
create table if not exists public.gallery_images (
  "id"        text primary key default gen_random_uuid()::text,
  "url"       text not null,
  "captionAr" text not null default '',
  "captionEn" text not null default '',
  "sort"      int not null default 0,
  "active"    boolean not null default true,
  "createdAt" timestamptz not null default now()
);

-- ---------- 13) التقييمات ----------
create table if not exists public.reviews (
  "id"         text primary key default gen_random_uuid()::text,
  "name"       text not null,
  "rating"     int not null default 5,
  "commentAr"  text not null default '',
  "commentEn"  text not null default '',
  "approved"   boolean not null default false,
  "createdAt"  timestamptz not null default now()
);

-- ---------- 14) رسائل التواصل ----------
create table if not exists public.messages (
  "id"        text primary key default gen_random_uuid()::text,
  "name"      text not null,
  "phone"     text not null default '',
  "email"     text not null default '',
  "message"   text not null default '',
  "read"      boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- ---------- 15) الإشعارات ----------
create table if not exists public.notifications (
  "id"          text primary key default gen_random_uuid()::text,
  "type"        text not null default 'custom',
  "channel"     text not null default 'whatsapp',  -- whatsapp | sms | email | inapp
  "to"          text not null default '',
  "title"       text not null default '',
  "body"        text not null default '',
  "status"      text not null default 'pending',   -- pending | sent | skipped | failed
  "error"       text not null default '',
  "refId"       text not null default '',
  "scheduledAt" timestamptz,
  "sentAt"      timestamptz,
  "read"        boolean not null default false,
  "createdAt"   timestamptz not null default now()
);
create index if not exists notifications_status_idx on public.notifications ("status");
create index if not exists notifications_scheduled_idx on public.notifications ("scheduledAt");

-- ============================================================
--  الأمان: تفعيل RLS على كل الجداول
--  التطبيق يقرأ ويكتب عبر الخادم باستخدام مفتاح الخدمة
--  (SUPABASE_SERVICE_ROLE_KEY) الذي يتجاوز RLS،
--  لذلك لا سياسات عامة — الوصول المباشر بالمفتاح العام ممنوع.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'settings','admins','services','barbers','barber_services','time_off',
    'bookings','products','orders','order_items','coupons',
    'gallery_images','reviews','messages','notifications'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ============================================================
--  حاوية تخزين الصور (Supabase Storage)
--  إن فشل الإنشاء هنا، أنشئها يدوياً: Storage ← New bucket
--  الاسم: uploads ← Public: ✓
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
