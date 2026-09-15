import { useLayoutEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StateBadge, SyntheticTag } from "@/components/demo/labels";
import { pharmacyCaseLink } from "@/lib/case-links";
import type { CaseState, ExceptionCase } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { canViewPath } from "@/lib/perspective";
import { itemStateLabel } from "@/lib/domain/lifecycle";

export function CaseHeader({ c, state, title, intro }: { c: ExceptionCase; state: CaseState; title: string; intro: string }) {
  const { pathname } = useLocation();
  const container = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const perspective = useAppStore((s) => s.perspective);
  const lifecycle = useAppStore((s) => s.lifecycles[c.id]);
  useLayoutEffect(() => {
    heading.current?.focus({ preventScroll: true });
    container.current?.scrollIntoView({ block: "start", inline: "nearest", behavior: "instant" });
  }, [pathname, c.id]);
  const tabs = [
    { to: `/case/${c.id}/trace`, label: "Case-building trace" },
    { to: `/case/${c.id}`, label: "Operator case pack" },
    { to: `/case/${c.id}/record`, label: "Decision and audit record" },
    { to: pharmacyCaseLink(c.id), label: "Pharmacy view" },
  ];
  return (
    <div ref={container} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SyntheticTag>Synthetic case {c.scenario} · {c.id}</SyntheticTag>
        {lifecycle ? <span className="rounded-md border px-2 py-1 text-xs font-medium" data-item-state>{itemStateLabel(lifecycle, "pharmacy")}</span> : <StateBadge state={state} />}
        <Button asChild size="sm" variant="ghost"><Link to="/queue">Back to queue</Link></Button>
      </div>
      <h1 ref={heading} tabIndex={-1} className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">{title}</h1>
      <p className="max-w-3xl text-muted-foreground">{intro}</p>
      <nav aria-label="Case views" className="flex flex-wrap gap-1 border-b">
        {tabs.filter((t) => canViewPath(perspective, t.to)).map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-teal-700",
                active ? "border-teal-700 text-teal-800 dark:text-teal-300" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
