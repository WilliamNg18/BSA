import { describe, expect, it } from "vitest";
import { followedChannel, followedLastEvent, followedLocation } from "../../src/lib/follow-presentation";
import type { CaseLifecycle, HistoryEvent } from "../../src/lib/domain/lifecycle";
import { useAppStore } from "../../src/lib/store";

const row = (event?: Partial<HistoryEvent>): CaseLifecycle => ({
  caseId: "SYN-TEST", pharmacyCode: "FQ123", state: "in_review",
  history: event ? [{ at: "2026-09-04T23:50:00Z", actor: "operator", from: "in_review", to: "in_review", message: "Test event", ...event }] : [],
});

describe("follow history and current location presentation", () => {
  it.each([
    [{ processStep: "referral", rbCode: "RB2B" }, "Referred back 4 September, RB2B (synthetic)"],
    [{ processStep: "suggestion_applied" }, "Operator applied suggestion 4 September (synthetic)"],
    [{ processStep: "correction_applied", actor: "pharmacy" }, "Pharmacy applied correction 4 September (synthetic)"],
    [{ processStep: "type1_capture" }, "Operator confirmed capture 4 September (synthetic)"],
    [{ processStep: "release_to_pricing", releaseOrigin: "human_decision" }, "Released after operator review 4 September (synthetic)"],
    [{ processStep: "release_to_pricing", actor: "code", releaseOrigin: "automatic_verification" }, "Verified and released 4 September (synthetic)"],
    [{ processStep: "resubmission", actor: "pharmacy" }, "Pharmacy resubmitted item 4 September (synthetic)"],
    [{ decision: "REQUEST_INFORMATION" }, "Operator requested information 4 September (synthetic)"],
    [{ decision: "ESCALATE" }, "Operator escalated item 4 September (synthetic)"],
    [{ actor: "pharmacy", from: "information_requested", to: "resubmitted" }, "Pharmacy sent confirmation 4 September (synthetic)"],
    [{ actor: "agent", recommendation: "ABSTAIN" }, "Agent abstained 4 September (synthetic)"],
  ] satisfies [Partial<HistoryEvent>, string][])("renders explicit action %j without raw enums", (event, expected) => {
    expect(followedLastEvent(row(event))).toBe(expected);
  });

  it("uses the latest appended event, not the event with the newest wall-clock date", () => {
    const item = row({ processStep: "referral", rbCode: "RB2B" });
    item.history.push({ ...item.history[0], at: "2026-09-01T09:00:00", actor: "pharmacy", processStep: "correction_applied", rbCode: undefined });
    expect(followedLastEvent(item)).toBe("Pharmacy applied correction 1 September (synthetic)");
  });

  it("makes absent history, source and invalid dates explicit instead of inventing them", () => {
    expect(followedLastEvent(row())).toBe("No history event recorded");
    expect(followedChannel(row())).toBe("Channel not recorded");
    expect(followedLocation(row())).toBe("Location not recorded");
    expect(followedLastEvent(row({ at: "invalid", processStep: "submission" }))).toContain("date unavailable");
  });

  it("takes channel and capture/review location from real submitted routing regardless of the current Agent toggle", () => {
    const store = useAppStore.getState();
    store.resetDemo();
    store.submitItem({ caseId: "EX-24123", channel: "paper", endorsementText: "NCSO JB 27/08/26" });
    const current = useAppStore.getState();
    const item = current.lifecycles["EX-24123"];
    const process = current.itemProcesses[item.caseId];
    expect(followedChannel(item, process)).toBe("Paper");
    expect(followedLocation(item, process)).toBe("Type 1: capture");
    store.setAgentEnabled(true);
    expect(followedLocation(item, process)).toBe("Type 1: capture");
    store.resetDemo();
  });

  it("prioritises recorded referral and release over an earlier process route", () => {
    const item = row();
    expect(followedLocation({ ...item, state: "referred_back" })).toBe("Referred back to pharmacy");
    expect(followedLocation({ ...item, state: "released_to_pricing" })).toBe("Released to existing pricing");
    expect(followedLocation({ ...item, state: "information_requested" })).toBe("Pharmacy: confirmation requested");
  });
});
