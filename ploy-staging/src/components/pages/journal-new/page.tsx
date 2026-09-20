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
import PageIcon27 from "./svgs/page-icon-27";

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
            <div className="bg-ploy-background-primary text-ploy-text-primary min-h-screen">
              <header className="border-solid border-ploy-neutral-primary-s2/60 bg-ploy-background-primary/80 sticky z-20 backdrop-blur border-b top-0">
                <div className="max-w-screen-md flex justify-between items-center mx-auto py-3 max-md:px-4 md:px-6">
                  <button
                    type="button"
                    aria-label="Close"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-ploy-text-primary/80 [font-weight:inherit] w-10 h-10 flex justify-center items-center p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60"
                  >
                    <PageIcon15 />
                  </button>
                  <h1 className="text-ploy-text-primary font-medium text-sm">
                    {"New entry"}
                  </h1>
                  <button
                    disabled={true}
                    style={{ fontVariationSettings: "inherit" }}
                    className="pointer-events-none text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm opacity-50 cursor-not-allowed transition-colors px-5 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
                  >
                    {"Save"}
                  </button>
                </div>
              </header>
              <main className="max-w-screen-md mx-auto pb-6 max-md:pt-5 max-md:px-4 md:pt-8 md:px-6">
                <div className="mb-5">
                  <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.14em] uppercase mb-2">
                    {"When did this happen?"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-expanded="false"
                      data-state="closed"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug text-sm whitespace-nowrap h-9 flex justify-start items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-ploy-background-accent-secondary hover:text-ploy-text-inverse border"
                    >
                      <PageIcon16 />
                      {"Tue, Sep 15, 2026"}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <PageIcon17 />
                      <div
                        aria-label="Time"
                        className="flex items-center gap-1"
                      >
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          aria-label="Hour"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-primary-border [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-16 h-9 flex justify-between items-center shadow-sm cursor-pointer p-2 rounded-[0.875rem] border-input border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"10"}
                          </span>{" "}
                          <PageIcon18 />
                        </button>
                        <span className="text-ploy-neutral-inverse-600 block">
                          {":"}
                        </span>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          aria-label="Minute"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-primary-border [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-[4.25rem] h-9 flex justify-between items-center shadow-sm cursor-pointer p-2 rounded-[0.875rem] border-input border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"59"}
                          </span>{" "}
                          <PageIcon18 />
                        </button>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded="false"
                          data-state="closed"
                          aria-label="AM or PM"
                          style={{ fontVariationSettings: "inherit" }}
                          className="text-nowrap border-solid border-ploy-button-primary-border [color:inherit] leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-[4.25rem] h-9 flex justify-between items-center shadow-sm cursor-pointer p-2 rounded-[0.875rem] border-input border"
                          data-ploy-component-type="button"
                          data-ploy-component-variant="outline"
                        >
                          <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                            {"PM"}
                          </span>{" "}
                          <PageIcon18 />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap text-ploy-neutral-inverse-600 leading-snug font-medium text-xs whitespace-nowrap h-9 flex justify-center items-center gap-2 cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-accent-secondary hover:text-ploy-text-inverse"
                    >
                      {"Now"}
                    </button>
                  </div>
                </div>
                <div className="border-solid border-ploy-neutral-primary-s3/60 bg-ploy-background-secondary mb-5 rounded-3xl max-md:p-5 md:p-6 border">
                  <textarea
                    placeholder="What is happening, or what just happened?"
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="leading-normal text-lg whitespace-pre-wrap break-words w-full flex shadow-[0px_0px_0px_0px_rgb(176,132,209)] cursor-text py-2 rounded-[0.875rem] border-input max-md:min-h-[12.5rem] md:min-h-[16.25rem]"
                  />
                </div>
                <div className="border-solid border-ploy-neutral-primary-s3/60 bg-ploy-background-secondary mb-5 rounded-3xl max-md:p-4 md:p-5 border">
                  <p className="text-ploy-neutral-inverse-600 text-xs tracking-[0.14em] uppercase mb-3">
                    {"Add to this entry"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-label="Start recording"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-ploy-button-secondary-text leading-snug font-medium text-sm h-11 relative flex items-center gap-2 shadow-[0px_1px_3px_0px_oklab(0.684385_0.0764743_-0.0919314_/_0.3),0px_1px_2px_-1px_oklab(0.684385_0.0764743_-0.0919314_/_0.3)] transition-transform px-4 py-0 rounded-full bg-ploy-button-primary-background"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      <PageIcon19 />
                      <span className="relative block">Record</span>
                    </button>
                    <button
                      type="button"
                      aria-label="Photo"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-primary-s3/60 text-ploy-text-primary/70 [font-weight:inherit] w-11 h-11 flex justify-center items-center transition p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary border"
                    >
                      <PageIcon20 />
                    </button>
                    <button
                      type="button"
                      aria-label="Gallery"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-primary-s3/60 text-ploy-text-primary/70 [font-weight:inherit] w-11 h-11 flex justify-center items-center transition p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary border"
                    >
                      <PageIcon21 />
                    </button>
                    <button
                      type="button"
                      aria-label="Video"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-primary-s3/60 text-ploy-text-primary/70 [font-weight:inherit] w-11 h-11 flex justify-center items-center transition p-0 rounded-full hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary border"
                    >
                      <PageIcon22 />
                    </button>
                  </div>
                </div>
                <input
                  type="file"
                  className="appearance-none text-nowrap items-baseline mb-5 p-0 hidden overflow-clip"
                />
                <input
                  multiple
                  type="file"
                  className="appearance-none text-nowrap items-baseline mb-5 p-0 hidden overflow-clip"
                />
                <input
                  type="file"
                  className="appearance-none text-nowrap items-baseline p-0 hidden overflow-clip"
                />
              </main>
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
                    <PageIcon23 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon24 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-ploy-background-accent-secondary text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon25 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon26 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon27 />
                  </span>
                  <span className="font-medium block nav-tab-label">
                    {"Ask Maya"}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </nav>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
