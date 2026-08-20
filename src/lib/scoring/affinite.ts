import { axes, axeById, propositions, themes } from '@/data/referentiel'
import type { Candidat, Likert, ReponseUtilisateur } from '@/data/types'

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

const ECART_MAX = 4 // de −2 à +2

export interface AccordProposition {
  propositionId: string
  themeId: string
  axeId: string
  /** Réponse de l'utilisateur, −2 à +2. */
  utilisateur: Likert
  /** Position du candidat traduite dans le sens de la proposition, −2 à +2. */
  candidat: number
  /** 0 = opposition frontale, 1 = accord parfait. */
  accord: number
  importance: number
}

export interface AffiniteTheme {
  themeId: string
  /** 0–100, ou `null` si aucune proposition du thème n'a été notée comme importante. */
  score: number | null
  /** Somme des importances exprimées sur ce thème. */
  poids: number
  nbPropositions: number
}

export interface Affinite {
  candidatId: string
  /** 0–100. Vaut 50 quand rien n'a été renseigné (neutre, pas favorable). */
  score: number
  parTheme: AffiniteTheme[]
  details: AccordProposition[]
  /** Propositions jugées importantes sur lesquelles le désaccord est fort. */
  desaccordsMajeurs: AccordProposition[]
  /** Propositions jugées importantes sur lesquelles l'accord est net. */
  accordsMajeurs: AccordProposition[]
  /** Nombre de propositions effectivement prises en compte. */
  nbPrisesEnCompte: number
}

/** Position du candidat exprimée dans le sens de la proposition. */
function positionCandidat(candidat: Candidat, axeId: string, polarite: 1 | -1): number {
  const brute = candidat.positions[axeId]
  if (brute === undefined) return 0
  return brute * polarite
}

export function calculerAffinite(
  candidat: Candidat,
  reponses: Record<string, ReponseUtilisateur>,
): Affinite {
  const details: AccordProposition[] = []
  let numerateur = 0
  let denominateur = 0

  for (const proposition of propositions) {
    const reponse = reponses[proposition.id]
    if (!reponse || reponse.importance === 0) continue

    const posCandidat = positionCandidat(candidat, proposition.axeId, proposition.polarite)
    const accord = 1 - Math.abs(reponse.valeur - posCandidat) / ECART_MAX

    details.push({
      propositionId: proposition.id,
      themeId: proposition.themeId,
      axeId: proposition.axeId,
      utilisateur: reponse.valeur,
      candidat: posCandidat,
      accord,
      importance: reponse.importance,
    })

    numerateur += accord * reponse.importance
    denominateur += reponse.importance
  }

  const parTheme: AffiniteTheme[] = themes.map((theme) => {
    const duTheme = details.filter((d) => d.themeId === theme.id)
    const poids = duTheme.reduce((acc, d) => acc + d.importance, 0)
    const score =
      poids > 0
        ? (duTheme.reduce((acc, d) => acc + d.accord * d.importance, 0) / poids) * 100
        : null
    return { themeId: theme.id, score, poids, nbPropositions: duTheme.length }
  })

  const importantes = details.filter((d) => d.importance >= 2)

  return {
    candidatId: candidat.id,
    score: denominateur > 0 ? (numerateur / denominateur) * 100 : 50,
    parTheme,
    details,
    desaccordsMajeurs: importantes
      .filter((d) => d.accord <= 0.375)
      .sort((a, b) => a.accord - b.accord || b.importance - a.importance),
    accordsMajeurs: importantes
      .filter((d) => d.accord >= 0.875)
      .sort((a, b) => b.accord - a.accord || b.importance - a.importance),
    nbPrisesEnCompte: details.length,
  }
}

// ---------------------------------------------------------------------------
// Boussole 2D
// ---------------------------------------------------------------------------

export interface PointBoussole {
  /** −1 (interventionnisme, redistribution) à +1 (marché, baisse des prélèvements). */
  eco: number
  /** −1 (ouverture culturelle, intégration européenne) à +1 (conservatisme, souverainisme). */
  soc: number
}

function projeter(positions: Record<string, number>): PointBoussole {
  let ecoNum = 0
  let ecoDen = 0
  let socNum = 0
  let socDen = 0

  for (const axe of axes) {
    const position = positions[axe.id]
    if (position === undefined) continue
    if (axe.boussole.eco !== 0) {
      ecoNum += position * axe.boussole.eco
      ecoDen += Math.abs(axe.boussole.eco) * 2
    }
    if (axe.boussole.soc !== 0) {
      socNum += position * axe.boussole.soc
      socDen += Math.abs(axe.boussole.soc) * 2
    }
  }

  return {
    eco: ecoDen > 0 ? ecoNum / ecoDen : 0,
    soc: socDen > 0 ? socNum / socDen : 0,
  }
}

export function boussoleCandidat(candidat: Candidat): PointBoussole {
  return projeter(candidat.positions)
}

/**
 * Reconstitue les positions de l'utilisateur sur chaque axe à partir de ses
 * réponses, puis les projette. Les propositions marquées « peu importe » sont
 * conservées ici avec un poids minimal : elles renseignent tout de même une
 * position, elles ne devaient simplement pas peser sur l'affinité.
 */
export function positionsUtilisateur(
  reponses: Record<string, ReponseUtilisateur>,
): Record<string, number> {
  const cumul: Record<string, { somme: number; poids: number }> = {}

  for (const proposition of propositions) {
    const reponse = reponses[proposition.id]
    if (!reponse) continue
    const cible = (cumul[proposition.axeId] ??= { somme: 0, poids: 0 })
    const poids = reponse.importance + 1
    cible.somme += reponse.valeur * proposition.polarite * poids
    cible.poids += poids
  }

  const positions: Record<string, number> = {}
  for (const [axeId, { somme, poids }] of Object.entries(cumul)) {
    if (poids > 0 && axeById.has(axeId)) positions[axeId] = somme / poids
  }
  return positions
}

export function boussoleUtilisateur(
  reponses: Record<string, ReponseUtilisateur>,
): PointBoussole | null {
  const positions = positionsUtilisateur(reponses)
  if (Object.keys(positions).length === 0) return null
  return projeter(positions)
}

/** Nombre de propositions auxquelles l'utilisateur a répondu. */
export function nbReponses(reponses: Record<string, ReponseUtilisateur>): number {
  return propositions.filter((p) => reponses[p.id] !== undefined).length
}
