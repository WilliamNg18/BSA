import { Link } from "react-router-dom";
import { useMonthModel } from "@/hooks/use-month-model";
import { SceneEstimateNumber } from "./scene-estimate-number";
import { useAppStore } from "@/lib/store";

export function BaselineScene() {
  const { result } = useMonthModel();
  const enabled = useAppStore((s) => s.agentEnabled);
  return <section aria-label="Shared scenario estimates" className="space-y-3 rounded-xl border bg-card p-5" data-scene-estimates>
    <h2 className="font-semibold">A month of operator time · Estimates</h2>
    <p className="text-sm text-muted-foreground">Shared assumptions. Referral-subset proxy, not the real total queue. Abstentions retain full manual effort.</p>
    {result ? <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
      <div><dt>Scenario items</dt><dd data-scene-volume><SceneEstimateNumber value={result.volume} digits={0} enabled={enabled} scenario={result} /></dd></div>
      <div><dt>{enabled ? "With agent" : "Today"}: operator hours a month</dt><dd data-scene-hours><SceneEstimateNumber value={enabled ? result.withAgent.operatorHours : result.today.operatorHours} enabled={enabled} scenario={result} /></dd></div>
      <div><dt>{enabled ? "With agent" : "Today"}: items per operator a month</dt><dd data-scene-capacity><SceneEstimateNumber value={enabled ? result.capacity.withAgent : result.capacity.today} enabled={enabled} scenario={result} /></dd></div>
    </dl> : <p role="status">Scenario estimates unavailable: correct the calculator inputs.</p>}
    <p className="text-xs text-muted-foreground">Capacity assumes 6 hours a day for 21 days. {enabled ? "Built-case capacity is not a mixed-cohort guarantee." : "Manual-case capacity under these assumptions."}</p>
    <Link to="/#month" className="inline-block text-sm underline underline-offset-4">Edit scenario assumptions</Link>
  </section>;
}