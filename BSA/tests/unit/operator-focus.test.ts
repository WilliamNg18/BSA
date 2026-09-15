import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureFocusKey, revealOperatorNote } from "../../src/lib/operator-focus";
import { captureForRevision } from "../../src/lib/domain/lifecycle-model";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

beforeEach(() => useAppStore.getState().resetDemo());

describe("operator capture and note focus", () => {
  it("does not announce the same capture again when Apply clones its immutable history object", () => {
    const store = useAppStore.getState(), id = "EX-24123";
    store.setAgentEnabled(true);
    const revision = store.caseRevisions[id].at(-1)!;
    store.confirmType1({ caseId: id, revision: revision.number, fields: revision.declaration!.fields,
      provenance: "pharmacy_declaration", declarationReconciled: true });
    const captured = captureForRevision(useAppStore.getState().lifecycles[id], revision.number)!;
    const beforeKey = captureFocusKey(id, captured);
    store.applySuggestionToDecision(id);
    const after = captureForRevision(useAppStore.getState().lifecycles[id], revision.number)!;
    expect(after).not.toBe(captured);
    expect(after).toEqual(captured);
    expect(captureFocusKey(id, after)).toBe(beforeKey);
    expect(captureFocusKey(id, { ...after, confirmedAt: "2026-09-15T23:59:59.000Z" })).not.toBe(beforeKey);
    expect(captureFocusKey(id, null)).toBeNull();
  });

  it("reveals the full focused control with a viewport margin without changing domain state", () => {
    const before = getDomainSnapshot();
    const scrollIntoView = vi.fn(), scrollBy = vi.fn();
    const element = {
      scrollIntoView,
      getBoundingClientRect: () => ({ x: 20, y: 950, top: 950, bottom: 1014, left: 20,
        right: 820, width: 800, height: 64, toJSON: () => ({}) }),
    };
    revealOperatorNote(element, { innerHeight: 1000, scrollBy });
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: "nearest", inline: "nearest", behavior: "instant" });
    expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: 22, behavior: "instant" });
    expect(getDomainSnapshot()).toEqual(before);
  });

  it.each([{ bottom: 700, height: 64 }, { bottom: 1500, height: 1400 }])(
    "does not add margin scrolling for an already-contained or user-oversized field: %j", ({ bottom, height }) => {
      const scrollBy = vi.fn();
      revealOperatorNote({
        scrollIntoView: vi.fn(),
        getBoundingClientRect: () => ({ x: 0, y: bottom - height, top: bottom - height, bottom,
          left: 0, right: 800, width: 800, height, toJSON: () => ({}) }),
      }, { innerHeight: 1000, scrollBy });
      expect(scrollBy).not.toHaveBeenCalled();
    },
  );
});
