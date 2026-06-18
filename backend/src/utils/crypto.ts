import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const KEY_HEX = process.env.ENCRYPTION_KEY || '61d310be359f13880f0c0587895e69e4695029f6479b1d3039d73d6b05e3f4e2';
const KEY = Buffer.from(KEY_HEX, 'hex');

if (KEY.length !== 32) {
  console.warn('WARNING: ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Current length is', KEY.length);
}

/**
 * Encrypt a string using AES-256-CBC
 */
export function encryptAadhaar(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string using AES-256-CBC
 */
export function decryptAadhaar(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return '';
  try {
    const [ivHex, encryptedDataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt Aadhaar number:', error);
    return 'DECRYPTION_FAILED';
  }
}

/**
 * Hash Aadhaar using SHA-256 for fast duplicate checks
 */
export function hashAadhaar(text: string): string {
  if (!text) return '';
  return crypto.createHash('sha256').update(text).digest('hex');
}
