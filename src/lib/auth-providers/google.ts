"use client";

/**
 * Google Sign-In via Firebase Authentication — REDIRECT flow.
 *
 * Why redirect instead of popup:
 *   The popup flow (`signInWithPopup`) has a known bug in Firebase
 *   Auth v12 where the Google Identity Services (GIS) library loads
 *   asynchronously and the popup opens before GIS is ready, causing
 *   "INTERNAL ASSERTION FAILED: Pending promise was never set".
 *   This affects Firefox, Safari ITP, mobile webviews, and popup
 *   blockers.
 *
 *   The redirect flow (`signInWithRedirect`) navigates the entire
 *   page to Google's auth page, then back to the app with the result.
 *   No popup, no GIS timing issue. Works everywhere.
 *
 * Flow:
 *   1. User clicks "Continue with Google".
 *   2. Browser navigates to accounts.google.com.
 *   3. User picks account → Google redirects back to the app.
 *   4. On mount, AuthScreen calls `handleRedirectResult()` which
 *      checks `getRedirectResult()` for the completed sign-in.
 *   5. If a user is returned, we get the ID token and POST it to
 *      /api/auth/firebase to create the RUSH session cookie.
 */

import {
  signInWithRedirect,
  getRedirectResult,
  type UserCredential,
} from "firebase/auth";

import {
  firebaseAuth,
  firebaseGoogleProvider,
  isFirebaseConfigured,
} from "./firebase-client";

import {
  AuthError,
  type AuthResult,
} from "./types";

/**
 * Start Google sign-in using a full-page redirect.
 *
 * This navigates AWAY from the app — the browser goes to Google,
 * the user picks an account, then Google redirects back. The result
 * is handled by `handleRedirectResult()` on the next page load.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth || !firebaseGoogleProvider) {
    throw new AuthError(
      "Google Sign-In isn't configured. Set the NEXT_PUBLIC_FIREBASE_* env vars.",
      "FIREBASE_NOT_CONFIGURED",
    );
  }

  // This navigates away from the page — the promise resolves after
  // the redirect is initiated, NOT after the user signs in. The
  // actual sign-in result is handled by handleRedirectResult() on
  // the next page load.
  await signInWithRedirect(firebaseAuth, firebaseGoogleProvider);

  // This return never executes in practice — the page navigates
  // away before we get here. But TypeScript needs a return value.
  return { id: "", email: "", name: "" };
}

/**
 * Check for a completed Google redirect sign-in.
 *
 * Call this on AuthScreen mount. If the user just came back from
 * Google's auth page, `getRedirectResult()` returns the credential.
 * We extract the ID token and POST it to /api/auth/firebase to
 * create the RUSH session cookie.
 *
 * Returns null if there's no redirect result (normal page load,
 * not returning from Google).
 */
export async function handleRedirectResult(): Promise<AuthResult | null> {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return null;
  }

  try {
    const cred: UserCredential | null = await getRedirectResult(firebaseAuth);

    if (!cred || !cred.user) {
      return null;
    }

    const idToken = await cred.user.getIdToken();

    const res = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ error: "Login failed" }));

      throw new AuthError(
        err.error || `Login failed (${res.status})`,
        String(res.status),
      );
    }

    const data = await res.json();

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
    };
  } catch (error: any) {
    if (error?.code === "auth/redirect-cancelled-by-user") {
      throw new AuthError(
        "Google sign-in was cancelled.",
        "GOOGLE_REDIRECT_CANCELLED",
      );
    }

    if (error instanceof AuthError) {
      throw error;
    }

    throw error;
  }
}

export async function signOutFirebase() {
  if (!firebaseAuth) return;

  const { signOut } = await import("firebase/auth");

  await signOut(firebaseAuth);
}
