import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/order-serialize";

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { items, vendorId, fulfilment, paymentMethod, deliveryAddress, deliveryFee = 0 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Vendor is required" }, { status: 400 });
    }

    const vendor = await db.vendorProfile.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Validate stock & compute subtotal
    const productIds = items.map((i: any) => i.productId);
    const products = await db.product.findMany({ where: { id: { in: productIds } } });

    const lineItems = items.map((i: any) => {
      const p = products.find((pp) => pp.id === i.productId);
      if (!p) throw new Error(`Product ${i.productId} not found`);
      return {
        productId: p.id,
        vendorId: p.vendorId,
        vendorName: vendor.businessName,
        name: p.name,
        image: JSON.parse(p.images)[0] || "",
        price: p.price,
        quantity: i.quantity,
      };
    });

    const subtotal = lineItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const total = subtotal + deliveryFee;

    // Generate a unique order code
    const code = `RSH-${Math.floor(10000 + Math.random() * 90000)}`;

    // Initial timeline
    const now = new Date();
    const timeline = [
      { label: "Order placed", timestamp: now.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" }), completed: true },
    ];

    const order = await db.order.create({
      data: {
        code,
        customerId: user.id,
        vendorId: vendor.id,
        items: JSON.stringify(lineItems),
        subtotal,
        deliveryFee,
        total,
        fulfilment,
        paymentMethod,
        status: "PLACED",
        deliveryAddress: deliveryAddress || null,
        customerName: user.name,
        customerPhone: user.phone || "",
        timeline: JSON.stringify(timeline),
      },
    });

    return NextResponse.json({ order });
  } catch (err: any) {
    console.error("[orders POST] error", err);
    if (err instanceof Response) throw err; // pass through requireUser's 401
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 },
    );
  }
}

// GET /api/orders?scope=customer|vendor|rider — list orders relevant to the
// caller in that role. Defaults to "customer". A user can be a customer,
// vendor, and rider at once, so the caller must say which hat they're wearing.
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    const scope = req.nextUrl.searchParams.get("scope") || "customer";

    let where: Record<string, string>;
    if (scope === "vendor") {
      const vendorId = (user as any).vendorProfile?.id;
      if (!vendorId) return NextResponse.json({ orders: [] });
      where = { vendorId };
    } else if (scope === "rider") {
      const riderId = (user as any).riderProfile?.id;
      if (!riderId) return NextResponse.json({ orders: [] });
      where = { riderId };
    } else {
      where = { customerId: user.id };
    }

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: { id: true, businessName: true, slug: true, logo: true },
        },
      },
    });

    // Batch-fetch rider info for any orders that have one assigned, instead
    // of one query per order.
    const riderIds = [...new Set(orders.map((o) => o.riderId).filter(Boolean))] as string[];
    const riders = riderIds.length
      ? await db.riderProfile.findMany({ where: { id: { in: riderIds } }, include: { vehicle: true } })
      : [];
    const riderMap = new Map<string, { name: string; avatar: string | null; rating: number; vehicleType: string | null; plate: string | null }>(
      riders.map((r) => [
        r.id,
        { name: r.name, avatar: r.avatar, rating: r.rating, vehicleType: r.vehicle?.type || null, plate: r.vehicle?.plate || null },
      ]),
    );

    const transformed = orders.map((o) => serializeOrder(o, o.vendor, o.riderId ? riderMap.get(o.riderId) : null));

    return NextResponse.json({ orders: transformed });
  } catch (err) {
    console.error("[orders GET] error", err);
    return NextResponse.json({ orders: [] });
  }
}
