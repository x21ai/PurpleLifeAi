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
import FooterIcon17 from "../svgs/footer-icon-17";

/**
 * @ployComponent
 * @ployComponentId reports-documents-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type LinkItemProps = {
  href: string;
  component: ReactNode;
  text: string;
};

function LinkItem({ href, component, text }: LinkItemProps) {
  return (
    <a
      href={href}
      className="border-solid border-ploy-button-secondary-border/10 text-ploy-button-secondary-text/60 leading-snug text-xs flex items-center gap-1.5 transition px-3 py-1.5 rounded-full hover:text-ploy-button-secondary-text border"
      data-ploy-component-type="button"
      data-ploy-component-variant="outline"
    >
      {component}
      {text}
    </a>
  );
}

type ListItemProps = {
  text: string;
  descriptionClassName: string;
};

function ListItem({ text, descriptionClassName }: ListItemProps) {
  return (
    <div className="border-solid border-ploy-text-primary/5 bg-[oklab(0.985621_0.000790089_-0.00252056_/_0.04)] py-3 rounded-3xl max-md:px-3 md:px-4 border">
      <p className="text-ploy-text-primary/60 text-xs tracking-[0.18em] uppercase">
        {text}
      </p>
      <p className={descriptionClassName}>0</p>
    </div>
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

export const links: LinkItemProps[] = [
  {
    href: "/reports/documents?category=blood",
    component: <FooterIcon1 />,
    text: "Blood",
  },
  {
    href: "/reports/documents?category=mri",
    component: <FooterIcon2 />,
    text: "MRI",
  },
  {
    href: "/reports/documents?category=ct",
    component: <FooterIcon3 />,
    text: "CT",
  },
  {
    href: "/reports/documents?category=xray",
    component: <FooterIcon4 />,
    text: "X-Ray",
  },
  {
    href: "/reports/documents?category=ultrasound",
    component: <FooterIcon5 />,
    text: "Ultrasound",
  },
  {
    href: "/reports/documents?category=cardiology",
    component: <FooterIcon6 />,
    text: "Heart",
  },
  {
    href: "/reports/documents?category=pathology",
    component: <FooterIcon7 />,
    text: "Pathology",
  },
  {
    href: "/reports/documents?category=notes",
    component: <FooterIcon8 />,
    text: "Notes",
  },
  {
    href: "/reports/documents?category=other",
    component: <FooterIcon9 />,
    text: "Other",
  },
];

export const items: ListItemProps[] = [
  {
    text: "Reports",
    descriptionClassName:
      "text-ploy-text-primary leading-snug font-light text-2xl mt-2",
  },
  {
    text: "Metrics tracked",
    descriptionClassName:
      "text-ploy-text-primary leading-snug font-light text-2xl mt-2",
  },
  {
    text: "Ready",
    descriptionClassName:
      "text-ploy-accent-primary-300 leading-snug font-light text-2xl mt-2",
  },
];

export const textSegments: ListItem2Props[] = [
  {
    style_fontFamily: "",
    className:
      "text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow",
    text: "Clinician PDF",
  },
  {
    style_fontFamily:
      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
    className: "text-ploy-text-primary leading-normal text-lg mt-1",
    text: "One-tap summary for your next visit",
  },
  {
    style_fontFamily: "",
    className: "text-ploy-neutral-inverse-600 leading-snug text-xs mt-1",
    text: "Includes meds, seizures, biometrics, labs and journal highlights.",
  },
];

export default function Footer() {
  return (
    <div className="grow basis-[0%]">
      <div
        style={{
          backgroundImage:
            "radial-gradient(120% 60% at 50% -10%, rgba(46, 175, 138, 0.28), rgba(46, 175, 138, 0.1) 28%, rgba(7, 9, 12, 0) 60%), linear-gradient(var(--ploy-neutral-primary-950), var(--ploy-neutral-primary-950) 40%)",
          backgroundRepeat: "repeat, repeat",
        }}
        className="bg-neutral-950 text-ploy-text-primary min-h-dvh"
      >
        <header className="max-md:pt-6 max-md:px-5 md:pt-8 md:px-8">
          <div className="max-w-screen-md flex justify-between items-center gap-3 mx-auto">
            <span
              aria-hidden="true"
              className="w-10 h-10 block"
              data-ploy-refactor-hint="refactor-to-use-margin-padding-gap"
            />
            <h1 className="text-ploy-neutral-inverse-200 font-semibold text-xs tracking-[0.32em] uppercase text-center">
              {"Reports"}
            </h1>
            <div className="flex justify-end items-center">
              <span
                aria-hidden="true"
                className="w-10 h-10 block"
                data-ploy-refactor-hint="refactor-to-use-margin-padding-gap"
              />
            </div>
          </div>
        </header>
        <main className="max-w-screen-md mx-auto pt-6 pb-32 max-md:px-5 md:px-8">
          <div className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 leading-snug text-sm inline-flex shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] mb-6 p-1 rounded-full border">
            <a
              href="/reports/metrics"
              className="text-ploy-text-primary/70 min-w-11 min-h-11 flex justify-center items-center transition-[color,transform,translate,scale,rotate] px-4 py-2 rounded-full hover:text-ploy-text-primary"
            >
              {"Metrics"}
            </a>
            <a
              href="/reports/documents"
              className="scale-102 border-solid border-ploy-button-secondary-border/10 bg-ploy-button-secondary-background/60 text-ploy-button-secondary-text font-medium min-w-11 min-h-11 flex justify-center items-center shadow-[0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition-[color,transform,translate,scale,rotate] px-4 py-2 rounded-full nav-glass-row-active border"
              data-ploy-component-type="button"
              data-ploy-component-variant="secondary"
            >
              {"Reports"}
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 mb-6">
            <a
              href="/reports/documents"
              className="border-solid border-ploy-button-secondary-border/30 bg-ploy-button-primary-background/10 text-ploy-button-secondary-text leading-snug text-xs block transition px-3 py-1.5 rounded-full border"
              data-ploy-component-type="button"
              data-ploy-component-variant="primary"
            >
              {"All"}
            </a>
            {links.map((item, index) => (
              <LinkItem key={index} {...item} />
            ))}
          </div>
          <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/90 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] rounded-3xl report-card-strong max-md:p-6 md:p-8 border">
            <p className="text-ploy-neutral-inverse-200 font-semibold text-xs tracking-[0.32em] uppercase">
              {"Your labs"}
            </p>
            <h2 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-2xl max-md:leading-none md:text-3xl md:leading-none">
              {"Start your private ledger of lab results."}
            </h2>
            <p className="text-ploy-text-primary/60 text-sm max-w-[32.5rem] mt-3">
              {
                "Upload lab work, blood panels, and medical reports. PurpleLife extracts the values and shows how they change over time."
              }
            </p>
            <div className="grid gap-3 grid-cols-[repeat(3,minmax(0px,1fr))] mt-6">
              {items.map((item, index) => (
                <ListItem key={index} {...item} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                style={{ fontVariationSettings: "inherit" }}
                className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap h-9 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
              >
                <FooterIcon10 />
                {"Upload report"}
              </button>
            </div>
          </section>
          <section className="mt-8">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="text-ploy-text-primary flex items-center gap-2">
                <FooterIcon11 />
                <h2
                  style={{
                    fontFamily:
                      "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                  }}
                  className="leading-snug [font-weight:inherit] text-2xl"
                >
                  {"Contributing reports"}
                </h2>
              </div>
              <div className="flex items-center gap-2" />
            </div>
            <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-center shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] mt-4 rounded-3xl report-card max-md:p-5 md:p-6 border">
              <FooterIcon12 />
              <p className="text-ploy-text-primary/60 leading-snug text-sm mt-3">
                {
                  "No reports yet. Upload your first PDF or photo to get started."
                }
              </p>
              <button
                style={{ fontVariationSettings: "inherit" }}
                className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap h-9 inline-flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors mt-5 px-4 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
              >
                <FooterIcon10 />
                {"Upload report"}
              </button>
            </section>
          </section>
          <div className="mt-12">
            <section className="overflow-hidden border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] mt-6 p-5 rounded-3xl glass-card border">
              <div className="flex items-start gap-3">
                <FooterIcon13 />
                <div className="min-w-0 grow basis-[0%]">
                  {textSegments.map((item, index) => (
                    <ListItem2 key={index} {...item} />
                  ))}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-button-primary-border bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#b084d1] border"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      <FooterIcon14 />
                      {"Last 30 days"}
                    </button>
                    <button
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-button-primary-border bg-ploy-button-secondary-background text-ploy-button-secondary-text leading-snug [font-weight:inherit] text-xs flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#b084d1] border"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      <FooterIcon14 />
                      {"Last 90 days"}
                    </button>
                    <a
                      href="/reports/medical-history"
                      className="text-ploy-neutral-inverse-600 leading-snug text-xs flex items-center px-2 py-1.5 hover:no-underline"
                    >
                      {"Custom range, schedule & sharing →"}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section className="mt-12">
            <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] mb-4 rounded-3xl report-card max-md:p-5 md:p-6 border">
              <div className="flex items-start gap-3">
                <span className="bg-ploy-background-inverse/5 text-ploy-text-primary/75 w-9 h-9 flex shrink-0 justify-center items-center rounded-full">
                  <FooterIcon15 />
                </span>
                <div>
                  <h3 className="text-ploy-text-primary leading-normal font-medium">
                    {"Your Privacy Is Our Priority"}
                  </h3>
                  <p className="text-ploy-text-primary/60 leading-relaxed text-sm mt-1.5">
                    {
                      "Reports and the values PurpleLife extracts are encrypted at rest and only readable by you and the people you explicitly share with. You can export or delete any report at any time."
                    }
                  </p>
                </div>
              </div>
            </section>
            <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] mb-4 rounded-3xl report-card max-md:p-5 md:p-6 border">
              <div className="flex items-start gap-3">
                <span className="bg-ploy-background-inverse/5 text-ploy-text-primary/75 w-9 h-9 flex shrink-0 justify-center items-center rounded-full">
                  <FooterIcon16 />
                </span>
                <div>
                  <h3 className="text-ploy-text-primary leading-normal font-medium">
                    {"Important Note"}
                  </h3>
                  <p className="text-ploy-text-primary/60 leading-relaxed text-sm mt-1.5">
                    {
                      "PurpleLife is not a laboratory or healthcare provider. The values you see here are extracted from documents you upload and surfaced for context and pattern-tracking, not for diagnosis or treatment. Always discuss results with your medical practitioner."
                    }
                  </p>
                </div>
              </div>
            </section>
            <div
              role="note"
              className="border-solid border-ploy-accent-secondary/20 bg-ploy-background-accent-secondary/5 text-amber-200 leading-snug text-xs flex items-start gap-2 p-3 rounded-[1.25rem] border"
            >
              <FooterIcon17 />
              <p className="text-ploy-text-primary/70 leading-relaxed">
                <strong className="text-ploy-text-primary/70 font-medium">
                  {"Educational information only." + " "}
                </strong>
                {
                  "This is not medical advice, diagnosis, or treatment. Always consult your physician or qualified medical practitioner before changing medications, starting supplements, or acting on any insight shown here."
                }
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
