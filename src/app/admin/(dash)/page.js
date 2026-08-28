import Link from 'next/link';
import prisma from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { getAdminLocale } from '@/lib/locale';
import { makeT } from '@/lib/i18n';
import Icon from '@/components/Icon';
import { Stars } from '@/components/Icon';

export const dynamic = 'force-dynamic';

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default async function AdminDashboard() {
  const locale = await getAdminLocale();
  const t = makeT(locale);
  const en = locale === 'en';
  const settings = await getSettings();
  const today = fmt(new Date());

  const [todayList, allBookings, allOrders, services, barbers, products, msgs] = await Promise.all([
    prisma.booking.findMany({ where: { date: today }, orderBy: { time: 'asc' } }),
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { items: true } }),
    prisma.service.findMany({ orderBy: { sort: 'asc' } }),
    prisma.barber.findMany({ orderBy: { sort: 'asc' } }),
    prisma.product.findMany({ orderBy: { stock: 'asc' }, take: 8 }),
    prisma.message.count({ where: { read: false } }),
  ]);

  const activeBookings = allBookings.filter((b) => b.status !== 'cancelled');
  const ordersAll = await prisma.order.findMany();
  const revenueB = activeBookings.reduce((s, b) => s + b.price, 0);
  const revenueO = ordersAll.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const customers = new Set(allBookings.map((b) => b.phone)).size;

  // حجوزات آخر ٧ أيام
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = fmt(d);
    week.push({ label: en ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : d.toLocaleDateString('ar', { weekday: 'short' }), count: allBookings.filter((b) => b.date === ds).length });
  }
  const maxWeek = Math.max(1, ...week.map((w) => w.count));

  // أكثر الخدمات طلباً
  const counts = {};
  allBookings.forEach((b) => { counts[b.serviceId] = (counts[b.serviceId] || 0) + 1; });
  const topServices = services
    .map((s) => ({ ...s, c: counts[s.id] || 0 }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);
  const maxTop = Math.max(1, ...topServices.map((s) => s.c));

  const statusLabel = (s) => ({
    pending: t('admin.stPending'), confirmed: t('admin.stConfirmed'),
    completed: t('admin.stCompleted'), cancelled: t('admin.stCancelled'),
  }[s] || s);

  const stats = [
    { icon: 'calendar', v: todayList.length, l: t('admin.todayAppointments'), c: 'var(--primary)', bg: 'rgba(200,161,90,0.14)', href: '/admin/appointments' },
    { icon: 'wallet', v: `${(revenueB + revenueO).toFixed(0)} ${settings.currency}`, l: t('admin.totalRevenue'), c: '#3fb950', bg: 'rgba(46,160,67,0.14)', href: '/admin/orders' },
    { icon: 'users', v: customers, l: t('admin.customers'), c: '#58a6ff', bg: 'rgba(56,139,253,0.14)', href: '/admin/appointments' },
    { icon: 'cart', v: ordersAll.filter((o) => o.status === 'new').length, l: t('admin.newOrders'), c: '#a371f7', bg: 'rgba(163,113,247,0.14)', href: '/admin/orders' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center wrap gap-2 mb-3">
        <h1 className="section-title" style={{ fontSize: 26, margin: 0 }}>{t('admin.dashboard')}</h1>
        <Link href="/admin/settings" className="btn btn-outline btn-sm"><Icon name="settings" size={15} /> {t('admin.settings')}</Link>
      </div>

      <div className="stats-grid mb-3">
        {stats.map((s, i) => (
          <Link key={i} href={s.href} className="stat-card">
            <div className="si" style={{ background: s.bg, color: s.c }}><Icon name={s.icon} size={24} /></div>
            <div>
              <div className="sv" style={{ color: s.c }}>{s.v}</div>
              <div className="sl">{s.l}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="two-col" style={{ gap: 22 }}>
        <div>
          <div className="admin-card">
            <div className="admin-card-head">
              <h3><Icon name="dashboard" size={17} className="primary-text" /> {t('admin.weekChart')}</h3>
              <span className="small muted">{allBookings.length} {t('admin.totalBookings')}</span>
            </div>
            <div className="admin-card-body">
              <div className="chart">
                {week.map((w, i) => (
                  <div className="chart-bar" key={i}>
                    <span className="val">{w.count || ''}</span>
                    <div className="bar" style={{ height: `${(w.count / maxWeek) * 100}%` }} />
                    <span>{w.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head">
              <h3><Icon name="clock" size={17} className="primary-text" /> {t('admin.todayAppointments')}</h3>
              <Link href="/admin/appointments" className="small primary-text">{t('common.viewAll')}</Link>
            </div>
            <div className="admin-card-body">
              {todayList.length === 0 ? (
                <div className="empty"><Icon name="calendar" size={38} /><p>{t('common.empty')}</p></div>
              ) : (
                <div className="timeline">
                  {todayList.map((b) => (
                    <div className="tl-item" key={b.id} style={{ borderInlineStartColor: b.status === 'cancelled' ? '#f85149' : b.status === 'completed' ? '#3fb950' : 'var(--primary)' }}>
                      <span className="tl-time" dir="ltr">{b.time}</span>
                      <div style={{ flex: 1 }}>
                        <b>{b.customerName}</b>
                        <div className="small muted">{b.serviceName} · {b.barberName || t('booking.anyBarber')}</div>
                      </div>
                      <span className="small muted" dir="ltr">{b.phone}</span>
                      <span className={`badge badge-${b.status}`}>{statusLabel(b.status)}</span>
                      <b className="primary-text">{b.price} {settings.currency}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head">
              <h3><Icon name="cart" size={17} className="primary-text" /> {t('admin.recentOrders')}</h3>
              <Link href="/admin/orders" className="small primary-text">{t('common.viewAll')}</Link>
            </div>
            <div className="admin-card-body">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>{t('admin.customer')}</th><th>{t('admin.items')}</th><th>{t('common.total')}</th><th>{t('common.status')}</th></tr></thead>
                  <tbody>
                    {allOrders.map((o) => (
                      <tr key={o.id}>
                        <td dir="ltr"><b className="primary-text">{o.code}</b></td>
                        <td>{o.customerName}</td>
                        <td>{o.items?.length || 0}</td>
                        <td><b>{o.total} {settings.currency}</b></td>
                        <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                      </tr>
                    ))}
                    {allOrders.length === 0 && <tr><td colSpan={5}><div className="empty"><p>{t('common.empty')}</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="admin-card">
            <div className="admin-card-head"><h3><Icon name="star" size={17} className="primary-text" /> {t('admin.topServices')}</h3></div>
            <div className="admin-card-body">
              <div className="col gap-2">
                {topServices.map((s) => (
                  <div key={s.id}>
                    <div className="flex justify-between small mb-1">
                      <span>{en ? s.nameEn : s.nameAr}</span>
                      <b className="primary-text">{s.c}</b>
                    </div>
                    <div style={{ height: 8, borderRadius: 8, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(s.c / maxTop) * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))' }} />
                    </div>
                  </div>
                ))}
                {topServices.length === 0 && <div className="empty"><p>{t('common.empty')}</p></div>}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><h3><Icon name="users" size={17} className="primary-text" /> {t('admin.barbers')}</h3></div>
            <div className="admin-card-body">
              <div className="col gap-2">
                {barbers.map((b) => (
                  <div key={b.id} className="flex items-center gap-2">
                    <div className="avatar" style={{ width: 34, height: 34, fontSize: 14 }}>{(en ? b.nameEn : b.nameAr).slice(0, 1)}</div>
                    <div style={{ flex: 1 }}>
                      <b className="small">{en ? b.nameEn : b.nameAr}</b>
                      <div className="small muted">{allBookings.filter((x) => x.barberId === b.id).length} {t('admin.appointments')}</div>
                    </div>
                    <Stars rating={b.rating} size={12} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-head"><h3><Icon name="package" size={17} className="primary-text" /> {t('admin.stock')}</h3></div>
            <div className="admin-card-body">
              <div className="col gap-2">
                {products.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex justify-between small">
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{en ? p.nameEn : p.nameAr}</span>
                    <b style={{ color: p.stock <= 3 ? '#f85149' : 'var(--primary)' }}>{p.stock}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {msgs > 0 && (
            <Link href="/admin/messages" className="admin-card" style={{ display: 'block', padding: 18, borderColor: 'var(--primary)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--primary)' }}><Icon name="message" size={22} /></span>
                <div><b>{msgs}</b> {t('contact.form')}</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
