import crypto from 'crypto';

function getEncryptionKey() {
  const source = process.env.POPIA_ENCRYPTION_KEY || 'development-only-key-change-me';
  return crypto.createHash('sha256').update(source).digest();
}

export function encryptField(input) {
  if (!input) {
    return '';
  }

  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(String(input), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}