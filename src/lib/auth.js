import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './db';

const SECRET = process.env.SESSION_SECRET || 'salon-secret-key-change-me';
export const COOKIE = 'salon_session';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  try {
    const [salt, hash] = String(stored).split(':');
    if (!salt || !hash) return false;
    const test = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch {
    return false;
  }
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

export function createToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data)}`;
}

export function verifyToken(token) {
  try {
    const [data, sig] = String(token).split('.');
    if (!data || !sig) return null;
    if (sign(data) !== sig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(adminId) {
  const token = createToken({ id: adminId || 'admin', exp: Date.now() + 1000 * 60 * 60 * 24 * 14 });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  });
  return token;
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentAdmin() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
    if (!admin || !admin.active) return null;
    return admin;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  return await getCurrentAdmin();
}

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@salon.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await prisma.admin.findFirst({ where: { role: 'owner' } });
  if (existing) return existing;
  const any = await prisma.admin.findFirst();
  if (any) return any;
  return prisma.admin.create({
    data: { email, passwordHash: hashPassword(password), name: 'مدير الصالون', role: 'owner' },
  });
}

export const ROLES = { owner: 'owner', admin: 'admin', staff: 'staff' };

/** صلاحيات بسيطة: المالك يملك كل شيء، المدير يدير العمليات، الموظف مشاهدة فقط */
export function can(admin, action) {
  if (!admin) return false;
  const r = admin.role || 'staff';
  if (r === 'owner') return true;
  if (r === 'admin') return !['manageUsers', 'deleteUser', 'manageSettings'].includes(action);
  return ['view'].includes(action);
}
