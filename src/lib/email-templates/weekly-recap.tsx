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

const SITE_NAME = "Purple";
const TEXT = "#0A0A0F";
const MUTED = "#55575d";

interface Props {
  firstName?: string;
  entryCount?: number;
  voiceCount?: number;
  seizureCount?: number;
  missedDoses?: number;
  streakDays?: number;
  topTriggers?: Array<{ label: string; count: number }>;
  topTags?: Array<{ tag: string; count: number }>;
  todayUrl?: string;
}

const WeeklyRecapEmail = ({
  firstName,
  entryCount = 0,
  voiceCount = 0,
  seizureCount = 0,
  missedDoses = 0,
  streakDays = 0,
  topTriggers = [],
  topTags = [],
  todayUrl,
}: Props) => {
  const greeting = firstName?.trim() ? `Hi ${firstName},` : "Hi,";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your week on {SITE_NAME} — a quiet summary</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your week, in a few lines</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {entryCount === 0
              ? "No journal entries this week. Whenever you're ready, Purple is here."
              : `You wrote ${entryCount} ${entryCount === 1 ? "entry" : "entries"}${voiceCount > 0 ? ` (${voiceCount} by voice)` : ""}.`}
            {streakDays > 1 ? ` That's a ${streakDays}-day streak.` : ""}
          </Text>

          <Container style={listBox}>
            <Text style={rowTitle}>Events</Text>
            <Text style={rowMeta}>
              {seizureCount} seizure {seizureCount === 1 ? "event" : "events"} · {missedDoses} missed {missedDoses === 1 ? "dose" : "doses"}
            </Text>
          </Container>

          {topTriggers.length > 0 && (
            <Container style={listBox}>
              <Text style={rowTitle}>Possible triggers</Text>
              {topTriggers.map((t, i) => (
                <Text key={i} style={rowMeta}>• {t.label} ({t.count})</Text>
              ))}
            </Container>
          )}

          {topTags.length > 0 && (
            <Container style={listBox}>
              <Text style={rowTitle}>What came up most</Text>
              <Text style={rowMeta}>{topTags.map((t) => `${t.tag} ×${t.count}`).join(" · ")}</Text>
            </Container>
          )}

          {todayUrl ? (
            <Text style={text}>
              <EmailLink href={todayUrl} style={link}>Open your Today →</EmailLink>
            </Text>
          ) : null}

          <Text style={footer}>
            You're getting this because weekly recap is on. Turn it off in Settings → Preferences.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: WeeklyRecapEmail,
  subject: `Your week on ${SITE_NAME}`,
  displayName: "Weekly recap",
  previewData: {
    firstName: "Sam",
    entryCount: 5,
    voiceCount: 2,
    seizureCount: 1,
    missedDoses: 2,
    streakDays: 3,
    topTriggers: [
      { label: "Sleep changes", count: 3 },
      { label: "Stress", count: 2 },
    ],
    topTags: [
      { tag: "headache", count: 4 },
      { tag: "tired", count: 3 },
    ],
    todayUrl: "https://purplelife.org/today",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "20px", fontWeight: 700, color: TEXT, margin: "0 0 16px" };
const text = { fontSize: "15px", color: TEXT, lineHeight: "1.55", margin: "0 0 12px" };
const footer = { fontSize: "12px", color: MUTED, margin: "32px 0 0", lineHeight: "1.5" };
const link = { color: "#5b3ea0", textDecoration: "underline" };
const listBox = {
  padding: "12px 14px",
  margin: "12px 0",
  borderRadius: "8px",
  backgroundColor: "#f6f5f9",
};
const rowTitle = { fontSize: "13px", color: TEXT, fontWeight: 700, margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "0.04em" };
const rowMeta = { fontSize: "14px", color: MUTED, margin: "2px 0", lineHeight: "1.5" };