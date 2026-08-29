import { workingHours, parseJSON } from './settings';
import { one, list } from './supabase';

export const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const toTime = (m) => {
  // يدعم الأوقات بعد منتصف الليل:
  // 24:00 => 00:00
  // 25:30 => 01:30
  const normalized = ((Number(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};

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

const overlap = (aStart, aDur, bStart, bDur) =>
  aStart < bStart + bDur && bStart < aStart + aDur;

/**
 * يحوّل فترة العمل إلى دقائق.
 *
 * مثال:
 * 10:00 -> 02:00
 * تصبح:
 * 600 -> 1560
 *
 * أي أن 02:00 تعتبر في اليوم التالي.
 */
function normalizeWorkHours(hours) {
  if (!hours || hours.off) return null;

  const start = toMin(hours.open);
  let end = toMin(hours.close);

  if (end <= start) {
    end += 1440;
  }

  return {
    ...hours,
    start,
    end,
  };
}

/**
 * يحسب الأوقات المتاحة ليوم معين.
 */
export async function getSlots({ date, serviceId, barberId, settings }) {
  if (!date) return [];

  const dateObj = new Date(`${date}T00:00:00`);
  if (isNaN(dateObj.getTime())) return [];

  const dow = dateObj.getDay();

  const salonSettings = workingHours(settings);
  const salon = salonSettings[dow];

  if (!salon || salon.off) return [];

  const salonHours = normalizeWorkHours(salon);

  if (!salonHours) return [];

  const service = serviceId
    ? await one('services', { where: { id: serviceId } })
    : null;

  const duration = service?.durationMin || 30;
  const step = parseInt(settings.slotDuration || '30', 10) || 30;

  let barbers = await list('barbers', {
    where: { active: true },
    select: '*, services:barber_services(*), timeOff:time_off(*)',
    order: { sort: 'asc' },
  });

  barbers = barbers.map((b) => ({
    ...b,
    timeOff: (b.timeOff || []).filter((t) => t.date === date),
  }));

  if (serviceId) {
    barbers = barbers.filter(
      (b) =>
        !b.services ||
        b.services.length === 0 ||
        b.services.some((s) => s.serviceId === serviceId)
    );
  }

  if (barberId) {
    barbers = barbers.filter((b) => b.id === barberId);
  }

  if (!barbers.length) return [];

  const bookings = await list('bookings', {
    where: {
      date,
      status: { not: 'cancelled' },
    },
    select: 'barberId, time, durationMin',
  });

  const start = salonHours.start;
  const end = salonHours.end;

  const isToday = date === todayStr();
  const now = new Date();

  // منع الحجز قبل نصف ساعة من الوقت الحالي
  const nowMin = now.getHours() * 60 + now.getMinutes() + 30;

  const slots = [];

  /**
   * مثال:
   * start = 600  (10:00)
   * end   = 1560 (02:00 اليوم التالي)
   *
   * لذلك الحلقة تستمر عبر 1440.
   */
  for (let m = start; m + duration <= end; m += step) {
    /**
     * عندما يكون الموعد لليوم الحالي:
     * نقارن الأوقات في نفس نطاق اليوم.
     *
     * المواعيد بعد منتصف الليل (مثل 01:00)
     * تخص الجزء الليلي من الجدول الحالي،
     * لذلك لا نحذفها بسبب مقارنة مباشرة مع 01:00
     * لليوم الحالي عند اختيار تاريخ جديد.
     */
    if (isToday) {
      const currentSlotForToday = m >= 1440 ? m - 1440 : m;

      if (m < 1440 && currentSlotForToday < nowMin) {
        continue;
      }
    }

    const time = toTime(m);
    const free = [];

    for (const b of barbers) {
      /**
       * جدول الحلاق الخاص، إن وجد.
       */
      const ownSched = b.schedule
        ? parseJSON(b.schedule, null)
        : null;

      const ownDay =
        ownSched &&
        Array.isArray(ownSched) &&
        ownSched[dow]
          ? ownSched[dow]
          : null;

      const selectedHours =
        ownDay && !ownDay.off
          ? normalizeWorkHours(ownDay)
          : salonHours;

      if (!selectedHours) continue;

      /**
       * يجب أن يكون الموعد بالكامل داخل ساعات الحلاق.
       */
      if (
        selectedHours.start > m ||
        selectedHours.end < m + duration
      ) {
        continue;
      }

      /**
       * الإجازات.
       *
       * time فارغ = إجازة اليوم كاملًا
       * أو يساوي وقت بداية الموعد.
       */
      if (
        b.timeOff.some(
          (t) => !t.time || t.time === time
        )
      ) {
        continue;
      }

      /**
       * فحص تضارب الحجوزات.
       *
       * إذا كان وقت الحجز بعد منتصف الليل،
       * نحوّله إلى نطاق 24 ساعة لكي يتطابق
       * مع الموعد الليلي.
       */
      const conflict = bookings.some((bk) => {
        let bookingStart = toMin(bk.time);

        /**
         * مثال:
         * الموعد 10:00 → 02:00
         * والحجز 01:00
         *
         * 01:00 تصبح 25:00 ضمن نفس فترة الدوام.
         */
        if (end > 1440 && bookingStart < start) {
          bookingStart += 1440;
        }

        return (
          bk.barberId === b.id &&
          overlap(
            bookingStart,
            bk.durationMin || 30,
            m,
            duration
          )
        );
      });

      if (conflict) continue;

      free.push(b.id);
    }

    slots.push({
      time,
      endTime: toTime(m + duration),
      available: free.length > 0,
      barbers: free,
    });
  }

  return slots;
}

/**
 * أيام الشهر مع توفر سريع للتقويم.
 */
export async function getMonthAvailability({
  year,
  month,
  serviceId,
  barberId,
  settings,
}) {
  const result = {};

  const days = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const today = todayStr();

  const end = addDays(
    today,
    parseInt(settings.maxAdvanceDays || '30', 10) || 30
  );

  for (let d = 1; d <= days; d++) {
    const date = dateToStr(
      new Date(year, month, d)
    );

    if (date < today || date > end) {
      continue;
    }

    const slots = await getSlots({
      date,
      serviceId,
      barberId,
      settings,
    });

    result[date] = slots.filter(
      (s) => s.available
    ).length;
  }

  return result;
}

export function generateCode(prefix = 'BK') {
  return (
    prefix +
    '-' +
    Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()
  );
}