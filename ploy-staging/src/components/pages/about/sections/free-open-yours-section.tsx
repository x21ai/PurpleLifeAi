/**
 * @ployComponent
 * @ployComponentId about-free-open-yours-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from heading: Free, open, yours.
 */
export default function FreeOpenYoursSection() {
  return (
    <section className="relative h-[clamp(360px,52vh,560px)] overflow-hidden">
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
        className="absolute inset-0 bg-white/72 backdrop-blur-[2px]"
      />
      <div className="text-center absolute flex justify-center items-center inset-0">
        <div className="max-w-screen-md mx-auto max-md:px-6 md:px-10">
          <h1 className="font-heading text-purplelife-ink leading-none [font-weight:inherit] max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-6xl md:tracking-[-1.5px] md:leading-none">
            {"Free, open, yours."}
          </h1>
          <p className="text-purplelife-muted leading-relaxed text-lg max-w-xl opacity-85 mt-6 mx-auto">
            {
              "Open source on GitHub. No ads. No selling your data. No third-party trackers, ever."
            }
          </p>
        </div>
      </div>
    </section>
  );
}
