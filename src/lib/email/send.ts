import "server-only";

import { randomUUID } from "node:crypto";

import { getResend } from "./client";
import { emailConfig } from "./config";
import type {
  EmailSendResult,
  SendEmailOptions,
} from "./types";

import { connect } from "@/lib/db";

/**
 * MongoDB collection used to track email deliveries.
 *
 * We intentionally use the native MongoDB connection here rather
 * than modifying the existing Rush db abstraction.
 */
async function getEmailCollection() {
  const { db } = await connect();

  const collection =
    db.collection("email_deliveries");

  /**
   * Unique idempotency key.
   *
   * This protects against duplicate welcome emails and repeated
   * transaction events.
   */
  await collection.createIndex(
    { idempotencyKey: 1 },
    { unique: true, sparse: true },
  );

  await collection.createIndex({
    userId: 1,
  });

  await collection.createIndex({
    type: 1,
  });

  await collection.createIndex({
    status: 1,
  });

  await collection.createIndex({
    createdAt: -1,
  });

  return collection;
}

/**
 * Send an email through Resend and record its delivery.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<EmailSendResult> {
  if (!emailConfig.apiKey) {
    console.warn(
      "[email] RESEND_API_KEY is not configured. Email skipped.",
    );

    return {
      success: false,
      skipped: true,
      error: "Email service is not configured.",
    };
  }

  if (!options.to.email) {
    return {
      success: false,
      error: "Recipient email is required.",
    };
  }

  const collection =
    await getEmailCollection();

  const idempotencyKey =
    options.idempotencyKey ||
    `email:${randomUUID()}`;

  /**
   * Check whether this logical email has already
   * been successfully sent.
   */
  const existing =
    await collection.findOne({
      idempotencyKey,
      status: "SENT",
    });

  if (existing) {
    return {
      success: true,
      skipped: true,
      id: String(existing.id),
      providerId:
        existing.providerId || undefined,
    };
  }

  /**
   * Create or refresh the delivery record.
   *
   * We use an application-level record so we can see exactly
   * what happened to each email.
   */
  const now = new Date();

  let delivery: any = null;

  try {
    const result =
      await collection.findOneAndUpdate(
        {
          idempotencyKey,
        },
        {
          $setOnInsert: {
            id: randomUUID(),
            idempotencyKey,
            userId:
              options.to.userId || null,
            email: options.to.email,
            name:
              options.to.name || null,
            type:
              options.type || "ACCOUNT_UPDATE",
            subject: options.subject,
            metadata:
              options.metadata || {},
            status: "PENDING",
            createdAt: now,
          },

          $set: {
            updatedAt: now,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      );

    delivery = result;
  } catch (error: any) {
    /**
     * A duplicate-key race can happen if two requests try to
     * create the same idempotency record simultaneously.
     *
     * Re-read the record and use it if another request already
     * created it.
     */
    if (
      error?.code === 11000 ||
      error?.codeName === "DuplicateKey"
    ) {
      delivery =
        await collection.findOne({
          idempotencyKey,
        });
    } else {
      throw error;
    }
  }

  if (!delivery) {
    return {
      success: false,
      error:
        "Unable to create email delivery record.",
    };
  }

  if (delivery.status === "SENT") {
    return {
      success: true,
      skipped: true,
      id: delivery.id,
      providerId:
        delivery.providerId || undefined,
    };
  }

  /**
   * Mark the record as SENDING.
   */
  await collection.updateOne(
    {
      id: delivery.id,
    },
    {
      $set: {
        status: "SENDING",
        sendingAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  try {
    const resend = getResend();

    const response =
      await resend.emails.send(
        {
          from: emailConfig.from,

          to: [
            options.to.name
              ? `${options.to.name} <${options.to.email}>`
              : options.to.email,
          ],

          subject: options.subject,

          html: options.html,

          ...(options.text
            ? { text: options.text }
            : {}),

          ...(emailConfig.replyTo
            ? {
                replyTo:
                  emailConfig.replyTo,
              }
            : {}),
        },
        {
          /**
           * Resend-level idempotency.
           *
           * This is a second layer of protection against
           * duplicate sends.
           */
          idempotencyKey,
        },
      );

    if (response.error) {
      throw new Error(
        response.error.message ||
          "Resend failed to send email.",
      );
    }

    const providerId =
      response.data?.id || null;

    await collection.updateOne(
      {
        id: delivery.id,
      },
      {
        $set: {
          status: "SENT",
          providerId,
          sentAt: new Date(),
          updatedAt: new Date(),
        },

        $unset: {
          error: "",
        },
      },
    );

    return {
      success: true,
      id: delivery.id,
      providerId:
        providerId || undefined,
    };
  } catch (error: any) {
    const message =
      error?.message ||
      "Failed to send email.";

    await collection.updateOne(
      {
        id: delivery.id,
      },
      {
        $set: {
          status: "FAILED",
          error: message,
          failedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    console.error(
      "[email] send failed:",
      message,
    );

    return {
      success: false,
      id: delivery.id,
      error: message,
    };
  }
}