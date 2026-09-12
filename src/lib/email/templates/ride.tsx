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

import type { RideEmailData } from "../types";

export function RideEmail({
  name,
  rideId,
  status,
  pickup,
  destination,
  driverName,
  driverPhone,
  amount,
  currency = "NGN",
  rideUrl,
}: RideEmailData) {
  const firstName = displayName(name);

  return (
    <EmailLayout
      preview={`Ride ${rideId} — ${humanizeStatus(
        status,
      )}`}
    >
      <EmailHeading>
        Ride update
      </EmailHeading>

      <EmailText>
        Hi {firstName}, here's the latest update
        about your Rush ride.
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
          Ride ID
        </Text>

        <Text
          style={{
            margin: "0 0 14px",
            fontSize: "16px",
            fontWeight: 700,
          }}
        >
          {rideId}
        </Text>

        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: 700,
            color: "#2D7F83",
          }}
        >
          {humanizeStatus(status)}
        </Text>
      </Section>

      {pickup && (
        <Text
          style={{
            fontSize: "14px",
            lineHeight: "22px",
            margin: "0 0 12px",
          }}
        >
          <strong>Pickup:</strong> {pickup}
        </Text>
      )}

      {destination && (
        <Text
          style={{
            fontSize: "14px",
            lineHeight: "22px",
            margin: "0 0 12px",
          }}
        >
          <strong>Destination:</strong>{" "}
          {destination}
        </Text>
      )}

      {driverName && (
        <Section
          style={{
            margin: "20px 0",
            padding: "16px",
            backgroundColor: "#f0f9fa",
            borderRadius: "12px",
          }}
        >
          <Text
            style={{
              margin: "0 0 6px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Driver
          </Text>

          <Text
            style={{
              margin: "0 0 4px",
              fontSize: "14px",
            }}
          >
            {driverName}
          </Text>

          {driverPhone && (
            <Text
              style={{
                margin: 0,
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              {driverPhone}
            </Text>
          )}
        </Section>
      )}

      {amount !== null &&
        amount !== undefined && (
          <Text
            style={{
              margin: "18px 0",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Fare: {formatMoney(amount, currency)}
          </Text>
        )}

      {rideUrl && (
        <Button
          href={rideUrl}
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
          View ride
        </Button>
      )}
    </EmailLayout>
  );
}

export default RideEmail;