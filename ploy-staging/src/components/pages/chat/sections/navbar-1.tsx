/**
 * @ployComponent
 * @ployComponentId chat-navbar-1
 * @ployComponentType component
 * @ployComponentPattern navbar
 * @ployComponentDescription Main navigation for the website.
 */
export default function Navbar1() {
  return (
    <header className="border-solid border-ploy-neutral-primary-s3/40 pb-6 border-b max-md:pt-12 max-md:px-4 md:max-lg:px-10 md:pt-20 lg:px-16">
      <div className="max-w-screen-md mx-auto">
        <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
          {"Ask"}
        </p>
        <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-2 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
          {"I know your"}
          <br />
          {"patterns."}
        </h1>
      </div>
    </header>
  );
}
