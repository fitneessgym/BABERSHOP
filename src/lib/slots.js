import prisma from './db';
import { workingHours, parseJSON } from './settings';

export const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const overlap = (aStart, aDur, bStart, bDur) => aStart < bStart + bDur && bStart < aStart + aDur;

/**
 * يحسب الأوقات المتاحة ليوم معين
 */
export async function getSlots({ date, serviceId, barberId, settings }) {
  if (!date) return [];
  const dateObj = new Date(`${date}T00:00:00`);
  if (isNaN(dateObj.getTime())) return [];
  const dow = dateObj.getDay();

  const salon = workingHours(settings)[dow];
  if (!salon || salon.off) return [];

  const service = serviceId ? await prisma.service.findUnique({ where: { id: serviceId } }) : null;
  const duration = service?.durationMin || 30;
  const step = parseInt(settings.slotDuration || '30', 10) || 30;

  let barbers = await prisma.barber.findMany({
    where: { active: true },
    include: { services: true, timeOff: { where: { date } } },
    orderBy: { sort: 'asc' },
  });

  if (serviceId) {
    barbers = barbers.filter((b) => b.services.length === 0 || b.services.some((s) => s.serviceId === serviceId));
  }
  if (barberId) barbers = barbers.filter((b) => b.id === barberId);
  if (!barbers.length) return [];

  const bookings = await prisma.booking.findMany({
    where: { date, status: { not: 'cancelled' } },
    select: { barberId: true, time: true, durationMin: true },
  });

  const start = toMin(salon.open);
  const end = toMin(salon.close);
  const isToday = date === todayStr();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + 30; // مهلة نصف ساعة

  const slots = [];
  for (let m = start; m + duration <= end; m += step) {
    if (isToday && m < nowMin) continue;
    const time = toTime(m);
    const free = [];
    for (const b of barbers) {
      const ownSched = b.schedule ? parseJSON(b.schedule, null) : null;
      const ownDay = ownSched && ownSched[dow] ? ownSched[dow] : null;
      const hours = ownDay && !ownDay.off ? ownDay : salon;
      if (toMin(hours.open) > m || toMin(hours.close) < m + duration) continue;
      if (b.timeOff.some((t) => !t.time || t.time === time)) continue;
      const conflict = bookings.some(
        (bk) => bk.barberId === b.id && overlap(toMin(bk.time), bk.durationMin || 30, m, duration)
      );
      if (conflict) continue;
      free.push(b.id);
    }
    slots.push({ time, endTime: toTime(m + duration), available: free.length > 0, barbers: free });
  }
  return slots;
}

/** أيام الشهر مع توفر سريع (للتقويم) */
export async function getMonthAvailability({ year, month, serviceId, barberId, settings }) {
  const result = {};
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayStr();
  const end = addDays(today, parseInt(settings.maxAdvanceDays || '30', 10) || 30);
  for (let d = 1; d <= days; d++) {
    const date = dateToStr(new Date(year, month, d));
    if (date < today || date > end) continue;
    const slots = await getSlots({ date, serviceId, barberId, settings });
    result[date] = slots.filter((s) => s.available).length;
  }
  return result;
}

export function generateCode(prefix = 'BK') {
  return prefix + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}
