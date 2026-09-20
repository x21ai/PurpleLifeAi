import MxAutoSection2Icon1 from "../svgs/mx-auto-section-2-icon-1";

/**
 * @ployComponent
 * @ployComponentId features-mx-auto-section-2
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function MxAutoSection2() {
  return (
    <section className="text-center max-w-screen-md mx-auto py-20 max-md:px-6 md:px-10">
      <a
        href="/sign-up"
        className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-normal font-medium whitespace-nowrap h-12 inline-flex justify-center items-center gap-2 shadow-sm transition-colors px-7 py-2 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
      >
        {"Create your free account"}
        <MxAutoSection2Icon1 />
      </a>
    </section>
  );
}
