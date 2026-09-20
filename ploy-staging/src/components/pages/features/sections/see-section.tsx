/**
 * @ployComponent
 * @ployComponentId features-see-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: See
 */
export default function SeeSection() {
  return (
    <section className="max-w-6xl mx-auto max-md:px-6 max-md:py-20 md:px-10 md:py-28">
      <div className="grid items-center lg:grid-cols-2 max-lg:gap-10 lg:gap-16">
        <div className="order-2">
          <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
            {"See"}
          </p>
          <h2 className="font-heading leading-none [font-weight:inherit] mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:max-lg:text-5xl md:max-lg:tracking-[-1.2px] md:max-lg:leading-none lg:text-6xl lg:tracking-[-1.5px] lg:leading-none">
            {"One timeline. The whole picture."}
          </h2>
          <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg max-w-lg mt-6">
            {
              "Seizures, meds, journal moments, sleep, HRV, in one feed you can filter by day, week, month, or year. A daily forecast watches your sleep, missed doses, menstrual phase, and your own trigger history."
            }
          </p>
        </div>
        <div className="order-1">
          <div className="aspect-[4_/_3] relative rounded-[1.75rem] overflow-hidden">
            <picture>
              {" "}
              <img
                src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/9a05dab3-moment-features-hand-on-shoulder-cfzroxju.webp"
                width="1280"
                height="1280"
                alt="A caregiver's hand resting on a loved one's shoulder, soft natural light from a nearby window."
                loading="eager"
                className="w-full h-full absolute object-cover inset-0 overflow-clip"
              />
            </picture>
          </div>
        </div>
      </div>
    </section>
  );
}
