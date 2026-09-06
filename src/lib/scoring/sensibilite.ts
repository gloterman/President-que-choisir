import type { DecisionMatrix } from './matrice'
import { normalizeWeights } from './matrice'
import { aggregate } from './methodes'
import { createRng, dirichlet } from './aleatoire'
import type { AggregationMethod } from '@/data/types'

/**
 * Analyse de sensibilité.
 *
 * Un classement multicritère donne toujours un gagnant ; la vraie question est
 * de savoir si ce gagnant tient debout. On perturbe donc les pondérations mille
 * fois autour des valeurs choisies et on regarde ce qui change. Un candidat en
 * tête dans 90 % des tirages est un vrai premier ; un candidat en tête dans
 * 34 % des tirages signale surtout que les deux ou trois premiers sont
 * indiscernables au vu des données disponibles.
 */

export interface SensitivityResult {
  alternativeId: string
  /** Probabilité d'arriver en tête sur l'ensemble des tirages, 0–1. */
  topProbability: number
  /** Rang moyen (1 = premier). */
  meanRank: number
  /** Meilleur et pire rang atteints. */
  minRank: number
  maxRank: number
}

export interface SensitivityAnalysis {
  results: SensitivityResult[]
  /** Probabilité que le vainqueur du classement affiché reste vainqueur. */
  winnerStability: number
  draws: number
  /**
   * Lecture prête à afficher de la stabilité du classement.
   */
  verdict: 'robuste' | 'nuance' | 'fragile'
}

export function analyzeSensitivity(
  matrix: DecisionMatrix,
  method: AggregationMethod,
  options: { draws?: number; concentration?: number; seed?: number } = {},
): SensitivityAnalysis {
  const { draws = 1000, concentration = 40, seed = 20270422 } = options
  const n = matrix.alternatives.length

  if (n === 0) {
    return { results: [], winnerStability: 0, draws: 0, verdict: 'fragile' }
  }
  if (n === 1) {
    return {
      results: [
        {
          alternativeId: matrix.alternatives[0],
          topProbability: 1,
          meanRank: 1,
          minRank: 1,
          maxRank: 1,
        },
      ],
      winnerStability: 1,
      draws: 0,
      verdict: 'robuste',
    }
  }

  const rng = createRng(seed)
  const baseWeight = normalizeWeights(matrix.weight)

  const wins = new Array<number>(n).fill(0)
  const rankSum = new Array<number>(n).fill(0)
  const minRank = new Array<number>(n).fill(n)
  const maxRank = new Array<number>(n).fill(1)

  for (let t = 0; t < draws; t++) {
    const weight = dirichlet(rng, baseWeight, concentration)
    const scores = aggregate({ ...matrix, weight }, method)
    const order = scores
      .map((score, i) => ({ i, score }))
      .sort((a, b) => b.score - a.score)

    order.forEach(({ i }, position) => {
      const rank = position + 1
      rankSum[i] += rank
      if (rank < minRank[i]) minRank[i] = rank
      if (rank > maxRank[i]) maxRank[i] = rank
    })
    wins[order[0].i] += 1
  }

  const results: SensitivityResult[] = matrix.alternatives.map((id, i) => ({
    alternativeId: id,
    topProbability: wins[i] / draws,
    meanRank: rankSum[i] / draws,
    minRank: minRank[i],
    maxRank: maxRank[i],
  }))

  const referenceScores = aggregate(matrix, method)
  const winnerIndex = referenceScores.reduce(
    (best, score, i) => (score > referenceScores[best] ? i : best),
    0,
  )
  const stability = wins[winnerIndex] / draws

  return {
    results,
    winnerStability: stability,
    draws,
    verdict: stability >= 0.7 ? 'robuste' : stability >= 0.45 ? 'nuance' : 'fragile',
  }
}
