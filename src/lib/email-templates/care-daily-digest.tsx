import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link as EmailLink,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Purple Life";
const TEXT = "#0A0A0F";
const MUTED = "#55575d";

export interface DigestRow {
  caregiverName: string;
  action: string; // verbed: "logged a seizure", "added a journal entry"
  resourceType: string;
  at: string;
  preview?: string | null;
}

interface Props {
  ownerFirstName?: string;
  rows?: DigestRow[];
  total?: number;
  inboxUrl?: string;
  pendingCount?: number;
  attention?: string[];
}

const fmtTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const CareDailyDigestEmail = ({
  ownerFirstName,
  rows = [],
  total = 0,
  inboxUrl,
  pendingCount = 0,
  attention = [],
}: Props) => {
  const greeting = ownerFirstName?.trim() ? `Hi ${ownerFirstName},` : "Hi,";
  const count = total || rows.length;
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${count} caregiver ${count === 1 ? "update" : "updates"} on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your caregiver activity, last 24 hours</Heading>
          <Text style={text}>{greeting}</Text>

          {attention.length > 0 ? (
            <Container style={attentionBox}>
              <Text style={attentionTitle}>Needs your attention</Text>
              {attention.map((line, i) => (
                <Text key={i} style={attentionLine}>• {line}</Text>
              ))}
            </Container>
          ) : null}

          <Text style={text}>
            Here's what the people who care for you did on {SITE_NAME} yesterday.
          </Text>

          {rows.length === 0 ? (
            <Text style={small}>No caregiver activity in the last 24 hours.</Text>
          ) : (
            <Container style={listBox}>
              {rows.map((r, i) => (
                <Container key={i} style={row}>
                  <Text style={rowTitle}>
                    {r.caregiverName} {r.action}
                  </Text>
                  <Text style={rowMeta}>{fmtTime(r.at)}</Text>
                  {r.preview ? <Text style={small}>{r.preview}</Text> : null}
                </Container>
              ))}
            </Container>
          )}

          {pendingCount > 0 && inboxUrl ? (
            <Text style={text}>
              <strong>{pendingCount} {pendingCount === 1 ? "change is" : "changes are"} waiting for your review.</strong>{" "}
              <EmailLink href={inboxUrl} style={link}>
                Open the inbox →
              </EmailLink>
            </Text>
          ) : null}

          <Text style={footer}>
            You're getting this because at least one caregiver is sharing with you.
            Turn it off in Settings → Sharing.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CareDailyDigestEmail,
  subject: (d: Record<string, any>) => {
    const n = d?.total ?? d?.rows?.length ?? 0;
    return n === 1
      ? `1 caregiver update on ${SITE_NAME}`
      : `${n} caregiver updates on ${SITE_NAME}`;
  },
  displayName: "Care daily digest",
  previewData: {
    ownerFirstName: "Devyn",
    pendingCount: 1,
    inboxUrl: "https://purplelife.org/care/inbox",
    total: 3,
    attention: ["2 missed doses in the last 24h", "No journal entry in the last 72 hours"],
    rows: [
      {
        caregiverName: "Pat",
        action: "logged a seizure",
        resourceType: "seizure_events",
        at: new Date().toISOString(),
        preview: "Tonic-clonic, ~45s, no rescue med given",
      },
      {
        caregiverName: "Pat",
        action: "added a journal entry",
        resourceType: "journal_entries",
        at: new Date().toISOString(),
        preview: "Slept poorly, said her head felt heavy in the morning…",
      },
      {
        caregiverName: "Pat",
        action: "marked a medication dose taken",
        resourceType: "medication_doses",
        at: new Date().toISOString(),
      },
    ],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "20px", fontWeight: 700, color: TEXT, margin: "0 0 16px" };
const text = { fontSize: "15px", color: TEXT, lineHeight: "1.55", margin: "0 0 12px" };
const small = { fontSize: "13px", color: MUTED, lineHeight: "1.5", margin: "8px 0 12px" };
const footer = { fontSize: "12px", color: MUTED, margin: "32px 0 0", lineHeight: "1.5" };
const link = { color: "#5b3ea0", textDecoration: "underline" };
const listBox = { padding: "0", margin: "16px 0" };
const row = {
  padding: "12px 14px",
  margin: "0 0 8px",
  borderRadius: "8px",
  backgroundColor: "#f6f5f9",
};
const rowTitle = { fontSize: "14px", color: TEXT, fontWeight: 600, margin: "0 0 2px" };
const rowMeta = { fontSize: "11px", color: MUTED, margin: "0 0 4px", textTransform: "uppercase" as const };
const attentionBox = {
  padding: "12px 14px",
  margin: "0 0 16px",
  borderRadius: "8px",
  backgroundColor: "#fff4e5",
  border: "1px solid #f0c987",
};
const attentionTitle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#7a4a00",
  margin: "0 0 6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};
const attentionLine = { fontSize: "14px", color: "#3d2400", margin: "2px 0", lineHeight: "1.5" };