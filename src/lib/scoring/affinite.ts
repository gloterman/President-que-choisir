import { axes, axisById, propositions, themes } from '@/data/referentiel'
import type { Candidate, Likert, UserAnswer } from '@/data/types'

/**
 * Affinité programmatique — le volet « boussole » de l'application.
 *
 * Le principe est celui des Voting Advice Applications : on ne note pas les
 * positions, on mesure une distance entre celles de l'utilisateur et celles du
 * candidat, pondérée par l'importance que l'utilisateur accorde à chaque sujet.
 *
 * Une proposition marquée « peu importe » (importance 0) est retirée du calcul :
 * elle ne compte ni pour ni contre, au lieu de compter comme un accord neutre.
 */

const MAX_SPREAD = 4 // de −2 à +2

export interface PropositionAgreement {
  propositionId: string
  themeId: string
  axisId: string
  /** Réponse de l'utilisateur, −2 à +2. */
  user: Likert
  /** Position du candidat traduite dans le sens de la proposition, −2 à +2. */
  candidate: number
  /** 0 = opposition frontale, 1 = accord parfait. */
  agreement: number
  importance: number
}

export interface ThemeAffinity {
  themeId: string
  /** 0–100, ou `null` si aucune proposition du thème n'a été notée comme importante. */
  score: number | null
  /** Somme des importances exprimées sur ce thème. */
  weight: number
  propositionCount: number
}

export interface Affinity {
  candidateId: string
  /** 0–100. Vaut 50 quand rien n'a été renseigné (neutre, pas favorable). */
  score: number
  byTheme: ThemeAffinity[]
  details: PropositionAgreement[]
  /** Propositions jugées importantes sur lesquelles le désaccord est fort. */
  majorDisagreements: PropositionAgreement[]
  /** Propositions jugées importantes sur lesquelles l'accord est net. */
  majorAgreements: PropositionAgreement[]
  /** Nombre de propositions effectivement prises en compte. */
  countedIn: number
}

/** Position du candidat exprimée dans le sens de la proposition. */
function candidatePosition(candidate: Candidate, axisId: string, polarity: 1 | -1): number {
  const raw = candidate.positions[axisId]
  if (raw === undefined) return 0
  return raw * polarity
}

export function computeAffinity(
  candidate: Candidate,
  answers: Record<string, UserAnswer>,
): Affinity {
  const details: PropositionAgreement[] = []
  let numerator = 0
  let denominator = 0

  for (const proposition of propositions) {
    const answer = answers[proposition.id]
    if (!answer || answer.importance === 0) continue

    const candidatePos = candidatePosition(candidate, proposition.axisId, proposition.polarity)
    const agreement = 1 - Math.abs(answer.value - candidatePos) / MAX_SPREAD

    details.push({
      propositionId: proposition.id,
      themeId: proposition.themeId,
      axisId: proposition.axisId,
      user: answer.value,
      candidate: candidatePos,
      agreement,
      importance: answer.importance,
    })

    numerator += agreement * answer.importance
    denominator += answer.importance
  }

  const byTheme: ThemeAffinity[] = themes.map((theme) => {
    const ofTheme = details.filter((d) => d.themeId === theme.id)
    const weight = ofTheme.reduce((acc, d) => acc + d.importance, 0)
    const score =
      weight > 0
        ? (ofTheme.reduce((acc, d) => acc + d.agreement * d.importance, 0) / weight) * 100
        : null
    return { themeId: theme.id, score, weight, propositionCount: ofTheme.length }
  })

  const important = details.filter((d) => d.importance >= 2)

  return {
    candidateId: candidate.id,
    score: denominator > 0 ? (numerator / denominator) * 100 : 50,
    byTheme,
    details,
    majorDisagreements: important
      .filter((d) => d.agreement <= 0.375)
      .sort((a, b) => a.agreement - b.agreement || b.importance - a.importance),
    majorAgreements: important
      .filter((d) => d.agreement >= 0.875)
      .sort((a, b) => b.agreement - a.agreement || b.importance - a.importance),
    countedIn: details.length,
  }
}

// ---------------------------------------------------------------------------
// Boussole 2D
// ---------------------------------------------------------------------------

export interface CompassPoint {
  /** −1 (interventionnisme, redistribution) à +1 (marché, baisse des prélèvements). */
  eco: number
  /** −1 (ouverture culturelle, intégration européenne) à +1 (conservatisme, souverainisme). */
  soc: number
}

function project(positions: Record<string, number>): CompassPoint {
  let ecoNum = 0
  let ecoDen = 0
  let socNum = 0
  let socDen = 0

  for (const axis of axes) {
    const position = positions[axis.id]
    if (position === undefined) continue
    if (axis.compass.eco !== 0) {
      ecoNum += position * axis.compass.eco
      ecoDen += Math.abs(axis.compass.eco) * 2
    }
    if (axis.compass.soc !== 0) {
      socNum += position * axis.compass.soc
      socDen += Math.abs(axis.compass.soc) * 2
    }
  }

  return {
    eco: ecoDen > 0 ? ecoNum / ecoDen : 0,
    soc: socDen > 0 ? socNum / socDen : 0,
  }
}

export function candidateCompass(candidate: Candidate): CompassPoint {
  return project(candidate.positions)
}

/**
 * Reconstitue les positions de l'utilisateur sur chaque axe à partir de ses
 * réponses, puis les projette. Les propositions marquées « peu importe » sont
 * conservées ici avec un poids minimal : elles renseignent tout de même une
 * position, elles ne devaient simplement pas peser sur l'affinité.
 */
export function userPositions(
  answers: Record<string, UserAnswer>,
): Record<string, number> {
  const cumulative: Record<string, { sum: number; weight: number }> = {}

  for (const proposition of propositions) {
    const answer = answers[proposition.id]
    if (!answer) continue
    const target = (cumulative[proposition.axisId] ??= { sum: 0, weight: 0 })
    const weight = answer.importance + 1
    target.sum += answer.value * proposition.polarity * weight
    target.weight += weight
  }

  const positions: Record<string, number> = {}
  for (const [axisId, { sum, weight }] of Object.entries(cumulative)) {
    if (weight > 0 && axisById.has(axisId)) positions[axisId] = sum / weight
  }
  return positions
}

export function userCompass(
  answers: Record<string, UserAnswer>,
): CompassPoint | null {
  const positions = userPositions(answers)
  if (Object.keys(positions).length === 0) return null
  return project(positions)
}

/** Nombre de propositions auxquelles l'utilisateur a répondu. */
export function answerCount(answers: Record<string, UserAnswer>): number {
  return propositions.filter((p) => answers[p.id] !== undefined).length
}
