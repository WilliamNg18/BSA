import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { canViewPath, PERSPECTIVES, perspectiveForPath } from "@/lib/perspective";
import { useAppStore } from "@/lib/store";

export function PerspectiveGuard({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const perspective = useAppStore((s) => s.perspective);
  const setPerspective = useAppStore((s) => s.setPerspective);
  const restoring = useRef(false);
  const content = useRef<HTMLDivElement>(null);
  const side = perspectiveForPath(pathname);
  const allowed = canViewPath(perspective, pathname) || !side;
  const [visitedPath, setVisitedPath] = useState<string | null>(allowed ? pathname : null);
  useEffect(() => { if (allowed) setVisitedPath(pathname); }, [allowed, pathname]);
  useLayoutEffect(() => {
    if (!allowed || !restoring.current) return;
    restoring.current = false;
    const heading = content.current?.querySelector<HTMLElement>("h1");
    if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }, [allowed, pathname]);

  return <>
    {!allowed && side && <section aria-label="Other perspective" className="mx-auto max-w-3xl space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">This view belongs to the other side; switch perspective to see it</h1>
      <Button onClick={() => { restoring.current = true; setPerspective(side); }}>
        Switch to {PERSPECTIVES.find((item) => item.value === side)?.label}
      </Button>
    </section>}
    {/* Perspective hides an opened form without discarding its unsaved draft. */}
    <div ref={content} hidden={!allowed} inert={!allowed}>
      {(allowed || visitedPath === pathname) && children}
    </div>
  </>;
}
