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

export async function POST(req: Request) {
  try {
    const { secret, expiration, passphrase, burnOnRead } = await req.json();

    if (!secret) {
      return NextResponse.json({ error: 'Secret is required' }, { status: 400 });
    }

    const id = crypto.randomBytes(16).toString('hex');
    const tokenPart1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const tokenPart2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const token = `WNET-${tokenPart1}-${tokenPart2}`;
    const adminToken = crypto.randomBytes(24).toString('hex');
    
    const salt = crypto.randomBytes(32);
    const keyMaterial = passphrase ? token + passphrase : token;
    
    // Memory-hard async key derivation for maximum security without blocking the event loop
    const key = await deriveKey(keyMaterial, salt);
    
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    const expSeconds = parseInt(expiration, 10) || 3600;
    const expiresAt = Date.now() + expSeconds * 1000;

    db.set(id, {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      authTag,
      expiresAt,
      burnOnRead: !!burnOnRead,
      adminToken,
      isPaused: false,
    });

    return NextResponse.json({
      id,
      token,
      expiresAt,
      adminToken,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to encrypt secret' }, { status: 500 });
  }
}

