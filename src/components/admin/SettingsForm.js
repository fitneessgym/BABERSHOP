'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import ImageField from './ImageField';
import { makeT } from '@/lib/i18n';

const TABS = [
  { id: 'branding', icon: 'award' },
  { id: 'theme', icon: 'palette' },
  { id: 'home', icon: 'dashboard' },
  { id: 'contact', icon: 'phone' },
  { id: 'hours', icon: 'clock' },
  { id: 'booking', icon: 'calendar' },
  { id: 'store', icon: 'package' },
  { id: 'notify', icon: 'message' },
  { id: 'account', icon: 'shield' },
];

const FONTS = [
  { value: 'system', label: 'System (افتراضي)' },
  { value: 'cairo', label: 'Cairo' },
  { value: 'tajawal', label: 'Tajawal' },
  { value: 'amiri', label: 'Amiri (كلاسيكي)' },
  { value: 'modern', label: 'Modern / Inter' },
];

const TEMPLATE_EVENTS = {
  booking_confirm: { ar: 'تأكيد الحجز', en: 'Booking confirmation' },
  booking_reminder: { ar: 'تذكير الموعد', en: 'Appointment reminder' },
  booking_cancel: { ar: 'إلغاء الحجز', en: 'Booking cancelled' },
  order_new: { ar: 'طلب جديد', en: 'New order' },
  order_status: { ar: 'تحديث الطلب', en: 'Order status' },
  admin_booking: { ar: 'تنبيه: حجز', en: 'Alert: booking' },
  admin_order: { ar: 'تنبيه: طلب', en: 'Alert: order' },
};

export default function SettingsForm({ settings, locale, defaultTemplates = {}, admin }) {
  const DEFAULT_TEMPLATES_TEXT = defaultTemplates;
  const t = makeT(locale);
  const en = locale === 'en';
  const router = useRouter();
  const [tab, setTab] = useState('branding');
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tmplTab, setTmplTab] = useState('booking_confirm');
  const [testChannel, setTestChannel] = useState('whatsapp');
  const [testTo, setTestTo] = useState(s.whatsapp || '');
  const [testBusy, setTestBusy] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [pw, setPw] = useState({ name: admin?.name || '', email: admin?.email || '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  async function saveAccount() {
    setPwBusy(true); setPwErr(''); setPwMsg('');
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pw),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'error');
      setPwMsg(pw.newPassword ? t('admin.passwordChanged') : t('admin.accountSaved'));
      setPw({ ...pw, currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e) { setPwErr(e.message); } finally { setPwBusy(false); }
  }

  const templates = (() => { try { const a = JSON.parse(s.notifyTemplates || '{}'); return a && typeof a === 'object' ? a : {}; } catch { return {}; } })();

  function getTemplateValue(ev, lg) {
    return templates?.[ev]?.[lg] ?? DEFAULT_TEMPLATES_TEXT?.[ev]?.[lg] ?? '';
  }

  function setTemplateValue(ev, lg, value) {
    const next = { ...templates, [ev]: { ...(templates[ev] || {}), [lg]: value } };
    set('notifyTemplates', JSON.stringify(next));
  }

  async function sendTestMessage() {
    setTestBusy(true); setTestResult('');
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', channel: testChannel, to: testTo }),
      });
      const d = await res.json();
      if (d.link) { window.open(d.link, '_blank'); setTestResult('✅ ' + (en ? 'WhatsApp opened — send the message manually' : 'تم فتح واتساب — أرسل الرسالة يدوياً')); }
      else setTestResult(d.ok ? '✅ ' + (en ? 'Sent successfully' : 'تم الإرسال بنجاح') : '⚠️ ' + (d.error || (en ? 'Failed' : 'فشل الإرسال')));
    } catch (e) { setTestResult('⚠️ ' + e.message); } finally { setTestBusy(false); }
  }

  const set = (k, v) => {
    setS({ ...s, [k]: v });
    // معاينة حية للألوان
    const varMap = {
      primaryColor: '--primary', primaryDark: '--primary-dark', accentColor: '--accent',
      bgColor: '--bg', surfaceColor: '--surface', textColor: '--text', mutedColor: '--muted',
    };
    if (varMap[k] && typeof document !== 'undefined') document.documentElement.style.setProperty(varMap[k], v);
    if (k === 'borderRadius' && typeof document !== 'undefined') document.documentElement.style.setProperty('--radius', `${v}px`);
  };

  async function save() {
    setBusy(true); setMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s),
      });
      if (!res.ok) throw new Error('error');
      setMsg(t('admin.saved'));
      router.refresh();
      setTimeout(() => setMsg(''), 2600);
    } catch { setMsg('error'); } finally { setBusy(false); }
  }

  async function resetDemo() {
    if (!confirm(en ? 'Reset all data to demo content?' : 'إعادة تعيين كل البيانات للوضع التجريبي؟')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      setMsg(d.ok ? t('admin.saved') : ('⚠️ ' + (d.error || 'فشل')));
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setMsg('⚠️ ' + e.message); }
    setBusy(false);
    router.refresh();
  }

  const hours = (() => { try { const a = JSON.parse(s.workingHours); return Array.isArray(a) && a.length === 7 ? a : null; } catch { return null; } })()
    || [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '10:00', close: '22:00', off: false }));

  const setHour = (i, patch) => {
    const next = hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h));
    set('workingHours', JSON.stringify(next));
  };

  const features = (() => { try { const a = JSON.parse(s.features); return Array.isArray(a) ? a : []; } catch { return []; } })();
  const setFeature = (i, patch) => {
    const next = features.map((f, idx) => (idx === i ? { ...f, ...patch } : f));
    set('features', JSON.stringify(next));
  };

  const stats = (() => { try { const a = JSON.parse(s.stats); return Array.isArray(a) ? a : []; } catch { return []; } })();
  const setStat = (i, patch) => {
    const next = stats.map((x, idx) => (idx === i ? { ...x, ...patch } : x));
    set('stats', JSON.stringify(next));
  };

  const days = en
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const T = {
    branding: t('admin.branding'), theme: t('admin.theme'), home: t('admin.content'),
    contact: t('admin.contactInfo'), hours: t('admin.workingHours'),
    booking: t('admin.bookingSettings'), store: t('admin.storeSettings'),
    notify: t('notify.settingsTab'),
    account: t('admin.account'),
  };

  return (
    <div>
      <div className="flex justify-between items-center wrap gap-2 mb-3">
        <h1 className="section-title" style={{ fontSize: 26, margin: 0 }}>{t('admin.settings')}</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={resetDemo}><Icon name="refresh" size={15} /> {t('admin.seedData')}</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            <Icon name="save" size={16} /> {busy ? t('common.loading') : t('admin.saveSettings')}
          </button>
        </div>
      </div>

      {msg && <div className="alert alert-success"><Icon name="checkCircle" size={16} /> {msg}</div>}
      <div className="alert alert-info"><Icon name="settings" size={16} /> {t('admin.settingsHint')}</div>

      <div className="tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`tab ${tab === tb.id ? 'on' : ''}`} onClick={() => setTab(tb.id)}>
            <Icon name={tb.icon} size={15} /> {T[tb.id]}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          {/* ---------- الهوية ---------- */}
          {tab === 'branding' && (
            <div className="grid-form">
              <div className="field"><label className="label">{t('admin.salonName')} (ع)</label>
                <input className="input" value={s.salonNameAr} onChange={(e) => set('salonNameAr', e.target.value)} /></div>
              <div className="field"><label className="label">{t('admin.salonName')} (en)</label>
                <input className="input" value={s.salonNameEn} onChange={(e) => set('salonNameEn', e.target.value)} /></div>
              <div className="field"><label className="label">Tagline (ع)</label>
                <input className="input" value={s.taglineAr} onChange={(e) => set('taglineAr', e.target.value)} /></div>
              <div className="field"><label className="label">Tagline (en)</label>
                <input className="input" value={s.taglineEn} onChange={(e) => set('taglineEn', e.target.value)} /></div>
              <ImageField label={t('admin.logo')} value={s.logo} onChange={(v) => set('logo', v)} locale={locale} />
              <ImageField label={t('admin.heroImage')} value={s.heroImage} onChange={(v) => set('heroImage', v)} locale={locale} />
              <ImageField label={t('common.image') + ' — about'} value={s.aboutImage} onChange={(v) => set('aboutImage', v)} locale={locale} />
            </div>
          )}

          {/* ---------- الثيم ---------- */}
          {tab === 'theme' && (
            <div>
              <div className="grid-form">
                <ColorField label={t('admin.primaryColor')} value={s.primaryColor} onChange={(v) => set('primaryColor', v)} />
                <ColorField label="Primary Dark" value={s.primaryDark} onChange={(v) => set('primaryDark', v)} />
                <ColorField label={t('admin.accentColor')} value={s.accentColor} onChange={(v) => set('accentColor', v)} />
                <ColorField label={t('admin.bgColor')} value={s.bgColor} onChange={(v) => set('bgColor', v)} />
                <ColorField label={t('admin.surfaceColor') || 'Surface'} value={s.surfaceColor} onChange={(v) => set('surfaceColor', v)} />
                <ColorField label={t('admin.textColor')} value={s.textColor} onChange={(v) => set('textColor', v)} />
                <ColorField label="Muted" value={s.mutedColor} onChange={(v) => set('mutedColor', v)} />
                <div className="field">
                  <label className="label">{t('admin.fontFamily')}</label>
                  <select className="select" value={s.fontFamily} onChange={(e) => set('fontFamily', e.target.value)}>
                    {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">{t('admin.borderRadius')} — {s.borderRadius}px</label>
                  <input type="range" min="0" max="30" value={s.borderRadius} onChange={(e) => set('borderRadius', e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
              </div>

              <div className="card mt-3" style={{ padding: 22 }}>
                <h4 className="mb-2">معاينة سريعة</h4>
                <div className="flex gap-2 wrap items-center">
                  <span className="btn btn-primary btn-sm">زر أساسي</span>
                  <span className="btn btn-outline btn-sm">زر ثانوي</span>
                  <span className="badge badge-pending">شارة</span>
                  <span className="stars">★★★★★</span>
                  <span className="primary-text bold" style={{ fontSize: 22 }}>65 ₪</span>
                </div>
              </div>
            </div>
          )}

          {/* ---------- المحتوى ---------- */}
          {tab === 'home' && (
            <div>
              <div className="grid-form">
                <div className="field"><label className="label">{t('admin.heroTitle')} (ع)</label>
                  <input className="input" value={s.heroTitleAr} onChange={(e) => set('heroTitleAr', e.target.value)} /></div>
                <div className="field"><label className="label">{t('admin.heroTitle')} (en)</label>
                  <input className="input" value={s.heroTitleEn} onChange={(e) => set('heroTitleEn', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">{t('admin.heroSub')} (ع)</label>
                  <textarea className="textarea" value={s.heroSubAr} onChange={(e) => set('heroSubAr', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">{t('admin.heroSub')} (en)</label>
                  <textarea className="textarea" value={s.heroSubEn} onChange={(e) => set('heroSubEn', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">{t('admin.aboutText')} (ع)</label>
                  <textarea className="textarea" value={s.aboutAr} onChange={(e) => set('aboutAr', e.target.value)} /></div>
                <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">{t('admin.aboutText')} (en)</label>
                  <textarea className="textarea" value={s.aboutEn} onChange={(e) => set('aboutEn', e.target.value)} /></div>
              </div>

              <h4 className="mt-3 mb-2">{t('home.whyTitle')}</h4>
              {features.map((f, i) => (
                <div key={i} className="grid-form" style={{ gridTemplateColumns: '1fr 1fr 1fr 40px', alignItems: 'end' }}>
                  <div className="field"><label className="label">Icon</label>
                    <select className="select" value={f.icon} onChange={(e) => setFeature(i, { icon: e.target.value })}>
                      {['star', 'clock', 'users', 'heart', 'scissors', 'award', 'shield', 'sparkle', 'crown', 'droplet'].map((x) => <option key={x} value={x}>{x}</option>)}
                    </select></div>
                  <div className="field"><label className="label">{t('common.name')} (ع)</label>
                    <input className="input" value={f.titleAr} onChange={(e) => setFeature(i, { titleAr: e.target.value })} /></div>
                  <div className="field"><label className="label">{t('common.name')} (en)</label>
                    <input className="input" value={f.titleEn} onChange={(e) => setFeature(i, { titleEn: e.target.value })} /></div>
                  <span style={{ color: 'var(--primary)' }}><Icon name={f.icon} size={22} /></span>
                  <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">Text (ع)</label>
                    <input className="input" value={f.textAr || ''} onChange={(e) => setFeature(i, { textAr: e.target.value })} /></div>
                  <div style={{ gridColumn: '1/-1' }} className="field"><label className="label">Text (en)</label>
                    <input className="input" value={f.textEn || ''} onChange={(e) => setFeature(i, { textEn: e.target.value })} /></div>
                </div>
              ))}

              <h4 className="mt-3 mb-2">الإحصائيات</h4>
              {stats.map((st, i) => (
                <div key={i} className="grid-form" style={{ gridTemplateColumns: '100px 1fr 1fr' }}>
                  <div className="field"><label className="label">Value</label>
                    <input className="input" value={st.value} onChange={(e) => setStat(i, { value: e.target.value })} /></div>
                  <div className="field"><label className="label">{t('common.name')} (ع)</label>
                    <input className="input" value={st.labelAr} onChange={(e) => setStat(i, { labelAr: e.target.value })} /></div>
                  <div className="field"><label className="label">{t('common.name')} (en)</label>
                    <input className="input" value={st.labelEn} onChange={(e) => setStat(i, { labelEn: e.target.value })} /></div>
                </div>
              ))}
            </div>
          )}

          {/* ---------- التواصل ---------- */}
          {tab === 'contact' && (
            <div className="grid-form">
              <div className="field"><label className="label">{t('contact.phone')}</label>
                <input className="input" dir="ltr" value={s.phone} onChange={(e) => set('phone', e.target.value)} /></div>
              <div className="field"><label className="label">WhatsApp ({t('common.phone')})</label>
                <input className="input" dir="ltr" placeholder="97259xxxxxxx" value={s.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></div>
              <div className="field"><label className="label">{t('contact.email')}</label>
                <input className="input" dir="ltr" value={s.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="field"><label className="label">{t('contact.address')} (ع)</label>
                <input className="input" value={s.addressAr} onChange={(e) => set('addressAr', e.target.value)} /></div>
              <div className="field"><label className="label">{t('contact.address')} (en)</label>
                <input className="input" value={s.addressEn} onChange={(e) => set('addressEn', e.target.value)} /></div>
              <div className="field"><label className="label">Google Maps URL</label>
                <input className="input" dir="ltr" value={s.mapsUrl} onChange={(e) => set('mapsUrl', e.target.value)} /></div>
              <div className="field"><label className="label">Facebook</label>
                <input className="input" dir="ltr" value={s.facebook} onChange={(e) => set('facebook', e.target.value)} /></div>
              <div className="field"><label className="label">Instagram</label>
                <input className="input" dir="ltr" value={s.instagram} onChange={(e) => set('instagram', e.target.value)} /></div>
              <div className="field"><label className="label">TikTok</label>
                <input className="input" dir="ltr" value={s.tiktok} onChange={(e) => set('tiktok', e.target.value)} /></div>
              <div className="field"><label className="label">X</label>
                <input className="input" dir="ltr" value={s.x} onChange={(e) => set('x', e.target.value)} /></div>
              <div className="field"><label className="label">Snapchat</label>
                <input className="input" dir="ltr" value={s.snapchat} onChange={(e) => set('snapchat', e.target.value)} /></div>
            </div>
          )}

          {/* ---------- ساعات العمل ---------- */}
          {tab === 'hours' && (
            <div>
              <p className="small muted mb-2">هذه الساعات الافتراضية للصالون — يمكن لكل حلاق جدول خاص به من صفحة الحلاقين.</p>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                {hours.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ width: 90, fontWeight: 700 }}>{days[i]}</span>
                    <input className="input" type="time" value={h.open} disabled={h.off} onChange={(e) => setHour(i, { open: e.target.value })} style={{ width: 130 }} />
                    <span className="muted">—</span>
                    <input className="input" type="time" value={h.close} disabled={h.off} onChange={(e) => setHour(i, { close: e.target.value })} style={{ width: 130 }} />
                    <label className="checkbox-row" style={{ marginInlineStart: 'auto' }}>
                      <input type="checkbox" checked={!!h.off} onChange={(e) => setHour(i, { off: e.target.checked })} />
                      <span>{t('admin.closed')}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------- الحجز ---------- */}
          {tab === 'booking' && (
            <div className="grid-form">
              <div className="field"><label className="label">{t('admin.slotDuration')}</label>
                <select className="select" value={s.slotDuration} onChange={(e) => set('slotDuration', e.target.value)}>
                  {['15', '20', '30', '45', '60'].map((v) => <option key={v} value={v}>{v} {t('common.min')}</option>)}
                </select></div>
              <div className="field"><label className="label">{t('admin.maxAdvanceDays')}</label>
                <input className="input" type="number" min="1" max="365" value={s.maxAdvanceDays} onChange={(e) => set('maxAdvanceDays', e.target.value)} /></div>
              <div className="field"><label className="label">تأكيد الحجز تلقائياً</label>
                <select className="select" value={s.autoConfirm} onChange={(e) => set('autoConfirm', e.target.value)}>
                  <option value="1">{t('common.yes')}</option>
                  <option value="0">{t('common.no')}</option>
                </select></div>
            </div>
          )}

          {/* ---------- المتجر ---------- */}
          {tab === 'store' && (
            <div className="grid-form">
              <div className="field"><label className="label">تفعيل المتجر</label>
                <select className="select" value={s.storeEnabled} onChange={(e) => set('storeEnabled', e.target.value)}>
                  <option value="1">{t('common.yes')}</option>
                  <option value="0">{t('common.no')}</option>
                </select></div>
              <div className="field"><label className="label">العملة</label>
                <input className="input" value={s.currency} onChange={(e) => set('currency', e.target.value)} /></div>
              <div className="field"><label className="label">{t('admin.shippingCost')}</label>
                <input className="input" type="number" value={s.shippingCost} onChange={(e) => set('shippingCost', e.target.value)} /></div>
              <div className="field"><label className="label">{t('admin.freeShippingOver')}</label>
                <input className="input" type="number" value={s.freeShippingOver} onChange={(e) => set('freeShippingOver', e.target.value)} /></div>
              <div className="field"><label className="label">{t('admin.taxPercent')}</label>
                <input className="input" type="number" value={s.taxPercent} onChange={(e) => set('taxPercent', e.target.value)} /></div>
              <div className="field"><label className="label">إرسال الطلبات عبر واتساب</label>
                <select className="select" value={s.orderWhatsapp} onChange={(e) => set('orderWhatsapp', e.target.value)}>
                  <option value="1">{t('common.yes')}</option>
                  <option value="0">{t('common.no')}</option>
                </select></div>
            </div>
          )}

          {/* ---------- الإشعارات ---------- */}
          {tab === 'notify' && (
            <div>
              <h4 className="mb-2">{t('notify.channels')}</h4>
              <div className="grid-form">
                <Toggle label={t('notify.enableWhatsapp')} value={s.notifyWhatsapp} onChange={(v) => set('notifyWhatsapp', v)} locale={locale} />
                <Toggle label={t('notify.enableSms')} value={s.notifySms} onChange={(v) => set('notifySms', v)} locale={locale} />
                <Toggle label={t('notify.enableEmail')} value={s.notifyEmail} onChange={(v) => set('notifyEmail', v)} locale={locale} />
                <Toggle label={t('notify.reminder')} value={s.notifyReminder} onChange={(v) => set('notifyReminder', v)} locale={locale} />
                <div className="field"><label className="label">{t('notify.reminderHours')}</label>
                  <input className="input" type="number" min="1" max="72" value={s.reminderHours} onChange={(e) => set('reminderHours', e.target.value)} /></div>
                <div className="field"><label className="label">{t('notify.reminderChannel')}</label>
                  <select className="select" value={s.notifyReminderChannel} onChange={(e) => set('notifyReminderChannel', e.target.value)}>
                    <option value="whatsapp">{t('notify.chWhatsapp')}</option>
                    <option value="sms">{t('notify.chSms')}</option>
                  </select></div>
              </div>

              <h4 className="mt-3 mb-2">{t('notify.waSettings')}</h4>
              <div className="grid-form">
                <div className="field"><label className="label">{t('notify.provider')}</label>
                  <select className="select" value={s.waProvider} onChange={(e) => set('waProvider', e.target.value)}>
                    <option value="link">{t('notify.providerLink')}</option>
                    <option value="ultramsg">UltraMsg</option>
                    <option value="callmebot">CallMeBot</option>
                    <option value="twilio">Twilio</option>
                    <option value="webhook">Webhook مخصص</option>
                  </select></div>
                {s.waProvider === 'ultramsg' && (
                  <>
                    <div className="field"><label className="label">Instance ID</label>
                      <input className="input" dir="ltr" value={s.waInstanceId} onChange={(e) => set('waInstanceId', e.target.value)} /></div>
                    <div className="field"><label className="label">Token</label>
                      <input className="input" dir="ltr" value={s.waToken} onChange={(e) => set('waToken', e.target.value)} /></div>
                  </>
                )}
                {s.waProvider === 'callmebot' && (
                  <div className="field"><label className="label">API Key</label>
                    <input className="input" dir="ltr" value={s.waToken} onChange={(e) => set('waToken', e.target.value)} /></div>
                )}
                {s.waProvider === 'twilio' && (
                  <>
                    <div className="field"><label className="label">Account SID</label>
                      <input className="input" dir="ltr" value={s.twilioSid} onChange={(e) => set('twilioSid', e.target.value)} /></div>
                    <div className="field"><label className="label">Auth Token</label>
                      <input className="input" dir="ltr" value={s.twilioToken} onChange={(e) => set('twilioToken', e.target.value)} /></div>
                    <div className="field"><label className="label">From (whatsapp:+...)</label>
                      <input className="input" dir="ltr" value={s.twilioFrom} onChange={(e) => set('twilioFrom', e.target.value)} /></div>
                  </>
                )}
                {s.waProvider === 'webhook' && (
                  <div className="field"><label className="label">Webhook URL</label>
                    <input className="input" dir="ltr" value={s.notifyWebhook} onChange={(e) => set('notifyWebhook', e.target.value)} /></div>
                )}
              </div>

              <h4 className="mt-3 mb-2">{t('notify.smsSettings')}</h4>
              <div className="grid-form">
                <div className="field"><label className="label">{t('notify.provider')}</label>
                  <select className="select" value={s.smsProvider} onChange={(e) => set('smsProvider', e.target.value)}>
                    <option value="none">— معطّل —</option>
                    <option value="twilio">Twilio</option>
                    <option value="webhook">Webhook مخصص</option>
                  </select></div>
                {s.smsProvider === 'webhook' && (
                  <div className="field"><label className="label">Webhook URL</label>
                    <input className="input" dir="ltr" value={s.notifyWebhook} onChange={(e) => set('notifyWebhook', e.target.value)} /></div>
                )}
              </div>

              <h4 className="mt-3 mb-2">{t('notify.smtp')}</h4>
              <div className="grid-form">
                <div className="field"><label className="label">Host</label>
                  <input className="input" dir="ltr" value={s.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" /></div>
                <div className="field"><label className="label">Port</label>
                  <input className="input" dir="ltr" value={s.smtpPort} onChange={(e) => set('smtpPort', e.target.value)} /></div>
                <div className="field"><label className="label">User</label>
                  <input className="input" dir="ltr" value={s.smtpUser} onChange={(e) => set('smtpUser', e.target.value)} /></div>
                <div className="field"><label className="label">Password</label>
                  <input className="input" type="password" dir="ltr" value={s.smtpPass} onChange={(e) => set('smtpPass', e.target.value)} /></div>
                <div className="field"><label className="label">From</label>
                  <input className="input" dir="ltr" value={s.smtpFrom} onChange={(e) => set('smtpFrom', e.target.value)} /></div>
              </div>

              <h4 className="mt-3 mb-2">{t('notify.templates')}</h4>
              <div className="alert alert-info">{t('notify.templatesHint')}</div>
              <div className="tabs" style={{ marginBottom: 14 }}>
                {Object.keys(TEMPLATE_EVENTS).map((ev) => (
                  <button key={ev} className={`tab ${tmplTab === ev ? 'on' : ''}`} onClick={() => setTmplTab(ev)}>
                    {TEMPLATE_EVENTS[ev][en ? 'en' : 'ar']}
                  </button>
                ))}
              </div>
              {(['ar', 'en']).map((lg) => (
                <div className="field" key={lg}>
                  <label className="label">{lg === 'ar' ? 'النسخة العربية' : 'English version'}</label>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 150, direction: lg === 'ar' ? 'rtl' : 'ltr' }}
                    value={getTemplateValue(tmplTab, lg)}
                    onChange={(e) => setTemplateValue(tmplTab, lg, e.target.value)}
                  />
                </div>
              ))}

              <h4 className="mt-3 mb-2">{t('notify.test')}</h4>
              <div className="grid-form">
                <div className="field"><label className="label">{t('notify.channel')}</label>
                  <select className="select" value={testChannel} onChange={(e) => setTestChannel(e.target.value)}>
                    <option value="whatsapp">{t('notify.chWhatsapp')}</option>
                    <option value="sms">{t('notify.chSms')}</option>
                    <option value="email">{t('notify.chEmail')}</option>
                  </select></div>
                <div className="field"><label className="label">{t('notify.testTo')}</label>
                  <input className="input" dir="ltr" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="0599123456" /></div>
              </div>
              <button className="btn btn-outline" onClick={sendTestMessage} disabled={testBusy || !testTo}>
                <Icon name="arrow" size={16} /> {testBusy ? t('common.loading') : t('notify.test')}
              </button>
              {testResult && <div className={`alert ${testResult.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>{testResult}</div>}

              <div className="alert alert-info mt-3"><Icon name="clock" size={16} /> {t('notify.cronHint')}</div>
            </div>
          )}


          {/* ---------- الحساب والأمان ---------- */}
          {tab === 'account' && (
            <div>
              <h4 className="mb-2">{t('admin.account')}</h4>
              <div className="grid-form">
                <div className="field"><label className="label">{t('admin.adminName')}</label>
                  <input className="input" value={pw.name} onChange={(e) => setPw({ ...pw, name: e.target.value })} /></div>
                <div className="field"><label className="label">{t('admin.username')}</label>
                  <input className="input" type="email" dir="ltr" value={pw.email} onChange={(e) => setPw({ ...pw, email: e.target.value })} /></div>
              </div>

              <h4 className="mt-3 mb-2">{t('admin.security')}</h4>
              <div className="alert alert-info">{t('admin.passwordHint')}</div>
              {pwErr && <div className="alert alert-error"><Icon name="close" size={16} /> {pwErr}</div>}
              {pwMsg && <div className="alert alert-success"><Icon name="checkCircle" size={16} /> {pwMsg}</div>}

              <div className="grid-form">
                <div className="field"><label className="label">{t('admin.currentPassword')}</label>
                  <input className="input" type="password" dir="ltr" autoComplete="current-password"
                    value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
                <div className="field"><label className="label">{t('admin.newPassword')}</label>
                  <input className="input" type="password" dir="ltr" autoComplete="new-password" placeholder="6+ أحرف"
                    value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
                <div className="field"><label className="label">{t('admin.confirmPassword')}</label>
                  <input className="input" type="password" dir="ltr" autoComplete="new-password"
                    value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} /></div>
              </div>

              <button className="btn btn-primary" onClick={saveAccount} disabled={pwBusy}>
                <Icon name="shield" size={16} /> {pwBusy ? t('common.loading') : t('common.save')}
              </button>

              <div className="card mt-3" style={{ padding: 18, background: 'var(--surface-2)' }}>
                <b className="small">{locale === 'en' ? 'Tip' : 'معلومة'}</b>
                <p className="small muted mt-1">
                  {locale === 'en'
                    ? 'The login email and password are stored securely (hashed) in the database. If you ever get locked out, run: node scripts/reset-password.mjs NEWPASSWORD'
                    : 'البريد وكلمة المرور محفوظة مشفّرة في قاعدة البيانات. إن نسيتها يوماً ما، نفّذ هذا الأمر في مجلد المشروع: node scripts/reset-password.mjs كلمة_السر_الجديدة'}
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button className="btn btn-primary btn-lg" onClick={save} disabled={busy}>
          <Icon name="save" size={18} /> {t('admin.saveSettings')}
        </button>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="color-field">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} dir="ltr" />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange, locale }) {
  const t = makeT(locale);
  return (
    <div className="field">
      <label className="label">{label}</label>
      <select className="select" value={value === '1' || value === true ? '1' : '0'} onChange={(e) => onChange(e.target.value)}>
        <option value="1">{t('common.yes')}</option>
        <option value="0">{t('common.no')}</option>
      </select>
    </div>
  );
}
