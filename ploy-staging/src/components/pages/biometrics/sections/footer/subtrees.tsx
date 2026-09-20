import type { ReactNode } from "react";
import FooterIcon4 from "../../svgs/footer-icon-4";
import FooterShape5 from "../../svgs/footer-shape-5";
import FooterShape6 from "../../svgs/footer-shape-6";
import FooterShape7 from "../../svgs/footer-shape-7";
import FooterShape8 from "../../svgs/footer-shape-8";
import FooterShape9 from "../../svgs/footer-shape-9";
import FooterShape10 from "../../svgs/footer-shape-10";
import FooterShape11 from "../../svgs/footer-shape-11";
import FooterShape12 from "../../svgs/footer-shape-12";
import FooterShape13 from "../../svgs/footer-shape-13";
import FooterShape14 from "../../svgs/footer-shape-14";
const linkItemClassName =
  "border-solid border-ploy-neutral-inverse-s0/10 [color:inherit] bg-ploy-background-primary/80 block shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition rounded-[1.25rem] group glass-card max-md:p-4 md:p-5 border";
const linkItemClassName2 =
  "text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow";
const linkItemClassName3 =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary font-semibold text-xs tracking-wide uppercase block shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] px-2 py-0.5 rounded-full border";
const linkItemClassName4 =
  "bg-ploy-background-accent-tertiary text-ploy-text-inverse font-bold text-[0.5rem] w-3.5 h-3.5 flex justify-center items-center rounded-full";
const linkItemClassName5 =
  "bg-emerald-400 text-ploy-text-inverse font-bold text-[0.5rem] w-3.5 h-3.5 flex justify-center items-center rounded-full";
const linkItemClassName6 =
  "text-nowrap text-ploy-text-primary leading-none whitespace-nowrap mt-2 max-md:text-2xl max-md:leading-none md:text-3xl md:leading-none";
const linkItemClassName7 =
  "border-solid border-ploy-button-secondary-border text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 inline-flex justify-center items-center transition p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary border";
const linkItemClassName8 =
  "pointer-events-none absolute invisible translate-x-2.5 translate-y-2.5 left-0 top-0 recharts-tooltip-wrapper recharts-tooltip-wrapper-right recharts-tooltip-wrapper-bottom";
const linkItemClassName9 =
  "text-nowrap border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary text-xs whitespace-nowrap invisible p-2.5 rounded-[0.625rem] recharts-default-tooltip border";

/**
 * @ployComponent
 * @ployComponentId biometrics-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type LinkItemProps = {
  href: string;
  text: string;
  title_2: string;
  textClassName: string;
  text_4: string;
  ariaLabel: string;
  component_1: ReactNode;
  text_5: string;
  text_6: string;
};

function LinkItem({
  href,
  text,
  title_2,
  textClassName,
  text_4,
  ariaLabel,
  component_1,
  text_5,
  text_6,
}: LinkItemProps) {
  return (
    <a href={href} className={linkItemClassName}>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 grow basis-[0%]">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={linkItemClassName2}>{text}</p>
            <span className={linkItemClassName3}>{" " + "In range"}</span>
            <span className="flex items-center gap-0.5">
              <span
                title="Oura"
                aria-label="Oura"
                className={linkItemClassName4}
              >
                {"O" + " "}
              </span>
              <span
                title="Whoop"
                aria-label="Whoop"
                className={linkItemClassName5}
              >
                {"W"}
              </span>
            </span>
            <span title={title_2} className={textClassName} />
          </div>
          <p
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className={linkItemClassName6}
          >
            {text_4}
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            aria-label={ariaLabel}
            style={{ fontVariationSettings: "inherit" }}
            className={linkItemClassName7}
            data-ploy-component-type="button"
            data-ploy-component-variant="outline"
          >
            <FooterIcon4 />
          </button>
        </div>
      </div>
      <div className="h-12 mt-3 -mx-1">
        <div className="w-full h-full min-w-0 recharts-responsive-container">
          <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
            {component_1}
            <div tabIndex={-1} className={linkItemClassName8}>
              <div className={linkItemClassName9}>
                <p className="text-nowrap invisible recharts-tooltip-label" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
        <span className="block">{text_5}</span>
        <span className="block">{text_6}</span>
      </div>
    </a>
  );
}

export const links: LinkItemProps[] = [
  {
    href: "/biometrics/sleep_total",
    text: "Total sleep",
    title_2: "Sources agree (within 10%)",
    textClassName:
      "bg-ploy-accent-secondary-500 w-1.5 h-1.5 block rounded-full",
    text_4: "5h 19m",
    ariaLabel: "Pin Total sleep",
    component_1: <FooterShape7 />,
    text_5: "Baseline 6h 10m",
    text_6: "▼ 0h 51m",
  },
  {
    href: "/biometrics/sleep_deep",
    text: "Deep sleep",
    title_2: "Sources disagree (>10% spread)",
    textClassName: "bg-amber-400 w-1.5 h-1.5 block rounded-full",
    text_4: "1h 44m",
    ariaLabel: "Pin Deep sleep",
    component_1: <FooterShape8 />,
    text_5: "Baseline 1h 31m",
    text_6: "▲ 0h 13m",
  },
  {
    href: "/biometrics/sleep_rem",
    text: "REM sleep",
    title_2: "Sources agree (within 10%)",
    textClassName:
      "bg-ploy-accent-secondary-500 w-1.5 h-1.5 block rounded-full",
    text_4: "1h 23m",
    ariaLabel: "Pin REM sleep",
    component_1: <FooterShape9 />,
    text_5: "Baseline 1h 28m",
    text_6: "▼ 0h 5m",
  },
  {
    href: "/biometrics/sleep_efficiency",
    text: "Sleep efficiency",
    title_2: "Sources agree (within 10%)",
    textClassName:
      "bg-ploy-accent-secondary-500 w-1.5 h-1.5 block rounded-full",
    text_4: "72%",
    ariaLabel: "Pin Sleep efficiency",
    component_1: <FooterShape10 />,
    text_5: "Baseline 76%",
    text_6: "▼ 4%",
  },
];

export function FooterPart1() {
  return (
    <section className="mb-10">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mb-3 label-eyebrow">
        {"Sleep"}
      </p>
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 md:max-lg:grid-cols-[repeat(2,minmax(0px,1fr))]">
        <a
          href="/biometrics/sleep_score"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Sleep score</p>
                <span className={linkItemClassName3}>{" " + "In range"}</span>
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"70"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Sleep score"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape5 />
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 76</span>
            <span className="block">▼ 6</span>
          </div>
        </a>
        <a
          href="/biometrics/whoop_sleep_performance"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Sleep performance</p>
                <span className={linkItemClassName3}>{" " + "In range"}</span>
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"64%"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Sleep performance"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape6 />
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 66%</span>
            <span className="block">▼ 2%</span>
          </div>
        </a>
        {links.map((item, index) => (
          <LinkItem key={index} {...item} />
        ))}
      </div>
    </section>
  );
}

export function FooterPart2() {
  return (
    <section className="mb-10">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mb-3 label-eyebrow">
        {"Cardio"}
      </p>
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 md:max-lg:grid-cols-[repeat(2,minmax(0px,1fr))]">
        <a
          href="/biometrics/hrv"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Heart rate variability</p>
                <span className={linkItemClassName3}>{" " + "High"}</span>
                <span className="flex items-center gap-0.5">
                  <span
                    title="Oura"
                    aria-label="Oura"
                    className={linkItemClassName4}
                  >
                    {"O" + " "}
                  </span>
                  <span
                    title="Whoop"
                    aria-label="Whoop"
                    className={linkItemClassName5}
                  >
                    {"W"}
                  </span>
                </span>
                <span
                  title="Sources disagree (>10% spread)"
                  className="bg-amber-400 w-1.5 h-1.5 block rounded-full"
                />
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"32 ms"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Heart rate variability"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape11 />
                <div tabIndex={-1} className={linkItemClassName8}>
                  <div className={linkItemClassName9}>
                    <p className="text-nowrap invisible recharts-tooltip-label" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 25 ms</span>
            <span className="block">▲ 6 ms</span>
          </div>
        </a>
        <a
          href="/biometrics/resting_hr"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Resting heart rate</p>
                <span className={linkItemClassName3}>{" " + "In range"}</span>
                <span className="flex items-center gap-0.5">
                  <span
                    title="Oura"
                    aria-label="Oura"
                    className={linkItemClassName4}
                  >
                    {"O" + " "}
                  </span>
                  <span
                    title="Whoop"
                    aria-label="Whoop"
                    className={linkItemClassName5}
                  >
                    {"W"}
                  </span>
                </span>
                <span
                  title="Sources agree (within 10%)"
                  className="bg-ploy-accent-secondary-500 w-1.5 h-1.5 block rounded-full"
                />
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"65 bpm"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Resting heart rate"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape12 />
                <div tabIndex={-1} className={linkItemClassName8}>
                  <div className={linkItemClassName9}>
                    <p className="text-nowrap invisible recharts-tooltip-label" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 64 bpm</span>
            <span className="block">▲ 1 bpm</span>
          </div>
        </a>
        <a
          href="/biometrics/respiratory_rate"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Respiratory rate</p>
                <span className={linkItemClassName3}>{" " + "In range"}</span>
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"14.4 /min"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Respiratory rate"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape13 />
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 13.9 /min</span>
            <span className="block">▲ 0.5 /min</span>
          </div>
        </a>
        <a
          href="/biometrics/spo2"
          className={linkItemClassName}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 grow basis-[0%]">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className={linkItemClassName2}>Blood oxygen</p>
                <span className={linkItemClassName3}>{" " + "In range"}</span>
                <span className="flex items-center gap-0.5">
                  <span
                    title="Oura"
                    aria-label="Oura"
                    className={linkItemClassName4}
                  >
                    {"O" + " "}
                  </span>
                  <span
                    title="Whoop"
                    aria-label="Whoop"
                    className={linkItemClassName5}
                  >
                    {"W"}
                  </span>
                </span>
                <span
                  title="Sources agree (within 10%)"
                  className="bg-ploy-accent-secondary-500 w-1.5 h-1.5 block rounded-full"
                />
              </div>
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={linkItemClassName6}
              >
                {"96.1%"}
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                aria-label="Pin Blood oxygen"
                style={{ fontVariationSettings: "inherit" }}
                className={linkItemClassName7}
                data-ploy-component-type="button"
                data-ploy-component-variant="outline"
              >
                <FooterIcon4 />
              </button>
            </div>
          </div>
          <div className="h-12 mt-3 -mx-1">
            <div className="w-full h-full min-w-0 recharts-responsive-container">
              <div className="w-full h-full max-w-[16rem] max-h-12 relative cursor-default recharts-wrapper">
                <FooterShape14 />
                <div tabIndex={-1} className={linkItemClassName8}>
                  <div className={linkItemClassName9}>
                    <p className="text-nowrap invisible recharts-tooltip-label" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
            <span className="block">Baseline 96.0%</span>
            <span className="block">▲ 0.1%</span>
          </div>
        </a>
      </div>
    </section>
  );
}
