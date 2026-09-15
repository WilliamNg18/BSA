export const HUMAN_RELEASE_LABELS = {
  pharmacy: "Verified and released to pricing after operator review (synthetic)",
  nhsbsa: "Verified and released to existing pricing after operator review",
} as const;

export const MANUAL_RELEASE_LABELS = {
  pharmacy: "Released to pricing after operator review (synthetic)",
  nhsbsa: "Released to existing pricing after operator review",
} as const;
