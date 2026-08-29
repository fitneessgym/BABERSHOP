import { NextResponse } from 'next/server';
import { requireAdmin, verifyPassword, hashPassword } from '@/lib/auth';
import { update } from '@/lib/supabase';

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const { name, email, currentPassword, newPassword, confirmPassword } = await req.json();

    // تحديث الاسم والبريد فقط
    if (!newPassword && !currentPassword) {
      const row = await update('admins', admin.id, {
        name: String(name || admin.name),
        email: String(email || admin.email).trim().toLowerCase(),
      });
      return NextResponse.json({ ok: true, admin: { email: row.email, name: row.name } });
    }

    // التحقق من كلمة المرور الحالية
    if (!verifyPassword(String(currentPassword || ''), admin.passwordHash)) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'كلمتا المرور غير متطابقتين' }, { status: 400 });
    }

    const row = await update('admins', admin.id, {
      passwordHash: hashPassword(String(newPassword)),
      name: String(name || admin.name),
      email: String(email || admin.email).trim().toLowerCase(),
    });

    return NextResponse.json({ ok: true, admin: { email: row.email, name: row.name } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
