import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StateBadge, SyntheticTag } from "@/components/demo/labels";
import { PharmacyViewLink } from "@/components/demo/case-links";
import { FollowBanner } from "@/components/demo/follow-banner";
import type { CaseState, ExceptionCase } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export function CaseHeader({ c, state, title, intro }: { c: ExceptionCase; state: CaseState; title: string; intro: string }) {
  const { pathname } = useLocation();
  const tabs = [
    { to: `/case/${c.id}/trace`, label: "Case-building trace" },
    { to: `/case/${c.id}`, label: "Operator case pack" },
    { to: `/case/${c.id}/record`, label: "Decision and audit record" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SyntheticTag>Synthetic case {c.scenario} · {c.id}</SyntheticTag>
        <StateBadge state={state} />
        <Button asChild size="sm" variant="ghost"><Link to="/queue">Back to queue</Link></Button>
        <PharmacyViewLink caseId={c.id} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-3xl text-muted-foreground">{intro}</p>
      <FollowBanner caseId={c.id} />
      <nav aria-label="Case views" className="flex flex-wrap gap-1 border-b">
        {tabs.map((t) => {
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
