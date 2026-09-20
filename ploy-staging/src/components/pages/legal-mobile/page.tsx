import { PilotAppShell } from "@/components/sections/pilot-app-shell";
import LegacyPrivacyPage from "@/components/pages/privacy/page";
import LegacyTermsPage from "@/components/pages/terms/page";

/**
 * @ployComponent
 * @ployComponentId purplelife-legal-mobile-page
 * @ployComponentType page
 * @ployComponentDescription Light mobile PurpleLife frame that preserves the existing Privacy and Terms source text exactly.
 * @ployComponentTags purplelife mobile legal privacy terms
 * @ployComponentStatus experimental
 */
export function LegalMobilePage({ kind }: { kind: "privacy" | "terms" }) {
  return (
    <PilotAppShell active="browse" showTabs={false} landscape="legal">
      <div className="purplelife-legal-mobile">
        {kind === "privacy" ? <LegacyPrivacyPage /> : <LegacyTermsPage />}
      </div>
    </PilotAppShell>
  );
}
