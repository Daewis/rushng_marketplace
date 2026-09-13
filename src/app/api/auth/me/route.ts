import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's full profile (with vendorProfile,
 * providerProfile, riderProfile, wallet included) or null.
 *
 * Note: returns 200 with `user: null` for unauthenticated callers —
 * this is intentional so the client can treat it uniformly (no error
 * to catch on a fresh page load). Auth-required mutations use
 * requireUser() which throws 401.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const wallet = user.wallet ?? null;

    return NextResponse.json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid ?? null,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        location: user.location,
        capabilities: JSON.parse(user.capabilities),
        activeWorkspace: user.activeWorkspace,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        wallet: wallet ? { balance: wallet.balance } : null,
        vendorProfile: user.vendorProfile ?? null,
        providerProfile: user.providerProfile ?? null,
        riderProfile: user.riderProfile ?? null,
      },
    });
  } catch (err: any) {
    console.error("[auth/me GET] error", err);
    // Don't leak internal errors — return null user so client treats
    // it as unauthenticated rather than a server failure.
    return NextResponse.json({ user: null });
  }
}

/**
 * PATCH /api/auth/me
 *
 * Update the current user's profile: name, phone, avatar URL,
 * location. All fields are optional — only what's sent is updated.
 *
 * Avatar should be a `/uploads/...` URL returned by POST /api/uploads.
 * For backwards-compat we also accept any https URL.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { name, phone, avatar, location } = body;

    // Validate only the fields we want to allow editing. We never
    // accept email or capabilities changes via this route — email
    // changes need a separate verification flow, capability changes
    // go through onboarding/admin routes.
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof name === "string" && name.trim().length >= 2) {
      updates.name = name.trim();
    }
    if (typeof phone === "string") {
      updates.phone = phone.trim() || null;
    }
    if (typeof avatar === "string") {
      // Accept /api/uploads/ (GridFS — current pattern) and
      // /uploads/ (legacy filesystem pattern — kept for backward
      // compat with any pre-GridFS data). Also accept https:// URLs.
      // Reject javascript:, data:, file:, etc.
      if (
        avatar.startsWith("/api/uploads/") ||
        avatar.startsWith("/uploads/") ||
        avatar.startsWith("https://")
      ) {
        updates.avatar = avatar;
      } else {
        return NextResponse.json(
          { error: "Avatar must be a /api/uploads/ URL or an https URL" },
          { status: 400 },
        );
      }
    }
    if (typeof location === "string") {
      updates.location = location.trim() || null;
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: updates,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      avatar: updated.avatar,
      location: updated.location,
      capabilities: JSON.parse(updated.capabilities),
      activeWorkspace: updated.activeWorkspace,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[auth/me PATCH] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to update profile" },
      { status: 500 },
    );
  }
}
