import { itemStateLabel, type CaseLifecycle, type CaseRevision, type HistoryEvent, type ItemProcess } from "./domain/lifecycle";

export function historyStateLabel(row: CaseLifecycle, index: number, side: "pharmacy" | "nhsbsa", enabled: boolean, before = false): string {
  const event = row.history[index];
  if (!event) throw new Error("The requested history event is unavailable.");
  const state = before ? event.from : event.to;
  if (!state) return "New";
  return itemStateLabel({ ...row, state, history: row.history.slice(0, index + (before ? 0 : 1)) }, side, enabled);
}

export function followedChannel(row: CaseLifecycle, process?: ItemProcess, revision?: CaseRevision): string {
  const channel = process?.channel ?? revision?.channel ?? row.history.filter((event) => event.channel).at(-1)?.channel;
  return channel === "eps" ? "EPS" : channel === "paper" ? "Paper" : "Channel not recorded";
}

/** Gates run synchronously on submission, not while navigating between views. */
export function followedLocation(row: CaseLifecycle, process?: ItemProcess): string {
  switch (row.state) {
    case "released_to_pricing":
    case "paid": return "Released to existing pricing";
    case "referred_back": return "Referred back to pharmacy";
    case "information_requested": return "Pharmacy: confirmation requested";
    case "escalated": return "Type 2: senior review";
  }
  switch (process?.routing.outcome) {
    case "type1_capture": return "Type 1: capture";
    case "type2_endorsement": return "Type 2: review";
    case "referred_back": return "Referred back to pharmacy";
  }
  return "Location not recorded";
}

function historyAction(event: HistoryEvent): string {
  switch (event.processStep) {
    case "suggestion_applied": return "Operator applied suggestion";
    case "correction_applied": return "Pharmacy applied correction";
    case "type1_capture": return "Operator confirmed capture";
    case "release_to_pricing": return event.actor === "operator" || event.releaseOrigin === "human_decision"
      ? "Released after operator review" : "Released to existing pricing";
    case "verification": return "Verification recorded";
    case "automatic_pricing":
    case "existing_pricing": return "Existing rules engine priced item";
    case "referral": return "Referred back";
    case "submission": return "Pharmacy submitted item";
    case "resubmission": return "Pharmacy resubmitted item";
  }
  switch (event.decision) {
    case "REFER_BACK": return "Referred back";
    case "REQUEST_INFORMATION": return "Operator requested information";
    case "ESCALATE": return "Operator escalated item";
    case "ACCEPT": return "Operator accepted item";
    case "AMEND": return "Operator amended decision";
  }
  if (event.actor === "agent") return event.recommendation === "ABSTAIN" ? "Agent abstained" : "Agent advice recorded";
  if (event.actor === "pharmacy" && event.from === "information_requested") return "Pharmacy sent confirmation";
  switch (event.to) {
    case "submitted": return "Pharmacy submitted item";
    case "resubmitted": return "Pharmacy resubmitted item";
    case "in_review": return "Routed for operator review";
    case "information_requested": return "Operator requested information";
    case "referred_back": return "Referred back";
    case "escalated": return "Operator escalated item";
    case "paid": return "Existing rules engine priced item";
    case "released_to_pricing": return event.actor === "operator" || event.releaseOrigin === "human_decision"
      ? "Released after operator review" : "Released to existing pricing";
  }
}

export function followedLastEvent(row: CaseLifecycle): string {
  const event = row.history.at(-1);
  if (!event) return "No history event recorded";
  const timestamp = /(?:Z|[+-]\d{2}:\d{2})$/.test(event.at) ? event.at : `${event.at}Z`;
  const date = new Date(timestamp);
  const day = Number.isNaN(date.getTime()) ? "date unavailable" : new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "long", timeZone: "UTC",
  }).format(date);
  return `${historyAction(event)} ${day}${event.rbCode ? `, ${event.rbCode}` : ""} (synthetic)`;
}
