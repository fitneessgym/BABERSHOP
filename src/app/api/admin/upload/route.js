import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'لا يوجد ملف' }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // على Vercel: التخزين المؤقت لا يحفظ الملفات → استخدم Vercel Blob إن كان مفعّلاً
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`uploads/${name}`, bytes, {
          access: 'public',
          contentType: file.type || 'image/jpeg',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        return NextResponse.json({ ok: true, url: blob.url, stored: 'blob' });
      } catch (e) {
        console.log('blob upload failed:', e.message);
        // نتابع إلى الحفظ المحلي
      }
    }

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${name}`, stored: 'local' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
