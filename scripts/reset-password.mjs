/**
 * إعادة تعيين كلمة مرور المدير (في حال نسيانها)
 *
 * الاستخدام:
 *   node scripts/reset-password.mjs 123456
 *   node scripts/reset-password.mjs 123456 admin@salon.com
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

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

const admin = await prisma.admin.findFirst();

if (admin) {
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash: hashPassword(newPassword),
      ...(newEmail ? { email: newEmail.trim() } : {}),
    },
  });
  console.log('✅ تم تحديث كلمة المرور بنجاح');
  console.log('   البريد:', newEmail || admin.email);
  console.log('   كلمة المرور:', newPassword);
} else {
  const email = newEmail || process.env.ADMIN_EMAIL || 'admin@salon.com';
  await prisma.admin.create({
    data: { email, passwordHash: hashPassword(newPassword), name: 'مدير الصالون' },
  });
  console.log('✅ تم إنشاء حساب مدير جديد');
  console.log('   البريد:', email);
  console.log('   كلمة المرور:', newPassword);
}

await prisma.$disconnect();
