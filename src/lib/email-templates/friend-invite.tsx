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

const SITE_NAME = "Purple";
const BRAND = "#5B2C82";
const TEXT = "#0A0A0F";
const MUTED = "#55575d";

interface FriendInviteProps {
  inviterName?: string;
  acceptUrl?: string;
}

const FriendInviteEmail = ({ inviterName, acceptUrl }: FriendInviteProps) => {
  const inviter = inviterName?.trim() || "Someone on Purple";
  const url = acceptUrl || "https://purplelife.org/";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${inviter} added you to their circle on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{inviter} added you to their circle</Heading>
          <Text style={text}>
            On {SITE_NAME}, a circle is just a list of people you know. It does
            not share any health data, journal entries, or reports. You'll
            simply appear in each other's contacts.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Join their circle
            </Button>
          </Section>
          <Text style={small}>
            Or open this link:{" "}
            <Link href={url} style={{ color: BRAND }}>
              {url}
            </Link>
          </Text>
          <Text style={small}>
            You can leave at any time. They will not see any of your data.
          </Text>
          <Text style={footer}>, The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: FriendInviteEmail,
  subject: (d: Record<string, any>) =>
    `${d?.inviterName ? d.inviterName + " added you" : "You're invited"} to their circle on ${SITE_NAME}`,
  displayName: "Friend / circle invitation",
  previewData: {
    inviterName: "Jamie",
    acceptUrl: "https://purplelife.org/friend/accept?token=sample",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "22px", fontWeight: 700, color: TEXT, margin: "0 0 16px" };
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