import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AssistanceTransition } from "@/components/demo/assistance-transition";
import { CompactTooltipProvider as TooltipProvider } from "@/components/ui/compact-tooltip";
import { useNotification } from "@/hooks/use-notification";
import { TopNav } from "@/components/demo/top-nav";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { TourRail } from "@/components/demo/tour-rail";
import { FollowBanner } from "@/components/demo/follow-banner";
import { tourStopIndex } from "@/lib/tour-navigation";
import { TOUR_CONTENT } from "@/lib/domain/public-facts";
import { Button } from "@/components/ui/button";

// One sticky stack: the banner can wrap without overlapping the rail or content.
export function AppShell() {
  const { pathname, hash, search } = useLocation();
  const chrome = useRef<HTMLDivElement>(null);
  const notification = useNotification();
  const [tourVisible, setTourVisible] = useState(true);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [resetEpoch, setResetEpoch] = useState(0);
  useEffect(() => {
    // Child detail views may focus on mount; a reset must keep its invoking control.
    if (resetEpoch) document.querySelector<HTMLElement>('header button[aria-label="Reset demo"]')?.focus({ preventScroll: true });
  }, [resetEpoch]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    const measure = () => { root.style.scrollPaddingTop = `${chrome.current?.getBoundingClientRect().height ?? 0}px`; };
    const observer = new ResizeObserver(measure);
    observer.observe(chrome.current!);
    measure();
    return () => { observer.disconnect(); root.style.scrollPaddingTop = previous; };
  }, []);
  useEffect(() => {
    // Only chapter navigation moves focus, never a flag, reset or field edit.
    if (tourStopIndex(pathname, hash) < 0 || hash === "#main-content") return;
    // A selected claim owns its detail focus, including on direct entry.
    const params = new URLSearchParams(search);
    if (pathname === "/pharmacy/claims" && (params.has("case") || params.has("caseId"))) return;
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) heading.tabIndex = -1;
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash, search]);
  return (
    <div className="flex min-h-screen flex-col [&_[tabindex='-1']]:scroll-mt-4">
      <div ref={chrome} className="sticky top-0 z-30">
        <TopNav onReset={() => { notification.clear(); setResetEpoch((value) => value + 1); setTourVisible(true); setDisclaimerOpen(true); }} />
        <FollowBanner />
        <TourRail visible={tourVisible} onDismiss={() => setTourVisible(false)} />
      </div>
      <section aria-label="Demonstration scope and governing principle">
      <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 md:px-6" data-disclaimer>
        <button type="button" className="rounded-sm text-left font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4" aria-expanded={disclaimerOpen} aria-controls="synthetic-disclaimer" onClick={() => setDisclaimerOpen((open) => !open)}>
          Synthetic demonstration data throughout. {disclaimerOpen ? "Hide details" : "Show details"}
        </button>
        <p id="synthetic-disclaimer" hidden={!disclaimerOpen} className="mt-2">No payments calculated or approved. Not measured NHSBSA performance.</p>
      </div>
      <p className="border-b bg-muted/30 px-4 py-3 text-xs font-medium md:px-6" data-principle>The agent gathers evidence and recommends. Deterministic code validates and calculates. A human decides.</p>
      </section>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <TooltipProvider><AssistanceTransition>
        {/* key on pathname → each route re-mounts and replays the entrance.
            Entrance-only (no AnimatePresence/exit): an exit animation around
            <Outlet/> would animate the NEXT route's content, not the leaving one. */}
        <div
          key={`${pathname}:${resetEpoch}`}
          className="flex-1 px-4 py-6 md:px-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-[6px] motion-safe:duration-150 motion-safe:ease-out"
        >
          {pathname === "/queue" && <section aria-label="Tour chapter 5" className="mx-auto mb-6 max-w-7xl rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="font-semibold">5. The queue</h2>
            <p className="mt-1 text-sm text-muted-foreground" data-tour-prose>Explore assumed workloads and shared session submissions separately. Synthetic capacity estimates are not measured performance or automatic decisions.</p>
          </section>}
          {pathname === "/pharmacy" && <p className="mx-auto mb-6 max-w-7xl rounded-lg border p-3 text-sm">4. Pharmacy example · Existing advisory mock, not a deployed integration or a shared live model.</p>}
          {pathname === "/pharmacy/claims" && <section aria-label="Tour chapter 6" className="mx-auto mb-6 max-w-7xl space-y-2 rounded-lg border p-4" data-tour-prose>
            <h2 className="font-semibold">6. What the pharmacy sees</h2>
            <p className="text-sm text-muted-foreground">{TOUR_CONTENT.chapters.find((chapter) => chapter.chapter === 6)?.prose}</p>
          </section>}
          <RouteErrorBoundary key={pathname} pathname={pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </div>
        </AssistanceTransition></TooltipProvider>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-xs text-muted-foreground md:px-6">
        <span>Session only · Synthetic cases · No payments calculated or approved</span>
        {tourVisible ? <span>Tour shortcuts: Alt + ← / → outside fields and menus</span> : <Button variant="outline" size="sm" onClick={() => setTourVisible(true)}>Restore tour</Button>}
      </footer>
    </div>
  );
}

export default AppShell;
