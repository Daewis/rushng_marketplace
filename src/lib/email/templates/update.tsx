import {
  Button,
  Section,
} from "@react-email/components";

import * as React from "react";

import {
  EmailHeading,
  EmailLayout,
  EmailText,
} from "./layout";

import { displayName } from "../utils";

import type { AppUpdateEmailData } from "../types";

export function UpdateEmail({
  name,
  title,
  message,
  actionUrl,
  actionLabel = "Open Rush",
}: AppUpdateEmailData) {
  const firstName = displayName(name);

  return (
    <EmailLayout preview={title}>
      <EmailHeading>
        {title}
      </EmailHeading>

      <EmailText>
        Hi {firstName},
      </EmailText>

      <Section
        style={{
          margin: "20px 0",
        }}
      >
        <EmailText>
          {message}
        </EmailText>
      </Section>

      {actionUrl && (
        <Button
          href={actionUrl}
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
          {actionLabel}
        </Button>
      )}
    </EmailLayout>
  );
}

export default UpdateEmail;