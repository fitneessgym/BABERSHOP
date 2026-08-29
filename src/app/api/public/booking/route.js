import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/settings';
import { one, list, insert } from '@/lib/supabase';
import { getSlots, generateCode, toMin, toTime } from '@/lib/slots';
import { notifyBooking, scheduleReminder } from '@/lib/notify';

export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceId, barberId, date, time, name, phone, email, notes, locale } = body;

    if (!serviceId || !date || !time || !name || !phone) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const settings = await getSettings();
    const service = await one('services', { where: { id: serviceId } });
    if (!service || !service.active) return NextResponse.json({ error: 'خدمة غير متاحة' }, { status: 400 });

    // التحقق من توفر الوقت
    const slots = await getSlots({ date, serviceId, barberId: barberId || '', settings });
    const slot = slots.find((s) => s.time === time);
    if (!slot || !slot.available) {
      return NextResponse.json({ error: 'هذا الوقت غير متاح، الرجاء اختيار وقت آخر' }, { status: 409 });
    }

    const finalBarberId = barberId || slot.barbers[0];
    const barber = finalBarberId ? await one('barbers', { where: { id: finalBarberId } }) : null;

    const booking = await insert('bookings', {
        code: generateCode('BK'),
        customerName: String(name).trim(),
        phone: String(phone).trim(),
        email: String(email || '').trim(),
        serviceId,
        barberId: finalBarberId || null,
        barberName: barber ? (locale === 'en' ? barber.nameEn : barber.nameAr) : '',
        serviceName: locale === 'en' ? service.nameEn : service.nameAr,
        date,
        time,
        endTime: toTime(toMin(time) + service.durationMin),
        durationMin: service.durationMin,
        price: service.price,
        status: settings.autoConfirm === '1' ? 'confirmed' : 'pending',
        notes: String(notes || '').trim(),
    });

    // 🔔 إشعارات: تأكيد + تذكير مجدول + تنبيه داخلي
    try {
      await notifyBooking(booking, 'booking_confirm', locale === 'en' ? 'en' : 'ar');
      await scheduleReminder(booking, locale === 'en' ? 'en' : 'ar');
    } catch (e) { console.log('notify error:', e.message); }

    return NextResponse.json({
      ok: true,
      id: booking.id,
      code: booking.code,
      date: booking.date,
      time: booking.time,
      price: booking.price,
      status: booking.status,
      barberName: booking.barberName,
      serviceNameAr: service.nameAr,
      serviceNameEn: service.nameEn,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const phone = new URL(req.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 });
  const bookings = await list('bookings', {
    where: { phone },
    order: [{ date: 'desc' }, { time: 'desc' }],
    limit: 20,
  });
  return NextResponse.json(bookings);
}
