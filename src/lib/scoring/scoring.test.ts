import { describe, expect, it } from 'vitest'
import type { Candidate, Likert, Preferences, UserAnswer } from '@/data/types'
import { propositions } from '@/data/referentiel'
import { criteria } from '@/data/criteres'
import { candidates } from '@/data/candidats'
import {
  userCompass,
  computeAffinity,
  computeRanking,
  copeland,
  kendallTau,
  normalizeMinMax,
  normalizeWeights,
  weightedProduct,
  weightedSum,
  topsis,
  ranksFromScores,
  type Ranking,
  type DecisionMatrix,
} from './index'
import { analyzeSensitivity } from './sensibilite'

const matrix = (values: number[][], weight: number[]): DecisionMatrix => ({
  alternatives: values.map((_, i) => `a${i}`),
  criteria: weight.map((_, j) => `c${j}`),
  values,
  weight,
})

describe('normalisation', () => {
  it('ramène les poids à une somme de 1', () => {
    expect(normalizeWeights([1, 3]).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
    expect(normalizeWeights([2, 2])).toEqual([0.5, 0.5])
  })

  it('remplace un vecteur de poids nul par un vecteur uniforme', () => {
    expect(normalizeWeights([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3])
  })

  it('ignore les poids négatifs', () => {
    expect(normalizeWeights([-5, 1, 1])).toEqual([0, 0.5, 0.5])
  })

  it('neutralise une colonne constante au lieu de la mettre à 0 ou 1', () => {
    const output = normalizeMinMax([
      [50, 10],
      [50, 90],
    ])
    expect(output[0][0]).toBe(0.5)
    expect(output[1][0]).toBe(0.5)
    expect(output[0][1]).toBe(0)
    expect(output[1][1]).toBe(1)
  })
})

describe('somme pondérée', () => {
  it('respecte la pondération', () => {
    const m = matrix(
      [
        [100, 0],
        [0, 100],
      ],
      [3, 1],
    )
    const scores = weightedSum(m)
    expect(scores[0]).toBeCloseTo(0.75)
    expect(scores[1]).toBeCloseTo(0.25)
  })

  it('donne 1 à un candidat parfait sur tous les critères', () => {
    expect(weightedSum(matrix([[100, 100, 100]], [1, 1, 1]))[0]).toBeCloseTo(1)
  })
})

describe('produit pondéré', () => {
  it('pénalise plus durement une note très basse que la somme pondérée', () => {
    const m = matrix(
      [
        [100, 12],
        [54, 52],
      ],
      [1, 1],
    )
    const sum = weightedSum(m)
    const product = weightedProduct(m)
    // La somme pondérée place le profil déséquilibré devant…
    expect(sum[0]).toBeGreaterThan(sum[1])
    // …le produit pondéré l'inverse : la faiblesse n'est plus compensée.
    expect(product[0]).toBeLessThan(product[1])
  })

  it('ne renvoie jamais exactement zéro grâce au plancher', () => {
    expect(weightedProduct(matrix([[0, 100]], [1, 1]))[0]).toBeGreaterThan(0)
  })
})

describe('TOPSIS', () => {
  it('classe en tête le candidat qui domine sur tous les critères', () => {
    const scores = topsis(
      matrix(
        [
          [90, 90],
          [50, 50],
          [10, 10],
        ],
        [1, 1],
      ),
    )
    expect(scores[0]).toBeGreaterThan(scores[1])
    expect(scores[1]).toBeGreaterThan(scores[2])
    expect(scores[0]).toBeCloseTo(1)
    expect(scores[2]).toBeCloseTo(0)
  })
})

describe('Copeland', () => {
  it('compte les duels gagnés, sans tenir compte de l’ampleur des écarts', () => {
    const scores = copeland(
      matrix(
        [
          [100, 100],
          [60, 60],
          [20, 20],
        ],
        [1, 1],
      ),
    )
    expect(scores).toEqual([1, 0.5, 0])
  })

  it('traite comme indifférents deux candidats séparés par moins du seuil', () => {
    const scores = copeland(
      matrix(
        [
          [51, 51],
          [50, 50],
        ],
        [1, 1],
      ),
    )
    expect(scores).toEqual([0.5, 0.5])
  })
})

describe('tau de Kendall', () => {
  it('vaut 1 pour deux classements identiques et −1 pour deux classements inverses', () => {
    expect(kendallTau([3, 2, 1], [30, 20, 10])).toBe(1)
    expect(kendallTau([3, 2, 1], [10, 20, 30])).toBe(-1)
  })
})

// ---------------------------------------------------------------------------

const testCandidate = (id: string, positions: Record<string, number>): Candidate =>
  ({
    id,
    firstName: id,
    lastName: id.toUpperCase(),
    initials: id.slice(0, 2).toUpperCase(),
    party: 'Parti test',
    partyShort: 'PT',
    family: 'divers',
    partyColor: '#888888',
    birth: '1970-01-01',
    currentRole: '—',
    candidacyStatus: 'hypothetique',
    socialAccounts: [],
    officialLinks: [],
    summary: '—',
    positions: positions as Record<string, Likert>,
    ratings: criteria.map((c) => ({
      criterionId: c.id,
      rating: 50,
      confidence: 'moyenne' as const,
      rationale: '—',
      sourceIds: [],
      verification: 'estimation' as const,
    })),
    measures: [],
    facts: [],
    legal: [],
    indicators: [],
    lastUpdated: '2026-01-01',
  }) satisfies Candidate

const answer = (value: number, importance: number): UserAnswer =>
  ({ value, importance }) as UserAnswer

describe('affinité programmatique', () => {
  const first = propositions[0]

  it('donne 100 % quand la position du candidat coïncide avec la réponse', () => {
    const candidate = testCandidate('a', { [first.axisId]: 2 * first.polarity })
    const affinity = computeAffinity(candidate, { [first.id]: answer(2, 3) })
    expect(affinity.score).toBeCloseTo(100)
    expect(affinity.majorAgreements).toHaveLength(1)
  })

  it('donne 0 % en cas d’opposition frontale', () => {
    const candidate = testCandidate('a', { [first.axisId]: -2 * first.polarity })
    const affinity = computeAffinity(candidate, { [first.id]: answer(2, 3) })
    expect(affinity.score).toBeCloseTo(0)
    expect(affinity.majorDisagreements).toHaveLength(1)
  })

  it('exclut du calcul les propositions marquées « peu importe »', () => {
    const candidate = testCandidate('a', { [first.axisId]: -2 * first.polarity })
    const affinity = computeAffinity(candidate, { [first.id]: answer(2, 0) })
    expect(affinity.countedIn).toBe(0)
    expect(affinity.score).toBe(50)
  })

  it('pondère par l’importance déclarée', () => {
    // Deux propositions portant sur des axes distincts, sinon la seconde
    // position écraserait la première dans le candidat de test.
    const p1 = propositions[0]
    const p2 = propositions.find((p) => p.axisId !== p1.axisId)!
    const candidate = testCandidate('a', {
      [p1.axisId]: 2 * p1.polarity,
      [p2.axisId]: -2 * p2.polarity,
    })
    const overWeighted = computeAffinity(candidate, {
      [p1.id]: answer(2, 3),
      [p2.id]: answer(2, 1),
    })
    const balance = computeAffinity(candidate, {
      [p1.id]: answer(2, 1),
      [p2.id]: answer(2, 1),
    })
    expect(overWeighted.score).toBeGreaterThan(balance.score)
    expect(balance.score).toBeCloseTo(50)
  })

  it('place l’utilisateur sur la boussole seulement s’il a répondu', () => {
    expect(userCompass({})).toBeNull()
    const point = userCompass({ [first.id]: answer(2, 3) })
    expect(point).not.toBeNull()
    expect(point!.eco).toBeGreaterThanOrEqual(-1)
    expect(point!.eco).toBeLessThanOrEqual(1)
  })
})

describe('analyse de sensibilité', () => {
  it('est déterministe à réglages identiques', () => {
    const m = matrix(
      [
        [80, 40],
        [45, 85],
        [60, 60],
      ],
      [1, 1],
    )
    const a = analyzeSensitivity(m, 'somme-ponderee', { draws: 200 })
    const b = analyzeSensitivity(m, 'somme-ponderee', { draws: 200 })
    expect(a.results).toEqual(b.results)
  })

  it('juge robuste un vainqueur qui domine tous les critères', () => {
    const analysis = analyzeSensitivity(
      matrix(
        [
          [95, 95],
          [40, 45],
        ],
        [1, 1],
      ),
      'somme-ponderee',
      { draws: 200 },
    )
    expect(analysis.winnerStability).toBe(1)
    expect(analysis.verdict).toBe('robuste')
  })

  it('juge fragile un classement où deux profils s’échangent la tête', () => {
    const analysis = analyzeSensitivity(
      matrix(
        [
          [90, 30],
          [30, 90],
        ],
        [1, 1],
      ),
      'somme-ponderee',
      { draws: 400 },
    )
    expect(analysis.winnerStability).toBeLessThan(0.7)
    expect(analysis.verdict).not.toBe('robuste')
  })

  it('additionne les probabilités de tête à 1', () => {
    const analysis = analyzeSensitivity(
      matrix(
        [
          [70, 30],
          [30, 70],
          [55, 55],
        ],
        [1, 1],
      ),
      'topsis',
      { draws: 300 },
    )
    const total = analysis.results.reduce((a, r) => a + r.topProbability, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('classement complet', () => {
  const preferences = (partial: Partial<Preferences> = {}): Preferences => ({
    answers: {},
    weight: Object.fromEntries(criteria.map((c) => [c.id, 1])),
    thresholds: {},
    programShare: 0.5,
    method: 'somme-ponderee',
    excluded: [],
    comparison: [],
    ...partial,
  })

  const alpha = testCandidate('alpha', {})
  const beta = testCandidate('beta', {})

  it('classe et attribue des rangs contigus', () => {
    const best: Candidate = {
      ...alpha,
      ratings: alpha.ratings.map((n) => ({ ...n, rating: 90 })),
    }
    const ranking = computeRanking([beta, best], preferences())
    expect(ranking.results.map((r) => r.rank)).toEqual([1, 2])
    expect(ranking.results[0].candidate.id).toBe('alpha')
  })

  it('écarte un candidat sous un seuil rédhibitoire, sans le supprimer', () => {
    const weak: Candidate = {
      ...beta,
      ratings: beta.ratings.map((n) => (n.criterionId === 'probite' ? { ...n, rating: 20 } : n)),
    }
    const ranking = computeRanking([alpha, weak], preferences({ thresholds: { probite: 50 } }))
    expect(ranking.results).toHaveLength(1)
    expect(ranking.dropped).toHaveLength(1)
    expect(ranking.dropped[0].candidate.id).toBe('beta')
    expect(ranking.dropped[0].reasons[0]).toMatchObject({ criterionId: 'probite', threshold: 50 })
  })

  it('retire du calcul les candidats exclus à la main', () => {
    const ranking = computeRanking([alpha, beta], preferences({ excluded: ['beta'] }))
    expect(ranking.results).toHaveLength(1)
    expect(ranking.excluded.map((c) => c.id)).toEqual(['beta'])
  })

  it('bascule sur 100 % de programme quand tous les poids sont à zéro', () => {
    const ranking = computeRanking(
      [alpha, beta],
      preferences({ weight: Object.fromEntries(criteria.map((c) => [c.id, 0])), programShare: 0.2 }),
    )
    expect(ranking.programShare).toBe(1)
  })

  it('compte les notes manquantes remplacées par la valeur neutre', () => {
    const withoutRatings: Candidate = { ...beta, ratings: [] }
    const ranking = computeRanking([withoutRatings], preferences())
    expect(ranking.missingRatings).toBe(criteria.length)
  })

  it('répartit les poids entre critères et affinité selon partProgramme', () => {
    const ranking = computeRanking([alpha, beta], preferences({ programShare: 0.7 }))
    const affinity = ranking.results[0].contributions.find(
      (c) => c.criterionId === '__affinite',
    )
    expect(affinity!.normalizedWeight).toBeCloseTo(0.7)
  })
})

// ---------------------------------------------------------------------------

describe('égalités', () => {
  const neutralPreferences = (weight: number): Preferences => ({
    answers: {},
    weight: Object.fromEntries(criteria.map((c) => [c.id, weight])),
    thresholds: {},
    programShare: 0,
    method: 'somme-ponderee',
    excluded: [],
    comparison: [],
  })

  it('ne fait pas dépendre le rang de l’ordre du fichier de données', () => {
    // Le défaut qui a coûté sa crédibilité à Elyze en 2022 : à égalité, le
    // premier déclaré dans le code sortait premier.
    const a = testCandidate('alice', {})
    const b = testCandidate('bruno', {})
    const rank = (c: Ranking, id: string) =>
      c.results.find((r) => r.candidate.id === id)!.rank

    const orderA = computeRanking([a, b], neutralPreferences(3))
    const orderB = computeRanking([b, a], neutralPreferences(3))

    expect(rank(orderA, 'alice')).toBe(rank(orderB, 'alice'))
    expect(rank(orderA, 'bruno')).toBe(rank(orderB, 'bruno'))
  })

  it('donne le même rang aux candidats à égalité', () => {
    const ranking = computeRanking(
      [testCandidate('a', {}), testCandidate('b', {}), testCandidate('c', {})],
      neutralPreferences(3),
    )
    expect(ranking.results.map((r) => r.rank)).toEqual([1, 1, 1])
  })

  it('reprend la numérotation après un groupe d’ex æquo', () => {
    // Rang « compétition » : deux premiers ex æquo, puis un troisième.
    expect(ranksFromScores([10, 10, 5])).toEqual([1, 1, 3])
    expect(ranksFromScores([10, 5, 5])).toEqual([1, 2, 2])
    expect(ranksFromScores([10, 8, 5])).toEqual([1, 2, 3])
  })

  it('tient pour égaux deux scores que seul le bruit de calcul sépare', () => {
    expect(ranksFromScores([0.1 + 0.2, 0.3])).toEqual([1, 1])
  })

  it('signale un classement indéterminé quand aucun critère n’est pondéré', () => {
    const all = computeRanking(
      [testCandidate('a', {}), testCandidate('b', {})],
      neutralPreferences(0),
    )
    expect(all.rankingUndetermined).toBe(true)
  })

  it('ne signale rien sur le jeu de données réel, où les notes diffèrent', () => {
    const real = computeRanking(candidates, neutralPreferences(3))
    expect(real.rankingUndetermined).toBe(false)
    // Et le premier n'est alors pas premier par défaut : il devance vraiment.
    expect(real.results[0].finalScore).toBeGreaterThan(real.results[1].finalScore)
  })

  it('n’ordonne plus par le spectre politique quand tout est à égalité', () => {
    // Avec tous les poids à zéro, chaque candidat vaut 50 : la liste ne doit
    // plus reproduire l'ordre du fichier, qui va de la gauche à la droite.
    const flat = computeRanking(candidates, neutralPreferences(0))
    expect(flat.rankingUndetermined).toBe(true)
    expect(new Set(flat.results.map((r) => r.rank))).toEqual(new Set([1]))
    const names = flat.results.map((r) => r.candidate.lastName)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'fr')))
  })
})
