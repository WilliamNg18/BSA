import { Link } from "react-router-dom";
import { SourceDisclosure } from "./source-disclosure";
import { BASELINE_FIELDS, formatBaselineNumber as n } from "@/lib/domain/baseline";
import { BASELINE_DEFAULTS, BASELINE_PROVENANCE as provenance, baselineDefaultCopy } from "@/lib/domain/baseline-defaults";
import { useAppStore } from "@/lib/store";

const previewCharacters = 64;

export function BaselineAssumptions({ register = false }: { register?: boolean }) {
  const draft = useAppStore((s) => s.baselineInputs);
  const copy = baselineDefaultCopy(BASELINE_DEFAULTS);
  return <details className="min-w-0 max-w-full rounded-xl border bg-card p-5 [overflow-wrap:anywhere]" data-baseline-assumptions>
    <summary className="cursor-pointer font-semibold">Calculator assumptions, sources and formula</summary>
    <div className="mt-4 min-w-0 space-y-4 text-sm">
      <p>Estimates only. Replace these assumptions with validated NHSBSA figures. Defaults are illustrative, not measured current practice or a forecast.</p>
      <ul aria-label="Calculator defaults and current inputs" className="grid gap-2 sm:grid-cols-2">
        {BASELINE_FIELDS.map(({ key, label, hint }) => <li key={key} className="min-w-0 rounded-md bg-muted/40 p-3">
          <p className="font-medium">{label}</p>
          <p>Default: {n(BASELINE_DEFAULTS[key])} · Current: <span className="break-all" data-current-input={key}>{draft[key].slice(0, previewCharacters) || "Empty (invalid)"}{draft[key].length > previewCharacters && `… (display shortened; ${n(draft[key].length)} characters. Full value retained in calculator input.)`}</span></p>
          <p className="text-muted-foreground">{hint}</p>
        </li>)}
      </ul>
      <p>{copy.volumeSource}</p>
      <p>{copy.manualAssumptions}</p>
      <ul aria-label="Synthetic default denominators" className="list-disc space-y-2 pl-5">
        <li>Seed snapshot: {provenance.queueSize} rows = {provenance.canonicalCount} canonical cases + {provenance.fillerCount} metadata-only fillers. Rates do not follow session decisions.</li>
        <li>Pharmacy proxy: {provenance.pharmacy.numerator}/{provenance.pharmacy.denominator} incoming rows ({provenance.pharmacy.ids.join(", ")}). B has an unmet date requirement; the filler explicitly lacks invoice price. Assumes these gaps could be corrected before submission, not a measured catch rate. Conflicts, unreadable items and historical decisions are not counted as catches.</li>
        <li>Rule-cleared: {provenance.cleared.numerator}/{provenance.cleared.denominator} after those candidates ({provenance.cleared.ids.join(", ")}).</li>
        <li>Abstained: {provenance.abstain.numerator}/{provenance.abstain.denominator} after pharmacy candidates and clearances ({provenance.abstain.ids.join(", ")}). Remaining rows are a scenario scaling pool, not newly built packs or invented decisions; historical F and the recorded filler remain historical.</li>
        <li>Assembly latency: {n(provenance.assembly.totalSeconds)} seconds / {provenance.assembly.denominator} active recommended packs = {n(BASELINE_DEFAULTS.assemblySeconds)} seconds/item ({provenance.assembly.ids.join(", ")}). Current synthetic engine tool durations plus mocked latency, not a stopwatch measurement. No filler engine runs.</li>
        <li>Validated rule citations: {provenance.citations.numerator}/{provenance.citations.denominator} active recommended canonical packs only. Not all decisions or all scaled built items. D has no provision; E has no rule citation or model call. Existing human records are unchanged.</li>
      </ul>
      <div className="space-y-2 rounded-md bg-muted/40 p-4" aria-label="Calculator formula">
        <p>V = whole-item volume; p, c, a = percentages / 100; g, j = gathering and judging minutes.</p>
        <p>P = round(V × p); C = round((V − P) × c); A = round((V − P − C) × a); B = V − P − C − A.</p>
        <p>P pharmacy-caught, C rule-cleared, A abstained, B built: disjoint integer cohorts summing exactly to V. Rounding is nearest integer, halves up.</p>
        <p>Today: gathering V × g; judging V × j. With agent: gathering A × g; judging (A + B) × j. Operator hours = (gathering + judging) / 60.</p>
        <p>Built expected time before decision = j + assemblySeconds / 60; abstained = g + j. No queue delay, parallelism or extra failed-assembly latency is modelled. Pharmacy-caught and rule-cleared assume no NHSBSA human touch; pharmacy effort is excluded.</p>
        <p>Assembly is machine latency, never added to operator hours or multiplied into a labour cost. Built items still require a human decision. No prices, payments, approvals or decisions are generated.</p>
      </div>
      <SourceDisclosure claimIds={[...provenance.sourceIds]} label="Calculator documentary sources" />
      <Link className="inline-block underline underline-offset-4" to={register ? "/#month" : "/assumptions"}>{register ? "Return to calculator" : "Open assumptions register"}</Link>
    </div>
  </details>;
}