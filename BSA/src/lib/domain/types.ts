// Shared domain types for the NHSBSA exception-handling prototype.
// Everything here describes SYNTHETIC demonstration data.

export type BoundaryClass = "existing" | "deterministic" | "agent" | "human";

export type ItemChannel = "eps" | "paper";
export type RoutingOutcome = "auto_priced" | "type1_capture" | "type2_endorsement" | "referred_back";
export type FieldProvenance = "machine_read" | "pharmacy_declaration" | "human_capture";

/** Synthetic message content, never an image read or a payment instruction. */
export interface EpsPrescription {
  readonly prescriber: { readonly name: string; readonly practice: string };
  readonly patientLabel: string;
  readonly prescriptionDate: string;
  readonly dispensingDate: string;
  readonly items: readonly {
    readonly prescribedCode: string;
    readonly product: string;
    readonly strength: string;
    readonly form: string;
    readonly quantity: number;
    readonly dose: string;
    readonly dispensedCode: string;
    readonly dispensedName: string;
  }[];
  readonly prescriberEndorsement: string;
  readonly dispenserEndorsement: string;
  readonly exemptionStatus: "exempt" | "chargeable" | "not_recorded";
  readonly claimMessageState: "draft" | "submitted";
  /** Pharmacy's actual supply record, independent of the selected claim code. */
  readonly supplyRecord?: {
    readonly productCode: string;
    readonly quantity: number;
  };
  readonly supplyEvidence?: {
    readonly ruleId: "SYN-EPS-SUPPLY";
    readonly brandManufacturer: string;
    readonly packSize: number | null;
    readonly form: string;
  };
}

/** Pharmacy-entered content. It cannot establish legibility or human reconciliation. */
export interface PaperDeclaration {
  readonly typedProduct: string;
  readonly quantity: number | null;
  readonly endorsementText: string;
  readonly dispensingDate: string;
  readonly declaredByPharmacy: true;
  readonly brandManufacturer?: string;
  readonly packSize?: number | null;
  readonly form?: string;
}

export interface DeclaredItemFields {
  readonly productCode: string | null;
  readonly quantity: number | null;
  readonly endorsementText: string;
  /** Required for a complete confirmed capture when the original prescriber is unreadable. */
  readonly prescriber?: string | null;
  readonly brandManufacturer?: string;
  readonly packSize?: number | null;
  readonly form?: string;
}

export interface PharmacyDeclaration {
  readonly fields: DeclaredItemFields;
  readonly declaredAt: string;
  readonly provenance: "pharmacy_declaration";
}

/** Projected only from the current revision's recorded human Type 1 confirmation. */
export interface CapturedEvidence {
  readonly fields: DeclaredItemFields;
  readonly provenance: "human_capture" | "pharmacy_declaration";
  readonly declarationReconciled: boolean;
  readonly revision: number;
}

/** Deterministic routing inputs, never perspective or a model's recommendation. */
export interface RoutingFacts {
  readonly channel: ItemChannel;
  readonly readable: boolean;
  readonly mandatoryFieldsComplete: boolean;
  readonly handwritten: boolean;
  readonly captureConfirmed: boolean;
  readonly endorsementRequired: boolean;
  readonly endorsementPresent: boolean;
  readonly endorsementComplete: boolean;
  readonly interpretationRequired: boolean;
  readonly hasConflict: boolean;
  readonly type2Decision: "not_decided" | "sufficient" | "insufficient" | "request_information";
}

export interface RoutingResult {
  readonly outcome: RoutingOutcome;
  readonly reason: string;
  readonly requiresHuman: boolean;
  readonly pricingAuthority: "existing_rules_engine" | null;
}

export type RouteSubmission = (facts: RoutingFacts) => RoutingResult;

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
  | "invoice_price"
  | "brand_manufacturer"
  | "pack_size"
  | "selected_pack_matches"
  | "presentation";

export interface Requirement {
  id: RequirementId;
  label: string;
}

export type EndorsementType = "NCSO" | "BB" | "XP" | "SP" | "SUPPLY" | "NONE" | "UNKNOWN";

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
  readonly pharmacySupplyRecord?: DeclaredItemFields;
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
  readonly capturedEvidence?: CapturedEvidence;
  readonly epsPrescription?: EpsPrescription;
  readonly paperDeclaration?: PaperDeclaration;
  readonly requiresHumanRecheck?: boolean;
  readonly humanPricingConfirmed?: boolean;
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
  provisionStatus?: "found" | "not_found" | "not_applicable";
  readingStatus?: "applicable" | "not_applicable";
  imageStatus?: "applicable" | "not_applicable";
  sampleAgreement: { agree: number; total: number };
  reconciliation: "agree" | "conflict" | "not_established" | "not_applicable";
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
  values: { origin: string; value: string }[];
  material: boolean;
  note: string;
}

export interface EvidenceItem {
  id: string;
  origin: string;
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
  ruleAuthority?: "retrieved_tariff" | "proposed_cross_record_check" | "unavailable";
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
  ruleAuthority?: "retrieved_tariff" | "proposed_cross_record_check" | "unavailable";
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
