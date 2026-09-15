import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { PharmacyDraftFields } from "@/components/demo/pharmacy-draft-fields";
import { focusPharmacyCorrection } from "@/components/demo/pharmacy-draft-focus";
import { PharmacyClaimsPage } from "@/pages/pharmacy-claims";
import { EpsPrescriptionMessage } from "@/components/demo/eps-prescription-message";
import { initialisePharmacyDraft } from "@/lib/domain/pharmacy-correction";
import { applyEpsStrengthCorrection, EPS_STRENGTH_SELECTED_CODE } from "@/lib/domain/eps-strength";
import { getDomainSnapshot, sessionCase, useAppStore } from "@/lib/store";
import type { PharmacyCorrectionDraft } from "@/lib/domain/lifecycle";

const edits = vi.hoisted(() => new Map<string, NonNullable<ComponentProps<"input">["onChange"]>>());
vi.mock("@/components/ui/input", () => ({
  Input: (props: ComponentProps<"input">) => {
    if (props.id && props.onChange) edits.set(props.id, props.onChange);
    return createElement("input", props);
  },
}));
vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
afterEach(() => { vi.unstubAllGlobals(); edits.clear(); });

function strengthDraft(): PharmacyCorrectionDraft {
  useAppStore.getState().resetDemo();
  const revision = useAppStore.getState().caseRevisions["EX-24107"].at(-1)!;
  const original = initialisePharmacyDraft(sessionCase("EX-24107")!, revision, "eps");
  const eps = original.epsPrescription!;
  return { ...original, epsPrescription: { ...eps, supplyRecord: { productCode: "SYN-AMLO10-28", quantity: 28 },
    items: eps.items.map((item) => ({ ...item, prescribedCode: "SYN-AMLO10-28", product: "Amlodipine 10mg tablets",
      strength: "10mg", form: "tablets", quantity: 28,
      dispensedCode: EPS_STRENGTH_SELECTED_CODE, dispensedName: "Amlodipine 5mg tablets" })),
  } };
}

it("offers a neutral selected-pack control without changing prescription or supply records", () => {
  const draft = strengthDraft(), before = structuredClone(draft), update = vi.fn();
  const html = renderToStaticMarkup(createElement(PharmacyDraftFields, { draft, original: draft, channel: "eps", update }));
  expect(html).toContain('id="eps-selected-pack"');
  expect(html).toContain("Selected claim pack");
  expect(html).toContain("Amlodipine 5mg tablets, 28");
  expect(html).toContain("Amlodipine 10mg tablets, 28");
  expect(html).not.toContain("suggestion");
  expect(html).not.toContain("Recommendation");
  expect(update).not.toHaveBeenCalled();
  expect(draft).toEqual(before);
});

it("distinguishes the endorsed 5mg claim from the immutable actual 10mg supply record", () => {
  const prescription = strengthDraft().epsPrescription!, before = structuredClone(prescription);
  const html = renderToStaticMarkup(createElement(EpsPrescriptionMessage, { prescription }));
  expect(html).toContain("Endorsed product and pack (synthetic)");
  expect(html).toContain("SYN-AMLO5-28");
  expect(html).toContain("Retained pharmacy supply record");
  expect(html).toContain("Supplied product code");
  expect(html).toContain("SYN-AMLO10-28");
  expect(html).not.toContain("Product dispensed (synthetic)");
  expect(prescription).toEqual(before);
});

it("highlights and focuses the actual selected pack after the shared source-backed correction", () => {
  const before = strengthDraft();
  const after: PharmacyCorrectionDraft = { ...before, epsPrescription: applyEpsStrengthCorrection(before.epsPrescription!),
    appliedSuggestion: true, appliedFields: ["dispensedCode"] };
  const focus = vi.fn();
  vi.stubGlobal("document", { getElementById: (id: string) => id === "eps-selected-pack" ? { focus } : null });
  focusPharmacyCorrection(before, after);
  expect(focus).toHaveBeenCalledOnce();
  const html = renderToStaticMarkup(createElement(PharmacyDraftFields, { draft: after, original: before, channel: "eps", update: vi.fn() }));
  expect(html).toMatch(/id="eps-selected-pack"[^>]*ring-2/);
  expect(html).toContain('value="SYN-AMLO10-28" selected=""');
  expect(after.epsPrescription?.supplyRecord).toEqual(before.epsPrescription?.supplyRecord);
  expect(after.epsPrescription?.items[0]).toEqual({ ...before.epsPrescription!.items[0],
    dispensedCode: "SYN-AMLO10-28", dispensedName: "Amlodipine 10mg tablets" });
});

it("paper supply edits preserve source dates, product, quantity and the other declaration fields", () => {
  useAppStore.getState().resetDemo();
  const revision = useAppStore.getState().caseRevisions["EX-24123"].at(-1)!;
  const draft = initialisePharmacyDraft(sessionCase("EX-24123")!, revision, "paper");
  const before = structuredClone(draft), update = vi.fn();
  renderToStaticMarkup(createElement(PharmacyDraftFields, { draft, original: draft, channel: "paper", update }));
  const change = edits.get("paper-brandManufacturer")!;
  change({ target: { value: "Human-entered synthetic supplier" } } as Parameters<typeof change>[0]);
  expect(update).toHaveBeenCalledWith({ ...before, paperDeclaration: {
    ...before.paperDeclaration, brandManufacturer: "Human-entered synthetic supplier",
  } });
  expect(draft).toEqual(before);
  const after = update.mock.calls[0][0] as PharmacyCorrectionDraft;
  const focus = vi.fn();
  vi.stubGlobal("document", { getElementById: (id: string) => id === "paper-brandManufacturer" ? { focus } : null });
  focusPharmacyCorrection(before, after);
  expect(focus).toHaveBeenCalledOnce();
});

it("shows all three real pharmacy state cohorts concurrently without navigation mutations", () => {
  useAppStore.getState().resetDemo();
  const before = getDomainSnapshot();
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(PharmacyClaimsPage)));
  const workload = html.slice(html.indexOf('aria-label="Current pharmacy workload"'), html.indexOf('aria-label="Selected pharmacy this month"'));
  for (const label of ["Action needed", "Waiting on NHSBSA", "Paid this month"]) expect(workload).toContain(`aria-label="${label}"`);
  for (const row of Object.values(before.lifecycles)) {
    if (["referred_back", "resubmitted", "paid"].includes(row.state)) expect(workload).toContain(row.caseId);
  }
  expect(workload).toContain("EX-24107");
  expect(workload).toContain("EX-24112");
  expect(workload).toContain("Resubmitted, ready to release");
  expect(workload).not.toContain("EX-24116");
  expect(getDomainSnapshot()).toEqual(before);
});
