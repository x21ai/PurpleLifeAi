/**
 * @ployComponent
 * @ployComponentId trust-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
type ListItemProps = {
  className: string;
  text: string;
  text_1: string;
  separator?: string;
};

function ListItem({ className, text, text_1, separator }: ListItemProps) {
  return (
    <>
      <li className={className || undefined}>
        <h3 className="font-heading leading-snug [font-weight:inherit] max-md:text-2xl max-md:tracking-[-0.6px] max-md:leading-snug md:text-3xl md:tracking-tighter md:leading-snug">
          {text}
        </h3>
        <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg mt-3">
          {text_1}
        </p>
      </li>
      {separator}
    </>
  );
}

export const heroSection: ListItemProps[] = [
  {
    className: "mb-14",
    text: "No advertising trackers.",
    text_1:
      "PurpleLife does not use journal details to target advertising. Product measurement, when present, should stay separate from private health content.",
  },
  {
    className: "mb-14",
    text: "Open source.",
    text_1:
      "The entire codebase is public. Read it, audit it, fork it, run your own copy. Every promise on this page can be checked against the code rather than taken on faith.",
  },
  {
    className: "mb-14",
    text: "Private by default.",
    text_1:
      "The interface keeps journal details private unless you choose a read-only sharing scope. Caregivers should see only the information and dates you approve.",
  },
  {
    className: "mb-14",
    text: "AI must show its source.",
    text_1:
      "Any generated observation should point back to the entries it used, describe uncertainty, and avoid diagnosis or treatment advice.",
  },
  {
    className: "mb-14",
    text: "Paid plans are not offered yet.",
    text_1:
      "PurpleLife does not currently offer a paid plan, checkout, or upgrade action.",
  },
  {
    className: "",
    text: "The covenant.",
    text_1:
      "PurpleLife will never sell your data. PurpleLife will refuse acquisition by anyone who would. These are not growth-stage promises to be renegotiated later; they are the reason this exists.",
  },
];

export default function HeroSection({
  items = heroSection,
}: {
  items?: ListItemProps[];
}) {
  return (
    <main>
      <section className="relative h-[clamp(520px,78vh,820px)] overflow-hidden">
        <picture>
          {" "}
          <img
            src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/4a4bcb16-hero-trust-pine-light-sp-8cdbc.webp"
            width="1536"
            height="1024"
            alt="First light filtering through a quiet pine forest, low mist drifting between the trunks."
            loading="eager"
            className="w-full h-full absolute object-cover inset-0 overflow-clip"
          />
        </picture>
        <div
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(oklab(0 0 0 / 0) 0%, oklab(0.13826 0.0103727 -0.0178896 / 0.1) 50%, oklab(0.13826 0.0103727 -0.0178896 / 0.9) 100%)",
          }}
          className="absolute inset-0"
        />
        <div className="absolute flex justify-start items-end inset-0">
          <div className="w-full max-w-6xl mx-auto max-md:pb-14 max-md:px-6 md:pb-20 md:px-10">
            <p
              style={{
                textShadow:
                  "rgba(0, 0, 0, 0.45) 0px 1px 2px, rgba(0, 0, 0, 0.25) 0px 0px 12px",
              }}
              className="text-white leading-none font-semibold text-xs tracking-widest uppercase opacity-[0.92] label-eyebrow"
            >
              {"Trust"}
            </p>
            <h1 className="font-heading text-white leading-[0.98] [font-weight:inherit] max-w-4xl mt-5 max-md:text-5xl max-md:tracking-[-1.2px] max-md:leading-[0.98] md:max-lg:text-7xl md:max-lg:tracking-[-1.8px] md:max-lg:leading-[0.98] lg:text-[6.5rem] lg:tracking-[-2.6px] lg:leading-[6.37rem]">
              {"Why PurpleLife"}
              <br />
              {"is different."}
            </h1>
          </div>
        </div>
      </section>
      <section className="max-w-screen-md mx-auto max-md:px-6 max-md:py-24 md:px-10 md:py-32">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"In writing"}
        </p>
        <h2 className="font-heading leading-[1.06] [font-weight:inherit] mt-5 max-md:text-3xl max-md:tracking-tighter max-md:leading-[1.06] md:text-5xl md:tracking-[-1.2px] md:leading-[1.06]">
          {"Promises you can check."}
        </h2>
        <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg max-w-xl mt-8">
          {
            "Health software asks for the most private things you have. That deserves more than a privacy policy nobody reads. Each claim below is true in the code today, and the code is public."
          }
        </p>
        <ul className="mt-16 mb-0 pl-0">
          {items.map((item, index) => (
            <ListItem
              key={index}
              {...item}
              separator={index < items.length - 1 ? "\n" : ""}
            />
          ))}
        </ul>
        <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg mt-16">
          {"The code is at"}{" "}
          <a
            href="https://github.com/x21ai/PurpleLifeAi"
            target="_blank"
            rel="noreferrer noopener"
            className="text-ploy-text-primary hover:text-ploy-text-primary"
          >
            {"github.com/x21ai/PurpleLifeAi"}
          </a>
          {". Hold us to all of it."}
        </p>
        <div className="border-solid border-ploy-neutral-primary-900 mt-20 pt-10 border-t">
          <p className="font-heading text-ploy-text-primary leading-snug text-xl">
            {"Devyn Walker"}
          </p>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-1">
            {"Founder"}
          </p>
        </div>
      </section>
      <section className="text-center max-w-2xl mx-auto max-md:pb-28 max-md:px-6 md:pb-40 md:px-10">
        <p className="text-ploy-neutral-inverse-600 leading-snug text-sm">
          {"The longer version of these commitments lives in"}{" "}
          <a
            href="/charter"
            className="text-ploy-text-primary hover:text-ploy-text-primary"
          >
            {"the Charter"}
          </a>
          {"."}
        </p>
      </section>
    </main>
  );
}
