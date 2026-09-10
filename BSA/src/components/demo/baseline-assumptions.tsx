import { Link } from "react-router-dom";
import { BASELINE_FIELDS, formatBaselineNumber as n, BASELINE_DEFAULTS, baselineDefaultCopy } from "@/lib/domain/baseline";
import { BASELINE_PROVENANCE as provenance } from "@/lib/domain/baseline-defaults";
import { useAppStore } from "@/lib/store";

const previewCharacters = 64;

export function BaselineAssumptions({ register = false }: { register?: boolean }) {
  const draft = useAppStore((s) => s.baselineInputs);
  const copy = baselineDefaultCopy(BASELINE_DEFAULTS);
  return <details className="min-w-0 max-w-full rounded-xl border bg-card p-5 [overflow-wrap:anywhere]" data-baseline-assumptions>
    <summary className="cursor-pointer font-semibold">Calculator assumptions and formula</summary>
    <div className="mt-4 min-w-0 space-y-4 text-sm">
      <p>Estimates only. Replace these assumptions with validated NHSBSA figures. Defaults are illustrative, not measured current practice or a forecast.</p>
      <ul aria-label="Calculator defaults and current inputs" className="grid gap-2 sm:grid-cols-2">
        {BASELINE_FIELDS.map(({ key, label, hint }) => <li key={key} className="min-w-0 rounded-md bg-muted/40 p-3">
          <p className="font-medium">{label}</p>
          <p>Default: {n(BASELINE_DEFAULTS[key])} · Current: <span className="break-all" data-current-input={key}>{draft[key].slice(0, previewCharacters) || "Empty (invalid)"}{draft[key].length > previewCharacters && `… (display shortened; ${n(draft[key].length)} characters. Full value retained in calculator input.)`}</span></p>
          <p className="text-muted-foreground">{hint}</p>
        </li>)}
      </ul>
      <section data-prose="volume qualification"><h2 className="font-semibold">Volume qualification</h2><p>{copy.volumeContext}</p></section>
      <section data-prose="timing assumptions"><h2 className="font-semibold">Timing assumptions</h2><p>{copy.manualAssumptions}</p></section>
      <ul aria-label="Synthetic default denominators" className="list-disc space-y-2 pl-5">
        <li>Seed snapshot: {provenance.queueSize} rows = {provenance.canonicalCount} canonical cases + {provenance.fillerCount} metadata-only fillers. Rates do not follow session decisions.</li>
        <li><h3 className="font-medium">Pharmacy proxy: {provenance.pharmacy.numerator}/{provenance.pharmacy.denominator} incoming rows</h3><dl><dt>Candidate IDs</dt><dd>{provenance.pharmacy.ids.join(", ")}</dd><dt>Missing requirements</dt><dd>B: date; filler: invoice price</dd><dt>Excluded</dt><dd>Conflicts, unreadable items, historical decisions</dd></dl><p>Assumes correction before submission; not a measured catch rate.</p></li>
        <li>Rule-cleared: {provenance.cleared.numerator}/{provenance.cleared.denominator} after those candidates ({provenance.cleared.ids.join(", ")}).</li>
        <li><h3 className="font-medium">Abstained: {provenance.abstain.numerator}/{provenance.abstain.denominator} after candidates and clearances</h3><dl><dt>IDs</dt><dd>{provenance.abstain.ids.join(", ")}</dd></dl><p>Remaining rows scale the scenario, not new packs or decisions. Historical F and the recorded filler remain historical.</p></li>
        <li><h3 className="font-medium">Assembly latency</h3><dl><dt>Synthetic arithmetic</dt><dd>{n(provenance.assembly.totalSeconds)} seconds / {provenance.assembly.denominator} = {n(BASELINE_DEFAULTS.assemblySeconds)} seconds/item</dd><dt>Active packs</dt><dd>{provenance.assembly.ids.join(", ")}</dd></dl><p>Engine tool durations plus mocked latency, not stopwatch measurements. No filler engine runs.</p></li>
        <li><h3 className="font-medium">Validated rule citations: {provenance.citations.numerator}/{provenance.citations.denominator} active recommended packs</h3><p>Not all decisions or scaled items. D has no provision; E has no citation or model call. Human records remain unchanged.</p></li>
      </ul>
      <div className="space-y-2 rounded-md bg-muted/40 p-4" aria-label="Calculator formula">
        <h2 className="font-semibold">Calculator formula</h2>
        <dl className="space-y-3">
          <div><dt>Inputs</dt><dd>V: whole items; p/c/a: percentages ÷ 100; g: seven-step minutes; j: judging minutes; r: built review minutes</dd></div>
          <div><dt>Sequential cohorts</dt><dd>P = round(V × p); C = round((V − P) × c); A = round((V − P − C) × a); B = V − P − C − A</dd></div>
          <div><dt>Rounding</dt><dd>Nearest integer, halves up; disjoint P + C + A + B = V</dd></div>
          <div><dt>Gathering hours</dt><dd>Today = V × g / 60; With agent = (A × g + B × r) / 60</dd></div>
          <div><dt>Judging hours, both sides</dt><dd>V × j / 60</dd><dd><p>Fixed reference-cohort comparison assumption, not avoided judgement. Reference operator hours combine gathering and judging.</p></dd></div>
          <div><dt>Referrals</dt><dd>Today = V; With agent = round(B × deficientBuiltPercent / 100) + round(A × deficientAbstainPercent / 100)</dd><dd><p>Referred-subset proxy, not total exceptions. Editable deficiency shares are synthetic assumptions, not canonical outcomes or measured effectiveness.</p></dd></div>
          <div><dt>First-time endorsement accuracy proxy</dt><dd>(V − assisted referrals) / V × 100; bounded 0–100; undefined when V = 0</dd><dd><p>Referral-free share, not actual accuracy, endorsement correctness or a pricing-accuracy target.</p></dd></div>
          <div><dt>Expected minutes before decision</dt><dd>Built = r + j + assemblySeconds / 60; abstained = g + j</dd><dd><p>No queue delay, parallelism or extra failed-assembly latency. Pharmacy-caught and rule-cleared assume no NHSBSA human touch; reference judging stays fixed.</p></dd></div>
          <div><dt>Excluded effort</dt><dd>Pharmacy work; machine latency from labour hours and costs</dd><dd><p>Pharmacy avoidance is count-only, not causal net-time savings. Humans decide; no prices, payments, approvals or decisions are generated.</p></dd></div>
        </dl>
      </div>
      <Link className="inline-block underline underline-offset-4" to={register ? "/#month" : "/assumptions"}>{register ? "Return to calculator" : "Open assumptions register"}</Link>
    </div>
  </details>;
}