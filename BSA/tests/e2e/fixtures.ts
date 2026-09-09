import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("requestfailed", (request) => errors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
    page.on("response", (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    await use(errors);
    expect(errors, "Production browser errors must not be swallowed by an error boundary").toEqual([]);
  }, { auto: true }],
});

export { expect };

export const cases = [
  { id: "EX-24107", title: "Valid and complete" },
  { id: "EX-24112", title: "Missing or insufficient information" },
  { id: "EX-24119", title: "Evidence conflict" },
  { id: "EX-24123", title: "Deliberate failure and abstention" },
  { id: "EX-24101", title: "Cleared by rules (no model call)" },
  { id: "EX-24088", title: "Human decision recorded" },
];

export const staticRoutes = [
  { path: "", title: "85,000 times a month, a person decides what the machine could not" },
  { path: "pharmacy", title: "Pharmacy pre-submission check" },
  { path: "queue", title: "NHSBSA exception queue" },
  { path: "evaluation", title: "Evaluation and guardrails" },
  { path: "boundary", title: "Agent, deterministic code, human decision" },
  { path: "assumptions", title: "The assumptions that decide whether an agent is needed" },
  { path: "architecture", title: "Technical architecture and the path to production" },
  { path: "notes", title: "Presenter notes" },
];