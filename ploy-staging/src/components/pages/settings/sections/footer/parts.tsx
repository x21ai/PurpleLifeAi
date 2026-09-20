import type { ReactNode } from "react";
import FooterIcon1 from "../../svgs/footer-icon-1";
import FooterIcon2 from "../../svgs/footer-icon-2";
import FooterIcon3 from "../../svgs/footer-icon-3";
import FooterIcon4 from "../../svgs/footer-icon-4";
import FooterIcon5 from "../../svgs/footer-icon-5";
import FooterIcon6 from "../../svgs/footer-icon-6";
import FooterIcon7 from "../../svgs/footer-icon-7";
import FooterIcon8 from "../../svgs/footer-icon-8";
import FooterIcon9 from "../../svgs/footer-icon-9";
import FooterIcon10 from "../../svgs/footer-icon-10";
import FooterIcon12 from "../../svgs/footer-icon-12";
import FooterIcon13 from "../../svgs/footer-icon-13";
import FooterIcon22 from "../../svgs/footer-icon-22";
import FooterIcon24 from "../../svgs/footer-icon-24";
import FooterIcon25 from "../../svgs/footer-icon-25";
import FooterIcon26 from "../../svgs/footer-icon-26";
import FooterIcon27 from "../../svgs/footer-icon-27";
import FooterIcon28 from "../../svgs/footer-icon-28";
import FooterIcon29 from "../../svgs/footer-icon-29";
import FooterIcon30 from "../../svgs/footer-icon-30";
import FooterIcon31 from "../../svgs/footer-icon-31";
import FooterIcon32 from "../../svgs/footer-icon-32";
import { FooterPart1, FooterPart2 } from "./subtrees";
const linkItemClassName =
  "text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase mt-8 mb-2 px-1";
const linkItemClassName2 =
  "border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary rounded-3xl overflow-hidden border";
const linkItemClassName3 =
  "[color:inherit] flex justify-between items-center transition-colors hover:bg-ploy-neutral-primary-s3/40 max-md:p-5 md:p-6";
const linkItemClassName4 =
  "border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 rounded-3xl max-md:p-5 md:p-6 border";

/**
 * @ployComponent
 * @ployComponentId settings-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type LinkItemProps = {
  href: string;
  className: string;
  component: ReactNode;
  text: string;
  text_1: string;
};

function LinkItem({ href, className, component, text, text_1 }: LinkItemProps) {
  return (
    <a href={href} className={className}>
      {component}
      <p
        style={{
          fontFamily:
            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
        }}
        className="text-ploy-text-primary leading-normal text-lg"
      >
        {text}
      </p>
      <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
        {text_1}
      </p>
    </a>
  );
}

type ListItemProps = {
  text: string;
  text_1: string;
};

function ListItem({ text, text_1 }: ListItemProps) {
  return (
    <button
      type="button"
      style={{ fontVariationSettings: "inherit" }}
      className="border-solid border-[rgb(37,32,47)] text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] text-left flex justify-between gap-3 transition-colors p-4 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/40 border"
      data-ploy-component-type="button"
      data-ploy-component-variant="secondary"
    >
      <div className="min-w-0">
        <p
          style={{
            fontFamily:
              "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
          }}
          className="text-ploy-text-primary leading-normal"
        >
          {text}
        </p>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
          {text_1}
        </p>
      </div>
    </button>
  );
}

export const links: LinkItemProps[] = [
  {
    href: "/account",
    className:
      "border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-secondary flex flex-col gap-2 transition-colors p-5 rounded-3xl hover:bg-ploy-neutral-primary-s3/40 border",
    component: <FooterIcon1 />,
    text: "Account",
    text_1: "Profile, security, language, appearance",
  },
  {
    href: "/settings",
    className:
      "border-solid border-ploy-neutral-inverse-s1 [color:inherit] bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.05)] flex flex-col gap-2 transition-colors p-5 rounded-3xl border",
    component: <FooterIcon2 />,
    text: "Settings",
    text_1: "Preferences, sharing, data",
  },
  {
    href: "/tools",
    className:
      "border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-secondary flex flex-col gap-2 transition-colors p-5 rounded-3xl hover:bg-ploy-neutral-primary-s3/40 border",
    component: <FooterIcon3 />,
    text: "Tools",
    text_1: "Devices, alarms, integrations",
  },
];

export const items: ListItemProps[] = [
  { text: "OpenAI GPT", text_1: "Fast all-rounder. Reads images, not PDFs." },
  {
    text: "Google Gemini",
    text_1: "Big context window. Reads PDFs and images.",
  },
  { text: "xAI Grok", text_1: "Strong reasoning. Reads images, not PDFs." },
];

export default function Footer() {
  return (
    <div className="grow basis-[0%]">
      <div className="w-full max-w-screen-md mx-auto pb-24 max-md:pt-12 max-md:px-5 md:max-lg:pt-20 md:max-lg:px-10 lg:pt-24 lg:px-16">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"Settings"}
        </p>
        <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
          {"All in your"}
          <br />
          {"control."}
        </h1>
        <p className="text-ploy-text-primary/60 leading-normal text-base max-w-[37.5rem] mt-6">
          {"Account, privacy, integrations, and how PurpleLife talks to you."}
        </p>
        <div className="grid gap-3 mt-8 sm:grid-cols-3 md:grid-cols-[repeat(3,minmax(0px,1fr))]">
          {links.map((item, index) => (
            <LinkItem key={index} {...item} />
          ))}
        </div>
        <p className={linkItemClassName}>Your health</p>
        <section className={linkItemClassName2}>
          <a
            href="/meds"
            className="border-solid border-ploy-neutral-primary-s3 [color:inherit] flex justify-between items-center transition-colors border-b hover:bg-ploy-neutral-primary-s3/40 max-md:p-5 md:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon4 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Medications"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Schedules, reminders, and adherence"}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
          <a
            href="/reports"
            className={linkItemClassName3}
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon6 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Lab reports"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Upload labs as PDF or photo. See trends. Educational only."}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
        </section>
        <p className={linkItemClassName}>People</p>
        <section className={linkItemClassName2}>
          <a
            href="/settings/sharing"
            className={linkItemClassName3}
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon7 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Sharing & access"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Invite caregivers, set what they see, approve edits"}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
        </section>
        <p className={linkItemClassName}>App</p>
        <section className={linkItemClassName2}>
          <a
            href="/settings/travel"
            className={linkItemClassName3}
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon8 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Travel mode"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Plan trips, anchor doses to home time"}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
        </section>
        <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-3 rounded-3xl max-md:p-5 md:p-6 border">
          <div className="flex items-center gap-2">
            <FooterIcon9 />
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
            >
              {"Add past history"}
            </h2>
          </div>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
            {
              "Backfill old medications and past episodes so PurpleLife can see your full story. Each form lets you pick any date."
            }
          </p>
          <div className="grid gap-3 mt-4 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
            <a
              href="/meds?add=past"
              className="border-solid border-ploy-neutral-primary-s3 [color:inherit] flex justify-between items-center transition-colors p-4 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/40 border"
            >
              <div className="flex items-center gap-3">
                <FooterIcon10 />
                <div>
                  <p
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-normal"
                  >
                    {"Old medications"}
                  </p>
                  <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                    {"Set start & end dates in the past"}
                  </p>
                </div>
              </div>
              <FooterIcon5 />
            </a>
          </div>
        </section>
        <FooterPart1 />
        <section className={linkItemClassName4}>
          <div className="flex items-center gap-2">
            <FooterIcon13 />
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
            >
              {"AI provider"}
            </h2>
          </div>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
            {
              "Your report extraction, Ask PurpleLife chat, and insights all run on the provider you pick here. Keys live server-side; we never expose them to the browser."
            }
          </p>
          <div className="grid gap-2 mt-4">
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className="border-solid border-ploy-button-primary-border [color:inherit] bg-ploy-button-primary-background/5 [font-weight:inherit] text-left flex justify-between gap-3 transition-colors p-4 rounded-[1.25rem] border"
              data-ploy-component-type="button"
              data-ploy-component-variant="primary"
            >
              <div className="min-w-0">
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal"
                >
                  {"Anthropic Claude"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
                  {
                    "Default. Strong at lab reports, imaging summaries, and chat. Reads PDFs and images."
                  }
                </p>
              </div>
              <FooterIcon22 />
            </button>
            {items.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
            <button
              type="button"
              disabled={true}
              style={{ fontVariationSettings: "inherit" }}
              className="border-solid border-[rgb(37,32,47)] text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] text-left flex justify-between gap-3 opacity-60 cursor-not-allowed transition-colors p-4 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/40 border"
              data-ploy-component-type="button"
              data-ploy-component-variant="secondary"
            >
              <div className="min-w-0">
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal"
                >
                  {"Maya (internal) "}
                  <span className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-wide uppercase ml-2">
                    {"Endpoint not set"}
                  </span>
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-0.5">
                  {"PurpleLife's own model. Not configured yet."}
                </p>
              </div>
            </button>
          </div>
        </section>
        <FooterPart2 />
        <section className={linkItemClassName4}>
          <div className="flex items-center gap-2">
            <FooterIcon24 />
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
            >
              {"Health history"}
            </h2>
          </div>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
            {
              "Conditions evolve. Mark something as resolved or in remission, or note what runs in the family."
            }
          </p>
          <div className="mt-5">
            <label className="text-ploy-text-primary leading-snug font-medium text-sm">
              {"Currently active"}
            </label>
            <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
              {
                "Resolve removes it from prompts and trackers; in remission keeps it visible but quiet."
              }
            </p>
            <p className="text-ploy-neutral-inverse-600 leading-snug italic text-xs mt-3">
              {"Nothing active yet."}
            </p>
            <div className="mt-3">
              <button
                type="button"
                style={{ fontVariationSettings: "inherit" }}
                className="border-solid border-[rgb(37,32,47)] bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-ploy-button-secondary-background border"
                data-ploy-component-type="button"
                data-ploy-component-variant="secondary"
              >
                <FooterIcon12 />
                {"Add condition"}
              </button>
            </div>
          </div>
          <div className="border-solid border-ploy-neutral-primary-s3 mt-6 pt-5 border-t">
            <label className="text-ploy-text-primary leading-snug font-medium text-sm flex items-center gap-2">
              <FooterIcon25 />
              {"Family history"}
            </label>
            <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
              {
                "What runs in your family. Used as context for patterns and AI suggestions, never shared."
              }
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <input
                placeholder="Condition (e.g. Heart attack)"
                disabled={true}
                style={{ fontVariationSettings: "inherit" }}
                className="border-solid border-ploy-neutral-primary-s3 [color:inherit] [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] min-w-[11.25rem] flex grow basis-[0%] shadow-sm opacity-50 cursor-not-allowed transition-colors px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border"
              />
              <input
                placeholder="Relation (e.g. Father)"
                disabled={true}
                style={{ fontVariationSettings: "inherit" }}
                className="border-solid border-ploy-neutral-primary-s3 [color:inherit] [font-weight:inherit] text-sm w-[calc((.25rem)_*_40)] h-[calc((.25rem)_*_9)] flex shadow-sm opacity-50 cursor-not-allowed transition-colors px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border"
              />
              <button
                type="button"
                disabled={true}
                style={{ fontVariationSettings: "inherit" }}
                className="border-solid border-[rgb(37,32,47)] bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs flex items-center gap-1.5 opacity-50 px-3 py-1.5 rounded-full hover:bg-ploy-button-secondary-background border"
                data-ploy-component-type="button"
                data-ploy-component-variant="secondary"
              >
                <FooterIcon12 />
                {"Add"}
              </button>
            </div>
          </div>
        </section>
        <p className={linkItemClassName}>Data</p>
        <section className={linkItemClassName4}>
          <h2
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
          >
            {"Your data"}
          </h2>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
            {
              "Take it with you anytime. Deletion is reversible for 60 days , after that, everything is permanently erased."
            }
          </p>
          <div className="flex items-center gap-2 mt-5">
            <button
              aria-label="Export all your data"
              data-state="closed"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-sm whitespace-nowrap w-9 h-9 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors p-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
            >
              <FooterIcon26 />
            </button>
            <button
              aria-label="Delete account"
              data-state="closed"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap text-[rgb(232,116,92)] leading-snug font-medium text-sm whitespace-nowrap w-9 h-9 flex justify-center items-center gap-2 cursor-pointer transition-colors p-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[color-mix(in_oklab,#e8745c_10%,transparent)] hover:text-[#e8745c]"
            >
              <FooterIcon27 />
            </button>
          </div>
        </section>
        <p className={linkItemClassName}>Help</p>
        <section className={linkItemClassName2}>
          <a
            href="/contact"
            className={linkItemClassName3}
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon28 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Contact the team"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Questions, feedback, anything"}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
        </section>
        <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 rounded-3xl overflow-hidden border">
          <header className="max-md:pt-5 max-md:pb-3 max-md:px-5 md:p-6">
            <h2
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
            >
              {"About"}
            </h2>
          </header>
          <ul className="my-0 pl-0">
            <li className="border-solid border-ploy-neutral-primary-s3 border-b">
              <a
                href="/charter"
                className={linkItemClassName3}
              >
                <span className="flex items-center gap-3">
                  <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                    <FooterIcon6 />
                  </span>
                  <span
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-normal block"
                  >
                    {"Founding charter"}
                  </span>
                </span>
                <FooterIcon5 />
              </a>
            </li>
            <li className="border-solid border-ploy-neutral-primary-s3 border-b">
              <a
                href="/privacy"
                className={linkItemClassName3}
              >
                <span className="flex items-center gap-3">
                  <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                    <FooterIcon29 />
                  </span>
                  <span
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-normal block"
                  >
                    {"Privacy & safety"}
                  </span>
                </span>
                <FooterIcon5 />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/x21ai/PurpleLifeAi"
                target="_blank"
                rel="noreferrer noopener"
                className={linkItemClassName3}
              >
                <span className="flex items-center gap-3">
                  <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary block p-2 rounded-full">
                    <FooterIcon30 />
                  </span>
                  <span
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-normal block"
                  >
                    {"Open source on GitHub"}
                  </span>
                </span>
                <FooterIcon31 />
              </a>
            </li>
          </ul>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-xs text-center pt-2 max-md:pb-5 max-md:px-5 md:pb-6 md:px-6">
            {"Version 1.0.0 (28) · Sep 15, 2026"}
          </p>
        </section>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-8">
          {
            "Looking for connections, alarms, or your device? They moved to Tools. Name, password, 2FA, region, language, and appearance live in Account."
          }
        </p>
        <p className={linkItemClassName}>Admin</p>
        <section className={linkItemClassName2}>
          <a
            href="/admin"
            className={linkItemClassName3}
          >
            <div className="flex items-center gap-3">
              <span className="bg-ploy-background-inverse/10 text-ploy-text-primary block p-2 rounded-full">
                <FooterIcon32 />
              </span>
              <div>
                <p
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="text-ploy-text-primary leading-normal text-lg"
                >
                  {"Admin console"}
                </p>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                  {"Manage users, messages, and community"}
                </p>
              </div>
            </div>
            <FooterIcon5 />
          </a>
        </section>
      </div>
    </div>
  );
}
