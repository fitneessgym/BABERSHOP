# إصلاح مشكلة الإضافة والحفظ

إذا كانت كل أزرار الإضافة/الحفظ تفشل على Vercel، يجب ضبط متغيرات البيئة التالية في **Vercel → Settings → Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (مفتاح `service_role` السري من Supabase → Project Settings → API)
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CRON_SECRET`

بعد إضافة/تعديل المتغيرات اختر **Redeploy**.

> لا تضع `SUPABASE_SERVICE_ROLE_KEY` داخل أي ملف يبدأ بـ `NEXT_PUBLIC_` ولا ترسل قيمته لأي شخص.

## فحص سريع

1. سجّل دخول لوحة الإدارة.
2. جرّب إضافة خدمة.
3. جرّب تعديل الخدمة.
4. جرّب إضافة منتج/حلاق.
5. إذا ظهرت رسالة `اتصال قاعدة البيانات غير مضبوط على Vercel`، فالمشكلة في Environment Variables وليست في زر الإضافة.
