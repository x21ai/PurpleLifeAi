import type { ReactNode } from "react";
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
import HeroSectionIcon11 from "../svgs/hero-section-icon-11";
import HeroSectionIcon12 from "../svgs/hero-section-icon-12";
const heroSectionIconItemClassName =
  "border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 inline-flex items-center gap-3 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] px-4 py-3 rounded-[1.25rem] border";
const heroSectionIconItemClassName2 =
  "border-solid border-ploy-neutral-inverse-s0/10 [color:inherit] bg-ploy-background-primary/80 [font-weight:inherit] text-left aspect-[1_/_1.1] relative flex flex-col justify-between shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition rounded-[1.25rem] glass-card max-md:p-5 md:p-6 border";
const heroSectionIconItemClassName3 =
  "text-ploy-text-primary leading-none font-light tracking-[-0.02em] max-md:text-[2.75rem] md:text-[3.5rem]";

/**
 * @ployComponent
 * @ployComponentId vitals-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type HeroSectionIconItemProps = {
  icon: ReactNode;
  text: string;
  text_1: string;
  descriptionClassName: string;
  text_3: string;
  text_4: string;
  text_5: string;
  text_6: string;
};

function HeroSectionIconItem({
  icon,
  text,
  text_1,
  descriptionClassName,
  text_3,
  text_4,
  text_5,
  text_6,
}: HeroSectionIconItemProps) {
  return (
    <section className="mt-12">
      <div className={heroSectionIconItemClassName}>
        {icon}
        <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
          {text}
        </h2>
      </div>
      <div className="grid gap-4 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
        <button
          type="button"
          style={{ fontVariationSettings: "inherit" }}
          className={heroSectionIconItemClassName2}
        >
          <div>
            <p className="text-ploy-neutral-inverse-600 text-xs">{text_1}</p>
            <p className={descriptionClassName}>Latest</p>
          </div>
          <HeroSectionIcon4 />
          <p
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className={heroSectionIconItemClassName3}
          >
            {text_3}
          </p>
        </button>
        <button
          type="button"
          style={{ fontVariationSettings: "inherit" }}
          className={heroSectionIconItemClassName2}
        >
          <div>
            <p className="text-ploy-neutral-inverse-600 text-xs">{text_4}</p>
            <p className="text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2">
              {text_5}
            </p>
          </div>
          <HeroSectionIcon4 />
          <p
            style={{
              fontFamily:
                "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
            }}
            className={heroSectionIconItemClassName3}
          >
            {text_6}
          </p>
        </button>
      </div>
    </section>
  );
}

export const heroSectionIcons: HeroSectionIconItemProps[] = [
  {
    icon: <HeroSectionIcon3 />,
    text: "Readiness",
    text_1: "Readiness Score",
    descriptionClassName:
      "text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2",
    text_3: "78",
    text_4: "Symptom Radar",
    text_5: "No data",
    text_6: "–",
  },
  {
    icon: <HeroSectionIcon5 />,
    text: "Sleep",
    text_1: "Sleep Score",
    descriptionClassName:
      "text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2",
    text_3: "70",
    text_4: "Body Clock",
    text_5: "No data",
    text_6: "–",
  },
  {
    icon: <HeroSectionIcon6 />,
    text: "Activity",
    text_1: "Activity Score",
    descriptionClassName:
      "text-[rgb(111,179,148)] font-medium text-xs tracking-[0.12em] uppercase mt-2",
    text_3: "50",
    text_4: "Steps",
    text_5: "Latest",
    text_6: "3555",
  },
];

export default function HeroSection({
  items = heroSectionIcons,
}: {
  items?: HeroSectionIconItemProps[];
}) {
  return (
    <div className="grow basis-[0%]">
      <div
        style={{
          backgroundImage:
            "radial-gradient(90% 55% at 50% -10%, rgba(176, 132, 209, 0.14), rgba(0, 0, 0, 0) 58%)",
        }}
        className="bg-ploy-background-primary min-h-full max-w-screen-md mx-auto pb-32 max-md:pt-8 max-md:px-5 md:max-lg:px-10 md:pt-12 lg:px-16 text-ploy-text-primary"
      >
        <a
          href="/today"
          className="text-ploy-neutral-inverse-600 leading-snug text-sm inline-flex items-center gap-1.5 hover:text-ploy-text-primary"
        >
          <HeroSectionIcon1 />
          {"Today"}
        </a>
        <div className="flex justify-between items-center mt-8">
          <div className="flex items-center gap-3">
            <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
              {"Vitals"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Edit"
            style={{ fontVariationSettings: "inherit" }}
            className="[color:inherit] [font-weight:inherit] w-9 h-9 grid items-center justify-items-center p-0 rounded-full hover:bg-ploy-neutral-primary-s3"
          >
            <HeroSectionIcon2 />
          </button>
        </div>
        <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
          {"How your body is"}
          <br />
          {"reading today."}
        </h1>
        <div className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 flex items-center gap-6 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] mt-10 px-5 rounded-[1.25rem] border">
          <span className="border-solid border-ploy-accent-primary text-ploy-text-primary leading-snug font-semibold text-sm block py-3 border-b-2">
            {"Sep 15"}
          </span>
        </div>
        {items.map((item, index) => (
          <HeroSectionIconItem key={index} {...item} />
        ))}
        <section className="mt-12">
          <div className={heroSectionIconItemClassName}>
            <HeroSectionIcon7 />
            <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
              {"Stress"}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">
                  {"Daytime Stress"}
                </p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Latest"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"70"}
              </p>
            </button>
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">SpO₂</p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Latest"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"96 "}
                <span className="font-body text-ploy-neutral-inverse-600 leading-normal text-base ml-2">
                  {"%"}
                </span>
              </p>
            </button>
          </div>
        </section>
        <section className="mt-12">
          <div className={heroSectionIconItemClassName}>
            <HeroSectionIcon8 />
            <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
              {"Metabolic Health"}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">Glucose</p>
                <p className="text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"No data"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"–"}
              </p>
            </button>
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">Meals</p>
                <p className="text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Log a meal"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"–"}
              </p>
            </button>
          </div>
        </section>
        <section className="mt-12">
          <div className={heroSectionIconItemClassName}>
            <HeroSectionIcon9 />
            <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
              {"Hydration & auras"}
            </h2>
          </div>
          <a
            href="/hydration"
            className="border-solid border-ploy-neutral-inverse-s0/10 [color:inherit] bg-ploy-background-primary/80 block shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition mt-4 rounded-[1.25rem] glass-card max-md:p-5 md:p-6 border"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">
                  {"Open hydration day view"}
                </p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Track water, electrolytes, déjà vu"}
                </p>
              </div>
              <HeroSectionIcon10 />
            </div>
            <p
              style={{
                fontFamily:
                  "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
              }}
              className="text-ploy-text-primary leading-tight mt-5 max-md:text-3xl max-md:leading-tight md:text-4xl md:leading-tight"
            >
              {"Hourly + minute-precision timeline"}
            </p>
          </a>
        </section>
        <section className="mt-12">
          <div className={heroSectionIconItemClassName}>
            <HeroSectionIcon11 />
            <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
              {"Heart Health"}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">
                  {"Cardio Capacity"}
                </p>
                <p className="text-[rgb(232,195,158)] font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Latest"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"NaN "}
                <span className="font-body text-ploy-neutral-inverse-600 leading-normal text-base ml-2">
                  {"VO₂max"}
                </span>
              </p>
            </button>
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">
                  {"Resting Heart Rate"}
                </p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Latest"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"65 "}
                <span className="font-body text-ploy-neutral-inverse-600 leading-normal text-base ml-2">
                  {"bpm"}
                </span>
              </p>
            </button>
          </div>
        </section>
        <section className="mt-12">
          <div className={heroSectionIconItemClassName}>
            <HeroSectionIcon12 />
            <h2 className="text-ploy-text-primary font-semibold text-lg tracking-tight">
              {"Core Metrics"}
            </h2>
          </div>
          <div className="grid gap-4 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">HRV</p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Latest"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"32 "}
                <span className="font-body text-ploy-neutral-inverse-600 leading-normal text-base ml-2">
                  {"ms"}
                </span>
              </p>
            </button>
            <button
              type="button"
              style={{ fontVariationSettings: "inherit" }}
              className={heroSectionIconItemClassName2}
            >
              <div>
                <p className="text-ploy-neutral-inverse-600 text-xs">
                  {"30-day steps"}
                </p>
                <p className="text-slate-400 font-medium text-xs tracking-[0.12em] uppercase mt-2">
                  {"Average"}
                </p>
              </div>
              <HeroSectionIcon4 />
              <p
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className={heroSectionIconItemClassName3}
              >
                {"4532"}
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
