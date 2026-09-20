import HeroSectionIcon1 from "../svgs/hero-section-icon-1";
import HeroSectionIcon2 from "../svgs/hero-section-icon-2";
import HeroSectionIcon3 from "../svgs/hero-section-icon-3";

/**
 * @ployComponent
 * @ployComponentId pricing-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type ListItemProps = {
  className: string;
  text: string;
};

function ListItem({ className, text }: ListItemProps) {
  return <p className={className}>{text}</p>;
}

type HeroSectionIconItemProps = {
  className: string;
  text: string;
  separator?: string;
};

function HeroSectionIconItem({
  className,
  text,
  separator,
}: HeroSectionIconItemProps) {
  return (
    <>
      <li className={className}>
        <HeroSectionIcon1 />
        <span className="block">{text}</span>
      </li>
      {separator}
    </>
  );
}

type HeroSectionIconItem2Props = {
  className: string;
  text: string;
  separator?: string;
};

function HeroSectionIconItem2({
  className,
  text,
  separator,
}: HeroSectionIconItem2Props) {
  return (
    <>
      <li className={className}>
        <HeroSectionIcon3 />
        <span className="block">{text}</span>
      </li>
      {separator}
    </>
  );
}

type ListItem3Props = {
  className: string;
  text: string;
  text_2: string;
};

function ListItem3({ className, text, text_2 }: ListItem3Props) {
  return (
    <details className={className}>
      <summary className="leading-normal font-medium flex justify-between items-center gap-4 cursor-pointer">
        <span className="block">{text}</span>
        <span className="text-ploy-neutral-inverse-600 block transition">
          {"+"}
        </span>
      </summary>
      <p className="text-ploy-neutral-inverse-600 leading-relaxed text-sm mt-3">
        {text_2}
      </p>
    </details>
  );
}

export const items: ListItemProps[] = [
  {
    className:
      "text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow",
    text: "Design preview",
  },
  { className: "font-heading leading-none text-5xl mt-4", text: "Open now" },
  {
    className: "text-ploy-neutral-inverse-600 leading-snug text-sm mt-2",
    text: "No payment or card details",
  },
];

export const heroSectionIcons: HeroSectionIconItemProps[] = [
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Private notes, symptoms, sleep, and medication screens" },
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Source-aware pattern and metric views" },
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Read-only caregiver and report previews" },
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Privacy, travel, and data-control workflows" },
  { className: "leading-relaxed text-sm flex gap-3", text: "No live billing, uploads, or account changes" },
];

export const textSegments: ListItemProps[] = [
  {
    className:
      "text-ploy-accent-primary-500 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow",
    text: "Later plan",
  },
  { className: "font-heading leading-none text-5xl mt-4", text: "Not live" },
  {
    className: "text-ploy-neutral-inverse-600 leading-snug text-sm mt-2",
    text: "Roadmap only, with no checkout",
  },
];

export const heroSectionIcons2: HeroSectionIconItem2Props[] = [
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Connected health-source reviews" },
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Expanded report and sharing controls" },
  { className: "leading-relaxed text-sm flex gap-3 mb-3", text: "Additional care connections" },
  { className: "leading-relaxed text-sm flex gap-3", text: "Exact scope and price still undecided" },
];

export const textSegments2: ListItem3Props[] = [
  { className: "border-solid border-ploy-neutral-primary-s3 py-5 border-b group", text: "Can I buy a plan today?", text_2: "No. This is a design preview and there is no live payment or upgrade flow." },
  { className: "border-solid border-ploy-neutral-primary-s3 py-5 border-b group", text: "What can I review now?", text_2: "You can move through the journal, health, sharing, report, privacy, and account interface without changing production records." },
  { className: "border-solid border-ploy-neutral-primary-s3 py-5 border-b group", text: "Is the later plan final?", text_2: "No. Its scope, price, and timing remain undecided." },
  { className: "border-solid border-ploy-neutral-primary-s3 py-5 border-b group", text: "Does this preview collect payment details?", text_2: "No. There is no checkout, card form, or billing action in this preview." },
  { className: "py-5 group", text: "Where can I inspect the code?", text_2: "The public source reference is available in the PurpleLife repository on GitHub." },
];

export default function HeroSection() {
  return (
    <main>
      <section className="text-center max-w-4xl mx-auto pb-12 max-md:pt-24 max-md:px-6 md:pt-32 md:px-10">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"Pricing"}
        </p>
        <h1 className="font-heading leading-none [font-weight:inherit] tracking-[-0.02em] mt-4 max-md:text-5xl max-md:leading-none md:text-7xl md:leading-none">
          {"Simple plans."}
          <br />
          {"Honest pricing."}
        </h1>
        <p className="text-ploy-neutral-inverse-600 text-lg max-w-xl mt-6 mx-auto">
          {
            "PurpleLife is a design preview. The current interface has no live payment, upgrade, or billing flow."
          }
        </p>
      </section>
      <section className="max-w-screen-lg mx-auto pb-20 max-md:px-6 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary p-8 rounded-[1.75rem] border">
            {items.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
            <a
              href="/today"
              className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-sm whitespace-nowrap w-full h-11 inline-flex justify-center items-center gap-2 shadow-sm transition-colors mt-6 px-4 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-ploy-background-accent-primary hover:text-ploy-text-inverse border"
            >
              {"Open the preview"}
            </a>
            <ul className="mt-8 mb-0 pl-0">
              {heroSectionIcons.map((item, index) => (
                <HeroSectionIconItem
                  key={index}
                  {...item}
                  separator={index < heroSectionIcons.length - 1 ? "\n" : ""}
                />
              ))}
            </ul>
          </div>
          <div className="border-solid border-ploy-accent-primary bg-ploy-background-secondary relative p-8 rounded-[1.75rem] border-2">
            <div className="bg-ploy-background-accent-primary text-ploy-text-primary text-xs tracking-wide uppercase absolute flex items-center gap-1.5 px-3 py-1 rounded-full left-8 -top-3">
              <HeroSectionIcon2 />
              {"Planned"}
            </div>
            {textSegments.map((item, index) => (
              <ListItem key={index} {...item} />
            ))}
            <a
              href="/contact"
              className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap w-full h-11 inline-flex justify-center items-center gap-2 shadow-sm transition-colors mt-6 px-4 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
            >
              {"Ask about the roadmap"}
            </a>
            <ul className="mt-8 mb-0 pl-0">
              {heroSectionIcons2.map((item, index) => (
                <HeroSectionIconItem2
                  key={index}
                  {...item}
                  separator={index < heroSectionIcons2.length - 1 ? "\n" : ""}
                />
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="max-w-screen-md mx-auto pb-28 max-md:px-6 md:px-10">
        <h2 className="font-heading [font-weight:inherit] tracking-[-0.01em] max-md:leading-tight max-md:text-3xl md:text-4xl">
          {"Questions"}
        </h2>
        <div className="border-solid border-ploy-neutral-primary-s3 mt-8 border-t border-b">
          {textSegments2.map((item, index) => (
            <ListItem3 key={index} {...item} />
          ))}
        </div>
      </section>
      <section className="text-center max-w-2xl mx-auto pb-32 max-md:px-6 md:px-10">
        <h2 className="font-heading [font-weight:inherit] tracking-[-0.01em] max-md:leading-tight max-md:text-3xl md:text-4xl">
          {"Review the experience."}
        </h2>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-3">
          {"Explore the interface without changing production records."}
        </p>
        <div className="mt-8">
          <a
            href="/today"
            className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-normal font-medium whitespace-nowrap h-12 inline-flex justify-center items-center gap-2 shadow-sm transition-colors px-7 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
          >
            {"Open Today"}
          </a>
        </div>
      </section>
    </main>
  );
}
