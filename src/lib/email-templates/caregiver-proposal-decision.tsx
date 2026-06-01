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
  caregiverFirstName?: string;
  ownerName?: string;
  decision?: "approved" | "rejected";
  changeLabel?: string;
  decisionNote?: string;
}

const CaregiverProposalDecisionEmail = ({
  caregiverFirstName,
  ownerName,
  decision,
  changeLabel,
  decisionNote,
}: Props) => {
  const greeting = caregiverFirstName?.trim() ? `Hi ${caregiverFirstName},` : "Hi,";
  const who = ownerName?.trim() || "The account owner";
  const verb = decision === "approved" ? "approved" : "declined";
  const label = changeLabel?.trim() || "your proposed change";
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${who} ${verb} ${label}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{who} {verb} your proposal</Heading>
          <Text style={text}>{greeting}</Text>
          <Text style={text}>
            {who} {verb} {label} on {SITE_NAME}.
          </Text>
          {decisionNote ? (
            <Text style={small}>Note from {who}: {decisionNote}</Text>
          ) : null}
          <Text style={footer}>— The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: CaregiverProposalDecisionEmail,
  subject: (d: Record<string, any>) =>
    `${d?.ownerName ?? "The account owner"} ${
      d?.decision === "approved" ? "approved" : "declined"
    } your proposal on ${SITE_NAME}`,
  displayName: "Caregiver proposal decision",
  previewData: {
    caregiverFirstName: "Pat",
    ownerName: "Devyn",
    decision: "approved",
    changeLabel: "your note on a journal entry",
    decisionNote: "Thanks for the heads-up!",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "32px 24px", maxWidth: "560px", margin: "0 auto" };
const h1 = { fontSize: "20px", fontWeight: 700, color: TEXT, margin: "0 0 16px" };
const text = { fontSize: "15px", color: TEXT, lineHeight: "1.55", margin: "0 0 12px" };
const small = { fontSize: "13px", color: MUTED, lineHeight: "1.5", margin: "8px 0 12px" };
const footer = { fontSize: "12px", color: MUTED, margin: "32px 0 0" };