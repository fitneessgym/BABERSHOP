# 🗄️ ربط المشروع بقاعدة بيانات Supabase (مجانية)

Supabase = قاعدة بيانات **PostgreSQL** مجانية (500 ميجا) + لوحة تحكم سهلة لعرض البيانات.
هذا الملف يشرح الخطوات بالتفصيل — لا تحتاج أي خبرة مسبقة.

---

## ١) أنشئ مشروع Supabase

1. ادخل [supabase.com](https://supabase.com) ← **Start your project** ← سجّل بحساب GitHub.
2. **New project**
   - **Name:** `al-ayham-salon`
   - **Database Password:** اختر كلمة قوية **واحفظها فوراً** في مكان آمن (تحتاجها لاحقاً ولا تظهر مرة أخرى)
   - **Region:** الأقرب لك (مثلاً `Central EU (Frankfurt)` أو `Middle East (Dubai)` إن وُجد)
   - اضغط **Create new project** ← انتظر دقيقتين حتى ينتهي الإنشاء.

---

## ٢) انسخ روابط الاتصال

من لوحة مشروعك: **⚙️ Project Settings** (أسفل اليسار) ← **Database** ← نزل لـ **Connection string**

ستجد طريقتين — انسخ **URI** لكلتيهما:

### أ) الرابط المجمع (Pooler) — للتشغيل العادي
- اختر تبويب **Connection pooling** (أو "Session pooler" / "Transaction pooler")
- **Port:** `6543`
- الشكل:
```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```
← هذا هو **`DATABASE_URL`**

### ب) الرابط المباشر — للهجرات (إنشاء الجداول)
- تبويب **Connection string** / **Direct connection**
- **Port:** `5432`
- الشكل:
```
postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require
```
← هذا هو **`DIRECT_URL`**

> 🔑 بدّل `[YOUR-PASSWORD]` بكلمة مرور قاعدة البيانات التي حفظتها.
> ⚠️ إن كانت كلمة المرور فيها رموز مثل `@ # $ % &` يجب **ترميزها** (مثلاً `@` تصبح `%40`) — أو الأفضل: غيّر كلمة المرور لحروف وأرقام فقط من **Database Settings ← Reset password**.

---

## ٣) أضف الروابط في Vercel

من صفحة مشروعك في Vercel ← **Settings ← Environment Variables** أضف:

| الاسم | القيمة |
|---|---|
| `DATABASE_URL` | رابط الـ Pooler (port 6543) |
| `DIRECT_URL` | الرابط المباشر (port 5432) |
| `ADMIN_EMAIL` | `shakarnah2004@gmail.com` |
| `ADMIN_PASSWORD` | كلمة سرك |
| `SESSION_SECRET` | أي نص طويل عشوائي |
| `CRON_SECRET` | أي نص عشوائي |

ثم: **Deployments** ← **Redeploy** (أو ادفع commit جديد).

✅ سكريبت البناء سيتعرف على `DIRECT_URL` تلقائياً ويستخدمه لإنشاء الجداول، وعلى `DATABASE_URL` للتشغيل — **لا تحتاج أي إعداد إضافي**.

---

## ٤) عبّئ البيانات التجريبية (مرة واحدة)

بعد أول نشر ناجح، على جهازك داخل مجلد المشروع:

**Windows PowerShell:**
```powershell
cd barbershop
npm install
$env:DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
$env:DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"
npx prisma generate --schema=prisma/schema.supabase.prisma
node prisma/seed.mjs
```

**Mac / Linux:**
```bash
cd barbershop
npm install
export DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
export DIRECT_URL="postgresql://postgres.xxxx:PASSWORD@...pooler.supabase.com:5432/postgres?sslmode=require"
npx prisma generate --schema=prisma/schema.supabase.prisma
node prisma/seed.mjs
```

> 💡 **طريقة أسهل (بدون أوامر):** بعد أول نشر، سجّل الدخول للوحة التحكم ثم:
> **الإعدادات ← زر «إعادة البيانات التجريبية»** وستُعبّأ البيانات تلقائياً ✅

---

## ٥) تأكد من نجاح كل شيء

من لوحة Supabase ← **Table Editor** يجب أن تظهر هذه الجداول:
```
Admin · Service · Barber · BarberService · TimeOff
Booking · Product · Order · OrderItem
Coupon · GalleryImage · Review · Setting · Message · Notification
```

ثم افتح موقعك:
- الرئيسية تعرض الخدمات والحلاقين والمنتجات ✅
- `/admin/login` ← سجل الدخول ببريدك وكلمة سرك ✅

---

## 🧰 أوامر مفيدة

```bash
# فتح Prisma Studio لعرض/تعديل البيانات بصرياً
DATABASE_URL="..." npx prisma studio --schema=prisma/schema.supabase.prisma

# إعادة إنشاء الجداول من الصفر (يمسح البيانات!)
DATABASE_URL="..." DIRECT_URL="..." npx prisma db push --schema=prisma/schema.supabase.prisma --force-reset

# فحص صحة المخطط
npx prisma validate --schema=prisma/schema.supabase.prisma
```

---

## ⚠️ ملاحظات مهمة عن الخطة المجانية

1. **الإيقاف المؤقت:** المشروع المجاني يُوقف تلقائياً بعد **٧ أيام بدون استخدام** — لإعادة تشغيله: افتح Supabase ← **Restore project** (مجاني ولا تُفقد البيانات).
2. **النسخ الاحتياطي:** الخطة المجانية لا تشمل نسخاً تلقائياً — صدّر بياناتك دورياً من **Database → Backups** أو عبر `prisma studio`.
3. **SSL إلزامي:** تأكد أن الرابط ينتهي بـ `?sslmode=require`.
4. **Pooler + Prisma:** استخدم الرابط المجمع (6543) للتشغيل والمباشر (5432) للهجرات — هذا بالضبط ما يفعله المشروع تلقائياً.

---

## ❓ حل المشاكل الشائعة

| الخطأ | السبب والحل |
|---|---|
| `Can't reach database server` | الرابط خطأ أو كلمة المرور غير صحيحة → أعد نسخها من Supabase |
| `prepared statement "s0" already exists` | استخدم رابط الـ Pooler (6543) مع `?pgbouncer=true` في `DATABASE_URL` |
| `SSL connection required` | أضف `?sslmode=require` في نهاية الرابط |
| `password authentication failed` | كلمة المرور فيها رموز خاصة → بدّلها من **Database Settings** أو رمّزها |
| `Environment variable not found: DATABASE_URL` | المتغير غير مضاف في Vercel → أضفه ثم **Redeploy** |
| الجداول لا تُنشأ | تأكد أن `DIRECT_URL` مضاف (هو المستخدم للهجرات) |
