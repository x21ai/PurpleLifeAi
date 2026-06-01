import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

const SITE_NAME = "Purple Life";
const TEXT = "#0A0A0F";
const MUTED = "#55575d";

interface Props {
  ownerFirstName?: string;
  caregiverName?: string;
  action?: string;
  summary?: string;
}

const CaregiverWriteNoticeEmail = ({
  ownerFirstName,
  caregiverName,
  action,
  summary,
}: Props) => {
  const greeting = ownerFirstName?.trim() ? `Hi ${ownerFirstName},` : "Hi,";
  const who = caregiverName?.trim() || "A caregiver";
  const what = action?.trim() || "added something on your account";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${who} ${what} on ${SITE_NAME}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{who} {what}</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {who} just {what} on your Purple account. Open Purple to review the new entry.
          </Text>
          {summary ? <Text style={small}>{summary}</Text> : null}
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CaregiverWriteNoticeEmail,
  subject: (d: Record<string, any>) =>
    `${d?.caregiverName ?? "A caregiver"} ${d?.action ?? "made an update"} on ${SITE_NAME}`,
  displayName: "Caregiver write notice",
  previewData: {
    ownerFirstName: "Devyn",
    caregiverName: "Pat",
    action: "logged a seizure",
    summary: "Open Purple to review the new entry.",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "20px", fontWeight: 700, color: TEXT, margin: "0 0 16px" };
const text = { fontSize: "15px", color: TEXT, lineHeight: "1.55", margin: "0 0 12px" };
const small = { fontSize: "13px", color: MUTED, lineHeight: "1.5", margin: "8px 0 12px" };
const footer = { fontSize: "12px", color: MUTED, margin: "32px 0 0" };