import prisma from './db';
import { getSettings, parseJSON, DEFAULT_TEMPLATES } from './settings';

/* ============================================================
   محرك الإشعارات
   القنوات: whatsapp | sms | email | inapp
   المزوّدون: رابط مباشر (بدون مفاتيح) | UltraMsg | Twilio | CallMeBot | Webhook مخصص | SMTP
   ============================================================ */

export const EVENTS = {
  booking_confirm: { ar: 'تأكيد الحجز', en: 'Booking Confirmation', channels: ['whatsapp', 'sms', 'email'] },
  booking_reminder: { ar: 'تذكير بالموعد', en: 'Appointment Reminder', channels: ['whatsapp', 'sms'] },
  booking_cancel: { ar: 'إلغاء الحجز', en: 'Booking Cancelled', channels: ['whatsapp', 'sms'] },
  order_new: { ar: 'طلب جديد', en: 'New Order', channels: ['whatsapp', 'sms', 'email'] },
  order_status: { ar: 'تحديث حالة الطلب', en: 'Order Status', channels: ['whatsapp', 'sms'] },
  admin_booking: { ar: 'تنبيه إداري: حجز جديد', en: 'Admin Alert: New Booking', channels: ['inapp'] },
  admin_order: { ar: 'تنبيه إداري: طلب جديد', en: 'Admin Alert: New Order', channels: ['inapp'] },
  custom: { ar: 'رسالة مخصصة', en: 'Custom Message', channels: ['whatsapp', 'sms', 'email'] },
};

export function getTemplate(settings, event, locale = 'ar') {
  const templates = parseJSON(settings.notifyTemplates, {});
  const custom = templates?.[event]?.[locale];
  if (custom) return custom;
  return DEFAULT_TEMPLATES[event]?.[locale] || DEFAULT_TEMPLATES[event]?.ar || '';
}

export function renderTemplate(settings, event, locale, vars = {}) {
  return getTemplate(settings, event, locale).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}

/* ---------------- إدراج إشعار في الطابور ---------------- */
export async function queue({ type, channel, to, title, body, refId = '', scheduledAt = null, sendNow = true }) {
  const n = await prisma.notification.create({
    data: {
      type, channel, to: String(to || ''), title: String(title || ''), body: String(body || ''),
      refId, scheduledAt, status: 'pending',
    },
  });
  if (sendNow && !scheduledAt) {
    try { return await send(n.id); } catch { return n; }
  }
  return n;
}

/* ---------------- رابط واتساب المباشر ---------------- */
export function waLink(phone, text) {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  const intl = digits.startsWith('972') ? digits : digits.startsWith('0') ? '972' + digits.slice(1) : digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

/* ---------------- مزوّدو الإرسال ---------------- */
async function sendWhatsApp(settings, to, text) {
  const provider = settings.waProvider || 'link';
  if (provider === 'link') {
    return { ok: false, skipped: true, link: waLink(to, text), error: 'link' };
  }
  try {
    if (provider === 'ultramsg') {
      const res = await fetch(`https://api.ultramsg.com/${settings.waInstanceId}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: settings.waToken, to: normalizePhone(to), body: text }),
      });
      const data = await res.json();
      return res.ok ? { ok: true, data } : { ok: false, error: JSON.stringify(data).slice(0, 200) };
    }
    if (provider === 'callmebot') {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(normalizePhone(to))}&text=${encodeURIComponent(text)}&apikey=${settings.waToken}`;
      const res = await fetch(url);
      return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
    }
    if (provider === 'twilio') {
      const auth = Buffer.from(`${settings.twilioSid}:${settings.twilioToken}`).toString('base64');
      const body = new URLSearchParams({ To: `whatsapp:${normalizePhone(to, true)}`, From: `whatsapp:${settings.twilioFrom || '+14155238886'}`, Body: text });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilioSid}/Messages.json`, {
        method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      });
      const data = await res.json();
      return res.ok ? { ok: true, data } : { ok: false, error: data?.message || 'twilio error' };
    }
    if (provider === 'webhook') {
      const res = await fetch(settings.notifyWebhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'whatsapp', to: normalizePhone(to), message: text }),
      });
      return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: false, error: 'مزوّد غير معروف' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sendSMS(settings, to, text) {
  const provider = settings.smsProvider || 'none';
  if (provider === 'none') return { ok: false, skipped: true, error: 'مزوّد SMS غير مضبوط' };
  try {
    if (provider === 'twilio') {
      const auth = Buffer.from(`${settings.twilioSid}:${settings.twilioToken}`).toString('base64');
      const body = new URLSearchParams({ To: normalizePhone(to, true), From: settings.twilioFrom || '', Body: text });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${settings.twilioSid}/Messages.json`, {
        method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body,
      });
      const data = await res.json();
      return res.ok ? { ok: true, data } : { ok: false, error: data?.message || 'twilio error' };
    }
    if (provider === 'webhook') {
      const res = await fetch(settings.notifyWebhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'sms', to: normalizePhone(to), message: text }),
      });
      return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` };
    }
    return { ok: false, error: 'مزوّد غير معروف' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sendEmail(settings, to, subject, text) {
  if (!settings.smtpHost || !to || !to.includes('@')) return { ok: false, skipped: true, error: 'SMTP غير مضبوط أو بريد غير صالح' };
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: Number(settings.smtpPort || 587),
      secure: Number(settings.smtpPort) === 465,
      auth: settings.smtpUser ? { user: settings.smtpUser, pass: settings.smtpPass } : undefined,
    });
    await transporter.sendMail({
      from: settings.smtpFrom || settings.smtpUser || 'no-reply@salon.com',
      to, subject, text,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function normalizePhone(phone, plus = false) {
  let d = String(phone || '').replace(/[^\d]/g, '');
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return plus ? '+' + d : d;
}

/* ---------------- إرسال إشعار واحد ---------------- */
export async function send(id) {
  const settings = await getSettings();
  const n = await prisma.notification.findUnique({ where: { id } });
  if (!n) return { ok: false, error: 'not found' };

  let res = { ok: false, skipped: true, error: 'قناة غير مدعومة' };
  if (n.channel === 'whatsapp') res = await sendWhatsApp(settings, n.to, n.body);
  else if (n.channel === 'sms') res = await sendSMS(settings, n.to, n.body);
  else if (n.channel === 'email') res = await sendEmail(settings, n.to, n.title || 'إشعار من الصالون', n.body);
  else if (n.channel === 'inapp') res = { ok: true };

  const status = res.ok ? 'sent' : res.skipped ? 'skipped' : 'failed';
  const updated = await prisma.notification.update({
    where: { id },
    data: { status, error: res.error || '', sentAt: res.ok ? new Date() : null },
  });
  return { ok: res.ok, status, link: res.link, error: res.error, notification: updated };
}

/* ---------------- معالجة الطابور (التذكيرات المجدولة) ---------------- */
export async function processDue(limit = 100) {
  const now = new Date();
  const due = await prisma.notification.findMany({
    where: { status: 'pending', scheduledAt: { lte: now } },
    take: limit,
    orderBy: { scheduledAt: 'asc' },
  });
  let sent = 0, failed = 0;
  for (const n of due) {
    const r = await send(n.id);
    if (r.ok) sent++; else failed++;
  }
  return { processed: due.length, sent, failed };
}

/* ---------------- إشعارات الحجوزات ---------------- */
export async function notifyBooking(booking, event = 'booking_confirm', locale = 'ar') {
  const settings = await getSettings();
  const service = await prisma.service.findUnique({ where: { id: booking.serviceId } }).catch(() => null);
  const vars = {
    name: booking.customerName,
    salon: locale === 'en' ? settings.salonNameEn : settings.salonNameAr,
    service: service ? (locale === 'en' ? service.nameEn : service.nameAr) : booking.serviceName,
    barber: booking.barberName || (locale === 'en' ? 'Our team' : 'فريقنا'),
    date: booking.date,
    time: booking.time,
    code: booking.code,
    price: booking.price,
    currency: settings.currency,
    phone: settings.phone,
  };

  const results = [];

  // إشعار للعميل
  if (settings.notifyWhatsapp === '1' && booking.phone) {
    results.push(await queue({
      type: event, channel: 'whatsapp', to: booking.phone,
      title: EVENTS[event]?.[locale === 'en' ? 'en' : 'ar'] || event,
      body: renderTemplate(settings, event, locale, vars),
      refId: booking.id,
    }));
  }
  if (settings.notifySms === '1' && booking.phone) {
    results.push(await queue({
      type: event, channel: 'sms', to: booking.phone,
      title: EVENTS[event]?.[locale === 'en' ? 'en' : 'ar'] || event,
      body: renderTemplate(settings, event, locale, vars),
      refId: booking.id, sendNow: false,
    }));
  }
  if (settings.notifyEmail === '1' && booking.email) {
    results.push(await queue({
      type: event, channel: 'email', to: booking.email,
      title: `${settings.salonNameAr} — ${EVENTS[event]?.ar || event}`,
      body: renderTemplate(settings, event, locale, vars),
      refId: booking.id,
    }));
  }

  // تنبيه داخلي للإدارة
  results.push(await queue({
    type: 'admin_booking', channel: 'inapp', to: 'admin',
    title: locale === 'en' ? 'New Booking' : 'حجز جديد',
    body: renderTemplate(settings, 'admin_booking', locale, vars),
    refId: booking.id,
  }));

  return results;
}

/** جدولة تذكير قبل الموعد بعدد ساعات */
export async function scheduleReminder(booking, locale = 'ar') {
  const settings = await getSettings();
  if (settings.notifyReminder !== '1' || !booking.phone) return null;
  const hours = Number(settings.reminderHours || 24);
  const start = new Date(`${booking.date}T${booking.time || '10:00'}:00`);
  const at = new Date(start.getTime() - hours * 3600 * 1000);
  if (isNaN(at.getTime()) || at <= new Date()) return null;

  const service = await prisma.service.findUnique({ where: { id: booking.serviceId } }).catch(() => null);
  const vars = {
    name: booking.customerName,
    salon: locale === 'en' ? settings.salonNameEn : settings.salonNameAr,
    service: service ? (locale === 'en' ? service.nameEn : service.nameAr) : booking.serviceName,
    barber: booking.barberName || '',
    date: booking.date, time: booking.time, code: booking.code, phone: settings.phone,
  };
  return queue({
    type: 'booking_reminder', channel: settings.notifyReminderChannel || 'whatsapp',
    to: booking.phone,
    title: locale === 'en' ? 'Appointment Reminder' : 'تذكير بالموعد',
    body: renderTemplate(settings, 'booking_reminder', locale, vars),
    refId: booking.id, scheduledAt: at, sendNow: false,
  });
}

/* ---------------- إشعارات الطلبات ---------------- */
export async function notifyOrder(order, event = 'order_new', locale = 'ar') {
  const settings = await getSettings();
  const statusLabel = {
    new: 'جديد', processing: 'قيد التحضير', shipped: 'تم الشحن', delivered: 'تم التسليم', cancelled: 'ملغي',
  }[order.status] || order.status;

  const vars = {
    name: order.customerName, code: order.code, total: order.total,
    currency: settings.currency, status: statusLabel,
    salon: locale === 'en' ? settings.salonNameEn : settings.salonNameAr,
    phone: settings.phone,
  };

  const results = [];
  if (settings.notifyWhatsapp === '1' && order.phone) {
    results.push(await queue({
      type: event, channel: 'whatsapp', to: order.phone,
      title: event === 'order_new' ? 'طلب جديد' : 'تحديث الطلب',
      body: renderTemplate(settings, event, locale, vars), refId: order.id,
    }));
  }
  if (settings.notifyEmail === '1' && order.email) {
    results.push(await queue({
      type: event, channel: 'email', to: order.email,
      title: `${settings.salonNameAr} — ${event === 'order_new' ? 'طلب جديد' : 'تحديث الطلب'}`,
      body: renderTemplate(settings, event, locale, vars), refId: order.id,
    }));
  }
  results.push(await queue({
    type: 'admin_order', channel: 'inapp', to: 'admin',
    title: 'طلب جديد', body: renderTemplate(settings, 'admin_order', locale, vars), refId: order.id,
  }));
  return results;
}

/** إرسال تجريبي (من صفحة الإعدادات) */
export async function sendTest({ channel, to }) {
  const settings = await getSettings();
  const text = `✅ رسالة اختبار من ${settings.salonNameAr}\nنظام الإشعارات يعمل بشكل صحيح.`;
  const n = await prisma.notification.create({
    data: { type: 'custom', channel, to: String(to || ''), title: 'رسالة اختبار', body: text, status: 'pending' },
  });
  return send(n.id);
}

export const notifyBookingCancel = (booking, locale = 'ar') => notifyBooking(booking, 'booking_cancel', locale);
