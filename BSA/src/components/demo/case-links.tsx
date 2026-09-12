import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

/** Existing detail/history views already supply this action. */
export function FollowItem({ id }: { id: string }) {
  const exists = useAppStore((s) => Boolean(s.lifecycles[id]));
  const followed = useAppStore((s) => s.followedCaseId === id);
  const follow = useAppStore((s) => s.followCase);
  const both = useAppStore((s) => s.perspective === "both");
  if (!exists || !both) return null;
  return <Button variant="outline" size="sm" aria-pressed={followed} onClick={() => follow(followed ? null : id)}>{followed ? "Stop following this item" : "Follow this item"}</Button>;
}