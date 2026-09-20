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
import FooterIcon14 from "../svgs/footer-icon-14";
import FooterIcon15 from "../svgs/footer-icon-15";
import FooterIcon16 from "../svgs/footer-icon-16";
const linkItemClassName =
  "text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border";
const linkItemClassName2 =
  "text-nowrap border-solid border-ploy-button-secondary-border [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-full h-9 flex justify-between items-center shadow-sm cursor-pointer mt-1 px-3 py-2 rounded-[0.875rem] border-input border";
const linkItemClassName3 =
  "border-solid border-ploy-neutral-primary-s3 [color:inherit] leading-snug [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors mt-2 px-3 py-1 rounded-[0.875rem] border-input overflow-clip border";
const linkItemClassName4 =
  "border-solid border-ploy-neutral-primary-s3 [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-pre-wrap break-words w-full min-h-[3.75rem] flex shadow-sm cursor-text mt-1 px-3 py-2 rounded-[0.875rem] border-input border";
const linkItemClassName5 =
  "border-solid border-ploy-neutral-primary-s3 [color:inherit] [font-weight:inherit] text-sm w-full h-[calc((.25rem)_*_9)] flex shadow-sm transition-colors mt-1 px-3 py-1 rounded-[0.875rem] border-input md:leading-snug overflow-clip border";
const linkItemClassName6 =
  "border-solid [color:inherit] bg-[rgb(37,32,47)] [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent";
const linkItemClassName7 =
  "pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary";
const linkItemClassName8 =
  "text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90";

/**
 * @ployComponent
 * @ployComponentId admin-rules-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type LinkItemProps = {
  href: string;
  className: string;
  component: ReactNode;
  text: string;
};

function LinkItem({ href, className, component, text }: LinkItemProps) {
  return (
    <a
      href={href}
      className={className}
      data-ploy-component-type="button"
      data-ploy-component-variant="primary"
    >
      {component}
      {text}
    </a>
  );
}

export const links: LinkItemProps[] = [
  {
    href: "/admin",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon2 />,
    text: "Dashboard",
  },
  {
    href: "/admin/users",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon3 />,
    text: "Users",
  },
  {
    href: "/admin/billing",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon4 />,
    text: "Billing",
  },
  {
    href: "/admin/promo",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon5 />,
    text: "Promo codes",
  },
  {
    href: "/admin/messages",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon6 />,
    text: "Messages",
  },
  {
    href: "/admin/contact",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon7 />,
    text: "Contact",
  },
  {
    href: "/admin/feedback",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon8 />,
    text: "Feedback",
  },
  {
    href: "/admin/community",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon9 />,
    text: "Community",
  },
  {
    href: "/admin/resources",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon10 />,
    text: "Resources",
  },
  {
    href: "/admin/rules",
    className:
      "text-nowrap bg-ploy-button-primary-background text-ploy-button-secondary-text leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full",
    component: <FooterIcon11 />,
    text: "Platform rules",
  },
  {
    href: "/admin/reports/duplicates",
    className:
      "text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70",
    component: <FooterIcon12 />,
    text: "Duplicates",
  },
];

export default function Footer({ items = links }: { items?: LinkItemProps[] }) {
  return (
    <div className="grow basis-[0%]">
      <div className="max-w-6xl mx-auto pt-8 pb-24 max-md:px-4 md:max-lg:px-6 lg:px-10">
        <div className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase flex items-center gap-2">
          <FooterIcon1 />
          {"Admin"}
        </div>
        <nav className="flex overflow-x-auto gap-1 mt-4 -mx-1 pb-2">
          {items.map((item, index) => (
            <LinkItem key={index} {...item} />
          ))}
        </nav>
        <div className="mt-8">
          <div>
            <h1 className="font-button text-ploy-text-primary leading-none font-semibold text-2xl tracking-[-0.02em] app-hero-title">
              {"Platform rules"}
            </h1>
            <p className="text-ploy-neutral-inverse-600 mt-2">
              {
                "Toggle global rules and per-role / per-user overrides. Every change is audit-logged."
              }
            </p>
            <div className="mt-8">
              <section className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-3">
                  <div>
                    <h2
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className="leading-snug [font-weight:inherit] text-2xl"
                    >
                      {"Platform-wide"}
                    </h2>
                    <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
                      {
                        "Applies to every user unless overridden by a role or user-specific rule."
                      }
                    </p>
                  </div>
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className={linkItemClassName}
                  >
                    <FooterIcon13 />
                    {"Add rule"}
                  </button>
                </div>
                <div className="mt-4">
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mb-3 p-4 rounded-3xl border">
                    <div className="grid gap-3 mb-3 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                      <div>
                        <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                          {"Key"}
                        </label>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName2}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"Require name + DOB match before counting metrics"}
                          </span>{" "}
                          <FooterIcon14 />
                        </button>
                        <input
                          placeholder="custom_rule_key"
                          value="require_identity_match_for_metrics"
                          style={{
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            fontVariationSettings: "inherit",
                          }}
                          className={linkItemClassName3}
                        />
                        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
                          {
                            "When on, an uploaded report's metrics are excluded from trends unless the name and DOB on the report match the user's profile (or the user manually approves it)."
                          }
                        </p>
                      </div>
                      <div />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Value (JSON)"}
                      </label>
                      <textarea
                        rows={3}
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontVariationSettings: "inherit",
                        }}
                        className={linkItemClassName4}
                        defaultValue={"true"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Description"}
                      </label>
                      <input
                        placeholder="Optional note for other admins"
                        value="When on, an uploaded report's metrics are excluded from trends unless the name and DOB on the report match the user's profile (or the user manually approves it)."
                        style={{ fontVariationSettings: "inherit" }}
                        className={linkItemClassName5}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <label className="text-ploy-text-primary leading-snug text-sm flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          data-state="unchecked"
                          value="on"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName6}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span
                            data-state="unchecked"
                            className={linkItemClassName7}
                          />
                        </button>
                        {"Disabled"}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName8}
                        >
                          <FooterIcon15 />
                          {"Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mb-3 p-4 rounded-3xl border">
                    <div className="grid gap-3 mb-3 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                      <div>
                        <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                          {"Key"}
                        </label>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName2}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"Duplicate detection overlap (%)"}
                          </span>{" "}
                          <FooterIcon14 />
                        </button>
                        <input
                          placeholder="custom_rule_key"
                          value="dedupe_overlap_threshold"
                          style={{
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            fontVariationSettings: "inherit",
                          }}
                          className={linkItemClassName3}
                        />
                        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
                          {
                            "Two reports with the same date are considered duplicates when this share of metric/value pairs match. 60 means 60%."
                          }
                        </p>
                      </div>
                      <div />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Value (JSON)"}
                      </label>
                      <textarea
                        rows={3}
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontVariationSettings: "inherit",
                        }}
                        className={linkItemClassName4}
                        defaultValue={"60"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Description"}
                      </label>
                      <input
                        placeholder="Optional note for other admins"
                        value="Two reports with the same date are considered duplicates when this share of metric/value pairs match. 60 means 60%."
                        style={{ fontVariationSettings: "inherit" }}
                        className={linkItemClassName5}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <label className="text-ploy-text-primary leading-snug text-sm flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          data-state="unchecked"
                          value="on"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName6}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span
                            data-state="unchecked"
                            className={linkItemClassName7}
                          />
                        </button>
                        {"Disabled"}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName8}
                        >
                          <FooterIcon15 />
                          {"Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary p-4 rounded-3xl border">
                    <div className="grid gap-3 mb-3 sm:grid-cols-2 md:grid-cols-[repeat(2,minmax(0px,1fr))]">
                      <div>
                        <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                          {"Key"}
                        </label>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName2}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"Block re-uploads of previously rejected reports"}
                          </span>{" "}
                          <FooterIcon14 />
                        </button>
                        <input
                          placeholder="custom_rule_key"
                          value="block_rejected_reuploads"
                          style={{
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                            fontVariationSettings: "inherit",
                          }}
                          className={linkItemClassName3}
                        />
                        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
                          {
                            "When on, uploading a file with the same content hash that the user previously rejected is refused at upload time."
                          }
                        </p>
                      </div>
                      <div />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Value (JSON)"}
                      </label>
                      <textarea
                        rows={3}
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          fontVariationSettings: "inherit",
                        }}
                        className={linkItemClassName4}
                        defaultValue={"true"}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase">
                        {"Description"}
                      </label>
                      <input
                        placeholder="Optional note for other admins"
                        value="When on, uploading a file with the same content hash that the user previously rejected is refused at upload time."
                        style={{ fontVariationSettings: "inherit" }}
                        className={linkItemClassName5}
                      />
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <label className="text-ploy-text-primary leading-snug text-sm flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          data-state="unchecked"
                          value="on"
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName6}
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span
                            data-state="unchecked"
                            className={linkItemClassName7}
                          />
                        </button>
                        {"Disabled"}
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          style={{ fontVariationSettings: "inherit" }}
                          className={linkItemClassName8}
                        >
                          <FooterIcon15 />
                          {"Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-3">
                  <div>
                    <h2
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className="leading-snug [font-weight:inherit] text-2xl"
                    >
                      {"By role"}
                    </h2>
                    <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
                      {
                        "Overrides the platform-wide rule for users in the given role."
                      }
                    </p>
                  </div>
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className={linkItemClassName}
                  >
                    <FooterIcon13 />
                    {"Add rule"}
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-ploy-neutral-inverse-600 leading-snug text-sm">
                    {"No rules in this scope."}
                  </p>
                </div>
              </section>
              <section className="mb-10">
                <div className="flex flex-wrap justify-between items-end gap-3">
                  <div>
                    <h2
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className="leading-snug [font-weight:inherit] text-2xl"
                    >
                      {"By user"}
                    </h2>
                    <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
                      {"Overrides for a specific user id."}
                    </p>
                  </div>
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className={linkItemClassName}
                  >
                    <FooterIcon13 />
                    {"Add rule"}
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-ploy-neutral-inverse-600 leading-snug text-sm">
                    {"No rules in this scope."}
                  </p>
                </div>
              </section>
              <section>
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="leading-snug [font-weight:inherit] text-2xl flex items-center gap-2"
                >
                  <FooterIcon16 />
                  {"Recent changes"}
                </h2>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
                  {"Latest 50 audit entries."}
                </p>
                <ul className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mb-0 pl-0 rounded-3xl overflow-hidden border">
                  <li className="text-ploy-neutral-inverse-600 leading-snug text-sm text-center px-4 py-6">
                    {"No changes yet."}
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
