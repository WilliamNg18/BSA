import { useRef } from "react";
import { PainMarker } from "./pain-marker";
import { BoundaryTag } from "./labels";
import { formatBaselineNumber, type MonthModelResult } from "@/lib/domain/baseline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TASKS = ["Find the form", "Read the endorsement", "Check product and pack", "Check claim records", "Find dated rule and clause", "Compare sources", "Record a reason"];
export function QueueManualSteps({ result, assisted = false }: { result: MonthModelResult; assisted?: boolean }) {
  return <div className="space-y-2">
    <BoundaryTag cls="human" />
    <p className="text-xs text-muted-foreground">Competent manual evidence work. Each duration is an editable assumption; judgement remains human.</p>
    <div className="grid gap-2" aria-label="Seven evidence tasks">
      {result.gatheringSteps.map(({ key, minutes }, index) => <PainMarker key={key} resolved={assisted}
        pain={`${TASKS[index]} · ${formatBaselineNumber(minutes)} min`}
        resolution={`${TASKS[index]} · assembly projected; verify evidence`} />)}
    </div>
  </div>;
}

export function QueueTodayDialog({ selected, close, result, restoreFocus }: { selected: string | null; close: () => void; result: MonthModelResult; restoreFocus: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  return <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) close(); }}>
    <DialogContent className="max-h-[85vh] overflow-y-auto" onOpenAutoFocus={(event) => { event.preventDefault(); title.current?.focus(); }} onCloseAutoFocus={(event) => { event.preventDefault(); restoreFocus(); }}>
      <DialogHeader><DialogTitle ref={title} tabIndex={-1}>Today · {selected}</DialogTitle>
        <DialogDescription>Synthetic model example. No retrieved rule, citation or agent result. Full manual case work is planned separately.</DialogDescription>
      </DialogHeader>
      <QueueManualSteps result={result} />
      <p className="text-sm">Judging: {formatBaselineNumber(result.perItem.today.judgingMinutes)} minutes assumed. No decision or history event is written.</p>
    </DialogContent>
  </Dialog>;
}