import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
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

  const [rows, unread, counts] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  return NextResponse.json({
    rows,
    unread,
    counts: counts.reduce((acc, c) => ({ ...acc, [c.status]: c._count.status }), {}),
  });
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
      const pending = await prisma.notification.findMany({ where: { status: 'pending' }, take: 200 });
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
      await prisma.notification.updateMany({
        where: ids?.length ? { id: { in: ids } } : {},
        data: { read: true },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === 'delete') {
      await prisma.notification.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    if (action === 'clear') {
      await prisma.notification.deleteMany({});
      return NextResponse.json({ ok: true });
    }
    if (action === 'create') {
      const { type = 'custom', channel = 'whatsapp', to, title, body: text, sendNow = true, scheduledAt } = body.data || {};
      const n = await prisma.notification.create({
        data: {
          type, channel, to: String(to || ''), title: String(title || ''),
          body: String(text || ''), status: 'pending',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
      });
      if (sendNow && !scheduledAt) return NextResponse.json(await send(n.id));
      return NextResponse.json({ ok: true, notification: n });
    }
    if (action === 'test') {
      const r = await sendTest({ channel: body.channel, to: body.to });
      return NextResponse.json(r);
    }
    if (action === 'link') {
      const n = await prisma.notification.findUnique({ where: { id } });
      if (!n) return NextResponse.json({ error: 'not found' }, { status: 404 });
      await prisma.notification.update({ where: { id }, data: { status: 'sent', sentAt: new Date(), read: true } });
      return NextResponse.json({ ok: true, link: waLink(n.to, n.body) });
    }
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
