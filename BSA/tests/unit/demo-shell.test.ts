import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "../../src/components/app-shell";
import { ConfirmDialogProvider } from "../../src/components/confirm-dialog";
import { NotificationProvider } from "../../src/components/notification-provider";
import { DEMO_STEPS, demoStepDestination } from "../../src/lib/domain/demo-steps";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";
import { caseById } from "../../src/lib/domain/cases";
import { navigateDemoStep } from "../../src/lib/demo-navigation";

vi.mock("@/lib/store", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/store")>();
  return { ...original, useAppStore: Object.assign(
    (select: (state: ReturnType<typeof original.useAppStore.getState>) => unknown) => select(original.useAppStore.getState()),
    original.useAppStore,
  ) };
});
afterEach(() => useAppStore.getState().resetDemo());

function shell(path: string) {
  return renderToStaticMarkup(createElement(NotificationProvider, null,
    createElement(ConfirmDialogProvider, null,
      createElement(MemoryRouter, { initialEntries: [path] }, createElement(Routes, null,
        createElement(Route, { element: createElement(AppShell) },
          createElement(Route, { path: "*", element: createElement("h1", null, "Ordinary operations") })))))));
}

describe("mounted desktop demo with real compact panels", () => {
  it("hands the actual strength referral to step 9 without changing the waiting paper case", () => {
    const state = () => useAppStore.getState();
    let path = "/";
    const go = (step: number) => navigateDemoStep(step, (destination) => { path = destination; });
    const b = "EX-24112", mismatch = "SYN-FQ123-MISMATCH";
    state().setAgentEnabled(true);
    go(4);
    const paperHistory = state().lifecycles[b];
    expect(paperHistory.state).toBe("resubmitted");
    const source = caseById(mismatch)!.epsPrescription!;
    state().submitItem({ caseId: mismatch, channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source });
    expect(state().itemVerification[mismatch]).toMatchObject({ gate1: "fail", gate2: "fail", released: false });
    go(5);
    go(8);
    state().followCase(mismatch);
    state().arriveInQueue(mismatch);
    state().applySuggestionToDecision(mismatch);
    const draft = state().operatorDrafts[mismatch];
    state().referBack(mismatch, draft.rbCode, draft.note);
    const before = getDomainSnapshot();
    go(9);
    expect(path).toBe(`/pharmacy/claims?case=${mismatch}&channel=eps`);
    expect(state().followedCaseId).toBe(mismatch);
    expect(getDomainSnapshot()).toEqual(before);
    const html = shell(path);
    expect(html).toContain(`data-demo-live-case="${mismatch}"`);
    expect(html).toContain('data-pharmacy-action="apply-correction"');
    expect(html).toContain('data-pharmacy-action="resubmit"');
    expect(html).not.toContain(`data-demo-live-case="${b}"`);
    const strip = html.slice(html.indexOf('data-testid="demo-strip"'), html.indexOf("</nav>", html.indexOf('data-testid="demo-strip"')));
    expect(strip).toContain(mismatch);
    expect(strip).toContain("EPS");
    state().applySuggestedCorrection(mismatch);
    state().setCorrectionAcknowledgement(mismatch, state().caseRevisions[mismatch].at(-1)!.number, true);
    state().resubmit(mismatch);
    expect(state().lifecycles[mismatch].state).toBe("released_to_pricing");
    expect(state().itemProcesses[mismatch].releaseOrigin).toBe("automatic_verification");
    expect(state().lifecycles[b]).toStrictEqual(paperHistory);
    expect(state().demoStep).toBe(9);
    expect(state().followedCaseId).toBe(mismatch);
  });

  it.each(DEMO_STEPS.flatMap((step) => [false, true].map((enabled) => ({ step, enabled }))))(
    "step $step.number, Agent $enabled, has one header and one actionful side",
    ({ step, enabled }) => {
      const state = useAppStore.getState();
      state.setPerspective("both");
      state.setAgentEnabled(enabled);
      state.setDemoStep(step.number);
      if (step.caseId) state.followCase(step.caseId);
      const before = getDomainSnapshot();
      const html = shell(demoStepDestination(step));
      expect(html.match(/role="switch"/g)).toHaveLength(1);
      expect(html.match(/<h1 /g)).toHaveLength(1);
      expect(html).not.toContain("Ordinary operations");
      expect(html).not.toContain('aria-label="Primary"');
      expect(html).not.toContain('aria-label="Reset demo"');
      expect(html).not.toContain("Guided tour");
      expect(html).not.toContain('role="alert"');
      expect(html).toContain("Exit demo");
      const main = html.slice(html.indexOf('<main '), html.indexOf("</main>"));
      const today = main.indexOf('data-testid="demo-today"');
      const assisted = main.indexOf('data-testid="demo-assisted"');
      const inactive = enabled ? main.slice(today, assisted) : main.slice(assisted);
      expect(inactive).toContain("Read-only scenario projection");
      expect(inactive).not.toMatch(/<(?:button|input|select|textarea|a)\b/);
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
      expect(new Set(ids).size).toBe(ids.length);
      if (step.caseId) {
        expect(html).toContain('aria-label="Followed item"');
        expect(html.indexOf('aria-label="Followed item"')).toBeLessThan(html.indexOf('data-testid="demo-strip"'));
        expect(main.match(/data-demo-live-case=/g)).toHaveLength(1);
        expect(main).toContain(`data-demo-live-case="${step.caseId}"`);
      }
      expect(getDomainSnapshot()).toEqual(before);
    });

  it.each(["both", "pharmacy", "nhsbsa"] as const)("keeps real ordinary operations reachable after Exit in %s", (perspective) => {
    const state = useAppStore.getState();
    state.setPerspective(perspective);
    state.setDemoStep(4);
    state.followCase("EX-24112");
    const before = getDomainSnapshot();
    state.setDemoStep(null);
    const html = shell("/");
    expect(html).toContain("Ordinary operations");
    expect(html).toContain("Enter demo mode");
    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('aria-label="Reset demo"');
    expect(html).not.toContain('data-testid="demo-step-screen"');
    expect(getDomainSnapshot()).toEqual(before);
  });

  it.each((["both", "pharmacy", "nhsbsa"] as const).flatMap((perspective) =>
    [null, ...DEMO_STEPS.map((step) => step.number)].flatMap((step) =>
      [false, true].map((enabled) => ({ perspective, step, enabled }))))
  )("keeps one exact global notice policy in $perspective, step $step, Agent $enabled", ({ perspective, step, enabled }) => {
    const state = useAppStore.getState();
    state.setPerspective(perspective);
    state.setDemoStep(step);
    state.setAgentEnabled(enabled);
    const before = getDomainSnapshot();
    const html = shell("/");
    const outcome = "Outcome: the agent gathers evidence and recommends. Deterministic code validates and calculates. A person decides.";
    expect(html.split(outcome).length - 1).toBe(enabled ? 1 : 0);
    expect(html.split("All data is synthetic").length - 1).toBe(1);
    expect(html.slice(html.indexOf("<footer"))).toContain("All data is synthetic");
    expect(html).toContain("Session only");
    expect(html).toContain("No payments calculated or approved");
    expect(html).not.toMatch(/data-disclaimer|synthetic-disclaimer|data-principle|Synthetic cases|Synthetic demonstration data throughout/);
    expect(html.match(/role="switch"/g)).toHaveLength(1);
    if (enabled) {
      expect(html.indexOf("data-agent-outcome")).toBeGreaterThan(html.indexOf("</header>"));
      expect(html.indexOf("data-agent-outcome")).toBeLessThan(html.indexOf("<main "));
    }
    expect(getDomainSnapshot()).toEqual(before);
  });

  it.each(["both", "pharmacy", "nhsbsa"] as const)("shows same D on either follow route without a perspective guard in %s", (perspective) => {
    const state = useAppStore.getState();
    state.setPerspective(perspective);
    state.setDemoStep(10);
    state.followCase("EX-24123");
    for (const path of ["/case/EX-24123", "/pharmacy/claims?case=EX-24123"]) {
      const html = shell(path);
      expect(html).toContain('data-demo-step="10"');
      expect(html).toContain('data-demo-live-case="EX-24123"');
      expect(html).not.toContain("This view belongs to the other side");
      expect(html).toContain("Pharmacy view");
      expect(html).toContain("NHSBSA view");
    }
  });

  it.each([false, true])("retains one editable assumptions instance when values are invalid, Agent %s", (enabled) => {
    const state = useAppStore.getState();
    state.setDemoStep(2);
    state.setAgentEnabled(enabled);
    state.setManualLoopInput("manualLoopItems", "invalid");
    const html = shell("/#month");
    expect(html).toContain("Estimate unavailable");
    expect(html).toContain("Edit the monthly assumptions");
    expect(html.match(/id="process-manualLoopItems"/g)).toHaveLength(1);
    expect(html).toContain('aria-invalid="true"');
    expect(html).not.toContain("Exit demo to correct");
  });

  it("offers the pharmacy correction before Send and preserves the ignored mismatch for the NHSBSA step", () => {
    const state = useAppStore.getState();
    const caseId = "SYN-FQ123-MISMATCH";
    state.setDemoStep(4);
    state.setAgentEnabled(true);
    const path = `/pharmacy?case=${caseId}&channel=eps`;
    expect(shell(path)).toContain('data-pharmacy-action="apply-correction"');
    const source = caseById(caseId)!.epsPrescription!;
    state.submitItem({ caseId, channel: "eps", endorsementText: source.dispenserEndorsement, epsPrescription: source });
    expect(useAppStore.getState().itemVerification[caseId]).toMatchObject({ gate1: "fail", gate2: "fail", released: false });
    const before = getDomainSnapshot();
    state.setDemoStep(5);
    const html = shell(demoStepDestination(DEMO_STEPS[4]));
    expect(html).toContain(`data-demo-live-case="${caseId}"`);
    expect(html).toContain('data-operator-action-panel');
    expect(html).not.toContain('data-pharmacy-action="apply-correction"');
    expect(getDomainSnapshot()).toEqual(before);
  });
});
