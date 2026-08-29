# 🚀 دليل النشر — نظام صالون الحلاقة

> 💠 **قاعدة البيانات والصور تعمل حصرياً عبر Supabase** — ابدأ بدليل **`SUPABASE.md`** أولاً
> (إنشاء المشروع + تنفيذ `schema.sql` + نسخ المفاتيح) ثم عد هنا للنشر.

**خطتك: Vercel + Supabase مجاناً** (بدون دومين) — تابع الخطوات بالترتيب، كل ما تحتاجه مجاني.

---

# ⭐ الطريقة الأولى: Vercel (المختارة)

## ١) ارفع المشروع إلى GitHub

1. أنشئ حساباً على [github.com](https://github.com) إن لم يكن لديك.
2. أنشئ مستودعاً جديداً **Private** باسم `barbershop`.
3. على جهازك، داخل مجلد المشروع:
```bash
git init
git add .
git commit -m "Barbershop system"
git branch -M main
git remote add origin https://github.com/USERNAME/barbershop.git
git push -u origin main
```
> بديل أسهل: حمّل [GitHub Desktop](https://desktop.github.com) وارفع المجلد بواجهة رسومية.

## ٢) جهّز Supabase (مرة واحدة)

اتبع الخطوات ١–٣ في **`SUPABASE.md`**:
1. أنشئ مشروع Supabase مجاني
2. نفّذ `supabase/schema.sql` من **SQL Editor**
3. انسخ `SUPABASE_URL` و `SUPABASE_SERVICE_ROLE_KEY`

## ٣) أنشئ المشروع على Vercel

1. ادخل [vercel.com](https://vercel.com) → **Sign up with GitHub**.
2. **Add New → Project** → اختر مستودع `barbershop` → **Import**.
3. في **Environment Variables** أضف:
   | الاسم | القيمة |
   |---|---|
   | `SUPABASE_URL` | رابط مشروع Supabase (`https://xxxx.supabase.co`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | مفتاح الخدمة السري من Supabase |
   | `SESSION_SECRET` | نص طويل عشوائي مثل `Salon-2026-Xy7Qm9-VerySecret` |
   | `ADMIN_EMAIL` | بريدك للدخول للوحة التحكم |
   | `ADMIN_PASSWORD` | كلمة سر قوية |
   | `CRON_SECRET` | نص سري عشوائي مثل `cron-8823-salon` |
4. اضغط **Deploy** وانتظر دقيقتين → تحصل على رابط مثل:
   ```
   https://barbershop-xxxx.vercel.app
   ```
   لوحة التحكم: `https://barbershop-xxxx.vercel.app/admin`

## ٤) عبّئ البيانات التجريبية (مرة واحدة)

بعد أول نشر، على جهازك (داخل مجلد المشروع):
```bash
cd barbershop
npm install
# أنشئ .env بنفس متغيرات Supabase أعلاه (انظر .env.example)
npm run db:seed
```
هذا ينشئ: ١٠ خدمات، ٤ حلاقين، ٨ منتجات، حجوزات وطلبات تجريبية + حساب المدير.
> أو بضغطة زر: لوحة التحكم ← الإعدادات ← «إعادة البيانات التجريبية».

## ٥) فعّل التذكيرات التلقائية

ملف `vercel.json` يحتوي مسبقاً على:
```json
"crons": [{ "path": "/api/cron/reminders", "schedule": "0 9 * * *" }]
```
أي: يُشغَّل **مرة يومياً الساعة ٩ صباحاً** ويرسل تذكيرات المواعيد.
> الخطة المجانية في Vercel تسمح بـ cron يومي واحد فقط — هذا كافٍ. أو شغّل الزر اليدوي من لوحة التحكم: الإشعارات ← «تشغيل التذكيرات المجدولة».

## ٦) رفع الصور — يعمل تلقائياً ✅

الصور التي ترفعها من لوحة التحكم تُحفظ في **Supabase Storage** (حاوية `uploads` العامة التي أنشأها `schema.sql`) — دائمة ولا تختفي مع إعادة النشر.

> الصور الأصلية (`/uploads/salon-1.jpg` … وصور المنتجات) مرفوعة داخل المستودع، فهي تعمل مباشرة ✅

## ٧) التحديثات لاحقاً
عدّل ملفاتك ثم:
```bash
git add . && git commit -m "update" && git push
```
Vercel يعيد النشر تلقائياً خلال دقيقة.

---

# الطريقة الثانية: سيرفر VPS (للتحكم الكامل)

مناسب إن أردت دومينك الخاص. (DigitalOcean / Hostinger / Hetzner — من ~$5 شهرياً)

```bash
# على السيرفر Ubuntu 22.04
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git
git clone https://github.com/USERNAME/barbershop.git && cd barbershop

cat > .env <<'ENV'
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="مفتاح-الخدمة"
SESSION_SECRET="نص-طويل-وسري"
ADMIN_EMAIL="admin@alsalon.com"
ADMIN_PASSWORD="كلمة-سر-قوية"
CRON_SECRET="نص-سري"
ENV

npm install
npm run db:seed
npm run build
sudo npm install -g pm2
pm2 start ecosystem.config.js && pm2 save && pm2 startup
```

**ربط دومين + SSL:**
```bash
sudo nano /etc/nginx/sites-available/salon
```
```nginx
server {
    listen 80;
    server_name salon.com www.salon.com;
    client_max_body_size 20M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/salon /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d salon.com -d www.salon.com
```

**التذكيرات كل ساعة:**
```bash
crontab -e
0 * * * * curl -s "https://salon.com/api/cron/reminders?key=النص_السري" > /dev/null
```

**نسخة احتياطية:** من لوحة Supabase ← Database ← Backups (أو تصدير CSV من Table Editor).

---

# الطريقة الثالثة: استضافة مشتركة cPanel (إن كانت تدعم Node.js)

1. ارفع ملفات المشروع (بدون `node_modules`) إلى `~/barbershop`.
2. من cPanel: **Setup Node.js App → Create Application**
   - Node version: 20 · Application root: `barbershop`
   - Startup file: `node_modules/next/dist/bin/next`
   - Startup command: `next start -p 3000`
3. أنشئ ملف `.env` بنفس متغيرات Supabase أعلاه.
4. من **Terminal**:
   ```bash
   cd ~/barbershop && npm install && npm run db:seed && npm run build
   ```
5. **Restart** التطبيق.

---

# الطريقة الرابعة: داخل الصالون فقط (شبكة محلية)

> يتطلب اتصالاً بالإنترنت للوصول إلى Supabase (قاعدة البيانات سحابية).

```bash
cd barbershop
npm install
cp .env.example .env   # املأ بيانات Supabase
npm run db:seed
npm run dev
```
افتحه من أي جهاز على نفس الشبكة: `http://192.168.1.X:3000` (بدّل X بـ IP الجهاز).

---

# ✅ قائمة فحص قبل النشر الفعلي

- [ ] نفّذت `supabase/schema.sql` في SQL Editor
- [ ] غيّرت `ADMIN_PASSWORD` و `SESSION_SECRET` (وبعد النشر غيّر كلمة المرور من الإعدادات ← الحساب والأمان)
- [ ] دقّقت رقم الواتساب والهاتف (الإعدادات ← معلومات التواصل)
- [ ] حدّثت ساعات العمل والعنوان
- [ ] راجعت أسعار الخدمات والمنتجات
- [ ] رفعت شعار الصالون
- [ ] ضبطت مزوّد إشعارات واتساب (أو تركت "رابط مباشر")
- [ ] جرّبت حجزاً تجريبياً وتأكدت من وصول الإشعار
- [ ] خذت نسخة احتياطية من قاعدة البيانات (Supabase ← Backups)

---

# 📦 ملفات النشر المرفقة

| الملف | الوظيفة |
|---|---|
| `vercel.json` | cron للتذكيرات (يعمل تلقائياً) |
| `supabase/schema.sql` | إنشاء كل جداول قاعدة البيانات + حاوية الصور |
| `supabase/seed.mjs` | البيانات التجريبية |
| `ecosystem.config.js` | تشغيل عبر PM2 على السيرفر |
| `.env.example` | نموذج متغيرات البيئة |
| `start.sh` | تشغيل المشروع (يثبّت الحزم تلقائياً إن نقصت) |
