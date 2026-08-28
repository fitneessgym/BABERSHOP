"""توليد صور المعرض من صور الحلاقين + رسم صور منتجات بأسلوب الاستوديو"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os, math, random

UP = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'uploads')

def gradient(size, c1, c2, vertical=True):
    w, h = size
    img = Image.new('RGB', (1, h if vertical else w))
    d = ImageDraw.Draw(img)
    for i in range(h if vertical else w):
        t = i / max(1, (h if vertical else w) - 1)
        c = tuple(int(c1[j] + (c2[j] - c1[j]) * t) for j in range(3))
        if vertical:
            d.line([(0, i), (0, i)], fill=c)
        else:
            d.line([(i, 0), (i, 0)], fill=c)
    return img.resize(size)

def vignette(img, strength=0.65):
    w, h = img.size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(int(min(w, h) * 0.18)))
    black = Image.new('RGB', (w, h), (8, 8, 10))
    blended = Image.composite(img, black, mask.point(lambda p: int(p * strength + 255 * (1 - strength))))
    return blended

def warm_tint(img, amount=0.10):
    r, g, b = img.split()
    r = r.point(lambda p: min(255, int(p * (1 + amount))))
    b = b.point(lambda p: int(p * (1 - amount * 0.6)))
    return Image.merge('RGB', (r, g, b))

# ---------------- صور المعرض ----------------
def make_gallery():
    sources = ['barber-1.jpg', 'barber-2.jpg', 'barber-3.jpg', 'barber-4.jpg']
    crops = [
        ('gallery-1.jpg', 0, (0.10, 0.00)),
        ('gallery-2.jpg', 1, (0.16, 0.04)),
        ('gallery-3.jpg', 2, (0.06, 0.02)),
        ('gallery-4.jpg', 3, (0.20, 0.00)),
        ('gallery-5.jpg', 0, (0.22, 0.06)),
        ('gallery-6.jpg', 2, (0.26, 0.00)),
    ]
    for out, si, (zx, zy) in crops:
        src = Image.open(os.path.join(UP, sources[si])).convert('RGB')
        w, h = src.size
        side = int(min(w, h) * 0.82)
        left = int(w * zx)
        top = int(h * zy)
        left = max(0, min(left, w - side))
        top = max(0, min(top, h - side))
        img = src.crop((left, top, left + side, top + side)).resize((800, 800), Image.LANCZOS)
        img = warm_tint(img, 0.08)
        img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=110, threshold=3))
        img = vignette(img, 0.55)
        img.save(os.path.join(UP, out), quality=88)
        print('✓', out)

# ---------------- صور المنتجات ----------------
def studio_bg(size=(900, 900)):
    w, h = size
    bg = gradient(size, (38, 38, 45), (12, 12, 15)).convert('RGB')
    d = ImageDraw.Draw(bg, 'RGBA')
    # هالة إضاءة خلفية
    glow = Image.new('RGBA', size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([w * 0.18, h * 0.10, w * 0.82, h * 0.72], fill=(200, 161, 90, 26))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    bg = Image.alpha_composite(bg.convert('RGBA'), glow).convert('RGB')
    # انعكاس أرضي
    d = ImageDraw.Draw(bg, 'RGBA')
    d.ellipse([w * 0.24, h * 0.80, w * 0.76, h * 0.90], fill=(0, 0, 0, 90))
    return bg

def gold_text_block(d, cx, y, w, h, alpha=40):
    """شريط ذهبي مزخرف بدل النص"""
    d.rounded_rectangle([cx - w / 2, y, cx + w / 2, y + h], radius=4, fill=(200, 161, 90, alpha))
    d.rounded_rectangle([cx - w / 2 + 12, y + h + 8, cx + w / 2 - 26, y + h + 12], radius=3, fill=(200, 161, 90, int(alpha * 0.6)))

def product_can():  # موس حلاقة
    img = studio_bg(); d = ImageDraw.Draw(img, 'RGBA')
    w, h = img.size
    # كريم
    for i, (dx, dy, r) in enumerate([(0, 40, 62), (52, 26, 44), (-50, 30, 40), (28, -6, 40), (-30, -4, 36)]):
        d.ellipse([w / 2 + dx - r, h * 0.72 + dy - r, w / 2 + dx + r, h * 0.72 + dy + r],
                  fill=(246, 244, 240, 235))
    # العلبة
    bx, by, bw, bh = w / 2 - 78, h * 0.24, 156, h * 0.46
    body = gradient((int(bw), int(bh)), (250, 249, 246), (188, 186, 180)).convert('RGBA')
    mask = Image.new('L', (int(bw), int(bh)), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, bw, bh], radius=22, fill=255)
    d_body = ImageDraw.Draw(body, 'RGBA')
    d_body.rounded_rectangle([0, 0, bw, bh * 0.16], radius=18, fill=(200, 161, 90, 230))
    d_body.rounded_rectangle([10, bh * 0.30, bw - 10, bh * 0.36], radius=4, fill=(200, 161, 90, 70))
    d_body.rounded_rectangle([10, bh * 0.40, bw - 34, bh * 0.44], radius=4, fill=(160, 160, 160, 60))
    d_body.rounded_rectangle([10, bh * 0.48, bw - 10, bh * 0.52], radius=4, fill=(160, 160, 160, 45))
    # لمعة
    d_body.rounded_rectangle([16, 0, 34, bh], radius=12, fill=(255, 255, 255, 60))
    img.paste(body, (int(bx), int(by)), mask)
    # الغطاء
    d.rounded_rectangle([bx + 44, by - 42, bx + bw - 44, by + 6], radius=10, fill=(214, 178, 106))
    return img

def product_clipper():  # ماكينة حلاقة
    img = studio_bg(); d = ImageDraw.Draw(img, 'RGBA')
    w, h = img.size
    cx, cy = w / 2, h / 2
    # الجسم
    d.rounded_rectangle([cx - 62, cy - 175, cx + 62, cy + 165], radius=34, fill=(32, 32, 38))
    d.rounded_rectangle([cx - 62, cy - 175, cx + 62, cy + 165], radius=34, outline=(200, 161, 90, 150), width=3)
    # رأس معدني
    d.rounded_rectangle([cx - 68, cy - 232, cx + 68, cy - 168], radius=18, fill=(196, 198, 204))
    for i in range(9):
        x = cx - 60 + i * 15
        d.rectangle([x, cy - 228, x + 8, cy - 172], fill=(150, 152, 158))
    # شريط ذهبي
    d.rounded_rectangle([cx - 48, cy - 40, cx + 48, cy - 8], radius=6, fill=(200, 161, 90))
    d.rounded_rectangle([cx - 30, cy + 20, cx + 30, cy + 34], radius=6, fill=(200, 161, 90, 120))
    # مقبض
    d.rounded_rectangle([cx - 40, cy + 60, cx + 40, cy + 140], radius=14, fill=(46, 46, 54))
    # لمعة
    d.rounded_rectangle([cx - 44, cy - 160, cx - 26, cy + 120], radius=12, fill=(255, 255, 255, 28))
    return img

def product_kit():  # طقم أدوات
    img = studio_bg(); d = ImageDraw.Draw(img, 'RGBA')
    w, h = img.size
    cx, cy = w / 2, h / 2
    # العلبة
    d.polygon([(cx - 230, cy + 40), (cx + 230, cy + 40), (cx + 190, cy + 210), (cx - 190, cy + 210)], fill=(26, 26, 32))
    d.polygon([(cx - 230, cy + 40), (cx + 230, cy + 40), (cx + 190, cy + 210), (cx - 190, cy + 210)], outline=(200, 161, 90, 140))
    d.rectangle([cx - 230, cy + 6, cx + 230, cy + 44], fill=(32, 32, 40))
    # مقص
    d.line([(cx - 150, cy - 60), (cx + 40, cy + 30)], fill=(214, 216, 222), width=13)
    d.line([(cx - 150, cy + 30), (cx + 40, cy - 60)], fill=(214, 216, 222), width=13)
    d.ellipse([cx - 186, cy - 30, cx - 142, cy + 14], outline=(200, 161, 90), width=9)
    d.ellipse([cx - 176, cy + 44, cx - 132, cy + 88], outline=(200, 161, 90), width=9)
    # مشط
    d.rounded_rectangle([cx + 70, cy - 40, cx + 200, cy - 6], radius=10, fill=(196, 198, 204))
    for i in range(9):
        d.rectangle([cx + 78 + i * 13, cy - 40, cx + 84 + i * 13, cy + 44], fill=(196, 198, 204))
    # فرشاة
    d.rounded_rectangle([cx - 60, cy + 60, cx + 30, cy + 150], radius=14, fill=(120, 92, 58))
    d.ellipse([cx - 74, cy + 130, cx + 44, cy + 200], fill=(226, 214, 190))
    return img

def product_cologne():  # عطر
    img = studio_bg(); d = ImageDraw.Draw(img, 'RGBA')
    w, h = img.size
    cx = w / 2
    # الزجاجة
    top, bot = h * 0.30, h * 0.80
    body = gradient((260, int(bot - top)), (78, 74, 78), (34, 32, 38), vertical=False).convert('RGBA')
    mask = Image.new('L', body.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, body.size[0], body.size[1]], radius=26, fill=255)
    db = ImageDraw.Draw(body, 'RGBA')
    # نمط هندسي ذهبي
    for i in range(4):
        for j in range(6):
            x = 30 + j * 40 + (20 if i % 2 else 0)
            y = 40 + i * 40
            if x < body.size[0] - 20 and y < body.size[1] - 20:
                db.polygon([(x, y - 14), (x + 14, y), (x, y + 14), (x - 14, y)], outline=(200, 161, 90, 120))
    db.rounded_rectangle([18, body.size[1] * 0.62, body.size[0] - 18, body.size[1] * 0.66], radius=4, fill=(200, 161, 90, 90))
    img.paste(body, (int(cx - 130), int(top)), mask)
    # الرقبة والغطاء
    d.rounded_rectangle([cx - 46, top - 46, cx + 46, top + 6], radius=8, fill=(160, 160, 168))
    d.rounded_rectangle([cx - 58, top - 122, cx + 58, top - 40], radius=12, fill=(200, 161, 90))
    d.rounded_rectangle([cx - 58, top - 122, cx + 58, top - 100], radius=10, fill=(228, 200, 140))
    # لمعة
    d.rounded_rectangle([cx - 104, top + 20, cx - 78, bot - 30], radius=12, fill=(255, 255, 255, 34))
    return img

def make_products():
    makers = [
        ('product-5.jpg', product_can),
        ('product-6.jpg', product_clipper),
        ('product-7.jpg', product_kit),
        ('product-8.jpg', product_cologne),
    ]
    for name, fn in makers:
        img = fn()
        img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=3))
        img.save(os.path.join(UP, name), quality=90)
        print('✓', name)

if __name__ == '__main__':
    make_gallery()
    make_products()
    print('تم إنشاء كل الصور')
