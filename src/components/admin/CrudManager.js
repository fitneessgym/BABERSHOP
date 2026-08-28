'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import SmartImage from '../SmartImage';
import ImageField from './ImageField';
import { makeT } from '@/lib/i18n';

const ICONS = ['scissors', 'razor', 'beard', 'crown', 'child', 'palette', 'sparkle', 'droplet', 'star', 'heart', 'users', 'clock'];

export default function CrudManager({
  model, locale, rows, fields, columns, title, addLabel,
  searchKeys = ['nameAr', 'nameEn'], extra = {}, extraData = {}, hideAdd = false, note = '',
}) {
  const t = makeT(locale);
  const router = useRouter();
  const en = locale === 'en';
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('');

  const empty = () => {
    const d = {};
    fields.forEach((f) => { d[f.name] = f.default !== undefined ? f.default : ''; });
    return d;
  };

  const filtered = rows.filter((r) => {
    if (q) {
      const hay = searchKeys.map((k) => String(r[k] ?? '')).join(' ').toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (filter && r[filter.key] !== filter.value) return false;
    return true;
  });

  async function save() {
    setBusy(true); setErr('');
    try {
      const payload = {
        action: modal.mode === 'edit' ? 'update' : 'create',
        id: modal.data.id,
        data: modal.data,
        serviceIds: modal.data._serviceIds,
      };
      delete modal.data._serviceIds;
      const res = await fetch(`/api/admin/${model}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setModal(null);
      router.refresh();
    } catch (e) {
      setErr(e.message);
    } finally { setBusy(false); }
  }

  async function remove(row) {
    if (!confirm(t('admin.confirmDelete'))) return;
    setBusy(true);
    await fetch(`/api/admin/${model}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: row.id }),
    });
    setBusy(false);
    router.refresh();
  }

  async function toggle(row, key) {
    await fetch(`/api/admin/${model}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: row.id, data: { [key]: !row[key] } }),
    });
    router.refresh();
  }

  function exportCSV() {
    const cols = columns.filter((c) => c.type !== 'actions' && c.type !== 'img');
    const head = cols.map((c) => c.label);
    const body = filtered.map((r) => cols.map((c) => {
      const v = raw(r, c);
      return typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v ?? '').replace(/"/g, '""');
    }));
    const csv = [head, ...body].map((r) => r.map((x) => `"${x}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${model}.csv`; a.click();
  }

  function raw(r, c) {
    if (c.type === 'len') return (r[c.of] || []).length;
    if (c.ar && c.en) return en ? r[c.en] : r[c.ar];
    return r[c.key];
  }

  function cell(r, c) {
    const v = raw(r, c);
    switch (c.type) {
      case 'img':
        return <SmartImage src={v} alt="" className="t-img" label="IMG" />;
      case 'localized':
        return <b>{v}</b>;
      case 'len':
        return <span>{v}</span>;
      case 'badge':
        return <span className={`badge badge-${(c.badgeMap && c.badgeMap[v]) || 'gray'}`}>{(c.labelMap && c.labelMap[v]) || v || '-'}</span>;
      case 'map':
        return <span>{(c.labelMap && c.labelMap[v]) || v || '-'}</span>;
      case 'price':
        return <b style={{ color: 'var(--primary)' }}>{v} {c.currency || '\u20aa'}</b>;
      case 'duration':
        return <span dir="ltr">{v} {c.unit || t('common.min')}</span>;
      case 'suffix':
        return <span dir="ltr">{v} {c.suffix}</span>;
      case 'bool':
        return (
          <label className="switch">
            <input type="checkbox" checked={!!v} onChange={() => toggle(r, c.key)} />
            <span />
          </label>
        );
      case 'stars':
        return <span style={{ color: 'var(--primary)', letterSpacing: 2 }}>{'\u2605'.repeat(Math.round(v || 0))}</span>;
      case 'date':
        return <span dir="ltr" className="small">{String(v || '').slice(0, 10)}</span>;
      case 'number':
        return <span style={{ color: c.low !== undefined && v <= c.low ? '#f85149' : undefined, fontWeight: 700 }}>{v}</span>;
      case 'truncate':
        return <span className="small muted">{String(v || '').slice(0, c.max || 50)}{(String(v || '').length > (c.max || 50)) ? '...' : ''}</span>;
      case 'code':
        return <b dir="ltr" style={{ color: 'var(--primary)' }}>{v}</b>;
      case 'actions':
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="icon-btn" onClick={() => setModal({ mode: 'edit', data: { ...r, _serviceIds: (r.services || []).map((x) => x.serviceId || x) } })} style={{ width: 32, height: 32 }}>
              <Icon name="edit" size={14} />
            </button>
            <button className="icon-btn" onClick={() => remove(r)} style={{ width: 32, height: 32, color: '#f85149' }}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        );
      default:
        return <span>{String(v ?? '-')}</span>;
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h3><Icon name="package" size={17} className="primary-text" /> {title} <span className="badge badge-gray">{filtered.length}</span></h3>
        <div className="flex gap-1 wrap">
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}><Icon name="download" size={14} /> {t('admin.export')}</button>
          {!hideAdd && (
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'create', data: empty() })}>
              <Icon name="plus" size={15} /> {addLabel || t('common.add')}
            </button>
          )}
        </div>
      </div>

      <div className="admin-card-body">
        <div className="filters">
          <input className="input" placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 200 }} />
          {extra.filters?.map((f) => (
            <select key={f.key} className="select" value={filter?.value || ''} onChange={(e) => setFilter(e.target.value ? { key: f.key, value: e.target.value } : '')}>
              <option value="">{f.label}</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {note && <div className="alert alert-info">{note}</div>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((c) => <th key={c.key} style={c.type === 'actions' ? { textAlign: 'end' } : {}}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.key}>{cell(r, c)}</td>)}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length}>
                  <div className="empty"><Icon name="package" size={40} /><p>{t('common.empty')}</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal">
          <div className="overlay" onClick={() => setModal(null)} />
          <div className="modal-box">
            <div className="modal-head">
              <b>{modal.mode === 'edit' ? t('common.edit') : t('common.add')} — {title}</b>
              <button className="icon-btn" onClick={() => setModal(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="modal-body">
              {err && <div className="alert alert-error">{err}</div>}
              <div className="grid-form">
                {fields.map((f) => {
                  const val = modal.data[f.name];
                  const wide = f.wide || f.type === 'textarea' || f.type === 'schedule' || f.type === 'multiselect';
                  return (
                    <div key={f.name} style={{ gridColumn: wide ? '1 / -1' : undefined }}>
                      {f.type === 'image' ? (
                        <ImageField label={f.label} value={val} onChange={(v) => setModal({ ...modal, data: { ...modal.data, [f.name]: v } })} locale={locale} />
                      ) : f.type === 'checkbox' ? (
                        <label className="checkbox-row" style={{ marginBottom: 12, marginTop: 24 }}>
                          <input type="checkbox" checked={!!val} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.checked } })} />
                          <span className="label">{f.label}</span>
                        </label>
                      ) : f.type === 'textarea' ? (
                        <div className="field">
                          <label className="label">{f.label}</label>
                          <textarea className="textarea" value={val ?? ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })} />
                        </div>
                      ) : f.type === 'select' ? (
                        <div className="field">
                          <label className="label">{f.label}</label>
                          <select className="select" value={val ?? ''} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })}>
                            <option value="">—</option>
                            {(f.options || []).map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
                          </select>
                        </div>
                      ) : f.type === 'icon' ? (
                        <div className="field">
                          <label className="label">{f.label}</label>
                          <select className="select" value={val || 'scissors'} onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: e.target.value } })}>
                            {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                          </select>
                          <div style={{ marginTop: 8, color: 'var(--primary)' }}><Icon name={val || 'scissors'} size={26} /></div>
                        </div>
                      ) : f.type === 'multiselect' ? (
                        <div className="field">
                          <label className="label">{f.label}</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 6, background: 'var(--surface-2)', padding: 12, borderRadius: 11, border: '1px solid var(--border)' }}>
                            {(extraData[f.source] || []).map((o) => {
                              const ids = modal.data._serviceIds || [];
                              const checked = ids.includes(o.id);
                              return (
                                <label className="checkbox-row small" key={o.id}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = e.target.checked ? [...ids, o.id] : ids.filter((x) => x !== o.id);
                                      setModal({ ...modal, data: { ...modal.data, _serviceIds: next } });
                                    }}
                                  />
                                  <span>{en ? o.nameEn : o.nameAr}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : f.type === 'schedule' ? (
                        <ScheduleField
                          label={f.label} locale={locale} en={en}
                          value={val}
                          onChange={(v) => setModal({ ...modal, data: { ...modal.data, [f.name]: v } })}
                        />
                      ) : (
                        <div className="field">
                          <label className="label">{f.label}</label>
                          <input
                            className="input"
                            type={f.type === 'number' || f.type === 'price' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
                            dir={f.dir || undefined}
                            step={f.type === 'price' ? '0.5' : undefined}
                            value={val ?? ''}
                            onChange={(e) => setModal({ ...modal, data: { ...modal.data, [f.name]: f.type === 'number' || f.type === 'price' ? Number(e.target.value) : e.target.value } })}
                            placeholder={f.placeholder || ''}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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

function ScheduleField({ label, value, onChange, locale, en }) {
  const t = makeT(locale);
  const days = en
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  let arr;
  try { arr = value ? JSON.parse(value) : null; } catch { arr = null; }
  if (!Array.isArray(arr) || arr.length !== 7) {
    arr = [...Array(7)].map((_, i) => ({ day: i, open: '10:00', close: '22:00', off: false }));
  }

  const upd = (i, patch) => {
    const next = arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d));
    onChange(JSON.stringify(next));
  };

  return (
    <div className="field">
      <label className="label">{label}</label>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 11, padding: 12 }}>
        {arr.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: i < 6 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ width: 74, fontWeight: 700, fontSize: 13 }}>{days[i]}</span>
            <input className="input" type="time" value={d.open} disabled={d.off} onChange={(e) => upd(i, { open: e.target.value })} style={{ width: 120, padding: '7px 10px' }} />
            <span className="muted">—</span>
            <input className="input" type="time" value={d.close} disabled={d.off} onChange={(e) => upd(i, { close: e.target.value })} style={{ width: 120, padding: '7px 10px' }} />
            <label className="checkbox-row small" style={{ marginInlineStart: 'auto' }}>
              <input type="checkbox" checked={!!d.off} onChange={(e) => upd(i, { off: e.target.checked })} />
              <span>{t('admin.closed')}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
