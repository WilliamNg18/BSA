import { describe, expect, it } from "vitest";
import { PROCESS_INPUT_PROVENANCE, PROCESS_MONTH_DEFAULTS, PROCESS_PUBLIC_FACTS } from "../../src/lib/domain/baseline";
import type { ItemChannel, RoutingOutcome } from "../../src/lib/domain/types";

describe("Tasks 19-24 frozen process contracts", () => {
  it("separates the whole process, staff streams and referral tail", () => {
    expect(PROCESS_MONTH_DEFAULTS).toMatchObject({
      monthlyItems: 100_000_000, epsPercent: 91, type1Percent: 2.2, type2Percent: 2,
      type2SecondsToday: 13, investigationMinutesToday: 4, pharmacyCompletionMinutes: 6,
      monthlyReferrals: 85_000, builtJudgingSeconds: 45,
    });
    expect(PROCESS_PUBLIC_FACTS.paperPercent + PROCESS_PUBLIC_FACTS.epsPercent).toBe(100);
    expect(PROCESS_MONTH_DEFAULTS.abstainPercent).toBe(100 / 6);
    expect(PROCESS_MONTH_DEFAULTS.builtJudgingSeconds).toBeGreaterThan(PROCESS_MONTH_DEFAULTS.type2SecondsToday);
  });

  it("labels every editable input rather than presenting assumptions as public measurements", () => {
    expect(Object.keys(PROCESS_INPUT_PROVENANCE).sort()).toEqual(Object.keys(PROCESS_MONTH_DEFAULTS).sort());
    expect(PROCESS_INPUT_PROVENANCE.investigationMinutesToday).toBe("assumption");
    expect(PROCESS_INPUT_PROVENANCE.type1KeySeconds).toBe("assumption");
    expect(PROCESS_INPUT_PROVENANCE.monthlyItems).toBe("public-derived");
    expect(Object.isFrozen(PROCESS_MONTH_DEFAULTS)).toBe(true);
  });

  it("pins the four routes and two machine-readable channels", () => {
    const channels: ItemChannel[] = ["eps", "paper"];
    const outcomes: RoutingOutcome[] = ["auto_priced", "type1_capture", "type2_endorsement", "referred_back"];
    expect(channels).toHaveLength(2);
    expect(outcomes).toHaveLength(4);
    expect(PROCESS_PUBLIC_FACTS.unpaidExpiryMonths).toBe(18);
    expect(PROCESS_PUBLIC_FACTS.advancePercent).toBe(80);
  });
});
