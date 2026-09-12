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

import { displayName } from "../utils";

export type WelcomeEmailProps = {
  name?: string | null;
  appUrl: string;
};

export function WelcomeEmail({
  name,
  appUrl,
}: WelcomeEmailProps) {
  const firstName = displayName(name);

  return (
    <EmailLayout
      preview={`Welcome to Rush, ${firstName}!`}
    >
      <EmailHeading>
        Welcome to Rush, {firstName}! 🎉
      </EmailHeading>

      <EmailText>
        Your Rush account has been created
        successfully.
      </EmailText>

      <EmailText>
        With one Rush account, you can shop, sell,
        offer services, and request rides all in one
        place.
      </EmailText>

      <Section
        style={{
          backgroundColor: "#f0f9fa",
          borderRadius: "12px",
          padding: "18px",
          margin: "24px 0",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: "22px",
            color: "#245e61",
          }}
        >
          Thanks for joining Rush. We’re excited to
          have you with us.
        </Text>
      </Section>

      <Button
        href={appUrl}
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
        Open Rush
      </Button>
    </EmailLayout>
  );
}

export default WelcomeEmail;