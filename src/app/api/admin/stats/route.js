import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { list, count } from '@/lib/supabase';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = fmt(today);

  const [bookings, orders, totalB, totalO, todayB, pendingB, newO, services, products, phoneRows] = await Promise.all([
    count('bookings'),
    count('orders'),
    list('bookings', { select: 'price, status' }),
    list('orders', { select: 'total, status' }),
    list('bookings', { where: { date: todayStr }, order: { time: 'asc' } }),
    count('bookings', { where: { status: 'pending' } }),
    count('orders', { where: { status: 'new' } }),
    count('services', { where: { active: true } }),
    count('products', { where: { active: true } }),
    list('bookings', { select: 'phone' }),
  ]);

  const revenueBookings = totalB.filter((b) => b.status !== 'cancelled').reduce((s, b) => s + b.price, 0);
  const revenueOrders = totalO.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  return NextResponse.json({
    totalBookings: bookings,
    totalOrders: orders,
    todayBookings: todayB.length,
    pendingBookings: pendingB,
    newOrders: newO,
    revenue: revenueBookings + revenueOrders,
    revenueBookings,
    revenueOrders,
    services,
    products,
    customers: new Set(phoneRows.map((r) => r.phone)).size,
    todayList: todayB,
  });
}
