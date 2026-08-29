/**
 * إعادة تعيين كلمة مرور المدير (في حال نسيانها) — Supabase
 *
 * الاستخدام:
 *   node scripts/reset-password.mjs 123456
 *   node scripts/reset-password.mjs 123456 admin@salon.com
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// قراءة .env يدوياً
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('❌ أضف SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env أولاً');
  process.exit(1);
}
const supabase = createClient(url, key);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const newPassword = process.argv[2];
const newEmail = process.argv[3];

if (!newPassword || newPassword.length < 4) {
  console.log('❌ الاستخدام: node scripts/reset-password.mjs كلمة_السر_الجديدة [البريد]');
  console.log('   مثال: node scripts/reset-password.mjs 123456 admin@salon.com');
  process.exit(1);
}

const { data: admins, error } = await supabase.from('admins').select('*').limit(1);
if (error) { console.error('❌ خطأ في الاتصال:', error.message); process.exit(1); }
const admin = admins?.[0];

if (admin) {
  const { error: upErr } = await supabase.from('admins').update({
    passwordHash: hashPassword(newPassword),
    ...(newEmail ? { email: newEmail.trim() } : {}),
  }).eq('id', admin.id);
  if (upErr) { console.error('❌ ', upErr.message); process.exit(1); }
  console.log('✅ تم تحديث كلمة المرور بنجاح');
  console.log('   البريد:', newEmail || admin.email);
  console.log('   كلمة المرور:', newPassword);
} else {
  const email = newEmail || process.env.ADMIN_EMAIL || 'admin@salon.com';
  const { error: inErr } = await supabase.from('admins')
    .insert({ email, passwordHash: hashPassword(newPassword), name: 'مدير الصالون' });
  if (inErr) { console.error('❌', inErr.message); process.exit(1); }
  console.log('✅ تم إنشاء حساب مدير جديد');
  console.log('   البريد:', email);
  console.log('   كلمة المرور:', newPassword);
}
