/**
 * @ployComponent
 * @ployComponentId care-accept-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
export default function HeroSection() {
  return (
    <div className="bg-ploy-background-primary flex justify-center items-center px-6 min-h-screen text-ploy-text-primary">
      <div className="text-center max-w-md">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"Caregiver invite"}
        </p>
        <h1 className="font-heading text-ploy-text-primary [font-weight:inherit] text-4xl mt-2">
          {"Join their circle"}
        </h1>
        <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-4">
          {
            "Accepting gives you the access they granted. They'll always control what you can do and can revoke any time."
          }
        </p>
        <p className="text-ploy-accent-secondary-500 leading-snug text-sm mt-6">
          {"This link is missing its invite token."}
        </p>
      </div>
    </div>
  );
}
