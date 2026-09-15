import { expect, it } from "vitest";
import { TransitionDeadline } from "../support/transition-deadline";

it("budgets from before the actual action, not after waiting for a result", () => {
  let clock = 50;
  const deadline = new TransitionDeadline(() => clock);
  clock = 425;
  expect(deadline.remainingMs()).toBe(625);
  clock = 850;
  expect(deadline.remainingMs()).toBe(200);
  expect(deadline.finish()).toBe(800);
});

it("does not reset the deadline between origin and destination observations", () => {
  let clock = 0;
  const deadline = new TransitionDeadline(() => clock);
  clock = 990;
  expect(deadline.remainingMs()).toBe(10);
  clock = 1001;
  expect(() => deadline.remainingMs()).toThrow("one-second deadline");
  expect(() => deadline.finish()).toThrow("1001.00 ms");
});

it("accepts exactly one second only after all observations have completed", () => {
  let clock = 0;
  const deadline = new TransitionDeadline(() => clock);
  clock = 1000;
  expect(deadline.finish()).toBe(1000);
  expect(() => deadline.remainingMs()).toThrow("one-second deadline");
});

it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])("rejects invalid elapsed measurements: %s", (value) => {
  let clock = 0;
  const deadline = new TransitionDeadline(() => clock);
  clock = value;
  expect(() => deadline.finish()).toThrow("Invalid monotonic transition clock.");
});
