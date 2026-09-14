import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

const ALGORITHM = 'aes-256-gcm';

const deriveKey = (password: string, salt: Buffer) => {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 32, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { token, passphrase } = await req.json();

    const record = db.get(id);
    if (!record) {
      return NextResponse.json({ error: 'Secret not found or already destroyed' }, { status: 404 });
    }

    if (record.isPaused) {
      return NextResponse.json({ error: 'This secret is currently paused by the sender' }, { status: 403 });
    }

    if (record.expiresAt < Date.now()) {
      db.delete(id);
      return NextResponse.json({ error: 'Secret expired' }, { status: 410 });
    }

    const keyMaterial = passphrase ? token + passphrase : token;
    
    // Memory-hard async key derivation for maximum security
    const key = await deriveKey(keyMaterial, Buffer.from(record.salt, 'hex'));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(record.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(record.authTag, 'hex'));
    
    let decrypted = decipher.update(record.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    if (record.burnOnRead) {
      db.delete(id);
    }

    return NextResponse.json({ secret: decrypted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid token or passphrase' }, { status: 401 });
  }
}
