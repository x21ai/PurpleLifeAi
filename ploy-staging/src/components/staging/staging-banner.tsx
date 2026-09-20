import { isStagingLiveData } from "@/lib/staging/config";

export function StagingBanner() {
  if (!isStagingLiveData()) return null;
  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[12px] font-medium text-amber-950"
    >
      Staging · live production data (pmt@eigital.com) ·{" "}
      <a href="https://www.purplelife.org" className="underline underline-offset-2">
        www.purplelife.org
      </a>{" "}
      unchanged
    </div>
  );
}
