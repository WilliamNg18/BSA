import { Link } from "react-router-dom";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";
import { formatBaselineNumber as n } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";

export function BaselineScene() {
  const { result } = useBaselineScenario();
  const enabled = useAppStore((s) => s.agentEnabled);
  return <section aria-label="Shared scenario estimates" className="space-y-3 rounded-xl border bg-card p-5" data-scene-estimates>
    <h2 className="font-semibold">Estimated reference workload · Synthetic assumptions</h2>
    <p className="text-sm text-muted-foreground">Same inputs and arithmetic as the calculator. Referred-subset volume proxy, not actual exceptions; judging stays fixed across the comparison.</p>
    {result ? <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><dt>Scenario items</dt><dd data-scene-volume>{n(result.volume)}</dd></div>
      <div><dt>Today gathering hours</dt><dd data-scene-gathering>{n(result.today.gatheringMinutes / 60, 1)}</dd></div>
      <div><dt>Judging hours · Both sides</dt><dd data-scene-judging>{n(result.today.judgingMinutes / 60, 1)}</dd></div>
      {enabled && <>
        <div><dt>With agent gathering hours</dt><dd data-scene-with-gathering>{n(result.withAgent.gatheringMinutes / 60, 1)}</dd></div>
        <div><dt>With agent referrals · Assumed</dt><dd data-scene-referrals>{n(result.referrals.withAgent)}</dd></div>
      </>}
    </dl> : <p role="status">Scenario estimates unavailable: correct the calculator inputs.</p>}
    {!enabled && <p className="text-sm">Agent Off. Assisted estimates hidden; inputs retained.</p>}
    <Link to="/#month" className="inline-block text-sm underline underline-offset-4">Edit scenario assumptions</Link>
  </section>;
}