import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { canCancel, customerCanCancel, getNextStep, getStepOwner, isTerminal } from "@/lib/order-status";
import { serializeOrder } from "@/lib/order-serialize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        vendor: {
          select: { id: true, businessName: true, slug: true, logo: true, phone: true, userId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const myRiderProfileId = (user as any)?.riderProfile?.id;
    const isOwner =
      !!user &&
      (order.customerId === user.id ||
        order.vendor.userId === user.id ||
        (!!order.riderId && myRiderProfileId === order.riderId));
    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let rider: { name: string; avatar: string | null; rating: number; vehicleType: string | null; plate: string | null } | null = null;
    if (order.riderId) {
      const r = await db.riderProfile.findUnique({ where: { id: order.riderId }, include: { vehicle: true } });
      if (r) {
        rider = {
          name: r.name,
          avatar: r.avatar,
          rating: r.rating,
          vehicleType: r.vehicle?.type || null,
          plate: r.vehicle?.plate || null,
        };
      }
    }

    return NextResponse.json({
      order: serializeOrder(order, order.vendor, rider),
    });
  } catch (err) {
    console.error("[order GET] error", err);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// PATCH /api/orders/:id
// Body:
//   { status: "CANCELLED" }                          — cancel (customer before confirm, vendor any time before terminal)
//   { status: "<next lifecycle status>", riderId? }   — the vendor advances one of *their* steps (confirm/prepare/assign rider)
// Once a rider is assigned, the remaining steps (pickup, delivered) are
// exclusively driven through /api/rider-jobs/:id — this endpoint will
// refuse to advance a rider-owned step even for the vendor, so there's
// only ever one path that can move an order forward at any given time.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { status: requestedStatus, riderId } = body;

    const order = await db.order.findUnique({
      where: { id },
      include: { vendor: { select: { userId: true, businessName: true, slug: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isVendorOwner = order.vendor.userId === user.id;
    const isCustomer = order.customerId === user.id;
    const myRiderProfileId = (user as any).riderProfile?.id;
    const isAssignedRider = !!order.riderId && myRiderProfileId === order.riderId;

    if (!isVendorOwner && !isCustomer && !isAssignedRider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (isTerminal(order.status)) {
      return NextResponse.json(
        { error: "This order is already complete and can no longer be changed." },
        { status: 400 },
      );
    }

    const nowTimestamp = () => new Date().toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" });

    let nextStatus: string;
    let timelineLabel: string;
    let riderIdToSet: string | undefined;
    let newRiderJobId: string | undefined;

    if (requestedStatus === "CANCELLED") {
      if (!isVendorOwner && !isCustomer) {
        return NextResponse.json({ error: "Only the customer or vendor can cancel this order." }, { status: 403 });
      }
      if (!canCancel(order.status)) {
        return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 400 });
      }
      if (isCustomer && !isVendorOwner && !customerCanCancel(order.status)) {
        return NextResponse.json(
          { error: "The vendor has already confirmed this order — ask them to cancel it." },
          { status: 403 },
        );
      }
      nextStatus = "CANCELLED";
      timelineLabel = isVendorOwner ? "Cancelled by vendor" : "Cancelled by customer";
      // Clean up any dangling job offer if the order is cancelled before a rider picked it up.
      await db.riderJob.updateMany({
        where: { orderId: id, status: { in: ["OFFERED", "ACCEPTED"] } },
        data: { status: "CANCELLED", respondedAt: new Date() },
      });
    } else {
      const owner = getStepOwner(order.fulfilment, order.status);
      if (owner === "RIDER") {
        return NextResponse.json(
          { error: "This step is handled by the assigned rider's job queue, not the order directly." },
          { status: 400 },
        );
      }
      if (!isVendorOwner) {
        return NextResponse.json({ error: "Only the vendor can update this order right now." }, { status: 403 });
      }

      const next = getNextStep(order.fulfilment, order.status);
      if (!next) {
        return NextResponse.json({ error: "No further status changes are available." }, { status: 400 });
      }
      if (requestedStatus && requestedStatus !== next.status) {
        return NextResponse.json(
          { error: `Order isn't ready for that step yet — next step is ${next.status.replace(/_/g, " ")}.` },
          { status: 409 },
        );
      }
      if (next.requiresRider) {
        if (!riderId) {
          return NextResponse.json({ error: "Select a rider to continue." }, { status: 400 });
        }
        const rider = await db.riderProfile.findUnique({ where: { id: riderId } });
        if (!rider || rider.status !== "ACTIVE") {
          return NextResponse.json({ error: "That rider isn't available right now." }, { status: 400 });
        }
        riderIdToSet = riderId;
        const job = await db.riderJob.create({
          data: { riderId, type: "DELIVERY", status: "OFFERED", orderId: id },
        });
        newRiderJobId = job.id;
      }
      nextStatus = next.status;
      timelineLabel = next.timelineLabel;
    }

    const timeline = [
      ...JSON.parse(order.timeline).map((t: any) => ({ ...t, completed: true })),
      { label: timelineLabel, timestamp: nowTimestamp(), completed: true },
    ];

    const updated = await db.order.update({
      where: { id },
      data: {
        status: nextStatus,
        timeline: JSON.stringify(timeline),
        ...(riderIdToSet !== undefined ? { riderId: riderIdToSet } : {}),
      },
    });

    let riderInfo: { name: string; avatar: string | null; rating: number; vehicleType: string | null; plate: string | null } | null = null;
    if (updated.riderId) {
      const r = await db.riderProfile.findUnique({ where: { id: updated.riderId }, include: { vehicle: true } });
      if (r) riderInfo = { name: r.name, avatar: r.avatar, rating: r.rating, vehicleType: r.vehicle?.type || null, plate: r.vehicle?.plate || null };
    }

    return NextResponse.json({ order: serializeOrder(updated, order.vendor, riderInfo), riderJobId: newRiderJobId });
  } catch (err) {
    if (err instanceof Response) throw err; // pass through requireUser's 401
    console.error("[order PATCH] error", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
