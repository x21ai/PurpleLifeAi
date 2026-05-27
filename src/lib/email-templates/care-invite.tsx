import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Purple Life";
const BRAND = "#5B2C82";
const TEXT = "#0A0A0F";
const MUTED = "#55575d";

interface CareInviteProps {
  inviterName?: string;
  roleLabel?: string;
  acceptUrl?: string;
  expiresAt?: string | null;
}

const CareInviteEmail = ({
  inviterName,
  roleLabel,
  acceptUrl,
  expiresAt,
}: CareInviteProps) => {
  const inviter = inviterName?.trim() || "Someone on Purple Life";
  const role = roleLabel?.trim() || "care partner";
  const url = acceptUrl || "https://purplelife.org/";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${inviter} invited you to join their care circle on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're invited as a {role}</Heading>
          <Text style={text}>
            {inviter} added you to their care circle on {SITE_NAME}. Accept the
            invitation to see what they've chosen to share with you.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Accept invitation
            </Button>
          </Section>
          <Text style={small}>
            Or open this link:{" "}
            <Link href={url} style={{ color: BRAND }}>
              {url}
            </Link>
          </Text>
          {expiresAt ? (
            <Text style={small}>
              This invite expires {new Date(expiresAt).toLocaleString()}.
            </Text>
          ) : null}
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CareInviteEmail,
  subject: (d: Record<string, any>) =>
    `${d?.inviterName ? d.inviterName + " invited you" : "You're invited"} to ${SITE_NAME}`,
  displayName: "Care circle invitation",
  previewData: {
    inviterName: "Jamie",
    roleLabel: "Caregiver / Co-pilot",
    acceptUrl: "https://purplelife.org/care/accept?token=sample",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = {
  fontSize: "22px",
  fontWeight: 700,
  color: TEXT,
  margin: "0 0 16px",
};
const text = { fontSize: "15px", color: TEXT, lineHeight: "1.55", margin: "0 0 16px" };
const small = { fontSize: "12px", color: MUTED, lineHeight: "1.5", margin: "0 0 12px" };
const footer = { fontSize: "12px", color: MUTED, margin: "32px 0 0" };
const button = {
  backgroundColor: BRAND,
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "15px",
};