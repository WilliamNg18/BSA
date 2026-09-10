import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";

// Shell only: reads followedCaseId to show whether this case is currently
// followed. The switch is disabled until Task 10 wires the live round trip
// (followCase); today the store method throws "not implemented" by contract.
export function FollowBanner({ caseId }: { caseId: string }) {
  const followedCaseId = useAppStore((s) => s.followedCaseId);
  const following = followedCaseId === caseId;
  const switchId = `follow-switch-${caseId}`;
  const noteId = `follow-switch-note-${caseId}`;
  return (
    <div
      data-follow-banner
      role="group"
      aria-label="Follow this item"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3 text-sm"
    >
      <p>Follow this item to keep the pharmacy and NHSBSA views in step.</p>
      <div className="flex items-center gap-2">
        <Label htmlFor={switchId} className="text-xs font-medium">Switch side</Label>
        <Switch id={switchId} checked={following} disabled aria-describedby={noteId} />
        <span id={noteId} className="sr-only">Arrives with the live round trip.</span>
      </div>
    </div>
  );
}
