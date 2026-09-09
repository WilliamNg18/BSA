// Shared domain types for the NHSBSA exception-handling prototype.
// Everything here describes SYNTHETIC demonstration data.

export type BoundaryClass = "existing" | "deterministic" | "agent" | "human";

export type CaseState =
  | "cleared_by_rules"
  | "agent_review_complete"
  | "operator_review_required"
  | "additional_evidence_required"
  | "agent_abstained"
  | "human_decision_recorded";

export type Recommendation =
  | "SUFFICIENT"
  | "REFER_BACK"
  | "REQUEST_INFORMATION"
  | "ABSTAIN"
  | "NONE";

export type HumanDecision =
  | "ACCEPT"
  | "AMEND"
  | "REQUEST_INFORMATION"
  | "REFER_BACK"
  | "ESCALATE";

export type RequirementId =
  | "endorsement_present"
  | "initialled"
  | "dated"
  | "quantity_stated"
  | "invoice_price";

export interface Requirement {
  id: RequirementId;
  label: string;
}

export type EndorsementType = "NCSO" | "BB" | "XP" | "SP" | "NONE" | "UNKNOWN";

export interface TariffClause {
  id: string;
  part: string;
  title: string;
  endorsementType: EndorsementType;
  text: string;
  requirements: Requirement[];
}

export interface Concession {
  productCode: string;
  price: number;
}

export interface TariffVersion {
  version: string;
  label: string;
  effectiveFrom: string;
  effectiveTo: string;
  changeNote: string;
  clauses: TariffClause[];
  concessions: Concession[];
}

export interface Product {
  code: string;
  name: string;
  packSize: number;
  category: "M" | "A" | "C";
  basicPrice: number;
}

/** Structured reading of the free-text endorsement, produced by the interpretation step. */
export interface EndorsementFacts {
  type: EndorsementType;
  present: boolean;
  initialled: boolean | null;
  dated: boolean | null;
  quotedText: string;
  note: string;
}

export interface ImageRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  confidence: number;
}

export interface ExtractedFields {
  productText: string;
  productCode: string | null;
  productConfidence: number;
  quantity: number | null;
  quantityConfidence: number;
  endorsementText: string;
  endorsementConfidence: number;
  prescriber: string;
  dispensingDate: string;
}

export interface ClaimRecord {
  productCode: string;
  quantity: number;
  amountClaimed: number;
  endorsementText: string;
  submittedVia: "EPS claim message" | "FP34C batch";
}

export interface HistoryRecord {
  contractorCode: string;
  referralsLast90Days: number;
  lastReasons: string[];
  quantityMismatchesLast90Days: number;
}

export interface ExceptionCase {
  id: string;
  scenario: "A" | "B" | "C" | "D" | "E" | "F";
  title: string;
  purpose: string;
  pharmacy: { name: string; contractorCode: string };
  routingReason: string;
  channel: "Paper FP10" | "Electronic (EPS)";
  receivedAt: string;
  minutesInQueue: number;
  imageQuality: number;
  imageStyle: "printed" | "handwritten" | "handwritten_poor";
  patientLabel: string;
  extracted: ExtractedFields;
  regions: ImageRegion[];
  claim: ClaimRecord;
  /** Three independent readings of the endorsement (the mocked interpretation step). */
  readings: EndorsementFacts[];
  inCoverage: boolean;
  initialState: CaseState;
}

export interface ToolCall {
  tool: string;
  productionService: string;
  cls: BoundaryClass;
  input: Record<string, string | number | null>;
  outputSummary: string;
  sourceLabel: string;
  durationMs: number;
  status: "ok" | "warn" | "fail";
}

export type Phase =
  | "PLAN"
  | "GATHER"
  | "RETRIEVE"
  | "RECONCILE"
  | "ASSESS"
  | "CHECK"
  | "RECOMMEND"
  | "ABSTAIN"
  | "HAND_OFF";

export interface TraceStep {
  phase: Phase;
  title: string;
  cls: BoundaryClass;
  summary: string;
  items: string[];
  toolCalls: ToolCall[];
  status: "ok" | "warn" | "fail" | "skipped";
}

export interface Signals {
  provisionFound: boolean;
  sampleAgreement: { agree: number; total: number };
  reconciliation: "agree" | "conflict" | "not_applicable";
  imageQuality: number;
  inCoverage: boolean;
}

export interface Composite {
  level: "high" | "medium" | "low" | "abstain";
  reasons: string[];
}

export interface GateCheck {
  name: string;
  pass: boolean;
  detail: string;
}

export interface Conflict {
  field: string;
  values: { source: string; value: string }[];
  material: boolean;
  note: string;
}

export interface EvidenceItem {
  id: string;
  source: string;
  field: string;
  value: string;
  provenance: string;
  cls: BoundaryClass;
}

export interface RequirementResult {
  requirement: Requirement;
  met: boolean | null;
}

export interface CasePack {
  caseId: string;
  tariffVersion: string;
  tariffLabel: string;
  clause: TariffClause | null;
  citationValid: boolean | null;
  product: Product | null;
  concession: Concession | null;
  endorsementRequired: boolean | null;
  facts: EndorsementFacts | null;
  requirementResults: RequirementResult[];
  conflicts: Conflict[];
  evidence: EvidenceItem[];
  signals: Signals;
  composite: Composite;
  recommendation: Recommendation;
  alternative: { outcome: Recommendation; note: string } | null;
  reasons: string[];
  gate: { result: "PASS" | "FAIL" | "NOT_RUN"; checks: GateCheck[] };
  draftToPharmacy: string | null;
  abstainReasons: string[];
  trace: TraceStep[];
  state: CaseState;
  agentVersion: string;
  agentInvoked: boolean;
  assemblySeconds: number;
}

export interface DecisionRecord {
  id: string;
  caseId: string;
  timestamp: string;
  tariffVersion: string;
  agentVersion: string;
  inputs: string[];
  sources: string[];
  checks: GateCheck[];
  recommendation: Recommendation;
  decision: HumanDecision;
  isOverride: boolean;
  overrideReason: string | null;
  operator: string;
  synthetic: boolean;
}
