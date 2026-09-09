import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageSection } from "@/components/page-section";
import { EmptyState } from "@/components/states";
import { RecommendationBadge, StateBadge, SyntheticTag } from "@/components/demo/labels";
import { STATE_META } from "@/components/demo/label-meta";
import { CompositeBadge, SignalList } from "@/components/demo/signals";
import { runAgent } from "@/lib/domain/agent";
import { CASES, QUEUE_FILLER } from "@/lib/domain/cases";
import type { CaseState } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";

const FILTERS: { value: CaseState | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "agent_review_complete", label: STATE_META.agent_review_complete.label },
  { value: "operator_review_required", label: STATE_META.operator_review_required.label },
  { value: "additional_evidence_required", label: STATE_META.additional_evidence_required.label },
  { value: "agent_abstained", label: STATE_META.agent_abstained.label },
  { value: "cleared_by_rules", label: STATE_META.cleared_by_rules.label },
  { value: "human_decision_recorded", label: STATE_META.human_decision_recorded.label },
];

function minutes(m: number) {
  if (m === 0) return "Done";
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

export function QueuePage() {
  const [filter, setFilter] = useState<CaseState | "all">("all");
  const caseStates = useAppStore((s) => s.caseStates);
  const agentEnabled = useAppStore((s) => s.agentEnabled);

  const rows = useMemo(() => {
    const live = CASES.map((c) => {
      const pack = runAgent(c, { agentEnabled });
      return {
        id: c.id,
        reason: c.routingReason,
        pharmacy: c.pharmacy.name,
        state: caseStates[c.id],
        pack,
        minutes: caseStates[c.id] === "human_decision_recorded" ? 0 : c.minutesInQueue,
        openable: true,
      };
    });
    const filler = QUEUE_FILLER.map((f) => ({
      id: f.id,
      reason: f.routingReason,
      pharmacy: f.pharmacy,
      state: f.state,
      pack: null,
      minutes: f.minutesInQueue,
      openable: false,
      recommendation: f.recommendation,
    }));
    return [...live, ...filler].filter((r) => filter === "all" || r.state === filter);
  }, [caseStates, agentEnabled, filter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <SyntheticTag />
        <h1 className="text-2xl font-semibold tracking-tight">NHSBSA exception queue</h1>
        <p className="max-w-3xl text-muted-foreground">
          Items the existing routing has already sent to an operator. The agent has worked each one before anyone opened it. Confidence is shown as its
          signals, not as a percentage. Open a case to see the case pack, or its trace to see how the case was built.
        </p>
      </div>

      <PageSection
        title="Queue"
        description={`${rows.length} item${rows.length === 1 ? "" : "s"} shown. Filter by state.`}
        action={null}
      >
        <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v as CaseState | "all")} aria-label="Filter by state" className="flex-wrap justify-start">
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f.value} value={f.value} className="h-8 whitespace-normal text-xs data-[state=on]:bg-teal-700 data-[state=on]:text-white">
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="No items in this state" description="Choose another filter, or reset the demo from the header." action={<Button variant="outline" size="sm" onClick={() => setFilter("all")}>Show all</Button>} />
        ) : (
          <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Exception queue table" tabIndex={0}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Exception reason</TableHead>
                  <TableHead>Evidence status</TableHead>
                  <TableHead>Agent recommendation</TableHead>
                  <TableHead>Confidence signals</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">In queue</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className={r.openable ? "" : "text-muted-foreground"}>
                    <TableCell className="whitespace-normal align-top">
                      <p className="font-medium">{r.id}</p>
                      <p className="text-xs text-muted-foreground">{r.pharmacy}</p>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal align-top text-sm">{r.reason}</TableCell>
                    <TableCell className="whitespace-normal align-top text-sm">
                      {r.pack
                        ? r.pack.agentInvoked
                          ? `${r.pack.evidence.length} findings; ${r.pack.conflicts.length ? `${r.pack.conflicts.length} conflict${r.pack.conflicts.length === 1 ? "" : "s"}` : "sources agree"}`
                          : "Pre-checks only"
                        : "Synthetic row"}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {!agentEnabled || r.pack ? <RecommendationBadge rec={agentEnabled && r.pack ? r.pack.recommendation : "NONE"} className="text-xs" /> : <span className="text-sm">{"recommendation" in r ? r.recommendation : ""}</span>}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top">
                      {r.pack && r.pack.agentInvoked ? (
                        <details>
                          <summary className="cursor-pointer text-sm">
                            <CompositeBadge composite={r.pack.composite} className="text-xs" />
                          </summary>
                          <div className="mt-2 w-72 max-w-full">
                            <SignalList signals={r.pack.signals} compact />
                          </div>
                        </details>
                      ) : (
                        <span className="text-sm">{r.pack ? "Not applicable" : "See case"}</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-normal align-top"><StateBadge state={r.state} /></TableCell>
                    <TableCell className="whitespace-nowrap align-top text-right tabular-nums">{minutes(r.minutes)}</TableCell>
                    <TableCell className="align-top">
                      {r.openable ? (
                        <div className="flex flex-col gap-1">
                          <Button asChild size="sm" className="bg-teal-700 text-white hover:bg-teal-800">
                            <Link to={`/case/${r.id}`}>Case pack</Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/case/${r.id}/trace`}>Trace</Link>
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs">Filler row</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageSection>
    </div>
  );
}
