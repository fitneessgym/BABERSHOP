"""معالجة صور الصالون الحقيقية وتركيبها في الموقع"""
from PIL import Image, ImageOps, ImageDraw, ImageFilter
import os, glob, json, shutil

SRC = '/home/user/uploads'
UP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'uploads')

files = sorted(glob.glob(os.path.join(SRC, '*')))
files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))][:6]
print('الصور المصدر:', [os.path.basename(f)[:8] for f in files])

# نسخ احتياطي للصور القديمة
for name in ['hero.jpg', 'about.jpg']:
    src = os.path.join(UP, name)
    if os.path.exists(src) and not os.path.exists(os.path.join(UP, 'ai-' + name)):
        shutil.copy(src, os.path.join(UP, 'ai-' + name))

def load(f):
    im = Image.open(f)
    im = ImageOps.exif_transpose(im)   # تصحيح دوران الهاتف
    return im.convert('RGB')

def crop_ratio(im, ratio):
    """قص مركزي بنسبة محددة w/h"""
    w, h = im.size
    target = ratio
    if w / h > target:
        nw = int(h * target)
        return im.crop(((w - nw) // 2, 0, (w + nw) // 2, h))
    nh = int(w / target)
    top = int((h - nh) * 0.42)  # يميل للأعلى قليلاً
    return im.crop((0, top, w, top + nh))

def warm(im, amount=0.06):
    r, g, b = im.split()
    r = r.point(lambda p: min(255, int(p * (1 + amount))))
    b = b.point(lambda p: int(p * (1 - amount * 0.5)))
    return Image.merge('RGB', (r, g, b))

# ============ 1) صور المعرض 3:4 ============
salon_files = []
for i, f in enumerate(files, start=1):
    im = load(f)
    im = crop_ratio(im, 3 / 4)
    im = im.resize((900, 1200), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=3))
    im = warm(im)
    out = f'salon-{i}.jpg'
    im.save(os.path.join(UP, out), quality=84, optimize=True, progressive=True)
    salon_files.append(out)
    print('✓', out, im.size)

# ============ 2) واجهةHero مدمجة (كولاج) ============
W, H = 1920, 1000
collage = Image.new('RGB', (W, H))
tw = W // len(files)
for i, f in enumerate(files):
    im = load(f)
    # املأ البلاطة بنسبة 480:1000
    im = crop_ratio(im, tw / H)
    im = im.resize((tw, H), Image.LANCZOS)
    collage.paste(im, (i * tw, 0))

collage = collage.filter(ImageFilter.GaussianBlur(0.4))
collage = warm(collage, 0.05)

# تدرج داكن من اليسار (مكان النص) + تعتيم عام + فينييت
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for x in range(W):
    t = x / W
    a = int(215 * (1 - t) ** 1.6 + 55)          # عتمة قوية يسارًا
    od.line([(x, 0), (x, H)], fill=(10, 10, 13, a))
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).ellipse([-W * 0.2, -H * 0.3, W * 1.2, H * 1.3], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(160))
vig = Image.new('RGBA', (W, H), (0, 0, 0, 190))
collage = Image.composite(collage.convert('RGBA'), Image.alpha_composite(collage.convert('RGBA'), vig), mask).convert('RGB')
collage = Image.alpha_composite(collage.convert('RGBA'), overlay).convert('RGB')
collage.save(os.path.join(UP, 'hero.jpg'), quality=86, optimize=True, progressive=True)
print('✓ hero.jpg (كولاج من كل الصور)', collage.size)

# ============ 3) صورة "من نحن" 4:3 ============
idx = min(2, len(files) - 1) if len(files) > 2 else 0
about = load(files[idx])
about = crop_ratio(about, 4 / 3).resize((1200, 900), Image.LANCZOS)
about = warm(about.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=3)))
about.save(os.path.join(UP, 'about.jpg'), quality=85, optimize=True, progressive=True)
print('✓ about.jpg', about.size)

# حفظ القائمة لاستخدامها في قاعدة البيانات
with open(os.path.join(UP, '..', '..', 'salon_photos.json'), 'w') as fp:
    json.dump({'salon': ['/uploads/' + f for f in salon_files], 'hero': '/uploads/hero.jpg', 'about': '/uploads/about.jpg'}, fp)
print('تم')
