import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "rush-dev-secret-change-in-production-please",
);

const COOKIE_NAME = "rush_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { sub: payload.sub as string };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const c = await cookies();
  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | undefined> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value;
}

/**
 * Get the authenticated user from the current request's cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    include: {
      vendorProfile: true,
      providerProfile: true,
      riderProfile: { include: { vehicle: true } },
      wallet: true,
    },
  });

  return user;
}

/**
 * Throw a 401 response if not authenticated. Otherwise return the user.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

/**
 * Throw 401 if not authenticated, 403 if authenticated but not an admin.
 * `ADMIN` is treated as a capability, not a separate role, so a user
 * with `[{type:"CUSTOMER",status:"ACTIVE"},{type:"ADMIN",status:"ACTIVE"}]`
 * is allowed; a user whose ADMIN capability is SUSPENDED is not.
 */
export async function requireAdmin() {
  const user = await requireUser();
  const caps = parseCapabilities(user.capabilities);
  const adminCap = caps.find((c: any) => c.type === "ADMIN");
  if (!adminCap || adminCap.status !== "ACTIVE") {
    throw new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

/**
 * Get parsed capabilities array from user record.
 */
export function parseCapabilities(raw: string | null | undefined) {
  if (!raw) return [{ type: "CUSTOMER", status: "ACTIVE" }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [{ type: "CUSTOMER", status: "ACTIVE" }];
  } catch {
    return [{ type: "CUSTOMER", status: "ACTIVE" }];
  }
}

/**
 * Serialize capabilities array back to JSON string for storage.
 */
export function serializeCapabilities(caps: any[]): string {
  return JSON.stringify(caps);
}

/**
 * Add a capability to the user's capabilities array if not already present.
 */
export function addCapability(user: any, type: string, status = "ACTIVE", profileId?: string) {
  const caps = parseCapabilities(user.capabilities);
  const exists = caps.find((c: any) => c.type === type);
  if (exists) return caps;
  caps.push({ type, status, ...(profileId ? { profileId } : {}) });
  return caps;
}
