import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { isFirebaseAdminConfigured, verifyIdToken } from "@/lib/auth-providers/firebase-admin";

/**
 * POST /api/auth/firebase
 *
 * Exchange a Firebase ID token for a RUSH session cookie.
 *
 * Flow:
 *   1. Client signs in with Google via Firebase → gets idToken.
 *   2. POSTs idToken here.
 *   3. Backend verifies idToken with Firebase Admin SDK (or rejects
 *      with 401 if the token is invalid/expired).
 *   4. Backend looks up the RUSH user by firebaseUid.
 *      - If found → issue a RUSH session cookie.
 *      - If not found → create a new RUSH user (default CUSTOMER
 *        capability). This is the "first login = create account"
 *        pattern. Firebase identity is decoupled from RUSH roles —
 *        Google Sign-In never grants VENDOR/PROVIDER/RIDER; the user
 *        must apply for those separately via the onboarding flows.
 *   5. Set the rush_session cookie (same one used by the legacy
 *      email/password flow — backend doesn't care HOW the user
 *      authenticated, only that their RUSH user id is real).
 *
 * Firebase authentication should NOT determine the RUSH role:
 *   - Google doesn't make you a vendor.
 *   - Google doesn't make you a rider.
 *   - Google just answers "who is this person?"
 *   RUSH answers "what does this person have/do on RUSH?"
 */
export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseAdminConfigured) {
      return NextResponse.json(
        {
          error:
            "Firebase Auth isn't configured on the server. Set FIREBASE_SERVICE_ACCOUNT to the service-account JSON.",
        },
        { status: 503 },
      );
    }

    const body = await req.json();
    const { idToken } = body;
    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // 1. Verify the ID token. This is the critical security gate —
    //    the backend NEVER trusts a client claim about identity until
    //    verifyIdToken has checked the signature and expiry.
    const decoded = await verifyIdToken(idToken);
    if (!decoded.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Find or create the RUSH user by firebaseUid. Email is a
    //    secondary lookup — if the same email already exists from a
    //    legacy email/password registration, we link the firebaseUid
    //    to that account rather than creating a duplicate.
    let user = await db.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user && decoded.email) {
      // Link an existing email/password account to this Firebase uid.
      // This handles the migration case: someone who signed up via
      // email/password earlier and now signs in with Google.
      user = await db.user.findUnique({ where: { email: decoded.email } });
      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: { firebaseUid: decoded.uid },
        });
      }
    }

    if (!user) {
      // Create a new RUSH user from the Firebase identity. Default
      // capability is CUSTOMER/ACTIVE. Google Sign-In doesn't grant
      // any other role — those require separate onboarding.
      if (!decoded.email) {
        return NextResponse.json(
          { error: "Firebase user has no email — required to create a RUSH account." },
          { status: 400 },
        );
      }
      user = await db.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email,
          name: decoded.name || decoded.email.split("@")[0] || "Rush user",
          avatar: decoded.picture || null,
          // passwordHash is intentionally null — Firebase owns identity
          // for this account. The legacy email/password login flow will
          // reject it ("account was created with Google; sign in with Google").
          passwordHash: null,
          capabilities: JSON.stringify([{ type: "CUSTOMER", status: "ACTIVE" }]),
          activeWorkspace: "CUSTOMER",
          wallet: { create: { balance: 0 } },
        },
      });
    }

    // 3. Issue a RUSH session cookie. The cookie's payload is just
    //    the RUSH user id — the backend resolves the user from the
    //    DB on every request (no cached role/capability data in the
    //    token, so admin changes to a user's capabilities take
    //    effect immediately on their next request).
    const token = await createToken(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[auth/firebase POST] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to authenticate with Firebase" },
      { status: 500 },
    );
  }
}
