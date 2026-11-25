import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const raw =
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "default-dev-key-change-in-production-32b";
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext || !ciphertext.includes(":")) return "";
  try {
    const [ivHex, tagHex, encHex] = ciphertext.split(":");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}

export function maskSecret(secret: string): string {
  if (!secret) return "";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

/**
 * Generates a privacy-conscious daily visitor hash without storing raw IPs.
 */
export function hashVisitor(ip: string, userAgent: string): string {
  const daySalt = new Date().toISOString().slice(0, 10);
  const secret = process.env.JWT_SECRET || "visitor-salt";
  return crypto
    .createHash("sha256")
    .update(`${daySalt}:${secret}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 24);
}
