import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimsResubmissionComparison } from "@/components/demo/claims-resubmission-comparison";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";

const statuses: Array<PharmacyCheck["status"] | null> = [null, "missing", "unable", "ready"];

describe("claims resubmission comparison authority", () => {
  for (const enabled of [false, true]) {
    for (const status of statuses) {
      it(`enabled=${enabled}, status=${status}`, () => {
        const markup = renderToStaticMarkup(createElement(ClaimsResubmissionComparison, { enabled, status }));
        const resolved = enabled && status === "ready";
        expect(markup).toContain(`data-pain-marker="${resolved ? "resolved" : "open"}"`);
        if (!enabled) {
          expect(markup).toContain("Hypothetical repeat correction, not a prediction");
          expect(markup).not.toContain("Assisted");
        } else {
          if (status === "missing") expect(markup).toContain("Current correction remains incomplete");
          else if (status === "ready") expect(markup).toContain("Ready; explicit resubmission required");
          else expect(markup).toContain("Current correction not verified");
        }
      });
    }
  }
});
