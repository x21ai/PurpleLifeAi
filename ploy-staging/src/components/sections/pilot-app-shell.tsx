import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { BatteryFull, BookOpenText, Database, Grid2X2, House, Menu, Plane, Settings, Share2, ShieldCheck, Signal, UserRound, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { nextTabBarMinimized } from "@/lib/purplelife-interactions";

type PilotDestination = "today" | "journal" | "browse";

interface PilotAppShellProps {
  active: PilotDestination;
  children: ReactNode;
  showTabs?: boolean;
  landscape?: "detail" | "insight" | "today" | "journal" | "browse" | "focused" | "legal";
}

const destinations = [
  { id: "today" as const, label: "Today", href: "/today", icon: House },
  { id: "journal" as const, label: "Journal", href: "/journal", icon: BookOpenText },
  { id: "browse" as const, label: "Browse", href: "/browse", icon: Grid2X2 },
];

const utilityDestinations = [
  { label: "Account and profile", detail: "Region, session, and account details", href: "/account", icon: UserRound },
  { label: "Privacy and safety", detail: "Review your data boundaries", href: "/settings/privacy", icon: ShieldCheck },
  { label: "Sharing and caregivers", detail: "Manage read-only access", href: "/sharing", icon: Share2 },
  { label: "Your data", detail: "Sources and export controls", href: "/data", icon: Database },
  { label: "Travel planning", detail: "Preview schedule timing", href: "/settings/travel", icon: Plane },
  { label: "All settings", detail: "Open every PurpleLife control", href: "/settings", icon: Settings },
];

/**
 * @ployComponent
 * @ployComponentId purplelife-landscape-stack
 * @ployComponentType component
 * @ployComponentDescription Keeps related app sections in one connected desktop column while remaining layout-neutral on portrait screens.
 * @ployComponentTags purplelife landscape responsive layout
 * @ployComponentStatus experimental
 */
export function PilotLandscapeStack({ children }: { children: ReactNode }) {
  return <div className="purplelife-landscape-stack">{children}</div>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-context-panel
 * @ployComponentType section
 * @ployComponentDescription Route-specific explanation panel that fills desktop insight layouts with source, privacy, or workflow context without inventing user data.
 * @ployComponentTags purplelife context insight responsive
 * @ployComponentStatus experimental
 */
export function PilotContextPanel({ eyebrow, title, body, items }: { eyebrow: string; title: string; body: string; items: string[] }) {
  return <section className="purplelife-context-panel px-5"><div className="rounded-[26px] border border-purplelife-line bg-white p-5"><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-purplelife-accent">{eyebrow}</p><h2 className="mt-1 text-[20px] font-semibold tracking-[-0.025em]">{title}</h2><p className="mt-2 text-[15px] font-medium leading-[1.5] text-purplelife-muted">{body}</p><div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full bg-purplelife-tint px-3 py-2 text-[12px] font-semibold text-purplelife-ink">{item}</span>)}</div></div></section>;
}

/**
 * @ployComponent
 * @ployComponentId purplelife-pilot-app-shell
 * @ployComponentType section
 * @ployComponentDescription Responsive PurpleLife app shell with an iOS-style mobile status area, floating mobile tab navigation, and a dedicated desktop landscape frame with top navigation and route-specific content grids.
 * @ployComponentTags purplelife pilot mobile app-shell navigation
 * @ployComponentStatus experimental
 */
export function PilotAppShell({ active, children, showTabs = true, landscape = "detail" }: PilotAppShellProps) {
  const [tabBarMinimized, setTabBarMinimized] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      setTabBarMinimized((current) => nextTabBarMinimized(current, lastScrollY, nextScrollY));
      lastScrollY = nextScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const sectionTargets = Array.from(main.querySelectorAll(":scope > section, :scope > .purplelife-landscape-stack > section"));
    const cardTargets = Array.from(main.querySelectorAll("section > div[class*='rounded'], section > a[class*='rounded'], section form[class*='rounded']"));
    const revealTargets = [...sectionTargets, ...cardTargets];
    const pressTargets = Array.from(main.querySelectorAll("a, button"));
    const drawablePaths = Array.from(main.querySelectorAll<SVGPathElement>("svg path[fill='none']:not([stroke-dasharray])"));

    main.classList.add("purplelife-motion-ready");
    sectionTargets.forEach((target) => target.classList.add("purplelife-motion-section"));
    cardTargets.forEach((target, index) => {
      target.classList.add("purplelife-motion-card");
      (target as HTMLElement).style.setProperty("--purplelife-stagger", `${(index % 5) * 70}ms`);
    });
    pressTargets.forEach((target) => target.classList.add("purplelife-pressable"));
    drawablePaths.forEach((path) => {
      try {
        const length = path.getTotalLength();
        if (length > 20) {
          path.style.setProperty("--purplelife-path-length", `${length}`);
          path.classList.add("purplelife-draw-path");
        }
      } catch {
        // Some generated SVG paths do not expose a measurable length.
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-motion-visible");
        entry.target.querySelectorAll(".purplelife-draw-path").forEach((path) => path.classList.add("is-motion-visible"));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -10% 0px" });

    revealTargets.forEach((target) => observer.observe(target));

    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const pageScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(Math.max(window.scrollY / pageScrollable, 0), 1);
        main.style.setProperty("--purplelife-scroll-progress", progress.toFixed(4));
      });
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);

  return (
    <div className="purplelife-pilot min-h-screen bg-purplelife-stage text-purplelife-ink md:px-5 md:py-5 lg:px-8 lg:py-8">
      <div className="purplelife-app-frame relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-purplelife-canvas md:max-w-[760px] md:rounded-[42px] md:shadow-2xl md:ring-1 md:ring-purplelife-line lg:max-w-[1180px] lg:rounded-[48px]">
        <div className="purplelife-status-bar flex h-12 items-center justify-between px-6 pt-1 text-[13px] font-semibold">
          <span>9:41</span>
          <span className="flex items-center gap-1.5" aria-label="Phone status">
            <Signal size={14} strokeWidth={2.2} />
            <Wifi size={15} strokeWidth={2.2} />
            <BatteryFull size={18} strokeWidth={2.2} />
          </span>
        </div>

        {showTabs && (
          <nav aria-label="Desktop primary" className="purplelife-desktop-nav hidden items-center justify-between border-b border-purplelife-line px-8 py-4 lg:flex">
            <a href="/today" className="text-[19px] font-semibold tracking-[-0.035em] text-purplelife-ink">PurpleLife</a>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-[18px] bg-purplelife-rail p-1">
                {destinations.map((destination) => {
                  const Icon = destination.icon;
                  const selected = destination.id === active;
                  return (
                    <a key={destination.id} href={destination.href} aria-current={selected ? "page" : undefined} className={cn("flex min-h-10 items-center gap-2 rounded-[14px] px-4 text-[14px] font-semibold transition-colors", selected ? "bg-white text-purplelife-accent shadow-sm" : "text-purplelife-muted hover:bg-white/60 hover:text-purplelife-ink")}>
                      <Icon size={18} strokeWidth={selected ? 2.2 : 1.8} />
                      {destination.label}
                    </a>
                  );
                })}
              </div>
              <div className="relative">
                <button type="button" onClick={() => setUtilityOpen((open) => !open)} aria-expanded={utilityOpen} aria-haspopup="menu" aria-label="Open account and settings menu" className="purplelife-glass-clear flex min-h-12 items-center gap-2 rounded-[16px] px-3 text-purplelife-ink shadow-sm ring-1 ring-purplelife-line transition-transform active:scale-[0.97]">
                  <span className="grid size-8 place-items-center rounded-full bg-purplelife-tint text-purplelife-accent"><UserRound size={17} /></span>
                  <Menu size={19} />
                </button>
                {utilityOpen && <div role="menu" className="purplelife-utility-menu absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[330px] overflow-hidden rounded-[26px] border border-white/80 bg-white/88 p-2 shadow-2xl backdrop-blur-2xl">
                  <div className="flex items-center justify-between px-3 py-2"><div><p className="text-[17px] font-semibold tracking-[-0.02em]">Manage PurpleLife</p><p className="mt-0.5 text-[12px] text-purplelife-muted">Account, privacy, sharing, and data</p></div><button type="button" onClick={() => setUtilityOpen(false)} aria-label="Close menu" className="grid size-8 place-items-center rounded-full bg-purplelife-rail"><X size={16} /></button></div>
                  <div className="mt-1 overflow-hidden rounded-[20px] bg-purplelife-tint/70">{utilityDestinations.map(({ label, detail, href, icon: Icon }) => <a role="menuitem" key={href} href={href} className="flex items-center gap-3 border-b border-purplelife-accent/10 px-3 py-3 last:border-b-0 hover:bg-white/60"><span className="grid size-9 shrink-0 place-items-center rounded-[13px] bg-white text-purplelife-accent"><Icon size={17} /></span><span><span className="block text-[13px] font-semibold">{label}</span><span className="mt-0.5 block text-[11px] text-purplelife-muted">{detail}</span></span></a>)}</div>
                </div>}
              </div>
            </div>
          </nav>
        )}

        <main ref={mainRef} className={cn("purplelife-screen min-h-[calc(100dvh-3rem)] md:min-h-[900px]", `purplelife-screen--${landscape}`, showTabs ? "pb-32" : "pb-10")}>
          {children}
        </main>

        {showTabs && <>
        {utilityOpen && <div role="dialog" aria-modal="false" aria-label="Account and settings" className="purplelife-utility-sheet purplelife-glass fixed inset-x-4 bottom-24 z-50 mx-auto max-w-[402px] rounded-[30px] p-3 shadow-2xl md:absolute lg:hidden">
          <div className="flex items-center justify-between px-2 pb-3 pt-1"><div><p className="text-[20px] font-semibold tracking-[-0.025em]">More</p><p className="mt-0.5 text-[13px] text-purplelife-muted">Manage PurpleLife without leaving your journal behind.</p></div><button type="button" onClick={() => setUtilityOpen(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-full bg-white/70"><X size={18} /></button></div>
          <div className="grid grid-cols-2 gap-2">{utilityDestinations.map(({ label, href, icon: Icon }) => <a key={href} href={href} className="flex min-h-20 flex-col justify-between rounded-[20px] bg-white/68 p-3 text-[12px] font-semibold text-purplelife-ink ring-1 ring-white/80"><Icon size={19} className="text-purplelife-accent" /><span>{label}</span></a>)}</div>
        </div>}
        <nav
          aria-label="Primary"
          className={cn(
            "purplelife-glass fixed bottom-[max(0.8rem,env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 overflow-hidden rounded-[28px] p-1.5 transition-[width,border-radius,transform] duration-500 ease-out md:absolute md:bottom-4 lg:hidden",
            tabBarMinimized ? "w-[238px] rounded-[25px]" : "w-[calc(100%-28px)] max-w-[390px]",
          )}
        >
          <div className="grid grid-cols-4 gap-1">
            {destinations.map((destination) => {
              const Icon = destination.icon;
              const selected = destination.id === active;
              return (
                <a
                  key={destination.id}
                  href={destination.href}
                  aria-current={selected ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-[22px] text-[10px] font-semibold transition-[min-height,gap,background-color,color,box-shadow,transform] duration-300 active:scale-[0.97]",
                    tabBarMinimized ? "min-h-[46px] gap-0" : "min-h-[58px] gap-1",
                    selected ? "bg-white/72 text-purplelife-accent shadow-sm ring-1 ring-white/80" : "text-purplelife-muted hover:bg-white/35",
                  )}
                >
                  <Icon size={21} strokeWidth={selected ? 2.2 : 1.7} />
                  <span className={cn("transition-[opacity,max-height] duration-300", tabBarMinimized ? "max-h-0 overflow-hidden opacity-0" : "max-h-4 opacity-100")}>{destination.label}</span>
                </a>
              );
            })}
            <button type="button" onClick={() => setUtilityOpen((open) => !open)} aria-expanded={utilityOpen} className={cn("flex flex-col items-center justify-center rounded-[22px] text-[10px] font-semibold text-purplelife-muted transition-[min-height,gap,background-color,color,transform] duration-300 active:scale-[0.97]", tabBarMinimized ? "min-h-[46px] gap-0" : "min-h-[58px] gap-1", utilityOpen && "bg-white/72 text-purplelife-accent")}><Menu size={21} /><span className={cn("transition-[opacity,max-height] duration-300", tabBarMinimized ? "max-h-0 overflow-hidden opacity-0" : "max-h-4 opacity-100")}>More</span></button>
          </div>
        </nav>
        </>}
      </div>
    </div>
  );
}
