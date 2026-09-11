// Shared shape-normalizer for orders returned from any API route.
// Centralizing this avoids the bug where one route parses items/timeline
// JSON and attaches rider/vendor info, while another returns raw DB rows.

export interface RiderInfo {
  name: string;
  avatar: string | null;
  rating: number;
  vehicleType?: string | null;
  plate?: string | null;
}

export interface VendorInfo {
  businessName: string;
  slug: string;
}

export function serializeOrder(order: any, vendor: VendorInfo, rider?: RiderInfo | null) {
  return {
    id: order.id,
    code: order.code,
    vendorId: order.vendorId,
    vendorName: vendor.businessName,
    vendorSlug: vendor.slug,
    items: typeof order.items === "string" ? JSON.parse(order.items) : order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    fulfilment: order.fulfilment,
    paymentMethod: order.paymentMethod,
    status: order.status,
    deliveryAddress: order.deliveryAddress,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    riderId: order.riderId || undefined,
    rider: rider || undefined,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt,
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : order.updatedAt,
    timeline: typeof order.timeline === "string" ? JSON.parse(order.timeline) : order.timeline,
  };
}
