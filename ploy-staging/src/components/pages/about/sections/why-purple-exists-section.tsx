/**
 * @ployComponent
 * @ployComponentId about-why-purple-exists-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from label: Why PurpleLife exists
 */
export default function WhyPurpleExistsSection() {
  return (
    <section className="max-w-screen-md mx-auto max-md:px-6 max-md:py-24 md:px-10 md:py-32">
      <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
        {"Why PurpleLife exists"}
      </p>
      <h2 className="font-heading leading-[1.06] [font-weight:inherit] mt-5 max-md:text-3xl max-md:tracking-tighter max-md:leading-[1.06] md:text-5xl md:tracking-[-1.2px] md:leading-[1.06]">
        {"Most health apps feel like spreadsheets."}
      </h2>
      <div className="text-ploy-neutral-inverse-600 leading-relaxed text-lg mt-10">
        <p className="mb-7">
          {
            "Living with a chronic condition means watching your body, your meds, your sleep, your moods. Every day. The tools that try to help are cold, demanding, full of charts that don’t answer the question you actually have."
          }
        </p>
        <p>
          {
            "PurpleLife listens before it speaks. It takes whatever you can give it, a sentence, a voice memo, a photo, and quietly builds a picture of you over time. When you have a question, PurpleLife has read the chapters that matter."
          }
        </p>
      </div>
    </section>
  );
}
