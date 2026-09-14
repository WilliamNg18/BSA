import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OperatorActionPanel } from "../../src/components/demo/operator-action-panel";
import { AutomatedCaseRecords, ReleaseRecord } from "../../src/components/demo/release-record";
import { Type1Capture } from "../../src/components/demo/type1-capture";
import { QueuePage } from "../../src/pages/queue";
import { getDomainSnapshot, getReleaseEligibility, useAppStore } from "../../src/lib/store";
import * as agent from "../../src/lib/domain/agent";

vi.mock("@/lib/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/store")>();
  return { ...actual, useAppStore: Object.assign(
    <T,>(selector: (state: ReturnType<typeof actual.useAppStore.getState>) => T) => selector(actual.useAppStore.getState()),
    actual.useAppStore,
  ) };
});

beforeEach(() => { vi.restoreAllMocks(); useAppStore.getState().resetDemo(); });

const renderPanel = (caseId = "EX-24112") => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(OperatorActionPanel, { caseId, compact: true })));
const escaped = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

function openReview(enabled: boolean, caseId = "EX-24112") {
  const store = useAppStore.getState();
  store.setAgentEnabled(enabled);
  store.submitItem({ caseId, channel: "eps", endorsementText: "NCSO initialled AB" });
  store.arriveInQueue(caseId);
}

describe("shared operator action panel", () => {
  it("shows identical explicit human capabilities with empty initial manual fields and no agent call", () => {
    openReview(false);
    const spy = vi.spyOn(agent, "runAgent");
    const before = getDomainSnapshot();
    const html = renderPanel();
    for (const label of ["Release to pricing", "Refer back", "Request information", "Escalate"]) expect(html).toContain(label);
    expect(html).toContain("experience only");
    expect(html).not.toContain('aria-label="Suggestion"');
    expect(html).not.toContain("Apply suggestion");
    expect(html).not.toContain("checked=");
    expect(html).toMatch(/<textarea[^>]*><\/textarea>/);
    expect(spy).not.toHaveBeenCalled();
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("renders the exact shared Apply outcome, code and note without recording a decision", () => {
    openReview(true);
    const initial = getDomainSnapshot();
    useAppStore.getState().applySuggestionToDecision("EX-24112");
    const applied = getDomainSnapshot();
    const draft = applied.operatorDrafts["EX-24112"];
    const html = renderPanel();
    expect(draft).toMatchObject({ outcome: "REFER_BACK", rbCode: "SYN-NCSO", appliedSuggestion: true });
    expect(html).toContain(escaped(draft.note));
    expect(html).toMatch(/<input[^>]*checked=""[^>]*value="REFER_BACK"/);
    expect(html).toMatch(/<option[^>]*value="SYN-NCSO"[^>]*selected=""/);
    expect(html).toContain("applied by the operator from the agent&#x27;s suggestion");
    expect(applied.lifecycles["EX-24112"].state).toBe(initial.lifecycles["EX-24112"].state);
    expect(applied.lifecycles["EX-24112"].history.at(-1)).toMatchObject({ actor: "operator", processStep: "suggestion_applied" });
    expect(applied.records).toEqual(initial.records);
    expect(getDomainSnapshot()).toEqual(applied);
  });

  it("retains applied human fields and provenance across perspectives and Off without fresh advice", () => {
    openReview(true);
    const store = useAppStore.getState();
    store.applySuggestionToDecision("EX-24112");
    const applied = getDomainSnapshot();
    store.setPerspective("nhsbsa");
    expect(renderPanel()).toContain(escaped(applied.operatorDrafts["EX-24112"].note));
    store.setAgentEnabled(false);
    const html = renderPanel();
    expect(html).not.toContain("Apply suggestion");
    expect(html).toContain(escaped(applied.operatorDrafts["EX-24112"].note));
    expect(html).toContain("applied by the operator from the agent&#x27;s suggestion");
    expect(getDomainSnapshot()).toEqual(applied);
  });

  it.each([false, true])("cannot enable Release by selecting sufficient or adding a reason, Agent %s", (enabled) => {
    openReview(enabled);
    const store = useAppStore.getState();
    store.setOperatorDraft("EX-24112", { revision: store.caseRevisions["EX-24112"].at(-1)!.number,
      outcome: "ACCEPT", rbCode: "", note: "Independent human review does not repair missing evidence." });
    expect(getReleaseEligibility("EX-24112").allowed).toBe(false);
    expect(renderPanel()).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
    expect(() => store.releaseToPricing("EX-24112")).toThrow();
  });

  it("names the unresolved source gaps when the agent abstains after manual capture", () => {
    const store = useAppStore.getState();
    store.confirmType1({ caseId: "EX-24123", revision: 1, provenance: "human_capture", declarationReconciled: false,
      fields: { productCode: null, quantity: null, endorsementText: "", prescriber: null } });
    store.setAgentEnabled(true);
    const html = renderPanel("EX-24123");
    expect(html).toContain("Exact gap");
    expect(html).toContain("Missing product.");
    expect(html).toContain("Missing prescriber.");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Release to pricing<\/button>/);
  });

  it("records final referral separately, retains the approved exact note and removes decision controls", () => {
    openReview(true);
    const store = useAppStore.getState();
    store.applySuggestionToDecision("EX-24112");
    const draft = useAppStore.getState().operatorDrafts["EX-24112"];
    store.referBack("EX-24112", draft.rbCode, draft.note);
    const state = useAppStore.getState();
    expect(state.lifecycles["EX-24112"].state).toBe("referred_back");
    expect(state.lifecycles["EX-24112"].history.at(-1)?.actor).toBe("operator");
    expect(state.records.at(-1)?.approvedDraft?.text).toBe(draft.note);
    expect(renderPanel()).toContain("Read-only");
    expect(renderPanel()).not.toContain(">Refer back</button>");
  });

  it.each([false, true])("preserves applied sufficient advice in the release record with final mode %s", (enabled) => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    store.resubmitItem({ caseId: "EX-24112", channel: "eps", endorsementText: "NCSO RK 21/08/26" });
    store.arriveInQueue("EX-24112");
    store.applySuggestionToDecision("EX-24112");
    const note = useAppStore.getState().operatorDrafts["EX-24112"].note;
    store.setAgentEnabled(enabled);
    const spy = vi.spyOn(agent, "runAgent");
    store.releaseToPricing("EX-24112", note);
    const record = useAppStore.getState().records.at(-1)!;
    expect(record.recommendation).toBe("SUFFICIENT");
    expect(record.agentVersion).not.toBe("not invoked");
    expect(record.reason).toBe(note);
    expect(record.sources.length).toBeGreaterThan(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it.each(["REQUEST_INFORMATION", "ESCALATE"] as const)("records %s as a distinct human action", (decision) => {
    openReview(false);
    const store = useAppStore.getState();
    if (decision === "REQUEST_INFORMATION") store.requestInformation("EX-24112", "Please confirm the dispensing date.");
    else store.recordType2Decision({ caseId: "EX-24112", decision, reason: "Senior evidence review is required." });
    const last = useAppStore.getState().lifecycles["EX-24112"].history.at(-1)!;
    expect(last.actor).toBe("operator");
    expect(last.to).toBe(decision === "REQUEST_INFORMATION" ? "information_requested" : "escalated");
  });

  it("shows automated records without adding an operator or changing the model", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AutomatedCaseRecords)));
    expect(html).toContain("Automated session items");
    expect(html).toContain('href="/case/EX-24107"');
    expect(html).not.toContain('href="/case/EX-24112"');
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("keeps C and F as unclickable background outside the four playable queue counts", () => {
    const before = getDomainSnapshot();
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(QueuePage)));
    expect(Object.keys(before.lifecycles).sort()).toEqual(["EX-24107", "EX-24112", "EX-24123", "SYN-FQ123-MISMATCH"].sort());
    expect(html).toContain('aria-label="Background cases"');
    for (const id of ["EX-24119", "EX-24088"]) {
      expect(html).toContain(id);
      expect(html).not.toContain(`href="/case/${id}"`);
      expect(html).not.toContain(`data-case-id="${id}"`);
    }
    expect(getDomainSnapshot()).toEqual(before);
  });

  it("does not invent a release record for an unreleased case", () => {
    expect(renderToStaticMarkup(createElement(ReleaseRecord, { caseId: "EX-24112" }))).toBe("");
  });

  it("keeps a real two-gate automatic release read-only and unchanged when assistance is switched off", () => {
    const store = useAppStore.getState();
    const revision = store.caseRevisions["EX-24107"].at(-1)!;
    store.setAgentEnabled(true);
    store.submitItem({ caseId: "EX-24107", channel: "eps", endorsementText: revision.endorsementText,
      epsPrescription: revision.epsPrescription });
    const released = getDomainSnapshot();
    expect(released.lifecycles["EX-24107"].state).toBe("released_to_pricing");
    const html = renderToStaticMarkup(createElement(ReleaseRecord, { caseId: "EX-24107" }));
    expect(html).toContain("Verified and released to existing pricing, no operator action");
    expect(html).toContain("data-automatic-case");
    expect(html).not.toContain("<button");
    store.setAgentEnabled(false);
    expect(renderToStaticMarkup(createElement(ReleaseRecord, { caseId: "EX-24107" }))).toBe(html);
    expect(getDomainSnapshot()).toEqual(released);
  });

  it("fails closed when a recorded release has conflicting actor attribution", () => {
    const store = useAppStore.getState();
    const row = store.lifecycles["EX-24112"];
    useAppStore.setState({ lifecycles: { ...store.lifecycles, "EX-24112": {
      ...row, state: "released_to_pricing", history: [...row.history, {
        at: "2026-09-14T12:00:00Z", actor: "code", from: row.state, to: "released_to_pricing",
        revision: 1, processStep: "release_to_pricing", releaseOrigin: "human_decision", message: "Conflicting attribution",
        verification: { gate1: "none", gate2: "none", reconciled: false, released: true },
      }],
    } } });
    const html = renderToStaticMarkup(createElement(ReleaseRecord, { caseId: "EX-24112" }));
    expect(html).toContain('role="alert"');
    expect(html).toContain("Release attribution or verification incomplete");
    expect(html).not.toContain("no operator action");
    expect(html).not.toContain("after operator review");
  });
});

describe("compact Type 1 declaration confirmation", () => {
  it("renders the operator handoff after a real human confirmation of the historical D declaration", () => {
    const store = useAppStore.getState();
    store.setAgentEnabled(true);
    const revision = store.caseRevisions["EX-24123"].at(-1)!;
    store.confirmType1({ caseId: "EX-24123", revision: revision.number, provenance: "human_capture", declarationReconciled: true,
      fields: { ...revision.declaration!.fields, prescriber: "Separately established synthetic prescriber" } });
    const confirmed = getDomainSnapshot();
    expect(() => renderPanel("EX-24123")).not.toThrow();
    expect(renderPanel("EX-24123")).toContain("Operator decision");
    expect(confirmed.lifecycles["EX-24123"].history.at(-1)?.actor).toBe("operator");
    expect(getDomainSnapshot()).toEqual(confirmed);
  });

  it("shows immutable declaration values and an empty unknown prescriber beside the poor scan", () => {
    useAppStore.getState().setAgentEnabled(true);
    const before = getDomainSnapshot();
    const declaration = before.caseRevisions["EX-24123"].at(-1)!.paperDeclaration!;
    const html = renderToStaticMarkup(createElement(Type1Capture, { caseId: "EX-24123", compact: true }));
    expect(html).toContain("Original poor paper image");
    expect(html).toContain('aria-label="Original pharmacy declaration"');
    expect(html).toContain(escaped(declaration.typedProduct));
    expect(html).toContain(escaped(declaration.endorsementText));
    expect(html).toContain(declaration.dispensingDate);
    expect(html).toMatch(/<input[^>]*id="[^"]*-prescriber"[^>]*value=""/);
    expect(html).toContain(">Correct</button>");
    expect(html).toContain("I have reconciled the declaration with the available evidence, including the dispensing date");
    expect(html).not.toContain("Restart timing illustration");
    expect(getDomainSnapshot()).toEqual(before);
  });
});
