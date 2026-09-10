import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleHelp, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageSection } from "@/components/page-section";
import { BoundaryTag, KeyValue, SyntheticTag } from "@/components/demo/labels";
import { PrescriptionForm } from "@/components/demo/prescription-form";
import { caseById } from "@/lib/domain/cases";
import { productByCode } from "@/lib/domain/reference";
import { endorsementRequired, evaluateRequirements, mandatoryFieldsCheck } from "@/lib/domain/rules";
import { versionForDate } from "@/lib/domain/tariff";
import type { EndorsementFacts } from "@/lib/domain/types";
import { useAppStore } from "@/lib/store";

// Pharmacy pre-submission check. ADVISORY ONLY. Nothing on this screen can block
// a submission. The interpretation of the typed endorsement is a deterministic
// mock here (initials and a date pattern); in production it is the same
// constrained model call the NHSBSA side uses, so both sides agree by design.

type Status = "ready" | "missing" | "unable";

function interpret(text: string): EndorsementFacts {
  const t = text.trim();
  if (!t) return { type: "NONE", present: false, initialled: false, dated: false, quotedText: "", note: "No endorsement entered." };
  const type = /ncso/i.test(t) ? "NCSO" : /\bbb\b/i.test(t) ? "BB" : /\bxp\b/i.test(t) ? "XP" : "UNKNOWN";
  const dated = /\b\d{1,2}[/.-]\d{1,2}([/.-]\d{2,4})?\b/.test(t);
  const initialled = /\b[A-Z]{2,3}\b/.test(t.replace(/NCSO|BB|XP/g, ""));
  return {
    type,
    present: true,
    initialled,
    dated,
    quotedText: t,
    note: `${type === "UNKNOWN" ? "Endorsement type not recognised" : `${type} claim`}${initialled ? ", initialled" : ", no initials found"}${dated ? ", dated" : ", no date found"}.`,
  };
}

export function PharmacyPage() {
  const agentEnabled = useAppStore((s) => s.agentEnabled);
  const [scenario, setScenario] = useState<"A" | "B" | "D">("B");
  const [agentAvailable, setAgentAvailable] = useState(true);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<string | null>(null);
  const assistanceEnabled = agentEnabled && agentAvailable;

  const c = useMemo(() => {
    const id = scenario === "A" ? "EX-24107" : scenario === "B" ? "EX-24112" : "EX-24123";
    return caseById(id)!;
  }, [scenario]);

  const endorsementText = edited[c.id] ?? c.extracted.endorsementText;
  const product = productByCode(c.extracted.productCode);
  const version = versionForDate(c.extracted.dispensingDate);
  const req = endorsementRequired(product, version, c.claim.amountClaimed);
  const facts = interpret(endorsementText);
  const clause = version?.clauses.find((k) => k.endorsementType === (facts.type === "UNKNOWN" || facts.type === "NONE" ? "NCSO" : facts.type)) ?? null;
  const results = evaluateRequirements(clause, facts, c.extracted);
  const mandatory = mandatoryFieldsCheck(c.extracted);
  const unreadable = c.imageQuality < 0.6 || !product;

  let status: Status;
  if (!assistanceEnabled || unreadable || facts.type === "UNKNOWN") status = "unable";
  else if (req.required && results.some((r) => r.met === false)) status = "missing";
  else status = "ready";

  const missingLabels = results.filter((r) => r.met === false).map((r) => r.requirement.label.toLowerCase());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-2">
        <SyntheticTag>Synthetic pharmacy, synthetic prescription, synthetic claim</SyntheticTag>
        <h1 tabIndex={-1} data-tour-heading className="rounded-sm text-2xl font-semibold tracking-tight focus-visible:outline-2">Pharmacy pre-submission check</h1>
        <p className="max-w-3xl text-muted-foreground">
          {c.pharmacy.name} ({c.pharmacy.contractorCode}) is preparing this month's claim. Before it is sent, the same agent that works NHSBSA's queue checks the
          endorsement against the rule in force on the dispensing date and says exactly what is missing. In production this runs where the claim is
          submitted, through NHSBSA's own Manage Your Service portal, and later inside dispensing software.
        </p>
        <Alert className="border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950">
          <CheckCircle2 className="text-teal-700" aria-hidden="true" />
          <AlertTitle>Advisory only</AlertTitle>
          <AlertDescription>The agent advises. It never blocks a submission, and the pharmacy can continue whether or not it is available or certain.</AlertDescription>
        </Alert>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Scenario</p>
          <ToggleGroup type="single" value={scenario} onValueChange={(v) => v && setScenario(v as "A" | "B" | "D")} aria-label="Choose a scenario" className="flex-wrap justify-start">
            <ToggleGroupItem value="A" className="data-[state=on]:bg-teal-700 data-[state=on]:text-white">Complete endorsement</ToggleGroupItem>
            <ToggleGroupItem value="B" className="data-[state=on]:bg-teal-700 data-[state=on]:text-white">Information missing</ToggleGroupItem>
            <ToggleGroupItem value="D" className="data-[state=on]:bg-teal-700 data-[state=on]:text-white">Unreadable form</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-2 pt-4">
          <Switch id="agent-available" checked={agentAvailable} onCheckedChange={setAgentAvailable} className="data-[state=checked]:bg-teal-700" />
          <Label htmlFor="agent-available" className="text-sm">Agent available</Label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSection title="The prescription as the pharmacy sees it" description="Extracted information and what the pharmacy has entered.">
          <PrescriptionForm c={c} highlight={["item", "endorsement"]} />
          <dl className="grid gap-2 sm:grid-cols-2">
            <KeyValue k="Product" v={product ? `${product.name} (pack ${product.packSize})` : "Could not be resolved from the read"} />
            <KeyValue k="Quantity" v={c.extracted.quantity ?? "Unreadable"} />
            <KeyValue k="Dispensing date" v={c.extracted.dispensingDate} />
            <KeyValue k="Amount to be claimed" v={`£${c.claim.amountClaimed.toFixed(2)} (${c.claim.submittedVia})`} />
          </dl>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <Label htmlFor="endorsement">Endorsement entered by the pharmacy</Label>
            <div className="flex gap-2">
              <Input
                id="endorsement"
                value={endorsementText}
                onChange={(e) => setEdited((m) => ({ ...m, [c.id]: e.target.value }))}
                aria-describedby="endorsement-help"
                className="font-mono"
              />
              <Button type="button" variant="outline" onClick={() => setEdited((m) => ({ ...m, [c.id]: c.extracted.endorsementText }))}>Restore</Button>
            </div>
            <p id="endorsement-help" className="text-xs text-muted-foreground">
              Edit the endorsement and the check re-runs. Try adding a date such as 21/08/26 to the missing-information scenario.
            </p>
          </form>
        </PageSection>

        <PageSection title="Pre-submission check" description="Deterministic checks first, then the rule the agent retrieved, then plain-English guidance.">
          <Card className={status === "ready" ? "border-emerald-600" : status === "missing" ? "border-amber-600" : "border-slate-400"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {status === "ready" && <CheckCircle2 className="size-6 text-emerald-700" aria-hidden="true" />}
                {status === "missing" && <AlertTriangle className="size-6 text-amber-600" aria-hidden="true" />}
                {status === "unable" && <CircleHelp className="size-6 text-slate-500" aria-hidden="true" />}
                <span role="status">
                  {status === "ready" ? "Ready to submit" : status === "missing" ? "Information may be missing" : "Agent unable to determine"}
                </span>
              </CardTitle>
              <CardDescription>
                {status === "ready" && "The endorsement appears to satisfy the rule in force on the dispensing date. Submit as normal; NHSBSA's own checks still apply."}
                {status === "missing" && `The endorsement appears to need: ${missingLabels.join("; ")}. Correcting it now avoids a referral weeks later.`}
                {status === "unable" && (!agentEnabled ? "Agent recommendations are switched off. Continue with submission as normal; NHSBSA processes the item exactly as today." : !agentAvailable ? "The agent is not available. Continue with submission as normal; NHSBSA processes the item exactly as today." : "The form could not be read well enough, or the endorsement type was not recognised. Continue with submission as normal; the item will be checked by a person at NHSBSA.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Deterministic checks <BoundaryTag cls="deterministic" short /></h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex justify-between gap-3 rounded-md border px-2.5 py-1.5"><span>Endorsement required this month?</span><span className="font-medium">{req.required === null ? "Unknown" : req.required ? "Yes" : "No"}</span></li>
                  {mandatory.map((m) => (
                    <li key={m.name} className="flex justify-between gap-3 rounded-md border px-2.5 py-1.5"><span>{m.name}</span><span className="font-medium">{m.pass ? "Present" : "Missing"}</span></li>
                  ))}
                </ul>
                <p className="mt-1 text-xs text-muted-foreground">{req.reason}</p>
              </div>
              {assistanceEnabled && !unreadable && clause && version && (
                <div>
                  <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">Rule retrieved for {c.extracted.dispensingDate} <BoundaryTag cls="agent" short /></h3>
                  <blockquote className="rounded-md border-l-4 border-teal-600 bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{clause.part}, {clause.title} ({version.label})</p>
                    <p className="mt-1 text-muted-foreground">"{clause.text}"</p>
                  </blockquote>
                  <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    {results.map((r) => (
                      <li key={r.requirement.id} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                        <span className={`size-2.5 rounded-full ${r.met ? "bg-emerald-600" : "bg-amber-500"}`} aria-hidden="true" />
                        {r.requirement.label}: <span className="font-medium">{r.met ? "met" : "not met"}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">Reading of the note (mocked interpretation): {facts.note}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (scenario === "B") setEdited((m) => ({ ...m, [c.id]: `${c.extracted.endorsementText.trim()} ${c.extracted.dispensingDate.slice(8, 10)}/${c.extracted.dispensingDate.slice(5, 7)}/${c.extracted.dispensingDate.slice(2, 4)}` }));
                    document.getElementById("endorsement")?.focus();
                  }}
                >
                  Correct the information
                </Button>
                <Button type="button" className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setSubmitted(c.id)}>
                  <Send aria-hidden="true" /> Continue with submission
                </Button>
              </div>
              {submitted === c.id && (
                <p role="status" className="rounded-md bg-emerald-50 p-2.5 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
                  Submitted (synthetic). The result of this check travels with the claim, so if the item still reaches an operator the case starts pre-built. Nothing here changed what NHSBSA will pay.
                </p>
              )}
              <p className="text-xs text-muted-foreground">The agent advises but does not block submission. A check on a typed field, not a scan; nothing is scanned at the pharmacy.</p>
            </CardContent>
          </Card>
        </PageSection>
      </div>
    </div>
  );
}
