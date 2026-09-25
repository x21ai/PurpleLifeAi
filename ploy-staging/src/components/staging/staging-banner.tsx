import { isProductionSite, isStagingLiveData } from "@/lib/staging/config";
import { getStagingSession, signOutStaging, STAGING_SIGN_IN_PATH } from "@/lib/staging/session";

export function StagingBanner() {
  if (!isStagingLiveData() || isProductionSite()) return null;

  const session = typeof window !== "undefined" ? getStagingSession() : null;
  const email = session?.user?.email;

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[12px] font-medium text-amber-950"
    >
      Staging · live production D1/R2
      {email ? (
        <>
          {" "}
          · signed in as {email}{" "}
          <button
            type="button"
            onClick={() => {
              signOutStaging();
              window.location.href = STAGING_SIGN_IN_PATH;
            }}
            className="underline underline-offset-2"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          {" "}
          ·{" "}
          <a href={STAGING_SIGN_IN_PATH} className="underline underline-offset-2">
            Sign in required
          </a>
        </>
      )}
      {" · "}
      <a href="https://www.purplelife.org" className="underline underline-offset-2">
        www.purplelife.org
      </a>{" "}
      unchanged
    </div>
  );
}
