import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { one, list, count, insert, update, updateWhere, remove, removeWhere } from '@/lib/supabase';
import { send, processDue, sendTest, waLink } from '@/lib/notify';

export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const channel = searchParams.get('channel') || '';
  const type = searchParams.get('type') || '';
  const limit = Math.min(Number(searchParams.get('limit') || 100), 500);

  const where = {};
  if (status) where.status = status;
  if (channel) where.channel = channel;
  if (type) where.type = type;

  const [rows, unread, statusRows] = await Promise.all([
    list('notifications', { where, order: { createdAt: 'desc' }, limit }),
    count('notifications', { where: { read: false } }),
    list('notifications', { select: 'status' }),
  ]);
  const counts = statusRows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

  return NextResponse.json({ rows, unread, counts });
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const { action, id, ids } = body;

  try {
    if (action === 'send') {
      const r = await send(id);
      return NextResponse.json(r);
    }
    if (action === 'sendAll') {
      const pending = await list('notifications', { where: { status: 'pending' }, limit: 200 });
      let ok = 0, fail = 0;
      for (const n of pending) {
        const r = await send(n.id);
        if (r.ok) ok++; else fail++;
      }
      return NextResponse.json({ ok: true, ok_count: ok, fail_count: fail });
    }
    if (action === 'processDue') {
      const r = await processDue();
      return NextResponse.json({ ok: true, ...r });
    }
    if (action === 'markRead') {
      await updateWhere('notifications', ids?.length ? { id: { in: ids } } : {}, { read: true });
      return NextResponse.json({ ok: true });
    }
    if (action === 'delete') {
      await remove('notifications', id);
      return NextResponse.json({ ok: true });
    }
    if (action === 'clear') {
      await removeWhere('notifications', {});
      return NextResponse.json({ ok: true });
    }
    if (action === 'create') {
      const { type = 'custom', channel = 'whatsapp', to, title, body: text, sendNow = true, scheduledAt } = body.data || {};
      const n = await insert('notifications', {
        type, channel, to: String(to || ''), title: String(title || ''),
        body: String(text || ''), status: 'pending',
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });
      if (sendNow && !scheduledAt) return NextResponse.json(await send(n.id));
      return NextResponse.json({ ok: true, notification: n });
    }
    if (action === 'test') {
      const r = await sendTest({ channel: body.channel, to: body.to });
      return NextResponse.json(r);
    }
    if (action === 'link') {
      const n = await one('notifications', { where: { id } });
      if (!n) return NextResponse.json({ error: 'not found' }, { status: 404 });
      await update('notifications', id, { status: 'sent', sentAt: new Date().toISOString(), read: true });
      return NextResponse.json({ ok: true, link: waLink(n.to, n.body) });
    }
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
