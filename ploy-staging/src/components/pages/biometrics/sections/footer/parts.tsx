import FooterIcon1 from "../../svgs/footer-icon-1";
import FooterIcon2 from "../../svgs/footer-icon-2";
import FooterIcon3 from "../../svgs/footer-icon-3";
import FooterIcon4 from "../../svgs/footer-icon-4";
import FooterShape1 from "../../svgs/footer-shape-1";
import FooterShape2 from "../../svgs/footer-shape-2";
import FooterShape3 from "../../svgs/footer-shape-3";
import FooterShape4 from "../../svgs/footer-shape-4";
import FooterShape15 from "../../svgs/footer-shape-15";
import FooterShape16 from "../../svgs/footer-shape-16";
import FooterShape17 from "../../svgs/footer-shape-17";
import { FooterPart1, FooterPart2 } from "./subtrees";
const listItemClassName =
  "text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mb-3 label-eyebrow";
const listItemClassName2 =
  "grid gap-3 grid-cols-1 lg:grid-cols-3 md:max-lg:grid-cols-[repeat(2,minmax(0px,1fr))]";
const listItemClassName3 =
  "border-solid border-ploy-neutral-inverse-s0/10 [color:inherit] bg-ploy-background-primary/80 block shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition rounded-[1.25rem] group glass-card max-md:p-4 md:p-5 border";
const listItemClassName4 =
  "text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow";
const listItemClassName5 =
  "text-nowrap text-ploy-text-primary leading-none whitespace-nowrap mt-2 max-md:text-2xl max-md:leading-none md:text-3xl md:leading-none";
const listItemClassName6 =
  "border-solid border-ploy-button-secondary-border text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 inline-flex justify-center items-center transition p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary border";
const listItemClassName7 =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-neutral-primary-s3 text-ploy-text-primary font-semibold text-xs tracking-wide uppercase block shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] px-2 py-0.5 rounded-full border";

/**
 * @ployComponent
 * @ployComponentId biometrics-footer
 * @ployComponentType component
 * @ployComponentPattern footer
 * @ployComponentDescription Site footer with supporting links and information.
 */
type ListItemProps = {
  className: string;
  ployComponentTypeData: string;
  ployComponentVariantData: string;
  text: string;
};

function ListItem({
  className,
  ployComponentTypeData,
  ployComponentVariantData,
  text,
}: ListItemProps) {
  return (
    <button
      type="button"
      style={{ fontVariationSettings: "inherit" }}
      className={className}
      data-ploy-component-type={ployComponentTypeData || undefined}
      data-ploy-component-variant={ployComponentVariantData || undefined}
    >
      {text}
    </button>
  );
}

type ListItem3Props = {
  textClassName: string;
  text: string;
  separator?: string;
};

function ListItem3({ textClassName, text, separator }: ListItem3Props) {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span className={textClassName} />
        {text}
      </span>
      {separator}
    </>
  );
}

type ListItem4Props = {
  className: string;
  text: string;
};

function ListItem4({ className, text }: ListItem4Props) {
  return <th className={className}>{text}</th>;
}

type ListItem5Props = {
  text: string;
  text_1: string;
  text_2: string;
  text_3: string;
};

function ListItem5({ text, text_1, text_2, text_3 }: ListItem5Props) {
  return (
    <tr className="border-solid border-ploy-neutral-primary-s3/60 border-t">
      <td className="text-ploy-text-primary px-3 py-1.5">{text}</td>
      <td className="text-ploy-text-primary/70 text-center px-3 py-1.5">
        {text_1}
      </td>
      <td className="text-ploy-text-primary/70 text-center px-3 py-1.5">
        {text_2}
      </td>
      <td className="text-ploy-text-primary/70 text-center px-3 py-1.5">
        {text_3}
      </td>
    </tr>
  );
}

export const items: ListItemProps[] = [
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "Today",
  },
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "7d",
  },
  {
    className:
      "bg-ploy-button-primary-background text-ploy-button-secondary-text [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full leading-[inherit]",
    ployComponentTypeData: "button",
    ployComponentVariantData: "primary",
    text: "30d",
  },
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "90d",
  },
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "1y",
  },
];

export const textSegments: ListItemProps[] = [
  {
    className:
      "bg-ploy-button-primary-background text-ploy-button-secondary-text [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full leading-[inherit]",
    ployComponentTypeData: "button",
    ployComponentVariantData: "primary",
    text: "No compare",
  },
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "vs previous",
  },
  {
    className:
      "text-ploy-neutral-inverse-600 [font-weight:inherit] text-xs block transition px-3 py-1 rounded-full hover:text-ploy-text-primary leading-[inherit]",
    ployComponentTypeData: "",
    ployComponentVariantData: "",
    text: "vs year ago",
  },
];

export const items3: ListItem3Props[] = [
  {
    textClassName:
      "bg-ploy-background-accent-tertiary w-4 h-2 block rounded-full",
    text: "Oura",
  },
  { textClassName: "bg-emerald-400 w-4 h-2 block rounded-full", text: "Whoop" },
  {
    textClassName: "bg-pink-400 w-4 h-2 block rounded-full",
    text: "Apple Health",
  },
  { textClassName: "bg-zinc-400 w-4 h-2 block rounded-full", text: "Manual" },
];

export const textSegments2: ListItem4Props[] = [
  { className: "font-normal px-3 py-2", text: "Signal" },
  { className: "font-normal text-center px-3 py-2", text: "Oura" },
  { className: "font-normal text-center px-3 py-2", text: "Whoop" },
  { className: "font-normal text-center px-3 py-2", text: "Apple Health" },
];

export const items5: ListItem5Props[] = [
  { text: "Total sleep", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "Sleep score", text_1: "✓", text_2: "✓", text_3: "–" },
  { text: "REM / Deep sleep", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "HRV (RMSSD)", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "Resting HR", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "Respiratory rate", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "SpO₂", text_1: "✓", text_2: "–", text_3: "✓" },
  { text: "Skin temperature", text_1: "✓", text_2: "–", text_3: "✓" },
  { text: "Readiness / Recovery", text_1: "✓", text_2: "✓", text_3: "–" },
  { text: "Stress / Strain", text_1: "✓", text_2: "✓", text_3: "–" },
  { text: "Steps", text_1: "✓", text_2: "–", text_3: "✓" },
  { text: "Active calories", text_1: "✓", text_2: "✓", text_3: "✓" },
  { text: "VO₂max", text_1: "–", text_2: "–", text_3: "✓" },
  { text: "Workout minutes", text_1: "✓", text_2: "✓", text_3: "✓" },
];

export default function Footer() {
  return (
    <div className="grow basis-[0%]">
      <div className="max-w-screen-lg mx-auto pb-24 max-md:pt-8 max-md:px-5 md:max-lg:px-10 md:pt-12 lg:px-16">
        <a
          href="/today"
          className="text-ploy-neutral-inverse-600 leading-snug text-sm inline-flex items-center gap-1.5 hover:text-ploy-text-primary"
        >
          <FooterIcon1 />
          {"Back to today"}
        </a>
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mt-10 label-eyebrow">
          {"Your body"}
        </p>
        <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
          {"Every signal PurpleLife"}
          <br />
          {"is reading."}
        </h1>
        <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-8 px-5 py-4 rounded-3xl border">
          <div className="flex justify-between items-center gap-3">
            <div className="leading-tight min-w-0">
              <p className="text-ploy-neutral-inverse-600 text-xs">
                {"Data through" + " "}
                <span className="text-ploy-text-primary/80">
                  {" " + "Tue Sep 15"}
                </span>
              </p>
              <p className="text-ploy-neutral-inverse-600 text-xs">
                {"Last pulled" + " "}
                <span className="text-ploy-text-primary/80">
                  {" " + "about 1 hour ago"}
                </span>
              </p>
            </div>
            <button
              aria-label="Sync wearables now"
              style={{ fontVariationSettings: "inherit" }}
              className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex shrink-0 justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-ploy-background-accent-tertiary hover:text-ploy-text-inverse border"
            >
              <FooterIcon2 />
              {"Sync now"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary flex p-0.5 rounded-full border">
            {items.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
          </div>
          <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary flex p-0.5 rounded-full border">
            {textSegments.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="border-solid border-ploy-accent-primary-300/30 bg-ploy-accent-primary-400/5 flex items-start gap-3 mb-10 px-5 py-4 rounded-3xl border">
            <FooterIcon3 />
            <div className="min-w-0">
              <p className="text-ploy-text-primary leading-snug font-medium text-sm">
                {"2 signals need a look"}
              </p>
              <p className="text-ploy-neutral-inverse-600 text-xs mt-0.5">
                {"Temp Δ, Activity"}
              </p>
            </div>
          </div>
          <section className="mb-10">
            <p className={listItemClassName}>Needs a look</p>
            <div className={listItemClassName2}>
              <div id="metric-temp_deviation">
                <a
                  href="/biometrics/temp_deviation"
                  className={listItemClassName3}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 grow basis-[0%]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className={listItemClassName4}>Skin temperature</p>
                        <span className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-accent-primary-400/10 text-[rgb(232,195,158)] font-semibold text-xs tracking-wide uppercase block shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] px-2 py-0.5 rounded-full border">
                          {"Pay attention"}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className={listItemClassName5}
                      >
                        {"-0.2°C"}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        aria-label="Pin Skin temperature"
                        style={{ fontVariationSettings: "inherit" }}
                        className={listItemClassName6}
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
                        <FooterShape1 />
                      </div>
                    </div>
                  </div>
                  <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                    <span className="block">Baseline +0.1°C</span>
                    <span className="block">▼ +0.3°C</span>
                  </div>
                </a>
              </div>
              <div id="metric-activity_score">
                <a
                  href="/biometrics/activity_score"
                  className={listItemClassName3}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 grow basis-[0%]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className={listItemClassName4}>Activity score</p>
                        <span className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-accent-primary-400/10 text-[rgb(232,195,158)] font-semibold text-xs tracking-wide uppercase block shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] px-2 py-0.5 rounded-full border">
                          {"Pay attention"}
                        </span>
                      </div>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className={listItemClassName5}
                      >
                        {"50"}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        aria-label="Pin Activity score"
                        style={{ fontVariationSettings: "inherit" }}
                        className={listItemClassName6}
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
                        <FooterShape2 />
                      </div>
                    </div>
                  </div>
                  <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                    <span className="block">Baseline 63</span>
                    <span className="block">▼ 13</span>
                  </div>
                </a>
              </div>
            </div>
          </section>
          <section className="mb-10">
            <p className={listItemClassName}>Recovery</p>
            <div className={listItemClassName2}>
              <a
                href="/biometrics/readiness"
                className={listItemClassName3}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 grow basis-[0%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={listItemClassName4}>Readiness</p>
                      <span className={listItemClassName7}>
                        {" " + "In range"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className={listItemClassName5}
                    >
                      {"78"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      aria-label="Pin Readiness"
                      style={{ fontVariationSettings: "inherit" }}
                      className={listItemClassName6}
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
                      <FooterShape3 />
                    </div>
                  </div>
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                  <span className="block">Baseline 77</span>
                  <span className="block">▲ 1</span>
                </div>
              </a>
              <a
                href="/biometrics/whoop_recovery"
                className={listItemClassName3}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 grow basis-[0%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={listItemClassName4}>Recovery</p>
                      <span className={listItemClassName7}>
                        {" " + "In range"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className={listItemClassName5}
                    >
                      {"76%"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      aria-label="Pin Recovery"
                      style={{ fontVariationSettings: "inherit" }}
                      className={listItemClassName6}
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
                      <FooterShape4 />
                    </div>
                  </div>
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                  <span className="block">Baseline 61%</span>
                  <span className="block">▲ 15%</span>
                </div>
              </a>
            </div>
          </section>
          <FooterPart1 />
          <FooterPart2 />
          <section className="mb-10">
            <p className={listItemClassName}>Movement</p>
            <div className={listItemClassName2}>
              <a
                href="/biometrics/whoop_strain"
                className={listItemClassName3}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 grow basis-[0%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={listItemClassName4}>Strain</p>
                      <span className={listItemClassName7}>
                        {" " + "In range"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className={listItemClassName5}
                    >
                      {"4.3"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      aria-label="Pin Strain"
                      style={{ fontVariationSettings: "inherit" }}
                      className={listItemClassName6}
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
                      <FooterShape15 />
                    </div>
                  </div>
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                  <span className="block">Baseline 7.2</span>
                  <span className="block">▼ 2.9</span>
                </div>
              </a>
              <a
                href="/biometrics/steps"
                className={listItemClassName3}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 grow basis-[0%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={listItemClassName4}>Steps</p>
                      <span className={listItemClassName7}>
                        {" " + "In range"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className={listItemClassName5}
                    >
                      {"3,555"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      aria-label="Pin Steps"
                      style={{ fontVariationSettings: "inherit" }}
                      className={listItemClassName6}
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
                      <FooterShape16 />
                    </div>
                  </div>
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                  <span className="block">Baseline 4,482.852</span>
                  <span className="block">▼ 927.852</span>
                </div>
              </a>
            </div>
          </section>
          <section>
            <p className={listItemClassName}>Stress &amp; body</p>
            <div className={listItemClassName2}>
              <a
                href="/biometrics/stress"
                className={listItemClassName3}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 grow basis-[0%]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className={listItemClassName4}>Stress</p>
                      <span className={listItemClassName7}>
                        {" " + "In range"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily:
                          "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                      }}
                      className={listItemClassName5}
                    >
                      {"70"}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <button
                      type="button"
                      aria-label="Pin Stress"
                      style={{ fontVariationSettings: "inherit" }}
                      className={listItemClassName6}
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
                      <FooterShape17 />
                    </div>
                  </div>
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2">
                  <span className="block">Baseline 71</span>
                  <span className="block">▼ 1</span>
                </div>
              </a>
            </div>
          </section>
        </div>
        <div className="text-ploy-neutral-inverse-600 text-xs flex flex-wrap items-center gap-4 mt-10">
          <span className="text-ploy-neutral-inverse-600 leading-none font-semibold tracking-widest uppercase block label-eyebrow">
            {"Sources"}
          </span>
          {items3.map((item, index) => (
            <ListItem3
              key={index}
              {...item}
              separator={index < items3.length - 1 ? " " : ""}
            />
          ))}
        </div>
        <details className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-6 p-5 rounded-3xl border">
          <summary className="text-ploy-text-primary leading-snug text-sm list-item cursor-pointer">
            {"What does each source provide?"}
          </summary>
          <div className="overflow-x-auto mt-4">
            <table className="text-xs w-full">
              <thead className="table-header-group">
                <tr className="text-ploy-neutral-inverse-600 text-left">
                  {textSegments2.map((item, index) => (
                    <ListItem4 key={index} {...item} />
                  ))}
                </tr>
              </thead>
              <tbody className="table-row-group">
                {items5.map((item, index) => (
                  <ListItem5 key={index} {...item} />
                ))}
              </tbody>
            </table>
            <p className="text-ploy-neutral-inverse-600 text-xs mt-3">
              {
                "When multiple sources report the same signal, the card shows one colored line per source so you can compare them side by side."
              }
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
