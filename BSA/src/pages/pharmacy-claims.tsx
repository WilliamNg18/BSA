import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PageSection } from "@/components/page-section";
import { EmptyState } from "@/components/states";
import { SyntheticTag } from "@/components/demo/labels";
import { ClaimDetail } from "@/components/claims/claim-detail";
import { ClaimList } from "@/components/claims/claim-list";
import { CLAIMS, claimsForPharmacy, pharmacyOptions } from "@/components/claims/fixtures";
import { useAppStore } from "@/lib/store";

// Task 9: pharmacy claims view. Built against the frozen lifecycle contract
// (`@/lib/domain/lifecycle`) with synthetic, local-only fixtures; no lifecycle
// store method is called here while Stream B's implementation is pending.
export function PharmacyClaimsPage() {
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const pharmacies = useMemo(() => pharmacyOptions(), []);
  const [pharmacyCode, setPharmacyCode] = useState(pharmacies[0]?.code ?? "");
  const claims = useMemo(() => claimsForPharmacy(pharmacyCode, CLAIMS), [pharmacyCode]);
  const [selectedId, setSelectedId] = useState<string | null>(claims[0]?.caseId ?? null);

  function selectPharmacy(code: string) {
    setPharmacyCode(code);
    const next = claimsForPharmacy(code, CLAIMS);
    setSelectedId(next[0]?.caseId ?? null);
  }

  const selected = claims.find((c) => c.caseId === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <SyntheticTag>Synthetic pharmacy, synthetic claims</SyntheticTag>
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">Pharmacy claims</h1>
        <p className="max-w-3xl text-muted-foreground">
          Select a pharmacy to see its claims, each claim's history and the actions available for its current state.
        </p>
      </div>

      <div className="max-w-xs space-y-1.5">
        <Label htmlFor="claims-pharmacy">Pharmacy</Label>
        <NativeSelect id="claims-pharmacy" value={pharmacyCode} onChange={(e) => selectPharmacy(e.target.value)}>
          {pharmacies.map((p) => (
            <NativeSelectOption key={p.code} value={p.code}>{p.name} ({p.code})</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <PageSection title="Claims" description={`${claims.length} synthetic claim${claims.length === 1 ? "" : "s"} for this pharmacy.`}>
            {claims.length === 0 ? (
              <EmptyState title="No claims for this pharmacy" description="Choose a different pharmacy above." />
            ) : (
              <ClaimList claims={claims} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </PageSection>
        </div>
        <div className="lg:col-span-3">
          <PageSection title="Claim detail" description="History and the actions allowed at this stage.">
            {selected ? (
              <ClaimDetail key={selected.caseId} claim={selected} agentEnabled={agentEnabled} />
            ) : (
              <EmptyState title="No claim selected" description="Choose a claim from the list." />
            )}
          </PageSection>
        </div>
      </div>
    </div>
  );
}