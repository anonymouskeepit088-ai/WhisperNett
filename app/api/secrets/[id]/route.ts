import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = db.get(id);
  if (!record) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (record.expiresAt < Date.now()) {
    db.delete(id);
    return NextResponse.json({ error: 'Expired' }, { status: 410 });
  }
  return NextResponse.json({ exists: true, expiresAt: record.expiresAt });
}
