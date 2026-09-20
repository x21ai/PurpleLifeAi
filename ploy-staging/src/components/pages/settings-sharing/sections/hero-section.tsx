import HeroSectionIcon1 from "../svgs/hero-section-icon-1";
import HeroSectionIcon2 from "../svgs/hero-section-icon-2";
import HeroSectionIcon3 from "../svgs/hero-section-icon-3";
import HeroSectionIcon4 from "../svgs/hero-section-icon-4";
import HeroSectionIcon5 from "../svgs/hero-section-icon-5";
import HeroSectionIcon6 from "../svgs/hero-section-icon-6";
import HeroSectionIcon7 from "../svgs/hero-section-icon-7";
import HeroSectionIcon8 from "../svgs/hero-section-icon-8";
const listItemClassName =
  "text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border";
const listItemClassName2 =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] mt-6 rounded-[1.25rem] sharing-glass-card max-md:p-5 md:p-6 border";

/**
 * @ployComponent
 * @ployComponentId settings-sharing-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type ListItemProps = {
  className: string;
  text: string;
  separator?: string;
};

function ListItem({ className, text, separator }: ListItemProps) {
  return (
    <>
      <li className={className || undefined}>{text}</li>
      {separator}
    </>
  );
}

export const items: ListItemProps[] = [
  { className: "mb-1", text: "Install Health Auto Export from the App Store." },
  { className: "mb-1", text: "Add an Automation → REST API." },
  {
    className: "mb-1",
    text: "Paste the URL above. Method: POST. Format: JSON.",
  },
  {
    className: "mb-1",
    text: "Select metrics: HR, HRV, sleep, steps, SpO₂, etc.",
  },
  { className: "", text: "Set schedule to every 1–6 hours." },
];

export const textSegments: ListItemProps[] = [
  { className: "mb-1", text: "Open Shortcuts → New Shortcut." },
  { className: "mb-1", text: 'Add "Find Health Samples" for each metric.' },
  {
    className: "mb-1",
    text: '"Get Contents of URL" → use the URL above, POST, JSON body.',
  },
  { className: "", text: "In Automations, run daily at a fixed time." },
];

export default function HeroSection() {
  return (
    <div className="grow basis-[0%]">
      <div className="max-w-screen-md mx-auto pb-24 max-md:pt-12 max-md:px-5 md:max-lg:pt-20 md:max-lg:px-10 lg:pt-24 lg:px-16">
        <a
          href="/settings"
          className="text-ploy-neutral-inverse-600 leading-snug text-sm inline-flex items-center gap-2 hover:text-ploy-text-primary"
        >
          <HeroSectionIcon1 />
          {"Settings"}
        </a>
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mt-6 label-eyebrow">
          {"Sharing & access"}
        </p>
        <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
          {"Your circle"}
          <br />
          {"of trust."}
        </h1>
        <p className="text-ploy-text-primary/60 leading-normal text-base max-w-[37.5rem] mt-6">
          {
            "Choose who can see your health story and what they can do. Their edits never go live until you approve them. You can revoke anyone, anytime."
          }
        </p>
        <a
          href="/care/inbox"
          className="border-solid border-ploy-button-secondary-border/10 text-ploy-button-secondary-text bg-ploy-button-secondary-background/80 flex justify-between items-center gap-3 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition-colors mt-10 rounded-[1.25rem] sharing-glass-card hover:bg-ploy-neutral-primary-s3/40 max-md:p-5 md:p-6 border"
          data-ploy-component-type="button"
          data-ploy-component-variant="secondary"
        >
          <div className="flex items-center gap-3">
            <div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className="text-ploy-text-primary leading-normal"
              >
                {"Nothing waiting for your review"}
              </p>
              <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
                {"Open the caregiver inbox to review"}
              </p>
            </div>
          </div>
          <HeroSectionIcon2 />
        </a>
        <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 flex justify-between items-center gap-3 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] mt-6 rounded-[1.25rem] sharing-glass-card max-md:p-5 md:p-6 border">
          <div>
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-normal [font-weight:inherit]"
            >
              {"Daily caregiver digest"}
            </h2>
            <p className="text-ploy-neutral-inverse-600 leading-snug text-xs max-w-md mt-1">
              {
                "A once-a-day email summarising what your caregivers did in the last 24 hours."
              }
            </p>
          </div>
          <button
            type="button"
            role="switch"
            data-state="checked"
            value="on"
            style={{ fontVariationSettings: "inherit" }}
            className="border-solid [color:inherit] bg-ploy-button-primary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
            data-ploy-component-type="button"
            data-ploy-component-variant="primary"
          >
            <span
              data-state="checked"
              className="pointer-events-none [translate:16px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
            />
          </button>
        </section>
        <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 rounded-3xl max-md:p-5 md:p-6 border">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
              >
                {"Apple Health auto-sync"}
              </h2>
              <p className="text-ploy-neutral-inverse-600 leading-snug text-xs max-w-md mt-1">
                {"Apple HealthKit is iOS-only, there's no web API for it. Use" +
                  " "}
                <span className="text-ploy-text-primary">
                  {" " + "Health Auto Export"}
                </span>{" "}
                {"or "}
                <span className="text-ploy-text-primary">
                  {"iOS Shortcuts" + " "}
                </span>
                {
                  "on your iPhone to POST new readings to your personal PurpleLife webhook."
                }
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-ploy-text-primary leading-snug font-medium text-xs">
              {"Your personal webhook URL"}
            </p>
            <div className="flex items-stretch gap-2 mt-1">
              <code
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                }}
                className="text-nowrap bg-ploy-neutral-primary-s3 text-ploy-text-primary text-xs whitespace-nowrap min-w-0 block grow basis-[0%] px-3 py-2 rounded-[0.875rem] overflow-hidden"
              />
              <button
                style={{ fontVariationSettings: "inherit" }}
                className={listItemClassName}
              >
                <HeroSectionIcon3 />
                {"Copy"}
              </button>
            </div>
            <p className="text-ploy-neutral-inverse-600 text-xs mt-1">
              {
                "Treat this like a password. Anyone with the URL can write data to your account."
              }
            </p>
          </div>
          <div className="text-ploy-neutral-inverse-600 leading-snug text-xs flex flex-wrap items-center gap-[0.5rem_16px] mt-4">
            <span className="block">
              {"Last webhook:" + " "}
              <span className="text-ploy-text-primary">{" " + "never"}</span>
            </span>
            <span className="block">
              {"Last sync (any):" + " "}
              <span className="text-ploy-text-primary">{" " + "never"}</span>
            </span>
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className="text-ploy-text-primary [font-weight:inherit] flex items-center gap-1 p-0 hover:underline"
            >
              {"Test connection"}
            </button>
          </div>
          <div className="grid gap-3 mt-5 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
            <div className="border-solid border-ploy-neutral-primary-s3 p-3 rounded-2xl border">
              <p className="text-ploy-text-primary leading-snug font-medium text-xs">
                {"Health Auto Export (recommended)"}
              </p>
              <ol className="text-ploy-neutral-inverse-600 text-xs mt-2 mb-0 pl-4 list-decimal">
                {items.map((item, index) => (
                  <ListItem
                    key={index}
                    {...item}
                    separator={index < items.length - 1 ? "\n" : ""}
                  />
                ))}
              </ol>
            </div>
            <div className="border-solid border-ploy-neutral-primary-s3 p-3 rounded-2xl border">
              <p className="text-ploy-text-primary leading-snug font-medium text-xs">
                {"iOS Shortcuts (free)"}
              </p>
              <ol className="text-ploy-neutral-inverse-600 text-xs mt-2 mb-0 pl-4 list-decimal">
                {textSegments.map((item, index) => (
                  <ListItem
                    key={index}
                    {...item}
                    separator={index < textSegments.length - 1 ? "\n" : ""}
                  />
                ))}
              </ol>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <a
              href="/apple-health-import"
              className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm transition-colors px-3 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
            >
              <HeroSectionIcon4 />
              {"One-time ZIP import"}
            </a>
            <button
              style={{ fontVariationSettings: "inherit" }}
              className={listItemClassName}
            >
              <HeroSectionIcon5 />
              {"Rotate token"}
            </button>
            <button
              type="button"
              aria-expanded="false"
              data-state="closed"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap text-ploy-accent-secondary-500 leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-accent-secondary-500"
            >
              <HeroSectionIcon6 />
              {"Disconnect"}
            </button>
          </div>
        </section>
        <section className={listItemClassName2}>
          <div className="flex justify-between items-center gap-3">
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
            >
              {"People I share with"}
            </h2>
            <button
              type="button"
              aria-expanded="false"
              data-state="closed"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
            >
              <HeroSectionIcon7 />
              {"Invite"}
            </button>
          </div>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-3">
            {"No one yet. Invite someone you trust above."}
          </p>
        </section>
        <section className={listItemClassName2}>
          <div className="flex flex-wrap justify-between items-start gap-3">
            <div>
              <h2
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
              >
                {"Activity"}
              </h2>
              <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
                {"What your caregivers have done. Last 100 actions."}
              </p>
            </div>
            <button
              style={{ fontVariationSettings: "inherit" }}
              className={listItemClassName}
            >
              <HeroSectionIcon8 />
              {"Export CSV"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <select className="text-nowrap border-solid border-ploy-neutral-primary-s3 bg-ploy-background-primary text-ploy-text-primary text-xs whitespace-pre items-center cursor-default px-3 py-1.5 rounded-2xl border">
              <option value="all">All caregivers</option>
            </select>
            <select className="text-nowrap border-solid border-ploy-neutral-primary-s3 bg-ploy-background-primary text-ploy-text-primary text-xs whitespace-pre items-center cursor-default px-3 py-1.5 rounded-2xl border">
              <option value="all">All resources</option>
            </select>
          </div>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-4">
            {"No activity yet."}
          </p>
        </section>
        <section className={listItemClassName2}>
          <h2
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
          >
            {"People sharing with me"}
          </h2>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-3">
            {"No one has shared their account with you yet."}
          </p>
        </section>
      </div>
    </div>
  );
}
