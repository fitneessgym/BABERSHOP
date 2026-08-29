import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { requireAdmin } from '@/lib/auth';

const run = promisify(exec);

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  try {
    const cwd = path.join(process.cwd());
    await run('node supabase/seed.mjs', { cwd });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
