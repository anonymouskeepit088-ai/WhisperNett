import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { adminToken, action } = await req.json();

    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token required' }, { status: 401 });
    }

    const record = db.get(id);
    if (!record) {
      return NextResponse.json({ error: 'Secret not found or expired' }, { status: 404 });
    }

    if (record.adminToken !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (action === 'pause') {
      record.isPaused = true;
      return NextResponse.json({ success: true, isPaused: true });
    } else if (action === 'resume') {
      record.isPaused = false;
      return NextResponse.json({ success: true, isPaused: false });
    } else if (action === 'delete') {
      db.delete(id);
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
