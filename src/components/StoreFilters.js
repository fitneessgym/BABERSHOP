'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Icon from './Icon';
import { makeT } from '@/lib/i18n';

export default function StoreFilters({ locale, categories, current }) {
  const t = makeT(locale);
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(current.q || '');

  function push(params) {
    const sp = new URLSearchParams({ ...current, ...params });
    Object.keys(current).forEach(() => {});
    ['q', 'cat', 'sort'].forEach((k) => { if (!sp.get(k)) sp.delete(k); });
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="filters">
      <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
        <input
          className="input w-full"
          placeholder={t('common.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && push({ q })}
          style={{ paddingInlineStart: 38 }}
        />
        <span style={{ position: 'absolute', insetInlineStart: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
          <Icon name="search" size={16} />
        </span>
      </div>

      <select className="select" value={current.cat || ''} onChange={(e) => push({ cat: e.target.value })}>
        <option value="">{t('common.all')}</option>
        {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
      </select>

      <select className="select" value={current.sort || ''} onChange={(e) => push({ sort: e.target.value })}>
        <option value="">{t('store.sortDefault')}</option>
        <option value="asc">{t('store.sortPriceAsc')}</option>
        <option value="desc">{t('store.sortPriceDesc')}</option>
      </select>

      {(current.q || current.cat || current.sort) && (
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(pathname)}>
          <Icon name="close" size={15} /> {t('common.cancel')}
        </button>
      )}
    </div>
  );
}
