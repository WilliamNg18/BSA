import { checkPharmacy, interpretPharmacyText, type PharmacyCheck } from "./pharmacy-check";
import { evaluateEpsSupply } from "./eps-check";
import { mandatoryFieldsCheck, validateCitation } from "./rules";
import { routeSubmission, routingFactsForCase } from "./routing";
import { versionForDate } from "./tariff";
import type { ExceptionCase } from "./types";

/** Uses the same projected source fields and routing authority as actual Send. */
export function checkEpsPharmacy(c: ExceptionCase, text: string): PharmacyCheck {
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
  const routing = routeSubmission(routingFactsForCase(c, "eps"));
  if (result.status === "ready" && routing.outcome !== "auto_priced") {
    return { ...result, status: "unable", gap: routing.reason, stages: [...result.stages.slice(0, -1), "STOPPED"] };
  }
  return result;
}
