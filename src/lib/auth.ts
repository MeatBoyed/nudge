import "server-only";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE_NAME = "nudge_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function verifyPassphrase(candidate: string): Promise<boolean> {
  const encoded = process.env.APP_PASSPHRASE_HASH_B64;
  if (!encoded) throw new Error("APP_PASSPHRASE_HASH_B64 is not set");
  // Stored base64-encoded so the bcrypt hash's literal `$` separators can't be
  // mangled by Next.js's .env variable interpolation (which treats `$word` as
  // a shell-style reference) or by other env-file parsers along the way.
  const hash = Buffer.from(encoded, "base64").toString("utf8");
  return bcrypt.compare(candidate, hash);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
