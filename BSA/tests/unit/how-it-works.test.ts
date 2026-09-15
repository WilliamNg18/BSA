import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArchitecturePage } from "../../src/pages/architecture";
import { CASE_W_SEQUENCE, COMPONENT_FLOW, DESIGN_LABELS, DESIGN_SECTIONS, DESIGN_TITLE, systemDesignMarkdown } from "../../src/components/how-it-works/content";
import { REFERENCE_MAPPING } from "../../src/components/how-it-works/reference-mapping";
import { getDomainSnapshot, useAppStore } from "../../src/lib/store";

const render = () => renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ["/architecture"] }, createElement(ArchitecturePage)));

describe("Task 37 system design reference", () => {
  it("renders all ten sections, their exact labels, and matching contents anchors", () => {
    const html = render();
    expect(html).toContain(DESIGN_TITLE);
    expect(html).toContain('aria-label="How it works contents"');
    for (const id of [...DESIGN_SECTIONS.map((section) => section.id), "reference-mapping"]) {
      expect(html).toContain(`data-design-section="${id}"`);
      expect(html).toContain(`href="#${id}"`);
      expect(html).toContain(`id="${id}" tabindex="-1"`);
    }
    for (const label of Object.values(DESIGN_LABELS)) expect(html).toContain(label);
    expect(new Set(DESIGN_SECTIONS.map((section) => section.id)).size).toBe(DESIGN_SECTIONS.length);
  });

  it("keeps every required FAQ topic, with fourteen separate answers", () => {
    expect(DESIGN_SECTIONS.find((section) => section.id === "questions")?.panels.map((panel) => panel.title)).toEqual([
      "Why not fine-tune a model?", "Why three samples?", "What if the Tariff changes mid-month?",
      "What about EPS versus paper?", "How do you catch a wrong pick-list selection?",
      "How do you stop an invented clause?", "What happens when the agent is down?",
      "How is this different from the existing rules engine?", "Who owns the prompts and corpus?",
      "How do you evaluate it?", "What does the CISO need to see?", "How does this reach 11,100 pharmacies?",
      "What is the smallest first step?", "What would make you stop?",
    ]);
  });

  it("reports prose counts without turning the informational measure into a blocking budget", () => {
    const counts = DESIGN_SECTIONS.flatMap((section) => section.panels.map((panel) => ({
      title: panel.title, words: panel.text.trim().split(/\s+/u).length,
    })));
    console.info("Task37 prose audit", JSON.stringify({ panels: counts.length, overLimit: counts.filter(({ words }) => words >= 60) }));
    expect(counts.length).toBeGreaterThan(0);
  });

  it("confines implementation branding to the one reference table in rendered copy", () => {
    const html = render();
    const tables = html.match(/<table\b[^>]*data-reference-mapping="true"[^>]*>[\s\S]*?<\/table>/gu) ?? [];
    expect(tables).toHaveLength(1);
    const reference = tables[0];
    if (!reference) throw new Error("The reference mapping table is missing");
    expect(reference).toContain(REFERENCE_MAPPING.caption);
    expect(reference).toContain("Azure OpenAI");
    expect(html).toContain('aria-label="Reference mapping, one example table"');
    expect(html.replace(reference, "")).not.toMatch(/\b(Azure|Microsoft|OpenAI|Foundry|Cosmos|Entra)\b/u);
  });

  it("renders accessible local diagrams and complete text equivalents without script loading", () => {
    const html = render();
    expect(html.match(/<svg\b/gu)).toHaveLength(2);
    expect(html).toContain('aria-labelledby="components-title components-description"');
    expect(html).toContain('aria-labelledby="sequence-title sequence-description"');
    expect(COMPONENT_FLOW).toHaveLength(6);
    expect(CASE_W_SEQUENCE).toHaveLength(11);
    expect(html).not.toMatch(/<script|<iframe|https?:\/\//u);
    for (const text of [...COMPONENT_FLOW, ...CASE_W_SEQUENCE]) {
      expect(html).toContain(text.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("'", "&#x27;").replaceAll('"', "&quot;"));
    }
  });

  it("describes independent wrong-strength evidence and removes the retired date case", () => {
    const text = systemDesignMarkdown(REFERENCE_MAPPING);
    const html = render();
    for (const required of [
      "prescribed 10 mg / 28", "actual supply 10 mg / 28", "selected 5 mg / 28 claim",
      "Gate 1 flags strength", "Unchanged Send fails independent Gate 2",
      "This is the proof the agent does not rubber-stamp.",
      "If the selected 5 mg AMPP has a dm+d price",
      "Paper missing brand · EX-24112", "Case W sequence: wrong-strength EPS",
      "not an invented Tariff clause", "field-and-rule-only explanation",
      "corrected EPS revision at both gates", "no operator action. Paper remains a separate human-final path",
    ]) expect(text).toContain(required);
    expect(html).toContain("SYN-FQ123-MISMATCH wrong-strength sequence");
    expect(text).not.toMatch(/missing[- ]date|initialled, not dated|Gate 1 passes format/iu);
    expect(html).not.toMatch(/missing[- ]date|initialled, not dated|Gate 1 passes format/iu);
  });

  it("separates hypothetical scanner output, human capture and pharmacy correction authority", () => {
    const text = systemDesignMarkdown(REFERENCE_MAPPING);
    for (const required of [
      "scanner-captured values and per-field confidence", "actual scan",
      "revision-bound Type 1 human capture", "Extracted by character recognition (hypothetical)",
      "synthetic; illustrates what NHSBSA’s capture would produce",
      "not a real character-recognition service or model result",
      "Outbound NHSBSA notes contain the missing field and governing rule only.",
      "pharmacy suggestion from its own records", "Paper always requires an explicit final operator Release",
    ]) expect(text).toContain(required);
  });

  it("does not change operational state or depend on assistance or perspective", () => {
    useAppStore.getState().resetDemo();
    const first = render();
    for (const perspective of ["both", "pharmacy", "nhsbsa"] as const) {
      useAppStore.getState().setPerspective(perspective);
      for (const enabled of [false, true]) {
        useAppStore.getState().setAgentEnabled(enabled);
        const before = getDomainSnapshot();
        expect(render()).toBe(first);
        expect(getDomainSnapshot()).toEqual(before);
      }
    }
    useAppStore.getState().resetDemo();
  });

  it("keeps the full document exactly aligned with visible page content", () => {
    expect(readFileSync(new URL("../../docs/SYSTEM-DESIGN.md", import.meta.url), "utf8").replaceAll("\r\n", "\n"))
      .toBe(systemDesignMarkdown(REFERENCE_MAPPING));
  });

  it("checks token, monthly, retry, labour and service-subtotal arithmetic", () => {
    const perCase = 3 * ((2_000 * 2 + 400 * 8) / 1_000_000);
    expect(perCase).toBeCloseTo(0.0216);
    expect(perCase * 85_000).toBeCloseTo(1_836);
    expect(perCase * 5_000).toBeCloseTo(108);
    expect(108 * 1.1 + 100 + 20 + 20 + 30).toBeCloseTo(288.8);
    expect(1_836 * 1.1 + 300 + 100 + 200 + 100 + 150).toBeCloseTo(2_869.6);
    expect(13 / 60 * 30 * 85_000).toBeCloseTo(552_500);
    const text = systemDesignMarkdown(REFERENCE_MAPPING);
    for (const value of ["0.0216", "1,836", "288.80", "2,869.60", "552,500"]) expect(text).toContain(value);
  });

  it("distinguishes business-day averages, calendar averages and assumed burst concurrency", () => {
    expect(85_000 / 22).toBeCloseTo(3_863.64, 2);
    expect(85_000 / (22 * 8 * 60)).toBeCloseTo(8.05, 2);
    expect(85_000 / (30 * 24 * 60)).toBeCloseTo(1.97, 2);
    expect(40.25 * 45 / 60).toBeCloseTo(30.19, 2);
    const text = systemDesignMarkdown(REFERENCE_MAPPING);
    expect(text).toContain("Neither average is a measured peak.");
    expect(text).toContain("Target under one minute");
    expect(text).toContain("no model call on every claim by default");
  });

  it("preserves factual and proposed evidence boundaries", () => {
    const text = systemDesignMarkdown(REFERENCE_MAPPING);
    for (const required of [
      "not a model", "Scripted three-reading agreement", "Unknown reconciliation is not agreement",
      "0.60", "two of three", "Reset or reload clears operational memory",
      "No durable append-only service", "billing and shared costs are unverified",
      "two operators", "fifty", "zero-influence shadow", "does not calculate or approve payments",
    ]) {
      expect(text).toContain(required);
    }
  });
});
