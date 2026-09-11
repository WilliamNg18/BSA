/** Curated display facts and assumptions. Research and personal material stay offline. */
export const PUBLIC_FACTS = Object.freeze({ annualItems: 1_100_000_000, monthlyReferrals: 85_000, annualReferrals: 1_000_000, rulebookPublication: "Monthly" });

export const SOURCES_FOOTER = "Public information (NHSBSA and Community Pharmacy England publications) and stated assumptions. All operational data on this site is synthetic.";

export const TOUR_CONTENT = {
  chapters: [
    { chapter: 1, title: "The referred-back subset", prose: "Approximately 85,000 items return monthly for clarification. This subset is not the whole operator queue. Rulebook publication does not establish rule-change frequency." },
    { chapter: 3, title: "The exception pipeline", prose: "Keep capture and pricing unchanged. Build evidence for uncertain exceptions, retain manual abstention, and let a human decide. Workflow pain points are assumptions." },
    { chapter: 4, title: "A bounded proposal", prose: "Follow referral, pharmacy correction and resubmission through one synthetic history. Humans decide; assistance does not guarantee acceptance, payment or shorter delays." },
    { chapter: 6, title: "What the pharmacy sees", prose: "Track the same synthetic claim, read the human decision, correct or confirm, then resubmit for re-check. Assistance never guarantees payment." },
    { chapter: 7, title: "Decide on evidence", prose: "Test handling time and repeat work against accuracy guardrails. Separate pharmacy benefits. Agree when to proceed, reshape or stop." },
  ],
  keyFigures: [
    { id: "annual-items", value: "Approximately 1.1 billion", label: "Primary-care items per year in England", qualifier: "Items, not physical forms. Reporting year unspecified; not independently verified." },
    { id: "monthly-referrals", value: "Approximately 85,000", label: "Referred-back items per month", qualifier: "Approximate 2024/25 referral subset. One million divided by twelve is approximately 83,333, not exactly 85,000; total operator volume remains unknown." },
    { id: "rulebook-publication", value: PUBLIC_FACTS.rulebookPublication, label: "Drug Tariff publication", qualifier: "Monthly publication does not establish endorsement-rule change frequency. Not independently verified." },
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