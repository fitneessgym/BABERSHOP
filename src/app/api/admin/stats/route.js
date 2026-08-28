import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayStr = fmt(today);

  const [bookings, orders, totalB, totalO, todayB, pendingB, newO, services, products, customers] = await Promise.all([
    prisma.booking.count(),
    prisma.order.count(),
    prisma.booking.findMany({ select: { price: true, status: true } }),
    prisma.order.findMany({ select: { total: true, status: true } }),
    prisma.booking.findMany({ where: { date: todayStr }, orderBy: { time: 'asc' } }),
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.order.count({ where: { status: 'new' } }),
    prisma.service.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true } }),
    prisma.booking.groupBy({ by: ['phone'], _count: { phone: true } }),
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
    customers: customers.length,
    todayList: todayB,
  });
}
