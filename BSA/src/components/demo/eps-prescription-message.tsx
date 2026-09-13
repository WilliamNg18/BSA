import { KeyValue } from "@/components/demo/labels";
import type { EpsPrescription } from "@/lib/domain/types";

/** The recorded message is evidence, not an inferred reading of a paper form. */
export function EpsPrescriptionMessage({ prescription, dispenser = true }: {
  prescription: EpsPrescription;
  dispenser?: boolean;
}) {
  return <section aria-label="Electronic prescription, synthetic" className="space-y-4 rounded-xl border bg-card p-4">
    <header className="space-y-2">
      <h3 className="font-semibold">Electronic prescription, synthetic</h3>
      <p className="text-sm text-muted-foreground">The prescriber sends this digital prescription to the pharmacy.</p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <KeyValue k="Prescriber" v={prescription.prescriber.name} />
        <KeyValue k="Practice" v={prescription.prescriber.practice} />
        <KeyValue k="Prescription date" v={prescription.prescriptionDate} />
        <KeyValue k="Patient" v={prescription.patientLabel} />
      </dl>
    </header>
    {prescription.items.map((item, index) => <section key={`${item.prescribedCode}:${index}`} aria-label={`Prescribed item ${index + 1}`} className="space-y-2 rounded-lg bg-muted/40 p-3 [&_dt]:text-foreground">
      <h4 className="font-semibold">Prescribed item</h4>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <KeyValue k="Product" v={item.product} />
        <KeyValue k="Strength" v={item.strength} />
        <KeyValue k="Form" v={item.form} />
        <KeyValue k="Quantity" v={item.quantity} />
        <KeyValue k="Dose" v={item.dose} />
        <KeyValue k="Prescribed code (synthetic)" v={item.prescribedCode} />
      </dl>
    </section>)}
    <dl className="text-sm"><KeyValue k="Prescriber endorsement" v={prescription.prescriberEndorsement || "None recorded"} /></dl>
    {dispenser && <section aria-label="Recorded dispenser claim" className="space-y-2 border-t pt-3">
      <h4 className="font-semibold">Dispenser&apos;s part</h4>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {prescription.items.map((item, index) => <KeyValue key={index} k="Product dispensed (synthetic)" v={`${item.dispensedCode} · ${item.dispensedName}`} />)}
        <KeyValue k="Dispenser endorsement" v={prescription.dispenserEndorsement || "None recorded"} />
        <KeyValue k="Dispensing date" v={prescription.dispensingDate} />
        <KeyValue k="Exemption status" v={prescription.exemptionStatus === "not_recorded" ? "Not recorded" : prescription.exemptionStatus === "exempt" ? "Exempt (synthetic)" : "Chargeable (synthetic)"} />
        <KeyValue k="Claim message" v={prescription.claimMessageState} />
        {prescription.supplyEvidence && <>
          <KeyValue k="Brand or manufacturer dispensed" v={prescription.supplyEvidence.brandManufacturer || "Not recorded"} />
          <KeyValue k="Pack size dispensed" v={prescription.supplyEvidence.packSize ?? "Not recorded"} />
          <KeyValue k="Form dispensed" v={prescription.supplyEvidence.form || "Not recorded"} />
        </>}
      </dl>
    </section>}
    <p className="text-xs text-muted-foreground">EPS has no image to read and no Type 1 capture.</p>
  </section>;
}
