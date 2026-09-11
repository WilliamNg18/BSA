import { describe, expect, it } from 'vitest'
import {
  CASE_SOURCE_MAPPING, getSourceClaim, getDisplaySourceClaim, PACK_ASSUMPTIONS, PACK_QUESTIONS,
  PDF_ASSUMPTIONS, PDF_QUESTIONS, SOURCE_CLAIMS, SOURCE_CLASSES,
  SOURCE_DOCUMENTS, SOURCE_NAMES, SOURCE_REGISTRY_COVERAGE, TOUR_CONTENT,
  SOURCE_AUDIT_EXCLUSIONS, SOURCE_DISPLAY_CLAIMS,
  type SourceClaim,
} from '../../data/reference/source-audit'
import { CASES } from '../../src/lib/domain/cases'

function required(id: string): SourceClaim {
  const item = getSourceClaim(id)
  expect(item, id).toBeDefined()
  if (!item) throw new Error(`Missing source claim: ${id}`)
  return item
}
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}
function references(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(references)
  if (!value || typeof value !== 'object') return []
  return Object.entries(value).flatMap(([key, child]) => key === 'claimIds' ? child as string[] : references(child))
}
const values = (id: string) => required(id).numbers.map(item => item.value)

describe('two-document source registry', () => {
  it('records exactly the two supplied documents and hashes, without external-fetch URLs', () => {
    expect(SOURCE_DOCUMENTS.map(item => item.id)).toEqual(['pdf', 'pack'])
    expect(SOURCE_DOCUMENTS.map(item => item.sha256)).toEqual([
      'f7db39a5a65f296379a1e7b66daab4825fa8820c4b4d813d34d62ebd7440e699',
      'c0c405e7420eb9da6c80b01f1167d24d750a98c3a74bb117a2e5fd81f4d6af43',
    ])
    expect(strings([SOURCE_DOCUMENTS, SOURCE_NAMES]).join(' ')).not.toMatch(/https?:\/\//)
    expect(SOURCE_DOCUMENTS[1].paragraphCount).toBe(3750)
  })

  it('exports all seven discriminated evidence classes without implying verification', () => {
    expect(Object.keys(SOURCE_CLASSES)).toHaveLength(7)
    expect(new Set(SOURCE_CLAIMS.map(item => item.classification))).toEqual(new Set(Object.keys(SOURCE_CLASSES)))
    for (const item of SOURCE_CLAIMS) {
      switch (item.classification) {
        case 'public-fact':
          expect(item.externallyVerified).toBe(false)
          expect(item.attributionOnly).toBe(true)
          break
        case 'derived':
          expect(item.formula.length, item.id).toBeGreaterThan(0)
          expect(item.inputClaimIds.length, item.id).toBeGreaterThan(0)
          item.inputClaimIds.forEach(required)
          break
        case 'reasoned-assumption':
        case 'requires-customer-validation': expect(item.validation.length).toBeGreaterThan(0); break
        case 'hypothesis': expect(item.test.length).toBeGreaterThan(0); break
        case 'design-decision': expect(item.implementedBySourceEvidence).toBe(false); break
        case 'synthetic': expect(item.operationalMeasurement).toBe(false); break
      }
    }
  })

  it('has unique stable identifiers and stable lookup object identity', () => {
    expect(new Set(SOURCE_CLAIMS.map(item => item.id)).size).toBe(SOURCE_CLAIMS.length)
    for (const item of SOURCE_CLAIMS) {
      expect(item.id).toMatch(/^[A-Z][A-Z0-9-]*$/)
      expect(getSourceClaim(item.id)).toBe(item)
    }
    expect(getSourceClaim('unknown')).toBeUndefined()
    expect(getSourceClaim('__proto__')).toBeUndefined()
    expect(getSourceClaim('constructor')).toBeUndefined()
  })

  it('requires non-empty statements, exact excerpts, locators, attribution and caveats for every entry', () => {
    for (const item of SOURCE_CLAIMS) {
      expect(item.statement.trim().length, item.id).toBeGreaterThan(0)
      expect(item.excerpts.length, item.id).toBeGreaterThan(0)
      expect(item.namedSourceIds.length, item.id).toBeGreaterThan(0)
      expect(item.caveats.length, item.id).toBeGreaterThan(0)
      item.namedSourceIds.forEach(id => expect(SOURCE_NAMES[id], `${item.id}: ${id}`).toBeDefined())
      item.relatedClaimIds.forEach(required)
      for (const excerpt of item.excerpts) {
        expect(excerpt.text.trim().length, item.id).toBeGreaterThan(0)
        const locator = excerpt.locator
        if (locator.documentId === 'pdf') {
          expect(locator.page).toBe(1)
          expect(locator.section.length).toBeGreaterThan(0)
        } else {
          expect(Number.isInteger(locator.paragraphStart)).toBe(true)
          expect(Number.isInteger(locator.paragraphEnd)).toBe(true)
          expect(locator.paragraphStart).toBeGreaterThanOrEqual(1)
          expect(locator.paragraphEnd).toBeGreaterThanOrEqual(locator.paragraphStart)
          expect(locator.paragraphEnd).toBeLessThanOrEqual(locator.part === 'word/footer1.xml' ? 1 : 3750)
        }
      }
    }
  })

  it('captures the full O01-O40, N01-N13, A01-A15 and H01-H18 consolidated families', () => {
    for (const [prefix, count] of [['O', 40], ['N', 13], ['A', 15], ['H', 18]] as const) {
      for (let index = 1; index <= count; index++) required(`${prefix}${String(index).padStart(2, '0')}`)
      expect(SOURCE_CLAIMS.filter(item => new RegExp(`^${prefix}\\d{2}$`).test(item.id))).toHaveLength(count)
    }
    expect(SOURCE_CLAIMS).toHaveLength(348)
    expect(SOURCE_CLAIMS.length + SOURCE_AUDIT_EXCLUSIONS.length).toBe(354)
    for (const prefix of ['EST', 'TECH', 'FORM', 'ALT', 'DEL', 'X']) {
      expect(SOURCE_CLAIMS.some(item => item.id.startsWith(prefix))).toBe(true)
    }
  })

  it('requires structured numeric units, period, population, approximation and meaning', () => {
    for (const item of SOURCE_CLAIMS) for (const number of item.numbers) {
      expect(Number.isFinite(number.value), item.id).toBe(true)
      expect(number.unit.trim().length, item.id).toBeGreaterThan(0)
      expect(number.period.trim().length, item.id).toBeGreaterThan(0)
      expect(number.population.trim().length, item.id).toBeGreaterThan(0)
      expect(typeof number.approximate).toBe('boolean')
      expect(['reported', 'target', 'derived', 'assumed', 'synthetic', 'proposed']).toContain(number.meaning)
    }
  })

  it('keeps the first three headline rules: items, approximate referred subset, accuracy target', () => {
    expect(values('O02')).toEqual([1_100_000_000])
    expect(required('O02').numbers[0]).toMatchObject({ approximate: true, unit: 'items/year' })
    expect(values('O23')).toEqual([1_000_000, 85_000])
    expect(required('O23').numbers.every(item => item.approximate && /subset/.test(item.population))).toBe(true)
    expect(required('O23').numbers.every(item => /2024\/25/.test(item.period))).toBe(true)
    expect(required('O24').statement).toMatch(/larger operator queue.*unknown/)
    for (const id of ['O36', 'O37', 'O39']) {
      expect(values(id)).toEqual([99.85])
      expect(required(id).numbers[0].meaning).toBe('target')
    }
    expect(values('O35')).toEqual([50_000])
    expect(values('O38')).toEqual([-0.2, 0.2])
  })

  it('does not silently equate a million divided by twelve to exactly 85,000', () => {
    expect(values('N01')[0]).toBeCloseTo(1_000_000 / 12, 8)
    expect(values('N01')[0]).not.toBe(85_000)
    expect(values('N02')).toEqual([1_020_000, 2])
    expect(values('N03')[0]).toBeCloseTo(0.0909090909, 8)
    expect(values('N04')[0]).toBeCloseTo(1_100_000_000 / 12, 6)
    expect(required('N05').eligibleForDisplay).toBe(false)
    expect(required('N05').caveats.join(' ')).toMatch(/tolerance/)
  })

  it('withholds the fee increase and retains the correct conversion without inventing another fee', () => {
    expect(required('O16')).toMatchObject({ status: 'withheld', eligibleForDisplay: false })
    expect(values('O16')).toEqual([152, 1.52])
    expect(values('N06')).toEqual([1.52, 0])
    expect(required('O16').relatedClaimIds).toContain('N06')
    expect(JSON.stringify(TOUR_CONTENT)).not.toMatch(/152p|£1\.52|fee increase/)
  })

  it('retains peripheral survey, funding and alternative figures without marketing them', () => {
    expect(values('O14')).toEqual([900_000_000])
    expect(values('O15')).toEqual([2_698_000_000, 3_073_000_000])
    expect(values('O40')).toEqual([75, 14, 99, 11, 42, 86])
    expect(values('ALT01')).toEqual([12_100_000, 9_100_000_000])
    expect(values('ALT02')).toEqual([269_000, 5, 50])
    expect(values('ALT03')).toEqual([85, 95])
    expect(values('ALT04')).toEqual([215_000_000, 2024])
    expect(values('ALT06')).toEqual([1_900_000, 80_000_000])
    expect(values('ALT07')).toEqual([7_270_000, 6_150_000, 200])
    for (const item of SOURCE_CLAIMS.filter(item => /^(ALT|TECH|FORM)/.test(item.id))) {
      expect(item.scope).toBe('out-of-scope')
      expect(item.eligibleForDisplay).toBe(false)
    }
  })

  it('preserves synthetic costs, evaluation denominators and arithmetic contradictions', () => {
    expect(values('S-TRACE')).toEqual([0.4, 1.1, 2.3, 0.01, 4, 3, 0.9])
    expect(values('S-EVAL')).toEqual([20, 17, 20, 3])
    expect(values('S-EVAL-COST')).toEqual([8, 12, 9, 0, 0.1, 0.9])
    expect(required('S-EVAL-MISSES').status).toBe('contradictory')
    expect(required('S-EVAL-MISSES').relatedClaimIds).toContain('S-EVAL-CATEGORY')
    expect(values('S-DIFFERENCE')).toEqual([50])
    expect(values('S-QUANTITY-DERIVED')).toEqual([75])
    expect(required('S-QUANTITY-ERROR').eligibleForDisplay).toBe(false)
    expect(required('S-QUALITY-FORMULA').eligibleForDisplay).toBe(false)
    expect(required('S-STATE-VOCABULARY').status).toBe('contradictory')
  })

  it('keeps the PDF five assumptions and seven questions distinct from the pack six/six', () => {
    expect(PDF_ASSUMPTIONS).toHaveLength(5)
    expect(PDF_QUESTIONS).toHaveLength(7)
    expect(PACK_ASSUMPTIONS).toHaveLength(6)
    expect(PACK_QUESTIONS).toHaveLength(6)
    expect(PDF_ASSUMPTIONS[1].text).toBe('Operators spend material time assembling evidence, not only judging.')
    expect(PDF_ASSUMPTIONS[3].numbers.map(item => item.value)).toEqual([50, 1])
    expect(PDF_ASSUMPTIONS[4].ifWrong).toBe('Label from scratch; slower, not fatal.')
    expect(PDF_QUESTIONS[0].text).toMatch(/^You have just seen the case assembled/)
    expect(PACK_QUESTIONS[0].text).toMatch(/^If this worked exactly as shown/)
    expect(PDF_QUESTIONS[6].text).toBe('What would you need to see before you trusted a recommendation like the one you just saw, and what in your own data would tell us to stop rather than scale?')
    for (const question of [...PDF_QUESTIONS, ...PACK_QUESTIONS]) {
      expect(required(question.id).excerpts[0].text).toBe(question.text)
    }
  })

  it('maps source letters through metadata without replacing six canonical cases', () => {
    expect(CASES.map(item => [item.scenario, item.id])).toEqual([
      ['A', 'EX-24107'], ['B', 'EX-24112'], ['C', 'EX-24119'],
      ['D', 'EX-24123'], ['E', 'EX-24101'], ['F', 'EX-24088'],
    ])
    expect(CASE_SOURCE_MAPPING.find(item => item.packCase === 'A')?.canonicalCase).toBe('E')
    expect(CASE_SOURCE_MAPPING.find(item => item.packCase === 'C')?.canonicalCase).toBe('B')
    expect(CASE_SOURCE_MAPPING.find(item => item.packCase === 'E')?.canonicalCase).toBe('B')
    expect(CASE_SOURCE_MAPPING.find(item => item.packCase === 'B')?.canonicalCaseId).toBeNull()
    CASE_SOURCE_MAPPING.forEach(item => {
      required(item.sourceClaimId)
      if (item.canonicalCaseId) expect(CASES.some(c => c.id === item.canonicalCaseId && c.scenario === item.canonicalCase)).toBe(true)
    })
  })

  it('does not display contradictory, withheld, peripheral or personal claims', () => {
    for (const item of SOURCE_CLAIMS) {
      expect(item.eligibleForDisplay).toBe(item.scope === 'tour' && item.status === 'qualified')
      if (item.status !== 'qualified' || item.scope === 'excluded-personal') expect(item.eligibleForDisplay).toBe(false)
    }
    expect(SOURCE_CLAIMS.filter(item => item.scope === 'excluded-personal')).toHaveLength(0)
    expect(JSON.stringify(TOUR_CONTENT)).not.toMatch(/William Ng|Accenture|employer|interview|final round|FXXXX|FA123|FB456|GPT-4o|Cosmos|Azure/i)
    for (const id of ['X01', 'X02', 'X06', 'X10', 'X20', 'X21', 'X25', 'D-PHARMACY-STATES']) {
      expect(required(id).eligibleForDisplay).toBe(false)
    }
  })

  it('provides only existing eligible references in the entire tour contract', () => {
    const ids = references(TOUR_CONTENT)
    expect(ids.length).toBeGreaterThan(30)
    for (const id of ids) expect(required(id), id).toMatchObject({ status: 'qualified', eligibleForDisplay: true })
    expect(TOUR_CONTENT.chapters.map(item => item.chapter)).toEqual([1, 3, 4, 6])
    expect(TOUR_CONTENT.keyFigures).toHaveLength(3)
  })

  it('retains six immutable audit families separately, unreachable from either client lookup', () => {
    expect(SOURCE_AUDIT_EXCLUSIONS.map(item => item.id)).toEqual([
      'PERSONAL01', 'PERSONAL02', 'PERSONAL03', 'PERSONAL04', 'PERSONAL05', 'PERSONAL06',
    ])
    expect(SOURCE_AUDIT_EXCLUSIONS.flatMap(item => item.excerpts)).toHaveLength(8)
    expect(Object.isFrozen(SOURCE_AUDIT_EXCLUSIONS)).toBe(true)
    for (const item of SOURCE_AUDIT_EXCLUSIONS) {
      expect(item).toMatchObject({ scope: 'excluded-personal', status: 'withheld', eligibleForDisplay: false })
      expect(Object.isFrozen(item)).toBe(true)
      expect(Object.isFrozen(item.excerpts[0].locator)).toBe(true)
      expect(item.statement.length).toBeGreaterThan(0)
      expect(item.caveats.length).toBeGreaterThan(0)
      for (const excerpt of item.excerpts) {
        expect(excerpt.text.trim().length).toBeGreaterThan(0)
        expect(excerpt.locator.documentId).toBe('pack')
        if (excerpt.locator.documentId === 'pack') {
          expect(excerpt.locator.paragraphStart).toBeGreaterThanOrEqual(1)
          expect(excerpt.locator.paragraphEnd).toBeGreaterThanOrEqual(excerpt.locator.paragraphStart)
          expect(excerpt.locator.paragraphEnd).toBeLessThanOrEqual(3750)
        }
      }
      expect(getSourceClaim(item.id)).toBeUndefined()
      expect(getDisplaySourceClaim(item.id)).toBeUndefined()
    }
  })

  it('exposes only eligible, stable, immutable provenance in the display registry', () => {
    expect(SOURCE_DISPLAY_CLAIMS.map(item => item.id)).toEqual(SOURCE_CLAIMS.filter(item => item.eligibleForDisplay).map(item => item.id))
    expect(Object.isFrozen(SOURCE_DISPLAY_CLAIMS)).toBe(true)
    for (const item of SOURCE_DISPLAY_CLAIMS) {
      expect(Object.keys(item).sort()).toEqual(['caveats', 'classification', 'id', 'locators', 'namedSourceIds'])
      expect(getDisplaySourceClaim(item.id)).toBe(item)
      expect(Object.isFrozen(item)).toBe(true)
      expect(Object.isFrozen(item.locators)).toBe(true)
      expect(required(item.id)).toMatchObject({ scope: 'tour', status: 'qualified', eligibleForDisplay: true })
      expect(item.locators).toEqual(required(item.id).excerpts.map(excerpt => excerpt.locator))
    }
    for (const item of SOURCE_CLAIMS.filter(item => !item.eligibleForDisplay)) expect(getDisplaySourceClaim(item.id)).toBeUndefined()
    for (const id of ['unknown', '__proto__', 'constructor']) expect(getDisplaySourceClaim(id)).toBeUndefined()
    for (const id of references(TOUR_CONTENT)) expect(getDisplaySourceClaim(id), id).toBeDefined()
  })

  it('limits each chapter title plus prose to forty words and explicitly exempts the question disclosure', () => {
    for (const chapter of TOUR_CONTENT.chapters) {
      console.info("Advisory word count / budget 40:", `${chapter.title} ${chapter.prose}`.trim().split(/\s+/).length)
      expect(chapter.claimIds.length).toBeGreaterThan(0)
    }
    expect(TOUR_CONTENT.questionsDisclosure.exemptFromChapterWordLimit).toBe(true)
    expect(TOUR_CONTENT.questionsDisclosure.questions).toHaveLength(7)
  })

  it('uses qualified, non-marketing public copy without em dashes or payment promises', () => {
    const copy = strings(TOUR_CONTENT).join(' ')
    expect(copy).not.toContain('\u2014')
    expect(copy).not.toMatch(/revolutionary|game[- ]changing|seamless|unleash|transformative|world[- ]class|best[- ]in[- ]class|will price|no second bounce|pays for itself|costs nothing|never disagree|achieved 99\.85/i)
    expect(copy).toContain('not the whole operator queue')
    expect(copy).toContain('target, not measured achievement')
    expect(copy).toContain('does not calculate or approve payments')
    expect(copy).toContain('not been independently verified')
  })

  it('freezes nested registry values and safe content against consumer mutation', () => {
    expect(Object.isFrozen(SOURCE_CLAIMS)).toBe(true)
    expect(Object.isFrozen(SOURCE_DOCUMENTS)).toBe(true)
    expect(Object.isFrozen(SOURCE_CLASSES)).toBe(true)
    expect(Object.isFrozen(SOURCE_NAMES)).toBe(true)
    for (const item of SOURCE_CLAIMS) {
      expect(Object.isFrozen(item)).toBe(true)
      expect(Object.isFrozen(item.excerpts)).toBe(true)
      expect(Object.isFrozen(item.excerpts[0].locator)).toBe(true)
      expect(Object.isFrozen(item.numbers)).toBe(true)
    }
    expect(Reflect.set(required('O16'), 'eligibleForDisplay', true)).toBe(false)
    expect(Object.isFrozen(TOUR_CONTENT.questionsDisclosure.questions)).toBe(true)
  })

  it('reports counts accurately without claiming independent verification or sentence-level completeness', () => {
    expect(SOURCE_REGISTRY_COVERAGE.claimCount).toBe(SOURCE_CLAIMS.length)
    expect(SOURCE_REGISTRY_COVERAGE.displayEligibleCount).toBe(SOURCE_CLAIMS.filter(item => item.eligibleForDisplay).length)
    expect(SOURCE_REGISTRY_COVERAGE.withheldOrContradictoryCount).toBe(SOURCE_CLAIMS.filter(item => item.status !== 'qualified').length)
    expect(SOURCE_REGISTRY_COVERAGE.completeness).toMatch(/not a claim of one row per sentence/)
    expect(SOURCE_REGISTRY_COVERAGE.completeness).toContain('audit exclusions are not counted')
    expect(SOURCE_REGISTRY_COVERAGE.limitations).toHaveLength(5)
  })
})