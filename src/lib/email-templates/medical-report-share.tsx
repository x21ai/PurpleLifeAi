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

interface Props {
  senderName?: string;
  message?: string;
  windowFrom?: string;
  windowTo?: string;
  downloadUrl?: string;
  isSelf?: boolean;
}

const Email = ({
  senderName,
  message,
  windowFrom,
  windowTo,
  downloadUrl,
  isSelf,
}: Props) => {
  const who = senderName?.trim() || "A Purple user";
  const url = downloadUrl || "https://purplelife.org/";
  const title = isSelf
    ? "Your medical history report"
    : `${who} shared a medical history report with you`;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          {windowFrom && windowTo ? (
            <Text style={text}>
              Window: <strong>{windowFrom}</strong> to <strong>{windowTo}</strong>
            </Text>
          ) : null}
          {message ? (
            <Section style={quote}>
              <Text style={{ ...text, margin: 0 }}>{message}</Text>
            </Section>
          ) : null}
          <Text style={text}>
            The report is a PDF compiled from data tracked in {SITE_NAME}. It
            includes medications, events, biometric trends and journal themes.
            It is not a medical record.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button href={url} style={button}>
              Download report
            </Button>
          </Section>
          <Text style={small}>
            Or open this link:{" "}
            <Link href={url} style={{ color: BRAND }}>
              {url}
            </Link>
          </Text>
          <Text style={small}>This download link expires in 7 days.</Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { color: BRAND, fontSize: "22px", margin: "0 0 16px" };
const text = { color: TEXT, fontSize: "15px", lineHeight: "22px" };
const small = { color: MUTED, fontSize: "12px", lineHeight: "18px" };
const button = {
  backgroundColor: BRAND,
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: 600,
};
const quote = {
  borderLeft: `3px solid ${BRAND}`,
  padding: "8px 12px",
  margin: "12px 0",
  backgroundColor: "#faf7fd",
};

export const template = {
  component: Email,
  subject: (d: Record<string, unknown>) =>
    d.isSelf
      ? "Your Purple medical history report"
      : `${(d.senderName as string)?.trim() || "A Purple user"} shared a medical history report`,
  displayName: "Medical history report shared",
  previewData: {
    senderName: "Jane Doe", // live-data-guard:allow
    message: "Sharing this ahead of our visit next week.",
    windowFrom: "2026-03-01",
    windowTo: "2026-06-01",
    downloadUrl: "https://purplelife.org/",
    isSelf: false,
  },
} satisfies TemplateEntry;