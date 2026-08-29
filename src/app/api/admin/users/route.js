import { NextResponse } from 'next/server';
import { requireAdmin, hashPassword, verifyPassword, can } from '@/lib/auth';
import { one, list, count, insert, update, remove } from '@/lib/supabase';

const PUBLIC_COLS = 'id, email, name, role, active, lastLogin, createdAt';

export async function GET() {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  if (!can(me, 'manageUsers') && me.role !== 'admin') {
    return NextResponse.json({ error: 'لا تملك صلاحية عرض المستخدمين' }, { status: 403 });
  }
  const users = await list('admins', {
    order: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: PUBLIC_COLS,
  });
  return NextResponse.json({ users, me: { id: me.id, role: me.role } });
}

export async function POST(req) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const { action, id } = body;

  try {
    // ---------- إنشاء مستخدم ----------
    if (action === 'create') {
      if (!can(me, 'manageUsers')) return NextResponse.json({ error: 'لا تملك صلاحية إضافة مستخدمين' }, { status: 403 });
      const { name, email, password, role = 'staff' } = body.data || {};
      if (!email || !password) return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 });
      if (String(password).length < 6) return NextResponse.json({ error: 'كلمة المرور 6 أحرف على الأقل' }, { status: 400 });
      const exists = await one('admins', { where: { email: String(email).trim().toLowerCase() } });
      if (exists) return NextResponse.json({ error: 'هذا البريد مستخدم مسبقاً' }, { status: 400 });
      const newRole = me.role === 'owner' ? role : 'staff';
      const user = await insert('admins', {
        email: String(email).trim().toLowerCase(),
        name: String(name || 'مستخدم').trim(),
        passwordHash: hashPassword(String(password)),
        role: newRole,
      });
      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active } });
    }

    // ---------- تعديل مستخدم ----------
    if (action === 'update') {
      const target = await one('admins', { where: { id } });
      if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

      const isSelf = target.id === me.id;
      const changingRole = body.data?.role && body.data.role !== target.role;
      const changingStatus = body.data?.active !== undefined && body.data.active !== target.active;

      if (!isSelf && !can(me, 'manageUsers')) {
        return NextResponse.json({ error: 'لا تملك صلاحية تعديل المستخدمين' }, { status: 403 });
      }
      if (changingRole && !can(me, 'manageUsers')) {
        return NextResponse.json({ error: 'المالك فقط يمكنه تغيير الصلاحيات' }, { status: 403 });
      }
      if (changingStatus && !can(me, 'manageUsers')) {
        return NextResponse.json({ error: 'المالك فقط يمكنه تعطيل الحسابات' }, { status: 403 });
      }
      if (target.role === 'owner' && !isSelf && me.role !== 'owner') {
        return NextResponse.json({ error: 'لا يمكن تعديل حساب المالك' }, { status: 403 });
      }

      const data = {};
      if (body.data?.name !== undefined) data.name = String(body.data.name).trim();
      if (body.data?.email !== undefined) data.email = String(body.data.email).trim().toLowerCase();
      if (body.data?.role !== undefined && can(me, 'manageUsers')) data.role = body.data.role;
      if (body.data?.active !== undefined && can(me, 'manageUsers')) data.active = !!body.data.active;
      if (body.data?.password) {
        if (String(body.data.password).length < 6) return NextResponse.json({ error: 'كلمة المرور 6 أحرف على الأقل' }, { status: 400 });
        data.passwordHash = hashPassword(String(body.data.password));
      }

      // منع إزالة آخر مالك
      if (data.role && data.role !== 'owner' && target.role === 'owner') {
        const owners = await count('admins', { where: { role: 'owner' } });
        if (owners <= 1) return NextResponse.json({ error: 'يجب أن يبقى حساب مالك واحد على الأقل' }, { status: 400 });
      }
      if (data.active === false && target.role === 'owner') {
        return NextResponse.json({ error: 'لا يمكن تعطيل حساب المالك' }, { status: 400 });
      }

      const user = await update('admins', id, data);
      return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active } });
    }

    // ---------- حذف مستخدم ----------
    if (action === 'delete') {
      if (!can(me, 'deleteUser')) return NextResponse.json({ error: 'المالك فقط يمكنه حذف المستخدمين' }, { status: 403 });
      if (id === me.id) return NextResponse.json({ error: 'لا يمكنك حذف حسابك الحالي' }, { status: 400 });
      const target = await one('admins', { where: { id } });
      if (!target) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      if (target.role === 'owner') {
        const owners = await count('admins', { where: { role: 'owner' } });
        if (owners <= 1) return NextResponse.json({ error: 'يجب أن يبقى حساب مالك واحد على الأقل' }, { status: 400 });
      }
      await remove('admins', id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
