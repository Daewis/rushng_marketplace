import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const visibility = url.searchParams.get("visibility") || "PUBLIC";

    // PUBLIC = only PUBLIC stores. ALL = all stores.
    const where = visibility === "ALL" ? {} : { visibility };

    const vendors = await db.vendorProfile.findMany({
      where,
      orderBy: { rating: "desc" },
      // Cap page size — previously returned every PUBLIC vendor, growing
      // unbounded as the marketplace grows. Pagination (skip/cursor) is
      // a follow-up.
      take: 50,
    });

    const transformed = vendors.map((v) => ({
      id: v.id,
      userId: v.userId,
      businessName: v.businessName,
      slug: v.slug,
      description: v.description,
      category: v.category,
      logo: v.logo,
      coverImage: v.coverImage,
      phone: v.phone,
      whatsapp: v.whatsapp,
      email: v.email,
      location: v.location,
      instagram: v.instagram,
      tiktok: v.tiktok,
      facebook: v.facebook,
      theme: { coverColor: v.themeColor },
      visibility: v.visibility,
      deliveryEnabled: v.deliveryEnabled,
      deliveryFee: v.deliveryFee,
      deliveryTimeMin: v.deliveryTimeMin,
      rating: v.rating,
      reviewCount: v.reviewCount,
      followers: v.followers,
      verified: v.verified,
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json({ vendors: transformed });
  } catch (err: any) {
    // Public read endpoint — must never 500 with a stack trace.
    console.error("[stores GET] error", err?.message ?? err);
    return NextResponse.json(
      { error: "Failed to load stores", details: err?.message },
      { status: 500 },
    );
  }
}
