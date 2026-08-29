'use client';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

export default function MessagesManager({ rows, locale }) {
  const t = makeT(locale);
  const router = useRouter();

  async function toggleRead(m) {
    await fetch('/api/admin/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: m.id, data: { read: !m.read } }),
    });
    router.refresh();
  }

  async function remove(m) {
    if (!confirm(t('admin.confirmDelete'))) return;
    await fetch('/api/admin/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: m.id }),
    });
    router.refresh();
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3><Icon name="message" size={17} className="primary-text" /> {t('contact.form')} <span className="badge badge-gray">{rows.length}</span></h3>
      </div>
      <div className="admin-card-body">
        <div className="col gap-2">
          {rows.length === 0 && <div className="empty"><Icon name="message" size={40} /><p>{t('common.empty')}</p></div>}
          {rows.map((m) => (
            <div key={m.id} className="card" style={{ padding: 16, borderColor: m.read ? 'var(--border)' : 'var(--primary)' }}>
              <div className="flex justify-between items-center gap-2 wrap">
                <div>
                  <b>{m.name}</b>
                  <span className="small muted" style={{ marginInlineStart: 10 }} dir="ltr">{m.phone}</span>
                  {m.email && <span className="small muted" style={{ marginInlineStart: 10 }} dir="ltr">{m.email}</span>}
                  <div className="small muted">{new Date(m.createdAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ar')}</div>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleRead(m)}>
                    <Icon name={m.read ? 'mail' : 'checkCircle'} size={14} /> {m.read ? t('admin.stPending') : t('admin.stCompleted')}
                  </button>
                  <button className="icon-btn" onClick={() => remove(m)} style={{ width: 32, height: 32, color: '#f85149' }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
              <p style={{ marginTop: 10, color: '#d8d5cd' }}>{m.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
