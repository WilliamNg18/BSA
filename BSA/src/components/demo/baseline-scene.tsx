import { Link } from "react-router-dom";
import { useProcessMonth } from "@/hooks/use-process-month";
import { useAppStore } from "@/lib/store";
import { SceneEstimateNumber } from "./scene-estimate-number";
import { ProcessFigure } from "./process-figure";

export function BaselineScene() {
  const { result } = useProcessMonth();
  const enabled = useAppStore((s) => s.agentEnabled);
  const column = result && (enabled ? result.withAgent : result.today);
  return <section aria-label="Shared scenario estimates" className="space-y-3 rounded-xl border bg-card p-5" data-scene-estimates>
    <h2 className="font-semibold">A month across the process</h2>
    <p className="text-sm text-muted-foreground">Shared scenario, not observed activity. Staff streams can overlap; automatically priced items never enter an operator queue.</p>
    {result && column ? <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
      {([
        ["monthlyItems", "Items a month", result.counts.monthlyItems],
        ["autoPricedItems", "Priced automatically, no person involved", result.counts.autoPricedItems],
        ["type1Items", "Items reaching Type 1 capture", result.counts.type1Items],
        ["type2Items", "Items reaching Type 2 judgement", result.counts.type2Items],
        ["referredBackItems", `${enabled ? "With the agent" : "Today"}: referred-back items`, column.referredBackItems],
        ["referralOperatorHours", `${enabled ? "With the agent" : "Today"}: referral operator hours`, column.referralOperatorHours],
      ] as const).map(([key, label, value]) => <div key={key}><dt>{label}</dt><dd className="mt-1 text-xl font-semibold" data-scene-metric={key}>
        <ProcessFigure source="Assumption" label={label} explanation="Shared process model using editable public-derived defaults and assumptions. Lane counts overlap; referral hours are not additive with Type 2 hours.">
          <SceneEstimateNumber value={value} enabled={enabled} scenario={result} />
        </ProcessFigure>
      </dd></div>)}
    </dl> : <p role="status">Scenario estimates unavailable: correct the calculator inputs.</p>}
    <Link to="/#month" className="inline-block text-sm underline underline-offset-4">Edit scenario assumptions</Link>
  </section>;
}
