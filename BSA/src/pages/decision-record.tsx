import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageSection } from "@/components/page-section";
import { EmptyState, ErrorState } from "@/components/states";
import { CaseHeader } from "@/components/demo/case-header";
import { BoundaryTag, KeyValue, RecommendationBadge, StatusDot } from "@/components/demo/labels";
import { runAgent } from "@/lib/domain/agent";
import { caseById } from "@/lib/domain/cases";
import { TARIFF_VERSIONS } from "@/lib/domain/tariff";
import { useAppStore } from "@/lib/store";
import { agentVersionLabel } from "@/lib/service-display";
import { MissingAssistedSlots } from "@/components/demo/case-presentation";

// Auditability and reconstructability, shown plainly: what was used, which rule
// version, which agent version, which checks, what was recommended, what the
// person decided and why. Replay re-runs the pack under a chosen Tariff version
// so the effect of the monthly change is visible.

export function DecisionRecordPage() {
  const { id } = useParams();
  return <DecisionRecordContent key={id} />;
}

function DecisionRecordContent() {
  const { id } = useParams();
  const c = caseById(id);
  const state = useAppStore((s) => (id ? s.caseStates[id] : undefined));
  const allRecords = useAppStore((s) => s.records);
  const records = useMemo(() => allRecords.filter((r) => r.caseId === id), [allRecords, id]);
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const [replayVersion, setReplayVersion] = useState<string>("");
  const pack = useMemo(() => (c ? runAgent(c, { agentEnabled }) : null), [c, agentEnabled]);
  const replay = useMemo(() => (c && agentEnabled && replayVersion ? runAgent(c, { agentEnabled, tariffVersion: replayVersion }) : null), [c, replayVersion, agentEnabled]);

  if (!c || !pack || !state) {
    return <ErrorState title="Case not found" description="Choose a case from the exception queue." action={<Button asChild variant="outline"><Link to="/queue">Go to the queue</Link></Button>} />;
  }

  const latest = records[records.length - 1];
  const hasRecordedRule = Boolean(latest && TARIFF_VERSIONS.some((v) => v.version === latest.tariffVersion));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <CaseHeader
        c={c}
        state={state}
        title={`Decision and audit record: ${c.title}`}
        intro="Review evidence, versions, checks and the recorded human decision. Replay compares synthetic rule versions without changing history."
      />

      {!agentEnabled && <><MissingAssistedSlots />{!latest && <section className="space-y-2 rounded-xl border p-4">
        <Button type="button" disabled>Replay unavailable</Button>
        <p className="text-sm text-muted-foreground">No recorded rule version to replay in this manual comparison</p>
      </section>}</>}
      {!latest ? (
        <EmptyState
          icon={History}
          title="No human decision recorded yet"
          description="Record a human decision from the case pack to complete the session audit."
          action={<Button asChild className="bg-teal-700 text-white hover:bg-teal-800"><Link to={`/case/${c.id}`}>Open the case pack</Link></Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <PageSection title={`Record ${latest.id}`} description={`Written ${latest.timestamp.replace("T", " ")} · append-only · ${latest.synthetic ? "synthetic" : ""}`}>
            <dl className="grid gap-2">
              {agentEnabled && <>
              <KeyValue k="Inputs considered" v={<ul className="list-disc pl-4">{latest.inputs.map((i) => <li key={i}>{i}</li>)}</ul>} />
              <KeyValue k="Evidence accessed" v={<ul>{latest.sources.map((origin) => <li key={origin}>{origin}</li>)}</ul>} />
              <KeyValue k="Rule version used" v={hasRecordedRule ? `Drug Tariff ${latest.tariffVersion}` : "Not recorded"} />
              <KeyValue k="Agent version" v={agentVersionLabel(latest.agentVersion)} />
              <KeyValue
                k="Deterministic checks completed"
                v={
                  <ul className="space-y-1">
                    {latest.checks.map((k) => (
                      <li key={k.name} className="flex items-start gap-2"><StatusDot status={k.pass ? "ok" : "fail"} label="" /><span>{k.name}: {k.detail}</span></li>
                    ))}
                  </ul>
                }
              />
              <KeyValue k="Agent recommendation" v={<RecommendationBadge rec={latest.recommendation} className="text-xs" />} />
              </>}
              <KeyValue k="Human decision" v={<span className="inline-flex items-center gap-2"><BoundaryTag cls="human" short /> {latest.decision.replace("_", " ")} by {latest.operator}</span>} />
              <KeyValue k="Reason" v={latest.overrideReason || "Not recorded"} />
              <KeyValue k="Override" v={latest.isOverride ? `Yes. Reason: ${latest.overrideReason ?? "none given"}` : latest.overrideReason ? `No. Note: ${latest.overrideReason}` : "No"} />
              <KeyValue k="Timestamp" v={latest.timestamp.replace("T", " ")} />
            </dl>
            {latest.recommendation === "NONE" && latest.isOverride && <section data-prose="stored override caveat"><p className="mt-3 text-xs text-muted-foreground">No agent recommendation existed. The stored override flag is retained; correcting this counter requires Stream B integration.</p></section>}
            {!agentEnabled && hasRecordedRule && <section data-prose="historical comparison caveat"><p className="mt-3 text-xs text-muted-foreground">This historical record retains rule {latest.tariffVersion} and assisted fields. Only the manual comparison omits them; history is unchanged.</p></section>}
            {records.length > 1 && <p className="text-xs text-muted-foreground">{records.length} records exist for this case; the latest is shown. Earlier records are never altered.</p>}
          </PageSection>

          <PageSection title="Replay under a different rule version" description="Counterfactual replay; original evidence and history remain unchanged.">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="replay-version" className="text-sm">Replay with</label>
                <Select value={replayVersion} onValueChange={setReplayVersion} disabled={!agentEnabled || !hasRecordedRule}>
                  <SelectTrigger id="replay-version" className="w-56"><SelectValue placeholder="Choose a Tariff version" /></SelectTrigger>
                  <SelectContent>
                    {TARIFF_VERSIONS.map((v) => (
                      <SelectItem key={v.version} value={v.version}>{v.label} ({v.version})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {agentEnabled && replayVersion && <Button type="button" variant="ghost" size="sm" onClick={() => setReplayVersion("")}>Clear</Button>}
              </div>
              {!agentEnabled || !hasRecordedRule ? <p className="text-sm text-muted-foreground">{hasRecordedRule
                ? "Replay disabled in this manual comparison. The historical rule version is preserved; enable assistance to inspect it."
                : "No recorded rule version to replay in this manual comparison"}</p> : replay ? (
                <Card className={replay.recommendation !== latest.recommendation ? "border-amber-600" : "border-emerald-600"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Replayed under {replay.tariffLabel}</CardTitle>
                    <CardDescription>{TARIFF_VERSIONS.find((v) => v.version === replayVersion)?.changeNote}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {replay.gate.result === "FAIL" && <p>Recommendation withheld by the compliance gate. Evidence only; gate FAIL.</p>}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md bg-muted/50 p-2.5">
                        <p className="text-xs text-muted-foreground">Recorded ({latest.tariffVersion})</p>
                        <RecommendationBadge rec={latest.recommendation} className="mt-1 text-xs" />
                      </div>
                      <div className="rounded-md bg-muted/50 p-2.5">
                        <p className="text-xs text-muted-foreground">Replay ({replay.tariffLabel})</p>
                        <div key={replayVersion} role="status" aria-label="Replay outcome" className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300"><RecommendationBadge rec={replay.recommendation} className="mt-1 text-xs" /></div>
                      </div>
                    </div>
                    {replay.clause && (
                      <blockquote className="border-l-4 border-sky-600 pl-3 text-sm text-muted-foreground">"{replay.clause.text}"</blockquote>
                    )}
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {replay.requirementResults.map((r) => (
                        <li key={r.requirement.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                          <span className={`size-2.5 rounded-full ${r.met === true ? "bg-emerald-600" : r.met === false ? "bg-rose-600" : "bg-slate-400"}`} aria-hidden="true" />
                          {r.requirement.label}: {r.met === true ? "met" : r.met === false ? "not met" : "unknown"}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      {replay.gate.result === "FAIL"
                        ? "No actionable recommendation is available under this version."
                        : replay.recommendation !== latest.recommendation
                        ? "Same reading, different synthetic requirement. The record pins its original version; replay does not rewrite history or prove monthly recoding is necessary."
                        : "The recommendation is unchanged under this version."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">{pack.gate.result === "FAIL"
                  ? "Recommendation withheld by the compliance gate. Choose a version to review the evidence and checks, not to bypass the gate."
                  : "Choose a version. Synthetic July requires initials; August also requires a date."}</p>
              )}
            </div>
          </PageSection>
        </div>
      )}

      <PageSection title="What this record deliberately is not" description="Auditability, not theatre.">
        <p className="max-w-3xl text-sm text-muted-foreground">
          Records are session-only, not durable production audit storage. Retention, access controls and reconstruction performance require validation.
        </p>
      </PageSection>
    </div>
  );
}
