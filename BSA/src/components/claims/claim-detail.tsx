import { useState } from "react";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyValue } from "@/components/demo/labels";
import { ClaimActions } from "@/components/claims/claim-actions";
import { ClaimStateBadge } from "@/components/claims/claim-state-badge";
import type { ClaimActionKey } from "@/components/claims/claim-actions-model";
import type { ClaimFixture, ClaimHistoryEvent } from "@/components/claims/fixtures";

const ACTOR_LABEL: Record<ClaimHistoryEvent["actor"], string> = {
  pharmacy: "Pharmacy",
  agent: "Agent",
  code: "Deterministic code",
  operator: "NHSBSA operator",
};

/** History reason wording: On shows only the operator-approved draft, labelled
 *  as such; Off retains the manual context an operator would have written. */
function reasonFor(e: ClaimHistoryEvent, agentEnabled: boolean): { text: string; drafted: boolean } {
  if (agentEnabled && e.draftReason) return { text: e.draftReason, drafted: true };
  if (!agentEnabled && e.manualReason) return { text: e.manualReason, drafted: false };
  return { text: e.message, drafted: false };
}

export function ClaimDetail({ claim, agentEnabled }: { claim: ClaimFixture; agentEnabled: boolean }) {
  const [localNotes, setLocalNotes] = useState<{ key: ClaimActionKey; text: string; at: string }[]>([]);

  function recordAction(key: ClaimActionKey, text: string) {
    setLocalNotes((notes) => [...notes, { key, text, at: new Date().toISOString().slice(0, 19) }]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{claim.caseId} · {claim.title}</CardTitle>
            <ClaimStateBadge state={claim.state} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-2 sm:grid-cols-2">
            <KeyValue k="Pharmacy" v={`${claim.pharmacyName} (${claim.pharmacyCode})`} />
            <KeyValue k="Endorsement" v={claim.endorsementText || "None"} />
            <KeyValue k="Amount claimed" v={`£${claim.amountClaimed.toFixed(2)}`} />
          </dl>

          <section aria-label="Claim history">
            <h3 className="mb-1.5 text-sm font-semibold">History</h3>
            <ol className="space-y-2">
              {claim.history.map((e, i) => {
                const reason = reasonFor(e, agentEnabled);
                return (
                  <li key={i} className="rounded-md border p-2.5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{ACTOR_LABEL[e.actor]}</span>
                      <span className="text-xs text-muted-foreground">{e.at}</span>
                    </div>
                    <p>{reason.text}</p>
                    {reason.drafted && <Badge variant="outline" className="mt-1 border-teal-600 text-teal-800 dark:text-teal-300">Operator-approved draft</Badge>}
                  </li>
                );
              })}
              {localNotes.map((n, i) => (
                <li key={`local-${i}`} className="rounded-md border border-dashed p-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">Pharmacy (this session)</span>
                    <span className="text-xs text-muted-foreground">{n.at}</span>
                  </div>
                  <p>{n.text}</p>
                </li>
              ))}
            </ol>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What you can do next</CardTitle>
        </CardHeader>
        <CardContent>
          <ClaimActions state={claim.state} onAction={recordAction} />
        </CardContent>
      </Card>

      {localNotes.length > 0 && (
        <Alert>
          <Info aria-hidden="true" />
          <AlertTitle>Recorded for this session only</AlertTitle>
          <AlertDescription>The claim status has not changed; the shared lifecycle service is not yet connected.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
