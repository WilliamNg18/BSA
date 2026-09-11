import { Link } from "react-router-dom";
import { useBaselineScenario } from "@/hooks/use-baseline-scenario";
import { SceneEstimateNumber } from "./scene-estimate-number";
import { ReferralProxy } from "./referral-proxy";
import { useAppStore } from "@/lib/store";

export function BaselineScene() {
  const { result } = useBaselineScenario();
  const enabled = useAppStore((s) => s.agentEnabled);
  return <section aria-label="Shared scenario estimates" className="space-y-3 rounded-xl border bg-card p-5" data-scene-estimates>
    <h2 className="font-semibold">Estimated reference workload · Synthetic assumptions</h2>
    <p className="text-sm text-muted-foreground">Shared calculator inputs. Referred-subset proxy, not actual exceptions; judging stays fixed.</p>
    {result ? <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><dt>Scenario items</dt><dd data-scene-volume><SceneEstimateNumber value={result.volume} digits={0} enabled={enabled} scenario={result} /></dd></div>
      <div><dt>Today gathering hours</dt><dd data-scene-gathering><SceneEstimateNumber value={result.today.gatheringMinutes / 60} enabled={enabled} scenario={result} /></dd></div>
      <div><dt>Judging hours · Both sides</dt><dd data-scene-judging><SceneEstimateNumber value={result.today.judgingMinutes / 60} enabled={enabled} scenario={result} /></dd></div>
      {enabled && <>
        <div><dt>With agent gathering hours</dt><dd data-scene-with-gathering><SceneEstimateNumber value={result.withAgent.gatheringMinutes / 60} enabled={enabled} scenario={result} /></dd></div>
        <div><dt>With agent referrals · Assumed</dt><dd data-scene-referrals><SceneEstimateNumber value={result.referrals.withAgent} digits={0} enabled={enabled} scenario={result} /></dd></div>
      </>}
    </dl> : <p role="status">Scenario estimates unavailable: correct the calculator inputs.</p>}
    {enabled && result && <ReferralProxy result={result} />}
    {!enabled && <p className="text-sm">Agent Off. Assisted estimates hidden; inputs retained.</p>}
    <Link to="/#month" className="inline-block text-sm underline underline-offset-4">Edit scenario assumptions</Link>
  </section>;
}