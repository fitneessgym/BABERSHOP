# 📤 رفع المشروع على GitHub (خطوة بخطوة)

اختر الطريقة الأسهل لك: **الأولى بالواجهة الرسومية (موصى بها)** أو **الثانية بالأوامر**.

---

# 🖱️ الطريقة الأولى: GitHub Desktop (الأسهل — بدون أوامر)

## ١) حمّل البرنامج
- [GitHub Desktop](https://desktop.github.com) → حمّله وثبّته.

## ٢) سجّل الدخول
- افتح البرنامج → **Sign in to GitHub.com** → سجّل بحسابك (أو **Create an account** من [github.com](https://github.com) أولاً).

## ٣) أنشئ المستودع محلياً
1. فك ضغط `barbershop-system.zip` على جهازك (مثلاً على سطح المكتب) → مجلد اسمه `barbershop`.
2. في GitHub Desktop: **File → Add Local Repository** → **Choose…** → اختر مجلد `barbershop`.
3. إن ظهرت رسالة "not a git repository" اضغط **Create a repository**:
   - **Name:** `barbershop`
   - **Description:** نظام صالون حلاقة
   - ✅ فعّل **Initialize with a README** إن طُلب
   - **Git ignore:** None (موجود مسبقاً)
   - اضغط **Create Repository**

## ٤) أول حفظ (Commit)
1. ستظهر كل الملفات في تبويب **Changes** على اليسار.
2. في أسفل اليسار اكتب في **Summary**: `first commit`
3. اضغط **Commit to main**.

## ٥) ارفعه إلى GitHub
1. اضغط **Publish repository** (أعلى اليمين).
2. الاسم: `barbershop`
3. ⚠️ **فعّل خيار "Keep this code private"** (مهم — بياناتك تبقى خاصة)
4. اضغط **Publish Repository**.

## ٦) تأكيد
افتح [github.com](https://github.com) → سترى المستودع `barbershop` ✅

### تحديث المشروع لاحقاً
عدّل أي ملف → GitHub Desktop يعرض التغييرات → اكتب وصفاً → **Commit to main** → **Push origin**.

---

# ⌨️ الطريقة الثانية: بالأوامر (للمتقدمين)

```bash
# 1) فك الضغط ثم ادخل المجلد
cd barbershop

# 2) تهيئة Git
git init
git branch -M main

# 3) ربط المستودع (أنشئه فارغاً على github.com أولاً: New repository → barbershop → Private → Create)
git remote add origin https://github.com/USERNAME/barbershop.git

# 4) إضافة الملفات وحفظها
git add .
git commit -m "Barbershop system - first commit"

# 5) الرفع
git push -u origin main
```

> عند طلب كلمة المرور: استخدم **Personal Access Token** وليس كلمة سر الحساب
> (GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → فعّل `repo`).

---

# ⚠️ تحذيرات مهمة قبل الرفع

1. **اجعل المستودع Private** حتى لا يطلع أحد على إعداداتك.
2. ملف `.env` **لن يُرفع** (موجود في `.gitignore`) — هذا صحيح ومطلوب. أنشئه على السيرفر أو استخدم متغيرات البيئة في Vercel.
3. لا ترفع مجلد `node_modules` أو قاعدة البيانات — كلها مستثناة تلقائياً.
4. الصور مرفوعة ضمن `public/uploads` ✅ (مهمة لعمل الموقع مباشرة).

---

# ➡️ الخطوة التالية: النشر على Vercel

1. اذهب إلى [vercel.com](https://vercel.com) → **Sign up with GitHub** واختر **Authorize**.
2. **Add New → Project** → ستظهر قائمة مستودعاتك → اختر `barbershop` → **Import**.
3. لا تغيّر إعدادات البناء (ملف `vercel.json` يتكفل بكل شيء).
4. من تبويب **Storage** أنشئ قاعدة **Postgres (Neon)** مجانية (تُضاف تلقائياً).
5. في **Environment Variables** أضف:
   | الاسم | القيمة |
   |---|---|
   | `SESSION_SECRET` | نص طويل عشوائي |
   | `ADMIN_EMAIL` | بريدك للدخول |
   | `ADMIN_PASSWORD` | كلمة سر قوية |
   | `CRON_SECRET` | نص سري للتذكيرات |
6. **Deploy** → خلال دقيقتين يصبح الموقع على رابط مجاني `https://barbershop-xxxx.vercel.app`
7. عبّئ البيانات التجريبية مرة واحدة (التفاصيل في `DEPLOY.md` قسم ٤).

---

# ❓ مشاكل شائعة

**"Permission denied" عند الرفع**
→ استخدم Personal Access Token بدل كلمة المرور (الخطوة أعلاه).

**المستودع ظهر فارغاً بعد الرفع**
→ تأكد أنك نفّذت `git add .` قبل `git commit`، وأنك داخل مجلد `barbershop` الصحيح.

**Vercel لا يجد المستودع**
→ عند ربط Vercel بـ GitHub فعّل **All repositories** أو فعّل الوصول لمستودع `barbershop` تحديداً.

**`! [rejected] main -> main (non-fast-forward)` + `failed to push some refs`**
→ هذا أكثر خطأ شائع: المستودع على GitHub أُنشئ وفيه ملف README (أو .gitignore) مسبقاً، بينما مشروعك المحلي لا يعرف عنه — فيرفض Git الرفع.
الحل الأسرع (إن كان المستودع جديداً وفارغاً تقريباً):
```bash
git push -u --force origin main
```
أو الدمج أولاً ثم الرفع:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```
أو الحل الأنظف: احذف المستودع من GitHub وأنشئه من جديد **فارغاً تماماً** (بدون README وبدون .gitignore وبدون License) ثم:
```bash
git remote set-url origin https://github.com/USERNAME/barbershop.git
git push -u origin main
```

**`There is no tracking information for the current branch`**
→ الفرع المحلي غير مربوط بالفرع البعيد. نفّذ:
```bash
git push -u origin main
```
(حرف `-u` هو الذي يربط الفرع — لا تنسه.)

**البناء فشل على Vercel**
→ تأكد أنك أضفت `DATABASE_URL` (من Neon/Postgres) قبل أول Deploy، ثم **Redeploy**.
