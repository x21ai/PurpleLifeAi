/**
 * @ployComponent
 * @ployComponentId about-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
export default function HeroSection() {
  return (
    <section className="relative h-[clamp(480px,64vh,660px)] overflow-hidden">
      <picture>
        {" "}
        <img
          src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/f93c2ab9-hero-about-quiet-hills-bqjd1uwo.webp"
          width="1920"
          height="1280"
          alt="Quiet rolling hills at twilight, low purple haze blanketing the distant fields."
          loading="eager"
          className="w-full h-full absolute object-cover inset-0 overflow-clip"
        />
      </picture>
      <div
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(248,247,252,0.05) 0%, rgba(248,247,252,0.58) 55%, rgba(248,247,252,0.98) 100%)",
        }}
        className="absolute inset-0"
      />
      <div className="absolute flex justify-start items-end inset-0">
        <div className="w-full max-w-6xl mx-auto max-md:pb-14 max-md:px-6 md:pb-20 md:px-10">
          <p
            className="text-purplelife-accent leading-none font-semibold text-xs tracking-widest uppercase opacity-[0.92] label-eyebrow"
          >
            {"About PurpleLife"}
          </p>
          <h1 className="font-heading text-purplelife-ink leading-[0.98] [font-weight:inherit] max-w-4xl mt-5 max-md:text-5xl max-md:tracking-[-1.2px] max-md:leading-[0.98] md:max-lg:text-7xl md:max-lg:tracking-[-1.8px] md:max-lg:leading-[0.98] lg:text-[5.75rem] lg:tracking-[-2.4px] lg:leading-[0.98]">
            {"Calm, quiet,"}
            <br />
            {"on your side."}
          </h1>
        </div>
      </div>
    </section>
  );
}
