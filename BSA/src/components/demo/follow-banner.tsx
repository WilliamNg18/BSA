import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { pharmacyCaseLink } from "@/lib/case-links";
import { LIFECYCLE_LABELS } from "@/lib/domain/lifecycle";
import { useAppStore } from "@/lib/store";

export function FollowBanner() {
  const row = useAppStore((s) => s.followedCaseId ? s.lifecycles[s.followedCaseId] : undefined);
  const enabled = useAppStore((s) => s.agentEnabled);
  const follow = useAppStore((s) => s.followCase);
  const both = useAppStore((s) => s.perspective === "both");
  if (!row || !both) return null;
  const labels = LIFECYCLE_LABELS[row.state];
  return <section aria-label="Followed item" className="border-b bg-muted px-3 py-2 text-xs md:px-6">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2">
      <strong className="break-all">Following {row.caseId}</strong>
      <dl aria-live="polite" className="flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-1">
        <div><dt className="font-semibold">Pharmacy</dt><dd>{labels.pharmacy}</dd></div>
        <div><dt className="font-semibold">NHSBSA</dt><dd>{labels.nhsbsa[enabled ? "on" : "off"]}</dd></div>
      </dl>
      <nav aria-label="Switch side" className="flex flex-wrap gap-3">
        <Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2" to={pharmacyCaseLink(row.caseId)}>Switch side: Pharmacy</Link>
        <Link className="rounded-sm underline underline-offset-4 focus-visible:outline-2" to={`/case/${row.caseId}`}>Switch side: NHSBSA</Link>
      </nav>
      <Button variant="ghost" size="sm" aria-label="Dismiss followed item" onClick={() => {
        follow(null);
        document.getElementById("main-content")?.focus({ preventScroll: true });
      }}>Dismiss</Button>
    </div>
  </section>;
}