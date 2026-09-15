import type { Page, TestInfo } from "@playwright/test";
import { expect, navigatePrimary } from "./fixtures";
import { choosePerspective } from "./perspective-helpers";
import { choosePaperExample } from "./pharmacy-scenario-helpers";
import { DECLARATION_RECONCILIATION } from "./paper-declaration-helpers";
import { decisionNote, operatorDecision, operatorRadio, selectEpsScenario } from "./operator-action-helpers";
import { assertVisibleHandoffWithinOneSecond } from "./timed-transition-helpers";
import { HUMAN_RELEASE_LABELS, MANUAL_RELEASE_LABELS } from "../support/release-labels";
import { EPS_SUPPLY_RULE } from "../../src/lib/domain/eps-check";
import { LIFECYCLE_LABELS } from "../../src/lib/domain/lifecycle";
import type { PlayableCycle } from "../support/desktop-matrix";
import { REQUIRED_PERSPECTIVES } from "./extended-paper-helpers";

export async function runTimedCaseJourney(
  page: Page, info: TestInfo, item: PlayableCycle, enabled: boolean,
  perspective: typeof REQUIRED_PERSPECTIVES[number],
) {
  const id = item.id;
  const follow = () => page.getByRole("region", { name: "Followed item", exact: true });
  const claim = () => page.locator(`[data-pharmacy-case="${id}"]`);
  const claimState = () => claim().locator(":scope > p[role=status]").first();
  const caseState = () => page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("status");
  const name = (action: string) => `${id}-${perspective.toLowerCase()}-${enabled ? "on" : "off"}-${action}`;
  let captureNumber = 0;
  async function side(destination: "Pharmacy" | "NHSBSA") {
    await choosePerspective(page, perspective);
    await follow().getByRole("button", { name: `${destination} view`, exact: true }).click();
    await expect(follow()).toContainText(id);
    await expect(page.getByRole("banner").getByRole("switch")).toBeChecked({ checked: enabled });
  }
  async function bothSides() {
    await side("Pharmacy");
    await side("NHSBSA");
  }
  function queueTarget(automatic: boolean) {
    const summary = page.locator("[data-automated-records] > summary");
    const label = item.channel === "paper" ? "Type 1 capture lane" : "Type 2 worklist";
    const tileButton = page.getByRole("region", { name: "Actual session work counts", exact: true })
      .getByRole("button", { name: new RegExp(`^${label}`) });
    const tile = tileButton.locator("span").last();
    return {
      link: page.getByRole("link", { name: "Back to queue", exact: true }),
      tile: automatic ? summary : tile,
      expectedTileText: automatic ? "Automated session items (1)" : id === "EX-24112" ? "2" : "1",
      ...(automatic ? { expand: summary } : { select: tileButton }),
    };
  }
  function queueRow(automatic: boolean) {
    return automatic ? page.locator("[data-automated-records] li").filter({ hasText: id }).getByRole("link")
      : page.locator(item.channel === "paper" ? `[data-type1-case="${id}"] > summary` : `[data-case-id="${id}"] [data-item-state]`);
  }
  async function capture(endorsement: string) {
    const panel = page.getByRole("region", { name: `Type 1 capture for ${id}`, exact: true });
    for (const [field, value] of [
      ["Product code", "SYN-COCOD-100"], ["Quantity", "100"], ["Endorsement", endorsement],
      ["Prescriber", enabled ? "Dr Example (synthetic demo declaration)" : "Dr Demo (synthetic)"],
    ]) await panel.getByRole("textbox", { name: field, exact: true }).fill(value);
    if (enabled) await panel.getByRole("checkbox", { name: DECLARATION_RECONCILIATION, exact: true }).check();
    await assertVisibleHandoffWithinOneSecond(page, info, {
      name: name(`capture-${++captureNumber}`),
      action: panel.getByRole("button", { name: "Confirm capture and continue to Type 2", exact: true }),
      followedId: id, destination: "Pharmacy", originState: LIFECYCLE_LABELS.in_review.nhsbsa.on,
      destinationState: claimState(), destinationText: LIFECYCLE_LABELS.in_review.pharmacy,
      lastEventText: "Operator confirmed capture",
    });
    await bothSides();
  }

  await page.goto(`/pharmacy/claims?caseId=${id}`);
  await choosePerspective(page, "Both");
  await page.getByRole("banner").getByRole("switch").setChecked(enabled);
  await page.getByRole("region", { name: "Shared case history", exact: true }).getByRole("button", { name: "Follow this case", exact: true }).click();
  await side("Pharmacy");
  await navigatePrimary(page, "Pharmacy check");
  if (item.channel === "paper") {
    await choosePaperExample(page);
    if (enabled) await page.getByRole("button", { name: "Declaration missing information", exact: true }).click();
  } else await selectEpsScenario(page, id);
  const automatic = item.kind === "complete";
  const initialState = automatic ? enabled ? LIFECYCLE_LABELS.released_to_pricing.pharmacy : LIFECYCLE_LABELS.paid.pharmacy : LIFECYCLE_LABELS.submitted.pharmacy;
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("send-post"), action: page.locator('[data-pharmacy-action="submit"]'), followedId: id,
    destination: "NHSBSA", originState: initialState,
    originRequiredText: [{ locator: page.getByRole("region", { name: "Submission receipt", exact: true }).getByText(`${id}:2`, { exact: true }), text: `${id}:2` }],
    preQueueRequiredText: automatic ? [{
      locator: caseState(),
      text: enabled ? LIFECYCLE_LABELS.released_to_pricing.nhsbsa.on : LIFECYCLE_LABELS.paid.nhsbsa.off,
    }] : undefined,
    queue: queueTarget(automatic), destinationState: queueRow(automatic),
    destinationText: automatic ? `${id}: read-only record` : LIFECYCLE_LABELS.submitted.nhsbsa.on, stateMatch: "contains",
    lastEventText: automatic ? enabled ? "Released to existing pricing" : "Existing rules engine priced item" : enabled ? "Verification recorded" : "Pharmacy submitted item",
  });
  await bothSides();
  if (automatic) {
    await expect(page.getByRole("button", { name: "Release to pricing", exact: true })).toHaveCount(0);
    await side("Pharmacy");
    await expect(claim()).toContainText("Paid on the normal schedule");
    return;
  }
  if (item.channel === "paper") await capture("NCSO JB");
  else await operatorDecision(page).getByRole("button", { name: "Start review", exact: true }).click();

  await operatorRadio(page, "REQUEST_INFORMATION").check();
  const question = `Please confirm the current synthetic evidence for ${id}.`;
  await decisionNote(page, "REQUEST_INFORMATION").fill(question);
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("request-information"), action: operatorDecision(page).getByRole("button", { name: "Request information", exact: true }),
    followedId: id, destination: "Pharmacy", originState: LIFECYCLE_LABELS.information_requested.nhsbsa.on,
    destinationState: claimState(), destinationText: LIFECYCLE_LABELS.information_requested.pharmacy,
    requiredText: [{ locator: page.getByRole("region", { name: "Requested confirmation", exact: true }).getByText(question, { exact: true }), text: question }],
    lastEventText: "Operator requested information",
  });
  await bothSides();
  await side("Pharmacy");
  const answer = `The pharmacy confirms its recorded evidence for ${id}; a human must reconcile it.`;
  await page.getByRole("textbox", { name: "Confirm", exact: true }).fill(answer);
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("send-confirmation"), action: page.getByRole("button", { name: "Send confirmation", exact: true }),
    followedId: id, destination: "NHSBSA", originState: LIFECYCLE_LABELS.resubmitted.pharmacy,
    destinationState: caseState(), destinationText: LIFECYCLE_LABELS.resubmitted.nhsbsa.on,
    requiredText: [{ locator: page.getByRole("region", { name: "Pharmacy confirmation", exact: true }).getByText(answer, { exact: true }), text: answer }],
    lastEventText: enabled ? "Verification recorded" : "Pharmacy sent confirmation",
  });
  await bothSides();
  if (item.channel === "paper") await capture("NCSO JB");
  else await operatorDecision(page).getByRole("button", { name: "Start review", exact: true }).click();

  if (enabled) await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  else {
    await operatorRadio(page, "REFER_BACK").check();
    await decisionNote(page).fill(item.kind === "wrong-pack" ? "Please correct the pack size from the product record." : "Please add the dispensing date beside the initials.");
    await page.getByRole("combobox", { name: "RB code (required)", exact: true }).selectOption(item.kind === "missing-date" ? "SYN-NCSO" : "RB2B");
  }
  await expect(operatorRadio(page, "REFER_BACK")).toBeChecked();
  const reason = await decisionNote(page).inputValue();
  const rbCode = await page.getByRole("combobox", { name: "RB code (required)", exact: true }).inputValue();
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("refer-back"), action: operatorDecision(page).getByRole("button", { name: "Refer back", exact: true }),
    followedId: id, destination: "Pharmacy", originState: LIFECYCLE_LABELS.referred_back.nhsbsa.on,
    destinationState: claimState(), destinationText: LIFECYCLE_LABELS.referred_back.pharmacy,
    requiredText: [
      { locator: page.getByRole("region", { name: "Operator response", exact: true }).getByText(reason, { exact: true }).first(), text: reason },
      { locator: page.getByRole("region", { name: "Operator response", exact: true }).getByText(rbCode, { exact: true }).first(), text: rbCode },
      ...(enabled ? [{ locator: page.getByRole("region", { name: "Recommendation", exact: true }).getByText("Operator-approved; the agent verified and advised.", { exact: true }), text: "Operator-approved; the agent verified and advised." }] : []),
    ],
    lastEventText: "Referred back",
  });
  await bothSides();
  await side("Pharmacy");
  if (enabled) await page.getByRole("button", { name: "Apply suggested correction", exact: true }).click();
  else if (item.kind === "wrong-pack") await page.getByRole("spinbutton", { name: "Pack size dispensed", exact: true }).fill(String(EPS_SUPPLY_RULE.packSize));
  else {
    if (item.channel === "paper") {
      await page.getByRole("textbox", { name: "Declared product", exact: true }).fill("Co-codamol 30/500 tablets");
      await page.getByRole("spinbutton", { name: "Declared quantity", exact: true }).fill("100");
    }
    await page.getByRole("textbox", { name: "Corrected endorsement", exact: true }).fill(item.channel === "paper" ? "NCSO JB 27/08/26" : "NCSO RK 21/08/26");
  }
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("resubmit"), action: page.getByRole("button", { name: enabled ? "Resubmit" : "Resubmit blind", exact: true }),
    followedId: id, destination: "NHSBSA", originState: LIFECYCLE_LABELS.resubmitted.pharmacy,
    queue: queueTarget(false), destinationState: queueRow(false), destinationText: LIFECYCLE_LABELS.resubmitted.nhsbsa.on, stateMatch: "contains",
    lastEventText: enabled ? "Verification recorded" : "Pharmacy resubmitted item",
  });
  await bothSides();
  if (item.channel === "paper") await capture("NCSO JB 27/08/26");
  else await operatorDecision(page).getByRole("button", { name: "Start review", exact: true }).click();
  if (enabled) await operatorDecision(page).getByRole("button", { name: "Apply suggestion", exact: true }).click();
  else {
    await operatorRadio(page, "ACCEPT").check();
    await decisionNote(page).fill("The operator has checked the corrected source evidence before release.");
  }
  await assertVisibleHandoffWithinOneSecond(page, info, {
    name: name("release"), action: operatorDecision(page).getByRole("button", { name: "Release to pricing", exact: true }),
    followedId: id, destination: "Pharmacy",
    originState: enabled ? HUMAN_RELEASE_LABELS.nhsbsa : MANUAL_RELEASE_LABELS.nhsbsa,
    destinationState: claimState(), destinationText: enabled ? HUMAN_RELEASE_LABELS.pharmacy : MANUAL_RELEASE_LABELS.pharmacy,
    requiredText: [{ locator: claim().getByText("Paid on the normal schedule (synthetic).", { exact: true }), text: "Paid on the normal schedule" }], lastEventText: "Released after operator review",
  });
  await bothSides();
  await expect(follow()).not.toContainText("no operator action");
}
