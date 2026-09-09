import { historyFor, productByCode, productCandidates } from "./reference";
import { versionById, versionForDate } from "./tariff";
import type {
  EndorsementType,
  ExceptionCase,
  HistoryRecord,
  Product,
  TariffClause,
  TariffVersion,
  ToolCall,
} from "./types";

// Tool-style functions the agent may call. Every tool is READ-ONLY against a
// mocked enterprise source. In production each maps to a named service; the
// contract (inputs, outputs, provenance) is what NHSBSA would own.

export interface ToolDefinition {
  name: string;
  purpose: string;
  input: string;
  output: string;
  mock: string;
  production: string;
  cls: "existing" | "deterministic" | "agent";
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  { name: "read_image_region", purpose: "Read the located endorsement margin and item line of the scanned form", input: "{ imageRef, regionId }", output: "{ text, confidence, bbox }", mock: "Pre-annotated regions on synthetic forms", production: "Azure AI Document Intelligence (layout) over NHSBSA's existing image store", cls: "existing" },
  { name: "lookup_product_pack", purpose: "Resolve the product and pack from the captured text", input: "{ productCode | productText }", output: "{ product, candidates[] }", mock: "Local synthetic product table", production: "NHSBSA product and pack master data (dm+d-aligned), read-only", cls: "deterministic" },
  { name: "retrieve_tariff", purpose: "Fetch the clause in force on the dispensing date for an endorsement type", input: "{ endorsementType, dispensingDate }", output: "{ version, clause, text }", mock: "Local versioned synthetic corpus (3 months)", production: "Azure AI Search over the versioned Drug Tariff corpus, filtered by effective date", cls: "agent" },
  { name: "lookup_claim", purpose: "Fetch what the pharmacy claimed for the item", input: "{ caseId }", output: "{ quantity, amountClaimed, endorsementText, submittedVia }", mock: "Local synthetic ledger", production: "NHSBSA claim ledger / submission records, read-only", cls: "existing" },
  { name: "check_history", purpose: "Recent referrals for the same contractor", input: "{ contractorCode }", output: "{ referralsLast90Days, lastReasons[] }", mock: "Local synthetic history", production: "NHSBSA case-management history, read-only", cls: "existing" },
  { name: "run_endorsement_checks", purpose: "Deterministic requirement and mandatory-field checks", input: "{ clause, facts, extracted }", output: "{ requirementResults[], mandatory[] }", mock: "Same code as production", production: "Azure Functions (pure functions with unit tests)", cls: "deterministic" },
  { name: "validate_citation", purpose: "Confirm the cited span exists in the corpus for the version in force", input: "{ clauseId, version, quotedSpan }", output: "{ valid }", mock: "Same code as production", production: "Azure Functions", cls: "deterministic" },
  { name: "write_decision_record", purpose: "Append the case pack and, later, the human decision", input: "{ casePack | decision }", output: "{ recordId }", mock: "In-memory append-only array", production: "Azure Cosmos DB append-only container", cls: "deterministic" },
];

function call(
  tool: string,
  productionService: string,
  cls: ToolCall["cls"],
  input: ToolCall["input"],
  outputSummary: string,
  sourceLabel: string,
  durationMs: number,
  status: ToolCall["status"] = "ok",
): ToolCall {
  return { tool, productionService, cls, input, outputSummary, sourceLabel, durationMs, status };
}

export function toolReadImageRegion(c: ExceptionCase, regionId: string): { text: string; confidence: number; call: ToolCall } {
  const region = c.regions.find((r) => r.id === regionId);
  const text = region?.text ?? "";
  const confidence = region?.confidence ?? 0;
  const low = confidence < 0.6;
  return {
    text,
    confidence,
    call: call(
      "read_image_region",
      "Azure AI Document Intelligence (layout)",
      "existing",
      { imageRef: `${c.id}.tif`, regionId },
      region ? `"${text}" (read confidence ${confidence.toFixed(2)})` : "Region not located",
      "Existing capture output and image store",
      140,
      !region ? "fail" : low ? "warn" : "ok",
    ),
  };
}

export function toolLookupProduct(c: ExceptionCase): { product: Product | null; candidates: Product[]; call: ToolCall } {
  const product = productByCode(c.extracted.productCode);
  const candidates = product ? [product] : productCandidates(c.extracted.productText);
  return {
    product,
    candidates,
    call: call(
      "lookup_product_pack",
      "Product and pack master data (dm+d-aligned)",
      "deterministic",
      { productCode: c.extracted.productCode, productText: c.extracted.productText },
      product
        ? `${product.name}, pack ${product.packSize}, category ${product.category}, basic price £${product.basicPrice.toFixed(2)}`
        : `No exact match; ${candidates.length} candidate${candidates.length === 1 ? "" : "s"} from the captured text`,
      "Synthetic product table",
      90,
      product ? "ok" : "warn",
    ),
  };
}

export function toolRetrieveTariff(
  endorsementType: EndorsementType,
  dispensingDate: string,
  versionOverride?: string,
): { version: TariffVersion | null; clause: TariffClause | null; call: ToolCall } {
  const version = versionOverride ? versionById(versionOverride) : versionForDate(dispensingDate);
  const clause = version?.clauses.find((cl) => cl.endorsementType === endorsementType) ?? null;
  return {
    version,
    clause,
    call: call(
      "retrieve_tariff",
      "Azure AI Search (versioned corpus, effective-date filter)",
      "agent",
      { endorsementType, dispensingDate, version: version?.version ?? null },
      clause && version
        ? `${version.label}: ${clause.title}`
        : version
          ? `${version.label} located, but no clause matches endorsement type "${endorsementType}"`
          : "No Tariff version covers the dispensing date",
      "Synthetic versioned Drug Tariff corpus",
      210,
      clause ? "ok" : "fail",
    ),
  };
}

export function toolLookupClaim(c: ExceptionCase): { call: ToolCall } {
  return {
    call: call(
      "lookup_claim",
      "Claim ledger and submission records",
      "existing",
      { caseId: c.id },
      `Quantity ${c.claim.quantity}, £${c.claim.amountClaimed.toFixed(2)} claimed, endorsement "${c.claim.endorsementText || "none"}", via ${c.claim.submittedVia}`,
      "Synthetic claim ledger",
      75,
    ),
  };
}

export function toolCheckHistory(c: ExceptionCase): { history: HistoryRecord; call: ToolCall } {
  const history = historyFor(c.pharmacy.contractorCode);
  return {
    history,
    call: call(
      "check_history",
      "Case-management history",
      "existing",
      { contractorCode: c.pharmacy.contractorCode },
      `${history.referralsLast90Days} referral${history.referralsLast90Days === 1 ? "" : "s"} in 90 days${history.lastReasons.length ? `: ${history.lastReasons.join("; ")}` : ""}`,
      "Synthetic history",
      60,
    ),
  };
}

export const AGENT_VERSION = "prototype-0.5 (interpretation step mocked; production: constrained Azure OpenAI call)";
