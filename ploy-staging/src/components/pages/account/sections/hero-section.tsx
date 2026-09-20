import HeroSectionIcon1 from "../svgs/hero-section-icon-1";
import HeroSectionIcon2 from "../svgs/hero-section-icon-2";
import HeroSectionIcon3 from "../svgs/hero-section-icon-3";
import HeroSectionIcon4 from "../svgs/hero-section-icon-4";
import HeroSectionIcon5 from "../svgs/hero-section-icon-5";
import HeroSectionIcon6 from "../svgs/hero-section-icon-6";
import HeroSectionIcon7 from "../svgs/hero-section-icon-7";
import HeroSectionIcon8 from "../svgs/hero-section-icon-8";
import HeroSectionIcon9 from "../svgs/hero-section-icon-9";
import HeroSectionIcon10 from "../svgs/hero-section-icon-10";
const listItemClassName =
  "text-ploy-neutral-inverse-500 text-xs tracking-[0.18em] uppercase pt-6 pb-3 px-2 sheet-muted max-md:mb-4 md:mb-5";
const listItemClassName2 =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:mb-4 max-md:p-5 md:mb-5 md:p-7 overflow-hidden border";
const listItemClassName3 =
  "border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors px-3 py-1 rounded-[0.875rem] md:leading-snug overflow-clip border";
const listItemClassName4 =
  "text-ploy-text-primary/80 leading-snug font-medium text-sm flex items-center gap-2";

/**
 * @ployComponent
 * @ployComponentId account-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type ListItemProps = {
  className: string;
  text: string;
  text_1: string;
};

function ListItem({ className, text, text_1 }: ListItemProps) {
  return (
    <button
      type="button"
      style={{ fontVariationSettings: "inherit" }}
      className={className}
    >
      <p className="text-sm">{text}</p>
      <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
        {text_1}
      </p>
    </button>
  );
}

type ListItem2Props = {
  style_fontFamily: string;
  className: string;
  text: string;
};

function ListItem2({ style_fontFamily, className, text }: ListItem2Props) {
  return (
    <p
      style={{ fontFamily: style_fontFamily || undefined }}
      className={className}
    >
      {text}
    </p>
  );
}

export const items: ListItemProps[] = [
  {
    className:
      "border-solid border-ploy-neutral-inverse-600/50 bg-ploy-background-primary/60 text-ploy-text-primary [font-weight:inherit] text-left block shadow-[0px_0px_0px_1px_oklab(0.985621_0.000790089_-0.00252056_/_0.25)] transition-colors p-4 rounded-[1.25rem] sheet-card-inset border",
    text: "Dark",
    text_1: "Default",
  },
  {
    className:
      "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/60 text-ploy-text-primary [font-weight:inherit] text-left block shadow-[0px_0.5px_2px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] transition-colors p-4 rounded-[1.25rem] sheet-card-inset hover:bg-ploy-neutral-primary-s3/30 border",
    text: "Light",
    text_1: "Always light",
  },
  {
    className:
      "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/60 text-ploy-text-primary [font-weight:inherit] text-left block shadow-[0px_0.5px_2px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] transition-colors p-4 rounded-[1.25rem] sheet-card-inset hover:bg-ploy-neutral-primary-s3/30 border",
    text: "System",
    text_1: "Match device",
  },
];

export const textSegments: ListItem2Props[] = [
  {
    style_fontFamily: "",
    className: "text-ploy-neutral-inverse-500 text-xs tracking-wide uppercase",
    text: "Monthly",
  },
  {
    style_fontFamily:
      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
    className: "leading-tight text-3xl mt-1",
    text: "$9.99",
  },
  {
    style_fontFamily: "",
    className: "text-ploy-neutral-inverse-500 text-xs sheet-muted",
    text: "per month",
  },
];

export const textSegments2: ListItem2Props[] = [
  {
    style_fontFamily: "",
    className: "text-ploy-accent-primary-500 text-xs tracking-wide uppercase",
    text: "Yearly · save 17%",
  },
  {
    style_fontFamily:
      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
    className: "leading-tight text-3xl mt-1",
    text: "$99",
  },
  {
    style_fontFamily: "",
    className: "text-ploy-neutral-inverse-500 text-xs sheet-muted",
    text: "per year",
  },
];

export default function HeroSection() {
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
              <HeroSectionIcon1 />
            </button>
            <h1 className="text-ploy-text-primary font-normal text-center max-md:leading-snug max-md:text-xl max-md:tracking-tight md:leading-snug md:text-2xl md:tracking-[-0.6px]">
              {"Account"}
            </h1>
          </header>
          <div>
            <main>
              <p className={listItemClassName}>Profile</p>
              <section className={listItemClassName2}>
                <div>
                  <p className="text-ploy-text-primary text-sm">
                    {"Profile picture"}
                  </p>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {"Used in your menu and shared with caregivers."}
                  </p>
                  <div className="flex items-center gap-4 mt-5">
                    <span className="bg-ploy-background-accent-primary text-ploy-text-primary leading-snug font-medium text-xl w-16 h-16 flex justify-center items-center rounded-full overflow-hidden">
                      <span className="block">P</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        style={{ fontVariationSettings: "inherit" }}
                        className="text-nowrap border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/10 hover:text-ploy-text-primary border"
                      >
                        <HeroSectionIcon2 />
                        {"Upload photo"}
                      </button>
                    </div>
                    <input
                      type="file"
                      className="appearance-none text-nowrap items-baseline p-0 hidden overflow-clip"
                    />
                  </div>
                </div>
              </section>
              <section className={listItemClassName2}>
                <div>
                  <div className="mb-6">
                    <p className="text-ploy-text-primary text-sm">Full name</p>
                    <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                      {"How PurpleLife addresses you."}
                    </p>
                    <div className="grid gap-2 mt-3 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                      <div>
                        <input
                          id="first-name"
                          placeholder="First"
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName3}
                        />
                      </div>
                      <div>
                        <input
                          id="last-name"
                          placeholder="Last"
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName3}
                        />
                      </div>
                    </div>
                    <div
                      className="min-h-[1.125rem] mt-2"
                      data-ploy-refactor-hint="refactor-to-use-margin-padding-gap"
                    />
                  </div>
                  <div className="border-solid border-ploy-neutral-inverse-s0/10 mb-6 pt-6 border-t sheet-divider">
                    <p className="text-ploy-text-primary text-sm">Email</p>
                    <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                      {"member@example.com"}
                    </p>
                  </div>
                  <div className="border-solid border-ploy-neutral-inverse-s0/10 mb-6 pt-6 border-t sheet-divider">
                    <p className="text-ploy-text-primary text-sm">
                      {"Phone number"}
                    </p>
                    <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                      {
                        "Visible to people you share your account with so they can reach you. Include country code."
                      }
                    </p>
                    <div className="mt-3">
                      <input
                        placeholder="+1 555 555 5555"
                        style={{ fontVariationSettings: "inherit" }}
                        className={listItemClassName3}
                      />
                      <div
                        className="min-h-[1.125rem] mt-2"
                        data-ploy-refactor-hint="refactor-to-use-margin-padding-gap"
                      />
                    </div>
                  </div>
                  <div className="border-solid border-ploy-neutral-inverse-s0/10 pt-6 border-t sheet-divider">
                    <p className="text-ploy-text-primary text-sm">Gender</p>
                    <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                      {"Optional. Shown to people you share with."}
                    </p>
                    <div className="mt-3">
                      <div>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-primary-border/10 bg-ploy-button-primary-background/4 text-ploy-neutral-inverse-500 leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-full h-9 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"Select…"}
                          </span>{" "}
                          <HeroSectionIcon3 />
                        </button>
                      </div>
                      <div
                        className="min-h-[1.125rem] mt-2"
                        data-ploy-refactor-hint="refactor-to-use-margin-padding-gap"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Security</p>
              <section className={listItemClassName2}>
                <div>
                  <div className="flex items-center gap-2">
                    <HeroSectionIcon4 />
                    <p className="text-ploy-text-primary text-sm">
                      {"Change password"}
                    </p>
                  </div>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {"Minimum 8 characters."}
                  </p>
                  <div className="grid gap-2 mt-4 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                    <div>
                      <div className="relative">
                        <input
                          id="new-pwd"
                          placeholder="New password"
                          type="password"
                          style={{ fontVariationSettings: "inherit" }}
                          className="border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors pl-3 pr-10 py-1 rounded-[0.875rem] md:leading-snug overflow-clip border"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Show password"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-ploy-neutral-inverse-500 [font-weight:inherit] w-10 absolute flex justify-center items-center transition-colors p-0 right-0 inset-y-0 hover:text-ploy-text-primary"
                        >
                          <HeroSectionIcon5 />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="relative">
                        <input
                          id="confirm-pwd"
                          placeholder="Confirm"
                          type="password"
                          style={{ fontVariationSettings: "inherit" }}
                          className="border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors pl-3 pr-10 py-1 rounded-[0.875rem] md:leading-snug overflow-clip border"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Show password"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-ploy-neutral-inverse-500 [font-weight:inherit] w-10 absolute flex justify-center items-center transition-colors p-0 right-0 inset-y-0 hover:text-ploy-text-primary"
                        >
                          <HeroSectionIcon5 />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="pointer-events-none text-nowrap border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 inline-flex justify-center items-center gap-2 shadow-sm opacity-50 cursor-not-allowed transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/10 hover:text-ploy-text-primary border"
                    >
                      {"Update password"}
                    </button>
                  </div>
                </div>
              </section>
              <section className={listItemClassName2}>
                <div>
                  <div className="flex items-center gap-2">
                    <HeroSectionIcon6 />
                    <p className="text-ploy-text-primary text-sm">
                      {"Two-factor authentication"}
                    </p>
                  </div>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {
                      "Adds a 6-digit code from your authenticator app on every sign-in."
                    }
                  </p>
                  <div className="mt-4">
                    <button
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 inline-flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/10 hover:text-ploy-text-primary border"
                    >
                      {"Enable 2FA"}
                    </button>
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Region &amp; language</p>
              <section className={listItemClassName2}>
                <div className="flex items-center gap-2">
                  <p className="text-ploy-text-primary text-sm">
                    {"Region & language"}
                  </p>
                </div>
                <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                  {"How PurpleLife shows times and which language it speaks."}
                </p>
                <div className="mt-5 [&_label]:text-foreground/80 [&_input]:bg-muted [&_input]:border-border [&_input]:text-foreground">
                  <div>
                    <div className="mb-5">
                      <label className={listItemClassName4}>
                        <HeroSectionIcon7 />
                        {"Country"}
                      </label>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded="false"
                        data-state="closed"
                        disabled={true}
                        id="locale-country"
                        style={{ fontVariationSettings: "inherit" }}
                        className="text-nowrap border-solid border-ploy-button-primary-border/10 bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-full h-9 flex justify-between items-center shadow-sm opacity-50 cursor-not-allowed mt-1.5 px-3 py-2 rounded-[0.875rem] border-input border"
                        data-ploy-component-type="button"
                        data-ploy-component-variant="secondary"
                      >
                        <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                          {"United States"}
                        </span>{" "}
                        <HeroSectionIcon3 />
                      </button>
                    </div>
                    <div className="mb-5">
                      <label className={listItemClassName4}>
                        <HeroSectionIcon8 />
                        {"City"}
                      </label>
                      <input
                        id="locale-home-city"
                        placeholder="e.g. Brooklyn"
                        disabled={true}
                        style={{ fontVariationSettings: "inherit" }}
                        className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm opacity-50 cursor-not-allowed transition-colors mt-1.5 px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border"
                      />
                    </div>
                    <div className="mb-5">
                      <label className={listItemClassName4}>
                        <HeroSectionIcon9 />
                        {"Time zone"}
                      </label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          disabled={true}
                          id="locale-tz"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-primary-border/10 bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-full h-9 flex grow basis-[0%] justify-between items-center shadow-sm opacity-50 cursor-not-allowed px-3 py-2 rounded-[0.875rem] border-input border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="secondary"
                        >
                          {" "}
                          <HeroSectionIcon3 />
                        </button>
                        <button
                          type="button"
                          disabled={true}
                          style={{ fontVariationSettings: "inherit" }}
                          className="pointer-events-none text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm opacity-50 cursor-not-allowed transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-ploy-neutral-primary-s3 hover:text-ploy-text-primary border"
                        >
                          {"Use my device"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={listItemClassName4}>
                        <HeroSectionIcon10 />
                        {"Language"}
                      </label>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded="false"
                        data-state="closed"
                        disabled={true}
                        id="locale-lang"
                        style={{ fontVariationSettings: "inherit" }}
                        className="text-nowrap border-solid border-ploy-button-primary-border/10 bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-sm whitespace-nowrap h-9 flex justify-between items-center shadow-sm opacity-50 cursor-not-allowed mt-1.5 px-3 py-2 rounded-[0.875rem] border-input max-md:w-full md:w-[13.75rem] border"
                        data-ploy-component-type="button"
                        data-ploy-component-variant="secondary"
                      >
                        <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                          {"English"}
                        </span>{" "}
                        <HeroSectionIcon3 />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Appearance</p>
              <section className={listItemClassName2}>
                <div>
                  <p className="text-ploy-text-primary text-sm">Appearance</p>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {"Choose how PurpleLife looks across every page."}
                  </p>
                  <div className="grid gap-2 grid-cols-[repeat(3,minmax(0px,1fr))] mt-4">
                    {items.map((item, index) => (
                      <ListItem key={index} {...item} />
                    ))}
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Subscription</p>
              <section className={listItemClassName2}>
                <div>
                  <p className="text-ploy-text-primary text-sm">
                    {"PurpleLife · Free"}
                  </p>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {
                      "Upgrade for DNA insights, unlimited Ask PurpleLife, sharing & scheduled reports, and unlimited caregiver seats."
                    }
                  </p>
                  <div className="grid gap-3 mt-5 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-button-primary-border/10 text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] text-left block px-5 py-4 rounded-3xl hover:bg-ploy-neutral-primary-s3/80 border"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      {textSegments.map((item, index) => (
                        <ListItem2 key={index} {...item} />
                      ))}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-[rgb(176,132,209)] [color:inherit] bg-ploy-background-accent-primary/10 [font-weight:inherit] text-left block px-5 py-4 rounded-3xl hover:bg-ploy-background-accent-primary/10 border"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {textSegments2.map((item, index) => (
                        <ListItem2 key={index} {...item} />
                      ))}
                    </button>
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Invite</p>
              <section className={listItemClassName2}>
                <div>
                  <p className="text-ploy-text-primary text-sm">
                    {"Get an invite code"}
                  </p>
                  <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                    {
                      "Share PurpleLife with someone who could use a calmer way to track their health."
                    }
                  </p>
                  <div className="mt-4">
                    <button
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 inline-flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary border"
                    >
                      {"Create my invite code"}
                    </button>
                  </div>
                </div>
              </section>
              <p className={listItemClassName}>Session</p>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:p-5 md:p-7 overflow-hidden border">
                <p className="text-ploy-text-primary text-sm">Signed in as</p>
                <p className="text-ploy-neutral-inverse-500 text-xs mt-1 sheet-muted">
                  {"member@example.com"}
                </p>
                <div className="mt-5">
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 inline-flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary border"
                  >
                    {"Sign out"}
                  </button>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
