/**
 * @ployComponent
 * @ployComponentId features-caregivers-family-anyone-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: Caregivers, family, anyone you trust
 */
export default function CaregiversFamilyAnyoneSection() {
  return (
    <section className="max-w-6xl will-change-[opacity,transform] transition-[opacity,transform,translate,scale,rotate] ease-[ease-out] mx-auto max-md:px-6 max-md:py-16 md:max-lg:py-24 md:px-10 lg:py-28">
      <div className="grid items-center lg:grid-cols-2 max-lg:gap-10 lg:gap-20">
        <div className="w-full relative rounded-[1.75rem] max-lg:aspect-[4_/_5] max-lg:max-w-[26.25rem] max-lg:mx-auto lg:aspect-[3_/_4] lg:max-w-none lg:mx-0 overflow-hidden">
          <picture>
            {" "}
            <img
              src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/9eefadd4-hero-features-misty-valley-b3dob5nk.webp"
              width="1920"
              height="1280"
              alt="A wide, misty mountain valley at first light, layers of fog drifting between distant ridges."
              loading="eager"
              className="w-full h-full absolute object-cover inset-0 overflow-clip"
            />
          </picture>
        </div>
        <div>
          <p className="font-heading text-ploy-text-primary leading-[1.12] max-md:text-3xl max-md:tracking-tighter max-md:max-w-[18.75rem] max-md:leading-[1.12] md:max-lg:text-4xl md:max-lg:tracking-tighter md:max-lg:max-w-[22.5rem] md:max-lg:leading-[1.12] lg:text-5xl lg:tracking-[-1.2px] lg:max-w-[30rem] lg:leading-[1.12]">
            {"“For the people who help you carry it.”"}
          </p>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm tracking-wide uppercase mt-8">
            {"Caregivers, family, anyone you trust"}
          </p>
        </div>
      </div>
    </section>
  );
}
