/**
 * سكربت البناء على Vercel
 * - يكتشف رابط قاعدة البيانات تلقائياً من متغيرات Vercel/Neon/Prisma Postgres
 * - يشغّل prisma db push + generate ثم next build
 *
 * يُستخدم كـ buildCommand في vercel.json
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
const fsSyncRef = fs;

// نضمن أن مخطط Postgres مطابق تماماً للمخطط الأساسي (يمنع أخطاء الحقول الناقصة)
try {
  const main = fs.readFileSync('prisma/schema.prisma', 'utf8');
  fs.writeFileSync('prisma/schema.postgres.prisma', main.replace('provider = "sqlite"', 'provider = "postgresql"'));
  console.log('🔄 تمت مزامنة مخطط Postgres مع المخطط الأساسي');
} catch (e) {
  console.log('⚠️ تعذّر مزامنة المخطط:', e.message);
}

const isPostgres = (v) => typeof v === 'string' && v.startsWith('postgres');

// رابط الهجرات: المباشر أولاً (Supabase DIRECT_URL أو Vercel غير المجمع)
const MIGRATE_CANDIDATES = [
  'DIRECT_URL',
  'MIGRATE_DATABASE_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_URL',
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'PRISMA_POSTGRES_URL',
];

// رابط التشغيل: المجمع (Pooler) للسرعة
const RUNTIME_CANDIDATES = [
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'DIRECT_URL',
];

function pick(candidates) {
  for (const key of candidates) {
    if (isPostgres(process.env[key])) return { url: process.env[key], key };
  }
  return null;
}

const migrate = pick(MIGRATE_CANDIDATES);
const runtime = pick(RUNTIME_CANDIDATES) || migrate;
const url = (migrate || runtime)?.url || '';

if (migrate) console.log(`🔗 رابط الهجرات من المتغير: ${migrate.key}`);
if (runtime) console.log(`⚡ رابط التشغيل من المتغير: ${runtime.key}`);

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

const env = {
  ...process.env,
  DATABASE_URL: (runtime?.url || ''),
  DIRECT_URL: (migrate?.url || ''),
};

function run(cmd, args, label) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env, shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`❌ فشل: ${label}`);
    process.exit(r.status ?? 1);
  }
}

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// اختيار المخطط: Supabase إن وُجد، وإلا Postgres العادي
const fsSync = fsSyncRef;
const schemaFile = fsSync.existsSync('prisma/schema.supabase.prisma') && process.env.DIRECT_URL
  ? 'prisma/schema.supabase.prisma'
  : 'prisma/schema.postgres.prisma';
console.log(`📄 المخطط المستخدم: ${schemaFile}`);

run(npx, ['prisma', 'db', 'push', `--schema=${schemaFile}`, '--skip-generate', '--accept-data-loss'], 'تهيئة جداول قاعدة البيانات');
run(npx, ['prisma', 'generate', `--schema=${schemaFile}`], 'توليد عميل Prisma');
run(npx, ['next', 'build'], 'بناء الموقع');

console.log('\n✅ اكتمل البناء بنجاح');
