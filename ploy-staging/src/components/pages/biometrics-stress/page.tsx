import HeroSection from "./sections/hero-section";
import PageIcon1 from "./svgs/page-icon-1";
import PageIcon2 from "./svgs/page-icon-2";
import PageIcon3 from "./svgs/page-icon-3";
import PageIcon4 from "./svgs/page-icon-4";
import PageIcon5 from "./svgs/page-icon-5";
import PageIcon6 from "./svgs/page-icon-6";
import PageIcon7 from "./svgs/page-icon-7";
import PageIcon8 from "./svgs/page-icon-8";
import PageIcon9 from "./svgs/page-icon-9";
import PageIcon10 from "./svgs/page-icon-10";
import PageIcon11 from "./svgs/page-icon-11";
import PageIcon12 from "./svgs/page-icon-12";
import PageIcon13 from "./svgs/page-icon-13";
import PageIcon14 from "./svgs/page-icon-14";
import PageIcon15 from "./svgs/page-icon-15";
import PageIcon16 from "./svgs/page-icon-16";
import PageIcon17 from "./svgs/page-icon-17";
import PageIcon18 from "./svgs/page-icon-18";
import PageIcon19 from "./svgs/page-icon-19";
import PageIcon20 from "./svgs/page-icon-20";
import PageIcon21 from "./svgs/page-icon-21";
import PageShape1 from "./svgs/page-shape-1";
import PageIcon22 from "./svgs/page-icon-22";
import PageIcon23 from "./svgs/page-icon-23";
import PageIcon24 from "./svgs/page-icon-24";
import PageIcon25 from "./svgs/page-icon-25";
import PageIcon26 from "./svgs/page-icon-26";
import PageIcon27 from "./svgs/page-icon-27";
import PageIcon28 from "./svgs/page-icon-28";
import PageIcon29 from "./svgs/page-icon-29";

export default function Page() {
  return (
    <>
      <HeroSection />
      <div className="font-body bg-ploy-background-primary text-ploy-text-primary min-h-dvh">
        <aside className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary text-ploy-text-primary z-30 border-r min-[768px]:flex text-sidebar-foreground max-md:hidden md:max-lg:w-16 md:fixed md:flex-col md:left-0 md:inset-y-0 lg:w-64">
          <div className="border-solid border-ploy-neutral-primary-s3 h-14 flex items-center border-b max-lg:justify-center lg:justify-between lg:px-4">
            <a
              aria-label="PurpleLife, home"
              href="/today"
              className="[color:inherit] flex items-center max-lg:justify-center lg:justify-start"
            >
              <span className="text-ploy-text-primary font-semibold text-sm tracking-[0.45em] uppercase min-[1024px]:inline max-lg:hidden">
                {"PurpleLife"}
              </span>
              <span
                aria-hidden="true"
                className="text-ploy-text-primary font-semibold tracking-[0.45em] uppercase min-[1024px]:hidden max-lg:block lg:hidden"
              >
                {"P"}
              </span>
            </a>
            <button
              type="button"
              aria-label="Collapse sidebar"
              style={{ fontVariationSettings: "inherit" }}
              className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-8 h-8 justify-center items-center transition-colors p-0 rounded-[0.875rem] min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary max-lg:hidden"
              data-ploy-component-type="button"
              data-ploy-component-variant="primary"
            >
              <PageIcon1 />
            </button>
          </div>
          <nav
            aria-label="Primary"
            style={{ scrollbarWidth: "none" }}
            className="overflow-y-auto grow basis-[0%] py-4 hide-scrollbar max-lg:px-2 lg:px-3"
          >
            <a
              aria-label="Today"
              href="/today"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon2 />
              <span className="hidden min-[1024px]:inline">Today</span>
            </a>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-text-primary font-medium text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem]"
                >
                  <PageIcon3 />
                  <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                    {"Data"}
                  </span>
                </a>
                <button
                  type="button"
                  aria-expanded="true"
                  aria-label="Collapse Data"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon4 />
                </button>
              </div>
              <div className="border-solid border-ploy-neutral-primary-s3/60 ml-3 mt-0.5 mb-1.5 pl-3 border-l hidden min-[1024px]:block">
                <a
                  href="/biometrics"
                  className="bg-ploy-neutral-primary-s3 text-ploy-text-primary text-xs flex items-center gap-2 transition-colors mb-0.5 px-3 py-1.5 rounded-2xl"
                >
                  <PageIcon5 />
                  <span className="block">Biometrics</span>
                </a>
                <a
                  href="/hydration"
                  className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2 transition-colors mb-0.5 px-3 py-1.5 rounded-2xl hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon6 />
                  <span className="block">Intake</span>
                </a>
                <a
                  href="/meds"
                  className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2 transition-colors mb-0.5 px-3 py-1.5 rounded-2xl hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon7 />
                  <span className="block">Medications</span>
                </a>
                <a
                  href="/timeline"
                  className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2 transition-colors px-3 py-1.5 rounded-2xl hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon8 />
                  <span className="block">Timeline</span>
                </a>
              </div>
            </div>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon9 />
                  <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                    {"Plan"}
                  </span>
                </a>
                <button
                  type="button"
                  aria-expanded="false"
                  aria-label="Expand Plan"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon10 />
                </button>
              </div>
            </div>
            <a
              aria-label="Ask Maya"
              href="/ask-maya"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon11 />
              <span className="hidden min-[1024px]:inline">Ask Maya</span>
            </a>
            <a
              aria-label="Journal"
              href="/journal"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon12 />
              <span className="hidden min-[1024px]:inline">Journal</span>
            </a>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Care"
                  href="/care"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon13 />
                  <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                    {"Care"}
                  </span>
                </a>
                <button
                  type="button"
                  aria-expanded="false"
                  aria-label="Expand Care"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon10 />
                </button>
              </div>
            </div>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Tools"
                  href="/tools"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon14 />
                  <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                    {"Tools"}
                  </span>
                </a>
                <button
                  type="button"
                  aria-expanded="false"
                  aria-label="Expand Tools"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon10 />
                </button>
              </div>
            </div>
            <div className="overflow-hidden mb-0.5">
              <button
                type="button"
                aria-expanded="false"
                aria-label="Account"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] text-sm w-full flex justify-start items-center gap-3 transition-colors pl-3 pr-1 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary leading-[inherit]"
              >
                <PageIcon15 />
                <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                  {"Account"}
                </span>
                <PageIcon16 />
              </button>
            </div>
            <div className="pt-2 px-1 min-[1024px]:block max-lg:hidden" />
          </nav>
        </aside>
        <header className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/90 sticky z-30 shadow-[0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] border-b top-0 nav-glass-top min-[768px]:hidden">
          <div className="w-full min-h-12 max-w-screen-md flex justify-between items-center mx-auto px-4">
            <a
              aria-label="PurpleLife, home"
              href="/today"
              className="text-ploy-text-primary font-semibold text-xs tracking-[0.45em] uppercase min-w-11 min-h-11 flex items-center transition-none"
            >
              {"PurpleLife"}
            </a>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="Sync wearable data"
                data-state="closed"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-8 h-8 flex justify-center items-center transition-colors p-0 rounded-full hover:bg-ploy-neutral-primary-s3 hover:text-ploy-text-primary"
              >
                <PageIcon17 />
              </button>
              <button
                type="button"
                id="radix-_r_2_"
                aria-expanded="false"
                data-state="closed"
                aria-label="Open account menu"
                style={{ fontVariationSettings: "inherit" }}
                className="[color:inherit] [font-weight:inherit] flex items-center gap-1 transition pl-0.5 pr-2 py-0.5 rounded-full hover:bg-ploy-neutral-primary-s3/60"
              >
                <span
                  aria-hidden="true"
                  className="bg-[rgb(176,132,209)] text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon18 />
              </button>
              <button
                type="button"
                aria-expanded="false"
                data-state="closed"
                aria-label="Open menu"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-11 h-11 min-w-11 min-h-11 flex justify-center items-center cursor-pointer transition-opacity -mr-2 p-0 rounded-[0.875rem] hover:text-ploy-text-primary"
              >
                <PageIcon19 />
              </button>
            </div>
          </div>
        </header>
        <main className="min-h-dvh flex flex-col max-md:pb-[5.5rem] md:max-lg:pl-16 md:pb-0 lg:pl-64">
          <header className="border-solid border-ploy-neutral-primary-s2/60 bg-ploy-background-primary/70 h-14 sticky z-20 justify-between items-center gap-2 backdrop-blur border-b top-0 min-[768px]:flex max-md:hidden max-lg:px-4 lg:px-6">
            <div className="flex items-center" />
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Sync wearable data"
                data-state="closed"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-8 h-8 flex justify-center items-center transition-colors p-0 rounded-full hover:bg-ploy-neutral-primary-s3 hover:text-ploy-text-primary"
              >
                <PageIcon17 />
              </button>
              <button
                type="button"
                id="radix-_r_8_"
                aria-expanded="false"
                data-state="closed"
                aria-label="Open account menu"
                style={{ fontVariationSettings: "inherit" }}
                className="[color:inherit] [font-weight:inherit] flex items-center gap-1 transition pl-0.5 pr-2 py-0.5 rounded-full hover:bg-ploy-neutral-primary-s3/60"
              >
                <span
                  aria-hidden="true"
                  className="bg-[rgb(176,132,209)] text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon18 />
              </button>
            </div>
          </header>
          <div className="grow basis-[0%]">
            <div className="bg-ploy-background-primary text-ploy-text-primary min-h-dvh">
              <div className="max-w-screen-md mx-auto pt-6 pb-32 max-md:px-5 md:px-8">
                <a
                  href="/biometrics"
                  className="text-ploy-text-primary/70 leading-snug text-sm inline-flex items-center gap-1.5 hover:text-ploy-text-primary"
                >
                  <PageIcon20 />
                  {"All signals"}
                </a>
                <div className="mt-5">
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary rounded-[1.75rem] metric-sheet max-md:p-6 md:p-8 border">
                    <h1 className="font-heading text-ploy-text-primary leading-none [font-weight:inherit] capitalize max-md:text-4xl max-md:tracking-tighter max-md:leading-none md:text-5xl md:tracking-[-1.2px] md:leading-none">
                      {"Stress"}
                    </h1>
                    <div className="bg-ploy-accent-secondary-600/20 text-ploy-accent-secondary-500 inline-flex items-center gap-2 mt-5 px-3.5 py-1.5 rounded-full">
                      <span className="bg-ploy-background-accent-secondary w-1.5 h-1.5 block rounded-full" />
                      <span className="leading-snug font-medium text-sm block">
                        {"In range "}
                        <span className="text-ploy-text-primary/70 font-normal ml-1.5">
                          {"70"}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-3 grid-cols-[repeat(2,minmax(0px,1fr))] mt-4">
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-5 py-4 rounded-[1.25rem] metric-card border">
                      <p className="text-ploy-text-primary/60 leading-snug text-sm">
                        {"Latest result"}
                      </p>
                      <p className="leading-tight font-medium text-3xl mt-2">
                        <span className="text-ploy-accent-secondary-500">
                          {"70"}
                        </span>
                      </p>
                    </div>
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-5 py-4 rounded-[1.25rem] metric-card border">
                      <p className="text-ploy-text-primary/60 leading-snug text-sm">
                        {"Optimal range"}
                      </p>
                      <p className="leading-tight font-medium text-3xl mt-2">
                        <span className="text-ploy-accent-secondary-500">
                          {"71"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-3 mt-3">
                    <p className="text-ploy-text-primary/60 leading-snug text-xs">
                      {"Your 30-day baseline · 71"}
                    </p>
                    <div className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2">
                      <span className="leading-tight flex flex-col">
                        <span className="block">
                          {"Last sync about 1 hour ago"}
                        </span>
                        <span className="text-ploy-neutral-inverse-600/70 block">
                          {"Data through Tue Sep 15"}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label="Sync wearables now"
                        style={{ fontVariationSettings: "inherit" }}
                        className="[color:inherit] [font-weight:inherit] w-6 h-6 flex justify-center items-center p-0 rounded-full hover:bg-ploy-neutral-primary-s3"
                      >
                        <PageIcon21 />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-6">
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.6)] text-ploy-text-primary leading-snug font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"Today"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.6)] text-ploy-text-primary leading-snug font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"7d"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-ploy-button-primary-background text-ploy-button-secondary-text leading-snug font-medium text-xs block transition px-3 py-1.5 rounded-full"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"30d"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.6)] text-ploy-text-primary leading-snug font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"90d"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.6)] text-ploy-text-primary leading-snug font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"1y"}
                    </button>
                    <span className="text-ploy-text-primary/60 text-xs block mx-2">
                      {"vs"}
                    </span>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-ploy-button-primary-background text-ploy-button-secondary-text font-medium text-xs block transition px-3 py-1.5 rounded-full leading-[inherit]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"Last month"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.4)] text-ploy-text-primary font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b] leading-[inherit]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"Year ago"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-[oklab(0.231973_0.0151009_-0.0292447_/_0.4)] text-ploy-text-primary font-medium text-xs block transition px-3 py-1.5 rounded-full hover:bg-[#1f1a2b] leading-[inherit]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"None"}
                    </button>
                  </div>
                  <div className="leading-snug text-sm flex flex-wrap items-baseline gap-3 mt-3">
                    <span className="text-ploy-text-primary/60 block">
                      {"Avg this window:" + " "}
                      <span className="text-ploy-text-primary">
                        {" " + "71"}
                      </span>
                    </span>
                    <span className="text-ploy-text-primary/60 block">
                      {"· vs "}
                      <span className="text-ploy-text-primary">71</span>
                    </span>
                    <span className="bg-ploy-neutral-primary-s3 text-ploy-text-primary font-medium text-xs block px-2 py-0.5 rounded-full">
                      {"0.0%"}
                    </span>
                  </div>
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary h-[21.25rem] mt-4 rounded-[1.75rem] metric-sheet max-md:p-4 md:p-6 border">
                    <div className="w-full h-full min-w-0 recharts-responsive-container">
                      <div className="w-full h-full max-w-[40.875rem] max-h-[18.125rem] relative cursor-default recharts-wrapper">
                        <PageShape1 />
                        <div
                          tabIndex={-1}
                          className="pointer-events-none absolute invisible translate-x-9 translate-y-2.5 left-0 top-0 recharts-tooltip-wrapper recharts-tooltip-wrapper-right recharts-tooltip-wrapper-bottom"
                        >
                          <div className="text-nowrap border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary text-xs whitespace-nowrap invisible p-2.5 rounded-xl recharts-default-tooltip border">
                            <p className="text-nowrap invisible recharts-tooltip-label" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-ploy-text-primary/60 text-xs flex flex-wrap items-center gap-3 mt-3">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-[rgb(176,132,209)] w-5 h-2 block rounded-full" />
                      {" Oura"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="bg-emerald-400 w-5 h-2 block rounded-full" />
                      {" Whoop"}
                    </span>
                  </div>
                  <section className="mt-10">
                    <p className="text-ploy-text-primary/60 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                      {"What this means for you"}
                    </p>
                    <p className="font-heading text-ploy-text-primary/80 leading-relaxed text-lg max-w-[36.5625rem] mt-3">
                      {
                        "Oura's daytime stress reading. Brief spikes are normal, the thing to watch is many high-stress hours stacking across the week."
                      }
                    </p>
                    <p className="text-ploy-text-primary/60 leading-snug text-sm mt-3">
                      {
                        "25%+ above your baseline for several days is the signal."
                      }
                    </p>
                  </section>
                  <section className="mt-10">
                    <h2 className="font-heading text-ploy-text-primary leading-snug [font-weight:inherit] text-2xl">
                      {"Ask PurpleLife"}
                    </h2>
                    <ul className="mb-0 pl-0">
                      <li className="mb-3">
                        <button
                          type="button"
                          style={{ fontVariationSettings: "inherit" }}
                          className="border-solid border-ploy-button-secondary-border [color:inherit] bg-[rgb(20,16,28)] [font-weight:inherit] text-left w-full flex items-center gap-3 transition-[background-color] p-4 rounded-full hover:bg-[rgb(31,26,43)] border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span className="bg-[rgba(176,132,209,0.12)] text-[rgb(176,132,209)] w-7 h-7 flex justify-center items-center rounded-full">
                            <PageIcon22 />
                          </span>
                          <span className="text-ploy-text-primary leading-snug text-sm block grow basis-[0%]">
                            {"How has my stress been trending?"}
                          </span>
                          <PageIcon23 />
                        </button>
                      </li>
                      <li className="mb-3">
                        <button
                          type="button"
                          style={{ fontVariationSettings: "inherit" }}
                          className="border-solid border-ploy-button-secondary-border [color:inherit] bg-[rgb(20,16,28)] [font-weight:inherit] text-left w-full flex items-center gap-3 transition-[background-color] p-4 rounded-full hover:bg-[rgb(31,26,43)] border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span className="bg-[rgba(176,132,209,0.12)] text-[rgb(176,132,209)] w-7 h-7 flex justify-center items-center rounded-full">
                            <PageIcon22 />
                          </span>
                          <span className="text-ploy-text-primary leading-snug text-sm block grow basis-[0%]">
                            {"What was happening on days my stress dropped?"}
                          </span>
                          <PageIcon23 />
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          style={{ fontVariationSettings: "inherit" }}
                          className="border-solid border-ploy-button-secondary-border [color:inherit] bg-[rgb(20,16,28)] [font-weight:inherit] text-left w-full flex items-center gap-3 transition-[background-color] p-4 rounded-full hover:bg-[rgb(31,26,43)] border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="primary"
                        >
                          <span className="bg-[rgba(176,132,209,0.12)] text-[rgb(176,132,209)] w-7 h-7 flex justify-center items-center rounded-full">
                            <PageIcon22 />
                          </span>
                          <span className="text-ploy-text-primary leading-snug text-sm block grow basis-[0%]">
                            {
                              "What does the research say about stress and seizures?"
                            }
                          </span>
                          <PageIcon23 />
                        </button>
                      </li>
                    </ul>
                    <p className="text-ploy-text-primary/60 leading-snug text-xs mt-4">
                      {
                        "PurpleLife's answers are not medical advice. Speak to a licensed provider for personal guidance."
                      }
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </main>
        <nav
          aria-label="Primary"
          className="pointer-events-none fixed z-40 pb-2.5 bottom-0 inset-x-0 min-[768px]:hidden"
        >
          <div className="w-full max-w-screen-md pointer-events-auto mx-auto px-4">
            <div className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/90 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_8px_40px_0px_rgba(0,0,0,0.38)] rounded-[1.75rem] nav-glass-bar border">
              <div className="grid items-center grid-cols-[repeat(5,minmax(0px,1fr))]">
                <a
                  aria-label="Today"
                  href="/today"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon24 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-[rgb(176,132,209)] text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] nav-glass-tab-active"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon25 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-[rgb(176,132,209)] text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon26 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon27 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon28 />
                  </span>
                  <span className="font-medium block nav-tab-label">
                    {"Ask Maya"}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </nav>
        <a
          aria-label="Ask Maya"
          href="/ask-maya"
          className="bg-ploy-background-inverse text-ploy-text-inverse w-14 h-14 fixed z-40 flex justify-center items-center shadow-[0px_10px_15px_-3px_oklab(0.985621_0.000790089_-0.00252056_/_0.4),0px_4px_6px_-4px_oklab(0.985621_0.000790089_-0.00252056_/_0.4)] transition rounded-full hover:bg-ploy-background-inverse/90 max-md:right-5 max-md:bottom-28 md:right-6 md:bottom-6"
        >
          <PageIcon29 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
      <span
        id="recharts_measurement_span"
        aria-hidden="true"
        className="text-nowrap text-xs whitespace-pre absolute top-[-1250rem] block left-0"
      >
        {"70"}
      </span>
    </>
  );
}
