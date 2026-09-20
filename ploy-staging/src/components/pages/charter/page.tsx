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
              aria-label="PurpleLife home"
              href="/"
              className="text-ploy-text-primary font-semibold text-sm tracking-[0.45em] uppercase block"
            >
              {"PurpleLife"}
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
            {"About PurpleLife"}
          </p>
          <h1 className="font-heading text-ploy-text-primary leading-none [font-weight:inherit] tracking-[-0.02em] mt-4 max-md:text-[2.5rem] md:max-lg:text-6xl md:max-lg:leading-none lg:text-7xl lg:leading-none">
            {"Why PurpleLife exists."}
          </h1>
          <p className="text-ploy-text-primary/75 mt-6 max-md:text-lg max-md:max-w-[30.0619rem] md:leading-snug md:text-xl md:max-w-[33.4021rem]">
            {
              "A quiet place to keep track of a body that doesn’t always cooperate. For you, and for the people who love you."
            }
          </p>
          <div className="max-w-[38.1738rem] max-md:mt-14 md:mt-20">
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Who PurpleLife is for"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "Anyone living with a condition that asks for daily attention (epilepsy, migraine, diabetes, mental health, autoimmune, dysautonomia, long COVID, chronic pain) and the family members and caregivers who walk alongside them."
                }
              </p>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {
                  "We’re named after the global color for epilepsy awareness, and that’s where our depth runs deepest. But PurpleLife is condition-aware, not condition-locked. Whatever you’re carrying, you’re welcome here."
                }
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"How it feels to use"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "Write a sentence. Speak a thought. Snap a photo of a prescription bottle. PurpleLife listens, remembers, and quietly notices the patterns over time. No forms to fill out. No streaks to keep. No guilt if you put it down for a week."
                }
              </p>
              <p className="text-ploy-text-primary/75 leading-normal text-base">
                {"It’s here when you need it, and quiet when you don’t."}
              </p>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"The promises we keep"}
              </h2>
              <ul className="text-ploy-text-primary/75 text-base my-0 pl-0">
                <li className="mb-4">
                  <strong className="text-ploy-text-primary font-bold">
                    {"Core access." + " "}
                  </strong>
                  {"The current preview has no checkout or paid plan. Future pricing is not decided."}
                </li>
                <li className="mb-4">
                  <strong className="text-ploy-text-primary font-bold">
                    {"Open source." + " "}
                  </strong>
                  {"Apache 2.0. Read the code, run your own copy, fork it."}
                </li>
                <li className="mb-4">
                  <strong className="text-ploy-text-primary font-bold">
                    {"No targeted health advertising." + " "}
                  </strong>
                  {"Journal details should never be used to target advertising."}
                </li>
                <li className="mb-4">
                  <strong className="text-ploy-text-primary font-bold">
                    {"Your story is yours." + " "}
                  </strong>
                  {
                    "Export it whenever you want. Delete it whenever you want. We’ll never sell it, rent it, or hand it to brokers."
                  }
                </li>
                <li className="mb-4">
                  <strong className="text-ploy-text-primary font-bold">
                    {"Conversation first." + " "}
                  </strong>
                  {"Health shouldn’t feel like paperwork."}
                </li>
                <li>
                  <strong className="text-ploy-text-primary font-bold">
                    {"Not a medical device." + " "}
                  </strong>
                  {
                    "PurpleLife supports you and your clinician. It doesn’t replace either of you."
                  }
                </li>
              </ul>
            </section>
            <section className="max-md:mb-14 md:mb-20">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Things we won’t do"}
              </h2>
              <ul className="text-ploy-text-primary/75 text-base my-0 pl-0">
                <li className="mb-4">
                  {"Dark patterns or guilt loops to keep you in the app."}
                </li>
                <li className="mb-4">
                  {"Behavioral advertising or third-party trackers."}
                </li>
                <li className="mb-4">
                  {"Selling, renting, or sharing your data with brokers."}
                </li>
                <li className="mb-4">
                  {
                    "Paywalling the heart of PurpleLife: journaling, medications, or sharing with the people who help you."
                  }
                </li>
                <li>
                  {
                    "Lock-in. You can leave any time, with everything you brought."
                  }
                </li>
              </ul>
            </section>
            <section className="border-solid border-ploy-neutral-primary-900 pt-12 border-t">
              <h2 className="font-heading text-ploy-text-primary [font-weight:inherit] mb-4 max-md:leading-snug max-md:text-2xl md:leading-tight md:text-3xl">
                {"Our standard"}
              </h2>
              <p className="text-ploy-text-primary/75 leading-normal text-base mb-4">
                {
                  "Calm. Quiet. Respectful of your energy. If a feature can’t be built within these promises, we don’t ship it."
                }
              </p>
              <p className="text-ploy-text-primary/60 leading-normal text-base">
                {
                  "Thank you for trusting us with even a small corner of your day."
                }
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
