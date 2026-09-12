import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => [] as Array<() => (() => void)>);
vi.mock("react", () => ({ useLayoutEffect: (effect: () => (() => void)) => effects.push(effect) }));

class Style {
  values = new Map<string, { value: string; priority: string }>();
  getPropertyValue(name: string) { return this.values.get(name)?.value ?? ""; }
  getPropertyPriority(name: string) { return this.values.get(name)?.priority ?? ""; }
  setProperty(name: string, value: string, priority = "") { this.values.set(name, { value, priority }); }
  removeProperty(name: string) { this.values.delete(name); }
}

describe("CSP-safe Radix scrollbar adapter", () => {
  const style = new Style();
  const attributes = new Map<string, string>();
  beforeEach(() => {
    vi.resetModules();
    effects.length = 0;
    style.values.clear();
    attributes.clear();
    vi.stubGlobal("document", {
      documentElement: { clientWidth: 1000 },
      body: {
        style,
        getAttribute: (name: string) => attributes.get(name) ?? null,
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        removeAttribute: (name: string) => attributes.delete(name),
      },
    });
    vi.stubGlobal("window", { innerWidth: 1015 });
    vi.stubGlobal("getComputedStyle", () => ({
      marginLeft: "8px", marginTop: "4px", marginRight: "8px",
      paddingLeft: "12px", paddingTop: "6px", paddingRight: "14px",
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  async function mount(options = {}) {
    const { RemoveScrollBar } = await import("../../src/lib/csp-scroll-lock");
    RemoveScrollBar(options);
    return effects.at(-1)!();
  }

  it("locks with measured compensation and restores previous properties and priorities", async () => {
    style.setProperty("overflow", "auto", "important");
    style.setProperty("margin-right", "8px");
    style.setProperty("color", "red");
    const unlock = await mount();
    expect(style.getPropertyValue("overflow")).toBe("hidden");
    expect(style.getPropertyPriority("overflow")).toBe("important");
    expect(style.getPropertyValue("--removed-body-scroll-bar-size")).toBe("15px");
    expect(style.getPropertyValue("margin-right")).toBe("15px");
    expect(style.getPropertyValue("padding-left")).toBe("8px");
    expect(attributes.get("data-scroll-locked")).toBe("1");
    unlock();
    expect(style.getPropertyValue("overflow")).toBe("auto");
    expect(style.getPropertyPriority("overflow")).toBe("important");
    expect(style.getPropertyValue("margin-right")).toBe("8px");
    expect(style.getPropertyValue("position")).toBe("");
    expect(style.getPropertyValue("--removed-body-scroll-bar-size")).toBe("");
    expect(style.getPropertyValue("color")).toBe("red");
    expect(attributes.has("data-scroll-locked")).toBe(false);
  });

  it("keeps the first lock until the last nested modal closes, even out of order", async () => {
    const outer = await mount();
    const inner = await mount({ gapMode: "padding" });
    expect(attributes.get("data-scroll-locked")).toBe("2");
    outer();
    expect(attributes.get("data-scroll-locked")).toBe("1");
    expect(style.getPropertyValue("overflow")).toBe("hidden");
    expect(style.getPropertyValue("margin-right")).toBe("15px");
    inner();
    expect(attributes.has("data-scroll-locked")).toBe(false);
    expect(style.values.size).toBe(0);
  });

  it("supports padding mode, noRelative and noImportant without stylesheet injection", async () => {
    const unlock = await mount({ gapMode: "padding", noRelative: true, noImportant: true });
    expect(style.getPropertyValue("padding-right")).toBe("17px");
    expect(style.getPropertyValue("margin-right")).toBe("");
    expect(style.getPropertyValue("position")).toBe("");
    expect(style.getPropertyPriority("overflow")).toBe("");
    unlock();
    expect(style.values.size).toBe(0);
  });

  it("can remount after strict-effect cleanup and preserves an existing lock attribute", async () => {
    attributes.set("data-scroll-locked", "existing");
    (await mount())();
    const unlock = await mount();
    expect(attributes.get("data-scroll-locked")).toBe("1");
    unlock();
    expect(attributes.get("data-scroll-locked")).toBe("existing");
  });
});
