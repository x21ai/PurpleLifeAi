/**
 * @ployComponent
 * @ployComponentId contact-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
export default function HeroSection() {
  return (
    <section className="relative h-[clamp(360px,52vh,560px)] overflow-hidden">
      <picture>
        {" "}
        <img
          src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/9438ae49-moment-contact-handwritten-note-bhq-xs-9.webp"
          width="1280"
          height="1280"
          alt="An open notebook with a handwritten note and a fountain pen resting beside it on a wooden desk."
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
            {"Contact"}
          </p>
          <h1 className="font-heading text-white leading-none [font-weight:inherit] mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-6xl md:tracking-[-1.5px] md:leading-none">
            {"Say hello."}
          </h1>
          <p className="text-white/85 leading-relaxed text-lg max-w-xl mt-6">
            {"A real person reads every message. Usually within a day."}
          </p>
        </div>
      </div>
    </section>
  );
}
