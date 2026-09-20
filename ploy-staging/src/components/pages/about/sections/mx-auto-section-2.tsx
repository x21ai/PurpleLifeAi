/**
 * @ployComponent
 * @ployComponentId about-mx-auto-section-2
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function MxAutoSection2() {
  return (
    <section className="max-w-6xl will-change-[opacity,transform] transition-[opacity,transform,translate,scale,rotate] ease-[ease-out] mx-auto max-md:px-6 max-md:py-16 md:max-lg:py-24 md:px-10 lg:py-28">
      <div className="grid items-center lg:grid-cols-2 max-lg:gap-10 lg:gap-20">
        <div className="w-full relative order-2 rounded-[1.75rem] max-lg:aspect-[4_/_5] max-lg:max-w-[26.25rem] max-lg:mx-auto lg:aspect-[3_/_4] lg:max-w-none lg:mx-0 overflow-hidden">
          <picture>
            {" "}
            <img
              src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/2cf5aeed-moment-about-arm-around-05-egolw.webp"
              width="1280"
              height="1280"
              alt="Two people side by side, one arm around the other's shoulders, watching the day end together."
              loading="eager"
              className="w-full h-full absolute object-cover inset-0 overflow-clip"
            />
          </picture>
        </div>
        <div className="order-1">
          <p className="font-heading text-ploy-text-primary leading-[1.12] max-md:text-3xl max-md:tracking-tighter max-md:max-w-[18.75rem] max-md:leading-[1.12] md:max-lg:text-4xl md:max-lg:tracking-tighter md:max-lg:max-w-[22.5rem] md:max-lg:leading-[1.12] lg:text-5xl lg:tracking-[-1.2px] lg:max-w-[30rem] lg:leading-[1.12]">
            {"“No one should do this alone.”"}
          </p>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm tracking-wide uppercase mt-8">
            {"On caregivers, family, and the people who help"}
          </p>
        </div>
      </div>
    </section>
  );
}
