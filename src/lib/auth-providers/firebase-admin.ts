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
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (typeof raw !== "string") {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not a string.");
    }
    let cleaned = raw.trim();

    // Strip surrounding wrapping quotes if Vercel added them
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }

    // Support Base64 encoded service accounts (common best-practice fallback)
    if (!cleaned.startsWith("{") && !cleaned.endsWith("}")) {
      try {
        const decoded = Buffer.from(cleaned, "base64").toString("utf-8");
        if (decoded.trim().startsWith("{")) {
          cleaned = decoded.trim();
        }
      } catch {
        // Not base64, proceed with original string
      }
    }

    // Parse JSON directly without replacing \n with raw control characters
    serviceAccount = JSON.parse(cleaned);

    // Normalize newlines ONLY on the private_key field after parsing
    if (typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
  } catch (e: any) {
    initError =
      "FIREBASE_SERVICE_ACCOUNT is set but isn't valid JSON. " +
      "Re-download the service-account JSON from the Firebase Console " +
      "and paste the entire file contents. Parse error: " + (e?.message ?? e);
    throw new Error(initError);
  }

  // Validate the service account has the required fields.
  if (
    !serviceAccount.project_id ||
    !serviceAccount.private_key ||
    !serviceAccount.client_email
  ) {
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
