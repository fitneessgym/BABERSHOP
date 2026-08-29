'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../Icon';
import { makeT } from '@/lib/i18n';

export default function LoginForm({ locale }) {
  const t = makeT(locale);
  const router = useRouter();
  const [form, setForm] = useState({ email: process.env.NEXT_PUBLIC_ADMIN_HINT || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || t('admin.wrongCreds'));
      }
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="alert alert-error"><Icon name="close" size={16} /> {error}</div>}
      <div className="field">
        <label className="label">{t('admin.username')}</label>
        <input className="input" type="email" dir="ltr" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@salon.com" />
      </div>
      <div className="field">
        <label className="label">{t('admin.password')}</label>
        <input className="input" type="password" dir="ltr" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
      </div>
      <button className="btn btn-primary btn-block" disabled={loading}>
        {loading ? t('common.loading') : (<><Icon name="logout" size={17} /> {t('admin.loginBtn')}</>)}
      </button>
    </form>
  );
}
