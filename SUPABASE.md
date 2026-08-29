# 🗄️ الربط مع Supabase (الطريقة الوحيدة للمشروع)

المشروع يتصل **حصرياً** بخدمة [Supabase](https://supabase.com) عبر مكتبة `@supabase/supabase-js` الرسمية:

- **قاعدة البيانات:** PostgreSQL (15 جدولاً تُنشأ بملف SQL واحد)
- **تخزين الصور:** Supabase Storage (حاوية عامة باسم `uploads`)
- لا يوجد Prisma ولا SQLite ولا أي قاعدة بيانات أخرى — كل شيء في Supabase.

الخطة المجانية تكفي: 500 ميجا قاعدة بيانات + 1 جيجا تخزين ملفات.

---

## ١) أنشئ مشروع Supabase

1. ادخل [supabase.com](https://supabase.com) ← **Start your project** ← سجّل بحساب GitHub.
2. **New project**
   - **Name:** `al-salon`
   - **Database Password:** اختر كلمة قوية **واحفظها فوراً** (لا تظهر مرة أخرى)
   - **Region:** الأقرب لك (مثلاً `Central EU (Frankfurt)`)
   - اضغط **Create new project** ← انتظر دقيقتين.

---

## ٢) أنشئ الجداول (خطوة واحدة)

1. من القائمة الجانبية للمشروع: **SQL Editor** ← **New query**
2. افتح ملف `supabase/schema.sql` من المشروع، انسخ محتواه **كاملاً** والصقه هناك
3. اضغط **Run** ✅

تم إنشاء كل الجداول + الفهارس + تفعيل الحماية (RLS) + حاوية تخزين الصور.
> يمكنك إعادة تشغيله بأمان لاحقاً — لن يحذف أي بيانات موجودة.

---

## ٣) انسخ مفاتيح الاتصال

من **⚙️ Project Settings** ← **API** انسخ:

| المتغير | من أين | ملاحظة |
|---|---|---|
| `SUPABASE_URL` | **Project URL** | يبدأ بـ `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Service role key (secret)** | ⚠️ سري جداً — للخادم فقط ولا يظهر أبداً في المتصفح |

---

## ٤) التشغيل محلياً على جهازك

```bash
cd BABERSHOP
npm install
cp .env.example .env
```

عدّل ملف `.env` واملأ القيم:

```env
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
ADMIN_EMAIL="admin@salon.com"
ADMIN_PASSWORD="كلمة-سر-قوية"
SESSION_SECRET="نص-طويل-عشوائي"
```

ثم عبّئ البيانات التجريبية وشغّل:

```bash
npm run db:seed
npm run dev
```

افتح `http://localhost:3000` ولوحة التحكم على `/admin`
(البريد وكلمة المرور = اللذين وضعتهما في `.env`).

---

## ٥) النشر على Vercel

من صفحة المشروع في Vercel ← **Settings ← Environment Variables** أضف:

| الاسم | القيمة |
|---|---|
| `SUPABASE_URL` | رابط المشروع |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة السري |
| `ADMIN_EMAIL` | بريد المدير |
| `ADMIN_PASSWORD` | كلمة سر المدير |
| `SESSION_SECRET` | نص طويل عشوائي |
| `CRON_SECRET` | نص عشوائي (حماية رابط التذكيرات) |

ثم **Deployments ← Redeploy**. لا حاجة لأي إعداد إضافي — البناء بسيط: `next build`.

لعبء البيانات التجريبية بعد النشر: لوحة التحكم ← الإعدادات ← زر «إعادة البيانات التجريبية».

---

## 🔒 ملاحظات أمنية

- مفتاح **service_role** يتجاوز حماية الصفوف (RLS) — لهذا تُفعَّل RLS على كل الجداول
  بلا أي سياسات عامة، فيبقى الوصول المباشر بالمفتاح العام (anon) ممنوعاً،
  وكل القراءة والكتابة تجري عبر خادم الموقع فقط.
- كل استعلامات التطبيق تجري على الخادم (Server Components و API Routes) —
  المفتاح السري لا يُرسل للمتصفح أبداً.
- كلمات مرور الإدارة مشفّرة (scrypt) داخل قاعدة البيانات.

---

## 🧰 أوامر مفيدة

| الأمر | الوظيفة |
|---|---|
| `npm run db:seed` | تفريغ الجداول وتعبئة بيانات تجريبية كاملة |
| `node scripts/reset-password.mjs 123456` | إعادة تعيين كلمة مرور المدير |
| `node scripts/reset-password.mjs 123456 admin@salon.com` | إعادة التعيين مع تغيير البريد |

---

## 🩹 حل المشاكل الشائعة

| المشكلة | الحل |
|---|---|
| ⚠️ اتصال Supabase غير مضبوط | `.env` ناقص — أضف `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY` ثم أعد التشغيل |
| `relation "services" does not exist` | لم تنفّذ `schema.sql` — عد إلى الخطوة ٢ |
| `new row violates row-level security` | أنت تستخدم المفتاح العام (anon) بدل مفتاح الخدمة — راجع الخطوة ٣ |
| فشل رفع الصور | تأكد أن حاوية `uploads` موجودة: Storage ← New bucket ← الاسم `uploads` ← Public ✓ |
| نسيت كلمة مرور المدير | `node scripts/reset-password.mjs كلمة_جديدة` |
