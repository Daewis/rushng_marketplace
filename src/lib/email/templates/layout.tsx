import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import * as React from "react";

type EmailLayoutProps = {
  preview: string;
  children: React.ReactNode;
};

export function EmailLayout({
  preview,
  children,
}: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head />

      <Preview>{preview}</Preview>

      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f5f7f8",
          fontFamily:
            "Arial, Helvetica, sans-serif",
          color: "#17202a",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "32px 20px",
          }}
        >
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}
          >
            <Section
              style={{
                backgroundColor: "#2D7F83",
                padding: "24px",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: "-1px",
                }}
              >
                rush
              </Text>
            </Section>

            <Section
              style={{
                padding: "32px 28px",
              }}
            >
              {children}
            </Section>

            <Hr
              style={{
                borderColor: "#e5e7eb",
                margin: "0 28px",
              }}
            />

            <Section
              style={{
                padding: "20px 28px 28px",
              }}
            >
              <Text
                style={{
                  margin: "0 0 8px",
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                This email was sent by Rush.
              </Text>

              <Text
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Please do not reply to this automated
                notification.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Heading
      style={{
        margin: "0 0 12px",
        fontSize: "24px",
        lineHeight: "32px",
        fontWeight: 800,
        color: "#17202a",
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: "15px",
        lineHeight: "24px",
        color: "#4b5563",
      }}
    >
      {children}
    </Text>
  );
}