import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({
    where: { slug },
    include: {
      // Cap product list at 100. Previously pulled every product for
      // the vendor with no limit, which on a large catalog would
      // balloon the response and tank the storefront page.
      products: {
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  // Visibility gate — admin-only "ALL" filter on the public list
  // endpoint doesn't apply here, but a vendor marked PRIVATE (e.g.
  // suspended by an admin) should not be reachable by slug from a
  // public caller. LINK_ONLY is reachable if you have the link, which
  // is the existing semantics, so we leave that alone.
  if (!vendor || vendor.visibility === "PRIVATE") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const products = vendor.products.map((p) => ({
    id: p.id,
    vendorId: p.vendorId,
    vendorName: vendor.businessName,
    vendorSlug: vendor.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    images: JSON.parse(p.images),
    category: p.category,
    condition: p.condition ?? undefined,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    location: p.location,
    createdAt: p.createdAt.toISOString(),
    tags: JSON.parse(p.tags),
  }));

  return NextResponse.json({
    vendor: {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      slug: vendor.slug,
      description: vendor.description,
      category: vendor.category,
      logo: vendor.logo,
      coverImage: vendor.coverImage,
      phone: vendor.phone,
      whatsapp: vendor.whatsapp,
      email: vendor.email,
      location: vendor.location,
      instagram: vendor.instagram,
      tiktok: vendor.tiktok,
      facebook: vendor.facebook,
      theme: { coverColor: vendor.themeColor },
      visibility: vendor.visibility,
      deliveryEnabled: vendor.deliveryEnabled,
      deliveryFee: vendor.deliveryFee,
      deliveryTimeMin: vendor.deliveryTimeMin,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      followers: vendor.followers,
      verified: vendor.verified,
      createdAt: vendor.createdAt.toISOString(),
    },
    products,
  });
}

/**
 * PATCH /api/stores/:slug — vendor-only edit of their own store.
 *
 * Only the owner of the store (the user whose userId matches the
 * vendorProfile's userId) can edit. All fields are optional; only
 * what's sent is updated.
 *
 * Accepts: businessName, description, category, logo (URL from
 * /api/uploads), coverImage, phone, whatsapp, email, location,
 * instagram, tiktok, facebook, themeColor, visibility, deliveryEnabled,
 * deliveryFee, deliveryTimeMin.
 *
 * Slug is NOT editable here — changing the public URL of a store
 * would break every existing link, so it's locked at onboarding.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const body = await req.json();

    const vendor = await db.vendorProfile.findUnique({ where: { slug } });
    if (!vendor) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }
    if (vendor.userId !== user.id) {
      return NextResponse.json(
        { error: "Only the store owner can edit these settings" },
        { status: 403 },
      );
    }

    // Allow-list of fields the vendor can edit. Anything else in the
    // body is ignored — we never let the body directly override
    // computed fields like rating, reviewCount, followers, verified.
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const fields = [
      "businessName", "description", "category", "logo", "coverImage",
      "phone", "whatsapp", "email", "location",
      "instagram", "tiktok", "facebook", "themeColor",
      "visibility", "deliveryEnabled", "deliveryFee", "deliveryTimeMin",
    ] as const;

    for (const f of fields) {
      if (!(f in body)) continue;
      const val = body[f];
      // For image URLs, accept both /api/uploads/ (GridFS — current
      // pattern) and /uploads/ (legacy filesystem pattern, kept for
      // backward compat). Also accept https:// URLs. Rejects
      // javascript:, data:, file:, etc.
      if (f === "logo" || f === "coverImage") {
        if (typeof val === "string" && (val.startsWith("/api/uploads/") || val.startsWith("/uploads/") || val.startsWith("https://") || val === "")) {
          updates[f] = val;
        } else {
          return NextResponse.json(
            { error: `${f} must be a /api/uploads/ URL or an https URL` },
            { status: 400 },
          );
        }
        continue;
      }
      // Enum validation for visibility.
      if (f === "visibility" && !["PUBLIC", "LINK_ONLY", "PRIVATE"].includes(val)) {
        return NextResponse.json(
          { error: "Visibility must be PUBLIC, LINK_ONLY, or PRIVATE" },
          { status: 400 },
        );
      }
      // Booleans must be actual booleans.
      if (f === "deliveryEnabled" && typeof val !== "boolean") {
        return NextResponse.json(
          { error: "deliveryEnabled must be true or false" },
          { status: 400 },
        );
      }
      // Numbers must be non-negative.
      if ((f === "deliveryFee" || f === "deliveryTimeMin") && (typeof val !== "number" || val < 0 || !Number.isFinite(val))) {
        return NextResponse.json(
          { error: `${f} must be a non-negative number` },
          { status: 400 },
        );
      }
      updates[f] = val;
    }

    const updated = await db.vendorProfile.update({
      where: { slug },
      data: updates,
    });

    return NextResponse.json({
      vendor: {
        id: updated.id,
        businessName: updated.businessName,
        slug: updated.slug,
        description: updated.description,
        category: updated.category,
        logo: updated.logo,
        coverImage: updated.coverImage,
        phone: updated.phone,
        whatsapp: updated.whatsapp,
        email: updated.email,
        location: updated.location,
        instagram: updated.instagram,
        tiktok: updated.tiktok,
        facebook: updated.facebook,
        theme: { coverColor: updated.themeColor },
        visibility: updated.visibility,
        deliveryEnabled: updated.deliveryEnabled,
        deliveryFee: updated.deliveryFee,
        deliveryTimeMin: updated.deliveryTimeMin,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[stores PATCH] error", err);
    return NextResponse.json(
      { error: err.message || "Failed to update store" },
      { status: 500 },
    );
  }
}
