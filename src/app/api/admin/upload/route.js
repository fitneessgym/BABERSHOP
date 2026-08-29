import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

/**
 * رفع الصور إلى Supabase Storage (الحاوية العامة `uploads`)
 * - على السيرفر المحلي: احتياطياً يحفظ في public/uploads
 */
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

    // الرفع إلى Supabase Storage
    try {
      const { error } = await supabase()
        .storage
        .from('uploads')
        .upload(name, bytes, { contentType: file.type || 'image/jpeg', upsert: false });
      if (!error) {
        const { data } = supabase().storage.from('uploads').getPublicUrl(name);
        return NextResponse.json({ ok: true, url: data.publicUrl, stored: 'supabase' });
      }
      console.log('supabase upload failed:', error.message);
      // نتابع إلى الحفظ المحلي
    } catch (e) {
      console.log('supabase upload failed:', e.message);
    }

    // احتياط: حفظ محلي (يعمل في التطوير فقط)
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    return NextResponse.json({ ok: true, url: `/uploads/${name}`, stored: 'local' });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
