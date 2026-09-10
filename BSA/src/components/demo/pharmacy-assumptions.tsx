import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PHARMACY_ASSUMPTION_FIELDS, validPharmacyDays, type PharmacyAssumptions as Values } from "@/lib/domain/baseline";
import { usePharmacyStore } from "@/lib/pharmacy-store";

export function PharmacyAssumptions() {
  const values = usePharmacyStore((state) => state.assumptions);
  const set = usePharmacyStore((state) => state.setAssumption);
  const [draft, setDraft] = useState<Partial<Record<keyof Values, string>>>({});
  return <details className="rounded-xl border bg-card p-4" data-pharmacy-assumptions>
    <summary className="cursor-pointer font-semibold">Timeline assumptions</summary>
    <p className="my-3 text-sm text-muted-foreground">Editable scenario days, not measured delays. Existing receipts keep their original assumptions.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {PHARMACY_ASSUMPTION_FIELDS.map(({ key, label }) => {
        const raw = draft[key] ?? String(values[key]);
        const invalid = validPharmacyDays(raw) === null;
        return <section key={key} aria-label={`${label} assumption`} className="space-y-1">
          <Label htmlFor={`pharmacy-${key}`}>{label} · Assumption</Label>
          <Input id={`pharmacy-${key}`} inputMode="numeric" value={raw} aria-invalid={invalid} aria-describedby={`pharmacy-${key}-hint`} onChange={(event) => { setDraft((old) => ({ ...old, [key]: event.target.value })); set(key, event.target.value); }} />
          <p id={`pharmacy-${key}-hint`} className="text-xs text-muted-foreground">{invalid ? "Enter whole days from 0 to 365; last valid value retained." : "0–365 days · Assumption"}</p>
        </section>;
      })}
    </div>
  </details>;
}