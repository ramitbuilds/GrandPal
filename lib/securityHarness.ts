// Enterprise Cryptographic & Compliance (ECC) Security Harness for GrandPal
import crypto from "crypto";

// 1. In-Memory Token Bucket / Sliding Window Rate Limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Checks if a client identifier exceeds the allowed requests within a window.
 * @param key Unique key (e.g., ip + endpoint)
 * @param limit Max allowed requests within window
 * @param windowMs Time window in milliseconds (default 60 seconds)
 */
export function checkRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetTime - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInMs: Math.max(0, record.resetTime - now),
  };
}

/**
 * Extracts a client IP or fallback identifier from Next.js request headers.
 */
export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "localhost-client";
}

// 2. Cryptographic Timing-Safe Hash & Passcode Verification
/**
 * Hashes a passcode using SHA-256.
 */
export function hashPasscode(passcode: string): string {
  return crypto.createHash("sha256").update(passcode.trim()).digest("hex");
}

/**
 * Timing-safe string comparison to prevent side-channel timing attacks.
 */
export function timingSafeCompare(input: string, target: string): boolean {
  const inputBuffer = Buffer.from(input.trim());
  const targetBuffer = Buffer.from(target.trim());

  if (inputBuffer.length !== targetBuffer.length) {
    // Perform dummy comparison to keep timing consistent
    crypto.timingSafeEqual(inputBuffer, inputBuffer);
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, targetBuffer);
}

/**
 * Validates a submitted PIN against stored hash or plaintext in a timing-safe manner.
 */
export function verifyPasscodeTimingSafe(submittedPin: string, storedPasscode: string): boolean {
  if (!submittedPin || !storedPasscode) return false;

  const trimmedSubmitted = submittedPin.trim();
  const trimmedStored = storedPasscode.trim();

  // 1. Direct timing-safe comparison
  if (timingSafeCompare(trimmedSubmitted, trimmedStored)) {
    return true;
  }

  // 2. Compare against SHA-256 hash if stored in hashed format
  const submittedHash = hashPasscode(trimmedSubmitted);
  if (timingSafeCompare(submittedHash, trimmedStored)) {
    return true;
  }

  return false;
}

// 3. Security Headers Specification for Next.js Config
export const SECURITY_HEADERS = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
];
