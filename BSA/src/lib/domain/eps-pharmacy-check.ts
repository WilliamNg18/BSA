import { checkPharmacy, interpretPharmacyText, type PharmacyCheck } from "./pharmacy-check";
import { evaluateEpsSupply } from "./eps-check";
import { mandatoryFieldsCheck, validateCitation } from "./rules";
import { routeSubmission, routingFactsForCase } from "./routing";
import { versionForDate } from "./tariff";
import type { ExceptionCase } from "./types";
import { evaluateEpsStrength } from "./eps-strength";

/** Field completeness alone is not permission to price or skip human recheck. */
export function checkEpsFields(c: ExceptionCase, text: string): PharmacyCheck {
  const strength = c.epsPrescription?.supplyRecord ? evaluateEpsStrength(c.epsPrescription) : null;
  if (strength) {
    const checks = [...mandatoryFieldsCheck(c.extracted), ...strength.checks].map((entry, index) => ({
      id: `source-${index}`, label: entry.name, met: entry.pass,
    }));
    const ready = checks.every((entry) => entry.met);
    return { status: ready ? "ready" : "missing", ruleAuthority: "proposed_cross_record_check",
      facts: interpretPharmacyText(text), version: null, clause: null, checks,
      stages: ["PASS", "PASS", "PASS", "PASS", ready ? "PASS" : "MISSING"],
      gap: ready ? "None" : strength.gap, agreement: "Independent structured records; no image or repeated readings apply." };
  }
  const supply = c.epsPrescription ? evaluateEpsSupply(c.epsPrescription) : null;
  const version = versionForDate(c.extracted.dispensingDate);
  const clause = supply ? version?.clauses.find((entry) => entry.id === supply.ruleId) : null;
  let result: PharmacyCheck;
  if (supply) {
    const validated = Boolean(clause && version && validateCitation(clause, version, clause.text));
    const checks = [
      ...mandatoryFieldsCheck(c.extracted).map((entry, index) => ({ id: `mandatory-${index}`, label: entry.name, met: entry.pass })),
      ...supply.checks,
    ];
    const ready = validated && checks.every((check) => check.met);
    result = {
      status: !validated ? "unable" : ready ? "ready" : "missing",
      facts: { ...interpretPharmacyText(text), type: "SUPPLY", note: "Synthetic generic supply fields, not an image reading" },
      version: supply.version, clause: validated ? structuredClone(clause!) : null, checks,
      stages: ["PASS", "PASS", version ? "PASS" : "STOPPED", validated ? "PASS" : "STOPPED", ready ? "PASS" : "MISSING"],
      gap: validated ? checks.filter((check) => !check.met).map((check) => check.label).join(", ") || "None"
        : "No validated dispensing-month supply clause", agreement: "Deterministic source-field checks",
    };
  } else {
    result = checkPharmacy(c, text, { channel: "eps" });
  }
  return result;
}

/** Uses the same projected source fields and routing authority as actual Send. */
export function checkEpsPharmacy(c: ExceptionCase, text: string): PharmacyCheck {
  const result = checkEpsFields(c, text);
  const routing = routeSubmission(routingFactsForCase(c, "eps"));
  if (result.status === "ready" && routing.outcome !== "auto_priced") {
    return { ...result, status: "unable", gap: routing.reason, stages: [...result.stages.slice(0, -1), "STOPPED"] };
  }
  return result;
}
