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
import PageIcon22 from "./svgs/page-icon-22";
import PageIcon23 from "./svgs/page-icon-23";
import PageIcon24 from "./svgs/page-icon-24";
import PageIcon25 from "./svgs/page-icon-25";
import PageIcon26 from "./svgs/page-icon-26";

export default function Page() {
  return (
    <>
      <HeroSection />
      <div className="font-heading bg-ploy-background-primary text-ploy-text-primary min-h-dvh">
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
              className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-8 h-8 justify-center items-center transition-colors p-0 rounded-[0.875rem] min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-button-secondary-text max-lg:hidden"
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
              className="bg-ploy-neutral-primary-s3 text-ploy-text-primary font-medium text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group"
            >
              <PageIcon2 />
              <span className="hidden min-[1024px]:inline">Today</span>
            </a>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon3 />
                  <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                    {"Data"}
                  </span>
                </a>
                <button
                  type="button"
                  aria-expanded="false"
                  aria-label="Expand Data"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon4 />
                </button>
              </div>
            </div>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon5 />
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
                  <PageIcon4 />
                </button>
              </div>
            </div>
            <a
              aria-label="Ask Maya"
              href="/ask-maya"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon6 />
              <span className="hidden min-[1024px]:inline">Ask Maya</span>
            </a>
            <a
              aria-label="Journal"
              href="/journal"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon7 />
              <span className="hidden min-[1024px]:inline">Journal</span>
            </a>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Care"
                  href="/care"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon8 />
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
                  <PageIcon4 />
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
                  <PageIcon9 />
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
                  <PageIcon4 />
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
                <PageIcon10 />
                <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                  {"Account"}
                </span>
                <PageIcon11 />
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
                <PageIcon12 />
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
                  className="bg-ploy-background-accent-secondary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon13 />
              </button>
              <button
                type="button"
                aria-expanded="false"
                data-state="closed"
                aria-label="Open menu"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-11 h-11 min-w-11 min-h-11 flex justify-center items-center cursor-pointer transition-opacity -mr-2 p-0 rounded-[0.875rem] hover:text-ploy-text-primary"
              >
                <PageIcon14 />
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
                <PageIcon12 />
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
                  className="bg-ploy-background-accent-secondary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon13 />
              </button>
            </div>
          </header>
          <div className="grow basis-[0%]">
            <div
              style={{
                backgroundImage:
                  "radial-gradient(90% 55% at 50% -10%, rgba(176, 132, 209, 0.14), rgba(0, 0, 0, 0) 58%)",
              }}
              className="bg-ploy-background-primary w-full min-h-full max-w-2xl mx-auto pb-16 max-md:pt-10 max-md:px-5 md:pt-16 md:px-8 text-ploy-text-primary"
            >
              <div className="mb-6" />
              <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-[0.08em] uppercase">
                {"Tuesday, September 15"}
              </p>
              <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-6 today-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
                <span>Good evening</span>
                {"."}
              </h1>
              <p className="text-ploy-text-primary/60 leading-normal text-base max-w-[37.5rem] mt-4">
                {"Anything you want to remember tomorrow"}
              </p>
              <section className="mt-8">
                <div className="flex justify-between items-center gap-2 mb-4">
                  <span className="text-ploy-text-primary leading-snug font-semibold text-sm tracking-tight block tabular-nums">
                    {"Sep 15"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Pick a date"
                      aria-expanded="false"
                      data-state="closed"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/60 text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 flex justify-center items-center shadow-[0px_1px_2px_0px_color-mix(in_srgb,var(--ploy-neutral-primary)_3%,transparent)] transition-colors p-0 rounded-full hover:text-ploy-text-primary border"
                    >
                      <PageIcon15 />
                    </button>
                  </div>
                </div>
                <div
                  role="listbox"
                  aria-label="Select a date"
                  style={{ scrollbarWidth: "none" }}
                  className="overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden max-md:-mx-5 max-md:px-5 md:-mx-8 md:px-8"
                >
                  <div className="w-max flex gap-2 max-md:px-[10.5313rem] md:px-[19rem]">
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Tue"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"8"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Wed"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"9"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Thu"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"10"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Fri"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"11"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Sat"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"12"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Sun"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"13"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] ease-in-out p-0 rounded-[1.125rem] hover:text-ploy-text-primary hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Mon"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"14"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-text-primary [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_0px_0px_1px_oklab(0.985621_0.000790089_-0.00252056_/_0.4),0px_0px_24px_0px_rgba(176,132,209,0.15)] ease-in-out p-0 rounded-[1.125rem] glass-card max-md:w-14 md:w-16 border"
                    >
                      <span className="text-ploy-text-primary font-semibold text-xs tracking-[0.12em] uppercase block">
                        {"Today"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-xl block tabular-nums"
                      >
                        {"15"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Wed"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"16"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Thu"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"17"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Fri"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"18"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Sat"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"19"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Sun"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"20"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Mon"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"21"}
                      </span>
                    </button>
                    <button
                      type="button"
                      role="option"
                      disabled={true}
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid bg-ploy-background-primary/80 text-ploy-neutral-inverse-600 [font-weight:inherit] h-[4.5rem] flex flex-col shrink-0 justify-center items-center gap-1 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] opacity-30 ease-in-out p-0 rounded-[1.125rem] border-transparent max-md:w-14 md:w-16 border"
                    >
                      <span className="text-xs tracking-[0.12em] uppercase block">
                        {"Tue"}
                      </span>
                      <span
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="leading-snug text-xl block tabular-nums"
                      >
                        {"22"}
                      </span>
                    </button>
                  </div>
                </div>
              </section>
              <section className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 grid items-stretch gap-2 grid-cols-[repeat(3,minmax(0px,1fr))] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] rounded-[1.25rem] max-md:mt-12 max-md:p-2 md:mt-16 md:p-3 border">
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="[color:inherit] [font-weight:inherit] text-center w-full flex flex-col justify-center items-center opacity-70 transition-[transform,translate,scale,rotate,opacity,box-shadow] px-0 py-4 rounded-[1.125rem] hover:bg-ploy-background-inverse/3 hover:opacity-100"
                >
                  <span className="text-ploy-text-primary leading-none font-light tracking-[-0.02em] block max-md:text-4xl max-md:leading-none md:text-[2.75rem]">
                    <span aria-label="78">78</span>
                  </span>
                  <span className="text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-widest uppercase block mt-2 label-eyebrow">
                    {"Readiness"}
                  </span>
                </button>
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="scale-102 border-solid border-ploy-neutral-inverse-s0/10 [color:inherit] bg-ploy-background-primary/80 [font-weight:inherit] text-center w-full flex flex-col justify-center items-center shadow-[0px_0px_0px_1px_oklab(0.985621_0.000790089_-0.00252056_/_0.35),0px_0px_28px_0px_rgba(176,132,209,0.12)] transition-[transform,translate,scale,rotate,opacity,box-shadow] px-0 rounded-[1.125rem] glass-card max-md:py-5 md:py-6 border"
                >
                  <span className="text-ploy-text-primary leading-none font-light tracking-[-0.02em] block max-md:text-[3.5rem] md:text-7xl md:leading-none">
                    <span aria-label="70">70</span>
                  </span>
                  <span className="text-ploy-text-primary/80 leading-none font-semibold text-xs tracking-widest uppercase block mt-2 label-eyebrow">
                    {"Sleep"}
                  </span>
                </button>
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="[color:inherit] [font-weight:inherit] text-center w-full flex flex-col justify-center items-center opacity-70 transition-[transform,translate,scale,rotate,opacity,box-shadow] px-0 py-4 rounded-[1.125rem] hover:bg-ploy-background-inverse/3 hover:opacity-100"
                >
                  <span className="text-ploy-text-primary leading-none font-light tracking-[-0.02em] block max-md:text-4xl max-md:leading-none md:text-[2.75rem]">
                    {"–"}
                  </span>
                  <span className="text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-widest uppercase block mt-2 label-eyebrow">
                    {"Activity"}
                  </span>
                </button>
              </section>
              <section className="max-md:mt-12 md:mt-16">
                <div className="flex justify-between items-center gap-3 mb-3">
                  <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                    {"Your signals"}
                  </p>
                  <a
                    href="/biometrics"
                    className="text-ploy-neutral-inverse-600 leading-snug text-xs flex items-center hover:text-ploy-text-primary"
                  >
                    {"View all"}
                    <PageIcon16 />
                  </a>
                </div>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(3,minmax(0px,1fr))]">
                  <a
                    href="/biometrics/readiness"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"Readiness"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"78"}
                      </p>
                    </div>
                  </a>
                  <a
                    href="/biometrics/sleep_score"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"Sleep"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"70"}
                      </p>
                    </div>
                  </a>
                  <a
                    href="/biometrics/hrv"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"HRV"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"31.559273 "}
                        <span className="text-ploy-neutral-inverse-600 leading-snug text-sm ml-1">
                          {"ms"}
                        </span>
                      </p>
                    </div>
                  </a>
                  <a
                    href="/biometrics/resting_hr"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"Resting HR"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"65 "}
                        <span className="text-ploy-neutral-inverse-600 leading-snug text-sm ml-1">
                          {"bpm"}
                        </span>
                      </p>
                    </div>
                  </a>
                  <a
                    href="/biometrics/spo2"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"SpO2"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"96.102 "}
                        <span className="text-ploy-neutral-inverse-600 leading-snug text-sm ml-1">
                          {"%"}
                        </span>
                      </p>
                    </div>
                  </a>
                  <a
                    href="/biometrics/stress"
                    className="[color:inherit] block transition-opacity hover:opacity-90"
                  >
                    <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary px-4 py-3.5 rounded-3xl border">
                      <p className="text-nowrap text-ploy-neutral-inverse-600 text-xs tracking-[0.12em] uppercase whitespace-nowrap overflow-hidden">
                        {"Stress"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-snug text-2xl mt-1 tabular-nums"
                      >
                        {"70"}
                      </p>
                    </div>
                  </a>
                </div>
              </section>
              <section className="grid gap-3 grid-cols-[repeat(2,minmax(0px,1fr))] mt-10 mb-6">
                <a
                  href="/journal"
                  className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-text-primary h-20 flex flex-col justify-center items-center gap-2 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition rounded-[1.125rem] glass-card border"
                >
                  <PageIcon17 />
                  <span className="font-semibold text-sm block">Journal</span>
                </a>
                <a
                  href="/meds"
                  className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-ploy-text-primary h-20 flex flex-col justify-center items-center gap-2 shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent)] transition rounded-[1.125rem] glass-card border"
                >
                  <PageIcon18 />
                  <span className="font-semibold text-sm block">Meds</span>
                </a>
              </section>
              <div className="bg-ploy-background-secondary shadow-[0px_0px_0px_1px_rgb(37,32,47)] mb-3 p-4 rounded-3xl">
                <div className="flex justify-between items-center gap-3 mb-3">
                  <div className="leading-snug text-sm flex items-center gap-2">
                    <PageIcon19 />
                    <span className="font-medium block">Today’s doses</span>
                  </div>
                  <div className="text-ploy-neutral-inverse-600 leading-snug text-xs tabular-nums">
                    {"Nothing scheduled"}
                  </div>
                </div>
                <div className="h-14 relative">
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 h-px absolute top-2/4 inset-x-0" />
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 w-px h-2 absolute left-[0%] top-2/4" />
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 w-px h-2 absolute left-1/4 top-2/4" />
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 w-px h-2 absolute left-2/4 top-2/4" />
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 w-px h-2 absolute left-3/4 top-2/4" />
                  <div className="-translate-y-1/2 bg-ploy-neutral-primary-s3 w-px h-2 absolute left-full top-2/4" />
                  <div
                    aria-hidden="true"
                    className="bg-ploy-background-inverse/40 w-px absolute left-[99.3627%] inset-y-0"
                  />
                </div>
                <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between items-center mt-2 tabular-nums">
                  <span className="block">12a</span>
                  <span className="block">6a</span>
                  <span className="block">12p</span>
                  <span className="block">6p</span>
                  <span className="block">12a</span>
                </div>
              </div>
              <section className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary mt-8 rounded-3xl max-md:p-5 md:p-6 border">
                <div className="flex justify-between items-center">
                  <h2
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl"
                  >
                    {"Today"}
                  </h2>
                  <a
                    href="/meds"
                    className="text-ploy-neutral-inverse-600 leading-snug text-xs flex items-center gap-0.5 hover:text-ploy-text-primary"
                  >
                    {"Medications"}
                    <PageIcon16 />
                  </a>
                </div>
                <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-4">
                  {"Loading…"}
                </p>
              </section>
              <div className="mt-10">
                <button
                  type="button"
                  aria-expanded="false"
                  style={{ fontVariationSettings: "inherit" }}
                  className="border-solid border-ploy-button-primary-border/10 text-ploy-button-secondary-text bg-ploy-button-secondary-background/80 [font-weight:inherit] w-full flex justify-between items-center shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] transition px-5 py-4 rounded-[1.25rem] hover:shadow-[0_0_#0000,0_0_#0000,0_0_#0000,var(--tw-ring-inset,)_0_0_0_calc(1px_+_0px)_initial,0_0_#0000] border"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="secondary"
                >
                  <span className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase block label-eyebrow">
                    {"More for today"}
                  </span>
                  <PageIcon20 />
                </button>
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
                  className="text-ploy-accent-secondary-500 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] nav-glass-tab-active"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon21 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon22 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-ploy-background-accent-secondary text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon23 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon24 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon25 />
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
          <PageIcon26 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
