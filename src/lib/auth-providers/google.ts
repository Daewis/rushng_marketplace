"use client";

/**
 * Google Sign-In via Firebase Authentication — REDIRECT flow.
 *
 * Why redirect (not popup):
 *   - Popups are blocked by mobile browsers, Brave, Safari ITP, and
 *     many corporate networks. The redirect flow works everywhere
 *     because the browser does a full-page navigation to Google,
 *     then back to this app — no JS-driven window required.
 *   - This is the flow Firebase recommends for production web apps
 *     that need to work on mobile.
 *
 * Flow:
 *   1. User clicks "Continue with Google".
 *   2. We call firebase/auth `signInWithRedirect(...)`. The browser
 *      navigates to accounts.google.com, the user picks an account,
 *      and Google redirectss back to this app.
 *   3. On page load, `useRedirectResult()` (see below) calls
 *      `getRedirectResult(auth)` to retrieve the Firebase credential.
 *   4. We POST the resulting Firebase ID token to /api/auth/firebase
 *      to exchange it for a RUSH session cookie.
 *   5. The hook then refreshes /me and navigates home.
 *
 * If Firebase isn't configured (env vars missing), the helper throws
 * AuthError with code "FIREBASE_NOT_CONFIGURED" — the UI should hide
 * the "Continue with Google" button in that case.
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
import { AuthError, type AuthResult } from "./types";

/**
 * Kick off the Google sign-in redirect. This function returns
 * immediately — the actual sign-in completes when the browser
 * comes back from Google and `consumeRedirectResult()` is called.
 *
 * The optional `redirectPath` is stashed in sessionStorage so that
 * after sign-in completes the user lands on the page they were
 * viewing (instead of always going to /).
 */
export async function signInWithGoogle(
  redirectPath: string = "/",
): Promise<void> {
  if (!isFirebaseConfigured || !firebaseAuth || !firebaseGoogleProvider) {
    throw new AuthError(
      "Google Sign-In isn't configured. Set the NEXT_PUBLIC_FIREBASE_* env vars.",
      "FIREBASE_NOT_CONFIGURED",
    );
  }
  // Remember where to send the user after sign-in completes.
  try {
    sessionStorage.setItem("rush.postLoginPath", redirectPath);
  } catch {
    // sessionStorage might be unavailable (private mode). Ignore.
  }
  await signInWithRedirect(firebaseAuth, firebaseGoogleProvider);
}

/**
 * Call this on the AuthScreen (or wherever the user lands after the
 * Google redirect) to complete the sign-in flow:
 *   - Pull the Firebase credential out of the redirect result.
 *   - Exchange the ID token for a RUSH session cookie via
 *     /api/auth/firebase.
 *   - Return the RUSH user record so the caller can refresh /me.
 *
 * Returns null when there's no redirect result to consume (e.g. the
 * user landed on the page directly, not via a Google redirect).
 */
export async function consumeRedirectResult(): Promise<AuthResult | null> {
  if (!isFirebaseConfigured || !firebaseAuth) {
    return null;
  }
  const cred: UserCredential | null = await getRedirectResult(firebaseAuth);
  if (!cred || !cred.user) {
    return null;
  }
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Login failed" }));
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
}

/**
 * Sign out the Firebase user (clears the redirect-based session). The
 * RUSH session cookie is cleared separately by calling /api/auth/logout.
 */
export async function signOutFirebase() {
  if (!firebaseAuth) return;
  const { signOut } = await import("firebase/auth");
  await signOut(firebaseAuth);
}
