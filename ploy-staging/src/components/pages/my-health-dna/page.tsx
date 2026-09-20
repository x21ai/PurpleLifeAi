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
                  aria-expanded="true"
                  aria-label="Collapse Plan"
                  style={{ fontVariationSettings: "inherit" }}
                  className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-7 h-7 justify-center items-center transition-colors p-0 rounded-[0.875rem] hidden min-[1024px]:inline-flex hover:bg-ploy-neutral-primary-s3/80 hover:text-ploy-text-primary"
                >
                  <PageIcon6 />
                </button>
              </div>
              <div className="border-solid border-ploy-neutral-primary-s3/60 ml-3 mt-0.5 mb-1.5 pl-3 border-l hidden min-[1024px]:block">
                <a
                  href="/reports"
                  className="text-ploy-neutral-inverse-600 text-xs flex items-center gap-2 transition-colors px-3 py-1.5 rounded-2xl hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon7 />
                  <span className="block">Reports</span>
                </a>
              </div>
            </div>
            <a
              aria-label="Ask Maya"
              href="/ask-maya"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon8 />
              <span className="hidden min-[1024px]:inline">Ask Maya</span>
            </a>
            <a
              aria-label="Journal"
              href="/journal"
              className="text-ploy-neutral-inverse-600 text-sm flex justify-start items-center gap-3 transition-colors mb-0.5 px-3 py-2.5 rounded-[1.25rem] group hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
            >
              <PageIcon9 />
              <span className="hidden min-[1024px]:inline">Journal</span>
            </a>
            <div className="mb-0.5">
              <div className="overflow-hidden w-full flex items-center">
                <a
                  aria-label="Care"
                  href="/care"
                  className="text-ploy-neutral-inverse-600 text-sm min-w-0 flex grow basis-[0%] justify-start items-center gap-3 transition-colors px-3 py-2.5 rounded-[1.25rem] hover:bg-ploy-neutral-primary-s3/60 hover:text-ploy-text-primary"
                >
                  <PageIcon10 />
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
                  <PageIcon11 />
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
                <PageIcon12 />
                <span className="text-left grow basis-[0%] hidden min-[1024px]:inline">
                  {"Account"}
                </span>
                <PageIcon13 />
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
                <PageIcon14 />
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
                  className="bg-ploy-background-accent-tertiary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon15 />
              </button>
              <button
                type="button"
                aria-expanded="false"
                data-state="closed"
                aria-label="Open menu"
                style={{ fontVariationSettings: "inherit" }}
                className="text-ploy-neutral-inverse-600 [font-weight:inherit] w-11 h-11 min-w-11 min-h-11 flex justify-center items-center cursor-pointer transition-opacity -mr-2 p-0 rounded-[0.875rem] hover:text-ploy-text-primary"
              >
                <PageIcon16 />
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
                <PageIcon14 />
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
                  className="bg-ploy-background-accent-tertiary text-ploy-text-primary font-medium text-xs w-8 h-8 flex justify-center items-center rounded-full overflow-hidden"
                >
                  <span className="block">P</span>
                </span>
                <PageIcon15 />
              </button>
            </div>
          </header>
          <div className="grow basis-[0%]">
            <div className="max-w-screen-md mx-auto pt-6 pb-32 max-md:px-5 md:px-10">
              <div className="flex justify-between items-center">
                <a
                  href="/my-health"
                  className="text-ploy-neutral-inverse-600 leading-snug text-sm flex items-center gap-1 hover:text-ploy-text-primary"
                >
                  <PageIcon17 />
                  {"My Health"}
                </a>
                <h1 className="font-semibold text-base">DNA insights</h1>
                <span className="w-16 block" />
              </div>
              <section className="mt-10">
                <p className="text-ploy-neutral-inverse-600 leading-none font-semibold text-xs tracking-widest uppercase label-eyebrow">
                  {"Optional"}
                </p>
                <h2 className="font-heading text-ploy-text-primary leading-none font-semibold tracking-[-0.02em] mt-2 app-hero-title max-md:text-3xl max-md:leading-none md:text-4xl md:leading-none">
                  {"A quiet read of a few"}
                  <br />
                  {"relevant variants."}
                </h2>
                <p className="text-ploy-text-primary/70 leading-normal text-base max-w-[35rem] mt-5">
                  {
                    "Upload a raw file from 23andMe, AncestryDNA, MyHeritage, or any standard VCF. PurpleLife only looks at a small, curated set of variants tied to traits we already track, never your whole genome."
                  }
                </p>
              </section>
              <div
                role="note"
                className="border-solid border-ploy-accent-primary/20 bg-ploy-background-accent-primary/5 text-ploy-accent-secondary-300 leading-snug text-xs flex items-start gap-2 mt-6 p-3 rounded-[1.25rem] border"
              >
                <PageIcon18 />
                <p className="leading-relaxed">
                  <strong className="font-medium">
                    {"Educational information only." + " "}
                  </strong>
                  {
                    "This is not medical advice, diagnosis, or treatment. Always consult your physician or qualified medical practitioner before changing medications, starting supplements, or acting on any insight shown here."
                  }
                </p>
              </div>
              <div className="mt-8">
                <div className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary rounded-[1.75rem] max-md:p-6 md:p-8 border">
                  <div className="bg-ploy-background-accent-tertiary/10 text-[rgb(176,132,209)] text-xs tracking-wide uppercase inline-flex items-center gap-2 px-3 py-1 rounded-full">
                    <PageIcon19 />
                    {"PurpleLife Pro"}
                  </div>
                  <h3
                    style={{
                      fontFamily:
                        "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif",
                    }}
                    className="leading-snug [font-weight:inherit] text-2xl tracking-[-0.01em] mt-4"
                  >
                    {"DNA insights are a Pro feature"}
                  </h3>
                  <p className="text-ploy-text-primary/70 leading-snug text-sm max-w-[36.1856rem] mt-2">
                    {
                      "Upload raw genotype files and see a small, curated read of variants tied to traits PurpleLife already tracks."
                    }
                  </p>
                  <a
                    href="/account"
                    className="bg-ploy-button-primary-background text-ploy-text-primary leading-snug font-semibold text-sm inline-flex justify-center items-center mt-5 px-5 py-2.5 rounded-full hover:opacity-90"
                    data-ploy-component-type="button"
                    data-ploy-component-variant="primary"
                  >
                    {"Upgrade to Pro"}
                  </a>
                </div>
              </div>
              <details className="border-solid border-ploy-neutral-primary-s3 bg-ploy-background-secondary/40 mt-8 px-5 py-4 rounded-3xl border">
                <summary className="leading-snug font-medium text-sm list-item cursor-pointer">
                  {"What we look at and why"}
                </summary>
                <ul className="mb-0 pl-0">
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"APOE" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Long-term brain & heart load"}
                      </span>
                      <span className="text-amber-400 text-xs tracking-wide uppercase ml-2">
                        {" " + "sensitive"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Two spots in the APOE gene together describe the ε2 / ε3 / ε4 pattern. Sleep, movement, and blood-pressure habits tend to matter more for people with an ε4 copy."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"APOE" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Long-term brain & heart load"}
                      </span>
                      <span className="text-amber-400 text-xs tracking-wide uppercase ml-2">
                        {" " + "sensitive"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Pairs with rs429358 to read the APOE ε pattern. We never show a risk score, just a calm note."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"MTHFR" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· B-vitamin processing"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects how your body handles folate and B12. Mostly a nutrition note, a varied diet covers it."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"MTHFR" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· B-vitamin processing"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "A second MTHFR spot. Same theme: gentle nutrition note, not a diagnosis."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"HLA-B" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Autoimmune sensitivity"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "A common proxy for HLA-B27. Worth mentioning to a rheumatologist if you have unexplained joint or back inflammation."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"F5" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Clotting tendency"}
                      </span>
                      <span className="text-amber-400 text-xs tracking-wide uppercase ml-2">
                        {" " + "sensitive"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Factor V Leiden. Worth knowing before long flights or hormonal medications, mention it to your doctor."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"F2" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Clotting tendency"}
                      </span>
                      <span className="text-amber-400 text-xs tracking-wide uppercase ml-2">
                        {" " + "sensitive"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Prothrombin G20210A. Like F5, mostly a flag for your medical team around clotting risk."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"CYP2D6" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Medication metabolism"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects how some common medications (certain antidepressants, codeine, beta-blockers) are processed. A pharmacist can use this, we don't recommend doses."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"CYP2C19" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Medication metabolism"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects how acid-reducers (e.g. omeprazole) and clopidogrel are processed. A pharmacy or clinician can use this."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"CYP1A2" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Caffeine metabolism"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects how quickly you clear caffeine. Slow metabolizers often sleep better with an earlier caffeine cut-off."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"MCM6 / LCT" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Lactose tolerance"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects whether your body keeps making lactase as an adult. A nutrition note, not a diagnosis."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"GC" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Vitamin D handling"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Affects circulating vitamin D levels. If you spend a lot of time indoors, a level check via your doctor can be useful."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm mb-3">
                    <p className="text-ploy-text-primary font-medium">
                      {"MTDH" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Migraine susceptibility"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Associated with migraine susceptibility. If you already track migraines, this is mostly context, not new information."
                      }
                    </p>
                  </li>
                  <li className="leading-snug text-sm">
                    <p className="text-ploy-text-primary font-medium">
                      {"CLOCK" + " "}
                      <span className="text-ploy-neutral-inverse-600">
                        {" " + "· Sleep chronotype"}
                      </span>
                    </p>
                    <p className="text-ploy-neutral-inverse-600 mt-0.5">
                      {
                        "Linked to morning vs evening preference. Useful if your wake time feels chronically misaligned."
                      }
                    </p>
                  </li>
                </ul>
              </details>
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
                    <PageIcon20 />
                  </span>
                  <span className="font-medium block nav-tab-label">Today</span>
                </a>
                <a
                  aria-label="Data"
                  href="/data"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon21 />
                  </span>
                  <span className="font-medium block nav-tab-label">Data</span>
                </a>
                <div className="flex justify-center items-center">
                  <a
                    aria-label="Capture"
                    href="/journal/new"
                    className="bg-ploy-background-accent-tertiary text-ploy-text-primary w-14 h-14 min-w-14 min-h-14 flex justify-center items-center shadow-[0px_0px_0px_2px_color-mix(in_srgb,var(--ploy-neutral-inverse)_10%,transparent),0px_10px_15px_-3px_oklab(0.684385_0.0764743_-0.0919314_/_0.4),0px_4px_6px_-4px_oklab(0.684385_0.0764743_-0.0919314_/_0.4)] transition-[transform,translate,scale,rotate,opacity] -mt-6 rounded-full"
                  >
                    <PageIcon22 />
                  </a>
                </div>
                <a
                  aria-label="Plan"
                  href="/plan"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon23 />
                  </span>
                  <span className="font-medium block nav-tab-label">Plan</span>
                </a>
                <a
                  aria-label="Ask Maya"
                  href="/ask-maya"
                  className="text-ploy-neutral-inverse-600 text-xs min-w-11 min-h-[3.75rem] relative flex flex-col justify-center items-center gap-0.5 transition-[color,opacity] hover:text-ploy-text-primary"
                >
                  <span aria-hidden="true" className="block nav-tab-icon-wrap">
                    <PageIcon24 />
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
          <PageIcon25 />
        </a>
      </div>
      <section aria-label="Notifications alt+T" tabIndex={-1} />
    </>
  );
}
