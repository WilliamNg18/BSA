import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_STEPS, getDemoStep } from "@/lib/domain/demo-steps";
import { demoRouteCaseId, navigateDemoStep } from "@/lib/demo-navigation";
import { isTourShortcut } from "@/lib/tour-navigation";
import { useAppStore } from "@/lib/store";

export function DemoStrip() {
  const number = useAppStore((s) => s.demoStep);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const processes = useAppStore((s) => s.itemProcesses);
  const followedCaseId = useAppStore((s) => s.followedCaseId);
  const [error, setError] = useState("");
  function go(step: number) {
    try {
      navigateDemoStep(step, navigate);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo navigation failed.");
    }
  }
  useEffect(() => {
    if (number === null) return;
    function shortcut(event: KeyboardEvent) {
      if (!isTourShortcut(event)) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable], [role="menu"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      const current = useAppStore.getState().demoStep;
      if (current === null) return;
      const next = current + (event.key === "ArrowRight" ? 1 : -1);
      event.preventDefault();
      if (next < 1 || next > DEMO_STEPS.length) return;
      try { navigateDemoStep(next, navigate); setError(""); }
      catch (err) { setError(err instanceof Error ? err.message : "Demo navigation failed."); }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [number, navigate]);
  const step = number === null ? null : getDemoStep(number);
  const routeCase = demoRouteCaseId(pathname, search);
  const selectedCase = routeCase && (step?.number === 8 || step?.number === 10 || routeCase === followedCaseId) ? routeCase : step?.caseId;
  const channel = selectedCase ? processes[selectedCase]?.channel ?? step?.channel : step?.channel;
  return <nav aria-label="Demo mode" data-testid="demo-strip" className="border-b bg-background px-6">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 py-2">
      {step ? <>
        <Button variant="outline" size="sm" disabled={step.number === 1} aria-keyshortcuts="Alt+ArrowLeft" onClick={() => go(step.number - 1)}><ArrowLeft aria-hidden="true" />Back</Button>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-sm font-semibold" data-demo-step-title>{step.number} / {DEMO_STEPS.length} · {step.title}</p>
          <p className="text-xs text-muted-foreground" data-demo-step-case>{selectedCase ?? "Whole process"} · {channel === "eps" ? "EPS" : channel === "paper" ? "Paper" : "EPS and paper"}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium">Jump
          <select aria-label="Jump to demo step" value={step.number} onChange={(event) => go(Number(event.target.value))} className="max-w-64 rounded-md border bg-background p-2 text-sm">
            {DEMO_STEPS.map((item) => <option key={item.number} value={item.number}>{item.number}. {item.title}</option>)}
          </select>
        </label>
        <Button size="sm" disabled={step.number === DEMO_STEPS.length} aria-keyshortcuts="Alt+ArrowRight" onClick={() => go(step.number + 1)}>Next<ArrowRight aria-hidden="true" /></Button>
        <Button size="sm" variant="outline" onClick={() => {
          useAppStore.getState().setDemoStep(null);
          setError("");
          document.getElementById("main-content")?.focus({ preventScroll: true });
        }}>Exit demo</Button>
      </> : <>
        <div className="flex-1 text-sm"><strong>Eleven steps, one case at a time.</strong> Compare today with proposed assistance.</div>
        <Button onClick={() => go(1)}>Enter demo mode</Button>
      </>}
    </div>
    {error && <p role="alert" className="pb-2 text-sm text-destructive">{error}</p>}
  </nav>;
}
