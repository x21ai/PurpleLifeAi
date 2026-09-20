/**
 * @ployComponent
 * @ployComponentId features-capture-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: Capture
 */
export default function CaptureSection() {
  return (
    <section className="max-w-6xl mx-auto max-md:px-6 max-md:py-20 md:px-10 md:py-28">
      <div className="grid items-center lg:grid-cols-2 max-lg:gap-10 lg:gap-16">
        <div className="order-1">
          <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
            {"Capture"}
          </p>
          <h2 className="font-heading leading-none [font-weight:inherit] mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:max-lg:text-5xl md:max-lg:tracking-[-1.2px] md:max-lg:leading-none lg:text-6xl lg:tracking-[-1.5px] lg:leading-none">
            {"Type it. Say it. Snap it."}
          </h2>
          <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg max-w-lg mt-6">
            {
              "A sentence. A 60-second voice memo. A photo of how a rash looks today. A short video. PurpleLife transcribes, tags, and summarizes, so nothing slips through, and you don't think about filing."
            }
          </p>
        </div>
        <div className="order-2">
          <div className="aspect-[4_/_3] relative rounded-[1.75rem] overflow-hidden">
            <picture>
              {" "}
              <img
                src="https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/b1784894-moment-features-pill-organizer-csbqbcef.webp"
                width="1280"
                height="1280"
                alt="A weekly pill organizer beside a glass of water on a wooden surface, late afternoon light."
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
