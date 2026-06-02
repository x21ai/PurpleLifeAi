// Atomic scope identifiers for caregiver permissions.
// Format: <resource>:<verb>

export const CARE_RESOURCES = [
  "today",
  "journal",
  "meds",
  "biometrics",
  "seizures",
  "reports",
  "risk",
  "community",
  "profile",
  "location",
  "chat",
  "alerts",
] as const;
export type CareResource = (typeof CARE_RESOURCES)[number];

export const CARE_VERBS = ["read", "comment", "propose", "receive", "write"] as const;
export type CareVerb = (typeof CARE_VERBS)[number];

export type CareScope = `${CareResource}:${CareVerb}`;

export type CareRole = "emergency" | "caregiver" | "provider" | "viewer";

export const ROLE_LABELS: Record<CareRole, string> = {
  emergency: "Emergency contact",
  caregiver: "Caregiver / Co-pilot",
  provider: "Care provider",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<CareRole, string> = {
  emergency:
    "Notified when a seizure is logged. Sees your profile, recent seizures, and location.",
  caregiver:
    "Day-to-day partner or family. Sees most things and can suggest edits to meds and journal.",
  provider:
    "Clinician access. Sees biometrics, meds, seizures, journal — read-only.",
  viewer: "Only sees your Today screen. Nothing else.",
};

// Purely a human label for how the caregiver relates to the owner.
// Does NOT affect permissions — those still come from CareRole + CareScope.
export const RELATIONSHIP_LABELS = [
  "Parent",
  "Child",
  "Sibling",
  "Spouse",
  "Partner",
  "Friend",
  "Doctor",
  "Nurse",
  "Therapist",
  "Caregiver",
  "Other",
] as const;
export type RelationshipLabel = (typeof RELATIONSHIP_LABELS)[number];

// Sensible default scope sets per role. The owner can still toggle anything off.
export const ROLE_DEFAULT_SCOPES: Record<CareRole, CareScope[]> = {
  emergency: ["seizures:read", "profile:read", "location:read", "alerts:receive"],
  caregiver: [
    "today:read",
    "journal:read",
    "journal:comment",
    "journal:write",
    "meds:read",
    "meds:propose",
    "meds:write",
    "biometrics:read",
    "biometrics:write",
    "seizures:read",
    "seizures:write",
    "reports:read",
    "reports:comment",
    "risk:read",
    "profile:read",
    "alerts:receive",
  ],
  provider: [
    "biometrics:read",
    "meds:read",
    "seizures:read",
    "journal:read",
    "reports:read",
    "risk:read",
  ],
  viewer: ["today:read"],
};

export const SCOPE_LABELS: Record<CareScope, string> = {
  "today:read": "See Today screen",
  "today:comment": "Comment on Today",
  "today:propose": "Propose Today edits",
  "today:receive": "Receive Today updates",
  "today:write": "Write to Today",
  "journal:read": "Read journal",
  "journal:comment": "Comment on journal entries",
  "journal:propose": "Suggest journal edits",
  "journal:receive": "Receive journal updates",
  "journal:write": "Add journal entries on their behalf",
  "meds:read": "See medications",
  "meds:comment": "Comment on meds",
  "meds:propose": "Suggest medication changes",
  "meds:receive": "Receive medication updates",
  "meds:write": "Mark doses taken/skipped on their behalf",
  "biometrics:read": "See biometrics",
  "biometrics:comment": "Comment on biometrics",
  "biometrics:propose": "Propose biometric notes",
  "biometrics:receive": "Receive biometric updates",
  "biometrics:write": "Log biometrics on their behalf",
  "seizures:read": "See seizure events",
  "seizures:comment": "Comment on seizures",
  "seizures:propose": "Suggest seizure edits",
  "seizures:receive": "Get seizure alerts",
  "seizures:write": "Log seizures on their behalf",
  "reports:read": "See lab reports",
  "reports:comment": "Comment on reports",
  "reports:propose": "Suggest report edits",
  "reports:receive": "Receive report updates",
  "reports:write": "Upload reports on their behalf",
  "risk:read": "See risk forecast",
  "risk:comment": "Comment on risk",
  "risk:propose": "Suggest risk notes",
  "risk:receive": "Receive risk updates",
  "risk:write": "Write to risk",
  "community:read": "See community activity",
  "community:comment": "Comment in community",
  "community:propose": "Suggest community edits",
  "community:receive": "Receive community updates",
  "community:write": "Post in community on their behalf",
  "profile:read": "See profile",
  "profile:comment": "Comment on profile",
  "profile:propose": "Suggest profile edits",
  "profile:receive": "Receive profile updates",
  "profile:write": "Edit profile",
  "location:read": "See location",
  "location:comment": "Comment on location",
  "location:propose": "Suggest location notes",
  "location:receive": "Receive location updates",
  "location:write": "Update location",
  "chat:read": "See AI chat history",
  "chat:comment": "Comment in chat",
  "chat:propose": "Suggest chat replies",
  "chat:receive": "Receive chat updates",
  "chat:write": "Send chat messages on their behalf",
  "alerts:read": "See alerts",
  "alerts:comment": "Comment on alerts",
  "alerts:propose": "Suggest alert tweaks",
  "alerts:receive": "Get push/email alerts",
  "alerts:write": "Acknowledge alerts on their behalf",
};