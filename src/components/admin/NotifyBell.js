'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

export default function NotifyBell({ locale }) {
  const t = makeT(locale);
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/notifications?limit=12');
      const d = await res.json();
      setItems((d.rows || []).slice(0, 8));
    } catch {}
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000); // تحديث كل ٣٠ ثانية
    return () => clearInterval(iv);
  }, []);

  async function openAll() {
    setOpen(!open);
    if (!open) {
      await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', ids: items.map((i) => i.id) }),
      });
      load();
      router.refresh();
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={openAll} title={t('admin.notifications')}>
        <Icon name="message" size={17} />
        {items.filter((i) => !i.read).length > 0 && (
          <span className="cart-count">{items.filter((i) => !i.read).length}</span>
        )}
      </button>

      {open && (
        <>
          <div className="overlay" style={{ background: 'transparent' }} onClick={() => setOpen(false)} />
          <div className="card" style={{
            position: 'absolute', insetInlineEnd: 0, top: 48, width: 340, zIndex: 900,
            boxShadow: 'var(--shadow)', padding: 0, maxHeight: 420, overflowY: 'auto',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b className="small">{t('admin.notifications')}</b>
              <a href="/admin/notifications" className="small primary-text">{t('common.viewAll')}</a>
            </div>
            {items.length === 0 && <div className="empty" style={{ padding: 26 }}><p className="small">{t('notify.empty')}</p></div>}
            {items.map((n) => (
              <a
                key={n.id} href="/admin/notifications"
                style={{ display: 'block', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'rgba(200,161,90,0.06)' }}
              >
                <div className="flex justify-between gap-2">
                  <b className="small">{n.type === 'admin_order' ? t('notify.tyAdminOrder') : n.type === 'admin_booking' ? t('notify.tyAdminBooking') : n.type}</b>
                  <span className="small muted">{new Date(n.createdAt).toLocaleTimeString(locale === 'en' ? 'en-GB' : 'ar', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{n.body.slice(0, 90)}</div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
