import { afterEach, describe, expect, it, vi } from "vitest";
import { CASES } from "../../src/lib/domain/cases";
import { runAgent } from "../../src/lib/domain/agent";
import { PHARMACY_ASSUMPTION_DEFAULTS, validPharmacyDays } from "../../src/lib/domain/baseline";
import { checkPharmacy, completePharmacyScenario, interpretPharmacyText, PharmacyCheckRunner, pharmacyDateCorrection, pharmacySnapshot, type PharmacyScenario } from "../../src/lib/domain/pharmacy-check";
import { immutableReceipt, pharmacyTimeline, type PharmacyReceipt } from "../../src/lib/domain/pharmacy-timeline";
import { usePharmacyStore } from "../../src/lib/pharmacy-store";
import { useAppStore } from "../../src/lib/store";

const fixture = (scenario: PharmacyScenario) => CASES.find((c) => c.scenario === scenario)!;
const at = "2026-09-10T12:00:00.000Z";
function receiptFor(scenario: PharmacyScenario, enabled: boolean, corrected = false): PharmacyReceipt {
  const c = fixture(scenario);
  const text = corrected ? pharmacyDateCorrection(c, c.extracted.endorsementText) : c.extracted.endorsementText;
  const result = enabled ? checkPharmacy(c, text) : null;
  return immutableReceipt({ id: "PH-test", caseId: c.id, scenario, submittedAt: at,
    precheck: pharmacySnapshot(text, c.extracted.dispensingDate, enabled ? "scripted" : "off", result, enabled ? at : null),
    assumptions: { ...PHARMACY_ASSUMPTION_DEFAULTS }, completeScenario: completePharmacyScenario(c, text, result) });
}

afterEach(() => { vi.useRealTimers(); useAppStore.getState().resetDemo(); usePharmacyStore.getState().reset(); });

describe("historical scripted pharmacy checks, not current playable scenario headlines", () => {
  it("A has a date-selected validated clause and every requirement met", () => {
    const c = fixture("A"), result = checkPharmacy(c, c.extracted.endorsementText);
    expect(result.status).toBe("ready");
    expect(result.version).toBe("2026-08");
    expect(result.clause?.endorsementType).toBe("NCSO");
    expect(result.stages).toEqual(["PASS", "PASS", "PASS", "PASS", "PASS"]);
    expect(result.checks.every((check) => check.met === true)).toBe(true);
    expect(result.agreement).toBe("3/3 scripted readings");
  });
  it("B remains amber until the caller applies its dispensing-date correction", () => {
    const c = fixture("B"), before = structuredClone(c);
    const result = checkPharmacy(c, c.extracted.endorsementText);
    expect(result.status).toBe("missing");
    expect(result.checks.filter((check) => !check.met).map((check) => check.id)).toEqual(["dated"]);
    expect(result.gap).toBe("Dated");
    const corrected = pharmacyDateCorrection(c, c.extracted.endorsementText);
    expect(corrected).toBe("NCSO  RK 21/08/26");
    expect(checkPharmacy(c, corrected).status).toBe("ready");
    expect(pharmacyDateCorrection(c, corrected)).toBe(corrected);
    expect(c).toEqual(before);
    expect(runAgent(c).recommendation).toBe("REFER_BACK");
    expect(runAgent(c, { tariffVersion: "2026-07" }).recommendation).toBe("SUFFICIENT");
  });
  it("uses the dispensing date, never the current date or previous scenario version", () => {
    const c = structuredClone(fixture("B"));
    c.extracted.dispensingDate = "2026-07-21";
    expect(checkPharmacy(c, c.extracted.endorsementText)).toMatchObject({ version: "2026-07", status: "ready" });
    c.extracted.dispensingDate = "1900-01-01";
    expect(checkPharmacy(c, c.extracted.endorsementText)).toMatchObject({ version: null, clause: null, status: "unable" });
  });
  it.each(["N?S? ~~ 1?/0?", "NCSO RK 21/08/26"])("D stops at capture even after typing %s", (text) => {
    expect(checkPharmacy(fixture("D"), text)).toMatchObject({ status: "unable", facts: null, version: null, clause: null, checks: [], stages: ["STOPPED", "NOT RUN", "NOT RUN", "NOT RUN", "NOT RUN"] });
  });
  it("does not invent NCSO or a clause for unknown text", () => {
    for (const text of ["", "unknown RK", "NCSOO RK 21/08/26"]) {
      const result = checkPharmacy(fixture("B"), text);
      expect(result.status).toBe("unable");
      expect(result.clause).toBeNull();
      expect(result.checks).toEqual([]);
    }
  });
  it("canonical D cannot fall through even if a caller replaces its capture fields", () => {
    const d = structuredClone(fixture("D"));
    d.imageQuality = 1;
    d.extracted = structuredClone(fixture("A").extracted);
    expect(checkPharmacy(d, d.extracted.endorsementText)).toMatchObject({ status: "unable", stages: ["STOPPED", "NOT RUN", "NOT RUN", "NOT RUN", "NOT RUN"] });
    expect(completePharmacyScenario(d, d.extracted.endorsementText, checkPharmacy(fixture("A"), d.extracted.endorsementText))).toBe(false);
  });
  it.each(["BB RK", "BB RK 21/08/26", "XP RK", "XP RK 21/08/26"])("unsupported B substitution %s cannot become ready or avoid referral", (text) => {
    const c = fixture("B"), result = checkPharmacy(c, text);
    expect(result).toMatchObject({
      status: "unable", facts: { type: text.startsWith("BB") ? "BB" : "XP", quotedText: text },
      version: null, clause: null, checks: [], agreement: "3/3 scripted readings",
      stages: ["PASS", "STOPPED", "NOT RUN", "NOT RUN", "NOT RUN"],
    });
    expect(result.gap).toBe("Outside validated NCSO coverage; manual review");
    expect(pharmacyDateCorrection(c, text)).toBe(text);
    for (const checked of [result, null]) {
      const completeScenario = completePharmacyScenario(c, text, checked);
      expect(completeScenario).toBe(false);
      const receipt = { ...receiptFor("B", checked !== null), completeScenario,
        precheck: pharmacySnapshot(text, c.extracted.dispensingDate, checked ? "scripted" : "off", checked, checked ? at : null) };
      const timeline = pharmacyTimeline(receipt);
      expect(timeline.some((stage) => stage.outcome === "Not needed")).toBe(false);
      expect(timeline.find((stage) => stage.label === "Refer back")).toMatchObject({ needed: true, outcome: "Illustrative referral" });
      expect(receipt.precheck).toMatchObject({ tariffVersion: null, clauseId: null, checks: [] });
    }
  });
  it.each(["", "unknown RK", "NCSOO RK", "NCSO", "NCSO 21/08/26"])("date correction does not manufacture an initialled NCSO endorsement from %s", (text) => {
    expect(pharmacyDateCorrection(fixture("B"), text)).toBe(text);
  });
  it.each(["A", "D"] as const)("date correction is unavailable for scenario %s", (scenario) => {
    expect(pharmacyDateCorrection(fixture(scenario), "NCSO RK")).toBe("NCSO RK");
  });
  it.each(["NCSO RK 31/02/26", "NCSO RK 21/08", "NCSO RK 99/99/26", "NCSO RK 29/02/25"])("rejects false date matches: %s", (text) => {
    expect(interpretPharmacyText(text).dated).toBe(false);
  });
  it.each(["NCSO RK 21/08/26", "NCSO RK 29-02-2024", "NCSO RK 01.01.2026"])("recognises calendar date: %s", (text) => {
    expect(interpretPharmacyText(text).dated).toBe(true);
  });
  it("does not reinterpret the endorsement token as initials", () => {
    expect(interpretPharmacyText("BB 21/08/26").initialled).toBe(false);
    expect(interpretPharmacyText("NCSO 21/08/26").initialled).toBe(false);
  });
  it("preserves every canonical fixture and all canonical outcomes", () => {
    const before = structuredClone(CASES);
    const packs = CASES.map((c) => runAgent(c));
    for (const scenario of ["A", "B", "D"] as const) {
      const c = fixture(scenario);
      checkPharmacy(c, c.extracted.endorsementText);
      checkPharmacy(c, "NCSO RK 21/08/26");
    }
    expect(CASES).toEqual(before);
    expect(CASES.map((c) => runAgent(c))).toEqual(packs);
  });
});

describe("revision-safe debounce", () => {
  it("finishes only at two seconds and captures a real check timestamp", () => {
    vi.useFakeTimers(); vi.setSystemTime(at);
    const runner = new PharmacyCheckRunner(), c = fixture("B");
    runner.start("one", c, c.extracted.endorsementText, true, false);
    vi.advanceTimersByTime(400);
    expect(runner.getSnapshot()).toMatchObject({ phase: 1, result: null });
    vi.advanceTimersByTime(1599);
    expect(runner.getSnapshot().result).toBeNull();
    vi.advanceTimersByTime(1);
    expect(runner.getSnapshot()).toMatchObject({ key: "one", phase: 5, checkedAt: "2026-09-10T12:00:02.000Z", result: { status: "missing" } });
    runner.cancel();
  });
  it("cancels old text, scenario, global/local Off and unmount revisions", () => {
    vi.useFakeTimers();
    const runner = new PharmacyCheckRunner(), b = fixture("B");
    runner.start("old", b, b.extracted.endorsementText, true, false);
    vi.advanceTimersByTime(1800);
    runner.start("new", b, pharmacyDateCorrection(b, b.extracted.endorsementText), true, false);
    vi.advanceTimersByTime(200);
    expect(runner.getSnapshot()).toMatchObject({ key: "new", result: null });
    vi.advanceTimersByTime(1800);
    expect(runner.getSnapshot().result?.status).toBe("ready");
    runner.start("D", fixture("D"), "NCSO RK", true, false);
    runner.start("off", b, "NCSO RK", false, false);
    vi.runAllTimers();
    expect(runner.getSnapshot()).toMatchObject({ key: "off", result: null, checkedAt: null });
    runner.start("unmount", b, "NCSO RK", true, false);
    runner.cancel(); vi.runAllTimers();
    expect(runner.getSnapshot().result).toBeNull();
  });
  it("reduced motion completes immediately without pending timers", () => {
    vi.useFakeTimers();
    const runner = new PharmacyCheckRunner(), c = fixture("A");
    runner.start("a", c, c.extracted.endorsementText, true, true);
    expect(runner.getSnapshot().result?.status).toBe("ready");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("immutable receipts and timeline assumptions", () => {
  for (const scenario of ["A", "B", "D"] as const) for (const enabled of [true, false]) {
    it(`${scenario} On=${enabled} has six explicit illustrative stages and no fabricated A referral`, () => {
      const receipt = receiptFor(scenario, enabled), stages = pharmacyTimeline(receipt);
      expect(stages.map((stage) => stage.label)).toEqual(["Submitted", "Month end", "Exception", "Refer back", "Correction", "Payment cycle"]);
      expect(stages.map((stage) => stage.day)).toEqual(scenario === "A" ? [0, 14, 14, 14, 14, 28] : [0, 14, 17, 24, 29, 43]);
      expect(stages.filter((stage) => stage.outcome === "Not needed")).toHaveLength(scenario === "A" ? 3 : 0);
      if (scenario === "D") expect(stages.at(-1)?.outcome).toBe("Not guaranteed");
      if (!enabled) expect(receipt.precheck).toMatchObject({ facts: null, checkedAt: null, tariffVersion: null, clauseId: null, checks: [], status: "not_checked", mode: "off" });
    });
  }
  it("collapses B only after correction; D never collapses even with a forged complete flag", () => {
    expect(pharmacyTimeline(receiptFor("B", true, true)).filter((stage) => stage.outcome === "Not needed")).toHaveLength(3);
    expect(pharmacyTimeline({ ...receiptFor("D", true), completeScenario: true }).some((stage) => stage.outcome === "Not needed")).toBe(false);
  });
  it("recognises the explicitly corrected B preset while Off without fabricating a precheck", () => {
    const receipt = receiptFor("B", false, true);
    expect(receipt.precheck).toMatchObject({ mode: "off", status: "not_checked", facts: null, checks: [], checkedAt: null });
    expect(pharmacyTimeline(receipt).filter((stage) => stage.outcome === "Not needed")).toHaveLength(3);
    expect(completePharmacyScenario(fixture("A"), "unknown edited text", null)).toBe(false);
    expect(completePharmacyScenario(fixture("B"), "NCSO RK 21/08/26", null)).toBe(false);
  });
  it("stores detached frozen receipts alongside exactly one authoritative submission revision", () => {
    const base = receiptFor("B", true), input = structuredClone(base);
    const appBefore = useAppStore.getState();
    const saved = usePharmacyStore.getState().submit(input);
    expect(input.precheck.checks).not.toBe(saved.precheck.checks);
    expect(saved).not.toBe(input);
    expect(Object.isFrozen(saved)).toBe(true);
    expect(Object.isFrozen(saved.precheck.facts)).toBe(true);
    expect(Object.isFrozen(saved.precheck.checks[0])).toBe(true);
    expect(Object.isFrozen(saved.assumptions)).toBe(true);
    expect(Reflect.set(saved.precheck, "typedText", "changed")).toBe(false);
    expect(Reflect.set(input.precheck, "typedText", "changed")).toBe(true);
    usePharmacyStore.getState().setAssumption("monthEndDays", "30");
    expect(saved.precheck.typedText).toBe(base.precheck.typedText);
    expect(saved.assumptions.monthEndDays).toBe(14);
    expect(useAppStore.getState().records).toBe(appBefore.records);
    const appAfter = useAppStore.getState();
    expect(appAfter.lifecycles[base.caseId].state).toBe("submitted");
    expect(appAfter.lifecycles[base.caseId].history).toHaveLength(appBefore.lifecycles[base.caseId].history.length + 1);
    expect(appAfter.caseRevisions[base.caseId]).toHaveLength(appBefore.caseRevisions[base.caseId].length + 1);
    expect(appAfter.caseRevisions[base.caseId].at(-1)?.precheck).toEqual(base.precheck);
    expect(appAfter.caseRevisions[base.caseId].at(-1)?.precheck).not.toBe(saved.precheck);
    expect(() => usePharmacyStore.getState().submit(input)).toThrow(/snapshot/);
    expect(useAppStore.getState().caseRevisions).toBe(appAfter.caseRevisions);
    expect(usePharmacyStore.getState().submit(structuredClone(base)).id).not.toBe(saved.id);
  });
  it.each(["", "-1", "1.5", "1e2", "366", "9999", "Infinity"])("rejects invalid duration %s without changing the last valid value", (raw) => {
    expect(validPharmacyDays(raw)).toBeNull();
    expect(usePharmacyStore.getState().setAssumption("monthEndDays", raw)).toBe(false);
    expect(usePharmacyStore.getState().assumptions.monthEndDays).toBe(14);
  });
  it("accepts zero and maximum days, resets receipts and assumptions with global Reset", () => {
    expect(validPharmacyDays("0")).toBe(0); expect(validPharmacyDays("365")).toBe(365);
    usePharmacyStore.getState().setAssumption("monthEndDays", "30");
    usePharmacyStore.getState().submit(receiptFor("A", false));
    useAppStore.getState().setAgentEnabled(true);
    expect(usePharmacyStore.getState().receipts).toHaveLength(1);
    useAppStore.getState().resetDemo();
    expect(usePharmacyStore.getState().receipts).toEqual([]);
    expect(usePharmacyStore.getState().assumptions).toEqual(PHARMACY_ASSUMPTION_DEFAULTS);
    expect(useAppStore.getState().agentEnabled).toBe(false);
  });
  it.each(["off", "unavailable", "pending"] as const)("cannot carry stale successful checks into a %s receipt", (mode) => {
    const c = fixture("A");
    expect(pharmacySnapshot("new text", c.extracted.dispensingDate, mode, checkPharmacy(c, c.extracted.endorsementText), at)).toMatchObject({ facts: null, checks: [], checkedAt: null, tariffVersion: null, status: "not_checked" });
  });
});