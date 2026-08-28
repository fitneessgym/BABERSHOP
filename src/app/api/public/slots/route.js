import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getSlots, getMonthAvailability } from '@/lib/slots';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId') || '';
  const barberId = searchParams.get('barberId') || '';
  const settings = await getSettings();

  try {
    if (month) {
      const [y, m] = month.split('-').map(Number);
      if (!y || !m) return NextResponse.json({});
      const data = await getMonthAvailability({ year: y, month: m - 1, serviceId, barberId, settings });
      return NextResponse.json(data);
    }
    if (date) {
      const slots = await getSlots({ date, serviceId, barberId, settings });
      return NextResponse.json(slots);
    }
    return NextResponse.json([]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
