/**
 * @ployComponent
 * @ployComponentId meds-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
export default function HeroSection() {
  return (
    <div className="bg-ploy-background-primary flex justify-center items-center px-4 min-h-screen text-ploy-text-primary">
      <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary text-center w-full max-w-md shadow-sm p-6 rounded-3xl border">
        <h1 className="text-ploy-text-primary leading-snug font-semibold text-xl tracking-tight">
          {"PurpleLife could not finish loading"}
        </h1>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-2">
          {
            "The app hit an unexpected error. Try again, then share the error ID if this keeps happening."
          }
        </p>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-4">
          {"Error ID:" + " "}
          <code
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }}
            className="bg-ploy-neutral-primary-s3 text-ploy-text-primary text-[1em] px-1.5 py-0.5 rounded-tr rounded-tl rounded-br rounded-bl"
          >
            {" " + "81310d2a-93d4-46a4-9440-f2963d6fac7d"}
          </code>
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button
            type="button"
            style={{ fontVariationSettings: "inherit" }}
            className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap h-9 min-h-11 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
          >
            {"Try again"}
          </button>
          <button
            type="button"
            style={{ fontVariationSettings: "inherit" }}
            className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-sm whitespace-nowrap h-9 min-h-11 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
          >
            {"Copy error ID"}
          </button>
          <a
            href="/contact?source=global-error&errorId=81310d2a-93d4-46a4-9440-f2963d6fac7d"
            className="border-solid border-ploy-button-secondary-border bg-[rgb(10,7,16)] text-ploy-text-primary leading-snug font-medium text-sm min-h-11 flex justify-center items-center transition-colors px-4 py-2 rounded-[0.875rem] border-input hover:bg-[#b084d1] border"
            data-ploy-component-type="button"
            data-ploy-component-variant="primary"
          >
            {"Contact support"}
          </a>
        </div>
      </div>
    </div>
  );
}
