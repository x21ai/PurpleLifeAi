import HeroSection from "./sections/hero-section";

export default function Page() {
  return (
    <>
      <HeroSection />
      <div className="bg-ploy-background-primary text-ploy-text-primary min-h-screen">
        <header className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/80 sticky z-30 backdrop-blur border-b top-0">
          <div className="h-16 max-w-6xl flex justify-between items-center mx-auto max-md:px-6 md:px-10">
            <a
              aria-label="Purple home"
              href="/"
              className="text-ploy-text-primary font-semibold text-sm tracking-[0.45em] uppercase block"
            >
              {"Purple"}
            </a>
            <nav className="text-ploy-neutral-inverse-600 leading-snug text-sm items-center gap-6 min-[768px]:flex max-md:hidden">
              <a
                href="/features"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Features"}
              </a>
              <a
                href="/about"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"About"}
              </a>
              <a
                href="/pricing"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Pricing"}
              </a>
              <a
                href="/contact"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Contact"}
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="/sign-in"
                className="text-ploy-neutral-inverse-600 leading-snug text-sm block px-3 py-2 hover:text-ploy-text-primary"
              >
                {"Sign in"}
              </a>
              <a
                href="/sign-up"
                className="text-nowrap bg-ploy-background-secondary text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm transition-colors px-3 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-secondary/90"
              >
                {"Get started"}
              </a>
            </div>
          </div>
        </header>
        <article className="max-w-2xl mx-auto pt-10 pb-16 max-md:px-5 md:px-8">
          <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
            {"Terms"}
          </p>
          <h1 className="font-heading text-ploy-text-primary leading-none [font-weight:inherit] mt-4 max-md:text-5xl max-md:tracking-[-1.2px] max-md:leading-none md:text-6xl md:tracking-[-1.5px] md:leading-none">
            {"The deal, in plain words."}
          </h1>
          <div className="text-ploy-neutral-inverse-600 leading-relaxed text-base mt-8">
            <p className="mb-5">
              {
                "Purple is a personal health journal. It is not a medical device and not a substitute for professional advice, diagnosis, or treatment. In an emergency, call your local emergency number."
              }
            </p>
            <p className="mb-5">
              {
                "You own your data. We don’t sell it, we don’t advertise against it, and you can export or delete it from Settings at any time."
              }
            </p>
            <p className="mb-5">
              {
                "Use Purple honestly. Don’t abuse the service, attempt to break it, or upload content that isn’t yours to share. We may suspend accounts that do."
              }
            </p>
            <p className="mb-5">
              {
                "The software is provided “as is” without warranty of any kind. To the extent allowed by law, the makers of Purple are not liable for damages arising from your use of it."
              }
            </p>
            <p>
              {"See also our"}{" "}
              <a
                href="/privacy"
                className="[color:inherit]"
              >
                {"privacy & safety"}
              </a>{" "}
              {"page and our"}{" "}
              <a
                href="/charter"
                className="[color:inherit]"
              >
                {"founding charter"}
              </a>
              {"."}
            </p>
          </div>
        </article>
        <footer className="border-solid border-ploy-neutral-primary-900 bg-ploy-background-primary/60 border-t">
          <div className="text-ploy-neutral-inverse-600 leading-snug text-sm max-w-6xl flex gap-4 mx-auto py-8 max-md:flex-col max-md:px-5 md:flex-row md:justify-between md:items-center md:px-8">
            <nav
              aria-label="Legal"
              className="flex flex-wrap items-center gap-[0.5rem_20px]"
            >
              <a
                href="/trust"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Trust"}
              </a>
              <a
                href="/charter"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Charter"}
              </a>
              <a
                href="/privacy"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Privacy"}
              </a>
              <a
                href="/terms"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Terms"}
              </a>
              <a
                href="/contact"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"Contact"}
              </a>
              <a
                href="https://github.com/x21ai/PurpleLifeAi"
                target="_blank"
                rel="noreferrer noopener"
                className="[color:inherit] block transition-colors hover:text-ploy-text-primary"
              >
                {"GitHub"}
              </a>
            </nav>
            <p className="leading-snug text-xs">
              {"© 2026 PurpleLife · Design preview"}
            </p>
          </div>
        </footer>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
