/**
 * Two-document evidence register, not an independently verified bibliography.
 * Quotes preserve source wording (including errors); only TOUR_CONTENT is UI copy.
 * Paragraph numbers refer to the first extracted word/document.xml occurrence.
 * No source files, patient data, operational rules or executable payment logic live here.
 */
export const SOURCE_CLASSES = {
  'public-fact': 'Document-attributed public fact (not externally verified)',
  derived: 'Derived calculation',
  'reasoned-assumption': 'Reasoned assumption',
  'requires-customer-validation': 'Requires customer validation',
  hypothesis: 'Hypothesis to test',
  'design-decision': 'Proposed design decision',
  synthetic: 'Synthetic demonstration',
} as const

export type SourceClass = keyof typeof SOURCE_CLASSES
export type SourceDocumentId = 'pdf' | 'pack'
export const SOURCE_DOCUMENTS = [
  { id: 'pdf', filename: 'William Ng Single Page - Embrace the Change.pdf',
    sha256: 'f7db39a5a65f296379a1e7b66daab4825fa8820c4b4d813d34d62ebd7440e699',
    format: 'pdf', pages: 1, locatorConvention: 'Page 1 and printed section heading',
    verification: 'Supplied hash; text extraction reviewed, no external verification' },
  { id: 'pack', filename: 'nhsbsa-FINAL-complete-pack-v5.docx',
    sha256: 'c0c405e7420eb9da6c80b01f1167d24d750a98c3a74bb117a2e5fd81f4d6af43',
    format: 'docx', version: 5, paragraphCount: 3750,
    locatorConvention: 'First word/document.xml extraction, P0001-P3750; blank paragraphs omitted; footer separately numbered',
    verification: 'Supplied hash; text extraction reviewed, no external verification' },
] as const

/** Names attributed inside the supplied documents, not additional references fetched. */
export const SOURCE_NAMES = {
  'nhsbsa-process': { label: 'NHSBSA, How we process prescriptions', classification: 'named-public-source', attribution: 'P0687-P0691' },
  'nhsbsa-timetable': { label: 'NHSBSA, Pharmacy payment timetable', classification: 'named-public-source', attribution: 'P0692-P0693' },
  'cpe-referrals': { label: 'Community Pharmacy England, Referred back and disallowed items', classification: 'named-public-source', attribution: 'P0694-P0695' },
  'cpe-funding': { label: 'Community Pharmacy England, unspecified funding material', classification: 'incomplete-attribution', attribution: 'P0696-P0697' },
  'gov-cpcf': { label: 'gov.uk CPCF 2026/27', classification: 'named-public-source', attribution: 'P0697' },
  'cpe-survey': { label: 'Community Pharmacy England Pressures Survey, July 2026', classification: 'named-public-source', attribution: 'P0698-P0699' },
  'tariff-ncso': { label: 'NHSBSA Drug Tariff Part II Clause 9', classification: 'named-public-source', attribution: 'P0700-P0701' },
  'tariff-submission': { label: 'Drug Tariff Part I Clause 5A', classification: 'named-public-source', attribution: 'P0166' },
  'fp10-specimen': { label: 'NHS England FP10 specimen FP10NC0105', classification: 'named-public-source', attribution: 'P2923-P2924' },
  dmd: { label: 'dm+d / NHS dictionary of medicines and devices', classification: 'named-standard', attribution: 'P0795-P0799; P0960-P0963' },
  'document-author': { label: 'Supplied document narrative or proposal', classification: 'document-only', attribution: 'Not an independent public authority' },
  'pack-uncited': { label: 'Pack assertion without a specific named publication', classification: 'incomplete-attribution', attribution: 'No independently inspectable citation supplied' },
} as const
export type NamedSourceId = keyof typeof SOURCE_NAMES

export type SourceLocator =
  | { readonly documentId: 'pdf'; readonly page: 1; readonly section: string }
  | { readonly documentId: 'pack'; readonly part: 'word/document.xml' | 'word/footer1.xml'; readonly paragraphStart: number; readonly paragraphEnd: number }
export interface SourceExcerpt { readonly text: string; readonly locator: SourceLocator }
export interface ClaimNumber {
  readonly value: number
  readonly unit: string
  readonly approximate: boolean
  readonly period: string
  readonly population: string
  readonly meaning: 'reported' | 'target' | 'derived' | 'assumed' | 'synthetic' | 'proposed'
}
type ClaimBase = {
  readonly id: string
  readonly statement: string
  readonly excerpts: readonly SourceExcerpt[]
  readonly namedSourceIds: readonly NamedSourceId[]
  readonly numbers: readonly ClaimNumber[]
  readonly caveats: readonly string[]
  readonly scope: 'tour' | 'reference-only' | 'out-of-scope' | 'excluded-personal'
  readonly eligibleForDisplay: boolean
  readonly status: 'qualified' | 'contradictory' | 'withheld'
  readonly relatedClaimIds: readonly string[]
}
/** Each class has a distinct, inspectable evidence obligation. */
type ClassEvidence = {
  'public-fact': { readonly externallyVerified: false; readonly attributionOnly: true }
  derived: { readonly formula: string; readonly inputClaimIds: readonly string[] }
  'reasoned-assumption': { readonly validation: string }
  'requires-customer-validation': { readonly validation: string }
  hypothesis: { readonly test: string }
  'design-decision': { readonly implementedBySourceEvidence: false }
  synthetic: { readonly operationalMeasurement: false }
}
export type SourceClaim = { [K in SourceClass]: ClaimBase & { readonly classification: K } & ClassEvidence[K] }[SourceClass]

const p = (start: number, end = start): SourceLocator => ({ documentId: 'pack', part: 'word/document.xml', paragraphStart: start, paragraphEnd: end })
const pdf = (section: string): SourceLocator => ({ documentId: 'pdf', page: 1, section })
const e = (text: string, locator: SourceLocator): SourceExcerpt => ({ text, locator })
const n = (value: number, unit: string, population: string, period = 'Not specified in source', approximate = false, meaning: ClaimNumber['meaning'] = 'reported'): ClaimNumber => ({ value, unit, approximate, period, population, meaning })
type Options = Partial<Pick<ClaimBase, 'namedSourceIds' | 'numbers' | 'caveats' | 'scope' | 'status' | 'relatedClaimIds'>> & {
  validation?: string; formula?: string; inputClaimIds?: readonly string[]; additionalExcerpts?: readonly SourceExcerpt[]
}
function claim(classification: SourceClass, id: string, statement: string, text: string, locator: SourceLocator, options: Options = {}): SourceClaim {
  const scope = options.scope ?? 'reference-only'
  const status = options.status ?? 'qualified'
  const base: ClaimBase = {
    id, statement, excerpts: [e(text, locator), ...(options.additionalExcerpts ?? [])],
    namedSourceIds: options.namedSourceIds ?? ['document-author'], numbers: options.numbers ?? [],
    caveats: options.caveats ?? ['Source description only; not evidence of current NHSBSA implementation or performance.'],
    scope, status, eligibleForDisplay: scope === 'tour' && status === 'qualified', relatedClaimIds: options.relatedClaimIds ?? [],
  }
  const validation = options.validation ?? 'Confirm with the relevant NHSBSA data, process, rule or governance owner before relying on this assertion.'
  switch (classification) {
    case 'public-fact': return { ...base, classification, externallyVerified: false, attributionOnly: true }
    case 'derived': return { ...base, classification, formula: options.formula ?? '', inputClaimIds: options.inputClaimIds ?? [] }
    case 'reasoned-assumption': return { ...base, classification, validation }
    case 'requires-customer-validation': return { ...base, classification, validation }
    case 'hypothesis': return { ...base, classification, test: validation }
    case 'design-decision': return { ...base, classification, implementedBySourceEvidence: false }
    case 'synthetic': return { ...base, classification, operationalMeasurement: false }
  }
}
type MakeClaim = (id: string, statement: string, text: string, locator: SourceLocator, options?: Options) => SourceClaim
const ofClass = (classification: SourceClass): MakeClaim => (id, statement, text, locator, options) => claim(classification, id, statement, text, locator, options)
const fact = ofClass('public-fact')
const derived = ofClass('derived')
const assumption = ofClass('reasoned-assumption')
const validate = ofClass('requires-customer-validation')
const hypothesis = ofClass('hypothesis')
const design = ofClass('design-decision')
const synthetic = ofClass('synthetic')
const attributed = (source: NamedSourceId, options: Options = {}): Options => ({ namedSourceIds: [source], caveats: ['Attributed by the supplied documents; the named publication was not independently checked.'], ...options })

const organisationClaims: SourceClaim[] = [
  fact('O01', 'The pack describes NHSBSA as an arm’s-length body of DHSC administering NHS services and payments.', 'The NHS Business Services Authority is an arm’s-length body of the Department of Health and Social Care.', p(85), attributed('nhsbsa-process', { scope: 'tour' })),
  fact('O02', 'Approximately 1.1 billion primary-care prescription items are processed annually in England, according to the pack’s NHSBSA attribution.', '~1.1bn prescription items processed a year, primary care England', p(686, 687), attributed('nhsbsa-process', { scope: 'tour', numbers: [n(1_100_000_000, 'items/year', 'Primary-care prescription items in England', 'Annual; year unspecified', true)] })),
  fact('O03', 'Processed prescription data supports contractor payment and prescribing information.', 'uses the processed data both to pay dispensing contractors and to provide prescribing information to the Department and the NHS.', p(85), attributed('nhsbsa-process')),
  fact('O04', 'NHSBSA pays community pharmacies for prescriptions they dispense; the pack’s universal wording is broader.', 'including paying community pharmacies for the prescriptions they dispense.', p(85), attributed('nhsbsa-process', { caveats: ['Do not extend the detailed service description into an independently verified claim about every pharmacy.'] })),
  fact('O05', 'The pack describes public funding and pharmacy remuneration recharged to NHS England.', 'Remuneration paid to pharmacies is recharged to NHS England', p(86), attributed('pack-uncited', { caveats: ['Accounting interpretation requires confirmation; no separate funding statement inspected.'] })),
  assumption('O06', 'The documents frame volume as a cost rather than prescription-linked revenue for NHSBSA.', 'NHSBSA earns nothing per prescription, and more volume is more cost, not more revenue.', p(86), { validation: 'Confirm funding flows and marginal costs; not a measured cost model.' }),
  assumption('O07', 'Accuracy, efficiency, payment assurance, continuity and public value frame the proposed investment.', 'accurate administration, operational efficiency, payment assurance, service continuity and public value.', p(86)),
  fact('O08', 'The pack describes Community Pharmacy England as the sector negotiating body publishing referral guidance.', 'The sector’s negotiating body; publishes guidance including on referred-back items', p(97, 99), attributed('cpe-referrals')),
  fact('O09', 'The pack describes NHS England as commissioner and DHSC as sponsor and funding-settlement owner.', 'Commissions pharmaceutical services; fees and allowances are recharged to it', p(100, 105), attributed('pack-uncited', { additionalExcerpts: [e('Sponsor department; sets the funding settlement with the sector', p(104))] })),
  validate('O10', 'The pack gives approximately 10,000-plus pharmacy contractors without a specific date or citation.', 'Community pharmacies (~10,000+ contractors)', p(94), { numbers: [n(10_000, 'contractors (lower bound)', 'Community pharmacies', 'Unspecified', true)], namedSourceIds: ['pack-uncited'] }),
  fact('O11', 'The Drug Tariff is described as a monthly-republished reimbursement and remuneration rulebook.', 'The monthly-republished rulebook governing reimbursement and remuneration', p(106, 108), attributed('tariff-ncso', { scope: 'tour', numbers: [n(1, 'publication/month', 'Drug Tariff', 'Monthly')], caveats: ['Publication cadence does not establish monthly changes to endorsement requirements or monthly recoding.'] })),
  fact('O12', 'The funding description distinguishes fees and allowances from retained buying margin.', 'Fees and allowances plus £900m retained buying margin', p(696, 697), attributed('cpe-funding')),
  fact('O13', 'The pack names a global sum covering Single Activity Fees, Item Fees and Establishment Payments.', 'the ‘global sum’ covering Single Activity Fees, Item Fees and Establishment Payments.', p(110), attributed('cpe-funding', { caveats: ['Terminology and current applicability require validation.'] })),
  fact('O14', 'The pack attributes £900 million annual retained buying margin, calibrated through Category M.', 'with national arrangements allowing £900m annually, calibrated through Category M of the Tariff.', p(110), attributed('cpe-funding', { numbers: [n(900_000_000, 'GBP/year', 'National retained buying margin', 'Annual; settlement unspecified')] })),
  fact('O15', 'The pack gives core funding of £2.698 billion for 2024/25 and £3.073 billion for 2025/26.', 'Core sector funding was £2.698bn for 2024/25 and £3.073bn for 2025/26.', p(110), { ...attributed('cpe-funding'), namedSourceIds: ['cpe-funding', 'gov-cpcf'], numbers: [n(2_698_000_000, 'GBP', 'Core sector funding', '2024/25'), n(3_073_000_000, 'GBP', 'Core sector funding', '2025/26')] }),
  validate('O16', 'The claimed Single Activity Fee increase from 152p to £1.52 is erroneous and withheld.', 'The Single Activity Fee is paid per item dispensed, 152p, rising to £1.52 under the 2026/27 framework.', p(110), { status: 'withheld', namedSourceIds: ['cpe-funding', 'gov-cpcf'], numbers: [n(152, 'pence/item', 'Single Activity Fee', 'Prior period unspecified'), n(1.52, 'GBP/item', 'Single Activity Fee', '2026/27')], relatedClaimIds: ['N06'], caveats: ['152p equals £1.52. Neither intended prior nor revised fee can be recovered from these documents.'] }),
  assumption('O17', 'Referral is described as delaying both reimbursement and the per-item fee.', 'a referred-back item delays both the reimbursement for the medicine and the per-item fee.', p(111)),
  fact('O18', 'Published capture is described as high-speed scanning and intelligent character recognition of fields.', 'High-speed scanners and intelligent character recognition read quantity, strength, presentation and exemption information', p(169), attributed('nhsbsa-process', { scope: 'tour' })),
  fact('O19', 'Existing software prices straightforward Tariff items requiring no endorsement.', 'Calculation software prices items where Drug Tariff rules are straightforward and no endorsement is needed', p(172), attributed('nhsbsa-process', { scope: 'tour' })),
  fact('O20', 'Operator routing includes endorsement-required, handwritten, referred-back and low-confidence reads.', 'Items go to a HUMAN OPERATOR where they need endorsement, are handwritten, are referred-back items, or cannot be read confidently', p(175), attributed('nhsbsa-process', { scope: 'tour', caveats: ['The total operator queue is not quantified by the referred-back subset. Reading failures are not excluded.'] })),
  fact('O21', 'The pack attributes return before payment when further information is required.', 'If we need further information, we’ll send the prescription back to you before we pay for that item', p(178), attributed('nhsbsa-process', { scope: 'tour' })),
  fact('O22', 'Referred back means delayed payment pending information; disallowed means no payment.', 'referred back = delayed payment; disallowed = no payment', p(694, 695), attributed('cpe-referrals', { scope: 'tour' })),
  fact('O23', 'Around one million items were referred back in 2024/25; the documents also quote approximately 85,000 per month for that subset.', '~1m items referred back in 2024/25 for missing or insufficient endorsement; ~85,000 a month', p(694, 695), attributed('cpe-referrals', { scope: 'tour', numbers: [n(1_000_000, 'referred-back items/year', 'Referred-back subset, not all exceptions', '2024/25', true), n(85_000, 'referred-back items/month', 'Referred-back subset, not all exceptions', '2024/25 monthly approximation', true)], relatedClaimIds: ['O24', 'N01', 'N02', 'N03'], caveats: ['Approximate source wording. One million divided by twelve is 83,333.33, not exactly 85,000. Total operator decisions are unknown.'] })),
  fact('O24', 'Referred-back items are a subset of the larger operator queue; its total volume is unknown here.', 'the total volume entering the operator queue, which is larger than the million that go back.', p(151), attributed('cpe-referrals', { scope: 'tour', caveats: ['Process distinction in the pack, not a measured exception-queue total.'] })),
  fact('O25', 'The described submission process distinguishes physical batches from electronic claims.', 'Monthly batch to NHSBSA; separate timetables for receipt by or after the 5th', p(166), attributed('nhsbsa-timetable', { additionalExcerpts: [e('typed in an electronic claim or handwritten on the form', pdf('THE PROBLEM I CHOSE, AND WHY IT APPEARS WORTH SOLVING'))], caveats: ['Do not equate items with forms or assume every electronic item is scanned.'] })),
  fact('O26', 'Submission timetables distinguish receipt by or after the fifth and deductions under Part I Clause 5A.', 'submission timetables by/after the 5th; administrative deductions under Part I Clause 5A', p(692, 693), { ...attributed('nhsbsa-timetable'), namedSourceIds: ['nhsbsa-timetable', 'tariff-submission'], numbers: [n(5, 'day of month', 'Submission receipt deadline', 'Monthly')] }),
  fact('O27', 'The pack attributes approximately twenty-day-earlier advance payments from November 2021.', 'Advance payment timetable ~20 days earlier from Nov 2021', p(692, 693), attributed('nhsbsa-timetable', { numbers: [n(20, 'days earlier', 'Advance payment timetable', 'From November 2021', true)] })),
  fact('O28', 'Real Time Exemption Checking is described at the point of dispensing.', 'Real Time Exemption Checking at the point of dispensing', p(925), attributed('nhsbsa-process')),
  validate('O29', 'The PDF asserts that every pharmacy submits month-end claims through Manage Your Service; item-level applicability is unvalidated.', 'Every pharmacy already submits month-end claims through NHSBSA’s Manage Your Service portal.', pdf('WHAT IS ALREADY AUTOMATED, AND WHAT REMAINS DIFFICULT'), { caveats: ['Confirm universality, submission channel and relationship to EPS endorsements; not proof of an integration API.'] }),
  fact('O30', 'Endorsements are described as typed electronic-claim notes or handwritten form notes.', 'typed in an electronic claim or handwritten on the form', pdf('THE PROBLEM I CHOSE, AND WHY IT APPEARS WORTH SOLVING'), attributed('cpe-referrals', { scope: 'tour', caveats: ['No typed-versus-handwritten proportion is established.'] })),
  fact('O31', 'Missing, insufficient or ambiguous endorsement information can prevent pricing.', 'the information needed to price the item correctly is missing, insufficient or ambiguous.', p(120), attributed('cpe-referrals', { scope: 'tour' })),
  assumption('O32', 'The pack’s claim that the issue is most often handwriting is not established by referral totals.', 'Most often that information is the pharmacy’s handwritten endorsement', p(120), { validation: 'Measure causes and input channels from item-level history.' }),
  fact('O33', 'NCSO means no cheaper stock obtainable; the pack attributes an initials-and-date requirement to Part II Clause 9.', 'NCSO endorsement must be initialled and dated', p(700, 701), attributed('tariff-ncso', { additionalExcerpts: [e('‘no cheaper stock obtainable’ (NCSO)', p(163))], caveats: ['Not authentic rule text for the app. Product, governing date and specific provision require validation; Clause 9 is not universal.'] })),
  fact('O34', 'Other named endorsement classes are specials, broken bulk, out-of-pocket expenses and assorted-flavour nutritional products.', 'specials; broken bulk; out-of-pocket expenses; assorted-flavour nutritional products', p(163), attributed('pack-uncited', { caveats: ['No exact governing provision for each class is supplied. Do not substitute Clause 9 for them.'] })),
  fact('O35', 'The pack attributes monthly reprocessing of 50,000 items for sampling.', '50,000 items resampled monthly', p(690, 691), attributed('nhsbsa-process', { numbers: [n(50_000, 'items/month', 'Accuracy sample', 'Monthly')], scope: 'tour' })),
  fact('O36', 'PPIA is Prescription Processing Information Accuracy, with a stated target of 99.85%.', 'Prescription Processing Information Accuracy, as it affects prescribing information', p(207, 209), attributed('nhsbsa-process', { scope: 'tour', additionalExcerpts: [e('99.85%', p(209))], numbers: [n(99.85, 'percent', 'PPIA target', 'Published target; period unspecified', false, 'target')], caveats: ['Target, not demonstrated achieved performance. Distinct from payment accuracy and cash variance.'] })),
  fact('O37', 'PPPA is Prescription Processing Payment Accuracy, with a stated target of 99.85%.', 'Prescription Processing Payment Accuracy, as it affects payments to contractors', p(210, 212), attributed('nhsbsa-process', { scope: 'tour', additionalExcerpts: [e('99.85%', p(212))], numbers: [n(99.85, 'percent', 'PPPA target', 'Published target; period unspecified', false, 'target')], caveats: ['Target, not demonstrated achieved performance.'] })),
  fact('O38', 'NCV nets underpayments and overpayments; the pack gives a target within plus or minus 0.2%.', 'Net Cash Variance, under and overpayments netted off', p(213, 215), attributed('nhsbsa-process', { additionalExcerpts: [e('Within +/-0.2%', p(215))], numbers: [n(-0.2, 'percent lower bound', 'NCV target', 'Unspecified', false, 'target'), n(0.2, 'percent upper bound', 'NCV target', 'Unspecified', false, 'target')] })),
  fact('O39', 'ACV aggregates rather than nets variances; the pack presents 99.85% as its target.', 'Absolute Cash Variance, under and overpayments aggregated, not netted', p(216, 218), attributed('nhsbsa-process', { additionalExcerpts: [e('99.85%', p(218))], numbers: [n(99.85, 'percent', 'ACV as represented in pack', 'Unspecified', false, 'target')], caveats: ['Verify the measure and target presentation. It is not generic item accuracy.'] })),
  fact('O40', 'The pack attributes six pharmacy-pressure percentages to CPE’s July 2026 survey.', '75% losing money; 14% profitable; 99% say reimbursement does not cover costs; 11% missed wholesaler payments; 42% reduced hours; 86% spending longer sourcing', p(698, 699), attributed('cpe-survey', { scope: 'out-of-scope', numbers: [[75, 'losing money'], [14, 'profitable'], [99, 'reimbursement does not cover costs'], [11, 'missed wholesaler payments'], [42, 'reduced hours'], [86, 'spending longer sourcing']].map(([value, population]) => n(Number(value), 'percent', `Survey respondents: ${population}`, 'July 2026')), caveats: ['Respondent denominators, question wording and sampling population are absent. Not evidence of referral causality.'] })),
]

const numericalClaims: SourceClaim[] = [
  derived('N01', 'Dividing the approximate annual referral figure by twelve gives approximately 83,333.33 per month, not exactly 85,000.', '~1m items referred back in 2024/25', p(694), { formula: '1000000 / 12', inputClaimIds: ['O23'], numbers: [n(1_000_000 / 12, 'referred-back items/month', 'Referred-back subset', '2024/25 arithmetic average', true, 'derived')], caveats: ['Exact operation on an approximate input; not measured monthly counts.'], scope: 'tour' }),
  derived('N02', 'Annualising 85,000 gives 1,020,000, two percent above one million; approximate wording may explain the difference.', '~85,000 a month', p(694), { formula: '85000 * 12 = 1020000; (1020000 / 1000000 - 1) * 100 = 2', inputClaimIds: ['O23'], numbers: [n(1_020_000, 'items/year', 'Annualised referral headline', 'Illustrative annualisation', true, 'derived'), n(2, 'percent', 'Difference from approximate one million', 'Illustrative annualisation', true, 'derived')] }),
  derived('N03', 'Approximate referred-back volume is 0.0909% of approximate annual item volume, not the total exception rate.', '~1m referred back against ~1.1bn processed is under 0.1% of item volume.', p(703), { formula: '1000000 / 1100000000 * 100', inputClaimIds: ['O23', 'O02'], numbers: [n(1_000_000 / 1_100_000_000 * 100, 'percent', 'Referred-back items / all primary-care items', 'Annual figures; compatible periods not independently established', true, 'derived')], scope: 'tour', caveats: ['Approximate inputs; subset share only.'] }),
  derived('N04', 'Annual item volume divided by twelve is approximately 91.67 million monthly items; the pack rounds to 92 million.', '1.1bn items a year is roughly 92m items a month.', p(705), { formula: '1100000000 / 12', inputClaimIds: ['O02'], numbers: [n(1_100_000_000 / 12, 'items/month', 'Prescription items, not forms', 'Annual average', true, 'derived'), n(92_000_000, 'items/month', 'Pack rounded presentation', 'Annual average', true, 'derived')] }),
  derived('N05', 'The arithmetic complement of 99.85% applied to 1.1 billion is 1.65 million; it is not observed errors or an error budget.', 'A 99.85% target implies a tolerance of roughly 1.65m items a year outside standard.', p(704), { formula: '(1 - 0.9985) * 1100000000', inputClaimIds: ['O02', 'O36'], status: 'withheld', numbers: [n(1_650_000, 'hypothetical items/year', 'Arithmetic illustration, not measured errors', 'Hypothetical annual', true, 'derived')], caveats: ['Reject the source’s tolerance interpretation. Cash-variance targets cannot be converted into item counts this way.'] }),
  derived('N06', '152 pence equals £1.52; the stated increase is zero.', 'SAF 152p rising to £1.52', p(696), { formula: '152 / 100 = 1.52; 1.52 - 1.52 = 0', inputClaimIds: ['O16'], numbers: [n(1.52, 'GBP', 'Conversion of 152 pence', 'Not a fee recommendation', false, 'derived'), n(0, 'GBP increase', 'Difference between identical amounts', 'Not a fee recommendation', false, 'derived')], relatedClaimIds: ['O16'] }),
  derived('N07', 'Repeated handling involves operator work, pharmacy correction and recapture, sometimes another operator touch; no universal measured count exists.', 'Touches: derived from process logic, at least operator, pharmacy, resubmission', p(201, 202), { formula: 'operator work + pharmacy work + resubmission processing (+ possible operator revisit)', inputClaimIds: ['O21', 'O25'], additionalExcerpts: [e('capture, and often operator again. Not a measured figure. Ask for theirs.', p(202))] }),
  assumption('N08', 'The pack assumes more than one item per form on average; the ratio is unknown.', 'A form carries more than one item on average, so form volume is materially lower. Ask for the ratio.', p(705)),
  validate('N09', 'The assertion that exceptions or model runs are well under one percent is unsupported by referral-subset totals.', 'for the exceptions only, well under one percent of items.', p(3353), { status: 'withheld', numbers: [n(1, 'percent upper bound', 'Claimed total exception share, unsupported', 'Unspecified', true, 'assumed')], relatedClaimIds: ['O24', 'N03'] }),
  assumption('N10', 'The 95% electronic and 5% paper split is an assumption, not verified NHSBSA data.', 'roughly 95% of primary-care items that are electronic', p(3477), { numbers: [n(95, 'percent', 'Assumed electronic primary-care items', 'Unspecified', true, 'assumed'), n(5, 'percent', 'Assumed paper complement', 'Unspecified', true, 'assumed')], caveats: ['P2758 explicitly marks the split assumed; later repetitions omit that qualifier.'] }),
  assumption('N11', 'Mid-to-high-nineties print field accuracy and lower handwriting accuracy are comparable-estate assumptions, not NHSBSA measurements.', 'Field-level accuracy in the mid-to-high 90s on print, lower on handwriting, varying by field', p(948, 951), { validation: 'Measure field-level and input-slice performance on their images.' }),
  assumption('N12', 'Six-week delays and repeated payment cycles are illustrative, not a measured delay distribution.', 'eventually priced correctly after six weeks and two handlings', p(3464), { numbers: [n(6, 'weeks', 'Illustrative referred-back delay', 'Illustration', false, 'assumed'), n(2, 'handlings', 'Illustrative repeated work', 'Illustration', false, 'assumed')], caveats: ['Do not promise a universal delay or savings.'] }),
  validate('N13', 'The share of human effort attributable to referrals is unknown; whole-queue claims are withheld.', 'the human effort all sits in this queue.', p(2334), { status: 'contradictory', relatedClaimIds: ['O24'], caveats: ['Referral totals cannot quantify the whole operator workload.'] }),
]

const assumptionClaims: SourceClaim[] = [
  assumption('A01', 'Referrals may be principally endorsement judgement rather than illegibility.', 'Referrals are a judgement problem, not a reading problem.', p(708, 718), { validation: 'Inspect item-level referral reasons in week one. If illegibility dominates, improve capture instead.' }),
  assumption('A02', 'A few endorsement types may account for most referrals.', 'A few endorsement types cause most of the 85,000 monthly referrals.', p(719, 729), { validation: 'Analyse two years of item-level codes and the top-five share; stop if no repeatable pattern.', numbers: [n(2, 'years', 'Requested referral history', 'Discovery', false, 'proposed'), n(5, 'reasons', 'Top reasons for concentration analysis', 'Discovery', false, 'proposed')] }),
  assumption('A03', 'The pack assumes more time assembling than deciding; the PDF only requires material assembly time.', 'Operators spend more time assembling evidence than deciding.', p(730, 740), { validation: 'Time operators for a day; separate locating evidence from judging. Consider a pre-fetched screen if simpler.', numbers: [n(1, 'day', 'Operator observation', 'Discovery', false, 'proposed')], relatedClaimIds: ['PDF-A02'], scope: 'tour' }),
  assumption('A04', 'Image, product, ledger and history may be separate sources manually reconciled.', 'In comparable estates those sit in separate systems and are pulled together by hand.', p(734), { validation: 'Confirm actual sources, access and existing operator screens.', scope: 'tour', relatedClaimIds: ['PDF-A03'] }),
  assumption('A05', 'Operator disagreement and inadequately recorded reasons are unverified assumptions.', 'Two operators can disagree on the same item, and nobody records why.', p(741, 751), { validation: 'Fifty items, two blind operators; inspect actual reason records.', numbers: [n(50, 'items', 'Blind agreement study', 'Discovery', false, 'proposed'), n(2, 'operators', 'Blind agreement study', 'Discovery', false, 'proposed')], scope: 'tour' }),
  assumption('A06', 'Some interpretation may remain beyond economical deterministic rules.', 'Some interpretation remains beyond deterministic rules.', pdf('THE ASSUMPTIONS THAT DECIDE WHETHER AN AGENT IS NEEDED'), { validation: 'Review fifty exceptions with operators and compare code, retrieval and templates before adding a model.', scope: 'tour', relatedClaimIds: ['PDF-A04'] }),
  assumption('A07', 'Endorsement-affecting changes may justify document-grounded interpretation; publication alone does not prove it.', 'Count the changes over twelve months that affect endorsement requirements', p(758), { validation: 'Count relevant changes over twelve months and inspect operator change adoption; encode the stable core when changes are rare.', numbers: [n(12, 'months', 'Tariff-change review', 'Discovery', false, 'proposed')], scope: 'tour' }),
  assumption('A08', 'Historical item decisions may be suitable evaluation material.', 'Historic exception reasons are retained at item level for at least two years', p(964, 967), { validation: 'Inspect availability, retention, labels and adjudication quality; new labelling may be needed.', relatedClaimIds: ['PDF-A05', 'EST07'] }),
  assumption('A09', 'The operator slice may be built and justified without pharmacy adoption.', 'It can be built and proven inside NHSBSA alone.', p(763, 773), { validation: 'Check history and queue integration in the first two weeks; test independent economics.', numbers: [n(2, 'weeks', 'Feasibility discovery', 'Proposed phase 1', false, 'proposed')] }),
  assumption('A10', 'The source’s manual image, product, ledger, rule, judgement and outcome sequence is a proposed current-state account.', 'An operator must locate the image, look up the product, check the claim against the ledger and find that month’s rule before judging anything.', p(439), { scope: 'tour', validation: 'Observe the real workflow; do not present a synthetic manual baseline as measured practice.' }),
  assumption('A11', 'The claim that pharmacies receive only a code rather than actionable guidance needs validation.', 'REFER BACK (a code, not an explanation)', p(195), { validation: 'Inspect current contractor messages and existing explanation support.' }),
  assumption('A12', 'Absence of evidence-assembly automation, measurement or rationale recording is not established.', 'Everything on either side of it is automated and measured. That step isn’t.', p(3506), { validation: 'Inventory current operator tooling, automation, analytics and audit records.' }),
  assumption('A13', 'Existing pharmacy pre-submission sufficiency checks are unknown.', 'The same kernel offered before submission', p(434), { validation: 'Inspect PMR, EPS, MYS and manual checks; neither document establishes that nobody checks.', caveats: ['A proposed extension is not evidence of an absent current capability.'], scope: 'tour' }),
  assumption('A14', 'The pack assumes operators use images rather than physical forms.', 'Pricing, exceptions and assurance work from the IMAGE, not the paper', p(3314, 3315), { validation: 'Observe operator and assurance handling of physical originals.' }),
  assumption('A15', 'Month-end peaks, short-run fixed capacity and training lag may constrain throughput.', 'Operator capacity is fixed in the short run; month-end peaks compound', p(461), { validation: 'Compare month-end and mid-month ageing, workload, staffing, attrition and time to competence.' }),
  assumption('CTX01', 'Revenue-versus-capital funding and operating-expenditure classification are unvalidated accounting assertions.', 'Funding is revenue, not capital, and revenue budgets are defended hardest. An agentic service is opex.', p(113), { scope: 'out-of-scope' }),
  assumption('CTX02', 'The proposed procurement route depends on an applicable framework and timetable.', 'Phase one must fit an existing route or it does not start.', p(114), { scope: 'out-of-scope' }),
  assumption('CTX03', 'The pack treats prescription data as potentially special-category health information.', 'Prescriptions carry exemption status and, by implication, health information.', p(116), { validation: 'IG and legal owners must assess the actual fields, lawful route and DPIA.' }),
  assumption('CTX04', 'The pack assumes political and reputational exposure around pharmacy sustainability.', 'Anything touching pharmacy payment carries reputational exposure both ways.', p(117), { scope: 'out-of-scope' }),
]

type ResearchRow = readonly [id: string, statement: string, quote: string, start: number, end: number, validation: string]
const estateRows: readonly ResearchRow[] = [
  ['EST01', 'A major-cloud accredited landing zone, possibly Azure, is assumed.', 'NHSBSA runs a substantial Azure footprint with an existing accredited landing zone', 936, 939, 'Confirm cloud, accreditation and new-workload approval with the CDIO; accreditation is not automatically inherited.'],
  ['EST02', 'Accessible stored images, fields and per-field confidence are assumed.', 'Capture produces a stored image and structured fields with per-field confidence', 785, 789, 'Request output schemas, sample fields, image access and confidence semantics.'],
  ['EST03', 'A modern capture layer alongside legacy ICR is assumed.', 'A modern document-AI capture layer has been, or is being, introduced alongside legacy ICR', 944, 947, 'Identify the actual capture service and its output contract.'],
  ['EST04', 'Queue tooling with usable reason codes and extension points is assumed.', 'The exception queue is worked in a case-management or workflow tool with reason codes', 952, 955, 'Inspect events, access, existing UI and extension model; adjacent-screen adoption is a separate risk.'],
  ['EST05', 'Structured monthly Tariff ingestion is assumed feasible.', 'The Drug Tariff can be ingested in a structured, monthly form', 790, 794, 'Inspect publication pipeline, access rights and effective-date metadata.'],
  ['EST06', 'A read-accessible dm+d-aligned product, pack and price master is assumed.', 'Product, pack and price data exist in a dm+d-aligned master source', 795, 799, 'Confirm the actual pricing master and read access; do not infer API availability.'],
  ['EST07', 'At least two years of item-level exception history is assumed available.', 'Historic exception reasons are retained at item level for at least two years', 964, 967, 'Inspect retention, access, label quality and data coverage.'],
  ['EST08', 'Tenant-bound UK inference with private connectivity is a proposed boundary, not a verified estate capability.', 'Model inference must remain within the tenant boundary in UK regions', 968, 971, 'Agree the actual data boundary and verify service-specific residency and networking.'],
  ['EST09', 'Useful judgement without patient identity and acceptable redaction are assumptions.', 'Redaction of patient identity before inference is acceptable to information governance', 800, 804, 'DPIA and necessity review before model exposure; metadata-only or stop if unacceptable.'],
  ['EST10', 'Paper and handwriting are assumed to persist with unknown volumes.', 'Paper and handwritten items persist as a residual', 805, 809, 'Request channel and handwriting volumes.'],
  ['EST11', 'Both sides being imaged is an inference from reverse-side declarations.', 'Published (scanning); both sides assumed, the reverse carries exemption declarations', 3308, 3309, 'Confirm capture coverage; inference is not direct evidence.'],
  ['EST12', 'Secure post or courier transport is assumed.', 'Published (submission); secure transport assumed', 3305, 3306, 'Confirm transport arrangements with operations.'],
  ['EST13', 'Original retention, secure destruction and retrieval are assumed; periods and legal status are unknown.', 'ASSUMED, retention period, storage location and destruction rules are validation questions', 3317, 3321, 'Consult records management and legal owners; no scan-and-destroy assumption.'],
  ['EST14', 'A pharmacy integration point and adoption route remain Phase 2 assumptions.', 'A pharmacy-side integration point exists near submission (Phase 2 only)', 815, 819, 'Discuss APIs, workflows and adoption with vendors and contractors.'],
  ['EST15', 'Funding the pharmacy check through NHSBSA or dispensing software is unresolved.', 'Both are Phase 2 commercial questions and neither is assumed.', 3479, 3479, 'Agree a sustainable commercial route; not a per-scan charging recommendation.'],
  ['EST16', 'A handful of dispensing products covering most of the market is unsubstantiated.', 'the handful of dispensing-system products that between them cover most of the market.', 3487, 3487, 'Verify vendor market coverage rather than assume it.'],
  ['EST17', 'Straightforward integration is an assumption, not proven feasibility.', 'Integration is well understood.', 3445, 3445, 'Test read access, data contracts, reliability and workflow constraints.'],
  ['EST18', 'Cheap and reversible deployment is an investment assumption.', 'Plausibly, it is cheap, reversible, does not touch the automated path', 148, 148, 'Measure full implementation, support and rollback costs.'],
]
const estateClaims = estateRows.map(([id, statement, quote, start, end, validation]) => assumption(id, statement, quote, p(start, end), {
  validation, scope: 'out-of-scope', ...(id === 'EST06' ? { namedSourceIds: ['dmd'] as const } : {}),
  ...(id === 'EST07' ? { numbers: [n(2, 'years minimum', 'Assumed item-level history', 'Retention unknown', false, 'assumed')] } : {}),
}))

const hypothesisRows: readonly ResearchRow[] = [
  ['H01', 'Exception-queue growth is a hypothesis.', 'The exception queue is growing', 829, 831, 'Analyse two years of exception volume by reason, not referral totals alone.'],
  ['H02', 'Shortages increasing endorsement and exception rates is a causal hypothesis.', 'Shortages are raising the exception rate', 624, 624, 'Compare actual reason-level exceptions with relevant shortage indices.'],
  ['H03', 'Increasing operator workforce pressure is unverified.', 'Operator workforce pressure is rising', 838, 840, 'Measure headcount, attrition and time to competence.'],
  ['H04', 'Referred-item delays may materially worsen pharmacy cash flow.', 'Delayed payment on referred items adds material cash-flow pressure to pharmacies', 832, 834, 'Measure item-level days-to-payment and a pharmacy sample; do not infer closures or supply disruption.'],
  ['H05', 'Some classes may be confirmed sufficient without pharmacy contact.', 'Some exception classes could be confirmed sufficient without contacting the pharmacy', 835, 837, 'Ask rule owners whether recovered context is permissible for each class; no waiver.'],
  ['H06', 'Evidence assembly may reduce handling time and loaded cost.', 'Less operator time per item because the case arrives assembled', 485, 493, 'Compare with timed baseline and a deterministic prefetch-only alternative.'],
  ['H07', 'Better instructions may reduce repeat referrals and touches.', 'Items that go back carry the exact fix, so fewer return a second time', 488, 490, 'Measure second-referral rate and touches per case; no guaranteed elimination.'],
  ['H08', 'Released capacity may absorb peaks without proportional staffing.', 'The same team absorbs peaks and growth without proportional headcount', 494, 496, 'Measure demand, staffing and queue ageing before attributing capacity benefits.'],
  ['H09', 'Recommendations may become more consistent.', 'More consistent recommendations', 497, 499, 'Measure expert agreement and category-level consistency; shared logic does not ensure identical output.'],
  ['H10', 'Audit reconstruction may become faster and more complete.', 'Any decision reconstructed in minutes with its evidence, rule version and human reason', 500, 502, 'Measure reconstruction time and record completeness; minutes is not an observed result.'],
  ['H11', 'Structured records may improve queue visibility.', 'The queue is characterised by reason, confidence and age rather than by count', 503, 505, 'Compare existing analytics with proposed reason and abstention reporting.'],
  ['H12', 'Holding payment accuracy is a guardrail to evaluate, not a guarantee.', 'PPPA, ACV and NCV do not move; the model never prices and never disposes', 506, 508, 'Use existing sampling and agreed stop thresholds in assisted mode.'],
  ['H13', 'Pharmacy rework and affected-item payment delay may decrease.', 'Fewer cycles between dispensing and payment on the items that went back', 512, 521, 'Measure pharmacy time and affected-item delay separately from NHSBSA financial returns.'],
  ['H14', 'Anomaly and fraud investigation support is a future hypothesis.', 'Serial-number, contractor and prescriber patterns across records become visible', 3340, 3342, 'Validate investigation utility, fairness and rights; not Phase 1 fraud detection.'],
  ['H15', 'Adjacent deployments may reuse the pattern at lower cost.', 'Second deployment cost against the first', 509, 511, 'Measure subsequent deployments; no portability or savings guarantee.'],
  ['H16', 'Archive and retrieval savings are unvalidated.', 'Only if records policy permits earlier destruction on the basis of a complete digital record', 3346, 3348, 'Set archive savings to zero until records policy and actual costs support them.'],
  ['H17', 'Advisory pharmacy pre-checks may prevent particular defects.', 'Optional, advisory, never blocking.', 434, 435, 'Measure integration, adoption, false flags and avoidable defects; existing checks are unknown.'],
  ['H18', 'Prescriber-specific handwriting improvement is a later research hypothesis.', 'a small model fine-tuned on their own prescriber population is a legitimate phase-three hypothesis', 3189, 3189, 'Evaluate handwriting per prescriber/input slice; not a current capability or production commitment.'],
]
const hypothesisClaims = hypothesisRows.map(([id, statement, quote, start, end, validation]) => hypothesis(id, statement, quote, p(start, end), {
  validation, scope: ['H01', 'H06', 'H07', 'H08', 'H09', 'H10', 'H12', 'H13', 'H17'].includes(id) ? 'tour' : 'out-of-scope',
}))

const pdfAssumptionSection = 'THE ASSUMPTIONS THAT DECIDE WHETHER AN AGENT IS NEEDED'
const pdfQuestionSection = 'WHAT I WOULD ASK IN THE FIRST FIFTEEN MINUTES, AFTER SHOWING THE BUILD'
/** PDF wording is retained separately: material is not the pack's stronger more-than claim. */
export const PDF_ASSUMPTIONS = [
  { id: 'PDF-A01', text: 'Exception causes are concentrated, not a long tail of one-offs.', validation: 'Two years of referral reasons by code.', ifWrong: 'Nothing repeatable to build; stop.', relatedClaimIds: ['A02'], numbers: [n(2, 'years', 'Referral-reason history requested', 'Discovery', false, 'proposed')] },
  { id: 'PDF-A02', text: 'Operators spend material time assembling evidence, not only judging.', validation: 'Time operators for a day.', ifWrong: 'Value narrows to consistency and audit, and a pre-fetched screen may be the simpler answer.', relatedClaimIds: ['A03'], numbers: [n(1, 'day', 'Operator observation', 'Discovery', false, 'proposed')] },
  { id: 'PDF-A03', text: 'Evidence sits across sources that must be reconciled.', validation: 'Confirm the sources and their access.', ifWrong: 'A simpler tool is more appropriate.', relatedClaimIds: ['A04'], numbers: [] },
  { id: 'PDF-A04', text: 'Some interpretation remains beyond deterministic rules.', validation: 'Fifty exceptions reviewed with operators; count endorsement-affecting Tariff changes in a year.', ifWrong: 'Encode the rules and stop.', relatedClaimIds: ['A06', 'A07'], numbers: [n(50, 'exceptions', 'Operator review', 'Discovery', false, 'proposed'), n(1, 'year', 'Endorsement-affecting Tariff changes', 'Discovery', false, 'proposed')] },
  { id: 'PDF-A05', text: 'Historical decisions can form an evaluation set.', validation: 'Inspect the history.', ifWrong: 'Label from scratch; slower, not fatal.', relatedClaimIds: ['A08'], numbers: [] },
] as const
export const PACK_ASSUMPTIONS = [
  { number: 1, claimId: 'A01' }, { number: 2, claimId: 'A02' }, { number: 3, claimId: 'A03' },
  { number: 4, claimId: 'A05' }, { number: 5, claimId: 'A07' }, { number: 6, claimId: 'A09' },
] as const

export const PDF_QUESTIONS = [
  { id: 'PDF-Q01', text: 'You have just seen the case assembled before anyone opened the item. When an item reaches one of your operators today, where does the time go: finding that evidence, or judging it once it is in front of them?', claimIds: ['PDF-Q01', 'PDF-A02'] },
  { id: 'PDF-Q02', text: 'The build judged the note three times and they agreed. If two of your operators took the same item, how often would they agree, and where is the reason for a decision recorded today?', claimIds: ['PDF-Q02', 'A05'] },
  { id: 'PDF-Q03', text: 'The agent read the August version of the clause as a document. How do monthly Tariff changes reach your operators now, and what goes wrong in the weeks after a change?', claimIds: ['PDF-Q03', 'A07'] },
  { id: 'PDF-Q04', text: 'What does an item cost, fully loaded, when it goes to an operator and comes back a second time, and which of your accuracy and assurance measures cannot move whatever we build?', claimIds: ['PDF-Q04', 'D-VALUE'] },
  { id: 'PDF-Q05', text: 'If this worked exactly as shown, which outcome would make it worth NHSBSA’s money: operator capacity released, pharmacies paid on time, or being able to explain any decision on demand?', claimIds: ['PDF-Q05', 'H08', 'H10', 'H13'] },
  { id: 'PDF-Q06', text: 'Where would the recommendation have to appear so nobody opens another screen, what must stay as deterministic code, and what may reach a model at all?', claimIds: ['PDF-Q06', 'D-BOUNDARY', 'A04'] },
  { id: 'PDF-Q07', text: 'What would you need to see before you trusted a recommendation like the one you just saw, and what in your own data would tell us to stop rather than scale?', claimIds: ['PDF-Q07', 'D-STOP'] },
] as const
export const PACK_QUESTIONS = [
  { id: 'PACK-Q01', paragraph: 2367, text: 'If this worked exactly as shown, which outcome would you most want it to move: pharmacies paid on time, operator capacity released, or being able to explain any payment decision on demand?' },
  { id: 'PACK-Q02', paragraph: 2376, text: 'When an item reaches an operator, where does the time actually go: finding the evidence, or judging it? And how often would two operators reach the same answer on the same item?' },
  { id: 'PACK-Q03', paragraph: 2385, text: 'How do the monthly Tariff changes reach your operators today, and what goes wrong in that handover?' },
  { id: 'PACK-Q04', paragraph: 2394, text: 'What does an item cost, fully loaded, when it goes to an operator and comes back a second time, and which accuracy measures cannot move whatever we build?' },
  { id: 'PACK-Q05', paragraph: 2403, text: 'Where should the recommendation appear so nobody opens another screen, what must stay as deterministic code, what may reach a model at all, and who owns it after we leave?' },
  { id: 'PACK-Q06', paragraph: 2412, text: 'What would you need to see before you trusted a recommendation, and what in your own data would tell us to stop?' },
] as const
const discoveryClaims: SourceClaim[] = [
  ...PDF_ASSUMPTIONS.map(item => assumption(item.id, item.text, item.text, pdf(pdfAssumptionSection), { validation: `${item.validation} If wrong: ${item.ifWrong}`, numbers: item.numbers, relatedClaimIds: item.relatedClaimIds, scope: 'tour', caveats: ['PDF assumption, not an established current-state fact.'] })),
  ...PDF_QUESTIONS.map(item => design(item.id, item.text, item.text, pdf(pdfQuestionSection), { scope: 'tour', relatedClaimIds: item.claimIds.filter(id => id !== item.id), caveats: ['Exact PDF question with layout whitespace normalised; demonstration premises are synthetic, not operational findings.'] })),
  ...PACK_QUESTIONS.map(item => design(item.id, item.text, item.text, p(item.paragraph), { scope: 'out-of-scope', caveats: ['Pack discovery list is separate from the seven-question PDF list.'] })),
  validate('DOC-LISTS', 'The PDF has five assumptions and seven questions; the pack has six principal assumptions and six questions, with different content and order.', 'Six load-bearing assumptions, each with a basis and a validation route', p(74), { additionalExcerpts: [e('Six questions that validate the problem', p(77)), e(PDF_ASSUMPTIONS[4].text, pdf(pdfAssumptionSection)), e(PDF_QUESTIONS[6].text, pdf(pdfQuestionSection))], numbers: [n(5, 'assumptions', 'PDF', 'Supplied version'), n(7, 'questions', 'PDF', 'Supplied version'), n(6, 'assumptions', 'Pack principal register', 'Version 5'), n(6, 'questions', 'Pack discovery list', 'Version 5')], caveats: ['Annex 7 is not an authoritative reconciliation of the supplied PDF.'] }),
]

type DesignRow = readonly [id: string, statement: string, quote: string, start: number, end: number, caveat: string]
const designRows: readonly DesignRow[] = [
  ['D-BOUNDARY', 'The agent gathers and recommends; code validates and calculates; a human decides. The proposed component does not execute payments.', 'The agent gathers evidence and recommends. Deterministic code validates and calculates. A human makes the consequential payment decision.', 15, 15, 'Existing-system calculations and human authority are not new payment capabilities in the prototype.'],
  ['D-EVENT', 'The proposed component consumes exception events without becoming a mandatory processing stage.', 'The copilot is a consumer of exception events, not a stage in their pipeline.', 2688, 2688, 'Read-only consumer design; no live queue integration is demonstrated.'],
  ['D-EXISTING', 'Capture, automated pricing and queue ownership remain existing capabilities.', 'NHSBSA’s current estate. Unchanged and read-only from the new component', 275, 277, 'No replacement capture, automatic pricing or routing authority is granted.'],
  ['D-NO-WAIVER', 'The proposal excludes model pricing, final disposition and rule waivers.', 'Payment amount. Final disposition. Whether a rule applies in a way the rules do not permit.', 386, 387, 'Neither model nor demonstration may waive a requirement.'],
  ['D-OUTCOMES', 'The pack permits SUFFICIENT, REFER_BACK and ABSTAIN recommendations.', 'outcome: SUFFICIENT | REFER_BACK | ABSTAIN', 1454, 1455, 'Source vocabulary only. Existing application outcomes are preserved, not renamed.'],
  ['D-SUFFICIENT', 'Sufficiency is an endorsement recommendation; human confirmation precedes existing pricing.', 'the endorsement meets the retrieved provision, so the operator can confirm and release the item to deterministic pricing', 385, 385, 'Not a payment or claim-acceptance guarantee.'],
  ['D-PHASES', 'Phase 1 is the NHSBSA operator slice; optional pharmacy assistance is Phase 2.', 'Lead with the NHSBSA-side slice; pharmacy-side is Phase 2', 857, 859, 'Pharmacy integration, adoption and commercial feasibility are separate assumptions.'],
  ['D-SHARED', 'Both proposed surfaces share contracts, versioned corpus, requirements and gate.', 'The same extraction contract, the same versioned Tariff corpus, the same sufficiency judge and the same compliance gate serve both surfaces.', 437, 437, 'Shared logic reduces drift but cannot guarantee identical inputs, versions or stochastic outputs.'],
  ['D-SEND', 'The component drafts but does not directly send messages to pharmacies.', 'Copilot never sends anything to a pharmacy itself', 1330, 1330, 'Human-reviewed disposition and communication use the existing channel.'],
  ['D-PAPER', 'The proposal does not change physical-paper handling, retention or destruction.', 'Nothing here changes the retention or destruction schedule for physical forms.', 3329, 3329, 'Scanning does not authorise destruction. Archive savings remain unvalidated.'],
  ['D-PLUMBING', 'Fetching image, product and ledger and checking date presence are code, not proof of model value.', 'Explicit rules. No judgement.', 329, 331, 'PDF explicitly distinguishes plumbing and date checks from interpretation.'],
  ['D-PREFETCH', 'Conditional evidence gathering is proposed; compare its value with deterministic prefetching.', 'Multi-tool, multi-step, conditional on what comes back.', 347, 349, 'A nicer assembled screen alone does not establish incremental model value.'],
  ['D-INTERPRET', 'Ambiguous free-text interpretation against retrieved prose is the proposed model contribution.', 'Interpret ambiguous or partial endorsement text against the rule', 350, 352, 'Test against rules, retrieval and templates; missing date alone may be deterministic.'],
  ['D-PLANNER', 'The planner emits schema-checked unknowns and registered tool requests, not invented tools or outcomes.', 'May only name tools from the registry; no reasoning about outcome', 2240, 2244, 'No authority to modify controls.'],
  ['D-GATHER', 'Read-only findings retain provenance and retrieval timestamps.', 'Every finding carries its source and a timestamp; a tool failure is recorded, not papered over', 295, 296, 'No guessed substitute for failed retrieval.'],
  ['D-RECONCILE', 'Material disagreements are surfaced with sources, not silently resolved.', 'Disagreement is surfaced to the operator; it is never silently resolved', 298, 299, 'Arithmetic comparison remains deterministic; the model cannot overwrite ledger or capture values.'],
  ['D-JUDGE', 'The judge uses only evidence and retrieved clause text, quotes operative words and samples three judgements.', 'Given the evidence and the retrieved clause text only, states whether the endorsement satisfies it and quotes the operative words', 300, 302, 'Sample agreement is not independent expert adjudication or calibrated accuracy.'],
  ['D-GATE', 'A deterministic gate withholds forbidden recommendations and leaves evidence available.', 'If it fails, the recommendation is withheld and the operator sees evidence only', 303, 305, 'A model may propose forbidden output; the gate prevents its display, not its generation.'],
  ['D-GATE-CHECKS', 'The gate checks permitted outcomes, required evidence, retrieved citation IDs and resolvable rationale evidence IDs.', 'FAIL if any evidence_id in rationale does not resolve', 1349, 1356, 'Identifier membership is necessary but does not prove semantic support.'],
  ['D-EXPLAIN', 'Explanations are drafted from recorded facts and reviewed by a human.', 'Drafts the note to the pharmacy stating exactly what is missing, using only facts in the decision record', 306, 308, 'A fact-ID mapping alone does not establish sentence entailment. Templates may suffice.'],
  ['D-CONFIDENCE', 'Confidence combines five structural signals in code, never a model self-rating.', 'Combines five structural signals: provision found, sample agreement, reconciliation, image quality, in-coverage.', 309, 311, 'Thresholds and calibration require outcome evidence; formula is not fully specified in the pack.'],
  ['D-HUMAN', 'An operator accepts, amends or refers with a reason recorded alongside versions.', 'Reads the assembled case and decides: accept, amend, or refer with a reason', 312, 314, 'Human review reduces risk but does not guarantee every model error is caught.'],
  ['D-LEARN', 'Reviewed decisions and overrides become evaluation candidates, not automatic training truth.', 'Operator decisions + overrides become labelled examples for review', 1331, 1334, 'Requires adjudication and label governance.'],
  ['D-VERSION', 'Provisions carry IDs and effective dates; retrieval filters by dispensing date before ranking.', 'Every retrieval is filtered by dispensing_date between effective_from and effective_to.', 1359, 1361, 'Actual governing-date semantics must be validated; counterfactual replay is not historical rule selection.'],
  ['D-PIN', 'Records pin Tariff, evidence, model and prompt versions for reconstruction.', 'Creates case; pins Tariff version for dispensing_date; pins model + prompt hashes', 1249, 1250, 'Retention follows policy, not the pack’s indefinite-retention rhetoric.'],
  ['D-REGRESSION', 'Corpus changes require regression tests and expert review of changed expected outcomes before activation.', 'every case whose expected outcome changes is reviewed by a domain expert', 2680, 2680, 'Some changes may require code, schema or gate changes, not only new prose.'],
  ['D-CITATION', 'Only retrieved provisions may be cited; missing governing evidence requires abstention.', 'No retrieved provision, no recommendation, abstain.', 391, 391, 'NCSO Clause 9 and submission Clause 5A are case-specific; no universal citation.'],
  ['D-CASE-CONTRACT', 'ExceptionCase contains item, contractor, dispensing date, image reference, fields, product, pack, submission and routing reason.', 'ExceptionCase      { item_id, contractor_id, dispensing_date, image_ref, extracted_fields{},', 1450, 1451, 'Proposed data contract, not an NHSBSA schema. Patient identity excluded.'],
  ['D-EVIDENCE-CONTRACT', 'Evidence contains source, field, value, page/region or record provenance and retrieval time.', 'Evidence           { source, field, value, provenance{page, bbox | record_id}, retrieved_at }', 1452, 1452, 'Proposed schema only.'],
  ['D-CITATION-CONTRACT', 'RuleCitation contains version, part, clause, text span and effective dates.', 'RuleCitation       { tariff_version, part, clause, text_span, effective_from, effective_to }', 1453, 1453, 'Do not treat specimen clause prose as verified historical rules.'],
  ['D-RECOMMENDATION-CONTRACT', 'Recommendation contains outcome, rationale, citations, evidence IDs, alternative and confidence.', 'evidence_ids[], alternative{outcome, cost_in_cycles}, confidence{...}', 1454, 1455, 'Alternative cost in payment cycles is illustrative unless measured.'],
  ['D-CONFIDENCE-CONTRACT', 'Confidence includes five signals, composite, abstention flag and reason.', 'in_coverage, composite, abstain: bool, abstain_reason', 1456, 1457, 'Structural signal, not a self-reported probability.'],
  ['D-RECORD-CONTRACT', 'DecisionRecord includes case, recommendation, gate, human identity/decision, override, versions and timestamp.', 'override_reason, tariff_version, model_hash, prompt_hash, timestamp', 1458, 1459, 'Proposed audit contract, not evidence of durable storage in this static application.'],
  ['D-REDACT', 'Patient identifiers are excluded; item and endorsement crops are masked before inference.', 'Patient name, NHS number, address and date of birth fields are never copied into the case.', 1343, 1344, 'Actual minimisation, exemption boolean necessity and redaction performance require IG approval.'],
  ['D-ATTEST', 'Payload hashes and redaction attestations support review of model inputs.', 'every model call is traced with its payload hash and a redaction attestation.', 1345, 1345, 'Minimise sensitive telemetry; tracing is not a substitute for testing the boundary.'],
  ['D-ORIGINALS', 'Original images stay unchanged; records reference rather than embed them.', 'The decision record references the image; it does not embed it.', 3327, 3328, 'Working copies and records remain subject to policy-governed retention.'],
  ['D-ACCESS', 'Least privilege, queue-scoped access, no bulk export and logged access are proposed.', 'Least privilege; operators see cases in their queue; no bulk export; all access logged', 1508, 1509, 'Not evidence that these controls are currently implemented.'],
  ['D-DPIA', 'Data-boundary agreement and DPIA approval must precede live model exposure.', 'DPIA sign-off as an entry criterion', 1502, 1503, 'Other pack timelines say started; approval before actual exposure is the safe interpretation.'],
  ['D-RELEASE', 'Versioned, evaluated releases use feature flags and rollback.', 'Every change to prompt, model, corpus version or code is gated by the golden-set evaluation', 1097, 1100, 'Proposed release discipline; no deployment is performed by this registry.'],
  ['D-FAIRNESS', 'Monitor contractor-size, region, prescriber and handwriting disparities.', 'Per-segment monitoring by contractor size and region; divergence treated as a defect', 1536, 1543, 'Compare meaningful slices and report uncertainty; no fairness guarantee.'],
  ['D-OVERRIDE', 'Near-zero overrides trigger safety review rather than automatic celebration.', 'Override rate floor; alert if near zero', 1532, 1535, 'Override rate alone cannot diagnose automation bias.'],
  ['D-SKILL', 'Periodic unaided samples and operator participation address skill erosion.', 'Operators remain the ground truth; rotation; periodic unaided sampling', 1548, 1551, 'Reviewed expert labels are needed; any individual operator can err.'],
  ['D-VALUE', 'The value model includes handling, repeat work, redeployable capacity, audit and error exposure, less delivery and running costs.', 'ANNUAL VALUE  =   manual handling avoided', 573, 586, 'No measured business case. Avoid double-counting handling, capacity and touches; separate pharmacy value; archive savings default to zero.'],
  ['D-METRICS-TECH', 'Technical measures cover relevance, grounding, citation validity, agreement, calibration, abstention, slices, latency, reliability and cost.', 'Retrieval relevance; groundedness (every recommendation cites a retrieved provision); citation validity; agreement with expert adjudication', 593, 594, 'Citation validity alone is not semantic groundedness.'],
  ['D-METRICS-OPS', 'Operational measures cover handling, evidence-location time, touches, ageing, rework, referrals and overrides.', 'Handling time per exception; manual touches per case; time spent locating evidence; queue depth and ageing', 596, 597, 'Resolution without referral is hypothesis-dependent, not an unconditional target.'],
  ['D-METRICS-VALUE', 'Public-value measures include loaded cost, affected-item delay, payment accuracy, error exposure, capacity and audit effort.', 'Fully-loaded cost per exception; payment delay avoided (days); payment accuracy maintained (PPPA, ACV)', 599, 600, 'Inputs must come from customer baselines. Avoided activity is not automatically cashable.'],
  ['D-METRICS-SAFETY', 'Adoption and safety measures include use, acceptance, overrides, false flags, trust, disparities, unsupported recommendations and incidents.', 'Operator usage; recommendation acceptance; override rate (with a floor); false-flag rate', 602, 603, 'Targets are not measured results.'],
  ['D-STOP', 'Stop or reshape for weak repeatability, small assembly benefit, poor ground truth, IG barriers, weak agreement, deteriorating guardrails or excessive costs.', 'Cost per case exceeds the cost of the touch it replaces, including tokens spent on cases it did not help.', 1893, 1899, 'Thresholds must be agreed before exposure, not selected after seeing results.'],
  ['D-HANDOVER', 'The customer should own corpus pipeline, evaluation harness, gate tests, infrastructure, runbook and trained operation.', 'Corpus pipeline, eval harness in their CI, pricing tests, IaC, runbook, trained operators', 1445, 1448, 'Proposed handover, not evidence that assets have been delivered.'],
  ['D-MYS', 'The PDF proposes an unbuilt earlier check during MYS submission.', 'The same kernel offered before submission', 434, 435, 'PDF MYS extension and pack dispensing-system/camera integration are different hypotheses; neither proves existing integration support.'],
  ['D-ADVISORY', 'Pharmacy assistance is optional and cannot block submission.', 'The pharmacy can submit regardless; the contractor owns the claim', 3156, 3159, 'Completeness is not a promise of pricing, acceptance or payment.'],
  ['D-OPTIONAL-QA', 'Pharmacy Q&A is an optional retrieval surface, not the core agentic workflow.', 'Useful. Not agentic. A UI over the same corpus. Phase 2.', 341, 343, 'Not built or required for the operator slice.'],
  ['D-CASCADE', 'The proposed cascade uses rules, small-model checks, bounded judgement and human review.', 'Design goal: minimise Tier 2 without pushing work into Tier 3.', 1019, 1034, 'Do not import the source’s autonomous disposition or free-cost overclaims.'],
  ['D-BASELINE', 'Shadow mode compares proposals without influencing payments; assisted mode measures outcomes against a baseline.', 'Proposals generated with zero influence, compared to what operators actually decided, sliced by category.', 395, 395, 'No production model performance is established by synthetic cases.'],
]
const tourDesignIds = new Set(['D-BOUNDARY', 'D-EXISTING', 'D-NO-WAIVER', 'D-PHASES', 'D-PLUMBING', 'D-PREFETCH', 'D-INTERPRET', 'D-RECONCILE', 'D-GATE', 'D-CONFIDENCE', 'D-HUMAN', 'D-CITATION', 'D-VALUE', 'D-STOP', 'D-ADVISORY', 'D-BASELINE'])
const designClaims = designRows.map(([id, statement, quote, start, end, caveat]) => design(id, statement, quote, p(start, end), {
  scope: tourDesignIds.has(id) ? 'tour' : 'reference-only', caveats: [caveat, 'Proposed design, not independently verified implementation.'],
  ...(id === 'D-PLUMBING' ? { additionalExcerpts: [e('Fetching the image, product and ledger is plumbing; checking that a date is present is a rule. Both are code.', pdf('WHAT THE BUILD DEMONSTRATES'))] } : {}),
  ...(id === 'D-MYS' ? { additionalExcerpts: [e('the same check could run earlier, when an electronic claim is submitted through Manage Your Service', pdf('WHAT THE BUILD DEMONSTRATES'))] } : {}),
  ...(id === 'D-JUDGE' ? { numbers: [n(3, 'judge samples', 'Proposed per-case judgement', 'Design', false, 'proposed')] } : {}),
  ...(id === 'D-CONFIDENCE' ? { numbers: [n(5, 'signals', 'Structural confidence', 'Design', false, 'proposed')] } : {}),
}))

const failureRows: readonly DesignRow[] = [
  ['D-FAIL-EVENT', 'Malformed events go to dead letter; the existing queue continues.', 'Dead-letter on malformed; never blocks their queue', 1245, 1245, 'Continuity of existing processing is distinct from fail-closed recommendation controls.'],
  ['D-FAIL-RULE', 'Missing Tariff version or governing provision causes abstention and an alert.', 'No Tariff version for date → ABSTAIN + alert', 1250, 1250, 'No citation from memory.'],
  ['D-FAIL-REDACTION', 'Redaction failure prevents model contact.', 'Redaction failure → ABSTAIN; nothing reaches a model', 1255, 1255, 'Fail closed for sensitive-data exposure.'],
  ['D-FAIL-COVERAGE', 'Out-of-coverage or low-quality input may cause early abstention.', 'Below threshold → early ABSTAIN with reason', 1260, 1265, 'Trace must distinguish skipped checks from executed failures.'],
  ['D-FAIL-TOOL', 'Tool timeout has bounded retries then abstention; missing evidence is not guessed.', 'Tool timeout → bounded retry → ABSTAIN.', 1280, 1280, 'Bound and timeout values are not specified.'],
  ['D-FAIL-SCHEMA', 'Schema violations get one retry then abstention.', 'Schema failure → retry once, then ABSTAIN', 1270, 1270, 'Structured JSON alone is not semantic correctness.'],
  ['D-FAIL-MISMATCH', 'Material unresolved mismatch lowers confidence and prevents sufficient output.', 'FAIL if recommendation == SUFFICIENT and reconciliation has an unresolved material mismatch', 1351, 1351, 'Never silently choose a price, quantity or ledger value.'],
  ['D-FAIL-SAMPLES', 'Split judgements lower confidence; the exact abstention policy is inconsistent.', 'Lower composite; abstain below threshold', 1474, 1476, 'Other passages demand unanimity; category policy requires explicit resolution.'],
  ['D-FAIL-GATE', 'Rejected or unavailable gate means no recommendation, with evidence-only fallback.', 'Gate unavailable: no recommendation is shown', 1072, 1072, 'Existing workflow remains available; the gate itself does not fail open.'],
  ['D-FAIL-EXPLAIN', 'New facts cause draft rejection and manual explanation.', 'New fact detected → draft rejected; operator writes manually', 1310, 1310, 'Fact-ID presence does not alone prove entailment.'],
  ['D-FAIL-RECORD', 'Record-write failure is retried; completion and recommendation-display policy need reconciliation.', 'Write failure → nothing shown; retry', 1314, 1315, 'P1076 also lets the operator decide while record writing retries; distinguish existing processing from copilot completion.'],
  ['D-FAIL-IDENTITY', 'Identity failure denies access rather than degrading to anonymous credentials.', 'Identity failure denies access; nothing degrades to anonymous or shared credentials', 1080, 1080, 'Security fail closed; existing processing continuity is separate.'],
  ['D-FAIL-KEYS', 'Unavailable secrets service fails dependent services closed while the existing queue continues.', 'Unavailable: dependent services fail closed; the queue runs as today', 1084, 1084, 'Proposed service behaviour requires testing.'],
  ['D-FAIL-LINEAGE', 'Lineage-service failure alerts on degraded assurance visibility.', 'assurance visibility degrades and is alerted', 1092, 1092, 'Not an assertion that lineage is complete.'],
  ['D-FAIL-TELEMETRY', 'Telemetry loss pauses the proposed service.', 'Loss of telemetry is an incident in its own right; the service is paused until it is restored', 1096, 1096, 'The established prescription process continues.'],
  ['D-FAIL-COST', 'A cost ceiling throttles expensive-model work and leaves excess cases with operators.', 'Tier 2 throttled; excess routes to operator unchanged', 1486, 1488, 'Actual cost ceiling and workload share are unknown.'],
  ['D-FAIL-EVAL', 'Evaluation regression blocks release.', 'Deployment blocked in CI', 1489, 1491, 'Not proof an evaluation harness was actually run.'],
  ['D-FAIL-UI', 'Unavailable UI or model leaves the established operator process usable.', 'Surface unavailable: operators work the queue as today', 1104, 1104, 'No anonymous access or bypass of evidence controls.'],
  ['D-FAIL-FLAG', 'The feature flag stops assistance without stopping prescriptions.', 'Turning the flag off returns the queue to today’s process in seconds, with nothing blocked', 1100, 1100, 'Seconds is an unmeasured design aspiration.'],
]
const failureClaims = failureRows.map(([id, statement, quote, start, end, caveat]) => design(id, statement, quote, p(start, end), {
  caveats: [caveat], ...(id === 'D-FAIL-SCHEMA' ? { numbers: [n(1, 'retry', 'Schema validation failure', 'Proposed policy', false, 'proposed')] } : {}),
}))

const technologyRows: readonly DesignRow[] = [
  ['TECH01', 'Azure landing zone is an assumed hosting boundary.', 'Existing accredited Azure landing zone (assumed)', 1116, 1121, 'New workload approval does not automatically inherit accreditation.'],
  ['TECH02', 'Service Bus or Event Grid is proposed for exception ingress.', 'Azure Service Bus (or Event Grid)', 1122, 1127, 'Ordering, dead-letter behaviour and AMQP depend on the selected service; alternatives are not interchangeable guarantees.'],
  ['TECH03', 'Functions and Durable Functions are proposed for rules, gate and orchestration.', 'Azure Functions (Durable Functions)', 1128, 1133, 'Replay, hosting, scaling and scale-to-zero costs require validation.'],
  ['TECH04', 'Document Intelligence layout is proposed only where extra region provenance is needed.', 'Azure AI Document Intelligence (layout model)', 1134, 1139, 'Drop the layout pass if existing capture emits usable regions; not blanket new OCR.'],
  ['TECH05', 'AI Search is proposed for vector/keyword retrieval with effective-date filters.', 'Azure AI Search (vector + keyword, with filters)', 1140, 1145, 'Correctness depends on source coverage, metadata and retrieval tests.'],
  ['TECH06', 'Azure OpenAI is proposed behind a model-provider abstraction.', 'Azure OpenAI Service, GPT-4o-class for judgement', 1146, 1151, 'Region, data use, private networking, lifecycle and availability are not verified here.'],
  ['TECH07', 'GPT-4o and GPT-4o-mini are legacy illustrative model names, not current recommendations.', 'Azure OpenAI GPT-4o (judge, explain) + GPT-4o-mini (classify) via the OpenAI SDK; structured outputs (JSON schema)', 2195, 2197, 'No lifecycle, capability, price or replacement checked.'],
  ['TECH08', 'Foundry Agent Service is proposed for tools, threads and tracing.', 'Azure AI Foundry, Agent Service', 1158, 1163, 'Product capabilities and integration are unverified; no evidence of implementation.'],
  ['TECH09', 'Foundry Evaluations is proposed for batch and regression evaluation.', 'Azure AI Foundry, Evaluations', 1164, 1169, 'Service availability is not evidence of evaluation quality.'],
  ['TECH10', 'Cosmos DB is a source-proposed decision-record store.', 'Azure Cosmos DB (append-only container, TTL off)', 1170, 1175, 'TTL off does not enforce immutability. This is source metadata, not a backend selection or change.'],
  ['TECH11', 'Blob Storage is proposed for references and layout output.', 'Azure Blob Storage', 1176, 1181, 'Avoid unnecessary image copies and agree retention.'],
  ['TECH12', 'Static Web Apps and an App Service API are proposed alternatives to existing-tool integration.', 'otherwise Azure Static Web Apps + App Service API', 1182, 1187, 'Not evidence of the current deployment or permission to create services.'],
  ['TECH13', 'Microsoft Entra ID is proposed for identity, RBAC and conditional access.', 'Managed identities for every service; RBAC; conditional access', 1188, 1193, 'Controls require actual configuration and access testing.'],
  ['TECH14', 'Key Vault is proposed for secrets, keys and certificates.', 'Secrets, keys, certificates', 1194, 1199, 'No secrets belong in code, copy or this registry.'],
  ['TECH15', 'Private Link and VNet integration are proposed for private connectivity.', 'Azure Private Link / VNet integration', 1200, 1205, 'Private networking alone does not prove residency or an end-to-end data boundary.'],
  ['TECH16', 'Purview is proposed for classification and lineage.', 'Data lineage and classification across sources touched', 1206, 1211, 'Actual model/tool payload coverage needs validation.'],
  ['TECH17', 'Application Insights, Azure Monitor and Foundry tracing are proposed for observability.', 'Application Insights + Azure Monitor + Foundry tracing', 1212, 1217, 'Minimise sensitive telemetry; not existing monitoring evidence.'],
  ['TECH18', 'OpenTelemetry is the proposed tracing interface.', 'OpenTelemetry-based', 1216, 1216, 'An interface standard alone does not establish portability.'],
  ['TECH19', 'OIDC and AMQP are cited portability interfaces.', 'Standard OIDC', 1192, 1192, 'AMQP is separately asserted in P1126; validate applicability to the chosen ingress.'],
  ['TECH20', 'Bicep or Terraform and GitHub Actions are proposed for infrastructure and gated releases.', 'Bicep (or Terraform) + GitHub Actions', 1218, 1223, 'No infrastructure, CI or deployment change authorised here.'],
  ['TECH21', 'Copilot Studio is an optional Phase 2 Q&A choice.', 'Copilot Studio (Phase 2 only)', 1224, 1229, 'Not a core adjudication engine or current product endorsement.'],
  ['TECH22', 'Python 3.12 and FastAPI are the pack’s proposed prototype runtime.', 'Python 3.12, FastAPI, single service', 2187, 2189, 'Not evidence of this workspace’s implementation stack.'],
  ['TECH23', 'OpenAI SDK and JSON Schema are proposed for structured model access.', 'via the OpenAI SDK; structured outputs (JSON schema)', 2195, 2195, 'Schema conformance is not semantic correctness.'],
  ['TECH24', 'In-memory BM25 is proposed as a retrieval fallback.', 'Fallback: in-memory BM25 if Search is unavailable', 2199, 2201, 'Fallback must retain effective-date filtering and citation identity.'],
  ['TECH25', 'pytest is proposed for rules and evaluation.', 'pytest + a runner that replays the golden set and prints the scoreboard', 2227, 2229, 'No such run was verified from these documents.'],
  ['TECH26', 'JSON and JSONL are proposed for mock data, contracts and prototype records.', 'Append-only JSONL file; replay command', 2219, 2221, 'A file format alone does not enforce immutable audit.'],
  ['TECH27', 'Streamlit or React are prototype UI alternatives in the pack.', 'Streamlit (or a small React page), three screens', 2223, 2225, 'Source proposal only; no UI edited.'],
  ['TECH28', 'OCR/ICR improvements, rules, workflow automation, analytics, chatbots and classifiers are compared alternatives.', 'Rules engine', 246, 267, 'Claims that these classes cannot retrieve, cite, abstain or orchestrate are overbroad.'],
  ['TECH29', 'Fine-tuning, public endpoints and self-hosted models are compared alternatives.', 'Public endpoint, residency; open model self-hosted, ops burden for a first slice', 1149, 1149, 'Trade-offs are contextual; the documents do not prove impossibility.'],
  ['TECH30', 'Containers, relational databases, manual reviews and custom chat UIs are compared alternatives.', 'Relational DB, fine, but append-only semantics and change feed are cleaner here', 1173, 1173, 'Source author preference, not a general technical limitation of alternatives.'],
]
const technologyClaims = technologyRows.map(([id, statement, quote, start, end, caveat]) => design(id, statement, quote, p(start, end), {
  scope: 'out-of-scope', caveats: [caveat, 'Illustrative source technology, not verified NHSBSA estate or a current recommendation.'],
  ...(id === 'TECH19' ? { additionalExcerpts: [e('Standard AMQP; swappable', p(1126))] } : {}),
  ...(id === 'TECH22' ? { numbers: [n(3.12, 'version identifier', 'Python runtime proposed in source', 'Source prototype', false, 'proposed')] } : {}),
}))

const anatomyRows: readonly DesignRow[] = [
  ['FORM01', 'The pharmacy stamp identifies the contractor; capture-failure frequency is not established.', 'Dispensing contractor identity stamp', 2931, 2935, 'Poor-stamp risk is source reasoning, not a measured rate.'],
  ['FORM02', 'Age and date of birth are patient identifiers with exemption relevance.', 'Patient age and date of birth', 2936, 2940, 'Redact; do not copy identity into a model case.'],
  ['FORM03', 'Name and address fields identify the patient.', 'Title, Forename, Surname & Address', 2941, 2945, 'Excluded from model context and synthetic UI records.'],
  ['FORM04', 'The treatment-duration box includes duration and dose instructions.', 'Duration; ‘N.B. Ensure dose is stated’', 2946, 2950, 'Not authority to perform clinical or reimbursement calculations.'],
  ['FORM05', 'The endorsement margin holds pharmacy annotations such as NCSO, specials, broken bulk, OOP and pack size.', 'Pharmacy annotations: NCSO, specials, broken bulk, out-of-pocket, pack size, etc.', 2951, 2955, 'No exact provision for every endorsement class is supplied.'],
  ['FORM06', 'The item body describes drug, form, strength, dose and quantity.', 'Drug, form, strength, dose, quantity', 2956, 2960, 'Describing existing pricing inputs does not authorise pricing in the component.'],
  ['FORM07', 'The prescriber signature is described as a validity input.', 'Signature vs pen-mark distinction is a capture concern, not a judgement one.', 2961, 2965, 'Actual validation and recognition performance require confirmation.'],
  ['FORM08', 'The form date is described as prescribing date; the claimed Tariff-date role conflicts with dispensing-date retrieval.', 'Date of prescribing', 2966, 2970, 'Keep prescribing, dispensing, submission, receipt, endorsement and effective dates separate.'],
  ['FORM09', 'The prescriber block includes practice, name, code and address.', 'Practice, prescriber name, code, address', 2971, 2975, 'Handwriting slicing is proposed analysis, not an established capability.'],
  ['FORM10', 'The dispenser box counts items and is proposed for reconciliation.', 'Count of items dispensed', 2976, 2980, 'Do not confuse item count with physical-form count.'],
  ['FORM11', 'FP10NC0105 is the named specimen code; form type and serial are described.', 'Form type and serial', 2981, 2985, 'Anomaly/fraud utility is a hypothesis, not a demonstrated function.'],
  ['FORM12', 'The reverse includes exemption declaration, signature and charge information.', 'Exemption declaration, patient/representative signature, charge paid', 2986, 2990, 'Reverse not shown in the described specimen. No need for patient declarations in model judgement is established.'],
]
const anatomyClaims = anatomyRows.map(([id, statement, quote, start, end, caveat]) => fact(id, statement, quote, p(start, end), attributed('fp10-specimen', {
  scope: 'out-of-scope', caveats: [caveat, 'Annex description only; specimen image and external form guidance were not independently inspected.'],
})))

const fixture = (value: number, unit: string, population: string, approximate = false) => n(value, unit, population, 'Synthetic source demonstration', approximate, 'synthetic')
const syntheticClaims: SourceClaim[] = [
  synthetic('S-ALL', 'All demonstration cases, values, confidence scores and mismatches are synthetic.', 'Every case, value, confidence score and mismatch in the demonstration', p(863, 865), { scope: 'tour', caveats: ['Not operational data, measured model performance or actual patient information.'] }),
  synthetic('S-CASE-A', 'Pack Case A is clean and cleared by rules without a model.', 'Status CLEARED BY RULES; no model call logged', p(2306, 2309), { caveats: ['Maps to canonical app Case E, not app Case A; metadata only.'] }),
  synthetic('S-CASE-B', 'Pack Case B has a missing endorsement and refers back with an instruction.', 'B, Missing endorsement', p(2310, 2313), { additionalExcerpts: [e('REFER BACK; exact instruction; clause cited', p(2311))], caveats: ['No exact canonical app counterpart. Missingness may be deterministic.'] }),
  synthetic('S-CASE-C', 'Pack Case C is initialled but undated NCSO, with a flagged mismatch, REFER_BACK and gate PASS.', 'Evidence list; mismatch flagged; region highlighted; clause quoted; REFER BACK; gate PASS; confidence 0.86 (synthetic)', p(2314, 2317), { numbers: [fixture(0.86, 'composite', 'Pack Case C')], caveats: ['Closest app analogue is canonical B for undated endorsement, not canonical C. Source ledger mismatch is not copied into app B.'] }),
  synthetic('S-CASE-D', 'Pack Case D abstains on poor handwriting, missing provision and disagreement.', 'ABSTAIN; three failed signals named; routed to existing process', p(2318, 2321), { numbers: [fixture(3, 'failed signals', 'Pack Case D narrative')], caveats: ['Early abstention can skip later checks; do not imply every narrated sample executed.'], scope: 'tour' }),
  synthetic('S-CASE-E', 'Pack Case E demonstrates the undated case under two pinned rule versions.', 'Same case, two recommendations, two records with versions pinned', p(2322, 2325), { numbers: [fixture(2, 'versions', 'Pack Case E'), fixture(2, 'records', 'Pack Case E')], caveats: ['Synthetic July/August rule change, not evidenced historical Tariff text. App analogue is B counterfactual replay, not E.'] }),
  synthetic('S-IDENTIFIERS', 'Pack queue identifiers and contractor codes are invented fixtures.', '8,401    FA123', p(2137, 2141), { additionalExcerpts: [e('8,412    FB456', p(2138)), e('8,415    FC789', p(2139)), e('8,417    FD012', p(2140)), e('8,420    FE345', p(2141))], numbers: [8401, 8412, 8415, 8417, 8420].map(value => fixture(value, 'item identifier', 'Pack queue')), caveats: ['Not real contractor records; do not replace canonical SYN-labelled app fixtures.'] }),
  synthetic('S-DATES', 'The source uses received 03 September, dispensed 14 August 2026 and an August effective period.', 'received 03 Sep   dispensed 14 Aug   Tariff Aug-26   model v3', p(2146), { additionalExcerpts: [e('effective 01 Aug - 31 Aug 2026', p(2162)), e('14 Aug 2026 (dispensing)', p(3026))], numbers: [fixture(3, 'day of September', 'Receipt'), fixture(14, 'day of August 2026', 'Dispensing'), fixture(1, 'day of August 2026', 'Effective start'), fixture(31, 'day of August 2026', 'Effective end'), fixture(3, 'model version identifier', 'Illustrative pinned model')], caveats: ['Synthetic dates and model version, not a historical Tariff assertion.'] }),
  synthetic('S-PACK', 'A Category M, pack-28 screen fixture differs from the Annex suspension pack.', 'product/pack   Cat M, 28    (dm+d mock)', p(2157), { numbers: [fixture(28, 'pack units', 'Screen product mock')], namedSourceIds: ['dmd', 'document-author'] }),
  synthetic('S-AMOUNTS', 'The screen compares a £1,190 ledger value with £1,240 extraction.', 'ledger value   GBP 1,190', p(2158), { additionalExcerpts: [e('extracted      GBP 1,240', p(2159))], numbers: [fixture(1190, 'GBP', 'Ledger mock'), fixture(1240, 'GBP', 'Capture mock')], caveats: ['Invented mismatch only; not a reimbursement calculation or permission to select a value.'] }),
  derived('S-DIFFERENCE', 'The synthetic monetary mismatch is £50.', 'extracted      GBP 1,240', p(2159), { formula: '1240 - 1190', inputClaimIds: ['S-AMOUNTS'], numbers: [n(50, 'GBP difference', 'Synthetic ledger/capture mismatch', 'Source fixture', false, 'derived')], caveats: ['Difference only, not a payment amount to approve or execute.'] }),
  synthetic('S-HISTORY', 'The history mock contains three similar items in ninety days.', 'history        3 similar in 90d', p(2160), { numbers: [fixture(3, 'similar cases', 'Mock contractor history'), fixture(90, 'days', 'History lookback')] }),
  synthetic('S-REGION', 'The screen locates page 1 at bounding box (412,880)-(690,912).', 'page 1, region (412,880)-(690,912)', p(2160), { numbers: [fixture(1, 'page', 'Synthetic image'), ...[412, 880, 690, 912].map((value, index) => fixture(value, ['x1', 'y1', 'x2', 'y2'][index], 'Synthetic region coordinate'))] }),
  synthetic('S-QUALITY', 'The source shows quality 0.82 and queue composites 0.86, 0.91, 0.31 and 0.78.', 'quality 0.82', p(2154), { additionalExcerpts: [e('0.86', p(2138)), e('0.91', p(2139)), e('0.31', p(2140)), e('0.78', p(2141))], numbers: [fixture(0.82, 'quality score', 'Source case'), ...[0.86, 0.91, 0.31, 0.78].map(value => fixture(value, 'composite', 'Source queue'))], caveats: ['Synthetic structural scores, not calibrated correctness probabilities.'] }),
  synthetic('S-QUALITY-FORMULA', 'Layout confidence 0.74 and capture confidence 0.71 lead to an unexplained source quality 0.82.', 'Layout confidence on the margin region 0.74; capture confidence on ‘NCSO JB’ 0.71; overall quality 0.82', p(3071), { numbers: [fixture(0.74, 'layout confidence', 'Margin'), fixture(0.71, 'capture confidence', 'NCSO JB'), fixture(0.82, 'overall quality', 'Annex fixture')], status: 'withheld', caveats: ['Formula unspecified; not a simple average and not reproducible from these values alone.'] }),
  synthetic('S-SAMPLES', 'The demonstration uses three judge samples, a 3/3 agreement example and a 2:1 split example.', '3/3 samples agree', p(3091), { additionalExcerpts: [e('samples split 2:1', p(3183))], numbers: [fixture(3, 'samples', 'Judge'), fixture(3, 'agreeing samples of 3', 'NCSO example'), fixture(2, 'majority samples of 3', 'Handwriting split'), fixture(1, 'minority sample of 3', 'Handwriting split')], caveats: ['Neither independent experts nor evidence of calibrated accuracy.'] }),
  synthetic('S-TRACE', 'Source trace timings are plan 0.4s, gather 1.1s, judge 2.3s and gate 0.01s, with four tools, three samples and 0.9p.', 'TRACE  plan 0.4s | gather 1.1s (4 tools) | judge 2.3s (3 samples) | gate 0.01s | 0.9p', p(2169), { numbers: [fixture(0.4, 'seconds', 'Plan'), fixture(1.1, 'seconds', 'Gather'), fixture(2.3, 'seconds', 'Judge'), fixture(0.01, 'seconds', 'Gate'), fixture(4, 'tools', 'Gather'), fixture(3, 'samples', 'Judge'), fixture(0.9, 'pence/case', 'Illustrative inference cost')], caveats: ['Not measured latency or validated service pricing.'] }),
  synthetic('S-EVAL', 'The illustrative scoreboard has twenty cases, 17/20 agreement, 20/20 groundedness and three abstentions.', 'GOLDEN SET (20 synthetic cases)              agreement 17/20   groundedness 20/20   abstained 3', p(2173), { numbers: [fixture(20, 'cases', 'Synthetic golden set'), fixture(17, 'agreeing cases / 20', 'Illustrative evaluation'), fixture(20, 'grounded cases / 20', 'Illustrative evaluation'), fixture(3, 'abstentions', 'Illustrative evaluation')], caveats: ['Not measured performance. Abstention scoring and agreement denominators need definition.'] }),
  synthetic('S-EVAL-CATEGORY', 'The synthetic category table gives NCSO 6/7, specials 4/5, broken bulk 4/4 and OOP 3/4.', 'by category    NCSO 6/7   specials 4/5   broken bulk 4/4   OOP 3/4', p(2174), { numbers: [fixture(6, 'correct / 7', 'NCSO'), fixture(4, 'correct / 5', 'Specials'), fixture(4, 'correct / 4', 'Broken bulk'), fixture(3, 'correct / 4', 'OOP')], relatedClaimIds: ['S-EVAL-MISSES'], caveats: ['One miss in NCSO, specials and OOP contradicts the all-NCSO assertion.'] }),
  synthetic('S-EVAL-INPUT', 'Input results show print 14/15 and handwriting 3/5, with two claimed correct abstentions and zero wrong.', 'by input       print 14/15   handwritten 3/5  (2 abstained correctly, 0 wrong)', p(2175), { numbers: [fixture(14, 'correct / 15', 'Print'), fixture(3, 'correct / 5', 'Handwriting'), fixture(2, 'correct abstentions', 'Handwriting'), fixture(0, 'wrong', 'Handwriting')], caveats: ['Synthetic; clarify whether correct abstentions count towards agreement.'] }),
  synthetic('S-EVAL-CALIBRATION', 'The illustrative ECE is 0.07; the 0.8-0.9 bucket has five cases, four correct.', 'calibration    ECE 0.07  (bucket 0.8-0.9: 5 cases, 4 correct)', p(2176), { numbers: [fixture(0.07, 'ECE', 'Synthetic calibration'), fixture(0.8, 'bucket lower bound', 'Calibration'), fixture(0.9, 'bucket upper bound', 'Calibration'), fixture(5, 'cases', 'Bucket'), fixture(4, 'correct cases', 'Bucket')], caveats: ['Illustrative, not reproducible calibration evidence for a model.'] }),
  synthetic('S-EVAL-GATE', 'Two forbidden sufficient proposals are shown as withheld in the illustrative gate tests.', 'gate           2 FAILs on forbidden SUFFICIENT proposals -- both correctly withheld', p(2177), { numbers: [fixture(2, 'withheld proposals', 'Synthetic gate tests')] }),
  synthetic('S-EVAL-COST', 'Illustrative tiers show eight cases at approximately 0p, twelve at 0.1p and nine at 0.9p.', 'cost/case      Tier 0: 8 cases at ~0p | Tier 1: 12 at ~0.1p | Tier 2: 9 at ~0.9p (synthetic)', p(2178), { numbers: [fixture(8, 'cases', 'Tier 0'), fixture(12, 'cases', 'Tier 1'), fixture(9, 'cases', 'Tier 2'), fixture(0, 'pence/case', 'Tier 0', true), fixture(0.1, 'pence/case', 'Tier 1', true), fixture(0.9, 'pence/case', 'Tier 2', true)], status: 'withheld', caveats: ['Counts sum to 29 for a 20-case set. Possibly cumulative cascade counts; not mutually exclusive shares. Free-cost interpretation excludes infrastructure and support.'] }),
  synthetic('S-EVAL-MISSES', 'The assertion that all three misses are NCSO partial dates contradicts the category table.', 'the 3 misses   all NCSO with partial dates', p(2179), { status: 'contradictory', numbers: [fixture(3, 'claimed misses', 'NCSO partial dates')], relatedClaimIds: ['S-EVAL-CATEGORY'], caveats: ['Withheld from display; category table has one miss in each of NCSO, specials and OOP.'] }),
  synthetic('S-CORPUS', 'The prototype corpus is illustrated as two versions with approximately six clauses each.', 'Azure AI Search index with 2 versions x ~6 clauses', p(2199), { numbers: [fixture(2, 'versions', 'Prototype corpus'), fixture(6, 'clauses/version', 'Prototype corpus', true)], caveats: ['P2076 also describes 4-6 clauses; these are design fixtures, not actual Tariff coverage.'] }),
  synthetic('S-MEDICINE', 'The Annex fixture uses amoxicillin suspension 125mg/5ml, 125mg TDS and 100ml supply.', 'Amoxicillin oral suspension 125mg/5ml sugar-free, 125mg TDS, supply 100ml', p(3025), { scope: 'out-of-scope', numbers: [fixture(125, 'mg / 5 ml', 'Illustrative concentration'), fixture(125, 'mg/dose', 'Illustrative dose'), fixture(3, 'doses/day (TDS)', 'Illustrative schedule'), fixture(100, 'ml', 'Illustrative supply')], caveats: ['Source fixture only, not clinical advice or a new application medicine fixture.'] }),
  synthetic('S-QUANTITY-ERROR', 'The asserted consistency of 100ml with five days TDS at 5ml is erroneous.', 'quantity 100ml consistent with 5 days TDS at 5ml', p(3075), { scope: 'out-of-scope', status: 'withheld', numbers: [fixture(100, 'ml', 'Asserted quantity'), fixture(5, 'days', 'Illustrative duration'), fixture(5, 'ml/dose', 'Illustrative dose volume')], relatedClaimIds: ['S-QUANTITY-DERIVED'], caveats: ['Five times three times five is 75ml. A supplied-pack explanation is not given. Not clinical advice.'] }),
  derived('S-QUANTITY-DERIVED', 'The source fixture arithmetic gives 75ml, not 100ml.', 'quantity 100ml consistent with 5 days TDS at 5ml', p(3075), { scope: 'out-of-scope', formula: '5 * 3 * 5 = 75', inputClaimIds: ['S-MEDICINE', 'S-QUANTITY-ERROR'], numbers: [n(75, 'ml', 'Arithmetic on synthetic schedule', 'Five illustrative days', false, 'derived')], caveats: ['Fixture validation only, not clinical guidance or payment calculation.'] }),
  synthetic('S-FORM-COUNT', 'The specimen dispenser box contains one item and a partially smudged stamp.', 'Dispenser box: "1"', p(3028, 3029), { numbers: [fixture(1, 'item', 'Specimen dispenser box')], additionalExcerpts: [e('Pharmacy stamp: present, partially smudged', p(3029))] }),
  synthetic('S-NOTE', 'The demonstration note NCSO JB is initialled but undated.', '"NCSO  JB"', p(3027), { caveats: ['Invented endorsement, not a real claim. Date presence can be checked in code.'] }),
  synthetic('S-STATE-VOCABULARY', 'The queue’s PROPOSED: REQUEST wording survives despite the pack’s three-outcome restriction.', 'PROPOSED: REQUEST', p(2141), { status: 'contradictory', relatedClaimIds: ['D-OUTCOMES'], caveats: ['Source inconsistency only; existing application REQUEST_INFORMATION is not removed or renamed.'] }),
  synthetic('S-PERSONA', 'Priya is a synthetic operator persona.', 'Persona used throughout: Priya, an exception operator.', p(1561), { scope: 'out-of-scope', caveats: ['Fictional persona, not an NHSBSA employee.'] }),
  synthetic('S-PHARMACY-PERSONA', 'Sam is the pharmacy persona in the source’s electronic-entry narrative.', 'Sam types the endorsement into a field in the dispensing system', p(3137), { scope: 'out-of-scope', caveats: ['Fictional persona; the associated 95% channel split is assumed.'] }),
  synthetic('S-PHARMACY-TIME', 'Fifteen-second correction and sub-second re-check are illustrative timings.', 'Tier 0 rule on the corrected string, no read, no model, under a second', p(3150, 3151), { numbers: [fixture(1, 'seconds upper bound', 'Re-check'), fixture(15, 'seconds', 'Correction')], additionalExcerpts: [e('Fifteen seconds, at the counter', p(3151))], caveats: ['Not measured speed or evidence the item never reaches a queue or is paid on time.'] }),
  design('D-PHARMACY-STATES', 'The source proposes WILL PRICE, NEEDS ATTENTION and CAN’T TELL; payment-guaranteeing wording is withheld.', 'Three states: WILL PRICE · NEEDS ATTENTION · CAN’T TELL', p(3147), { status: 'withheld', relatedClaimIds: ['D-ADVISORY'], caveats: ['WILL PRICE overclaims: endorsement sufficiency does not guarantee claim acceptance, pricing or payment.'] }),
  synthetic('S-HYPOTHETICAL-CALIBRATION', 'The source uses 80% correctness at 0.8 confidence to explain calibration, not report it.', 'does 0.8 mean right 80% of the time.', p(2670), { numbers: [fixture(0.8, 'confidence', 'Hypothetical calibration'), fixture(80, 'percent correct', 'Hypothetical calibration')], caveats: ['Conceptual example, not demonstrated calibration.'] }),
  synthetic('S-HYPOTHETICAL-ABSTENTION', 'The preference to abstain on 15% of handwritten forms is hypothetical, not a target or result.', 'I’d rather abstain on 15% of handwritten forms than guess on all of them.', p(3190), { numbers: [fixture(15, 'percent', 'Hypothetical handwritten-form abstention')], scope: 'out-of-scope' }),
]

/** Implementation mapping only, not an extra documentary source or a case mutation. */
export const CASE_SOURCE_MAPPING = [
  { sourceClaimId: 'S-CASE-A', packCase: 'A', canonicalCase: 'E', canonicalCaseId: 'EX-24101', relation: 'same deterministic-clearance behaviour' },
  { sourceClaimId: 'S-CASE-B', packCase: 'B', canonicalCase: null, canonicalCaseId: null, relation: 'no exact counterpart; absent endorsement differs from undated endorsement' },
  { sourceClaimId: 'S-CASE-C', packCase: 'C', canonicalCase: 'B', canonicalCaseId: 'EX-24112', relation: 'undated endorsement only; source ledger mismatch is not copied' },
  { sourceClaimId: 'S-CASE-D', packCase: 'D', canonicalCase: 'D', canonicalCaseId: 'EX-24123', relation: 'deliberate abstention behaviour' },
  { sourceClaimId: 'S-CASE-E', packCase: 'E', canonicalCase: 'B', canonicalCaseId: 'EX-24112', relation: 'counterfactual July/August replay only' },
] as const

const proposed = (value: number, unit: string, population: string, approximate = false) => n(value, unit, population, 'Proposed delivery or evaluation', approximate, 'proposed')
const deliveryClaims: SourceClaim[] = [
  design('DEL01', 'Weeks 1-2 test the premise with two years of data and 3-5 operators observed for a day each.', '2 years of exception data; 3–5 operators for a day each; IG contact; Tariff source', p(1741, 1747), { numbers: [proposed(1, 'start week', 'Prove or kill'), proposed(2, 'end week', 'Prove or kill'), proposed(2, 'years', 'Exception history'), proposed(3, 'operators lower bound', 'Observation'), proposed(5, 'operators upper bound', 'Observation'), proposed(1, 'day/operator', 'Observation')], caveats: ['Conditional on data, access and governance; not a delivery commitment.'] }),
  design('DEL02', 'Weeks 3-4 establish approximately 200 stratified adjudicated cases and at least two corpus versions.', 'Golden set (~200, stratified); versioned corpus (2+ versions); labels agreed with experts; eval harness in CI', p(1748, 1754), { numbers: [proposed(3, 'start week', 'Ground truth'), proposed(4, 'end week', 'Ground truth'), proposed(200, 'adjudicated cases', 'Planned real evaluation', true), proposed(2, 'versions minimum', 'Corpus')], caveats: ['Distinct from the twenty synthetic evaluation cases.'] }),
  design('DEL03', 'Weeks 5-6 build one-pattern read-only end-to-end validation.', 'One exception pattern end to end: retrieval, evidence, gate, recommendation, record, operator UI', p(1755, 1761), { numbers: [proposed(5, 'start week', 'Walking skeleton'), proposed(6, 'end week', 'Walking skeleton'), proposed(1, 'pattern', 'Initial implementation')] }),
  design('DEL04', 'Weeks 7-10 run shadow proposals without payment influence.', 'Proposals generated with zero influence; comparison to operator decisions; calibration; abstention; per-slice failures; cost', p(1762, 1768), { numbers: [proposed(7, 'start week', 'Shadow mode'), proposed(10, 'end week', 'Shadow mode'), proposed(0, 'payment influence', 'Shadow-mode boundary')] }),
  design('DEL05', 'Weeks 11-13 use assisted mode with human decisions and measured guardrails.', 'Recommendations surfaced; human decides; handling time, overrides, trust, accuracy guardrails, repeat-referral rate measured', p(1769, 1775), { numbers: [proposed(11, 'start week', 'Assisted mode'), proposed(13, 'end week', 'Assisted mode')] }),
  design('DEL06', 'Week 14 produces a go, reshape or stop decision.', 'Evidence pack; go / reshape / stop recommendation; next pattern selected', p(1776, 1782), { numbers: [proposed(14, 'week', 'Scale decision')], caveats: ['Four-week and thirteen-week statements elsewhere require scope reconciliation.'] }),
  design('DEL07', 'The source proposes a five-day prototype build, including a 120-second recording and rehearsal.', 'Day 5: break it on purpose (Case D), fix what breaks unintentionally, record the 120-second pitch, rehearse.', p(2033, 2037), { scope: 'out-of-scope', numbers: [proposed(5, 'days', 'Prototype plan'), proposed(120, 'seconds', 'Recording'), proposed(2, 'rehearsals', 'Walkthrough')], additionalExcerpts: [e('rehearse the walkthrough twice', p(2277))], caveats: ['Plan and rehearsal material, not proof of completed work.'] }),
  design('DEL08', 'Prototype targets include live cases under ten seconds and UI actions under one second.', 'Live run under 10s per case', p(2278), { additionalExcerpts: [e('Operable live in under a second per action', p(2224))], scope: 'out-of-scope', numbers: [proposed(10, 'seconds/case upper bound', 'Prototype latency'), proposed(1, 'seconds/action upper bound', 'Prototype UI')], caveats: ['Targets, not measurements.'] }),
  design('DEL09', 'The pack proposes a ten-minute demonstration, thirty-to-forty-minute discussion and first fifteen minutes of discovery.', 'The session is a ten-minute demonstration followed by thirty to forty minutes of discussion.', p(1949), { scope: 'out-of-scope', numbers: [proposed(10, 'minutes', 'Demonstration'), proposed(30, 'minutes lower bound', 'Discussion'), proposed(40, 'minutes upper bound', 'Discussion'), proposed(15, 'minutes', 'Discovery')] }),
  design('DEL10', 'The scripted beat boundaries run from 0:00 to 10:00; case demonstrations start at 2:40, 3:10, 5:10 and 6:30.', '0:00 to 0:40', p(2328), { scope: 'out-of-scope', additionalExcerpts: [e('0:40 to 1:50', p(2332)), e('1:50 to 2:40', p(2336)), e('2:40 to 7:10', p(2340)), e('3:10  Case C.', p(2343)), e('5:10  Case D.', p(2347)), e('6:30  Case E.', p(2350)), e('7:10 to 8:20', p(2356)), e('8:20 to 9:20', p(2360)), e('9:20 to 10:00', p(2362))], numbers: [0, 40, 110, 160, 190, 310, 390, 430, 500, 560, 600].map(value => proposed(value, 'seconds from start', 'Scripted beat/case boundary')), caveats: ['Rehearsal timing only, not a current UI requirement.'] }),
  design('DEL11', 'Corpus/drift checks and fail-open drills are monthly; unaided operator samples are quarterly.', 'fail-open verified monthly', p(1438), { additionalExcerpts: [e('run a quarterly unaided sample', p(2613)), e('re-baselined monthly with the Tariff', p(2682))], numbers: [proposed(1, 'month interval', 'Corpus/drift/continuity checks'), proposed(3, 'months interval', 'Unaided operator sample')] }),
  synthetic('DEL12', 'Eighteen-month reconstruction is a hypothetical audit example, not a retention policy.', 'Eighteen months from now I can show you which version decided this.', p(2324), { scope: 'out-of-scope', numbers: [fixture(18, 'months later', 'Hypothetical reconstruction')] }),
  validate('DEL13', 'Four-week deployment and a thirteen-week sequence conflict in scope with the full fourteen-week plan.', 'One exception pattern, shadow mode, a handful of volunteer operators, four weeks', p(2618), { additionalExcerpts: [e('The 13-week sequence with exit and stop conditions.', p(2736))], status: 'contradictory', numbers: [proposed(4, 'weeks', 'Smallest deployment assertion'), proposed(13, 'weeks', 'Rehearsal sequence assertion')], relatedClaimIds: ['DEL06'], caveats: ['Do not promise any timeline before scope, access and approval are agreed.'] }),
  design('DEL14', 'Groundedness of 100% and zero unsupported recommendations or incidents are design objectives.', '100%, any unsupported recommendation is withheld', p(1802), { additionalExcerpts: [e('Unsupported-recommendation rate; incidents', p(1877)), e('Zero', p(1878))], numbers: [proposed(100, 'percent', 'Groundedness objective'), proposed(0, 'unsupported recommendations/incidents', 'Safety objective')], caveats: ['Not observed results; citation resolution alone does not prove groundedness.'] }),
  assumption('EST19', 'An hour of operator training is an unvalidated effort estimate.', 'An hour with the people who helped build it, and the runbook.', p(2615), { scope: 'out-of-scope', numbers: [n(1, 'hour', 'Operator training estimate', 'Unvalidated estimate', false, 'assumed')] }),
  assumption('EST20', 'A metadata-only fallback may remain useful, but must be tested.', 'A metadata-only design, in which the model sees codes, structured fields and the provision but never the image or free text, can carry part of the judgement.', p(2643), { validation: 'Test utility without identity, images or free text; stop if inadequate under IG constraints.' }),
  assumption('EST21', 'Payment administration as a lawful processing route is only the author’s working assumption.', 'Processing for payment administration rather than direct care is my working assumption', p(2594), { validation: 'Legal and IG assessment of lawful basis and the DPIA before exposure; a DPIA does not itself supply legal authority.' }),
  design('D-INJECTION', 'Endorsement text is untrusted data, not an instruction to the model or gate.', 'The judge treats endorsement text as data inside a schema, not as instruction', p(2598), { caveats: ['Prompt injection remains a risk; structured output and human review do not guarantee harmlessness.'] }),
  design('D-FOUR-USERS', 'The pack describes operator, pharmacy, assurance and support flows.', 'Four people meet this system and each needs a different thing from it.', p(1559), { numbers: [proposed(4, 'user flows', 'Operator, pharmacy, assurance, support')], caveats: ['Source personas and flows, not observed NHSBSA user research.'] }),
  design('D-PROTOTYPE-GAPS', 'The pack acknowledges no real capture, live queue, authentication, monitoring or cost measurement at volume.', 'No real capture integration; no live queue; no authentication; no monitoring.', p(2061, 2066), { additionalExcerpts: [e('Confidence thresholds set by hand, not calibrated on outcomes.', p(2065)), e('No cost measurement at volume.', p(2066))], caveats: ['Source prototype description, not verification of the workspace’s implementation.'] }),
  synthetic('S-PROTOTYPE-SHAPE', 'The source specifies five cases, three screens, five screen regions, five mocked tools and three prompts.', 'Five cases. One deliberately broken.', p(1953), { additionalExcerpts: [e('Three screens. That is all.', p(2132)), e('Screen design: one screen, five regions', p(1959)), e('Orchestrator; five tools; three prompts with JSON schema', p(2269))], numbers: [fixture(5, 'cases', 'Pack prototype'), fixture(3, 'screens', 'Pack prototype'), fixture(5, 'regions', 'Case screen'), fixture(5, 'tools', 'Mocked orchestration'), fixture(3, 'prompts', 'Planner/judge/explainer')], caveats: ['Source design fixture, not a mandate to replace the app’s six canonical cases.'] }),
  synthetic('S-FXXXX', 'FXXXX is an invented contractor placeholder in the first screen.', 'contractor FXXXX', p(1961), { caveats: ['Not a real contractor code and not a replacement application fixture.'] }),
  synthetic('S-CORPUS-RANGE', 'Another corpus specification gives four to six clauses per version.', 'Two Tariff versions; 4–6 clauses each incl. Part II Cl.9; effective dates; IDs', p(2076), { numbers: [fixture(4, 'clauses/version lower bound', 'Prototype corpus'), fixture(6, 'clauses/version upper bound', 'Prototype corpus')], relatedClaimIds: ['S-CORPUS'] }),
]

const peripheralClaims: SourceClaim[] = [
  validate('ALT01', 'The motor-finance/FCA alternative asserts 12.1 million agreements, £9.1 billion and a July tribunal change without a specific citation.', '12.1m agreements to adjudicate; £9.1bn total bill; rules changed by tribunal in July', p(3376, 3378), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(12_100_000, 'agreements', 'FCA motor-finance redress assertion'), n(9_100_000_000, 'GBP', 'Asserted redress bill')], caveats: ['No independent verification; July year unspecified; not NHSBSA tour material.'] }),
  validate('ALT02', 'The APP fraud alternative asserts 269,000 annual claims, a five-day statutory clock and a 50/50 bank cost split.', '269,000 claims a year; five-day statutory clock; 50/50 cost split between banks', p(3379, 3381), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(269_000, 'claims/year', 'APP fraud reimbursement', 'Annual; year unspecified'), n(5, 'days', 'Asserted statutory clock'), n(50, 'percent per bank', 'Asserted cost split')] }),
  validate('ALT03', 'The bank/MLRO AML alternative asserts an industry-wide 85-95% false-positive range.', '85–95% false positives across the industry', p(3382, 3384), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(85, 'percent lower bound', 'AML false positives'), n(95, 'percent upper bound', 'AML false positives')] }),
  validate('ALT04', 'The Formula 1 alternative asserts a $215 million cap and a procedural breach in 2024.', '$215m cap; continuous classification; a procedural breach in 2024', p(3385, 3387), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(215_000_000, 'USD', 'Asserted Formula 1 cap', 'Cap year unspecified'), n(2024, 'calendar year', 'Asserted procedural breach', '2024')] }),
  validate('ALT05', 'The housing-association alternative asserts Awaab’s Law hazard clocks from October 2025.', 'Statutory clocks on hazard reports since October 2025', p(3388, 3390), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(2025, 'calendar year', 'Asserted statutory-clock commencement', 'October 2025')] }),
  validate('ALT06', 'The Delay Repay alternative asserts 1.9 million quarterly claims and £80 million-plus unclaimed.', '1.9m claims a quarter; £80m+ unclaimed', p(3391, 3393), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], numbers: [n(1_900_000, 'claims/quarter', 'Delay Repay assertion', 'Quarter unspecified'), n(80_000_000, 'GBP lower bound', 'Unclaimed amount assertion')] }),
  validate('ALT07', 'The waiting-list alternative asserts 7.27 million pathways, approximately 6.15 million patients and over 200 trusts.', '7.27m pathways, ~6.15m patients', p(3394, 3396), { scope: 'out-of-scope', namedSourceIds: ['pack-uncited'], additionalExcerpts: [e('200+ trusts with different systems', p(3396))], numbers: [n(7_270_000, 'pathways', 'Waiting-list assertion'), n(6_150_000, 'patients', 'Waiting-list assertion', 'Unspecified', true), n(200, 'trusts lower bound', 'Waiting-list systems')] }),
  assumption('ALT08', 'Market assertions about redress providers, AML vendors and an absent NHSBSA offering are unsupported.', 'Nobody is offering NHSBSA a governed judgement layer for prescription exceptions', p(3406), { scope: 'out-of-scope', additionalExcerpts: [e('Accenture is very likely delivering redress programmes for lenders now', p(3378)), e('every vendor has a product', p(3384)), e('No vendor will build a Drug Tariff endorsement judge', p(3443))], caveats: ['No market study or vendor verification in the two supplied sources.'] }),
  assumption('ALT09', 'Fifty bank vendors and banks being able to absorb errors are rhetorical comparisons, not established market facts.', 'A bank would pay for a fraud model tomorrow and has fifty vendors offering one.', p(3406), { scope: 'out-of-scope', numbers: [n(50, 'vendors', 'Rhetorical bank comparison', 'Unspecified', false, 'assumed')], caveats: ['Do not imply banks tolerate errors or that NHSBSA cannot suffer harmful model influence.'] }),
  assumption('ALT10', 'Conventional quarter-long discovery and month-five viability are unsupported comparisons.', 'A conventional delivery would spend a quarter on discovery', p(3444), { scope: 'out-of-scope', numbers: [n(3, 'months', 'Asserted conventional discovery', 'Rhetorical comparison', false, 'assumed'), n(5, 'month', 'Asserted viability discovery', 'Rhetorical comparison', false, 'assumed')], caveats: ['Not benchmarked against actual programmes.'] }),
  design('ALT11', 'Two or three adapters per later deployment is a proposed reuse estimate.', 'Each new deployment is a rule corpus, two or three adapters and a golden set.', p(1945), { scope: 'out-of-scope', numbers: [proposed(2, 'adapters lower bound', 'Reuse estimate'), proposed(3, 'adapters upper bound', 'Reuse estimate')], caveats: ['Reusability needs evidence from additional deployments.'] }),
  assumption('ALT12', 'Organisation selection reflects author judgements about novelty, evidence, clinical proximity and assumptions.', 'the assumption load is heaviest', p(3387), { scope: 'out-of-scope', caveats: ['Selection rationale is not an independently validated ranking of use cases.'] }),
  synthetic('ALT13', 'Twenty clients is a hypothetical scaling discussion, not a demonstrated rollout.', 'Twenty clients?', p(2469), { scope: 'out-of-scope', numbers: [fixture(20, 'clients', 'Hypothetical scale-up discussion')], caveats: ['No evidence of deployments or economies of scale.'] }),
  design('DOC-FOOTER', 'The extracted footer identifies complete pack version 5.', 'NHSBSA: the complete pack behind the one-pager (v5)', { documentId: 'pack', part: 'word/footer1.xml', paragraphStart: 1, paragraphEnd: 1 }, { scope: 'out-of-scope', numbers: [proposed(5, 'document version', 'Pack footer')], caveats: ['Footer numbering is separate from the main document paragraphs.'] }),
]

/**
 * Test-only audit export. All construction, including helper calls, is inside
 * this pure initializer so an unused export is removed as a whole by Vite.
 * Never reference it from client data, lookups or coverage. Production asset
 * tests enforce removal; a UI filter is not a delivery/privacy boundary.
 */
export const SOURCE_AUDIT_EXCLUSIONS: readonly SourceClaim[] = /* @__PURE__ */ (() => freezeDeep([
  validate('PERSONAL01', 'The pack identifies its author and interview context; excluded from public tour copy.', 'ACCENTURE  ·  FORWARD DEPLOYED AI ENGINEER  ·  FINAL ROUND', p(1, 9), { scope: 'excluded-personal', status: 'withheld', additionalExcerpts: [e('William Ng', p(7))], caveats: ['Personal interview context is not public UI content or verified employment history.'] }),
  validate('PERSONAL02', 'The author’s employer-relationship disclosure is source-only and excluded from public copy.', 'Anchored to a public body my employer holds sector relationships with, so built entirely from public sources', p(19), { scope: 'excluded-personal', status: 'withheld', caveats: ['Do not expose author employment or customer relationships in the tour.'] }),
  validate('PERSONAL03', 'The pack’s panel preferences and mission framing are unverified interview statements.', 'The panel has said', p(47), { scope: 'excluded-personal', status: 'withheld', caveats: ['Private interview framing is not public-facing product evidence.'] }),
  validate('PERSONAL04', 'The author’s claimed comparable production experience is not independently verified.', 'The shape of the problem is one I have already built in production.', p(3403), { scope: 'excluded-personal', status: 'withheld', caveats: ['Exclude author career details from UI.'] }),
  validate('PERSONAL05', 'Statements about AI scaffolding and manually tested controls are author claims, not implementation evidence.', 'I used AI tools to scaffold the orchestrator, draft the three prompts, and generate the synthetic cases.', p(2068), { scope: 'excluded-personal', status: 'withheld', caveats: ['Do not treat rehearsal wording as proof that a build or test run exists.'] }),
  validate('PERSONAL06', 'The pack asserts an 8 September edit and twenty-five added questions.', 'The one-pager (the version edited on 8 September)', p(3611), { scope: 'excluded-personal', status: 'withheld', additionalExcerpts: [e('Twenty-five questions added', p(3725))], numbers: [n(8, 'day of September', 'Asserted edit date', 'Year unspecified'), n(25, 'questions', 'Asserted additions', 'Version-history assertion')], caveats: ['Historical authoring claim, not a reliable reconciliation of the supplied PDF.'] }),
]))()

const contradictionRows: readonly DesignRow[] = [
  ['X01', 'The pack converts item counts into document/payment-instruction counts without evidence.', 'An organisation processes about 1.1 billion documents a year.', 2334, 2334, 'Use O02 items; N08 says forms can carry multiple items.'],
  ['X02', 'Achieved 99.85% pricing accuracy is not established by the source targets.', 'of the items we process, 99.85% are priced correctly.', 3463, 3463, 'Use distinct PPIA/PPPA/ACV targets; do not claim measured achievement.'],
  ['X03', 'Claims that reading failures never enter the queue contradict published routing.', 'The queue does not exist because the scanner failed.', 243, 243, 'O20 explicitly includes low-confidence reads and handwritten items.'],
  ['X04', 'The assertion that the judgement step is untouched by every improvement is unsupported.', 'The judgement step is untouched by scanning, pricing or workflow improvements', 627, 627, 'Existing tooling and improvement history require customer validation.'],
  ['X05', 'Scanning every prescription item is not established; electronic items and physical forms differ.', 'They DO scan everything.', 3607, 3607, 'O25 and N10 distinguish electronic claims and paper; no new copilot scan does not preclude recapture on resubmission.'],
  ['X06', 'Guaranteed elimination of second referrals is unsupported.', 'so this form does not bounce a second time.', 3128, 3128, 'H07 is a repeat-referral hypothesis, not a guarantee even for the same reason.'],
  ['X07', 'The same shared kernel cannot guarantee the two ends never disagree.', 'the two ends can never disagree.', 3143, 3143, 'Inputs, versions and stochastic output can differ.'],
  ['X08', 'Monthly publication does not establish monthly recoding, retraining or the impossibility of deterministic alternatives.', 'the rules must be re-coded, re-tested and re-released every month', 255, 255, 'A07 requires actual endorsement-change analysis.'],
  ['X09', 'The assertion that no rule change requires code changes conflicts with encoded requirements and gate rules.', 'nothing is re-coded.', 269, 269, 'Some changes require controls, schemas and code as well as corpus updates.'],
  ['X10', 'The gate is both listed as an agent tool and described as inaccessible to the agent.', 'run_compliance_gate', 1984, 1984, 'P1071 says the agent cannot call, alter or bypass it; resolve the registry without weakening the gate.'],
  ['X11', 'Preventing forbidden display is not preventing the model from proposing forbidden output.', 'Model cannot propose the forbidden', 1482, 1482, 'Gate tests deliberately include rejected proposals; D-GATE is the safe interpretation.'],
  ['X12', 'Cascade wording that models settle cases conflicts with the human-decision boundary.', 'settles obvious cases in both directions', 1026, 1026, 'All consequential decisions stay human; rules-based existing clearance is distinct.'],
  ['X13', 'Unanimous versus threshold-based sample policies are inconsistent.', 'If the three judgements disagree, it abstains.', 315, 315, 'P1475 lowers confidence and abstains below threshold instead; choose explicit policy.'],
  ['X14', 'Showing a recommendation first conflicts with the pack’s evidence-first safety instruction.', 'RECOMMENDATION   REFER BACK', 2148, 2148, 'P2613 says evidence and confidence before recommendation. No UI changes in this task.'],
  ['X15', 'A permitted exemption boolean and a blanket prohibition on exemption detail need reconciliation.', 'Never patient identity, exemption detail or anything not needed', 2596, 2596, 'P1343/P3361 allow a boolean only where necessary; confirm minimisation with IG.'],
  ['X16', 'Forever-pinned records and TTL off do not override a retention policy.', 'Decisions made under a prior version remain pinned to it forever.', 1362, 1362, 'P3328 ties record retention to policy; immutable provenance is not indefinite retention.'],
  ['X17', 'The anatomy’s prescribing-date rule conflicts with dispensing-date version filtering.', 'Governs which Tariff version applies and prescription validity.', 2970, 2970, 'Resolve governing-date semantics; do not conflate six distinct date concepts.'],
  ['X18', 'Arbitrary same-date version switching is counterfactual testing, not historical governing-rule selection.', 'Same item, two versions, two recommendations', 2351, 2351, 'Label synthetic replay explicitly; actual retrieval must respect validated effective dates.'],
  ['X19', 'Citation or fact-ID membership alone cannot prove semantic groundedness.', 'Every recommendation carries citations that resolve to the corpus and evidence IDs that resolve to sources', 2569, 2569, 'A retrieved passage or mapped fact may not entail the sentence or recommendation.'],
  ['X20', 'Human review and no direct pricing do not guarantee no harmful payment influence.', 'Structurally no. It never prices, never disposes, and fails open.', 2579, 2579, 'The pack itself names automation bias and wrong-payment harms in P1524-P1543.'],
  ['X21', 'Zero-cost and no-new-funding claims are unsupported.', 'Two weeks with exception-reason data costs nothing', 3453, 3453, 'D-VALUE includes implementation, integration, inference, support and change costs.'],
  ['X22', 'No-history kill wording conflicts with a slower relabelling route.', 'No reliable item-level history, so no credible evaluation set.', 2633, 2633, 'P0771 and PDF-A05 permit labelling from scratch; reshape unless infeasible.'],
  ['X23', 'No pharmacy output submitted conflicts with validation metadata travelling downstream.', 'Nothing it produces is submitted.', 2920, 2920, 'P3159 allows an advisory flag; distinguish capture replacement from optional validation metadata.'],
  ['X24', 'Claims of a completed prototype are not proved by build specifications and rehearsal scripts.', 'What to implement, mock, stub, and leave unbuilt', 2023, 2023, 'No code execution or implementation history can be verified from these documents alone.'],
  ['X25', 'Annex 7 incorrectly calls the PDF questions six and word-for-word identical to the pack.', 'Six questions for the first fifteen minutes', 3664, 3666, 'The supplied PDF has seven questions and five distinct assumptions; preserve both lists.'],
  ['X26', 'Annex 7’s naming and principle corrections are stale for the supplied PDF.', 'The headline currently reads Service.', 3681, 3682, 'PDF already says Business Services Authority, NHSBSA and validates and calculates.'],
  ['X27', 'Annex 7’s claim that the pharmacy benefit is absent is stale.', 'The page no longer states what pharmacies gain', 3678, 3678, 'The supplied PDF ends with a separate pharmacy-benefit statement.'],
  ['X28', 'The prescribed first-ten-second synthetic disclosure is not demonstrated by the script.', 'Synthetic throughout, and said so in the first ten seconds.', 1953, 1953, 'P2344 only scripts explicit synthetic disclosure in the 3:10 case beat; keep public disclosure immediate.'],
  ['X29', 'Section 16 and Section N references survive after consolidation.', 'Section 16 carries the design.', 2070, 2070, 'P3294 also refers to Section N; use current paragraph locators, not stale section names.'],
  ['X30', 'An unsupported one-fifth agentic fraction is explicitly superseded.', 'Roughly a fifth of the problem is agentic', 3693, 3695, 'No measured fraction of work is established.'],
  ['X31', 'Referral-caused closures, supply disruption and patient-access deterioration are not established.', 'A causal claim the public evidence does not establish', 3702, 3704, 'No tour copy may infer these causal consequences from survey pressures.'],
  ['X32', 'Refer is used for both operator escalation and pharmacy referral and must not silently merge the actions.', 'accept, amend, or refer with a reason', 313, 313, 'Keep recommendation outcome, human action and record state separate; preserve canonical app vocabulary.'],
]
const contradictionClaims = contradictionRows.map(([id, statement, quote, start, end, caveat]) => validate(id, statement, quote, p(start, end), {
  status: 'contradictory', caveats: [caveat, 'Unsafe source wording retained for audit only; withheld from UI.'],
}))

/** Deep freezing prevents a consumer from making withheld source text displayable. */
function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child)
    Object.freeze(value)
  }
  return value
}

/** Non-personal research registry, not the complete audit and not all UI eligible. */
export const SOURCE_CLAIMS: readonly SourceClaim[] = freezeDeep([
  ...organisationClaims, ...numericalClaims, ...assumptionClaims, ...estateClaims,
  ...hypothesisClaims, ...discoveryClaims, ...designClaims, ...failureClaims,
  ...technologyClaims, ...anatomyClaims, ...syntheticClaims, ...deliveryClaims,
  ...peripheralClaims, ...contradictionClaims,
])
freezeDeep(SOURCE_DOCUMENTS)
freezeDeep(SOURCE_CLASSES)
freezeDeep(SOURCE_NAMES)
freezeDeep(CASE_SOURCE_MAPPING)
freezeDeep(PACK_ASSUMPTIONS)
freezeDeep(PACK_QUESTIONS)
const claimsById = new Map(SOURCE_CLAIMS.map(item => [item.id, item]))
export function getSourceClaim(id: string): SourceClaim | undefined { return claimsById.get(id) }

/** The disclosure lookup exposes only eligible provenance, never assertions or quotes. */
export interface DisplaySourceClaim {
  readonly id: string
  readonly classification: SourceClass
  readonly namedSourceIds: readonly NamedSourceId[]
  readonly locators: readonly SourceLocator[]
  readonly caveats: readonly string[]
}
export const SOURCE_DISPLAY_CLAIMS: readonly DisplaySourceClaim[] = freezeDeep(
  SOURCE_CLAIMS.filter(item => item.eligibleForDisplay && item.scope === 'tour' && item.status === 'qualified')
    .map(({ id, classification, namedSourceIds, excerpts, caveats }) => ({
      id, classification, namedSourceIds, locators: excerpts.map(({ locator }) => locator), caveats,
    })),
)
const displayClaimsById = new Map(SOURCE_DISPLAY_CLAIMS.map(item => [item.id, item]))
export function getDisplaySourceClaim(id: string): DisplaySourceClaim | undefined { return displayClaimsById.get(id) }

export interface TourChapter {
  readonly chapter: 1 | 3 | 4 | 6
  readonly title: string
  readonly prose: string
  readonly claimIds: readonly string[]
}
/**
 * UI contract: render only these curated fields, never raw registry excerpts.
 * Each chapter's title + prose is <=40 words. Key figures and disclosures are
 * separately labelled data. The seven-question disclosure is explicitly exempt.
 */
export const TOUR_CONTENT = freezeDeep({
  chapters: [
    { chapter: 1, title: 'The referred-back subset', prose: 'The documents describe existing prescription automation and approximately 85,000 referred-back items monthly. This is not the whole operator queue. The 99.85% figure is a target, not measured achievement.', claimIds: ['O02', 'O18', 'O19', 'O20', 'O23', 'O24', 'O36', 'O37', 'N01'] },
    { chapter: 3, title: 'Test the manual baseline', prose: 'Evidence assembly, operator disagreement and existing screens need customer validation. Compare a pre-fetched screen and deterministic checks before attributing any benefit to model interpretation.', claimIds: ['A03', 'A04', 'A05', 'A10', 'D-PREFETCH', 'D-PLUMBING', 'A06'] },
    { chapter: 4, title: 'A bounded proposal', prose: 'The agent gathers evidence and recommends. Code validates and calculates; a human decides. Missing evidence can require abstention. The prototype does not calculate or approve payments.', claimIds: ['D-BOUNDARY', 'D-GATE', 'D-CITATION', 'D-RECONCILE', 'S-ALL', 'S-CASE-D'] },
    { chapter: 6, title: 'Decide on evidence', prose: 'Test whether assembly reduces handling and repeat work while holding accuracy guardrails. Keep pharmacy benefits separate. Agree thresholds to proceed, reshape or stop before assisted use.', claimIds: ['H06', 'H07', 'H12', 'H13', 'D-VALUE', 'D-STOP', 'D-BASELINE'] },
  ] satisfies readonly TourChapter[],
  keyFigures: [
    { id: 'annual-items', value: 'Approximately 1.1 billion', label: 'Primary-care items per year in England', claimIds: ['O02'], qualifier: 'Items, not physical forms; annual year unspecified.' },
    { id: 'monthly-referrals', value: 'Approximately 85,000', label: 'Referred-back items per month', claimIds: ['O23', 'O24', 'N01'], qualifier: 'Source approximation for the 2024/25 referral subset. One million divided by twelve is approximately 83,333, not exactly 85,000.' },
    { id: 'accuracy-target', value: '99.85%', label: 'Stated PPIA and PPPA target', claimIds: ['O36', 'O37'], qualifier: 'Target, not achieved performance or an allowed count of wrong payments.' },
  ],
  disclosures: [
    { id: 'source-boundary', text: 'Only two supplied documents support this narrative. Their public-source attributions have not been independently verified.', claimIds: ['O02', 'O23', 'O36'] },
    { id: 'synthetic', text: 'Cases, outcomes, timings and evaluation figures are synthetic demonstrations, not NHSBSA operational measurements.', claimIds: ['S-ALL'] },
    { id: 'conditional-value', text: 'Current workflow assumptions and proposed benefits require customer validation. No savings or payment outcomes are guaranteed.', claimIds: ['A03', 'A04', 'A13', 'H06', 'H07', 'H13', 'D-ADVISORY'] },
  ],
  questionsDisclosure: {
    title: 'Seven questions from the supplied PDF',
    exemptFromChapterWordLimit: true,
    text: 'Questions reproduce the PDF with layout whitespace normalised. References to the build describe synthetic examples, not measured operations. The pack has a separate six-question list.',
    questions: PDF_QUESTIONS,
  },
  assumptionsDisclosure: {
    title: 'Five assumptions from the supplied PDF',
    text: 'These are assumptions, not established current-state facts. The pack has six different principal assumptions.',
    assumptions: PDF_ASSUMPTIONS.map(item => ({ text: item.text, validation: item.validation, ifWrong: item.ifWrong, claimIds: [item.id] })),
  },
})

/** Non-personal coverage only; test-only audit exclusions are deliberately not counted here. */
export const SOURCE_REGISTRY_COVERAGE = freezeDeep({
  claimCount: SOURCE_CLAIMS.length,
  displayEligibleCount: SOURCE_CLAIMS.filter(item => item.eligibleForDisplay).length,
  withheldOrContradictoryCount: SOURCE_CLAIMS.filter(item => item.status !== 'qualified').length,
  outOfScopeCount: SOURCE_CLAIMS.filter(item => item.scope === 'out-of-scope').length,
  organisationFamilies: 40,
  numericalInterpretationFamilies: 13,
  completeness: 'Non-personal consolidated research families only; separate test-only audit exclusions are not counted. This is not a claim of one row per sentence or every repeated numeric token.',
  limitations: [
    'No external publications, hyperlinks, model capabilities or actual NHSBSA estate/performance independently verified.',
    'Supplied document hashes are recorded, not recomputed from source binaries in this implementation.',
    'Text-extraction locators only; PDF layout, Word fields and specimen images were not separately inspected.',
    'Repeated wording is consolidated; exact quotations may contain source errors and are never automatically safe UI copy.',
    'Related implementation case IDs are metadata only, not documentary evidence or a change to canonical cases.',
  ],
})