import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// اكتشاف تلقائي لرابط قاعدة البيانات (Vercel / Neon / Prisma Postgres)
if (!process.env.DATABASE_URL) {
  const fallback =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.PRISMA_POSTGRES_URL;
  if (fallback) process.env.DATABASE_URL = fallback;
}

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const services = [
  ['classic-haircut', 'قصة شعر كلاسيكية', 'Classic Haircut', 'قصة شعر احترافية بالمقص والماكينة مع غسيل وتصفيف نهائي', 'Professional scissor-and-clipper cut finished with a wash and style', 45, 30, 'scissors', 'قصات شعر'],
  ['haircut-beard', 'قصة شعر + لحية', 'Haircut & Beard', 'باقة متكاملة: قصة شعر عصرية مع تهذيب وتشكيل اللحية', 'Complete package: modern haircut with beard shaping and trimming', 70, 45, 'crown', 'باقات'],
  ['hot-towel-shave', 'حلاقة بالشفرة والمنشفة الساخنة', 'Hot Towel Shave', 'حلاقة تقليدية بالشفرة مع منشفة ساخنة وزيوت عطرية', 'Traditional straight-razor shave with hot towel and essential oils', 55, 30, 'razor', 'حلاقة'],
  ['beard-trim', 'تهذيب اللحية', 'Beard Trim', 'تشكيل وتهذيب اللحية بدقة مع تحديد الخطوط', 'Precise beard shaping and line-up', 35, 20, 'beard', 'لحية'],
  ['kids-haircut', 'قصة أطفال', 'Kids Haircut', 'قصة مريحة وممتعة للأطفال حتى 12 سنة', 'A comfortable, fun cut for kids up to 12', 35, 25, 'child', 'قصات شعر'],
  ['hair-color', 'صبغة شعر', 'Hair Color', 'صبغة احترافية آمنة تغطي الشيب بالكامل', 'Safe professional color with full grey coverage', 120, 60, 'palette', 'تلوين'],
  ['facial-cleanse', 'تنظيف البشرة', 'Facial Cleanse', 'تنظيف عميق للبشرة مع تقشير وقناع طبيعي', 'Deep cleansing with exfoliation and a natural mask', 90, 45, 'sparkle', 'عناية'],
  ['vip-package', 'باقة VIP', 'VIP Package', 'قصة شعر + لحية + تنظيف بشرة + مساج رأس + مشروب ساخن', 'Haircut + beard + facial + head massage + hot drink', 150, 75, 'crown', 'باقات'],
  ['wash-style', 'غسيل وتصفيف', 'Wash & Style', 'غسيل بالشامبو المناسب وتصفيف احترافي', 'Shampoo wash and professional styling', 30, 20, 'droplet', 'عناية'],
  ['line-up', 'تحديد الخطوط', 'Line Up & Edge', 'تحديد خطوط الشعر واللحية بدقة متناهية', 'Crisp hairline and beard edge detailing', 25, 20, 'razor', 'حلاقة'],
];

const barbers = [
  ['mohammad', 'أبو محمد', 'Abu Mohammad', 'حلاق رئيسي ومدرب', 'Master Barber & Trainer', 'خبرة أكثر من 15 عاماً في أرقى صالونات المنطقة، متخصص في القصات الكلاسيكية والحلاقة بالشفرة.', '15+ years in the region’s top salons, specialised in classic cuts and straight-razor shaves.', '/uploads/barber-1.jpg', 4.9, 15],
  ['karim', 'كريم', 'Karim', 'أخصائي قصات عصرية', 'Modern Styles Specialist', 'يجمع بين أحدث صيحات الموضة وذوق العميل، خبير في القصات المتدرجة والفيد.', 'Blends the latest trends with your taste; expert in fades and textured cuts.', '/uploads/barber-2.jpg', 4.8, 8],
  ['omar', 'عمر', 'Omar', 'خبير اللحية والعناية', 'Beard & Grooming Expert', 'متخصص في تشكيل اللحية والعناية بالبشرة، يستخدم أفضل الزيوت والمنتجات الطبيعية.', 'Specialist in beard sculpting and skincare using the finest natural oils and products.', '/uploads/barber-3.jpg', 4.9, 6],
  ['laith', 'ليث', 'Laith', 'حلاق محترف', 'Professional Barber', 'شغوف بالتفاصيل الدقيقة، سريع ودقيق ويحب إرضاء عملائه دائماً.', 'Detail-obsessed, fast and precise, always aiming to delight his clients.', '/uploads/barber-4.jpg', 4.7, 5],
];

const products = [
  ['charcoal-shampoo', 'شامبو الفحم للرجال', 'Charcoal Men’s Shampoo', 'شامبو منعش بالفحم النشط ينظف فروة الرأس بعمق وينظم إفراز الدهون. مناسب للاستخدام اليومي.', 'Activated-charcoal shampoo that deeply cleanses the scalp and controls oil. Ideal for daily use.', 65, 85, '/uploads/product-1.jpg', 'عناية الشعر', 'Hair Care', 'BarberPro', '250ml', 40, true],
  ['argan-beard-oil', 'زيت الأرغان للحية', 'Argan Beard Oil', 'زيت طبيعي 100% يغذي اللحية وينعمها ويمنحها لمعة صحية ورائحة خشبية فاخرة.', '100% natural oil that nourishes and softens the beard with a healthy shine and woody scent.', 55, 0, '/uploads/product-2.jpg', 'العناية باللحية', 'Beard Care', 'BarberPro', '30ml', 55, true],
  ['matte-clay', 'كريم تصفيف مطفي', 'Matte Styling Clay', 'كريم تصفيف بثبات قوي ولمعة مطفية، يسهل غسله ولا يترك أي أثر.', 'Strong-hold, matte-finish styling clay that washes out easily with no residue.', 48, 60, '/uploads/product-3.jpg', 'التصفيف', 'Styling', 'StyleCraft', '100ml', 32, true],
  ['hair-spray', 'بخاخ مثبت الشعر', 'Strong Hold Hair Spray', 'مثبت قوي يدوم طوال اليوم ويحمي الشعر من الرطوبة دون أن يجعله قاسياً.', 'All-day strong hold that protects against humidity without stiffness.', 42, 0, '/uploads/product-4.jpg', 'التصفيف', 'Styling', 'StyleCraft', '300ml', 28, false],
  ['shaving-foam', 'موس الحلاقة الفاخر', 'Luxury Shaving Foam', 'موس غني يهيئ البشرة للحلاقة ويمنع التهيج، بخلاصة الصبار والبابونج.', 'Rich foam that preps the skin and prevents irritation, with aloe and chamomile.', 35, 45, '/uploads/product-5.jpg', 'الحلاقة', 'Shaving', 'GillettePro', '200ml', 60, false],
  ['hair-clipper', 'ماكينة حلاقة احترافية', 'Professional Hair Clipper', 'ماكينة احترافية بمحرك قوي وملحقات متعددة، بطارية تدوم 4 ساعات وشحن سريع.', 'Professional clipper with a powerful motor and multiple attachments; 4-hour battery, fast charge.', 320, 399, '/uploads/product-6.jpg', 'أدوات', 'Tools', 'BarberPro', '', 12, true],
  ['grooming-kit', 'طقم العناية المتكامل', 'Complete Grooming Kit', 'طقم يضم مقصاً احترافياً ومشطاً وفرشاة لحية وحامل أدوات، في علبة فاخرة.', 'A set with professional scissors, comb, beard brush and holder in a luxury case.', 189, 240, '/uploads/product-7.jpg', 'أدوات', 'Tools', 'BarberPro', '5 قطع', 18, false],
  ['luxury-cologne', 'كولونيا رجالية فاخرة', 'Luxury Men’s Cologne', 'عطر شرقي غني برائحة العود والتوابل، ثبات يدوم حتى 12 ساعة.', 'Rich oriental scent of oud and spices lasting up to 12 hours.', 240, 300, '/uploads/product-8.jpg', 'عطور', 'Fragrance', 'Asil', '100ml', 22, true],
];

const gallery = [
  ['/uploads/salon-1.jpg', 'من داخل الصالون', 'Inside the salon'],
  ['/uploads/salon-2.jpg', 'أجواء العمل', 'Work atmosphere'],
  ['/uploads/salon-3.jpg', 'تفاصيل المكان', 'Place details'],
  ['/uploads/salon-4.jpg', 'لمسة احترافية', 'A professional touch'],
];


const reviews = [
  ['أحمد الصالح', 5, 'أفضل صالون في المنطقة! خدمة رائعة وأسعار مناسبة. أبو محمد فنان حقيقي.', 'Best salon in the area! Great service and fair prices. Abu Mohammad is a true artist.', true],
  ['محمود خليل', 5, 'حجزت أونلاين ووصلت لقيت مقعدي جاهز. تجربة ممتازة وأنصح الجميع بها.', 'Booked online and my chair was ready when I arrived. Excellent experience, highly recommended.', true],
  ['Fadi Nasser', 5, 'حلاقون محترفون ومكان نظيف واهتمام مذهل بالتفاصيل. باقة VIP تستحق كل شيكل.', 'Professional barbers, clean place and amazing attention to detail. The VIP package is worth every shekel.', true],
  ['سامي العبادي', 4, 'المكان نظيف والجو رجالي أصيل، والحلاقة دائماً ممتازة.', 'Clean place, authentic men’s vibe and always a great cut.', true],
];

async function main() {
  console.log('🌱 جارٍ تعبئة البيانات...');

  // المدير
  const email = process.env.ADMIN_EMAIL || 'admin@salon.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  await prisma.admin.deleteMany({});
  await prisma.admin.create({ data: { email, passwordHash: hashPassword(password), name: 'مدير الصالون' } });
  console.log(`👤 المدير: ${email} / ${password}`);

  // الخدمات
  await prisma.service.deleteMany({});
  const createdServices = [];
  for (let i = 0; i < services.length; i++) {
    const [slug, nameAr, nameEn, descAr, descEn, price, durationMin, icon, category] = services[i];
    const s = await prisma.service.create({
      data: { slug, nameAr, nameEn, descAr, descEn, price, durationMin, icon, category, sort: i, active: true },
    });
    createdServices.push(s);
  }

  // الحلاقون
  await prisma.barber.deleteMany({});
  const createdBarbers = [];
  for (let i = 0; i < barbers.length; i++) {
    const [slug, nameAr, nameEn, roleAr, roleEn, bioAr, bioEn, photo, rating, experience] = barbers[i];
    const b = await prisma.barber.create({
      data: { slug, nameAr, nameEn, roleAr, roleEn, bioAr, bioEn, photo, rating, experience, sort: i, active: true },
    });
    createdBarbers.push(b);
  }

  // ربط الحلاقين بالخدمات
  await prisma.barberService.deleteMany({});
  for (let bi = 0; bi < createdBarbers.length; bi++) {
    const start = bi % 2 === 0 ? 0 : 1;
    for (let si = start; si < createdServices.length; si += 2) {
      await prisma.barberService.create({
        data: { barberId: createdBarbers[bi].id, serviceId: createdServices[si].id },
      });
    }
  }

  // المنتجات
  await prisma.product.deleteMany({});
  for (let i = 0; i < products.length; i++) {
    const [slug, nameAr, nameEn, descAr, descEn, price, compareAtPrice, image, categoryAr, categoryEn, brand, size, stock, featured] = products[i];
    await prisma.product.create({
      data: { slug, nameAr, nameEn, descAr, descEn, price, compareAtPrice, image, categoryAr, categoryEn, brand, size, stock, featured, sort: i, active: true },
    });
  }

  // المعرض
  await prisma.galleryImage.deleteMany({});
  for (let i = 0; i < gallery.length; i++) {
    const [url, captionAr, captionEn] = gallery[i];
    await prisma.galleryImage.create({ data: { url, captionAr, captionEn, sort: i, active: true } });
  }

  // التقييمات
  await prisma.review.deleteMany({});
  for (const [name, rating, commentAr, commentEn, approved] of reviews) {
    await prisma.review.create({ data: { name, rating, commentAr, commentEn, approved } });
  }

  // أكواد الخصم
  await prisma.coupon.deleteMany({});
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', type: 'percent', value: 10, minTotal: 0, active: true },
      { code: 'VIP15', type: 'percent', value: 15, minTotal: 200, active: true },
      { code: 'SHIP20', type: 'fixed', value: 20, minTotal: 100, active: true },
    ],
  });

  // حجوزات تجريبية
  await prisma.booking.deleteMany({});
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const sampleNames = ['أحمد الصالح', 'محمود خليل', 'Fadi Nasser', 'سامي العبادي', 'يوسف منصور', 'Khaled Amr', 'طارق حسن', 'رامي عودة'];
  const phones = ['0599123456', '0598234567', '0527345678', '0596456789', '0595678901', '0544789012'];
  const statuses = ['confirmed', 'confirmed', 'pending', 'completed', 'confirmed', 'pending'];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + (i % 3 === 0 ? 0 : (i % 5) - 1));
    const svc = createdServices[i % createdServices.length];
    const brb = createdBarbers[i % createdBarbers.length];
    const hour = 10 + (i % 8);
    await prisma.booking.create({
      data: {
        code: 'BK-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        customerName: sampleNames[i % sampleNames.length],
        phone: phones[i % phones.length],
        email: i % 2 ? 'client@example.com' : '',
        serviceId: svc.id,
        barberId: brb.id,
        barberName: brb.nameAr,
        serviceName: svc.nameAr,
        date: fmt(d),
        time: `${String(hour).padStart(2, '0')}:00`,
        endTime: `${String(hour).padStart(2, '0')}:${String(svc.durationMin % 60).padStart(2, '0')}`,
        durationMin: svc.durationMin,
        price: svc.price,
        status: statuses[i % statuses.length],
        notes: i % 4 === 0 ? 'قصة قصيرة من الجوانب' : '',
      },
    });
  }

  // طلبات تجريبية
  await prisma.order.deleteMany({});
  const allProducts = await prisma.product.findMany();
  for (let i = 0; i < 6; i++) {
    const p1 = allProducts[i % allProducts.length];
    const p2 = allProducts[(i + 3) % allProducts.length];
    const subtotal = p1.price * (1 + (i % 2)) + p2.price;
    const orderStatuses = ['new', 'processing', 'shipped', 'delivered', 'new', 'delivered'];
    await prisma.order.create({
      data: {
        code: 'ORD-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
        customerName: sampleNames[i % sampleNames.length],
        phone: phones[i % phones.length],
        email: 'client@example.com',
        address: 'شارع الملك حسين 12',
        city: ['رام الله', 'القدس', 'نابلس', 'الخليل'][i % 4],
        subtotal,
        shipping: subtotal >= 250 ? 0 : 25,
        total: subtotal + (subtotal >= 250 ? 0 : 25),
        status: orderStatuses[i],
        payment: i % 2 ? 'card' : 'cash',
        items: {
          create: [
            { productId: p1.id, nameAr: p1.nameAr, nameEn: p1.nameEn, price: p1.price, qty: 1 + (i % 2), image: p1.image },
            { productId: p2.id, nameAr: p2.nameAr, nameEn: p2.nameEn, price: p2.price, qty: 1, image: p2.image },
          ],
        },
      },
    });
  }

  console.log(`✅ تم: ${services.length} خدمة، ${barbers.length} حلاق، ${products.length} منتج، ${gallery.length} صورة، 14 حجز، 6 طلبات`);
}

main()
  .catch((e) => { console.error('❌ خطأ:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
