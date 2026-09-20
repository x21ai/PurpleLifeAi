import {
  ArrowRight,
  Camera,
  ChevronRight,
  HeartHandshake,
  LockKeyhole,
  MoonStar,
  NotebookPen,
  Pill,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const HERO_IMAGE =
  "https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/ai-purplelife-journaling-hero-260916001830.webp";
const JOURNAL_IMAGE =
  "https://storage.googleapis.com/ployai/d109b67e-226c-43c3-b6d7-09d3b70301cd/user/ai-purplelife-journal-memory-detail-260916001832.webp";

const captureItems = [
  { label: "Symptoms and notes", icon: NotebookPen },
  { label: "Medications", icon: Pill },
  { label: "Sleep", icon: MoonStar },
  { label: "Photos", icon: Camera },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-home-page
 * @ployComponentType page
 * @ployComponentDescription Public PurpleLife homepage pilot combining warm editorial photography with a restrained Apple-inspired product story.
 * @ployComponentTags purplelife pilot homepage
 * @ployComponentStatus experimental
 */
export function PilotHomePage() {
  return (
    <div className="purplelife-pilot pilot-home min-h-screen bg-purplelife-canvas text-purplelife-ink">
      <header className="pilot-home__nav mx-auto flex max-w-[1480px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <a href="/pilot" className="font-heading text-2xl font-semibold tracking-[-0.04em]">
          PurpleLife
        </a>
        <nav aria-label="Public navigation" className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#product" className="hover:text-purplelife-accent">Product</a>
          <a href="#privacy" className="hover:text-purplelife-accent">Privacy</a>
          <a href="/pilot/journal" className="hover:text-purplelife-accent">Journal</a>
        </nav>
        <a
          href="/pilot/today"
          className="inline-flex h-11 items-center rounded-[10px] bg-purplelife-accent px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Open the app
        </a>
      </header>

      <main>
        <section className="pilot-home__hero mx-auto max-w-[1480px] px-3 sm:px-5 lg:px-8">
          <div className="relative min-h-[650px] overflow-hidden rounded-[28px] sm:min-h-[720px]">
            <img
              src={HERO_IMAGE}
              alt="A person writing in a notebook beside a sunlit window"
              className="absolute inset-0 size-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ploy-neutral-inverse-50 via-ploy-neutral-inverse-50/80 to-transparent" />
            <div className="relative z-10 flex min-h-[650px] max-w-2xl flex-col justify-center px-7 py-20 sm:min-h-[720px] sm:px-12 lg:px-16">
              <p className="mb-5 text-sm font-semibold text-purplelife-accent">Private health journaling</p>
              <h1 className="max-w-xl font-heading text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-ploy-neutral-inverse-950 sm:text-6xl lg:text-7xl">
                Your calm space to capture what is happening today.
              </h1>
              <p className="mt-7 max-w-lg text-lg leading-relaxed text-ploy-neutral-inverse-700 sm:text-xl">
                Keep symptoms, medication, sleep, photos, and notes together. Notice patterns over time and choose what to share.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="/pilot/today"
                  className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-purplelife-accent px-6 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Start journaling <ArrowRight size={17} />
                </a>
                <a
                  href="#product"
                  className="inline-flex h-12 items-center rounded-[10px] bg-ploy-neutral-inverse-50/75 px-6 text-sm font-semibold text-ploy-neutral-inverse-950 backdrop-blur"
                >
                  See how it works
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="pilot-home__capture mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-purplelife-accent">Capture the day</p>
              <h2 className="mt-4 max-w-xl font-heading text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                Remember the details without turning life into a dashboard.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-purplelife-muted">
                Add one detail at a time. PurpleLife organizes the record quietly, so Today stays readable and Journal keeps the full story.
              </p>
              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                {captureItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 border-b border-purplelife-line py-3 text-sm font-medium">
                    <Icon size={19} strokeWidth={1.7} className="text-purplelife-accent" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[28px] bg-purplelife-surface shadow-sm ring-1 ring-purplelife-line">
              <img
                src={JOURNAL_IMAGE}
                alt="An open journal with photos, a pen, and lavender on a pale wooden table"
                className="aspect-[16/10] size-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="pilot-home__product-preview mx-auto max-w-[1480px] px-3 pb-5 sm:px-5 lg:px-8">
          <div className="overflow-hidden rounded-[28px] bg-purplelife-tint px-6 py-16 text-purplelife-ink ring-1 ring-purplelife-line sm:px-10 lg:px-16 lg:py-20">
            <div className="grid gap-14 lg:grid-cols-[0.55fr_1.45fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-purplelife-accent">Designed to move with you</p>
                <h2 className="mt-4 max-w-md font-heading text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-5xl">
                  The right detail, when you need it.
                </h2>
                <p className="mt-6 max-w-md leading-relaxed text-purplelife-muted">
                  Today gives you a clear daily view. Journal holds the complete timeline. Trends opens only when you want to look closer.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] bg-purplelife-surface p-5 shadow-sm ring-1 ring-purplelife-line">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Today</span>
                    <Sparkles size={18} className="text-purplelife-accent" />
                  </div>
                  <p className="mt-7 text-xs text-purplelife-muted">Daily status</p>
                  <div className="mt-3 divide-y divide-purplelife-line">
                    {["Sleep · 7 h 45 min", "Symptoms · None logged", "Medication · 2 of 3 recorded"].map((item) => (
                      <div key={item} className="flex items-center justify-between py-4 text-sm">
                        <span>{item}</span><ChevronRight size={16} className="text-purplelife-muted" />
                      </div>
                    ))}
                  </div>
                  <a href="/pilot/today" className="mt-5 flex h-11 items-center justify-center rounded-[10px] bg-purplelife-accent text-sm font-semibold text-white">
                    Open Today
                  </a>
                </div>

                <div className="rounded-[24px] bg-purplelife-surface p-5 shadow-sm ring-1 ring-purplelife-line">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">A quiet pattern</span>
                    <TrendingUp size={18} className="text-purplelife-accent" />
                  </div>
                  <div className="mt-9 h-32">
                    <svg viewBox="0 0 320 120" className="size-full" role="img" aria-label="Illustrative trend line">
                      <path d="M8 92 C50 80, 65 42, 104 58 S160 88, 196 54 S245 25, 312 38" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-purplelife-accent" />
                    </svg>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-purplelife-muted">
                    Sleep notes and morning symptoms appear near each other. PurpleLife keeps this as an observation, not a diagnosis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="privacy" className="pilot-home__privacy mx-auto max-w-5xl px-5 py-28 text-center sm:px-8 lg:py-36">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-purplelife-tint text-purplelife-accent">
            <LockKeyhole size={25} strokeWidth={1.7} />
          </div>
          <h2 className="mt-7 font-heading text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Your record stays yours.</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-purplelife-muted">
            You decide what to keep private and what to share as read-only information with a caregiver. Sharing is a choice, not the default.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium">
            <span className="inline-flex items-center gap-2"><LockKeyhole size={17} /> Private by default</span>
            <span className="inline-flex items-center gap-2"><HeartHandshake size={17} /> Caregiver sharing</span>
          </div>
        </section>
      </main>

      <footer className="pilot-home__footer border-t border-purplelife-line px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-3 text-sm text-purplelife-muted sm:flex-row sm:items-center sm:justify-between">
          <span>PurpleLife</span>
          <span>Your calm space to capture what is happening today.</span>
        </div>
      </footer>
    </div>
  );
}
