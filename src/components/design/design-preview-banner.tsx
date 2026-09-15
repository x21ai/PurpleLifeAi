import { isDesignPreviewClient } from "@/lib/design-preview";

export function DesignPreviewBanner() {
  if (!isDesignPreviewClient()) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs font-medium text-amber-950 dark:text-amber-100"
    >
      Public design staging (auto-signed in as pmt@eigital.com). Exposes live account data until
      torn down. Not production. OAuth connects disabled.
    </div>
  );
}
