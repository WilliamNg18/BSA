import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NativeChoiceGroup as ToggleGroup, NativeChoiceItem as ToggleGroupItem } from "@/components/ui/native-radio-group";
import { PageSection } from "@/components/page-section";
import { BoundaryTag } from "@/components/demo/labels";
import { BOUNDARY_META } from "@/components/demo/label-meta";
import { BOUNDARY_ROWS } from "@/lib/domain/content";
import type { BoundaryClass } from "@/lib/domain/types";

export function BoundaryPage() {
  const [filter, setFilter] = useState<BoundaryClass | "all">("all");
  const rows = BOUNDARY_ROWS.filter((r) => filter === "all" || r.cls === filter);
  const counts = (Object.keys(BOUNDARY_META) as BoundaryClass[]).map((k) => ({ k, n: BOUNDARY_ROWS.filter((r) => r.cls === k).length }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Agent, deterministic code, human decision</h1>
        <p className="max-w-3xl text-muted-foreground">
          Classify every action. Use interpretation only where justified; deterministic rules and human authority remain separate.
        </p>
      </div>

      <PageSection title="Four classes" description="Filter the table by class.">
        <ToggleGroup value={filter} onValueChange={(v) => v && setFilter(v as BoundaryClass | "all")} aria-label="Filter by class" className="flex-wrap justify-start">
          <ToggleGroupItem value="all" className="h-8 data-[state=on]:bg-teal-700 data-[state=on]:text-white">All ({BOUNDARY_ROWS.length})</ToggleGroupItem>
          {counts.map(({ k, n }) => (
            <ToggleGroupItem key={k} value={k} className="h-8 whitespace-normal data-[state=on]:bg-teal-700 data-[state=on]:text-white">
              {BOUNDARY_META[k].label} ({n})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="overflow-x-auto rounded-lg border" role="region" aria-label="Boundary classification" tabIndex={0}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Why it belongs there</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.action}>
                  <TableCell className="whitespace-normal align-top font-medium">{r.action}</TableCell>
                  <TableCell className="whitespace-normal align-top"><BoundaryTag cls={r.cls} /></TableCell>
                  <TableCell className="whitespace-normal align-top text-sm text-muted-foreground">{r.why}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <PageSection title="Where a model must not be used" description="Design commitments, not caveats.">
        <ul className="grid gap-2 md:grid-cols-2">
          {[
            ["Payment calculation and any exact arithmetic", "Legally consequential, beside a 99.85 per cent accuracy target. Existing NHSBSA code, unchanged."],
            ["Explicit mandatory-field rules and thresholds", "Cheaper, testable and auditable as code."],
            ["Citation validation", "A string and version match. The model may not cite from memory."],
            ["The compliance gate", "The check that the recommendation is permitted must be code the model cannot influence."],
            ["Final case disposition", "Published accuracy; contractor income. A person decides."],
            ["Final payment approval", "Outside the agent and outside this prototype."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-md border p-3">
              <p className="font-medium">{t}</p>
              <p className="text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection title="What makes the agentic part genuinely agentic" description="Not a fixed workflow, not a lookup, not a chatbot.">
        <ul className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {[
            "Goal-directed planning: which questions this item needs answered.",
            "Deciding what evidence is required and which tools can supply it.",
            "Selecting and invoking read-only tools, adapting to what comes back.",
            "Retrieving the provision in force on the dispensing date.",
            "Reconciling evidence across sources and flagging what disagrees.",
            "Interpreting free-text or contextual information against the retrieved rule.",
            "Producing a grounded recommendation with a citation.",
            "Explaining the gap to the pharmacy from the record only.",
            "Abstaining when the evidence or the provision is insufficient.",
          ].map((t) => (
            <li key={t} className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm">{t}</li>
          ))}
        </ul>
      </PageSection>
    </div>
  );
}
