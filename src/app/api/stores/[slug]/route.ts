import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const vendor = await db.vendorProfile.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) {
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
