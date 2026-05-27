// Atomic scope identifiers for caregiver permissions.
// Format: <resource>:<verb>

export const CARE_RESOURCES = [
  "today",
  "journal",
  "meds",
  "biometrics",
  "seizures",
  "risk",
  "community",
  "profile",
  "location",
  "chat",
  "alerts",
] as const;
export type CareResource = (typeof CARE_RESOURCES)[number];

export const CARE_VERBS = ["read", "comment", "propose", "receive"] as const;
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

// Sensible default scope sets per role. The owner can still toggle anything off.
export const ROLE_DEFAULT_SCOPES: Record<CareRole, CareScope[]> = {
  emergency: ["seizures:read", "profile:read", "location:read", "alerts:receive"],
  caregiver: [
    "today:read",
    "journal:read",
    "journal:comment",
    "meds:read",
    "meds:propose",
    "biometrics:read",
    "seizures:read",
    "risk:read",
    "profile:read",
    "alerts:receive",
  ],
  provider: [
    "biometrics:read",
    "meds:read",
    "seizures:read",
    "journal:read",
    "risk:read",
  ],
  viewer: ["today:read"],
};

export const SCOPE_LABELS: Record<CareScope, string> = {
  "today:read": "See Today screen",
  "today:comment": "Comment on Today",
  "today:propose": "Propose Today edits",
  "today:receive": "Receive Today updates",
  "journal:read": "Read journal",
  "journal:comment": "Comment on journal entries",
  "journal:propose": "Suggest journal edits",
  "journal:receive": "Receive journal updates",
  "meds:read": "See medications",
  "meds:comment": "Comment on meds",
  "meds:propose": "Suggest medication changes",
  "meds:receive": "Receive medication updates",
  "biometrics:read": "See biometrics",
  "biometrics:comment": "Comment on biometrics",
  "biometrics:propose": "Propose biometric notes",
  "biometrics:receive": "Receive biometric updates",
  "seizures:read": "See seizure events",
  "seizures:comment": "Comment on seizures",
  "seizures:propose": "Suggest seizure edits",
  "seizures:receive": "Get seizure alerts",
  "risk:read": "See risk forecast",
  "risk:comment": "Comment on risk",
  "risk:propose": "Suggest risk notes",
  "risk:receive": "Receive risk updates",
  "community:read": "See community activity",
  "community:comment": "Comment in community",
  "community:propose": "Suggest community edits",
  "community:receive": "Receive community updates",
  "profile:read": "See profile",
  "profile:comment": "Comment on profile",
  "profile:propose": "Suggest profile edits",
  "profile:receive": "Receive profile updates",
  "location:read": "See location",
  "location:comment": "Comment on location",
  "location:propose": "Suggest location notes",
  "location:receive": "Receive location updates",
  "chat:read": "See AI chat history",
  "chat:comment": "Comment in chat",
  "chat:propose": "Suggest chat replies",
  "chat:receive": "Receive chat updates",
  "alerts:read": "See alerts",
  "alerts:comment": "Comment on alerts",
  "alerts:propose": "Suggest alert tweaks",
  "alerts:receive": "Get push/email alerts",
};