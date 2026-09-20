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
                  className="bg-ploy-neutral-primary-s3 text-ploy-text-primary font-medium text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem]"
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
                  className="bg-ploy-background-accent-secondary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
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
                  className="bg-ploy-background-accent-secondary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon18 />
              </button>
            </div>
          </header>
          <div className="grow basis-[0%]">
            <div className="w-full max-w-screen-md mx-auto pb-32 max-md:pt-8 max-md:px-5 md:max-lg:px-10 md:pt-12 lg:px-16">
              <h1 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] app-hero-title max-md:text-xl max-md:leading-none md:text-2xl md:leading-none">
                {"Your data"}
              </h1>
              <p className="text-ploy-neutral-inverse-600 leading-relaxed text-sm mt-1.5">
                {
                  "Labs from report_metrics and wearable signals from biometrics."
                }
              </p>
              <label className="block mt-5">
                <span className="relative flex items-center">
                  <PageIcon20 />
                  <input
                    placeholder="Search metric or name…"
                    type="search"
                    style={{ fontVariationSettings: "inherit" }}
                    className="border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary/80 leading-snug [font-weight:inherit] text-sm w-full block pl-10 pr-3 py-2.5 rounded-[1.25rem] overflow-clip border"
                  />
                </span>
              </label>
              <section className="mt-8">
                <div className="flex justify-between items-center gap-2 mb-3">
                  <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                    {"Wearables · /biometrics"}
                  </p>
                  <span className="text-ploy-neutral-inverse-600 leading-snug text-xs block">
                    {"6"}
                  </span>
                </div>
                <div>
                  <a
                    href="/biometrics/sleep_score"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition mb-2 px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Sleep score"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"oura"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"70"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                  <a
                    href="/biometrics/sleep_total"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition mb-2 px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Total sleep"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"whoop"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"5h 19m"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                  <a
                    href="/biometrics/hrv"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition mb-2 px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Heart rate variability"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"whoop"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"32 ms"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                  <a
                    href="/biometrics/resting_hr"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition mb-2 px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Resting heart rate"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"whoop"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"65 bpm"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                  <a
                    href="/biometrics/readiness"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition mb-2 px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Readiness"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"oura"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"78"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                  <a
                    href="/biometrics/activity_score"
                    className="border-solid border-ploy-button-primary-border/50 text-ploy-button-secondary-text bg-ploy-button-secondary-background/20 block transition px-4 py-3 rounded-2xl border"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="secondary"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-ploy-text-primary leading-snug font-medium text-sm block">
                        {"Activity score"}
                      </span>
                      <span className="bg-ploy-neutral-primary-s3 text-ploy-neutral-inverse-600 leading-none font-medium text-xs tracking-[0.04em] block px-2 py-0.5 rounded-full label-small">
                        {"oura"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-ploy-text-primary leading-normal font-semibold text-lg block">
                        {"50"}
                      </span>
                      <PageIcon21 />
                    </div>
                  </a>
                </div>
              </section>
              <section className="mt-8">
                <div className="flex justify-between items-center gap-2 mb-3">
                  <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                    {"Labs · /reports"}
                  </p>
                  <span className="text-ploy-neutral-inverse-600 leading-snug text-xs block">
                    {"0"}
                  </span>
                </div>
                <div className="border-solid border-ploy-neutral-inverse-s0/10 bg-ploy-background-primary/80 text-center shadow-[0px_8px_32px_0px_rgba(0,0,0,0.36),0px_1px_2px_0px_rgba(0,0,0,0.24),0px_0.5px_0px_0px_inset_color-mix(in_srgb,var(--ploy-neutral-inverse)_8%,transparent)] px-6 py-10 rounded-[1.25rem] border">
                  <PageIcon22 />
                  <h2
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="text-ploy-text-primary leading-normal font-semibold text-lg mt-4"
                  >
                    {"No labs yet"}
                  </h2>
                  <p className="text-ploy-neutral-inverse-600 leading-relaxed text-sm mt-2">
                    {
                      "Upload past results to populate biomarker trends, or order a new panel when ready."
                    }
                  </p>
                  <div className="flex gap-2 mt-6 max-md:flex-col md:flex-row md:justify-center">
                    <a
                      href="/reports/new"
                      className="bg-ploy-button-primary-background text-ploy-button-secondary-text leading-snug font-medium text-sm flex justify-center items-center px-5 py-2.5 rounded-full"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"Upload past labs"}
                    </a>
                    <a
                      href="/plan?tab=recommended"
                      className="border-solid border-ploy-button-primary-border text-ploy-button-secondary-text leading-snug font-medium text-sm flex justify-center items-center px-5 py-2.5 rounded-full hover:bg-ploy-neutral-primary-s3/40 border"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="outline"
                    >
                      {"See recommendations"}
                    </a>
                  </div>
                </div>
              </section>
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
                  className="text-ploy-accent-secondary-500 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] nav-glass-tab-active"
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
        <a
          aria-label="Ask Maya"
          href="/ask-maya"
          className="bg-ploy-background-inverse text-ploy-text-inverse w-14 h-14 fixed z-40 flex justify-center items-center shadow-[0px_10px_15px_-3px_oklab(0.985621_0.000790089_-0.00252056_/_0.4),0px_4px_6px_-4px_oklab(0.985621_0.000790089_-0.00252056_/_0.4)] transition rounded-full hover:bg-ploy-background-inverse/90 max-md:right-5 max-md:bottom-28 md:right-6 md:bottom-6"
        >
          <PageIcon28 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
