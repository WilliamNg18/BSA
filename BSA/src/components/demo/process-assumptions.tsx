import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProcessMonth } from "@/hooks/use-process-month";
import { PROCESS_INPUT_PROVENANCE, PROCESS_MONTH_DEFAULTS, formatBaselineNumber } from "@/lib/domain/baseline";
import { useAppStore } from "@/lib/store";
import { ProcessFigure } from "./process-figure";
import { PROCESS_FIELDS } from "./process-fields";

export function ProcessAssumptions() {
  const [expanded, setExpanded] = useState(false);
  const draft = useAppStore((s) => s.processInputs);
  const setInput = useAppStore((s) => s.setProcessInput);
  const { errors } = useProcessMonth();
  return <details className="min-w-0 space-y-4 rounded-xl border p-5" data-month-detail
    open={expanded || Object.keys(errors).length > 0}
    onToggle={(event) => setExpanded(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">Edit the monthly assumptions{Object.keys(errors).length > 0 ? " · Check invalid inputs" : ""}</summary>
    <fieldset className="min-w-0 pt-4">
      <legend className="sr-only">Shared process inputs</legend>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{PROCESS_FIELDS.map(({ key, label, hint, integer }) => <div key={key} className="min-w-0 space-y-2">
        <Label htmlFor={`process-${key}`}>{label}</Label>
        <Input id={`process-${key}`} type="text" inputMode={integer ? "numeric" : "decimal"} autoComplete="off" spellCheck={false}
          value={draft[key]} onChange={(event) => { setExpanded(true); setInput(key, event.target.value); }}
          aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `process-${key}-error` : undefined} />
        <p className="text-xs text-muted-foreground"><ProcessFigure label={`${label} default`}
          source={PROCESS_INPUT_PROVENANCE[key].startsWith("public") ? "Public" : "Assumption"} explanation={hint}>
          Default: {formatBaselineNumber(PROCESS_MONTH_DEFAULTS[key], 2)}
        </ProcessFigure></p>
        {errors[key] && <p id={`process-${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
      </div>)}</div>
    </fieldset>
    <p className="pt-4 text-sm text-muted-foreground">Public defaults are supplied context, not independently verified. Edited inputs and modelled outputs are assumptions, not measured operational performance.</p>
  </details>;
}
import { useState } from "react";
