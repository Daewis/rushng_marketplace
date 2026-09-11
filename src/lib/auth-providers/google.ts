"use client";

/**
 * Google Sign-In via Firebase Authentication — POPUP flow.
 *
 * Flow:
 *   1. User clicks "Continue with Google".
 *   2. Firebase opens Google's authentication page in a popup.
 *   3. User selects/signs into their Google account.
 *   4. The popup closes and Firebase returns the authenticated user.
 *   5. We obtain the Firebase ID token.
 *   6. We POST the ID token to /api/auth/firebase.
 *   7. The server creates the RUSH session cookie.
 */

import {
  signInWithPopup,
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
 * Start Google sign-in using a popup.
 *
 * The popup completes the Firebase authentication flow and returns
 * the authenticated user. We then obtain the Firebase ID token and
 * exchange it with the RUSH backend for the RUSH session cookie.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  if (!isFirebaseConfigured || !firebaseAuth || !firebaseGoogleProvider) {
    throw new AuthError(
      "Google Sign-In isn't configured. Set the NEXT_PUBLIC_FIREBASE_* env vars.",
      "FIREBASE_NOT_CONFIGURED",
    );
  }

  try {
    const cred: UserCredential = await signInWithPopup(
      firebaseAuth,
      firebaseGoogleProvider,
    );

    if (!cred.user) {
      throw new AuthError(
        "Google sign-in did not return a user.",
        "GOOGLE_SIGN_IN_FAILED",
      );
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
    if (error?.code === "auth/popup-closed-by-user") {
      throw new AuthError(
        "Google sign-in was cancelled.",
        "GOOGLE_POPUP_CLOSED",
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
