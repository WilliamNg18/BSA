import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimsResubmissionComparison } from "@/components/demo/claims-resubmission-comparison";
import type { PharmacyCheck } from "@/lib/domain/pharmacy-check";

const statuses: Array<PharmacyCheck["status"] | null> = [null, "missing", "unable", "ready"];

describe("claims resubmission comparison authority", () => {
  for (const enabled of [false, true]) {
    for (const approved of [false, true]) {
      for (const status of statuses) {
        it(`enabled=${enabled}, approved=${approved}, status=${status}`, () => {
          const markup = renderToStaticMarkup(createElement(ClaimsResubmissionComparison, { enabled, approved, status }));
          const resolved = enabled && approved && status === "ready";
          expect(markup).toContain(`data-pain-marker="${resolved ? "resolved" : "open"}"`);
          if (!enabled) {
            expect(markup).toContain("Synthetic assumption");
            expect(markup).toContain("Real pharmacy checks are unknown");
            expect(markup).toContain("No advisory sufficiency check");
            expect(markup).not.toContain("Assisted");
          } else {
            expect(markup).toContain("not payment");
            expect(markup).toContain("human re-check");
            if (!approved) expect(markup).toContain("No operator-approved correction");
            else if (status === "missing") expect(markup).toContain("Current correction remains incomplete");
            else if (status === "ready") expect(markup).toContain("Current correction checked");
            else expect(markup).toContain("Current correction not verified");
          }
        });
      }
    }
  }
});
