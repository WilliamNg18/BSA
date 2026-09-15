import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AssistanceTransition } from "@/components/demo/assistance-transition";
import { CompactTooltipProvider as TooltipProvider } from "@/components/ui/compact-tooltip";
import { useNotification } from "@/hooks/use-notification";
import { TopNav } from "@/components/demo/top-nav";
import { HeaderOutcome } from "@/components/demo/header-outcome";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { DemoStrip } from "@/components/demo/demo-strip";
import { DemoStepLayout } from "@/components/demo/step-layouts";
import { PharmacySubmissionPanel } from "@/components/demo/pharmacy-workbench";
import { PharmacyClaimActionPanel } from "@/components/demo/claim-detail";
import { OperatorActionPanel } from "@/components/demo/operator-action-panel";
import { Type1Capture, Type1CaptureEvidence } from "@/components/demo/type1-capture";
import { cn } from "@/lib/utils";
import { FollowBanner } from "@/components/demo/follow-banner";
import { TOUR_STOPS, tourStopIndex } from "@/lib/tour-navigation";
import { TOUR_CONTENT } from "@/lib/domain/public-facts";
import { PerspectiveGuard } from "@/components/demo/perspective-guard";
import { useAppStore } from "@/lib/store";

// Measure the whole sticky stack so focus stays clear of its current height.
export function AppShell() {
  const { pathname, hash, search } = useLocation();
  const chrome = useRef<HTMLDivElement>(null);
  const notification = useNotification();
  const [resetEpoch, setResetEpoch] = useState(0);
  const both = useAppStore((s) => s.perspective === "both");
  const demoStep = useAppStore((s) => s.demoStep);
  const tourStop = TOUR_STOPS[tourStopIndex(pathname, hash)];
  useEffect(() => {
    // Child detail views may focus on mount; a reset must keep its invoking control.
    if (resetEpoch) document.querySelector<HTMLElement>('header button[aria-label="Reset demo"]')?.focus({ preventScroll: true });
  }, [resetEpoch]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    const previousHeight = root.style.getPropertyValue("--app-chrome-height");
    const measure = () => {
      const height = `${chrome.current?.getBoundingClientRect().height ?? 0}px`;
      root.style.scrollPaddingTop = height;
      root.style.setProperty("--app-chrome-height", height);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(chrome.current!);
    measure();
    return () => {
      observer.disconnect();
      root.style.scrollPaddingTop = previous;
      if (previousHeight) root.style.setProperty("--app-chrome-height", previousHeight);
      else root.style.removeProperty("--app-chrome-height");
    };
  }, []);
  useEffect(() => {
    if (demoStep !== null) return;
    // Only chapter navigation moves focus, never a flag, reset or field edit.
    if (tourStopIndex(pathname, hash) < 0 || hash === "#main-content") return;
    // A selected claim owns its detail focus, including on direct entry.
    const params = new URLSearchParams(search);
    if (pathname === "/pharmacy/claims" && (params.has("case") || params.has("caseId"))) return;
    const heading = document.querySelector<HTMLElement>("main h1");
    if (heading) heading.tabIndex = -1;
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash, search, demoStep]);
  return (
    <div className="flex min-h-screen flex-col [&_[tabindex='-1']]:scroll-mt-4">
      <div ref={chrome} className="sticky top-0 z-30">
        <TopNav onReset={() => { notification.clear(); setResetEpoch((value) => value + 1); }} />
        <HeaderOutcome />
        <FollowBanner />
        <DemoStrip />
      </div>
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        <TooltipProvider><AssistanceTransition>
        {/* key on pathname → each route re-mounts and replays the entrance.
            Entrance-only (no AnimatePresence/exit): an exit animation around
            <Outlet/> would animate the NEXT route's content, not the leaving one. */}
        <div
          key={`${pathname}:${resetEpoch}`}
          className={cn("flex-1 px-6 motion-safe:animate-in motion-safe:slide-in-from-bottom-[6px] motion-safe:duration-150 motion-safe:ease-out", demoStep === null ? "py-6" : "py-3")}
        >
          {demoStep === null && both && pathname === "/queue" && <section aria-label={`Tour chapter ${tourStop.chapter}`} className="mx-auto mb-6 max-w-7xl rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="font-semibold">{tourStop.chapter}. {tourStop.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground" data-tour-prose>Explore assumed workloads and shared session submissions separately. Synthetic capacity estimates are not measured performance or automatic decisions.</p>
          </section>}
          {demoStep === null && both && pathname === "/pharmacy" && <p className="mx-auto mb-6 max-w-7xl rounded-lg border p-3 text-sm">{tourStop.chapter}. {tourStop.label} · Existing advisory mock, not a deployed integration or a shared live model.</p>}
          {demoStep === null && both && pathname === "/pharmacy/claims" && <section aria-label={`Tour chapter ${tourStop.chapter}`} className="mx-auto mb-6 max-w-7xl space-y-2 rounded-lg border p-4" data-tour-prose>
            <h2 className="font-semibold">{tourStop.chapter}. {tourStop.label}</h2>
            <p className="text-sm text-muted-foreground">{TOUR_CONTENT.chapters.find((chapter) => chapter.chapter === tourStop.chapter)?.prose}</p>
          </section>}
          <RouteErrorBoundary key={pathname} pathname={pathname}>
            {demoStep === null ? <PerspectiveGuard><Outlet /></PerspectiveGuard> : <DemoStepLayout
              renderType1Evidence={(caseId) => <Type1CaptureEvidence caseId={caseId} />}
              renderTask={({ kind, caseId, allowCorrection, channel, evidencePlacement }) => {
              if (kind === "operator") return <OperatorActionPanel caseId={caseId} compact />;
              if (kind === "type1") return <Type1Capture caseId={caseId} compact evidencePlacement={evidencePlacement} />;
              if (kind === "claim") return <PharmacyClaimActionPanel caseId={caseId} />;
              return <PharmacySubmissionPanel caseId={caseId} channel={channel ?? undefined} controls={allowCorrection ? "correct-and-submit" : "submit"} />;
            }} />}
          </RouteErrorBoundary>
        </div>
        </AssistanceTransition></TooltipProvider>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-4 text-xs text-muted-foreground px-6">
        <span>All data is synthetic</span>
        <span>Session only · No payments calculated or approved</span>
        {demoStep !== null && <span>Demo shortcuts: Alt + ← / → outside fields and menus</span>}
      </footer>
    </div>
  );
}

export default AppShell;
