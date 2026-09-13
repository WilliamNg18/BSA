import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore, sessionCase } from "../../src/lib/store";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import * as agent from "../../src/lib/domain/agent";
import * as rules from "../../src/lib/domain/rules";
import { PHARMACIES } from "../../src/lib/domain/reference";
import { LIFECYCLE_LABELS, type PharmacyPrecheckSnapshot } from "../../src/lib/domain/lifecycle";
import { appendHistory, caseForLifecycle } from "../../src/lib/domain/lifecycle-model";
import { seededLifecycleSession } from "../../src/lib/domain/lifecycle-seed";
import { checkPharmacy, pharmacyDateCorrection, pharmacySnapshot } from "../../src/lib/domain/pharmacy-check";
import { usePharmacyStore } from "../../src/lib/pharmacy-store";
import type { HumanDecision } from "../../src/lib/domain/types";

const [A, B, C, D, E, F] = CASES;
const store = () => useAppStore.getState();
const row = (id = B.id) => store().lifecycles[id];
const revisions = (id = B.id) => store().caseRevisions[id];
const corrected = pharmacyDateCorrection(B, B.extracted.endorsementText);
const reason = "Human reviewed the synthetic evidence";

function submit(id = B.id, text = B.extracted.endorsementText, on = true) {
  store().setAgentEnabled(on);
  store().submitItem({ caseId: id, channel: id === D.id ? "paper" : "eps", endorsementText: text });
  store().arriveInQueue(id);
}

function legacy(id = B.id, decision: HumanDecision = "ACCEPT", why: string | null = reason) {
  const pack = runAgent(sessionCase(id)!, { agentEnabled: store().agentEnabled });
  return { caseId: id, tariffVersion: store().agentEnabled ? pack.tariffVersion : "n/a", agentVersion: pack.agentVersion,
    inputs: pack.evidence.map((e) => e.value), sources: pack.evidence.map((e) => e.origin), checks: pack.gate.checks,
    recommendation: pack.recommendation, decision, overrideReason: why };
}

function deeplyFrozen(value: unknown): void {
  if (value && typeof value === "object") {
    expect(Object.isFrozen(value)).toBe(true);
    Object.values(value).forEach(deeplyFrozen);
  }
}

beforeEach(() => store().resetDemo());
afterEach(() => { vi.restoreAllMocks(); store().resetDemo(); });

describe("Task 8 seeds and projections", () => {
  it.each(PHARMACIES)("all seven lifecycle states at $name", (pharmacy) => {
    const rows = Object.values(store().lifecycles).filter((r) => r.pharmacyCode === pharmacy.contractorCode);
    expect(new Set(rows.map((r) => r.state))).toEqual(new Set(Object.keys(LIFECYCLE_LABELS)));
  });

  it("retains all canonical mappings, original fixtures and historical F record", () => {
    expect(Object.keys(store().lifecycles).length).toBeGreaterThanOrEqual(7);
    expect(new Set(Object.values(store().lifecycles).map((item) => item.pharmacyCode))).toEqual(new Set(["FQ123"]));
    for (const [c, state] of [[A, "paid"], [B, "referred_back"], [C, "information_requested"], [D, "in_review"], [E, "paid"], [F, "referred_back"]] as const) {
      expect(row(c.id)).toMatchObject({ caseId: c.id, pharmacyCode: c.pharmacy.contractorCode, state });
      expect(sessionCase(c.id)).toEqual({ ...c, channel: c.claim.submittedVia === "EPS claim message" ? "Electronic (EPS)" : "Paper FP10" });
    }
    expect(store().records).toHaveLength(1);
    expect(store().records[0]).toMatchObject({ id: "DR-000871", caseId: F.id, recommendation: "REFER_BACK", decision: "REFER_BACK" });
    expect(row(F.id).history.at(-1)?.recordId).toBe("DR-000871");
  });

  it("all seeded rows have usable synthetic evidence and consistent immutable histories", () => {
    for (const r of Object.values(store().lifecycles)) {
      expect(sessionCase(r.caseId)?.pharmacy.contractorCode).toBe(r.pharmacyCode);
      let from = null;
      for (const event of r.history) {
        expect(event.from).toBe(from);
        expect(Number.isFinite(Date.parse(event.at))).toBe(true);
        if (event.actor === "agent") expect(event.to).toBe(event.from);
        from = event.to;
      }
      expect(from).toBe(r.state);
    }
    deeplyFrozen(store().lifecycles);
    deeplyFrozen(store().caseRevisions);
    deeplyFrozen(store().records);
    const another = seededLifecycleSession();
    expect(another.lifecycles).toEqual(store().lifecycles);
    expect(another.lifecycles).not.toBe(store().lifecycles);
  });

  it("keeps B's initial referral and July replay independent of explicit corrections", () => {
    const original = structuredClone(CASES), pending = structuredClone(row().history);
    expect(runAgent(sessionCase(B.id)!).recommendation).toBe("REFER_BACK");
    expect(runAgent(sessionCase(B.id)!, { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
    store().resubmitFromPharmacy(B.id, corrected);
    const c = sessionCase(B.id)!;
    expect(c.extracted.endorsementText).toBe(corrected);
    expect(c.claim.endorsementText).toBe(corrected);
    expect(c.regions.find((r) => r.id === "endorsement")?.text).toBe(corrected);
    expect(c.readings.every((r) => r.dated)).toBe(true);
    expect(runAgent(c)).toMatchObject({ recommendation: "NONE", agentInvoked: false, state: "cleared_by_rules" });
    expect(store().itemProcesses[B.id].routing).toMatchObject({ outcome: "auto_priced", requiresHuman: false });
    expect(revisions().at(-1)?.channel).toBe("eps");
    expect(row().history.slice(0, pending.length)).toEqual(pending);
    expect(CASES).toEqual(original);
    expect(runAgent(B).recommendation).toBe("REFER_BACK");
    deeplyFrozen(c);
    expect(caseForLifecycle("unknown", store().lifecycles, store().caseRevisions)).toBeNull();
  });
});

describe("immutable pharmacy revisions", () => {
  it("routes a blank typed EPS endorsement for review without inventing evidence or a decision", () => {
    const records = store().records;
    submit(B.id, "  ");
    expect(sessionCase(B.id)?.extracted.endorsementText).toBe("  ");
    expect(store().itemProcesses[B.id]).toMatchObject({ channel: "eps", routing: { outcome: "type2_endorsement" } });
    expect(row().state).toBe("in_review");
    expect(store().records).toBe(records);
  });

  it("retains full typed text, nested prechecks and earlier snapshots independently", () => {
    const text = `  ${corrected}  `;
    const snapshot = pharmacySnapshot(text, B.extracted.dispensingDate, "scripted", checkPharmacy(B, text), "2026-09-10T10:00:00Z");
    const expected = structuredClone(snapshot);
    store().resubmitFromPharmacy(B.id, text, snapshot);
    const saved = revisions().at(-1)!;
    expect(saved).toMatchObject({ kind: "resubmission", number: 2, endorsementText: text, precheck: expected });
    expect(saved.precheck).not.toBe(snapshot);
    deeplyFrozen(saved);
    expect(() => { (snapshot.facts as { note: string }).note = "caller changed"; }).not.toThrow();
    expect(saved.precheck).toEqual(expected);
    expect(() => { (saved.precheck!.facts as { note: string }).note = "mutated"; }).toThrow();
    expect(() => { (saved.precheck!.checks as unknown as { met: boolean | null }[])[0].met = false; }).toThrow();
    store().submitFromPharmacy(B.id, B.extracted.endorsementText);
    expect(revisions()[1]).toEqual(saved);
    expect(revisions().at(-1)?.number).toBe(3);
    expect(runAgent(sessionCase(B.id)!).recommendation).toBe("REFER_BACK");
  });

  it("explicit repeated submission retains the same ID, history and records", () => {
    const records = store().records, before = row().history;
    for (let i = 0; i < 3; i++) store().submitFromPharmacy(B.id, B.extracted.endorsementText);
    expect(row().state).toBe("submitted");
    expect(row().history).toHaveLength(before.length + 3);
    expect(row().history.slice(0, before.length)).toEqual(before);
    expect(revisions()).toHaveLength(4);
    expect(store().records).toBe(records);
    expect(row().history.at(-1)?.actor).toBe("pharmacy");
  });

  it("only information-requested claims accept confirmation; no inferred quantity correction", () => {
    const before = structuredClone(sessionCase(C.id));
    store().sendConfirmation(C.id, "Quantity 56 confirmed by pharmacy");
    expect(row(C.id).state).toBe("resubmitted");
    expect(revisions(C.id).at(-1)).toMatchObject({ kind: "confirmation", confirmation: "Quantity 56 confirmed by pharmacy" });
    expect(sessionCase(C.id)).toEqual(before);
    expect(runAgent(sessionCase(C.id)!).recommendation).toBe("REQUEST_INFORMATION");
    expect(() => store().sendConfirmation(B.id, reason)).toThrow(/information_requested/);
    expect(() => store().resubmitFromPharmacy(C.id, corrected)).toThrow(/referred_back/);
  });

  it.each([false, true])("Off and On are both usable: round trip with agent=%s", (on) => {
    const fixtures = structuredClone(CASES);
    submit(B.id, B.extracted.endorsementText, on);
    expect(row().state).toBe("in_review");
    const pack = runAgent(sessionCase(B.id)!, { agentEnabled: on });
    store().recordOperatorDecision(B.id, "REFER_BACK", reason, on ? pack.draftToPharmacy! : undefined);
    const referral = structuredClone(row().history);
    expect(row().state).toBe("referred_back");
    expect(Boolean(store().records.at(-1)?.approvedDraft)).toBe(on);
    const records = store().records;
    store().resubmitFromPharmacy(B.id, corrected);
    store().arriveInQueue(B.id);
    expect(row().state).toBe("paid");
    expect(row().history.slice(0, referral.length)).toEqual(referral);
    expect(store().records).toBe(records);
    expect(row().history.at(-1)).toMatchObject({ actor: "code", revision: 3 });
    expect(runAgent(sessionCase(B.id)!)).toMatchObject({ recommendation: "NONE", agentInvoked: false });
    expect(() => store().recordOperatorDecision(B.id, "ACCEPT", reason)).toThrow(/while paid/);
    expect(CASES).toEqual(fixtures);
    for (const event of row().history.filter((event) => event.actor === "agent")) expect(event.to).toBe(event.from);
    expect(row().history.filter((event) => event.actor === "agent")).toHaveLength(on ? 1 : 0);
  });
});

describe("atomic human decisions and boundaries", () => {
  it.each([B, C])("legacy ACCEPT accepts $scenario recommendation, never silently pays", (c) => {
    submit(c.id, c.extracted.endorsementText);
    const before = store(), history = row(c.id).history;
    const observations: boolean[] = [];
    const unsubscribe = useAppStore.subscribe((s) => {
      observations.push(s.records.at(-1)?.id === s.lifecycles[c.id].history.at(-1)?.recordId && s.caseStates[c.id] === "human_decision_recorded");
    });
    const input = legacy(c.id);
    const record = store().recordDecision(input);
    unsubscribe();
    expect(row(c.id).state).toBe(c === B ? "referred_back" : "information_requested");
    expect(record.isOverride).toBe(false);
    expect(store().records).toHaveLength(before.records.length + 1);
    expect(row(c.id).history).toHaveLength(history.length + 1);
    expect(observations).toEqual([true]);
    input.inputs.push("caller mutation");
    input.checks[0].detail = "caller mutation";
    expect(record.inputs).not.toContain("caller mutation");
    expect(record.checks[0].detail).not.toBe("caller mutation");
    deeplyFrozen(store().records);
    expect(row(c.id).history.at(-1)).toMatchObject({ recordId: record.id, tariffVersion: record.tariffVersion, clauseId: "P2-C9", decision: "ACCEPT" });
    expect(() => store().recordDecision(input)).toThrow(/expected in_review/);
  });

  it("operator ACCEPT is human Sufficient: referral advice cannot pay without a reasoned override", () => {
    submit();
    const before = store();
    expect(() => store().recordOperatorDecision(B.id, "ACCEPT", "")).toThrow(/reason/i);
    expect(store()).toBe(before);
    expect(row().state).toBe("in_review");
    store().recordOperatorDecision(B.id, "ACCEPT", reason);
    expect(row().state).toBe("paid");
    expect(store().records.at(-1)).toMatchObject({ isOverride: true, recommendation: "REFER_BACK", decision: "ACCEPT", overrideReason: reason });
  });

  it("manual NONE ACCEPT is reasoned human judgement, not an override", () => {
    submit(B.id, B.extracted.endorsementText, false);
    const runs = vi.spyOn(agent, "runAgent");
    expect(() => store().recordDecision(legacy(B.id, "ACCEPT", null))).toThrow(/reason/i);
    const record = store().recordDecision(legacy(B.id));
    expect(record).toMatchObject({ recommendation: "NONE", decision: "ACCEPT", isOverride: false, tariffVersion: "n/a", checks: [] });
    expect(row(B.id).state).toBe("paid");
    expect(runs.mock.calls.every(([, options]) => options?.agentEnabled === false)).toBe(true);
  });

  it("operator API approval is explicit, with immutable decision, tariff and clause metadata", () => {
    submit();
    store().recordOperatorDecision(B.id, "REFER_BACK", reason);
    expect(store().records.at(-1)).not.toHaveProperty("approvedDraft");
    submit();
    const draft = runAgent(sessionCase(B.id)!).draftToPharmacy!;
    const before = store();
    const observed: boolean[] = [];
    const unsubscribe = useAppStore.subscribe((s) => observed.push(s.records.at(-1)?.id === s.lifecycles[B.id].history.at(-1)?.recordId));
    store().recordOperatorDecision(B.id, "REFER_BACK", reason, draft);
    unsubscribe();
    expect(observed).toEqual([true]);
    expect(store().records).toHaveLength(before.records.length + 1);
    const record = store().records.at(-1)!;
    expect(record.approvedDraft).toEqual({ text: draft, approvedAt: record.timestamp, approvedBy: "Demo operator", decision: "REFER_BACK", tariffVersion: "2026-08", clauseId: "P2-C9" });
    expect(row().history.at(-1)?.approvedDraft).toEqual(record.approvedDraft);
    deeplyFrozen(record);
    store().setAgentEnabled(false);
    expect(store().records.at(-1)).toEqual(record);
  });

  it("D keeps three abstention reasons, uncertain capture and disagreeing readings after editing", () => {
    submit(D.id, corrected);
    const pack = runAgent(sessionCase(D.id)!);
    expect(pack).toMatchObject({ recommendation: "ABSTAIN", gate: { result: "NOT_RUN" } });
    expect(pack.abstainReasons).toHaveLength(3);
    expect(sessionCase(D.id)?.readings).toEqual(D.readings);
    expect(row(D.id).state).toBe("in_review");
    expect(row(D.id).history.at(-1)?.message).toMatch(/abstained/);
    const beforeCapture = store();
    expect(() => store().recordOperatorDecision(D.id, "ESCALATE", reason)).toThrow(/completed capture/);
    expect(store()).toBe(beforeCapture);
    store().confirmType1({
      caseId: D.id, revision: revisions(D.id).at(-1)!.number,
      fields: { productCode: null, quantity: null, endorsementText: corrected },
      provenance: "human_capture", declarationReconciled: false,
    });
    expect(store().itemProcesses[D.id].capture).toMatchObject({ fields: { productCode: null, quantity: null } });
    expect(() => store().recordOperatorDecision(D.id, "REFER_BACK", reason, "Invented draft")).toThrow(/No validated/);
    store().recordOperatorDecision(D.id, "ESCALATE", reason);
    expect(row(D.id).state).toBe("escalated");
  });

  it.each([false, true])("E allows an empty endorsement and clears by code only, flag=%s", (on) => {
    const records = store().records;
    submit(E.id, "", on);
    expect(row(E.id).state).toBe("paid");
    expect(row(E.id).history.slice(-2).map((event) => event.actor)).toEqual(["pharmacy", "code"]);
    expect(runAgent(sessionCase(E.id)!).agentInvoked).toBe(false);
    expect(store().records).toBe(records);
  });

  it("gate FAIL withholds advice and drafts, but permits a reasoned manual decision", () => {
    vi.spyOn(rules, "complianceGate").mockReturnValue({ result: "FAIL", checks: [{ name: "Injected failure", pass: false, detail: "Test gate failure" }] });
    submit(B.id, B.extracted.endorsementText);
    const pack = runAgent(sessionCase(B.id)!);
    expect(pack).toMatchObject({ recommendation: "NONE", draftToPharmacy: null, gate: { result: "FAIL" } });
    expect(row(B.id).state).toBe("in_review");
    expect(row(B.id).history.at(-1)?.message).toMatch(/withheld/);
    expect(() => store().recordDecision({ ...legacy(B.id), recommendation: "SUFFICIENT" })).toThrow(/Recommendation/);
    expect(() => store().recordOperatorDecision(B.id, "REFER_BACK", reason, "Draft")).toThrow(/No validated/);
    store().recordOperatorDecision(B.id, "ACCEPT", reason);
    expect(store().records.at(-1)).toMatchObject({ recommendation: "NONE", isOverride: false });
  });

  it("flag and follow changes never append domain events; Reset replaces the original three slices", () => {
    const original = store();
    store().setAgentEnabled(true);
    store().followCase(B.id);
    expect(store().lifecycles).toBe(original.lifecycles);
    expect(store().caseRevisions).toBe(original.caseRevisions);
    expect(store().records).toBe(original.records);
    usePharmacyStore.getState().setAssumption("correctionDays", "9");
    const resetSignals: boolean[] = [];
    const unsubscribe = useAppStore.subscribe((s, previous) => resetSignals.push(s.records !== previous.records && s.caseStates !== previous.caseStates && s.baselineInputs !== previous.baselineInputs));
    store().resetDemo();
    unsubscribe();
    expect(resetSignals).toEqual([true]);
    expect(store().lifecycles).toEqual(original.lifecycles);
    expect(store().caseRevisions).toEqual(original.caseRevisions);
    expect(store().followedCaseId).toBeNull();
    expect(store().agentEnabled).toBe(false);
    expect(usePharmacyStore.getState().assumptions.correctionDays).not.toBe(9);
  });
});

describe("rejected inputs leave the complete store untouched", () => {
  it.each([
    () => store().followCase("unknown"),
    () => store().submitFromPharmacy("unknown", "text"),
    () => store().submitFromPharmacy(B.id, null as unknown as string),
    () => store().arriveInQueue(B.id),
    () => store().resubmitFromPharmacy(A.id, corrected),
    () => store().sendConfirmation(B.id, reason),
    () => store().sendConfirmation(C.id, "  "),
    () => store().recordOperatorDecision(A.id, "ACCEPT", reason),
  ])("invalid lifecycle action %#", (act) => {
    const before = store();
    expect(act).toThrow();
    expect(store()).toBe(before);
  });

  it.each([
    { typedText: "stale" }, { dispensingDate: "2026-07-01" }, { mode: "off" }, { checkedAt: "invalid" },
    { checks: [{ id: "bad", label: "Bad", met: "yes" }] }, { facts: { type: "made up" } }, { status: "not_checked" },
    { tariffVersion: "2026-07" }, { clauseId: "invented" }, { checkedAt: "1" },
  ])("malformed or stale precheck %j", (patch) => {
    const snapshot = pharmacySnapshot(corrected, B.extracted.dispensingDate, "scripted", checkPharmacy(B, corrected), "2026-09-10T09:00:00Z");
    const before = store();
    expect(() => store().resubmitFromPharmacy(B.id, corrected, { ...snapshot, ...patch } as PharmacyPrecheckSnapshot)).toThrow(/snapshot/);
    expect(store()).toBe(before);
  });

  it("rejects unknown, stale and reasonless decisions, and agent transitions", () => {
    submit();
    const before = store();
    expect(() => store().recordDecision({ ...legacy(), decision: "BOGUS" as "ACCEPT" })).toThrow(/Unknown/);
    expect(() => store().recordDecision({ ...legacy(), recommendation: "SUFFICIENT" })).toThrow(/Recommendation/);
    expect(() => store().recordDecision({ ...legacy(), tariffVersion: "2026-07" })).toThrow(/stale/);
    expect(() => store().recordDecision({ ...legacy(), checks: [] })).toThrow(/gate checks/);
    expect(() => store().recordDecision(legacy(B.id, "ACCEPT", "short"))).toThrow(/reason/i);
    expect(() => store().recordDecision({ ...legacy(), inputs: null as unknown as string[] })).toThrow(/evidence/);
    expect(() => appendHistory(row(), { at: new Date().toISOString(), actor: "agent", from: "in_review", to: "paid", message: "Disallowed" })).toThrow(/Invalid/);
    expect(store()).toBe(before);
  });
});