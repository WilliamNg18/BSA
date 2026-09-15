import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { itemStateLabel } from "@/lib/domain/lifecycle";
import { endFollowVisit, visitFollowedCase, type FollowSide } from "@/lib/follow-navigation";
import { followedChannel, followedLastEvent, followedLocation } from "@/lib/follow-presentation";
import { useAppStore } from "@/lib/store";

export function FollowBanner() {
  const row = useAppStore((s) => s.followedCaseId ? s.lifecycles[s.followedCaseId] : undefined);
  const process = useAppStore((s) => s.followedCaseId ? s.itemProcesses[s.followedCaseId] : undefined);
  const revision = useAppStore((s) => s.followedCaseId ? s.caseRevisions[s.followedCaseId]?.at(-1) : undefined);
  const enabled = useAppStore((s) => s.agentEnabled);
  const follow = useAppStore((s) => s.followCase);
  const perspective = useAppStore((s) => s.perspective);
  const temporary = useAppStore((s) => s.temporaryFollowVisit);
  const navigate = useNavigate();
  if (!row) return null;
  const visit = (side: FollowSide) => navigate(visitFollowedCase(side));
  const sides = perspective === "both" ? ["pharmacy", "nhsbsa"] as const : [perspective];
  return <section aria-label="Followed item" className="border-b bg-muted px-6 py-2 text-xs">
    <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1">
      <strong>Following {row.caseId} | {followedChannel(row, process, revision)}</strong>
      <dl aria-live="polite" className="flex min-w-0 gap-x-4">
        {sides.map((side) => <div key={side}>
          <dt className="font-semibold">{side === "pharmacy" ? "Pharmacy" : "NHSBSA"}</dt>
          <dd>{itemStateLabel(row, side, enabled, process)}</dd>
        </div>)}
        <div><dt className="font-semibold">Now</dt><dd>{followedLocation(row, process)}</dd></div>
      </dl>
      <nav aria-label="Followed item views" className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => visit("pharmacy")}>Pharmacy view</Button>
        <Button variant="outline" size="sm" onClick={() => visit("nhsbsa")}>NHSBSA view</Button>
        <Button variant="ghost" size="sm" aria-label="Dismiss followed item" onClick={() => {
          endFollowVisit();
          follow(null);
          document.getElementById("main-content")?.focus({ preventScroll: true });
        }}>Dismiss</Button>
      </nav>
      <p className="col-span-3" aria-live="polite">{followedLastEvent(row)}</p>
      {temporary?.caseId === row.caseId && perspective === "both" && <p role="status" className="col-span-3">
        Both temporarily shown. {temporary.origin === "pharmacy" ? "Pharmacy" : "NHSBSA"} view restores your perspective; choosing a perspective keeps your choice.
      </p>}
    </div>
  </section>;
}