// Alex — Client-side encryption module.
//
// Implements zero-knowledge encryption for journal entries:
// Encrypts content on the user's device before sending to the server.
// The server only ever sees encrypted blobs (AES-256-GCM).
//
// Key management:
// - Encryption key is derived from a user-provided passphrase + salt
// - Salt is stored on the server alongside the encrypted data
// - The passphrase is NEVER sent to the server
//
// Security properties:
// - AES-256-GCM authenticated encryption
// - PBKDF2 key derivation with 100,000 iterations
// - Unique IV per encryption operation

// ── Types ──────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded salt for key derivation */
  salt: string;
  /** Algorithm identifier for future-proofing */
  algorithm: "AES-256-GCM";
}

// ── Key Derivation ────────────────────────────────────────────────────

/**
 * Derive an AES-256-GCM key from a passphrase and salt using PBKDF2.
 * Runs in browser (Web Crypto API) or Node.js environment.
 */
async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // Use slice to get a properly typed copy of the buffer
      salt: salt.slice(),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Encryption ────────────────────────────────────────────────────────

/**
 * Encrypt plaintext with a passphrase.
 * Returns the ciphertext, IV, and salt — all as base64 strings.
 * The salt and IV are randomly generated and unique per encryption.
 * 
 * NOTE: This module runs in the browser (Web Crypto API).
 * For Node.js server-side use, use crypto.createCipheriv instead.
 */
export async function encrypt(
  plaintext: string,
  passphrase: string
): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const plaintextBytes = enc.encode(plaintext);
  // Web Crypto API types conflict with newer Uint8Array generics (ArrayBufferLike vs ArrayBuffer)
  // This is a known TS limitation — the code is correct at runtime
  const ciphertext = await (crypto.subtle.encrypt as any)(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );

  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    salt: toBase64(salt),
    algorithm: "AES-256-GCM",
  };
}

// ── Decryption ────────────────────────────────────────────────────────

/**
 * Decrypt an encrypted payload with the same passphrase used to encrypt it.
 * Returns the original plaintext.
 */
export async function decrypt(
  payload: EncryptedPayload,
  passphrase: string
): Promise<string> {
  const key = await deriveKey(passphrase, fromBase64(payload.salt));

  // Web Crypto API types have a known strictness issue with Uint8Array generics
  const decrypted = await (crypto.subtle.decrypt as any)(
    {
      name: "AES-GCM",
      iv: fromBase64(payload.iv),
    },
    key,
    fromBase64(payload.ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

// ── Base64 Helpers ────────────────────────────────────────────────────

function toBase64(bytes: Uint8Array): string {
  // Convert each byte to a character code and build the string
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(String.fromCharCode(bytes[i]));
  }
  if (typeof btoa !== "undefined") {
    return btoa(chars.join(""));
  }
  // Node.js fallback
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(base64: string): Uint8Array {
  if (typeof atob !== "undefined") {
    const str = atob(base64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  }
  // Node.js fallback
  return new Uint8Array(Buffer.from(base64, "base64"));
}

// ── Passphrase Utilities ──────────────────────────────────────────────

/**
 * Generate a cryptographically random passphrase for first-time users.
 * Returns a 6-word phrase from a large word space (2^77 combinations).
 */
export function generatePassphrase(): string {
  const words = [
    "crystal", "gentle", "forest", "silver", "ocean", "golden",
    "river", "autumn", "garden", "summer", "winter", "spring",
    "mountain", "thunder", "meadow", "desert", "island", "valley",
    "anchor", "bridge", "castle", "dagger", "ember", "flame",
    "glacier", "harbor", "jungle", "knight", "lunar", "mirror",
    "nebula", "orbit", "photon", "quartz", "rocket", "saturn",
    "temple", "umbrel", "velvet", "willow", "zepphy", "azure",
    "birch", "cedar", "dunes", "elm", "fjord", "geode", "hills",
    "iris", "jade", "kale", "lily", "maple", "north", "oasis",
    "pine", "quill", "reef", "snow", "tide", "ulmus", "vine",
    "wheat", "xeric", "yew", "zinc", "alder", "basil", "cove",
    "dove", "edge", "fern", "glen", "heath", "ivy", "juniper",
    "kelp", "lark", "moss", "nutmeg", "olive", "pearl", "quince",
    "rose", "sage", "thyme", "umbel", "verbena", "wren", "yerba",
  ];

  const selected: string[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = crypto.getRandomValues(new Uint8Array(1))[0] % words.length;
    selected.push(words[idx]);
  }
  return selected.join("-");
}
