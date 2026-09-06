import type { Candidate, AggregationMethod, CriterionRating, Preferences } from '@/data/types'
import { criteria } from '@/data/criteria'
import type { DecisionMatrix } from './matrix'
import { normalizeWeights } from './matrix'
import { aggregate, METHODS } from './methods'
import { analyzeSensitivity, type SensitivityAnalysis } from './sensitivity'
import { computeAffinity, type Affinity } from './affinity'

export * from './matrix'
export * from './methods'
export * from './affinity'
export * from './sensitivity'

/** Identifiant de la pseudo-colonne « affinité programmatique ». */
export const AFFINITY_COLUMN = '__affinite'

/** Note retenue quand un critère n'est pas documenté pour un candidat. */
export const NEUTRAL_RATING = 50

export interface CriterionContribution {
  criterionId: string
  rating: number
  /** Poids ramené à une somme de 1 sur l'ensemble des colonnes. */
  normalizedWeight: number
  /** Points apportés au score final, sur 100. */
  contribution: number
  /** `true` quand la note est un défaut faute de donnée. */
  missing: boolean
}

export interface CandidateResult {
  candidate: Candidate
  rank: number
  /** 0–100, selon la méthode retenue. */
  finalScore: number
  /** Somme pondérée des seuls critères de notation, 0–100. */
  criteriaScore: number
  affinity: Affinity
  contributions: CriterionContribution[]
  strengths: CriterionContribution[]
  weaknesses: CriterionContribution[]
  /** Score obtenu avec chacune des quatre méthodes, 0–100. */
  scoresByMethod: Record<AggregationMethod, number>
  /** Rang obtenu avec chacune des quatre méthodes. */
  ranksByMethod: Record<AggregationMethod, number>
}

export interface ExcludedCandidate {
  candidate: Candidate
  reasons: { criterionId: string; rating: number; threshold: number }[]
}

export interface Ranking {
  results: CandidateResult[]
  /** Candidats sortis du classement par un seuil rédhibitoire. */
  dropped: ExcludedCandidate[]
  /** Candidats retirés à la main par l'utilisateur. */
  excluded: Candidate[]
  sensitivity: SensitivityAnalysis
  matrix: DecisionMatrix
  /**
   * Concordance moyenne entre les quatre méthodes (tau de Kendall, −1 à 1).
   * Une valeur proche de 1 signifie que le choix de la méthode ne change rien.
   */
  methodAgreement: number
  /** Part effective de l'affinité programmatique dans le score, 0–1. */
  programShare: number
  /** Nombre de notes manquantes remplacées par la valeur neutre. */
  missingRatings: number
  /**
   * Vrai quand tous les candidats obtiennent le même score : le classement
   * n'ordonne alors rien et l'interface doit le dire plutôt que d'afficher une
   * liste numérotée qui se lirait comme un résultat.
   */
  rankingUndetermined: boolean
}

/**
 * Notes calculées hors des fiches, superposées aux notes statiques.
 *
 * Sert au critère « rapport aux faits », dont la valeur dépend des
 * vérifications publiées et change donc sans que les fiches soient modifiées.
 * Le moteur reste pur : il reçoit ces notes en entrée plutôt que d'aller les
 * chercher.
 */
export type DynamicRatings = Record<string, CriterionRating[]>

function ratingOf(
  candidate: Candidate,
  criterionId: string,
  dynamicRatings: DynamicRatings,
): { rating: number; missing: boolean } {
  const dynamic = dynamicRatings[candidate.id]?.find((n) => n.criterionId === criterionId)
  if (dynamic) return { rating: dynamic.rating, missing: false }
  const found = candidate.ratings.find((n) => n.criterionId === criterionId)
  if (!found) return { rating: NEUTRAL_RATING, missing: true }
  return { rating: found.rating, missing: false }
}

/** Tau de Kendall entre deux classements donnés sous forme de scores. */
export function kendallTau(a: number[], b: number[]): number {
  const n = a.length
  if (n < 2) return 1
  let concordant = 0
  let discordant = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const da = a[i] - a[j]
      const db = b[i] - b[j]
      const product = da * db
      if (product > 0) concordant++
      else if (product < 0) discordant++
    }
  }
  const total = concordant + discordant
  return total === 0 ? 1 : (concordant - discordant) / total
}

/**
 * Écart en deçà duquel deux scores sont tenus pour égaux.
 *
 * Deux scores mathématiquement identiques peuvent différer d'un milliardième
 * selon l'ordre des additions flottantes. Les départager reviendrait à
 * classer sur du bruit de calcul.
 */
const TIE_TOLERANCE = 1e-9

/**
 * Rangs avec ex æquo (1, 1, 3…).
 *
 * Un tri seul ne suffit pas : il numérote 1, 2, 3 même quand rien ne sépare
 * deux candidats, et le tri de JavaScript étant stable, c'est alors l'ordre du
 * tableau d'entrée qui tranche. Cet ordre est celui du fichier de données,
 * c'est-à-dire ici le spectre politique — un classement se serait donc
 * silencieusement adossé à une convention de lecture. C'est le défaut qui a
 * coûté sa crédibilité à Elyze en 2022, où le président sortant sortait
 * premier à égalité parce qu'il était déclaré en premier dans le code.
 */
export function ranksFromScores(scores: number[]): number[] {
  const order = scores.map((s, i) => ({ s, i })).sort((x, y) => y.s - x.s)
  const ranks = new Array<number>(scores.length).fill(0)
  let currentRank = 1
  order.forEach(({ s, i }, position) => {
    if (position > 0 && Math.abs(s - order[position - 1].s) > TIE_TOLERANCE) {
      // Rang « compétition » : après deux premiers ex æquo vient le troisième.
      currentRank = position + 1
    }
    ranks[i] = currentRank
  })
  return ranks
}

/**
 * Construit le classement complet.
 *
 * L'affinité programmatique n'est pas mélangée après coup : elle entre dans la
 * matrice comme une colonne supplémentaire, dotée du poids `partProgramme`.
 * Les quatre méthodes s'appliquent donc à la même matrice, et « 70 % de
 * programme » veut dire la même chose quelle que soit la méthode retenue.
 */
export function computeRanking(
  allCandidates: Candidate[],
  preferences: Preferences,
  dynamicRatings: DynamicRatings = {},
): Ranking {
  const excluded = allCandidates.filter((c) => preferences.excluded.includes(c.id))
  const keptCandidates = allCandidates.filter((c) => !preferences.excluded.includes(c.id))

  // 1. Seuils rédhibitoires — appliqués avant toute agrégation.
  const dropped: ExcludedCandidate[] = []
  const inContention: Candidate[] = []
  for (const candidate of keptCandidates) {
    const reasons = Object.entries(preferences.thresholds)
      .filter(([, threshold]) => threshold > 0)
      .map(([criterionId, threshold]) => ({
        criterionId,
        rating: ratingOf(candidate, criterionId, dynamicRatings).rating,
        threshold,
      }))
      .filter((m) => m.rating < m.threshold)
    if (reasons.length > 0) dropped.push({ candidate, reasons })
    else inContention.push(candidate)
  }

  // 2. Affinités.
  const affinities = new Map<string, Affinity>(
    allCandidates.map((c) => [c.id, computeAffinity(c, preferences.answers)]),
  )

  // 3. Matrice de décision : critères pondérés + colonne d'affinité.
  const activeCriteria = criteria.filter((c) => (preferences.weight[c.id] ?? 0) > 0)
  const criteriaWeightSum = activeCriteria.reduce((acc, c) => acc + preferences.weight[c.id], 0)
  const programShare =
    criteriaWeightSum <= 0 ? 1 : Math.min(1, Math.max(0, preferences.programShare))

  const columns = [...activeCriteria.map((c) => c.id), AFFINITY_COLUMN]
  const columnWeights = [
    ...activeCriteria.map(
      (c) => (preferences.weight[c.id] / (criteriaWeightSum || 1)) * (1 - programShare),
    ),
    programShare,
  ]

  let missingRatings = 0
  const values = inContention.map((candidate) => {
    const row = activeCriteria.map((c) => {
      const { rating, missing } = ratingOf(candidate, c.id, dynamicRatings)
      if (missing) missingRatings++
      return rating
    })
    row.push(affinities.get(candidate.id)!.score)
    return row
  })

  const matrix: DecisionMatrix = {
    alternatives: inContention.map((c) => c.id),
    criteria: columns,
    values,
    weight: columnWeights,
  }

  // 4. Scores selon les quatre méthodes.
  const methods = Object.keys(METHODS) as AggregationMethod[]
  const scoresByMethod = new Map<AggregationMethod, number[]>(
    methods.map((m) => [m, aggregate(matrix, m)]),
  )
  const ranksByMethod = new Map<AggregationMethod, number[]>(
    methods.map((m) => [m, ranksFromScores(scoresByMethod.get(m)!)]),
  )

  const selectedScores = scoresByMethod.get(preferences.method)!
  const normalizedWeights = normalizeWeights(columnWeights)

  const ordered = inContention
    .map((candidate, i) => {
      const contributions: CriterionContribution[] = columns.map((criterionId, j) => {
        const rating = values[i][j]
        const missing =
          criterionId !== AFFINITY_COLUMN && ratingOf(candidate, criterionId, dynamicRatings).missing
        return {
          criterionId,
          rating,
          normalizedWeight: normalizedWeights[j],
          contribution: normalizedWeights[j] * rating,
          missing,
        }
      })

      const criteriaContributions = contributions.filter((c) => c.criterionId !== AFFINITY_COLUMN)
      const criteriaOnlyWeight = criteriaContributions.reduce((a, c) => a + c.normalizedWeight, 0)
      const criteriaScore =
        criteriaOnlyWeight > 0
          ? criteriaContributions.reduce((a, c) => a + c.contribution, 0) / criteriaOnlyWeight
          : NEUTRAL_RATING

      const sorted = [...contributions].sort((a, b) => b.contribution - a.contribution)
      const significant = sorted.filter((c) => c.normalizedWeight > 0.01)

      return {
        candidate,
        rank: 0,
        finalScore: selectedScores[i] * 100,
        criteriaScore,
        affinity: affinities.get(candidate.id)!,
        contributions,
        strengths: significant.filter((c) => c.rating >= 65).slice(0, 3),
        weaknesses: significant
          .filter((c) => c.rating <= 45)
          .sort((a, b) => a.rating - b.rating)
          .slice(0, 3),
        scoresByMethod: Object.fromEntries(
          methods.map((m) => [m, scoresByMethod.get(m)![i] * 100]),
        ) as Record<AggregationMethod, number>,
        ranksByMethod: Object.fromEntries(
          methods.map((m) => [m, ranksByMethod.get(m)![i]]),
        ) as Record<AggregationMethod, number>,
      }
    })
    // À égalité de score, l'ordre d'affichage est alphabétique. Il reste
    // arbitraire, mais il n'est corrélé à rien : l'ordre du fichier, lui, est
    // celui du spectre politique, et s'en servir revenait à faire trancher une
    // égalité par la position politique du candidat.
    // À égalité de score, l'ordre d'affichage est alphabétique. Il reste
    // arbitraire, mais il n'est corrélé à rien : l'ordre du fichier, lui, est
    // celui du spectre politique, et s'en servir revenait à faire trancher une
    // égalité par la position politique du candidat.
    .sort(
      (a, b) => b.finalScore - a.finalScore || a.candidate.lastName.localeCompare(b.candidate.lastName, 'fr'),
    )

  const ranks = ranksFromScores(ordered.map((r) => r.finalScore))
  const results: CandidateResult[] = ordered.map((r, i) => ({ ...r, rank: ranks[i] }))

  /**
   * Aucun écart entre le premier et le dernier : le classement ne veut rien
   * dire. Le cas se produit dès que l'utilisateur laisse tous les poids à zéro,
   * et il n'est pas rare. Afficher quand même une liste numérotée donnerait à
   * lire un classement là où il n'y a qu'un ordre d'affichage.
   */
  const rankingUndetermined =
    ordered.length > 1 &&
    Math.abs(ordered[0].finalScore - ordered[ordered.length - 1].finalScore) <= TIE_TOLERANCE

  // 5. Concordance entre méthodes : moyenne des tau de Kendall deux à deux.
  let tauSum = 0
  let pairs = 0
  for (let i = 0; i < methods.length; i++) {
    for (let j = i + 1; j < methods.length; j++) {
      tauSum += kendallTau(
        scoresByMethod.get(methods[i])!,
        scoresByMethod.get(methods[j])!,
      )
      pairs++
    }
  }

  return {
    results,
    dropped,
    excluded,
    sensitivity: analyzeSensitivity(matrix, preferences.method),
    matrix,
    methodAgreement: pairs > 0 ? tauSum / pairs : 1,
    programShare,
    missingRatings,
    rankingUndetermined,
  }
}
