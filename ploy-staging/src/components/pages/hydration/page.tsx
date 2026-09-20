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
import PageIcon29 from "./svgs/page-icon-29";
import PageIcon30 from "./svgs/page-icon-30";
import PageIcon31 from "./svgs/page-icon-31";
import PageIcon32 from "./svgs/page-icon-32";
import PageIcon33 from "./svgs/page-icon-33";
import PageIcon34 from "./svgs/page-icon-34";
import PageIcon35 from "./svgs/page-icon-35";
import PageIcon36 from "./svgs/page-icon-36";
import PageIcon37 from "./svgs/page-icon-37";

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
                  className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2 transition-colors mb-0.5 px-3 py-1.5 rounded-2xl hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon5 />
                  <span className="block">Biometrics</span>
                </a>
                <a
                  href="/hydration"
                  className="bg-ploy-neutral-primary-s3 text-ploy-text-primary text-xs flex items-center gap-2 transition-colors mb-0.5 px-3 py-1.5 rounded-2xl"
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
            <div className="max-w-screen-md mx-auto pb-32 max-md:pt-8 max-md:px-5 md:max-lg:px-10 md:pt-12 lg:px-16">
              <a
                href="/today"
                className="text-ploy-neutral-inverse-600 leading-snug text-sm inline-flex items-center gap-1.5 hover:text-ploy-text-primary"
              >
                <PageIcon20 />
                {"Back"}
              </a>
              <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase mt-8 label-eyebrow">
                {"Intake"}
              </p>
              <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-2 app-hero-title max-md:text-3xl max-md:leading-none md:text-4xl md:leading-none">
                {"What you took in"}
                <br />
                {"today."}
              </h1>
              <p className="text-ploy-neutral-inverse-600 leading-snug text-sm max-w-lg mt-3">
                {
                  "Water, drinks, and food in one place. Tap to add, or snap a photo and let AI suggest the details."
                }
              </p>
              <div className="bg-ploy-background-secondary leading-snug text-xs inline-flex shadow-[0px_0px_0px_1px_rgb(37,32,47)] mt-8 p-1 rounded-full">
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="bg-ploy-button-primary-background text-ploy-button-primary-text [font-weight:inherit] capitalize block transition-colors px-3 py-1.5 rounded-full"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  {"day"}
                </button>
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] capitalize block transition-colors px-3 py-1.5 rounded-full hover:text-ploy-text-primary"
                >
                  {"week"}
                </button>
                <button
                  type="button"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] capitalize block transition-colors px-3 py-1.5 rounded-full hover:text-ploy-text-primary"
                >
                  {"month"}
                </button>
              </div>
              <div className="bg-ploy-background-secondary flex justify-between items-center shadow-[0px_0px_0px_1px_rgb(37,32,47)] mt-4 px-2 py-1.5 rounded-full">
                <button
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-nowrap [color:inherit] leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-text-inverse"
                >
                  <PageIcon21 />
                </button>
                <span className="leading-snug font-medium text-sm block tabular-nums">
                  {"Today"}
                </span>
                <button
                  disabled={true}
                  style={{ fontVariationSettings: "inherit" }}
                  className="pointer-events-none text-nowrap [color:inherit] leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 opacity-50 cursor-not-allowed transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-[#b084d1] hover:text-ploy-text-inverse"
                >
                  <PageIcon22 />
                </button>
              </div>
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80"
                  >
                    <PageIcon23 />
                    {"250 ml"}
                  </button>
                  <button
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap bg-ploy-neutral-primary-s3 text-ploy-text-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-ploy-neutral-primary-s3/80"
                  >
                    <PageIcon23 />
                    {"500 ml"}
                  </button>
                  <button
                    type="button"
                    aria-expanded="false"
                    data-state="closed"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                  >
                    <PageIcon24 />
                    {"Water"}
                  </button>
                  <button
                    type="button"
                    aria-expanded="false"
                    data-state="closed"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                  >
                    <PageIcon25 />
                    {"Electrolytes"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-expanded="false"
                    data-state="closed"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                  >
                    <PageIcon26 />
                    {"Snap food or drink"}
                  </button>
                  <button
                    type="button"
                    aria-expanded="false"
                    data-state="closed"
                    style={{ fontVariationSettings: "inherit" }}
                    className="text-nowrap border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug font-medium text-xs whitespace-nowrap h-8 flex justify-center items-center gap-2 shadow-sm cursor-pointer transition-colors px-3 py-0 rounded-full [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border-input hover:bg-[#b084d1] hover:text-ploy-text-inverse border"
                  >
                    <PageIcon27 />
                    {"Voice"}
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <div className="bg-ploy-background-secondary shadow-[0px_0px_0px_1px_rgb(37,32,47)] p-5 rounded-3xl">
                  <div className="flex flex-wrap justify-between items-end gap-3">
                    <div>
                      <p className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-wide uppercase">
                        {"Total today"}
                      </p>
                      <p
                        style={{
                          fontFamily:
                            "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                        }}
                        className="text-ploy-text-primary leading-none text-4xl mt-1"
                      >
                        {"0.00" + " "}
                        <span className="text-ploy-neutral-inverse-600 leading-normal text-lg">
                          {" " + "L"}
                        </span>
                      </p>
                      <p className="text-ploy-neutral-inverse-600 leading-snug text-xs mt-1">
                        {"Goal 2.0 L · 0%"}
                      </p>
                    </div>
                    <div className="text-center grid gap-3 grid-cols-[repeat(3,minmax(0px,1fr))]">
                      <div>
                        <p className="text-blue-400 text-xs tracking-wide uppercase flex justify-center items-center gap-1">
                          <PageIcon28 />
                          {"Water"}
                        </p>
                        <p className="leading-snug font-semibold text-sm mt-0.5 tabular-nums">
                          {"0 ml"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[rgb(176,132,209)] text-xs tracking-wide uppercase flex justify-center items-center gap-1">
                          <PageIcon29 />
                          {"Electrolytes"}
                        </p>
                        <p className="leading-snug font-semibold text-sm mt-0.5 tabular-nums">
                          {"0 ml"}
                        </p>
                      </div>
                      <div>
                        <p className="text-amber-400 text-xs tracking-wide uppercase flex justify-center items-center gap-1">
                          <PageIcon30 />
                          {"Sodium"}
                        </p>
                        <p className="leading-snug font-semibold text-sm mt-0.5 tabular-nums">
                          {"0 mg"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-ploy-neutral-primary-s3 h-2 mt-4 rounded-full overflow-hidden">
                    <div className="bg-[rgb(176,132,209)] w-[0%] h-full ease-in-out" />
                  </div>
                  <div className="mt-6">
                    <p className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-wide uppercase mb-2">
                      {"By hour"}
                    </p>
                    <div className="w-full h-24 flex items-end gap-0.5">
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                      <div className="h-24 relative flex flex-col grow basis-[0%] justify-end group">
                        <div className="bg-ploy-neutral-primary-s3/40 w-full h-0.5 flex flex-col-reverse rounded-xl overflow-hidden" />
                      </div>
                    </div>
                    <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between mt-1 tabular-nums">
                      <span className="block">0</span>
                      <span className="block">6</span>
                      <span className="block">12</span>
                      <span className="block">18</span>
                      <span className="block">23</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-wide uppercase mb-2">
                      {"Exact times"}
                    </p>
                    <div className="bg-ploy-neutral-primary-s3/40 h-12 relative shadow-[0px_0px_0px_1px_rgb(37,32,47)] rounded-[0.875rem]">
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[0%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[4.16667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[8.33333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[12.5%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[16.6667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[20.8333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-1/4 inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[29.1667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[33.3333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[37.5%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[41.6667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[45.8333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-2/4 inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[54.1667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[58.3333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[62.5%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[66.6667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[70.8333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-3/4 inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[79.1667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[83.3333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[87.5%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[91.6667%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-[95.8333%] inset-y-0" />
                      <div className="bg-ploy-neutral-primary-s3/50 w-px absolute left-full inset-y-0" />
                    </div>
                    <div className="text-ploy-neutral-inverse-600 text-xs flex justify-between mt-1 tabular-nums">
                      <span className="block">12am</span>
                      <span className="block">6am</span>
                      <span className="block">12pm</span>
                      <span className="block">6pm</span>
                      <span className="block">12am</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-ploy-neutral-inverse-600 leading-snug text-sm shadow-[0px_0px_0px_1px_rgb(37,32,47)] p-5 rounded-3xl">
                  {"Nothing logged yet. Snap a photo or add an item to start."}
                </div>
              </div>
              <div className="mt-8">
                <div
                  role="note"
                  className="border-solid border-ploy-accent-primary/20 bg-ploy-background-accent-primary/5 text-ploy-accent-secondary-300 leading-snug text-xs flex items-start gap-2 p-3 rounded-[1.25rem] border"
                >
                  <PageIcon31 />
                  <p className="leading-relaxed">
                    <strong className="font-medium">
                      {"Educational information only." + " "}
                    </strong>
                    {
                      "This is not medical advice, diagnosis, or treatment. Always consult your physician or qualified medical practitioner before changing medications, starting supplements, or acting on any insight shown here."
                    }
                  </p>
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
                    <PageIcon32 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon33 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-[rgb(176,132,209)] text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon34 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon35 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon36 />
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
          <PageIcon37 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
