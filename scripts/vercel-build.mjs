/**
 * سكربت البناء على Vercel
 * - يكتشف رابط قاعدة البيانات تلقائياً من متغيرات Vercel/Neon/Prisma Postgres
 * - يشغّل prisma db push + generate ثم next build
 *
 * يُستخدم كـ buildCommand في vercel.json
 */
import { spawnSync } from 'child_process';
import fs from 'fs';

// نضمن أن مخطط Postgres مطابق تماماً للمخطط الأساسي (يمنع أخطاء الحقول الناقصة)
try {
  const main = fs.readFileSync('prisma/schema.prisma', 'utf8');
  fs.writeFileSync('prisma/schema.postgres.prisma', main.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log('🔄 تمت مزامنة مخطط Postgres مع المخطط الأساسي');
} catch (e) {
  console.log('⚠️ تعذّر مزامنة المخطط:', e.message);
}

// ترتيب الأولوية: المتغير المخصص، ثم الرابط المباشر (للهجرات)، ثم المتغيرات التلقائية
const candidates = [
  'DATABASE_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'PRISMA_POSTGRES_URL',
  'PRISMA_DATABASE_URL',
];

let url = '';
for (const key of candidates) {
  if (process.env[key] && String(process.env[key]).startsWith('postgres')) {
    url = process.env[key];
    console.log(`🔗 استخدام قاعدة البيانات من المتغير: ${key}`);
    break;
  }
}

if (!url) {
  console.log('\n' + '='.repeat(64));
  console.log('❌ لم يتم العثور على رابط قاعدة بيانات Postgres.');
  console.log('='.repeat(64));
  console.log('الحل (دقيقتان):');
  console.log('  1) من صفحة المشروع في Vercel ← تبويب Storage');
  console.log('  2) Create Database ← Prisma Postgres (أو Neon) ← Create');
  console.log('  3) ارجع لتبويب Deployments ← اضغط Redeploy');
  console.log('');
  console.log('أو يدوياً: Settings ← Environment Variables ← أضف DATABASE_URL برابط يبدأ بـ postgres://');
  console.log('='.repeat(64) + '\n');
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: url || process.env.DATABASE_URL || '' };

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`❌ فشل: ${label}`);
    process.exit(r.status ?? 1);
  }
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

run(npx, ['prisma', 'db', 'push', '--schema=prisma/schema.postgres.prisma', '--skip-generate', '--accept-data-loss'], 'تهيئة جداول قاعدة البيانات');
run(npx, ['prisma', 'generate', '--schema=prisma/schema.postgres.prisma'], 'توليد عميل Prisma');
run(npx, ['next', 'build'], 'بناء الموقع');

console.log('\n✅ اكتمل البناء بنجاح');
