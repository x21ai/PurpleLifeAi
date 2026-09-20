import type { ReactNode } from "react";
import FooterIcon1 from "../svgs/footer-icon-1";
import FooterIcon2 from "../svgs/footer-icon-2";
import FooterIcon3 from "../svgs/footer-icon-3";
import FooterIcon4 from "../svgs/footer-icon-4";
import FooterIcon5 from "../svgs/footer-icon-5";
import FooterIcon6 from "../svgs/footer-icon-6";
import FooterIcon7 from "../svgs/footer-icon-7";
import FooterIcon8 from "../svgs/footer-icon-8";
import FooterIcon9 from "../svgs/footer-icon-9";
import FooterIcon10 from "../svgs/footer-icon-10";
import FooterIcon11 from "../svgs/footer-icon-11";
import FooterIcon12 from "../svgs/footer-icon-12";
import FooterIcon13 from "../svgs/footer-icon-13";
const listItemClassName =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition-shadow rounded-[1.75rem] sheet-card max-md:mb-4 md:mb-5 overflow-hidden border";
const listItemClassName2 =
  "[&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 max-md:p-5 md:p-7";
const listItemClassName3 =
  "bg-ploy-neutral-primary-s3 text-ploy-text-primary block shrink-0 p-2 rounded-full";
const listItemClassName4 =
  "text-nowrap border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary border";
const listItemClassName5 =
  "text-nowrap bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary";
const listItemClassName6 =
  "text-ploy-neutral-inverse-500 text-xs tracking-[0.18em] uppercase pt-6 pb-3 px-2 sheet-muted max-md:mb-4 md:mb-5";

/**
 * @ployComponent
 * @ployComponentId tools-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
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

type LinkItemProps = {
  href: string;
  className: string;
  ployComponentTypeData: string;
  ployComponentVariantData: string;
  component: ReactNode;
  text: string;
  text_1: string;
};

function LinkItem({
  href,
  className,
  ployComponentTypeData,
  ployComponentVariantData,
  component,
  text,
  text_1,
}: LinkItemProps) {
  return (
    <a
      href={href}
      className={className}
      data-ploy-component-type={ployComponentTypeData || undefined}
      data-ploy-component-variant={ployComponentVariantData || undefined}
    >
      <div className="min-w-0 flex items-center gap-4">
        <span className="bg-ploy-neutral-primary-s3 w-9 h-9 flex shrink-0 justify-center items-center rounded-full">
          {component}
        </span>
        <div className="min-w-0">
          <p className="text-nowrap text-ploy-text-primary text-sm whitespace-nowrap overflow-hidden">
            {text}
          </p>
          <p className="text-nowrap text-ploy-neutral-inverse-500 text-xs whitespace-nowrap mt-0.5 sheet-muted overflow-hidden">
            {text_1}
          </p>
        </div>
      </div>
      <FooterIcon12 />
    </a>
  );
}

type LinkItem2Props = {
  href: string;
  className: string;
  ployComponentTypeData: string;
  ployComponentVariantData: string;
  text: string;
};

function LinkItem2({
  href,
  className,
  ployComponentTypeData,
  ployComponentVariantData,
  text,
}: LinkItem2Props) {
  return (
    <a
      href={href}
      className={className}
      data-ploy-component-type={ployComponentTypeData || undefined}
      data-ploy-component-variant={ployComponentVariantData || undefined}
    >
      <p className="text-ploy-text-primary text-sm">{text}</p>
      <FooterIcon12 />
    </a>
  );
}

export const items: ListItemProps[] = [
  { className: "mb-1", text: "Open Automations → add REST API (or Webhook)." },
  {
    className: "mb-1",
    text: "Paste the URL below. Method: POST. Format: JSON.",
  },
  {
    className: "mb-1",
    text: "Select metrics: sleep, HRV, resting HR, steps, SpO₂, and others you track.",
  },
  {
    className: "",
    text: "Set schedule to every 1–6 hours, then run Test in HAE and tap Test here.",
  },
];

export const links: LinkItemProps[] = [
  {
    href: "/meds",
    className:
      "[color:inherit] flex justify-between items-center gap-4 transition-colors py-4 hover:bg-ploy-neutral-primary-s3 max-md:px-5 md:px-7",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    component: <FooterIcon2 />,
    text: "Medications",
    text_1: "Schedules, reminders, adherence",
  },
  {
    href: "/reports",
    className:
      "border-solid border-ploy-button-secondary-border/10 [color:inherit] flex justify-between items-center gap-4 transition-colors py-4 border-t hover:bg-ploy-button-secondary-background max-md:px-5 md:px-7",
    ployComponentTypeData: "button",
    ployComponentVariantData: "outline",
    component: <FooterIcon5 />,
    text: "Lab reports",
    text_1: "Upload PDFs or photos. See trends.",
  },
  {
    href: "/settings/travel",
    className:
      "border-solid border-ploy-button-secondary-border/10 [color:inherit] flex justify-between items-center gap-4 transition-colors py-4 border-t hover:bg-ploy-button-secondary-background max-md:px-5 md:px-7",
    ployComponentTypeData: "button",
    ployComponentVariantData: "outline",
    component: <FooterIcon13 />,
    text: "Travel mode",
    text_1: "Plan trips, anchor doses to home time",
  },
];

export const links2: LinkItem2Props[] = [
  {
    href: "/settings/how-purple-thinks",
    className:
      "[color:inherit] flex justify-between items-center gap-4 transition-colors py-4 hover:bg-ploy-neutral-primary-s3 max-md:px-5 md:px-7",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "How PurpleLife thinks",
  },
  {
    href: "/privacy",
    className:
      "border-solid border-ploy-button-secondary-border/10 [color:inherit] flex justify-between items-center gap-4 transition-colors py-4 border-t hover:bg-ploy-button-secondary-background max-md:px-5 md:px-7",
    ployComponentTypeData: "button",
    ployComponentVariantData: "outline",
    text: "Privacy & data",
  },
  {
    href: "/about",
    className:
      "border-solid border-ploy-button-secondary-border/10 [color:inherit] flex justify-between items-center gap-4 transition-colors py-4 border-t hover:bg-ploy-button-secondary-background max-md:px-5 md:px-7",
    ployComponentTypeData: "button",
    ployComponentVariantData: "outline",
    text: "About PurpleLife",
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
              {"Tools"}
            </h1>
          </header>
          <div>
            <main>
              <section id="device-oura" className={listItemClassName}>
                <div className={listItemClassName2}>
                  <div className="py-2">
                    <div className="flex justify-between items-center gap-3 mb-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={listItemClassName3}>
                          <FooterIcon2 />
                        </span>
                        <div className="min-w-0">
                          <p
                            style={{
                              fontFamily:
                                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                            }}
                            className="text-ploy-neutral-inverse-500 leading-normal"
                          >
                            {"Oura Ring"}
                          </p>
                          <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                            {"Connected "}
                            <span className="min-[640px]:inline sm:before:content-['_·_'] max-md:block">
                              {"Last synced 1h ago"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName4}
                        >
                          {"Sync"}
                        </button>
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName5}
                        >
                          {"Disconnect"}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3 pl-11">
                      <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                        {"Last 90 days · 0 sleep · 0 readiness · 0 activity"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-ploy-neutral-inverse-500 leading-snug text-xs block">
                          {"Auto-sync"}
                        </span>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-secondary-border/10 bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs whitespace-nowrap w-[11.875rem] h-8 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border-input hover:bg-ploy-neutral-primary-s3/80 border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="secondary"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"When I open PurpleLife (every 3h)"}
                          </span>{" "}
                          <FooterIcon3 />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section id="device-whoop" className={listItemClassName}>
                <div className={listItemClassName2}>
                  <div className="py-2">
                    <div className="flex justify-between items-center gap-3 mb-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={listItemClassName3}>
                          <FooterIcon4 />
                        </span>
                        <div className="min-w-0">
                          <p
                            style={{
                              fontFamily:
                                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                            }}
                            className="text-ploy-neutral-inverse-500 leading-normal"
                          >
                            {"Whoop"}
                          </p>
                          <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                            {"Connected "}
                            <span className="min-[640px]:inline sm:before:content-['_·_'] max-md:block">
                              {"Last synced 1h ago"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName4}
                        >
                          {"Sync"}
                        </button>
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName5}
                        >
                          {"Disconnect"}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3 pl-11">
                      <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                        {"Last 90 days · 0 recovery · 0 sleep · 0 strain"}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-ploy-neutral-inverse-500 leading-snug text-xs block">
                          {"Auto-sync"}
                        </span>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-secondary-border/10 bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs whitespace-nowrap w-[11.875rem] h-8 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border-input hover:bg-ploy-neutral-primary-s3/80 border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="secondary"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"When I open PurpleLife (every 3h)"}
                          </span>{" "}
                          <FooterIcon3 />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section id="device-apple-health" className={listItemClassName}>
                <div className={listItemClassName2}>
                  <div className="py-2">
                    <div className="flex justify-between items-center gap-3 mb-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <span className={listItemClassName3}>
                          <FooterIcon5 />
                        </span>
                        <div className="min-w-0">
                          <p
                            style={{
                              fontFamily:
                                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                            }}
                            className="text-ploy-neutral-inverse-500 leading-normal"
                          >
                            {"Apple Health"}
                          </p>
                          <p className="text-ploy-neutral-inverse-500 leading-snug text-xs flex items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              className="bg-ploy-accent-secondary-400 w-1.5 h-1.5 block shrink-0 rounded-full"
                            />
                            {
                              " Last data 89d ago · check your Health Auto Export automation"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName4}
                        >
                          {"Test"}
                        </button>
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName5}
                        >
                          {"Disconnect"}
                        </button>
                      </div>
                    </div>
                    <div className="pl-11">
                      <p className="border-solid border-ploy-neutral-inverse-s0/5 bg-ploy-neutral-primary-s3/30 text-ploy-neutral-inverse-500 leading-snug text-xs mb-3 px-3 py-2 rounded-2xl border">
                        {"PurpleLife is a web app, so it cannot show an Apple HealthKit permission like native apps. Data reaches PurpleLife when the" +
                          " "}
                        <strong className="font-bold">
                          {" " + "Health Auto Export"}
                        </strong>{" "}
                        {
                          "app on your iPhone POSTs readings to your personal URL below."
                        }
                      </p>
                      <div className="mb-3">
                        <p className="text-ploy-neutral-inverse-500 leading-snug font-medium text-xs">
                          {"Setup in Health Auto Export"}
                        </p>
                        <ol className="text-ploy-neutral-inverse-500 leading-snug text-xs mt-1.5 mb-0 pl-4 list-decimal">
                          <li className="mb-1">
                            {"Install"}{" "}
                            <a
                              href="https://apps.apple.com/app/health-auto-export-json-csv/id1115567069"
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-ploy-neutral-primary-900 inline-flex items-center gap-0.5"
                            >
                              {"Health Auto Export"}
                              <FooterIcon6 />
                            </a>{" "}
                            {"from the App Store."}
                          </li>
                          {items.map((item, index) => (
                            <ListItem
                              key={index}
                              {...item}
                              separator={index < items.length - 1 ? "\n" : ""}
                            />
                          ))}
                        </ol>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <code
                          style={{
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          }}
                          className="text-nowrap border-solid border-ploy-text-primary/10 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] text-xs whitespace-nowrap block grow basis-[0%] px-3 py-2 rounded-[0.875rem] overflow-hidden border"
                        >
                          /api/public/hooks/apple-health?token=6d43d9946317226a0edad3c7417a911b0e927f7614d28eb1ad9a8036574ca1aa
                        </code>
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={listItemClassName4}
                        >
                          <FooterIcon7 />
                        </button>
                      </div>
                      <p className="text-ploy-neutral-inverse-500 leading-snug text-xs">
                        {"One-time historical backfill?"}{" "}
                        <a
                          href="/apple-health-import"
                          className="text-ploy-neutral-primary-900"
                        >
                          {"Upload your export.xml"}
                        </a>
                        {
                          ". On the PurpleLife iOS app, HealthKit syncs directly without Health Auto Export."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              <button
                type="button"
                style={{ fontVariationSettings: "inherit" }}
                className="border-solid border-ploy-button-secondary-border/10 bg-ploy-button-secondary-background/80 text-ploy-button-secondary-text [font-weight:inherit] text-sm w-full flex items-center gap-3 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition-colors p-5 rounded-[1.75rem] sheet-card hover:bg-ploy-neutral-primary-s3/20 max-md:mb-4 md:mb-5 border leading-[inherit]"
                data-ploy-component-type="button"
                data-ploy-component-variant="secondary"
              >
                <FooterIcon8 />
                {"Set up a new device"}
              </button>
              <p className={listItemClassName6}>Notifications</p>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:mb-4 md:mb-5 overflow-hidden border">
                <div className="[&_button]:bg-muted [&_button]:border-border [&_button]:text-foreground [&_button]:hover:bg-muted/80 [&_label]:text-foreground/80 max-md:p-5 md:p-7">
                  <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s2 mt-6 rounded-3xl max-md:p-5 md:p-6 border">
                    <div className="flex items-center gap-2">
                      <FooterIcon9 />
                      <h2
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
                      >
                        {"Phone alarms"}
                      </h2>
                    </div>
                    <p className="text-ploy-neutral-inverse-500 leading-snug text-sm mt-1">
                      {
                        "Get a real phone notification for every scheduled dose, even when PurpleLife is closed."
                      }
                    </p>
                    <div className="bg-ploy-neutral-primary-s3/40 text-ploy-neutral-inverse-500 leading-snug text-xs flex items-start gap-2 mt-4 p-3 rounded-[1.25rem]">
                      <FooterIcon10 />
                      <span className="block">
                        {"For best results on phones, install PurpleLife first: open the share menu and pick" +
                          " "}
                        <strong className="font-bold">
                          {" " + "Add to Home Screen"}
                        </strong>
                        {". iOS only fires alarms for installed PWAs."}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-5">
                      <button
                        style={{ fontVariationSettings: "inherit" }}
                        className="text-nowrap bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-sm whitespace-nowrap h-9 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80"
                      >
                        <FooterIcon11 />
                        {"Enable phone alarms"}
                      </button>
                    </div>
                    <p className="text-ploy-neutral-inverse-500 leading-snug text-xs mt-3">
                      {
                        "Notifications are blocked in this browser. Open site settings and allow notifications for PurpleLife."
                      }
                    </p>
                  </section>
                </div>
              </section>
              <p className={listItemClassName6}>Tools &amp; utilities</p>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card max-md:mb-4 md:mb-5 overflow-hidden border">
                <div className="sheet-row-list">
                  {links.map((item, index) => (
                    <LinkItem key={index} {...item} />
                  ))}
                </div>
              </section>
              <p className={listItemClassName6}>Wear and care</p>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-[1.75rem] sheet-card overflow-hidden border">
                <div className="sheet-row-list">
                  {links2.map((item, index) => (
                    <LinkItem2 key={index} {...item} />
                  ))}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
