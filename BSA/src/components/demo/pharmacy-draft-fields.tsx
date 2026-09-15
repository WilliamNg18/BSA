import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";
import type { ItemChannel } from "@/lib/domain/types";
import { EPS_SUPPLY_RULE } from "@/lib/domain/eps-check";
import { EPS_STRENGTH_CORRECT_CODE, EPS_STRENGTH_SELECTED_CODE } from "@/lib/domain/eps-strength";
import { productByCode } from "@/lib/domain/reference";

export function PharmacyDraftFields({ draft, original, channel, update, correction = false, recommendationVisible = false }: {
  draft: PharmacyCorrectionDraft; original: PharmacyCorrectionDraft; channel: ItemChannel;
  update: (draft: PharmacyCorrectionDraft) => void; correction?: boolean; recommendationVisible?: boolean;
}) {
  const id = useId();
  const eps = draft.epsPrescription;
  const paper = draft.paperDeclaration;
  const declaration = draft.declaration;
  const highlight = (before: unknown, after: unknown, field?: NonNullable<PharmacyCorrectionDraft["appliedFields"]>[number]) =>
    draft.appliedSuggestion && (field && draft.appliedFields ? draft.appliedFields.includes(field) : before !== after)
      ? "border-primary ring-2 ring-primary" : "";
  function endorsement(text: string) {
    update({ ...draft, endorsementText: text,
      ...(eps ? { epsPrescription: { ...eps, dispenserEndorsement: text } } : {}),
      ...(paper ? { paperDeclaration: { ...paper, endorsementText: text } } : {}),
      ...(declaration ? { declaration: { ...declaration, fields: { ...declaration.fields, endorsementText: text } } } : {}),
    });
  }
  return <fieldset className="space-y-3" data-pharmacy-draft>
    <legend className="font-semibold">{channel === "eps" ? "Dispenser's part" : "Paper declaration"}</legend>
    {channel === "paper" && (recommendationVisible
      ? <dl id={`${id}-origin`} className="text-xs"><dt>Source</dt><dd>declared by the pharmacy, not read from the form</dd></dl>
      : <p id={`${id}-origin`} className="text-xs">declared by the pharmacy, not read from the form</p>)}
    {channel === "paper" && !correction && declaration?.fields.prescriber && <dl className="text-sm">
      <dt>Demo prescriber (declared)</dt><dd>{declaration.fields.prescriber}</dd>
    </dl>}
    {channel === "paper" && paper && <div className="grid grid-cols-2 gap-3">
      <label className="grid gap-1">Declared product<Input id="paper-typedProduct" value={paper.typedProduct} aria-describedby={`${id}-origin`} className={highlight(original.paperDeclaration?.typedProduct, paper.typedProduct)}
        onChange={(e) => update({ ...draft, paperDeclaration: { ...paper, typedProduct: e.target.value } })} /></label>
      <label className="grid gap-1">Declared quantity<Input id="paper-quantity" type="number" min="1" step="1" value={paper.quantity ?? ""} aria-describedby={`${id}-origin`} className={highlight(original.paperDeclaration?.quantity, paper.quantity)}
        onChange={(e) => update({ ...draft, paperDeclaration: { ...paper, quantity: e.target.value === "" ? null : Number(e.target.value) } })} /></label>
      <label className="grid gap-1">Declared dispensing date<Input type="date" value={paper.dispensingDate} aria-describedby={`${id}-origin`} className={highlight(original.paperDeclaration?.dispensingDate, paper.dispensingDate)}
        onChange={(e) => update({ ...draft, paperDeclaration: { ...paper, dispensingDate: e.target.value } })} /></label>
      {(["brandManufacturer", "packSize", "form"] as const).map((field) => <label className="grid gap-1" key={field}>
        {field === "brandManufacturer" ? "Declared brand or manufacturer" : field === "packSize" ? "Declared pack size" : "Declared form"}
        <Input id={`paper-${field}`} type={field === "packSize" ? "number" : "text"}
          min={field === "packSize" ? 1 : undefined} step={field === "packSize" ? 1 : undefined}
          value={paper[field] ?? ""} aria-describedby={`${id}-origin`}
          className={highlight(original.paperDeclaration?.[field], paper[field], field)}
          onChange={(event) => update({ ...draft, paperDeclaration: { ...paper,
            [field]: field === "packSize" ? event.target.value === "" ? null : Number(event.target.value) : event.target.value,
          } })} />
      </label>)}
      {correction && declaration && <label className="col-span-2 grid gap-1">Declared prescriber (synthetic)
        <Input value={declaration.fields.prescriber ?? ""} aria-describedby={`${id}-origin`}
          onChange={(e) => update({ ...draft, declaration: { ...declaration, fields: { ...declaration.fields, prescriber: e.target.value || null } } })} />
      </label>}
    </div>}
    {channel === "paper" && !paper && declaration && <div className="grid grid-cols-2 gap-3">
      <label className="grid gap-1">Declared product code<Input value={declaration.fields.productCode ?? ""} aria-describedby={`${id}-origin`} className={highlight(original.declaration?.fields.productCode, declaration.fields.productCode)}
        onChange={(e) => update({ ...draft, declaration: { ...declaration, fields: { ...declaration.fields, productCode: e.target.value || null } } })} /></label>
      <label className="grid gap-1">Declared quantity<Input type="number" min="1" step="1" value={declaration.fields.quantity ?? ""} aria-describedby={`${id}-origin`} className={highlight(original.declaration?.fields.quantity, declaration.fields.quantity)}
        onChange={(e) => update({ ...draft, declaration: { ...declaration, fields: { ...declaration.fields, quantity: e.target.value === "" ? null : Number(e.target.value) } } })} /></label>
      <label className="col-span-2 grid gap-1">Declared prescriber (synthetic)<Input value={declaration.fields.prescriber ?? ""} aria-describedby={`${id}-origin`} className={highlight(original.declaration?.fields.prescriber, declaration.fields.prescriber)}
        onChange={(e) => update({ ...draft, declaration: { ...declaration, fields: { ...declaration.fields, prescriber: e.target.value || null } } })} /></label>
    </div>}
    <div className="space-y-1">
      <Label htmlFor={correction ? "claim-endorsement" : "endorsement"}>{correction ? "Corrected endorsement" : channel === "paper" ? "Declared endorsement" : "Dispenser endorsement"}</Label>
      <Input id={correction ? "claim-endorsement" : "endorsement"} value={draft.endorsementText} className={highlight(original.endorsementText, draft.endorsementText, "endorsementText")}
        aria-describedby={draft.appliedSuggestion ? `${id}-applied` : channel === "paper" ? `${id}-origin` : undefined}
        onChange={(e) => endorsement(e.target.value)} />
    </div>
    {eps?.items[0]?.prescribedCode === EPS_STRENGTH_CORRECT_CODE && <label className="grid gap-1">
      Selected claim pack
      <select id="eps-selected-pack" value={eps.items[0].dispensedCode}
        className={`rounded-md border bg-background p-2 ${highlight(original.epsPrescription?.items[0]?.dispensedCode, eps.items[0].dispensedCode, "dispensedCode")}`}
        onChange={(event) => {
          const product = productByCode(event.target.value);
          if (!product) throw new Error("Selected claim pack is unavailable.");
          update({ ...draft, epsPrescription: { ...eps,
            items: eps.items.map((item, index) => index === 0 ? { ...item, dispensedCode: product.code, dispensedName: product.name } : item),
          } });
        }}>
        {[EPS_STRENGTH_SELECTED_CODE, EPS_STRENGTH_CORRECT_CODE].map((code) => {
          const product = productByCode(code);
          return <option key={code} value={code}>{product ? `${product.name}, ${product.packSize}` : code}</option>;
        })}
      </select>
    </label>}
    {eps?.items[0]?.dispensedCode === EPS_SUPPLY_RULE.productCode && <div className="grid grid-cols-2 gap-3">
      {(["brandManufacturer", "packSize", "form"] as const).map((field) => <label className={`grid gap-1 ${field === "brandManufacturer" ? "col-span-2" : ""}`} key={field}>
        {field === "brandManufacturer" ? "Brand or manufacturer dispensed" : field === "packSize" ? "Pack size dispensed" : "Form dispensed"}
        <Input id={field === "brandManufacturer" ? "eps-manufacturer" : field === "packSize" ? "eps-pack" : "eps-form"}
          type={field === "packSize" ? "number" : "text"} min={field === "packSize" ? 1 : undefined} step={field === "packSize" ? 1 : undefined}
          value={eps.supplyEvidence?.[field] ?? ""} className={highlight(original.epsPrescription?.supplyEvidence?.[field], eps.supplyEvidence?.[field], field)}
          onChange={(e) => update({ ...draft, epsPrescription: { ...eps, supplyEvidence: {
            ruleId: EPS_SUPPLY_RULE.id, brandManufacturer: "", packSize: null, form: "", ...eps.supplyEvidence,
            [field]: field === "packSize" ? e.target.value === "" ? null : Number(e.target.value) : e.target.value,
          } } })} />
      </label>)}
    </div>}
    {draft.appliedSuggestion && <p id={`${id}-applied`} role="status" className="text-sm">{recommendationVisible ? "Highlighted; not sent." : "Changed fields highlighted; not sent."}</p>}
  </fieldset>;
}
