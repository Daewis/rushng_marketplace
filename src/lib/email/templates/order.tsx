import {
  Button,
  Section,
  Text,
} from "@react-email/components";

import * as React from "react";

import {
  EmailHeading,
  EmailLayout,
  EmailText,
} from "./layout";

import {
  displayName,
  formatMoney,
  humanizeStatus,
} from "../utils";

import type { OrderEmailData } from "../types";

export function OrderEmail({
  name,
  orderId,
  status,
  amount,
  currency = "NGN",
  items = [],
  trackingUrl,
}: OrderEmailData & {
  appUrl?: string;
}) {
  const firstName = displayName(name);

  const statusLabel = humanizeStatus(status);

  return (
    <EmailLayout
      preview={`Order ${orderId} — ${statusLabel}`}
    >
      <EmailHeading>
        Order update
      </EmailHeading>

      <EmailText>
        Hi {firstName}, your Rush order has been
        updated.
      </EmailText>

      <Section
        style={{
          backgroundColor: "#f8fafc",
          borderRadius: "12px",
          padding: "18px",
          margin: "20px 0",
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Order ID
        </Text>

        <Text
          style={{
            margin: "0 0 14px",
            fontSize: "16px",
            fontWeight: 700,
            color: "#17202a",
          }}
        >
          {orderId}
        </Text>

        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          Status
        </Text>

        <Text
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 700,
            color: "#2D7F83",
          }}
        >
          {statusLabel}
        </Text>
      </Section>

      {items.length > 0 && (
        <Section
          style={{
            margin: "20px 0",
          }}
        >
          <Text
            style={{
              fontSize: "15px",
              fontWeight: 700,
              margin: "0 0 10px",
            }}
          >
            Items
          </Text>

          {items.map((item, index) => (
            <Section
              key={`${item.name}-${index}`}
              style={{
                padding: "10px 0",
                borderBottom:
                  "1px solid #e5e7eb",
              }}
            >
              <Text
                style={{
                  margin: "0 0 3px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {item.name}
              </Text>

              <Text
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Quantity: {item.quantity ?? 1}

                {item.price !== undefined &&
                  item.price !== null &&
                  ` · ${formatMoney(
                    item.price,
                    currency,
                  )}`}
              </Text>
            </Section>
          ))}
        </Section>
      )}

      {amount !== null &&
        amount !== undefined && (
          <Text
            style={{
              fontSize: "16px",
              fontWeight: 700,
              margin: "20px 0",
            }}
          >
            Total: {formatMoney(amount, currency)}
          </Text>
        )}

      {trackingUrl && (
        <Button
          href={trackingUrl}
          style={{
            display: "inline-block",
            backgroundColor: "#2D7F83",
            color: "#ffffff",
            padding: "13px 22px",
            borderRadius: "10px",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          View order
        </Button>
      )}
    </EmailLayout>
  );
}

export default OrderEmail;