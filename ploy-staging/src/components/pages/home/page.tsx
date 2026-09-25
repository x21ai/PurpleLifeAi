import { ArrowRight, BookOpenText, Camera, LockKeyhole, MoonStar, Pill, Share2, Sparkles } from "lucide-react";
import Navbar from "@/components/pages/about/layout/navbar";
import Footer from "@/components/pages/about/layout/footer";
import { JournalRibbon, WellbeingBloom } from "@/components/pages/pilot/components/mobile-graphics";
import { isProductionSite } from "@/lib/staging/config";

const CAPTURE_ITEMS = [
  { label: "Symptoms", icon: Sparkles, color: "bg-purplelife-pink/15 text-purplelife-pink" },
  { label: "Medication", icon: Pill, color: "bg-purplelife-mint/20 text-purplelife-mint" },
  { label: "Sleep", icon: MoonStar, color: "bg-purplelife-indigo/15 text-purplelife-indigo" },
  { label: "Photos and notes", icon: Camera, color: "bg-purplelife-yellow/20 text-purplelife-coral" },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-home-page
 * @ployComponentType page
 * @ployComponentDescription Public PurpleLife marketing landing page that introduces the live health journal.
 * @ployComponentTags purplelife homepage marketing health-journal
 * @ployComponentStatus stable
 */
export function HomePage() {
  const production = isProductionSite();

  return (
    <div className="purplelife-home purplelife-public purplelife-pilot min-h-screen bg-ploy-background-primary text-ploy-text-primary">
      <Navbar />
      <main>
        <section className="purplelife-home__hero mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-14 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-ploy-background-secondary px-4 py-2 text-xs font-semibold text-ploy-text-primary">
              <span className="size-2 rounded-full bg-purplelife-accent" />
              {production ? "Private health journal" : "Static design preview"}
            </p>
            <h1 className="mt-7 max-w-[720px] font-heading text-[clamp(3.4rem,8vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.07em]">
              Your health story, kept in one calm place.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ploy-text-primary/70 md:text-xl">
              PurpleLife helps you capture symptoms, medication, sleep, photos, and notes, then notice patterns and choose what to share.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="/today" className="inline-flex min-h-13 items-center gap-2 rounded-full bg-purplelife-accent px-6 text-sm font-semibold text-white transition-transform active:scale-[0.98]">
                {production ? "Open PurpleLife" : "Open preview"} <ArrowRight size={18} />
              </a>
              <a href="/features" className="inline-flex min-h-13 items-center px-3 text-sm font-semibold text-ploy-text-primary/70 hover:text-ploy-text-primary">
                See what PurpleLife covers
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[42px] bg-white p-4 shadow-xl ring-1 ring-purplelife-line md:p-6">
            <div className="rounded-[34px] bg-purplelife-canvas px-4 pb-5 pt-2 md:px-8">
              <WellbeingBloom className="mx-auto w-full max-w-[470px]" />
              <div className="mx-auto -mt-4 max-w-md rounded-[26px] bg-white/88 p-5 text-center shadow-sm ring-1 ring-white">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-purplelife-accent">Today at a glance</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Ready when you are.</p>
                <p className="mt-2 text-sm leading-relaxed text-purplelife-muted">
                  {production
                    ? "Your journal stays private and is available after you sign in."
                    : "Nothing is added, analyzed, or shared from this preview."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="purplelife-home__capture bg-white/55 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-5 md:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-purplelife-accent">Capture without pressure</p>
              <h2 className="mt-4 font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.05em] md:text-6xl">Record what matters today.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ploy-text-primary/65">Start with one detail. PurpleLife keeps the journal useful without turning every day into a score.</p>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAPTURE_ITEMS.map(({ label, icon: Icon, color }) => (
                <div key={label} className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-purplelife-line">
                  <span className={`grid size-12 place-items-center rounded-[17px] ${color}`}><Icon size={22} /></span>
                  <p className="mt-8 text-lg font-semibold tracking-[-0.025em]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="purplelife-home__patterns mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="overflow-hidden rounded-[38px] bg-purplelife-tint p-5 md:p-8">
            <JournalRibbon className="w-full" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-purplelife-accent">Patterns with context</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.05em] md:text-6xl">See what appeared together.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ploy-text-primary/65">PurpleLife can place journal details beside one another without presenting an observation as a diagnosis.</p>
            <div className="mt-8 space-y-3">
              <p className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-sm font-semibold ring-1 ring-purplelife-line"><BookOpenText size={19} className="text-purplelife-accent" /> Review the source entries</p>
              <p className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-sm font-semibold ring-1 ring-purplelife-line"><LockKeyhole size={19} className="text-purplelife-accent" /> Keep the journal private by default</p>
              <p className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-sm font-semibold ring-1 ring-purplelife-line"><Share2 size={19} className="text-purplelife-accent" /> Share selected read-only information</p>
            </div>
          </div>
        </section>

        <section className="purplelife-home__cta px-5 pb-20 md:px-10 md:pb-28">
          <div className="mx-auto max-w-6xl rounded-[42px] bg-purplelife-accent px-6 py-12 text-white md:px-12 md:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/70">
              {production ? "PurpleLife" : "Design review build"}
            </p>
            <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="max-w-3xl font-heading text-4xl font-semibold leading-none tracking-[-0.05em] md:text-6xl">
                  {production ? "Your health journal is ready." : "Explore the full PurpleLife prototype."}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75">
                  {production
                    ? "Sign in to access your private journal, medications, reports, and connected health data."
                    : "Interactions use local mock state. Production authentication, storage, uploads, billing, and health APIs are not connected."}
                </p>
              </div>
              <a href="/today" className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-purplelife-accent">Open Today <ArrowRight size={18} /></a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
