/**
 * Firebase Admin SDK initialization (server-side only).
 *
 * Used to verify the ID tokens issued by the Firebase client SDK so
 * the backend can trust that the user is who they say they are.
 *
 * Reads `FIREBASE_SERVICE_ACCOUNT` env var — paste the entire JSON
 * from Firebase Console → Project settings → Service accounts →
 * Generate new private key. When the env var is empty, this module
 * exports `isFirebaseAdminConfigured = false` and `verifyIdToken`
 * throws — the caller is expected to handle the "Firebase not
 * configured" case by falling back to the legacy email/password flow.
 */

import "server-only";

export const isFirebaseAdminConfigured: boolean = Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT,
);

let adminApp: any = null;
let initError: string | null = null;

async function getAdminApp() {
  if (adminApp) return adminApp;
  if (initError) throw new Error(initError);
  if (!isFirebaseAdminConfigured) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set — Firebase Admin SDK is unavailable. " +
        "Set it to the service-account JSON from the Firebase Console.",
    );
  }

  // Lazy-import admin SDK — keeps it out of the client bundle.
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  let serviceAccount: any;
  try {
    // Accept either raw JSON or a stringified JSON (single line).
    // Vercel's env var UI sometimes wraps the JSON in extra quotes
    // or adds whitespace — trim + strip outer quotes before parsing.
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (typeof raw !== "string") {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not a string.");
    }
    let cleaned = raw.trim();
    // Strip surrounding quotes if Vercel added them.
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }
    // Unescape any literal \n sequences in the private key field —
    // Vercel's env var editor sometimes stores them as literal
    // backslash-n instead of actual newlines.
    if (cleaned.includes("\\n")) {
      cleaned = cleaned.replace(/\\n/g, "\n");
    }
    serviceAccount = JSON.parse(cleaned);
  } catch (e: any) {
    initError =
      "FIREBASE_SERVICE_ACCOUNT is set but isn't valid JSON. " +
      "Re-download the service-account JSON from the Firebase Console " +
      "and paste the entire file contents. Parse error: " + (e?.message ?? e);
    throw new Error(initError);
  }

  // Validate the service account has the required fields.
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    initError =
      "FIREBASE_SERVICE_ACCOUNT JSON is missing required fields " +
      "(project_id, private_key, client_email). Re-download from the Firebase Console.";
    throw new Error(initError);
  }

  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    return adminApp;
  } catch (e: any) {
    initError =
      "Failed to initialize Firebase Admin SDK: " + (e?.message ?? e);
    throw new Error(initError);
  }
}

/**
 * Verify a Firebase ID token (issued by the Firebase client SDK after
 * Google Sign-In). Returns the decoded payload, including the
 * stable Firebase `uid` and the user's `email` and `name`.
 *
 * The backend NEVER trusts the token's contents until this function
 * has verified the signature and checked expiry.
 */
export async function verifyIdToken(idToken: string): Promise<{
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}> {
  const app = await getAdminApp();
  const { getAuth } = await import("firebase-admin/auth");
  const decoded = await getAuth(app).verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
    emailVerified: decoded.email_verified ?? false,
  };
}
