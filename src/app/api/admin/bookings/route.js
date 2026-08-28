import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { generateCode, toMin, toTime } from '@/lib/slots';
import { notifyBooking, scheduleReminder, notifyBookingCancel } from '@/lib/notify';

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const { action = 'create', id } = body;

  try {
    if (action === 'create') {
      const { serviceId, barberId, date, time, customerName, phone, notes, status = 'confirmed', email = '' } = body.data || {};
      if (!serviceId || !date || !time || !customerName) {
        return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
      }
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      const barber = barberId ? await prisma.barber.findUnique({ where: { id: barberId } }) : null;

      const booking = await prisma.booking.create({
        data: {
          code: generateCode('BK'),
          customerName: String(customerName),
          phone: String(phone || ''),
          email: String(email || ''),
          serviceId,
          barberId: barberId || null,
          barberName: barber ? barber.nameAr : '',
          serviceName: service ? service.nameAr : '',
          date: String(date),
          time: String(time),
          endTime: toTime(toMin(time) + (service?.durationMin || 30)),
          durationMin: service?.durationMin || 30,
          price: service?.price || 0,
          status,
          notes: String(notes || ''),
          source: 'admin',
        },
      });
      try {
        await notifyBooking(booking, 'booking_confirm', 'ar');
        await scheduleReminder(booking, 'ar');
      } catch (e) { console.log('notify error:', e.message); }
      return NextResponse.json({ ok: true, row: booking });
    }

    if (action === 'update') {
      const data = {};
      const allowed = ['status', 'date', 'time', 'barberId', 'serviceId', 'notes', 'customerName', 'phone', 'price'];
      for (const k of allowed) if (body.data?.[k] !== undefined) data[k] = body.data[k];
      const row = await prisma.booking.update({ where: { id }, data });
      try {
        if (body.data?.status === 'cancelled') await notifyBooking(row, 'booking_cancel', 'ar');
        else if (body.data?.status === 'confirmed') await notifyBooking(row, 'booking_confirm', 'ar');
      } catch (e) { console.log('notify error:', e.message); }
      return NextResponse.json({ ok: true, row });
    }

    if (action === 'delete') {
      await prisma.booking.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
