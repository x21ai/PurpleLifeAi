import HeroSection from "./sections/hero-section";
import PageIcon1 from "./svgs/page-icon-1";

export default function Page() {
  return (
    <>
      <HeroSection />
      <div className="bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <header className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/80 sticky z-30 backdrop-blur border-b top-0">
          <div className="h-16 max-w-6xl flex justify-between items-center mx-auto max-md:px-6 md:px-10">
            <a
              aria-label="Purple home"
              href="/"
              className="text-ploy-text-primary font-semibold text-sm tracking-[0.45em] uppercase block"
            >
              {"Purple"}
            </a>
            <nav className="text-ploy-neutral-inverse-600 leading-snug text-sm items-center gap-6 min-[768px]:flex max-md:hidden">
              <a
                href="/features"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Features"}
              </a>
              <a
                href="/about"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"About"}
              </a>
              <a
                href="/pricing"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Pricing"}
              </a>
              <a
                href="/contact"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Contact"}
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="/sign-in"
                className="text-ploy-neutral-inverse-600 leading-snug text-sm block px-3 py-2 hover:text-ploy-text-primary"
              >
                {"Sign in"}
              </a>
              <a
                href="/sign-up"
                className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm transition-colors px-3 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
              >
                {"Get started"}
              </a>
            </div>
          </div>
        </header>
        <div className="max-w-screen-md mx-auto pb-28 max-md:pt-12 max-md:px-5 md:max-lg:pt-20 md:max-lg:px-10 lg:pt-24 lg:px-16">
          <a
            href="/"
            className="text-ploy-neutral-inverse-600 leading-snug text-sm inline-flex items-center gap-1.5 hover:text-ploy-text-primary"
          >
            <PageIcon1 />
            {"Home"}
          </a>
          <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow max-md:mt-12 md:mt-16">
            {"About Purple"}
          </p>
          <h1 className="font-heading text-ploy-text-primary leading-none [font-weight:inherit] tracking-[-0.02em] mt-4 max-md:text-[2.5rem] md:max-lg:text-6xl md:max-lg:leading-none lg:text-7xl lg:leading-none">
            {"Privacy & safety."}
          </h1>
          <p className="text-ploy-text-primary/75 mt-6 max-md:text-lg max-md:max-w-[34.3564rem] md:leading-snug md:text-xl md:max-w-[38.1738rem]">
            {"Your health story is yours. Here’s exactly how we treat it."}
          </p>
          <div className="max-w-[38.1738rem] max-md:mt-14 md:mt-20">
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"What we collect"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "Only what you put in or explicitly connect: your journal entries (text, voice transcripts, photos), medications and doses, seizures and other events, biometrics from devices you choose to link (Oura, WHOOP, Apple Health), and basic account info (email, optional name, region, preferred language)."
                }
              </p>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "We don’t track you across the web. There are no third-party advertising or analytics trackers in Purple: no Google Analytics, no pixels, no fingerprinting."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"How AI is used"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "Purple uses language models to help you write, transcribe voice notes, extract structured details from your entries, and answer questions about your own data. Requests are made on your behalf to model providers via a secured gateway. Your content is sent only to fulfill that request. It is not used to train third-party models, and we do not train models on your data."
                }
              </p>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "AI suggestions are informational and never a substitute for a clinician. The medical disclaimer is shown wherever AI surfaces health-adjacent output."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Who can see your data"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "By default, only you. Caregivers and family members you invite get read-only access to the scopes you choose. If a caregiver tries to write on your behalf, you get a notice and the change waits for your approval."
                }
              </p>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "Shared medical reports use one-time signed links that you can revoke at any time."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Where it’s stored"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "On managed Cloudflare infrastructure. Uploaded files (voice clips, photos, reports) remain in private storage and are served through short-lived signed URLs, never public links."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Export and delete"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "Open Settings → Data to export everything as JSON, or to delete your account. Deletion removes your journal, medications, biometrics, devices, sharing relationships, and uploaded files. Backups are purged on a rolling schedule."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"What we’ll never do"}
              </h2>
              <ul className="text-ploy-text-primary/75 text-base my-0 pl-0">
                <li className="mb-4">
                  {
                    "Sell, rent, or share your data with brokers or advertisers."
                  }
                </li>
                <li className="mb-4">
                  {"Use your journal or biometrics to target ads."}
                </li>
                <li className="mb-4">
                  {
                    "Train AI models on your data without your explicit, opt-in consent."
                  }
                </li>
                <li className="mb-4">
                  {
                    "Ship third-party trackers, behavioral analytics, or session-replay tools."
                  }
                </li>
                <li>
                  {
                    "Lock you in. Your data is exportable and deletable at any time."
                  }
                </li>
              </ul>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Children"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "Purple is not directed at children under 13. Parents and caregivers may use Purple to track a minor’s health on their own account, but accounts must be created and managed by an adult."
                }
              </p>
            </section>
            <section className="border-solid border-ploy-neutral-primary-900 pt-12 border-t">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Questions"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {"Reach us at"}{" "}
                <a
                  href="mailto:hello@purplelife.org"
                  className="[color:inherit]"
                >
                  {"hello@purplelife.org"}
                </a>
                {". See also our"}{" "}
                <a
                  href="/charter"
                  className="[color:inherit]"
                >
                  {"founding charter"}
                </a>{" "}
                {"and"}{" "}
                <a
                  href="/terms"
                  className="[color:inherit]"
                >
                  {"terms"}
                </a>
                {"."}
              </p>
              <p className="text-ploy-text-primary/60 leading-snug text-sm">
                {"Last updated: June 2026."}
              </p>
            </section>
          </div>
        </div>
        <footer className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/60 border-t">
          <div className="text-ploy-neutral-inverse-600 leading-snug text-sm max-w-6xl flex gap-4 mx-auto py-8 max-md:flex-col max-md:px-5 md:flex-row md:justify-between md:items-center md:px-8">
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-[0.5rem_20px]"
            >
              <a
                href="/trust"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Trust"}
              </a>
              <a
                href="/charter"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Charter"}
              </a>
              <a
                href="/privacy"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Privacy"}
              </a>
              <a
                href="/terms"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Terms"}
              </a>
              <a
                href="/contact"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Contact"}
              </a>
              <a
                href="https://github.com/x21ai/PurpleLifeAi"
                target="_blank"
                rel="noreferrer noopener"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"GitHub"}
              </a>
            </nav>
            <p className="leading-snug text-xs">
              {"© 2026 PurpleLife · Design preview"}
            </p>
          </div>
        </footer>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
