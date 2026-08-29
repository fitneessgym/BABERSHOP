import { dayNames } from './i18n';
export { dayNames };

export const defaultSettings = {
  salonNameAr: 'صالون الأيهم',
  salonNameEn: 'Al-Ayham Salon',
  taglineAr: 'حيث الأناقة تلتقي بالاحترافية',
  taglineEn: 'Where style meets professionalism',
  logo: '',
  favicon: '',
  heroImage: '',
  heroTitleAr: 'حلاقة استثنائية.. تجربة لا تُنسى',
  heroTitleEn: 'An exceptional cut.. an unforgettable experience',
  heroSubAr: 'احجز مقعدك مع أمهر الحلاقين واستمتع بأجواء رجالية أصيلة وخدمة من الدرجة الأولى',
  heroSubEn: 'Reserve your chair with master barbers and enjoy an authentic men’s grooming experience',
  aboutAr: 'منذ أكثر من 15 عاماً ونحن نقدّم أرقى خدمات الحلاقة والعناية الرجالية. فريقنا من أمهر الحلاقين المحترفين، نستخدم أفضل الأدوات والمنتجات العالمية لنمنحك إطلالة تليق بك. راحتك هي أولويتنا، من لحظة دخولك حتى خروجك بأفضل حال.',
  aboutEn: 'For over 15 years we have delivered premium grooming services. Our team of master barbers uses the finest tools and global products to give you a look that fits you. Your comfort is our priority.',
  aboutImage: '',

  primaryColor: '#c8a15a',
  primaryDark: '#a9863f',
  accentColor: '#f0d9a0',
  bgColor: '#0d0d0f',
  surfaceColor: '#16161a',
  textColor: '#f4f2ee',
  mutedColor: '#9a978f',
  fontFamily: 'system',
  borderRadius: '14',

  phone: '+972 59-000-0000',
  whatsapp: '972590000000',
  email: 'info@alsalon.com',
  addressAr: 'بيت لحم - النحالين',
  addressEn: 'Bethlehem - Nahalin',
  mapsUrl: '',

  facebook: '',
  instagram: '',
  tiktok: '',
  snapchat: '',
  x: '',

  slotDuration: '30',
  maxAdvanceDays: '30',
  autoConfirm: '1',
  workingHours: JSON.stringify([
    { day: 0, open: '10:00', close: '22:00', off: false },
    { day: 1, open: '10:00', close: '22:00', off: false },
    { day: 2, open: '10:00', close: '22:00', off: false },
    { day: 3, open: '10:00', close: '22:00', off: false },
    { day: 4, open: '10:00', close: '23:00', off: false },
    { day: 5, open: '14:00', close: '23:00', off: false },
    { day: 6, open: '10:00', close: '23:00', off: false },
  ]),

  shippingCost: '25',
  freeShippingOver: '250',
  taxPercent: '0',
  currency: '₪',
  storeEnabled: '1',
  orderWhatsapp: '1',

  features: JSON.stringify([
    { icon: 'star', titleAr: 'جودة عالية', titleEn: 'Top Quality', textAr: 'أفضل المنتجات والأدوات العالمية', textEn: 'Best global tools and products' },
    { icon: 'clock', titleAr: 'سرعة ودقة', titleEn: 'Fast & Precise', textAr: 'احجز بضغطة زر بدون انتظار', textEn: 'Book in one tap, no waiting' },
    { icon: 'users', titleAr: 'حلاقون محترفون', titleEn: 'Expert Barbers', textAr: 'فريق بخبرة تتجاوز 15 عاماً', textEn: 'Team with 15+ years of experience' },
    { icon: 'heart', titleAr: 'تجربة مريحة', titleEn: 'Comfort First', textAr: 'أجواء رجالية أصيلة وخدمة راقية', textEn: 'Authentic atmosphere and premium service' },
  ]),

  // ---------- الإشعارات ----------
  notifyWhatsapp: '1',
  notifySms: '0',
  notifyEmail: '0',
  notifyReminder: '1',
  reminderHours: '24',
  notifyReminderChannel: 'whatsapp',
  waProvider: 'link',
  waInstanceId: '',
  waToken: '',
  smsProvider: 'none',
  twilioSid: '',
  twilioToken: '',
  twilioFrom: '',
  notifyWebhook: '',
  smtpHost: '',
  smtpPort: '587',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  notifyAdminPhone: '',

  stats: JSON.stringify([
    { value: '15+', labelAr: 'سنة خبرة', labelEn: 'Years Experience' },
    { value: '12K+', labelAr: 'عميل سعيد', labelEn: 'Happy Clients' },
    { value: '8', labelAr: 'حلاق محترف', labelEn: 'Expert Barbers' },
    { value: '20+', labelAr: 'خدمة مميزة', labelEn: 'Premium Services' },
  ]),
};

export const DEFAULT_TEMPLATES = {
  booking_confirm: {
    ar: 'مرحباً {name} 👋\nتم تأكيد حجزك في {salon}\n\n✂️ الخدمة: {service}\n👨‍🔧 الحلاق: {barber}\n📅 التاريخ: {date}\n⏰ الساعة: {time}\n🎫 رقم الحجز: {code}\n💰 السعر: {price} {currency}\n\nننتظرك! لأي تعديل اتصل بنا: {phone}',
    en: 'Hello {name} 👋\nYour booking at {salon} is confirmed\n\n✂️ Service: {service}\n👨‍🔧 Barber: {barber}\n📅 Date: {date}\n⏰ Time: {time}\n🎫 Code: {code}\n💰 Price: {price} {currency}\n\nSee you soon! To change: {phone}',
  },
  booking_reminder: {
    ar: 'تذكير لطيف ⏰\nعزيزي {name}، نذكّرك بموعدك في {salon}\n📅 {date} — ⏰ {time}\n✂️ {service} مع {barber}\n🎫 رقم الحجز: {code}\nللتعديل أو الإلغاء اتصل بنا: {phone}',
    en: 'Friendly reminder ⏰\nHi {name}, your appointment at {salon}\n📅 {date} — ⏰ {time}\n✂️ {service} with {barber}\n🎫 Code: {code}\nTo reschedule call: {phone}',
  },
  booking_cancel: {
    ar: 'عزيزي {name}، تم إلغاء حجزك رقم {code} في {salon}.\nنتطلع لخدمتك في وقت آخر ❤️\n{phone}',
    en: 'Dear {name}, your booking {code} at {salon} has been cancelled.\nWe hope to see you another time ❤️\n{phone}',
  },
  order_new: {
    ar: 'شكراً لطلبك من {salon} 🛍️\n🎫 رقم الطلب: {code}\n💰 الإجمالي: {total} {currency}\n📦 الحالة: جديد\nسنتصل بك قريباً لتأكيد التوصيل. شكراً لثقتك ❤️',
    en: 'Thanks for your order from {salon} 🛍️\n🎫 Order: {code}\n💰 Total: {total} {currency}\n📦 Status: new\nWe will call you soon to confirm delivery ❤️',
  },
  order_status: {
    ar: 'تحديث بخصوص طلبك {code} من {salon}:\n📦 الحالة الآن: {status}\nشكراً لتسوقك معنا ❤️',
    en: 'Update on your order {code} from {salon}:\n📦 Status: {status}\nThank you for shopping with us ❤️',
  },
  admin_booking: {
    ar: 'حجز جديد: {name} — {service} — {date} {time} — {phone}',
    en: 'New booking: {name} — {service} — {date} {time} — {phone}',
  },
  admin_order: {
    ar: 'طلب جديد: {code} — {name} — {total} {currency}',
    en: 'New order: {code} — {name} — {total} {currency}',
  },
};

import { list, upsert } from './supabase';

export async function getSettings() {
  try {
    const rows = await list('settings');
    const s = { ...defaultSettings };
    rows.forEach((r) => { s[r.key] = r.value; });
    return s;
  } catch (e) {
    return { ...defaultSettings };
  }
}

export async function saveSettings(obj) {
  const keys = Object.keys(obj);
  for (const k of keys) {
    await upsert('settings', { key: k, value: String(obj[k] ?? '') }, 'key');
  }
  return true;
}

export function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

export function workingHours(s) {
  const wh = parseJSON(s.workingHours, []);
  if (!Array.isArray(wh) || wh.length !== 7) return parseJSON(defaultSettings.workingHours, []);
  return wh;
}

export function salonName(s, locale) {
  return (locale === 'en' ? s.salonNameEn : s.salonNameAr) || s.salonNameAr;
}

export const fontOptions = {
  system: "'Segoe UI', Tahoma, 'Noto Kufi Arabic', 'Cairo', system-ui, sans-serif",
  cairo: "'Cairo', 'Noto Kufi Arabic', 'Segoe UI', sans-serif",
  tajawal: "'Tajawal', 'Noto Kufi Arabic', 'Segoe UI', sans-serif",
  amiri: "'Amiri', 'Noto Naskh Arabic', serif",
  modern: "'Inter', 'Segoe UI', system-ui, sans-serif",
};
