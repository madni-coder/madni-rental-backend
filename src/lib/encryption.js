const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey() {
    const raw = process.env.ENCRYPTION_KEY;

    if (!raw) {
        return null;
    }

    // Derive a stable 32-byte key from the env var using SHA-256
    return crypto.createHash("sha256").update(raw).digest();
}

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns the original value if ENCRYPTION_KEY is not set (dev fallback).
 */
function encrypt(text) {
    if (!text) {
        return text;
    }

    const key = getKey();

    if (!key) {
        return String(text);
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(String(text), "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a value previously encrypted with `encrypt`.
 * Returns null if decryption fails or input is malformed.
 */
function decrypt(ciphertext) {
    if (!ciphertext) {
        return ciphertext;
    }

    const key = getKey();

    if (!key) {
        return String(ciphertext);
    }

    try {
        const parts = ciphertext.split(":");

        if (parts.length !== 3) {
            return null;
        }

        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = Buffer.from(parts[2], "hex");

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch {
        return null;
    }
}

module.exports = { decrypt, encrypt };
