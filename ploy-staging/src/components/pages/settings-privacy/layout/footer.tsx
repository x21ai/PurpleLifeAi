import FooterIcon1 from "../svgs/footer-icon-1";
const listItemClassName =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:mb-4 max-md:p-5 md:mb-5 md:p-7 overflow-hidden border";

/**
 * @ployComponent
 * @ployComponentId settings-privacy-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type ListItemProps = {
  text: string;
  text_1: string;
  text_2: string;
};

function ListItem({ text, text_1, text_2 }: ListItemProps) {
  return (
    <section className={listItemClassName}>
      <h2
        style={{
          fontFamily:
            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
        }}
        className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
      >
        {text}
      </h2>
      <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm mb-4">
        {text_1}
      </p>
      <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm">
        {text_2}
      </p>
    </section>
  );
}

type ListItem2Props = {
  className: string;
  text: string;
  separator?: string;
};

function ListItem2({ className, text, separator }: ListItem2Props) {
  return (
    <>
      <li className={className || undefined}>{text}</li>
      {separator}
    </>
  );
}

export const items: ListItemProps[] = [
  {
    text: "What we collect",
    text_1:
      "Only what you put in or explicitly connect: your journal entries (text, voice transcripts, photos), medications and doses, seizures and other events, biometrics from devices you choose to link (Oura, WHOOP, Apple Health), and basic account info (email, optional name, region, preferred language).",
    text_2:
      "We don’t track you across the web. There are no third-party advertising or analytics trackers in PurpleLife: no Google Analytics, no pixels, no fingerprinting.",
  },
  {
    text: "How AI is used",
    text_1:
      "PurpleLife uses language models to help you write, transcribe voice notes, extract structured details from your entries, and answer questions about your own data. Requests are made on your behalf to model providers via a secured gateway. Your content is sent only to fulfill that request. It is not used to train third-party models, and we do not train models on your data.",
    text_2:
      "AI suggestions are informational and never a substitute for a clinician. The medical disclaimer is shown wherever AI surfaces health-adjacent output.",
  },
  {
    text: "Who can see your data",
    text_1:
      "By default, only you. Caregivers and family members you invite get read-only access to the scopes you choose. If a caregiver tries to write on your behalf, you get a notice and the change waits for your approval.",
    text_2:
      "Shared medical reports use one-time signed links that you can revoke at any time.",
  },
];

export const textSegments: ListItem2Props[] = [
  {
    className: "mb-2",
    text: "Sell, rent, or share your data with brokers or advertisers.",
  },
  { className: "mb-2", text: "Use your journal or biometrics to target ads." },
  {
    className: "mb-2",
    text: "Train AI models on your data without your explicit, opt-in consent.",
  },
  {
    className: "mb-2",
    text: "Ship third-party trackers, behavioral analytics, or session-replay tools.",
  },
  {
    className: "",
    text: "Lock you in. Your data is exportable and deletable at any time.",
  },
];

export default function Footer() {
  return (
    <div className="grow basis-[0%]">
      <div
        style={{
          backgroundImage:
            "radial-gradient(90% 55% at 50% -10%, rgba(176, 132, 209, 0.14), rgba(0, 0, 0, 0) 58%)",
        }}
        className="bg-ploy-background-primary text-ploy-text-primary min-h-dvh sheet-canvas"
      >
        <div className="w-full max-w-screen-lg mx-auto pb-24 max-md:pt-6 max-md:px-5 md:max-lg:px-8 md:pt-10 lg:px-12">
          <header className="relative flex justify-center items-center max-md:pb-6 md:pb-10">
            <button
              type="button"
              aria-label="Close"
              style={{ fontVariationSettings: "inherit" }}
              className="-translate-y-1/2 text-ploy-text-primary [font-weight:inherit] absolute block p-2 rounded-full left-0 top-2/4 hover:bg-ploy-neutral-primary-s3"
            >
              <FooterIcon1 />
            </button>
            <h1 className="text-ploy-text-primary font-normal text-center max-md:leading-snug max-md:text-xl max-md:tracking-tight md:leading-snug md:text-2xl md:tracking-[-0.6px]">
              {"Privacy & safety"}
            </h1>
          </header>
          <div>
            <main>
              <section className={listItemClassName}>
                <p className="text-ploy-neutral-inverse-500 leading-snug text-sm">
                  {
                    "Your health story is yours. Here’s exactly how we treat it."
                  }
                </p>
              </section>
              {items.map((item, index) => (
                <ListItem key={index} {...item} />
              ))}
              <section className={listItemClassName}>
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
                >
                  {"Where it’s stored"}
                </h2>
                <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm">
                  {
                    "On managed Cloudflare infrastructure. Uploaded files (voice clips, photos, reports) remain in private storage and are served through short-lived signed URLs, never public links."
                  }
                </p>
              </section>
              <section className={listItemClassName}>
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
                >
                  {"Export and delete"}
                </h2>
                <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm">
                  {
                    "Open Settings → Data to export everything as JSON, or to delete your account. Deletion removes your journal, medications, biometrics, devices, sharing relationships, and uploaded files. Backups are purged on a rolling schedule."
                  }
                </p>
              </section>
              <section className={listItemClassName}>
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
                >
                  {"What we’ll never do"}
                </h2>
                <ul className="text-ploy-neutral-inverse-500 leading-relaxed text-sm my-0 pl-5 list-disc">
                  {textSegments.map((item, index) => (
                    <ListItem2
                      key={index}
                      {...item}
                      separator={index < textSegments.length - 1 ? "\n" : ""}
                    />
                  ))}
                </ul>
              </section>
              <section className={listItemClassName}>
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
                >
                  {"Children"}
                </h2>
                <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm">
                  {
                    "PurpleLife is not directed at children under 13. Parents and caregivers may use PurpleLife to track a minor’s health on their own account, but accounts must be created and managed by an adult."
                  }
                </p>
              </section>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:p-5 md:p-7 overflow-hidden border">
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal [font-weight:inherit] text-lg mb-4"
                >
                  {"Questions"}
                </h2>
                <p className="text-ploy-neutral-inverse-500 leading-relaxed text-sm mb-4">
                  {"Reach us at"}{" "}
                  <a
                    href="mailto:hello@purplelife.org"
                    className="[color:inherit]"
                  >
                    {"hello@purplelife.org"}
                  </a>
                  {". See also our"}{" "}
                  <a
                    href="/settings/terms"
                    className="[color:inherit]"
                  >
                    {"terms"}
                  </a>
                  {"."}
                </p>
                <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                  {"Last updated: June 2026."}
                </p>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
