'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

const ROLES = [
  { value: 'owner', labelKey: 'admin.roleOwner', badge: 'completed' },
  { value: 'admin', labelKey: 'admin.roleAdmin', badge: 'confirmed' },
  { value: 'staff', labelKey: 'admin.roleStaff', badge: 'gray' },
];

export default function UsersManager({ users, me, locale }) {
  const t = makeT(locale);
  const router = useRouter();
  const [list, setUsers] = useState(users);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const isOwner = me?.role === 'owner';

  const roleLabel = (r) => t(ROLES.find((x) => x.value === r)?.labelKey || 'admin.roleStaff');
  const roleBadge = (r) => ROLES.find((x) => x.value === r)?.badge || 'gray';

  async function save() {
    setBusy(true); setErr('');
    try {
      const isEdit = modal.mode === 'edit';
      const payload = {
        action: isEdit ? 'update' : 'create',
        id: modal.data.id,
        data: { ...modal.data },
      };
      if (isEdit && !modal.data.password) delete payload.data.password;
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setModal(null);
      setMsg(t('admin.userCreated'));
      setTimeout(() => setMsg(''), 2600);
      router.refresh();
      await reload();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  async function reload() {
    const res = await fetch('/api/admin/users');
    const d = await res.json();
    if (d.users) setUsers(d.users);
  }

  async function toggleActive(u) {
    await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: u.id, data: { active: !u.active } }),
    });
    await reload();
    router.refresh();
  }

  async function remove(u) {
    if (!confirm(t('admin.confirmDelete'))) return;
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: u.id }),
    });
    const d = await res.json();
    if (!res.ok) { setErr(d.error); setTimeout(() => setErr(''), 3000); return; }
    await reload();
    router.refresh();
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3><Icon name="shield" size={17} className="primary-text" /> {t('admin.users')} <span className="badge badge-gray">{list.length}</span></h3>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'create', data: { name: '', email: '', password: '', role: 'staff', active: true } })}>
          <Icon name="plus" size={15} /> {t('admin.addUser')}
        </button>
      </div>

      <div className="admin-card-body">
        {msg && <div className="alert alert-success"><Icon name="checkCircle" size={16} /> {msg}</div>}
        {err && <div className="alert alert-error"><Icon name="close" size={16} /> {err}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.email')}</th>
                <th>{t('admin.userRole')}</th>
                <th>{t('admin.lastLogin')}</th>
                <th>{t('common.active')}</th>
                <th style={{ textAlign: 'end' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} style={u.id === me?.id ? { background: 'rgba(200,161,90,0.05)' } : {}}>
                  <td>
                    <b>{u.name}</b>
                    {u.id === me?.id && <span className="badge badge-pending" style={{ marginInlineStart: 8 }}>{t('admin.currentUser')}</span>}
                  </td>
                  <td dir="ltr" className="small">{u.email}</td>
                  <td><span className={`badge badge-${roleBadge(u.role)}`}>{roleLabel(u.role)}</span></td>
                  <td className="small muted">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString(locale === 'en' ? 'en-GB' : 'ar') : t('admin.never')}
                  </td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={!!u.active} disabled={!isOwner || u.role === 'owner'} onChange={() => toggleActive(u)} />
                      <span />
                    </label>
                  </td>
                  <td style={{ textAlign: 'end' }}>
                    <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setModal({ mode: 'edit', data: { ...u, password: '' } })}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        className="icon-btn" style={{ width: 32, height: 32, color: u.id === me?.id || !isOwner ? '#666' : '#f85149' }}
                        disabled={u.id === me?.id || !isOwner}
                        onClick={() => remove(u)}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6}><div className="empty"><Icon name="users" size={40} /><p>{t('common.empty')}</p></div></td></tr>}
            </tbody>
          </table>
        </div>

        <p className="small muted mt-2"><Icon name="shield" size={13} /> {t('admin.ownerHint')}</p>
      </div>

      {modal && (
        <div className="modal">
          <div className="overlay" onClick={() => setModal(null)} />
          <div className="modal-box">
            <div className="modal-head">
              <b>{modal.mode === 'edit' ? t('admin.editUser') : t('admin.addUser')}</b>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="field"><label className="label">{t('common.name')}</label>
                <input className="input" value={modal.data.name || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} /></div>
              <div className="field"><label className="label">{t('common.email')}</label>
                <input className="input" type="email" dir="ltr" value={modal.data.email || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} /></div>
              <div className="field">
                <label className="label">{modal.mode === 'edit' ? `${t('admin.newPassword')} (${t('common.optional')})` : t('admin.newPassword')}</label>
                <input className="input" type="password" dir="ltr" value={modal.data.password || ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })} placeholder={modal.mode === 'edit' ? 'اتركه فارغاً دون تغيير' : '6+ أحرف'} />
              </div>
              <div className="field">
                <label className="label">{t('admin.userRole')}</label>
                <select className="select" value={modal.data.role} disabled={!isOwner} onChange={(e) => setModal({ ...modal, data: { ...modal.data, role: e.target.value } })}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{t(r.labelKey)}</option>)}
                </select>
              </div>
              {modal.mode === 'edit' && isOwner && modal.data.role !== 'owner' && (
                <label className="checkbox-row">
                  <input type="checkbox" checked={!!modal.data.active} onChange={(e) => setModal({ ...modal, data: { ...modal.data, active: e.target.checked } })} />
                  <span className="label">{t('common.active')}</span>
                </label>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                <Icon name="save" size={16} /> {busy ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
