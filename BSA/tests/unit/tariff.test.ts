import { describe, expect, it } from "vitest";
import { TARIFF_VERSIONS, versionById, versionForDate } from "../../src/lib/domain/tariff";

describe("versioned synthetic Tariff", () => {
  it.each(TARIFF_VERSIONS)("includes both effective boundaries of $version", (version) => {
    expect(versionForDate(version.effectiveFrom)).toBe(version);
    expect(versionForDate(version.effectiveTo)).toBe(version);
    expect(versionById(version.version)).toBe(version);
  });

  it.each(["2026-06-30", "2026-10-01", "", "not-a-date", "2026-08-00", "2026-08-32", "2026-09-31", "2026-08-1", "2026-08-14T12:00:00Z", "2026-08-14junk"])(
    "does not invent a version for unsupported or malformed date %s", (date) => {
      expect(versionForDate(date)).toBeNull();
    },
  );

  it("does not silently default unknown replay ids", () => {
    expect(versionById("2026-06")).toBeNull();
    expect(versionById("")).toBeNull();
  });

  it("pins the July to August change and September concession withdrawal", () => {
    const [july, august, september] = TARIFF_VERSIONS;
    const ncso = (v: typeof july) => v.clauses.find((c) => c.endorsementType === "NCSO")!;
    expect(ncso(july).requirements.map((r) => r.id)).toEqual(["endorsement_present", "initialled"]);
    expect(ncso(august).requirements.map((r) => r.id)).toEqual(["endorsement_present", "initialled", "dated"]);
    expect(ncso(september)).toEqual(ncso(august));
    expect(august.concessions.find((c) => c.productCode === "SYN-AMLO10-28")?.price).toBe(2.95);
    expect(september.concessions.some((c) => c.productCode === "SYN-AMLO10-28")).toBe(false);
  });
});