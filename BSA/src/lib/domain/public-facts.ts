/** Curated display facts and assumptions. Research and personal material stay offline. */
export const PUBLIC_FACTS = Object.freeze({ annualItems: 1_100_000_000, monthlyReferrals: 85_000, annualReferrals: 1_000_000, rulebookPublication: "Monthly" });

export const SOURCES_FOOTER = "Owner-supplied public process context attributed to NHSBSA and Community Pharmacy England; not independently verified here. All operational data is synthetic.";

export const TOUR_CONTENT = {
  chapters: [
    { chapter: 1, title: "Most items need no person", prose: "Straightforward items flow to automated pricing. Staff capture uncertain reads and judge endorsements; unresolved items return to the pharmacy." },
    { chapter: 2, title: "A month in numbers", prose: "Estimate a smaller referral loop. Count gathering, judgement and double-checks; keep pharmacy labour separate from operator hours." },
    { chapter: 3, title: "Evidence to a decision", prose: "Follow automatic pricing, capture and judgement. Assistance checks declarations and gathers evidence; people confirm uncertain fields and decide." },
    { chapter: 4, title: "Cases and boundaries", prose: "Compare automatic pricing, missing information, unresolved conflict and unreadable paper. Declared evidence needs human confirmation; uncertainty never becomes source agreement." },
    { chapter: 5, title: "One continuous cycle", prose: "Follow Hillcrest's item through submission, judgement, correction and re-check. Switching sides preserves its evidence, decisions and history." },
    { chapter: 6, title: "The central bet", prose: "Test prevention at the pharmacy before promising fewer referrals. Estimates depend on assumptions; the agent never calculates or approves payments." },
  ],
  keyFigures: [
    { id: "automated-items", value: "Most items", label: "Priced automatically, no person involved", qualifier: "Straightforward items are priced by NHSBSA's existing rules engine. Owner-supplied public context, not independently verified." },
    { id: "staff-touch", value: "Approximately 4%", label: "Items receiving a staff touch", qualifier: "Approximate public context. Type 1 and Type 2 can overlap; their lane shares must not be added as unique staff touches." },
    { id: "monthly-referrals", value: "Approximately 85,000", label: "Referred-back items per month", qualifier: "Owner-supplied public referral context, not independently verified. This subset is neither all items nor all staff work." },
  ],
  assumptionsDisclosure: {
    title: "Five assumptions to validate",
    text: "Validate each premise before investing; these are not established current-state facts.",
    assumptions: [
      { text: "Repeatable exception causes", validation: "Analyse two years of reason codes.", ifWrong: "Stop if no repeatable pattern." },
      { text: "Material assembly effort", validation: "Time operators for a day.", ifWrong: "Compare a simpler pre-fetched screen." },
      { text: "Evidence across systems", validation: "Confirm access and reconciliation needs.", ifWrong: "Prefer a simpler lookup." },
      { text: "Interpretation beyond rules", validation: "Review fifty exceptions and one year of relevant rule changes.", ifWrong: "Encode stable rules instead." },
      { text: "Usable decision history", validation: "Inspect labels and adjudication quality.", ifWrong: "Label an evaluation set; reassess feasibility." },
    ],
  },
  questionsDisclosure: {
    title: "Seven discovery questions",
    text: "Use synthetic examples to identify the operational evidence still needed.",
    questions: [
      { id: "effort", text: "Where does operator time go: finding evidence or judging it?" },
      { id: "agreement", text: "How often do operators agree, and where are their reasons recorded?" },
      { id: "change", text: "How do rule changes reach operators, and what goes wrong during handover?" },
      { id: "cost", text: "What is the fully loaded cost of repeat handling, and which accuracy measures must not deteriorate?" },
      { id: "value", text: "Which outcome matters most: operator capacity, affected-item payment timing, or reconstructable decisions?" },
      { id: "boundary", text: "Where should recommendations appear, what stays deterministic, and what information may reach a model?" },
      { id: "stop", text: "What evidence would justify trust, and what would tell us to stop?" },
    ],
  },
} as const;