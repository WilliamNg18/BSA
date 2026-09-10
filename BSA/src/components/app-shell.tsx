import { useEffect, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { AssistanceTransition } from "@/components/demo/assistance-transition";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { TopNav } from "@/components/demo/top-nav";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { TourRail } from "@/components/demo/tour-rail";
import { Button } from "@/components/ui/button";
import { NhsbsaViewLink } from "@/components/demo/case-links";
import { FollowBanner } from "@/components/demo/follow-banner";

// Minimal app shell — provides only the layout frame: it owns the single
// `min-h-screen`, mounts the <Toaster/>, and plays a subtle entrance on each
// route. It deliberately ships NO navigation chrome. Decide per app what fits:
//   • a top navbar  → add a sticky <header> above <main> with <Link>s,
//   • a sidebar     → replace <main> with `SidebarInset`; never render both,
//   • or nothing    → single-screen / focused apps often need no nav at all.
// When you add nav, map over `routes` from `@/routes` so route + nav stay in sync.
// Pages fill <main flex-1> with `h-full`; never add `min-h-screen` inside a page.
export function AppShell() {
  const { pathname, hash } = useLocation();
  const [searchParams] = useSearchParams();
  const reduced = useReducedMotion();
  const [tourVisible, setTourVisible] = useState(true);
  const [disclaimerOpen, setDisclaimerOpen] = useState(true);
  const [resetEpoch, setResetEpoch] = useState(0);
  useEffect(() => {
    // The pharmacy substop, queue and claims chapters have no fragment. Only
    // location changes move focus; edits, flag changes and reset keep control focus.
    if ((!hash && pathname !== "/pharmacy" && pathname !== "/queue" && pathname !== "/pharmacy/claims") || hash === "#main-content") return;
    const heading = document.querySelector<HTMLElement>("[data-tour-heading]");
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav onReset={() => { setResetEpoch((value) => value + 1); setTourVisible(true); setDisclaimerOpen(true); }} />
      <TourRail visible={tourVisible} onDismiss={() => setTourVisible(false)} />
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
        <motion.div
          key={`${pathname}:${resetEpoch}`}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.15, ease: "easeOut" }}
          className="flex-1 px-4 py-6 md:px-6"
        >
          {pathname === "/queue" && <section aria-label="Tour chapter 5" className="mx-auto mb-6 max-w-7xl rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="font-semibold">5. The queue · Simulation planned</h2>
            <p className="mt-1 text-sm text-muted-foreground" data-tour-prose>Explore the synthetic queue. Workload simulation remains planned; no measured capacity or savings result is implied.</p>
          </section>}
          {pathname === "/pharmacy" && <p className="mx-auto mb-6 max-w-7xl rounded-lg border p-3 text-sm">4. Pharmacy example · Existing advisory mock, not a deployed integration or a shared live model.</p>}
          {pathname === "/pharmacy/claims" && <section aria-label="Tour chapter 6" className="mx-auto mb-6 max-w-7xl space-y-3 rounded-lg border border-dashed bg-muted/30 p-4">
            <h2 className="font-semibold">6. What the pharmacy sees · Existing claims mock, not a deployed integration.</h2>
            {searchParams.get("case") ? (
              <>
                <FollowBanner caseId={searchParams.get("case")!} />
                <NhsbsaViewLink caseId={searchParams.get("case")!} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground" data-tour-prose>Open a case from the queue to see its pharmacy-side claim here.</p>
            )}
          </section>}
          <RouteErrorBoundary key={pathname} pathname={pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </motion.div>
        </AssistanceTransition></TooltipProvider>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-xs text-muted-foreground md:px-6">
        <span>Session only · Synthetic cases · No payments calculated or approved</span>
        {tourVisible ? <span>Tour shortcuts: Alt + ← / → outside fields and menus</span> : <Button variant="outline" size="sm" onClick={() => setTourVisible(true)}>Restore tour</Button>}
      </footer>
      <Toaster />
    </div>
  );
}

export default AppShell;
