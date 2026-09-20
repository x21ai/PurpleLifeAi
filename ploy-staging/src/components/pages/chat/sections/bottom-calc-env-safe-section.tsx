import BottomCalcEnvSafeSectionIcon1 from "../svgs/bottom-calc-env-safe-section-icon-1";
import BottomCalcEnvSafeSectionIcon2 from "../svgs/bottom-calc-env-safe-section-icon-2";
import BottomCalcEnvSafeSectionIcon3 from "../svgs/bottom-calc-env-safe-section-icon-3";

/**
 * @ployComponent
 * @ployComponentId chat-bottom-calc-env-safe-section
 * @ployComponentType section
 * @ployComponentPattern section
 * @ployComponentDescription Deterministic section inferred from semantic markup
 */
export default function BottomCalcEnvSafeSection() {
  return (
    <div className="border-solid border-ploy-neutral-primary-s2/40 bg-ploy-background-primary/95 backdrop-blur py-4 border-t inset-x-0 ploy-styles-rule-0 max-md:fixed max-md:px-4 max-md:bottom-16 md:max-lg:px-10 md:bottom-auto lg:px-16">
      <div className="text-ploy-neutral-inverse-600 leading-snug text-xs max-w-screen-md flex items-start gap-2 mx-auto pb-2">
        <p className="grow basis-[0%]">
          {
            "PurpleLife isn't a clinician. Ideas here support your own judgement, talk to your care team for anything that needs a decision."
          }
        </p>
        <button
          type="button"
          aria-label="Dismiss disclaimer"
          style={{ fontVariationSettings: "inherit" }}
          className="text-ploy-neutral-inverse-600/70 [font-weight:inherit] block shrink-0 p-0 hover:text-ploy-text-primary"
        >
          <BottomCalcEnvSafeSectionIcon1 />
        </button>
      </div>
      <div className="max-w-screen-md flex items-end gap-3 mx-auto">
        <textarea
          placeholder="Ask anything about your patterns…"
          rows={1}
          className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/60 leading-snug text-sm whitespace-pre-wrap break-words max-h-40 grow basis-[0%] shadow-[0px_0px_0px_2px_oklab(0.985621_0.000790089_-0.00252056_/_0.3)] cursor-text px-4 py-3 rounded-3xl border"
        />
        <button
          aria-label="Start voice input"
          style={{ fontVariationSettings: "inherit" }}
          className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-sm whitespace-nowrap w-11 h-11 flex shrink-0 justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors p-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
        >
          <BottomCalcEnvSafeSectionIcon2 />
        </button>
        <button
          disabled={true}
          aria-label="Send"
          style={{ fontVariationSettings: "inherit" }}
          className="pointer-events-none text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap w-11 h-11 flex shrink-0 justify-center items-center gap-2 shadow-sm opacity-50 cursor-not-allowed transition-colors p-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
        >
          <BottomCalcEnvSafeSectionIcon3 />
        </button>
      </div>
    </div>
  );
}
