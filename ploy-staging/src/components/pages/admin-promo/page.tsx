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
            <div className="max-w-6xl mx-auto pt-8 pb-24 max-md:px-4 md:max-lg:px-6 lg:px-10">
              <div className="text-ploy-neutral-inverse-600 leading-snug text-xs tracking-[0.6px] uppercase flex items-center gap-2">
                <PageIcon15 />
                {"Admin"}
              </div>
              <nav className="flex overflow-x-auto gap-1 mt-4 -mx-1 pb-2">
                <a
                  href="/admin"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon16 />
                  {"Dashboard"}
                </a>
                <a
                  href="/admin/users"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon17 />
                  {"Users"}
                </a>
                <a
                  href="/admin/billing"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon18 />
                  {"Billing"}
                </a>
                <a
                  href="/admin/promo"
                  className="text-nowrap bg-ploy-button-primary-background text-ploy-button-secondary-text leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon19 />
                  {"Promo codes"}
                </a>
                <a
                  href="/admin/messages"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon20 />
                  {"Messages"}
                </a>
                <a
                  href="/admin/contact"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon21 />
                  {"Contact"}
                </a>
                <a
                  href="/admin/feedback"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon22 />
                  {"Feedback"}
                </a>
                <a
                  href="/admin/community"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon23 />
                  {"Community"}
                </a>
                <a
                  href="/admin/resources"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon24 />
                  {"Resources"}
                </a>
                <a
                  href="/admin/rules"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon25 />
                  {"Platform rules"}
                </a>
                <a
                  href="/admin/reports/duplicates"
                  className="text-nowrap bg-[rgb(31,26,43)] text-ploy-text-primary leading-snug text-sm whitespace-nowrap flex items-center gap-2 transition px-4 py-2 rounded-full hover:bg-ploy-neutral-primary-s3/70"
                  data-ploy-component-type="button"
                  data-ploy-component-variant="primary"
                >
                  <PageIcon26 />
                  {"Duplicates"}
                </a>
              </nav>
              <div className="mt-8">
                <div>
                  <h1 className="font-heading text-ploy-text-primary leading-none font-semibold text-2xl tracking-[-0.02em] app-hero-title">
                    {"Promo codes"}
                  </h1>
                  <p className="text-ploy-neutral-inverse-600 leading-snug text-sm mt-2">
                    {
                      "Create invite, discount, or share codes. Codes are uppercased and unique."
                    }
                  </p>
                  <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary grid gap-3 mt-6 p-4 rounded-3xl md:grid-cols-5 border">
                    <input
                      placeholder="CODE"
                      value="CJP7XY9Y"
                      style={{
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontVariationSettings: "inherit",
                      }}
                      className="border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug [font-weight:inherit] text-sm uppercase block px-4 py-2 rounded-full overflow-clip border"
                    />
                    <input
                      placeholder="Label (optional)"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug [font-weight:inherit] text-sm block px-4 py-2 rounded-full md:col-start-[span_2] md:col-end-[span_2] overflow-clip border"
                    />
                    <select className="text-nowrap border-solid border-ploy-neutral-primary-s3 bg-ploy-background-primary text-ploy-text-primary text-sm whitespace-pre items-center cursor-default px-4 py-2 rounded-full border">
                      <option value="invite">Invite</option>
                      <option value="discount">Discount</option>
                      <option value="share">Share</option>
                    </select>
                    <input
                      placeholder="Max uses"
                      style={{ fontVariationSettings: "inherit" }}
                      className="border-solid border-ploy-neutral-primary-s3 [color:inherit] bg-ploy-background-primary leading-snug [font-weight:inherit] text-sm block px-4 py-2 rounded-full overflow-clip border"
                    />
                    <button
                      style={{ fontVariationSettings: "inherit" }}
                      className="bg-ploy-button-primary-background text-ploy-button-secondary-text leading-snug font-medium text-sm block px-0 py-2 rounded-full md:col-start-[span_5] md:col-end-[span_5]"
                      data-ploy-component-type="button"
                      data-ploy-component-variant="primary"
                    >
                      {"Create code"}
                    </button>
                  </div>
                  <ul className="mt-6 mb-0 pl-0">
                    <p className="text-ploy-neutral-inverse-600">
                      {"No codes yet."}
                    </p>
                  </ul>
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
                    <PageIcon27 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon28 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-[rgb(176,132,209)] text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon29 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon30 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon31 />
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
          <PageIcon32 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
