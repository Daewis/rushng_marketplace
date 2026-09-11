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

async function getAdminApp() {
  if (adminApp) return adminApp;
  if (!isFirebaseAdminConfigured) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is not set — Firebase Admin SDK is unavailable. " +
        "Set it to the service-account JSON from the Firebase Console.",
    );
  }

  // Lazy-import admin SDK — keeps it out of the client bundle.
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  if (getApps().length) return getApps()[0];

  let serviceAccount: any;
  try {
    // Accept either raw JSON or a stringified JSON (single line).
    serviceAccount =
      typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
  } catch (e: any) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT is set but isn't valid JSON. " +
        "Re-download the service-account JSON from the Firebase Console " +
        "and paste the entire file contents. Parse error: " + e.message,
    );
  }

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
  return adminApp;
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
