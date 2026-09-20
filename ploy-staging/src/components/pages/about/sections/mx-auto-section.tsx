/**
 * @ployComponent
 * @ployComponentId about-mx-auto-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function MxAutoSection() {
  return (
    <section className="text-center max-w-4xl will-change-[opacity,transform] transition-[opacity,transform,translate,scale,rotate] ease-[ease-out] mx-auto max-md:px-6 max-md:py-28 md:px-10 md:py-40">
      <p className="font-heading text-ploy-text-primary leading-none max-md:text-5xl max-md:tracking-[-1.2px] max-md:leading-none md:max-lg:text-7xl md:max-lg:tracking-[-1.8px] md:max-lg:leading-none lg:text-8xl lg:tracking-[-2.4px] lg:leading-none">
        {"Named for the color of epilepsy awareness."}
      </p>
      <p className="text-ploy-neutral-inverse-600 leading-relaxed text-lg max-w-xl mt-8 mx-auto">
        {"Built for anyone carrying something heavy."}
      </p>
    </section>
  );
}
