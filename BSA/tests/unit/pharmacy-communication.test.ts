import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { ClaimDetail } from "@/components/demo/claim-detail";
import { caseForLifecycle } from "@/lib/domain/lifecycle-model";
import { getDomainSnapshot, useAppStore } from "@/lib/store";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});

beforeEach(() => useAppStore.getState().resetDemo());

function renderClaim() {
  const s = useAppStore.getState(), id = "EX-24112";
  const c = caseForLifecycle(id, s.lifecycles, s.caseRevisions, s.itemProcesses)!;
  return renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ClaimDetail, { c, row: s.lifecycles[id] })));
}

it.each([false, true])("places the actual question and answer controls before evidence and recommendations, On=%s", (enabled) => {
  const id = "EX-24112", s = useAppStore.getState();
  s.setAgentEnabled(enabled);
  s.submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
  s.arriveInQueue(id);
  const question = "Please confirm the current synthetic evidence for EX-24112.";
  s.requestInformation(id, question);
  const before = getDomainSnapshot();
  const html = renderClaim();
  const requested = html.indexOf('aria-label="Requested confirmation"');
  const verification = html.indexOf('aria-label="Item verification"');
  expect(requested).toBeGreaterThan(0);
  expect(requested).toBeLessThan(verification);
  expect(html.slice(requested, verification)).toContain(`<dd>${question}</dd>`);
  expect(html.slice(requested, verification)).toContain('data-pharmacy-action="confirmation"');
  if (enabled) {
    expect(requested).toBeLessThan(html.indexOf('data-recommendation-case="EX-24112"'));
    expect(html).toContain("the agent verifies and advises; a person decides");
  }
  expect(getDomainSnapshot()).toEqual(before);

  const answer = "The pharmacy confirms its recorded evidence for EX-24112; a human must reconcile it.";
  s.sendConfirmation(id, answer);
  const sent = getDomainSnapshot(), confirmation = renderClaim();
  expect(confirmation.indexOf('aria-label="Sent pharmacy confirmation"')).toBeLessThan(confirmation.indexOf('aria-label="Item verification"'));
  expect(confirmation).toContain(`<dd>${answer}</dd>`);
  expect(sent.caseRevisions[id].slice(0, -1)).toEqual(before.caseRevisions[id]);
  expect(getDomainSnapshot()).toEqual(sent);
});

it("keeps the actual approved referral and RB code before supporting metadata", () => {
  const id = "EX-24112", s = useAppStore.getState();
  s.setAgentEnabled(true);
  s.submitItem({ caseId: id, channel: "eps", endorsementText: "NCSO RK" });
  s.arriveInQueue(id);
  s.recordType2Decision({ caseId: id, decision: "REFER_BACK", rbCode: "SYN-NCSO",
    reason: "Date missing from the supplied endorsement.", approvedDraft: "Add the dispensing date beside the initials." });
  const before = getDomainSnapshot(), html = renderClaim();
  const response = html.indexOf('aria-label="Operator response"');
  const metadata = html.indexOf('aria-label="Item verification"');
  expect(response).toBeLessThan(metadata);
  expect(html.slice(response, metadata)).toContain("SYN-NCSO");
  expect(html.slice(response, metadata)).toContain("Add the dispensing date beside the initials.");
  expect(html).toContain('data-recommendation-case="EX-24112"');
  expect(getDomainSnapshot()).toEqual(before);
});
