import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkCapability, suspendedMessage, pendingVerificationMessage } from "@/lib/capability";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const query = url.searchParams.get("q");
  const vendorId = url.searchParams.get("vendorId");

  const products = await db.product.findMany({
    where: {
      ...(category && category !== "All" ? { category } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(query
        ? { name: { contains: query } }
        : {}),
    },
    include: {
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Transform to UI shape (parse JSON fields)
  const transformed = products.map((p) => ({
    id: p.id,
    vendorId: p.vendorId,
    vendorName: p.vendor.businessName,
    vendorSlug: p.vendor.slug,
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

  return NextResponse.json({ products: transformed });
}

// POST /api/products — vendor creates a product under their own store.
// The vendorId always comes from the caller's own vendor profile, never
// from the request body, so one vendor can never create products on
// behalf of another.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const vendorProfile = (user as any).vendorProfile;
    if (!vendorProfile) {
      return NextResponse.json(
        { error: "You need a vendor store before you can add products." },
        { status: 403 },
      );
    }

    // ⚠ Capability-status enforcement. A vendor whose VENDOR
    // capability has been SUSPENDED (e.g. by an admin for abuse)
    // shouldn't be able to keep listing new products. Same for
    // PENDING_VERIFICATION — although vendors self-activate on
    // onboarding, an admin could move them to PENDING to gate them.
    const vendorCap = checkCapability(user, "VENDOR");
    if (!vendorCap.hasCapability) {
      return NextResponse.json(
        { error: "You need a vendor store before you can add products." },
        { status: 403 },
      );
    }
    if (vendorCap.status === "SUSPENDED") {
      return NextResponse.json({ error: suspendedMessage("VENDOR") }, { status: 403 });
    }
    if (vendorCap.status === "PENDING_VERIFICATION") {
      return NextResponse.json({ error: pendingVerificationMessage("VENDOR") }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, compareAtPrice, images, category, condition, stock, location, tags } = body;

    if (!name || !description || price === undefined || price === null || !category) {
      return NextResponse.json(
        { error: "Name, description, price, and category are required." },
        { status: 400 },
      );
    }
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number." }, { status: 400 });
    }
    const imageList: string[] = Array.isArray(images) ? images.filter(Boolean) : [];
    if (imageList.length === 0) {
      return NextResponse.json({ error: "Add at least one product photo." }, { status: 400 });
    }
    // Defense-in-depth: image URLs must be either our own /uploads/
    // paths or an https URL. Rejects javascript:, data:, file:, etc.
    // even if a malicious caller posts directly to the API bypassing
    // the UI. /uploads/ paths come from POST /api/uploads which has
    // already re-encoded the image to WebP.
    for (const url of imageList) {
      if (typeof url !== "string" || (!url.startsWith("/uploads/") && !url.startsWith("https://"))) {
        return NextResponse.json(
          { error: "Image URLs must be /uploads/ paths or https:// URLs." },
          { status: 400 },
        );
      }
    }

    const product = await db.product.create({
      data: {
        vendorId: vendorProfile.id,
        name,
        description,
        price: parsedPrice,
        compareAtPrice: compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== ""
          ? Number(compareAtPrice)
          : null,
        images: JSON.stringify(imageList),
        category,
        condition: condition || null,
        stock: stock !== undefined && stock !== null && stock !== "" ? Math.max(0, parseInt(stock, 10) || 0) : 1,
        location: location || vendorProfile.location,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      },
    });

    return NextResponse.json({
      product: {
        ...product,
        images: JSON.parse(product.images),
        tags: JSON.parse(product.tags),
        vendorName: vendorProfile.businessName,
        vendorSlug: vendorProfile.slug,
      },
    });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    console.error("[products POST] error", err);
    return NextResponse.json({ error: err.message || "Failed to create product" }, { status: 500 });
  }
}
