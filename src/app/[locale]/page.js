import Link from 'next/link';
import prisma from '@/lib/db';
import { getSettings, parseJSON, workingHours, dayNames } from '@/lib/settings';
import { makeT } from '@/lib/i18n';
import Icon, { Stars } from '@/components/Icon';
import SmartImage from '@/components/SmartImage';
import QuickBook from '@/components/QuickBook';
import AddToCart from '@/components/AddToCart';

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }) {
  const { locale } = await params;
  const t = makeT(locale);
  const en = locale === 'en';
  const s = await getSettings();

  const [services, barbers, gallery, products, reviews] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sort: 'asc' }, take: 6 }),
    prisma.barber.findMany({ where: { active: true }, orderBy: { sort: 'asc' }, take: 8 }),
    prisma.galleryImage.findMany({ where: { active: true }, orderBy: { sort: 'asc' }, take: 6 }),
    prisma.product.findMany({ where: { active: true, featured: true }, orderBy: { sort: 'asc' }, take: 4 }),
    prisma.review.findMany({ where: { approved: true }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);

  const allServices = await prisma.service.findMany({ where: { active: true }, orderBy: { sort: 'asc' } });
  const hours = workingHours(s);
  const days = dayNames[locale];
  const today = new Date().getDay();
  const features = parseJSON(s.features, []);
  const stats = parseJSON(s.stats, []);
  const name = en ? s.salonNameEn : s.salonNameAr;

  return (
    <>
      {/* ========== البطل ========== */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${s.heroImage || '/uploads/hero.jpg'})` }} />
        <div className="hero-overlay" />
        <div className="container hero-inner">
          <div className="grid grid-2 items-center" style={{ gap: 46 }}>
            <div>
              <div className="hero-badge"><span className="dot" /> {en ? s.taglineEn : s.taglineAr}</div>
              <h1 className="hero-title">{en ? s.heroTitleEn : s.heroTitleAr}</h1>
              <p className="hero-sub">{en ? s.heroSubEn : s.heroSubAr}</p>
              <div className="hero-btns">
                <Link href={`/${locale}/booking`} className="btn btn-primary btn-lg">
                  <Icon name="calendar" size={19} /> {t('home.heroCta')}
                </Link>
                <Link href={`/${locale}/services`} className="btn btn-outline btn-lg">{t('home.heroCta2')}</Link>
              </div>
              <div className="hero-metrics">
                {stats.slice(0, 4).map((st, i) => (
                  <div key={i}><b>{st.value}</b><span>{en ? st.labelEn : st.labelAr}</span></div>
                ))}
              </div>
            </div>
            <div className="hide-sm">
              <QuickBook services={allServices} locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* ========== من نحن ========== */}
      <section className="section">
        <div className="container">
          <div className="grid grid-2 items-center" style={{ gap: 52 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <SmartImage src={s.aboutImage || '/uploads/about.jpg'} alt={name} style={{ aspectRatio: '4/3', objectFit: 'cover', width: '100%' }} />
              </div>
              <div className="stat-card" style={{ position: 'absolute', bottom: -26, insetInlineEnd: -14, maxWidth: 220, boxShadow: 'var(--shadow)' }}>
                <div className="si" style={{ background: 'rgba(200,161,90,0.14)', color: 'var(--primary)' }}>
                  <Icon name="award" size={24} />
                </div>
                <div>
                  <div className="sv">{stats[0]?.value || '15+'}</div>
                  <div className="sl">{en ? stats[0]?.labelEn : stats[0]?.labelAr}</div>
                </div>
              </div>
            </div>
            <div>
              <span className="eyebrow">{t('home.aboutTitle')}</span>
              <h2 className="section-title">{t('home.aboutSub')}</h2>
              <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 26 }}>
                {en ? s.aboutEn : s.aboutAr}
              </p>
              <div className="grid grid-2" style={{ gap: 12, marginBottom: 28 }}>
                {features.slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span style={{ color: 'var(--primary)' }}><Icon name="checkCircle" size={18} /></span>
                    <span className="small bold">{en ? f.titleEn : f.titleAr}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 wrap">
                <Link href={`/${locale}/booking`} className="btn btn-primary"><Icon name="calendar" size={17} /> {t('nav.book')}</Link>
                <Link href={`/${locale}/contact`} className="btn btn-ghost">{t('home.contactCta')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== الخدمات ========== */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('nav.services')}</span>
            <h2 className="section-title">{t('home.servicesTitle')}</h2>
            <p className="section-sub">{t('home.servicesSub')}</p>
          </div>
          <div className="grid grid-3">
            {services.map((sv) => (
              <Link key={sv.id} href={`/${locale}/booking?service=${sv.slug}`} className="card card-hover service-card">
                <div className="service-icon"><Icon name={sv.icon || 'scissors'} size={26} /></div>
                <h3>{en ? sv.nameEn : sv.nameAr}</h3>
                <p>{en ? sv.descEn : sv.descAr}</p>
                <div className="service-meta">
                  <span className="service-price">{sv.price} <small>{s.currency}</small></span>
                  <span className="service-dur"><Icon name="clock" size={14} /> {sv.durationMin} {t('common.min')}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href={`/${locale}/services`} className="btn btn-outline">{t('common.viewAll')} <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>

      {/* ========== لماذا نحن ========== */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('home.whyTitle')}</span>
            <h2 className="section-title">{t('home.whyTitle')}</h2>
          </div>
          <div className="grid grid-4">
            {features.map((f, i) => (
              <div key={i} className="feature">
                <div className="feature-icon"><Icon name={f.icon || 'star'} size={25} /></div>
                <h3>{en ? f.titleEn : f.titleAr}</h3>
                <p>{en ? f.textEn : f.textAr}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== الحلاقون ========== */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('nav.barbers')}</span>
            <h2 className="section-title">{t('home.teamTitle')}</h2>
            <p className="section-sub">{t('home.teamSub')}</p>
          </div>
          <div className="grid grid-4">
            {barbers.map((b) => (
              <div key={b.id} className="card card-hover barber-card">
                <div className="barber-photo">
                  <SmartImage src={b.photo} alt={en ? b.nameEn : b.nameAr} label="Barber" />
                </div>
                <div className="barber-body">
                  <h3>{en ? b.nameEn : b.nameAr}</h3>
                  <div className="barber-role">{en ? b.roleEn : b.roleAr}</div>
                  <p className="barber-bio">{(en ? b.bioEn : b.bioAr).slice(0, 90)}...</p>
                  <div className="barber-meta">
                    <span><Stars rating={b.rating} size={13} /></span>
                    <span><Icon name="award" size={12} /> {b.experience} {t('barbers.experience')}</span>
                  </div>
                  <Link href={`/${locale}/booking?barber=${b.slug}`} className="btn btn-outline btn-sm btn-block">
                    {t('home.bookBarber')} {en ? b.nameEn : b.nameAr}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== المعرض ========== */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t('nav.gallery')}</span>
            <h2 className="section-title">{t('home.galleryTitle')}</h2>
            <p className="section-sub">{t('home.gallerySub')}</p>
          </div>
          <div className="gallery-grid">
            {gallery.map((g, i) => (
              <div key={g.id} className={`gallery-item ${i === 0 ? 'tall' : ''}`}>
                <SmartImage src={g.url} alt={en ? g.captionEn : g.captionAr} label="Work" />
                <div className="cap">{en ? g.captionEn : g.captionAr}</div>
              </div>
            ))}
          </div>
          {gallery.length > 0 && (
            <div className="text-center mt-4">
              <Link href={`/${locale}/gallery`} className="btn btn-outline">{t('common.viewAll')} <Icon name="arrow" size={16} /></Link>
            </div>
          )}
        </div>
      </section>

      {/* ========== المتجر ========== */}
      {s.storeEnabled === '1' && products.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">{t('nav.store')}</span>
              <h2 className="section-title">{t('home.productsTitle')}</h2>
              <p className="section-sub">{t('home.productsSub')}</p>
            </div>
            <div className="grid grid-4">
              {products.map((p) => (
                <div key={p.id} className="card card-hover product-card">
                  <Link href={`/${locale}/store/${p.slug}`} className="product-media">
                    <SmartImage src={p.image} alt={en ? p.nameEn : p.nameAr} label="Product" />
                    {p.compareAtPrice > p.price && <span className="product-tag sale">%{Math.round((1 - p.price / p.compareAtPrice) * 100)}-</span>}
                    {p.stock <= 0 && <span className="product-tag out">{t('store.outOfStock')}</span>}
                  </Link>
                  <div className="product-body">
                    <span className="product-cat">{en ? p.categoryEn : p.categoryAr}</span>
                    <Link href={`/${locale}/store/${p.slug}`} className="product-name">{en ? p.nameEn : p.nameAr}</Link>
                    <p className="product-desc">{en ? p.descEn : p.descAr}</p>
                    <div className="product-price">
                      <b>{p.price} {s.currency}</b>
                      {p.compareAtPrice > p.price && <del>{p.compareAtPrice} {s.currency}</del>}
                    </div>
                  </div>
                  <div className="product-actions">
                    <AddToCart product={p} locale={locale} currency={s.currency} full />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link href={`/${locale}/store`} className="btn btn-outline">{t('nav.store')} <Icon name="arrow" size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== التقييمات ========== */}
      {reviews.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">{t('home.reviewsTitle')}</span>
              <h2 className="section-title">{t('home.reviewsTitle')}</h2>
              <p className="section-sub">{t('home.reviewsSub')}</p>
            </div>
            <div className="grid grid-3">
              {reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <Stars rating={r.rating} size={17} />
                  <p className="quote">“{en ? r.commentEn : r.commentAr}”</p>
                  <div className="reviewer">
                    <div className="avatar">{r.name.slice(0, 1)}</div>
                    <div>
                      <b>{r.name}</b>
                      <span className="small muted">{t('admin.customer')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== ساعات العمل والحجز ========== */}
      <section className="section section-alt">
        <div className="container">
          <div className="grid grid-2" style={{ gap: 44 }}>
            <div>
              <span className="eyebrow">{t('home.hoursTitle')}</span>
              <h2 className="section-title">{t('home.hoursTitle')}</h2>
              <div className="hours-list mt-3">
                {hours.map((h) => (
                  <div key={h.day} className={`hours-row ${h.day === today ? 'today' : ''} ${h.off ? 'closed' : ''}`}>
                    <b>{days[h.day]}</b>
                    <span className="time">{h.off ? t('admin.closed') : `${h.open} - ${h.close}`}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="eyebrow">{t('home.findUs')}</span>
              <h2 className="section-title">{t('home.contactCta')}</h2>
              <div className="col gap-2 mt-3">
                <div className="info-card">
                  <span className="ic"><Icon name="phone" size={20} /></span>
                  <div><h4>{t('contact.phone')}</h4><a href={`tel:${s.phone}`} dir="ltr">{s.phone}</a></div>
                </div>
                <div className="info-card">
                  <span className="ic"><Icon name="mail" size={20} /></span>
                  <div><h4>{t('contact.email')}</h4><a href={`mailto:${s.email}`} dir="ltr">{s.email}</a></div>
                </div>
                <div className="info-card">
                  <span className="ic"><Icon name="map" size={20} /></span>
                  <div><h4>{t('contact.address')}</h4><p>{en ? s.addressEn || s.addressAr : s.addressAr}</p></div>
                </div>
                <div className="flex gap-2 wrap mt-2">
                  <Link href={`/${locale}/booking`} className="btn btn-primary"><Icon name="calendar" size={17} /> {t('nav.book')}</Link>
                  {s.whatsapp && (
                    <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-ghost">
                      <Icon name="whatsapp" size={17} /> {t('contact.whatsapp')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
