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
import PageIcon28 from "./svgs/page-icon-28";

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
                  className="bg-[rgb(176,132,209)] text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
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
                  className="bg-[rgb(176,132,209)] text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon13 />
              </button>
            </div>
          </header>
          <div className="grow basis-[0%]">
            <div className="max-w-screen-md mx-auto pb-32 max-md:pt-10 max-md:px-5 md:max-lg:pt-16 md:max-lg:px-10 lg:pt-20 lg:px-16">
              <div className="flex justify-between items-start gap-4 mb-10">
                <div>
                  <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                    {"Capture"}
                  </p>
                  <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-3 app-hero-title max-md:text-3xl max-md:leading-none md:text-[2.5rem]">
                    {"Log a seizure."}
                  </h1>
                </div>
                <button
                  aria-label="Close"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-nowrap [color:inherit] leading-snug font-medium text-sm whitespace-nowrap w-9 h-9 flex shrink-0 justify-center items-center gap-2 cursor-pointer transition-colors mt-2 p-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-text-inverse"
                >
                  <PageIcon15 />
                </button>
              </div>
              <button
                type="button"
                style={{ fontVariationSettings: "inherit" }}
                className="bg-ploy-background-accent-primary text-ploy-button-secondary-text leading-normal font-semibold text-lg w-full flex justify-center items-center gap-3 shadow-[0px_10px_15px_-3px_oklab(0.688777_0.124891_0.0812306_/_0.25),0px_4px_6px_-4px_oklab(0.688777_0.124891_0.0812306_/_0.25)] transition p-6 rounded-3xl hover:bg-ploy-background-accent-primary/90"
                data-ploy-component-type="button"
                data-ploy-component-variant="primary"
              >
                <PageIcon16 />
                {"Log right now, fill details later"}
              </button>
              <h2
                style={{
                  fontFamily:
                    "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                }}
                className="text-ploy-text-primary leading-snug [font-weight:inherit] text-xl mt-10 mb-4"
              >
                {"Or add details"}
              </h2>
              <div>
                <div className="mb-6">
                  <label className="leading-none font-medium text-sm mb-2">
                    {"When did it happen?"}
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      type="button"
                      aria-expanded="false"
                      data-state="closed"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug text-sm whitespace-nowrap h-9 flex justify-start items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                    >
                      <PageIcon17 />
                      {"Tue, Sep 15, 2026"}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <PageIcon18 />
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
                            {"11"}
                          </span>{" "}
                          <PageIcon19 />
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
                            {"05"}
                          </span>{" "}
                          <PageIcon19 />
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
                          <PageIcon19 />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap text-ploy-neutral-inverse-600 leading-snug font-medium text-xs whitespace-nowrap h-9 flex justify-center items-center gap-2 cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-text-inverse"
                    >
                      {"Now"}
                    </button>
                  </div>
                  <p className="text-ploy-neutral-inverse-600 leading-snug text-xs">
                    {"Defaults to now. Change it to log a past seizure."}
                  </p>
                </div>
                <div className="mb-6">
                  <label className="leading-none font-medium text-sm mb-2">
                    {"Type"}
                  </label>
                  <button
                    type="button"
                    role="combobox"
                    aria-expanded="false"
                    data-state="closed"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-button-primary-border text-ploy-neutral-inverse-600 leading-snug [font-weight:inherit] text-sm whitespace-nowrap w-full h-9 flex justify-between items-center shadow-sm cursor-pointer px-3 py-2 rounded-[0.875rem] border-input border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="outline"
                  >
                    <span className="pointer-events-none text-nowrap line-clamp-[1] overflow-hidden">
                      {"Select type (optional)"}
                    </span>{" "}
                    <PageIcon19 />
                  </button>
                </div>
                <div className="border-solid border-ploy-neutral-primary-s3 mb-6 p-4 rounded-[1.25rem] border">
                  <div className="flex justify-between items-center">
                    <label className="leading-none font-medium text-sm block">
                      {"Witnessed"}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      data-state="unchecked"
                      value="on"
                      id="witnessed"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      <span
                        data-state="unchecked"
                        className="pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
                      />
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="leading-none font-medium text-sm block">
                      {"Duration"}
                    </label>
                    <span className="text-ploy-neutral-inverse-600 leading-snug text-sm block tabular-nums">
                      {"–"}
                    </span>
                  </div>
                  <span
                    data-orientation="horizontal"
                    className="w-full relative flex items-center select-none"
                  >
                    <span
                      data-orientation="horizontal"
                      className="bg-ploy-background-inverse/20 w-full h-1.5 relative block grow rounded-full overflow-hidden"
                    >
                      <span
                        data-orientation="horizontal"
                        className="bg-ploy-background-inverse h-full absolute block left-[0%] right-full text-ploy-text-inverse"
                      />
                    </span>
                    <span className="absolute block left-[calc(0%_+_8px)]">
                      <span
                        role="slider"
                        data-orientation="horizontal"
                        tabIndex={0}
                        className="border-solid border-ploy-neutral-inverse-600/50 bg-ploy-background-primary w-4 h-4 block shadow-sm transition-colors rounded-full border text-ploy-text-primary"
                      />
                    </span>
                  </span>
                </div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="leading-none font-medium text-sm block">
                      {"Severity"}
                    </label>
                    <span className="text-ploy-neutral-inverse-600 leading-snug text-sm block tabular-nums">
                      {"5 / 10"}
                    </span>
                  </div>
                  <span
                    data-orientation="horizontal"
                    className="w-full relative flex items-center select-none"
                  >
                    <span
                      data-orientation="horizontal"
                      className="bg-ploy-background-inverse/20 w-full h-1.5 relative block grow rounded-full overflow-hidden"
                    >
                      <span
                        data-orientation="horizontal"
                        className="bg-ploy-background-inverse h-full absolute block left-[0%] right-[55.5556%] text-ploy-text-inverse"
                      />
                    </span>
                    <span className="absolute block left-[calc(44.4444%_+_0.888889px)]">
                      <span
                        role="slider"
                        data-orientation="horizontal"
                        tabIndex={0}
                        className="border-solid border-ploy-neutral-inverse-600/50 bg-ploy-background-primary w-4 h-4 block shadow-sm transition-colors rounded-full border text-ploy-text-primary"
                      />
                    </span>
                  </span>
                </div>
                <div className="border-solid border-ploy-neutral-primary-s3 mb-6 p-4 rounded-[1.25rem] border">
                  <div className="flex justify-between items-center">
                    <label className="leading-none font-medium text-sm block">
                      {"Injury"}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      data-state="unchecked"
                      value="on"
                      id="injury"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      <span
                        data-state="unchecked"
                        className="pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
                      />
                    </button>
                  </div>
                </div>
                <div className="border-solid border-ploy-neutral-primary-s3 mb-6 p-4 rounded-[1.25rem] border">
                  <div className="flex justify-between items-center">
                    <label className="leading-none font-medium text-sm block">
                      {"Rescue medication used"}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      data-state="unchecked"
                      value="on"
                      id="rescue"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid text-ploy-button-secondary-text bg-ploy-button-secondary-background [font-weight:inherit] w-9 h-5 flex shrink-0 items-center shadow-sm cursor-pointer transition-colors p-0 rounded-full border-2 peer data-[state=unchecked]:bg-input border-transparent"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="secondary"
                    >
                      <span
                        data-state="unchecked"
                        className="pointer-events-none [translate:0px] bg-ploy-background-primary w-4 h-4 block shadow-[0px_0px_0px_0px_color-mix(in_srgb,var(--ploy-neutral-inverse)_100%,transparent),0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-transform rounded-full text-ploy-text-primary"
                      />
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="leading-none font-medium text-sm mb-2">
                    {"Notes"}
                  </label>
                  <textarea
                    placeholder="Anything else worth remembering…"
                    rows={4}
                    className="border-solid border-ploy-neutral-primary-s3 whitespace-pre-wrap break-words w-full min-h-[3.75rem] flex shadow-sm cursor-text px-3 py-2 rounded-[0.875rem] border-input border"
                  />
                </div>
                <div className="mb-6">
                  <label className="leading-none font-medium text-sm mb-3">
                    {"Photos & video"}
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                    >
                      <PageIcon20 />
                      {"Camera"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                    >
                      <PageIcon21 />
                      {"Photo"}
                    </button>
                    <button
                      type="button"
                      style={{ fontVariationSettings: "inherit" }}
                      className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                    >
                      <PageIcon22 />
                      {"Video"}
                    </button>
                  </div>
                  <input
                    type="file"
                    className="appearance-none text-nowrap items-baseline mb-3 p-0 hidden overflow-clip"
                  />
                  <input
                    multiple
                    type="file"
                    className="appearance-none text-nowrap items-baseline mb-3 p-0 hidden overflow-clip"
                  />
                  <input
                    type="file"
                    className="appearance-none text-nowrap items-baseline p-0 hidden overflow-clip"
                  />
                </div>
                <div>
                  <label className="leading-none font-medium text-sm mb-2">
                    {"Location"}
                  </label>{" "}
                  <button
                    type="button"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-sm whitespace-nowrap w-full h-9 inline-flex justify-start items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                  >
                    <PageIcon23 />
                    {"Capture my location"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 mt-10">
                <button
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-nowrap [color:inherit] leading-snug font-medium text-sm whitespace-nowrap h-9 flex grow basis-[0%] justify-center items-center gap-2 cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-text-inverse"
                >
                  {"Cancel"}
                </button>
                <button
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-nowrap bg-ploy-background-inverse text-ploy-text-inverse leading-snug font-medium text-sm whitespace-nowrap h-9 flex grow basis-[0%] justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-4 py-2 rounded-[0.875rem] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-background-inverse/90"
                >
                  {"Save event"}
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
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
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
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
