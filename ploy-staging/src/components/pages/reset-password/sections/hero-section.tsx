/**
 * @ployComponent
 * @ployComponentId reset-password-hero-section
 * @ployComponentType section
 * @ployComponentPattern hero
 * @ployComponentDescription Deterministic hero section inferred from first meaningful content block
 */
export default function HeroSection() {
  return (
    <div className="bg-ploy-background-primary text-ploy-text-primary flex justify-center items-center px-6 py-12 min-h-screen">
      <div className="w-full max-w-md">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"Reset password"}
        </p>
        <h1 className="font-heading leading-none [font-weight:inherit] mt-5 max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-5xl md:tracking-[-1.2px] md:leading-none">
          {"Choose a new password."}
        </h1>
        <div className="mt-10">
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mb-4">
            {"That reset link expired or was already used."}
          </p>
          <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mb-4">
            {"Reset links expire after 1 hour and only the latest email works."}
          </p>
          <a
            href="/sign-in"
            className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-normal font-medium whitespace-nowrap w-full h-14 inline-flex justify-center items-center gap-2 shadow-sm transition-colors mb-4 px-4 py-2 rounded-[1.25rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
          >
            {"Sign in with your password"}
          </a>{" "}
          <a
            href="/sign-in?reset=expired"
            className="text-nowrap border-solid border-ploy-neutral-primary-900 [color:inherit] bg-ploy-background-primary leading-normal font-medium whitespace-nowrap w-full h-14 inline-flex justify-center items-center gap-2 shadow-sm transition-colors px-4 py-2 rounded-[1.25rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
          >
            {"Request a new reset link"}
          </a>
        </div>
      </div>
    </div>
  );
}
