/**
 * @ployComponent
 * @ployComponentId about-begin-where-you-are-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from heading: Begin where you are.
 */
export default function BeginWhereYouAreSection() {
  return (
    <section className="text-center max-w-2xl mx-auto max-md:px-6 max-md:py-28 md:px-10 md:py-40">
      <h2 className="font-heading leading-none [font-weight:inherit] max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-5xl md:tracking-[-1.2px] md:leading-none">
        {"Begin where you are."}
      </h2>
      <div className="mt-10">
        <a
          href="/sign-up"
          className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-normal font-medium whitespace-nowrap h-12 inline-flex justify-center items-center gap-2 shadow-sm transition-colors px-7 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
        >
          {"Create your free account"}
        </a>
      </div>
    </section>
  );
}
