import { describe, expect, it } from "vitest";
import { isCommittedDemoLocation } from "../../src/lib/demo-focus";

const location = (pathname = "/", search = "", hash = "") => ({ pathname, search, hash });

describe("demo focus waits for the committed router location", () => {
  it("rejects the transient old route when the store mounts step 1 first", () => {
    expect(isCommittedDemoLocation(location("/", "", "#scene"), location("/", "", "#pipeline"))).toBe(false);
    expect(isCommittedDemoLocation(location("/", "", "#pipeline"), location("/", "", "#pipeline"))).toBe(true);
  });

  it.each([
    [location("/pharmacy"), location("/queue")],
    [location("/pharmacy", "?case=EX-24112"), location("/pharmacy", "?case=EX-24123")],
    [location("/case/EX-24123"), location("/pharmacy/claims", "?case=EX-24123")],
    [location("/", "", "#month"), location("/", "", "#close")],
  ])("does not focus for a pending path, case query or hash transition", (rendered, browser) => {
    expect(isCommittedDemoLocation(rendered, browser)).toBe(false);
  });

  it.each([
    location("/", "", "#pipeline"),
    location("/", "", "#month"),
    location("/pharmacy", "?case=EX-24123&channel=paper"),
    location("/queue", "?case=EX-24123"),
    location("/case/EX-24123"),
    location("/pharmacy/claims", "?case=EX-24123"),
  ])("allows the committed destination without changing either location", (current) => {
    const rendered = Object.freeze({ ...current });
    const browser = Object.freeze({ ...current });
    expect(isCommittedDemoLocation(rendered, browser)).toBe(true);
    expect(rendered).toEqual(current);
    expect(browser).toEqual(current);
  });

  it("uses the same Vite basename contract as BrowserRouter", () => {
    expect(isCommittedDemoLocation(location("/case/EX-24123"), location("/demo/case/EX-24123"), "/demo/")).toBe(true);
    expect(isCommittedDemoLocation(location("/case/EX-24123"), location("/other/case/EX-24123"), "/demo/")).toBe(false);
    expect(isCommittedDemoLocation(location(), location("/demo"), "/demo/")).toBe(true);
    expect(isCommittedDemoLocation(location(), location("/demo/"), "/demo/")).toBe(true);
  });
});
