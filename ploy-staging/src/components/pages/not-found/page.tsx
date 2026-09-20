import { ArrowRight, BookOpenText, House } from "lucide-react";

/**
 * @ployComponent
 * @ployComponentId purplelife-not-found-page
 * @ployComponentType page
 * @ployComponentDescription Calm branded 404 page that returns people to Today or Browse without implying lost data.
 * @ployComponentTags purplelife not-found navigation
 * @ployComponentStatus experimental
 */
export function NotFoundPage() {
  return (
    <main className="purplelife-pilot flex min-h-screen items-center justify-center bg-purplelife-stage p-5 text-purplelife-ink md:p-8">
      <section className="grid w-full max-w-[980px] overflow-hidden rounded-[40px] bg-purplelife-canvas shadow-2xl ring-1 ring-purplelife-line md:grid-cols-[1.05fr_0.95fr] md:rounded-[48px]">
        <div className="flex flex-col justify-center p-8 md:p-14 lg:p-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-purplelife-accent">Page not found</p>
          <h1 className="mt-3 max-w-[470px] text-[46px] font-semibold leading-[0.98] tracking-[-0.055em] md:text-[64px]">This path ends here.</h1>
          <p className="mt-5 max-w-[470px] text-[16px] leading-[1.55] text-purplelife-muted">Nothing in your journal was changed. Return to Today, or browse the parts of PurpleLife that are available in this preview.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/today" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-purplelife-accent px-5 text-[14px] font-semibold text-white"><House size={18} />Return to Today</a>
            <a href="/browse" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-white px-5 text-[14px] font-semibold ring-1 ring-purplelife-line"><BookOpenText size={18} />Browse PurpleLife <ArrowRight size={17} /></a>
          </div>
        </div>
        <div className="relative min-h-[310px] overflow-hidden bg-purplelife-tint md:min-h-[620px]">
          <div className="absolute left-1/2 top-1/2 size-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purplelife-accent/15 md:size-[330px]" />
          <div className="absolute left-1/2 top-1/2 size-[190px] -translate-x-[62%] -translate-y-[48%] rounded-full bg-purplelife-blue/65 shadow-2xl md:size-[250px]" />
          <div className="absolute left-1/2 top-1/2 size-[150px] -translate-x-[28%] -translate-y-[62%] rounded-full bg-purplelife-pink/70 shadow-xl md:size-[200px]" />
          <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[30px] font-semibold tracking-[-0.04em] shadow-xl md:size-32 md:text-[38px]">404</div>
        </div>
      </section>
    </main>
  );
}
