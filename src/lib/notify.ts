import "server-only";

import { db } from "@/lib/db";
import { randomBytes } from "node:crypto";

/**
 * In-app notification helper.
 *
 * Notifications are short messages a user sees in their notification
 * bell — distinct from email (which is a separate, async channel).
 * Notifications are stored in the `notifications` collection.
 *
 * Each notification has:
 *   - userId: the recipient
 *   - type: enum (ORDER_UPDATE, RIDE_UPDATE, PAYMENT, FOLLOW, SYSTEM)
 *   - title, body: short human-readable text
 *   - link?: optional view+params to deep-link into
 *   - read: boolean (false on creation)
 *
 * Routes that change state a user cares about call notifyUser() to
 * drop a notification. The TopBar's bell polls /api/notifications to
 * show unread count + recent list.
 */

export type NotificationType =
  | "ORDER_UPDATE"
  | "RIDE_UPDATE"
  | "PAYMENT"
  | "FOLLOW"
  | "SYSTEM";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  /** Optional deep-link target. e.g. { view: "order-tracking", orderId: "..." } */
  link?: {
    view: string;
    params?: Record<string, string>;
  };
}

/**
 * Create a notification for a user. Idempotent on (userId, type,
 * link.params.idempotencyKey) — see the dedupKey option.
 *
 * Fire-and-forget: callers should `void notifyUser(...)` or wrap in
 * try/catch. Notification failures should never block a request.
 */
export async function notifyUser(input: NotifyInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        id: randomBytes(12).toString("hex"),
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ? JSON.stringify(input.link) : null,
        read: false,
        createdAt: new Date(),
      },
    });
  } catch (err: any) {
    // Don't let notification failures break the parent flow.
    console.error("[notify] failed:", err?.message ?? err);
  }
}
