import { useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { canViewPath, PERSPECTIVES, perspectiveForPath } from "@/lib/perspective";
import { useAppStore } from "@/lib/store";

export function PerspectiveGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const perspective = useAppStore((s) => s.perspective);
  const setPerspective = useAppStore((s) => s.setPerspective);
  const restoring = useRef(false);
  const side = perspectiveForPath(pathname);
  if (canViewPath(perspective, pathname) || !side) {
    return <div ref={(element) => {
      if (!element || !restoring.current) return;
      restoring.current = false;
      const heading = element.querySelector<HTMLElement>("h1");
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    }}>{children}</div>;
  }
  return <section aria-label="Other perspective" className="mx-auto max-w-3xl space-y-4 rounded-xl border bg-card p-6">
    <h1 className="text-2xl font-semibold">This view belongs to the other side; switch perspective to see it</h1>
    <Button onClick={() => { restoring.current = true; setPerspective(side); }}>
      Switch to {PERSPECTIVES.find((item) => item.value === side)?.label}
    </Button>
  </section>;
}
