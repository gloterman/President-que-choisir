import type { Candidat, MethodeAgregation, Preferences } from '@/data/types'
import { criteres } from '@/data/criteres'
import type { MatriceDecision } from './matrice'
import { normaliserPoids } from './matrice'
import { agreger, METHODES } from './methodes'
import { analyserSensibilite, type AnalyseSensibilite } from './sensibilite'
import { calculerAffinite, type Affinite } from './affinite'

export * from './matrice'
export * from './methodes'
export * from './affinite'
export * from './sensibilite'

/** Identifiant de la pseudo-colonne « affinité programmatique ». */
export const COLONNE_AFFINITE = '__affinite'

/** Note retenue quand un critère n'est pas documenté pour un candidat. */
export const NOTE_NEUTRE = 50

export interface ContributionCritere {
  critereId: string
  note: number
  /** Poids ramené à une somme de 1 sur l'ensemble des colonnes. */
  poidsNormalise: number
  /** Points apportés au score final, sur 100. */
  apport: number
  /** `true` quand la note est un défaut faute de donnée. */
  manquante: boolean
}

export interface ResultatCandidat {
  candidat: Candidat
  rang: number
  /** 0–100, selon la méthode retenue. */
  scoreFinal: number
  /** Somme pondérée des seuls critères de notation, 0–100. */
  scoreCriteres: number
  affinite: Affinite
  contributions: ContributionCritere[]
  pointsForts: ContributionCritere[]
  pointsFaibles: ContributionCritere[]
  /** Score obtenu avec chacune des quatre méthodes, 0–100. */
  scoresParMethode: Record<MethodeAgregation, number>
  /** Rang obtenu avec chacune des quatre méthodes. */
  rangsParMethode: Record<MethodeAgregation, number>
}

export interface CandidatEcarte {
  candidat: Candidat
  motifs: { critereId: string; note: number; seuil: number }[]
}

export interface Classement {
  resultats: ResultatCandidat[]
  /** Candidats sortis du classement par un seuil rédhibitoire. */
  ecartes: CandidatEcarte[]
  /** Candidats retirés à la main par l'utilisateur. */
  exclus: Candidat[]
  sensibilite: AnalyseSensibilite
  matrice: MatriceDecision
  /**
   * Concordance moyenne entre les quatre méthodes (tau de Kendall, −1 à 1).
   * Une valeur proche de 1 signifie que le choix de la méthode ne change rien.
   */
  concordanceMethodes: number
  /** Part effective de l'affinité programmatique dans le score, 0–1. */
  partProgramme: number
  /** Nombre de notes manquantes remplacées par la valeur neutre. */
  notesManquantes: number
}

function noteDe(candidat: Candidat, critereId: string): { note: number; manquante: boolean } {
  const trouvee = candidat.notes.find((n) => n.critereId === critereId)
  if (!trouvee) return { note: NOTE_NEUTRE, manquante: true }
  return { note: trouvee.note, manquante: false }
}

/** Tau de Kendall entre deux classements donnés sous forme de scores. */
export function kendallTau(a: number[], b: number[]): number {
  const n = a.length
  if (n < 2) return 1
  let concordants = 0
  let discordants = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const da = a[i] - a[j]
      const db = b[i] - b[j]
      const produit = da * db
      if (produit > 0) concordants++
      else if (produit < 0) discordants++
    }
  }
  const total = concordants + discordants
  return total === 0 ? 1 : (concordants - discordants) / total
}

function rangsDepuisScores(scores: number[]): number[] {
  const ordre = scores.map((s, i) => ({ s, i })).sort((x, y) => y.s - x.s)
  const rangs = new Array<number>(scores.length).fill(0)
  ordre.forEach(({ i }, position) => {
    rangs[i] = position + 1
  })
  return rangs
}

/**
 * Construit le classement complet.
 *
 * L'affinité programmatique n'est pas mélangée après coup : elle entre dans la
 * matrice comme une colonne supplémentaire, dotée du poids `partProgramme`.
 * Les quatre méthodes s'appliquent donc à la même matrice, et « 70 % de
 * programme » veut dire la même chose quelle que soit la méthode retenue.
 */
export function calculerClassement(
  tousCandidats: Candidat[],
  preferences: Preferences,
): Classement {
  const exclus = tousCandidats.filter((c) => preferences.exclus.includes(c.id))
  const candidatsRetenus = tousCandidats.filter((c) => !preferences.exclus.includes(c.id))

  // 1. Seuils rédhibitoires — appliqués avant toute agrégation.
  const ecartes: CandidatEcarte[] = []
  const enLice: Candidat[] = []
  for (const candidat of candidatsRetenus) {
    const motifs = Object.entries(preferences.seuils)
      .filter(([, seuil]) => seuil > 0)
      .map(([critereId, seuil]) => ({ critereId, note: noteDe(candidat, critereId).note, seuil }))
      .filter((m) => m.note < m.seuil)
    if (motifs.length > 0) ecartes.push({ candidat, motifs })
    else enLice.push(candidat)
  }

  // 2. Affinités.
  const affinites = new Map<string, Affinite>(
    tousCandidats.map((c) => [c.id, calculerAffinite(c, preferences.reponses)]),
  )

  // 3. Matrice de décision : critères pondérés + colonne d'affinité.
  const criteresActifs = criteres.filter((c) => (preferences.poids[c.id] ?? 0) > 0)
  const sommePoidsCriteres = criteresActifs.reduce((acc, c) => acc + preferences.poids[c.id], 0)
  const partProgramme =
    sommePoidsCriteres <= 0 ? 1 : Math.min(1, Math.max(0, preferences.partProgramme))

  const colonnes = [...criteresActifs.map((c) => c.id), COLONNE_AFFINITE]
  const poidsColonnes = [
    ...criteresActifs.map(
      (c) => (preferences.poids[c.id] / (sommePoidsCriteres || 1)) * (1 - partProgramme),
    ),
    partProgramme,
  ]

  let notesManquantes = 0
  const valeurs = enLice.map((candidat) => {
    const ligne = criteresActifs.map((c) => {
      const { note, manquante } = noteDe(candidat, c.id)
      if (manquante) notesManquantes++
      return note
    })
    ligne.push(affinites.get(candidat.id)!.score)
    return ligne
  })

  const matrice: MatriceDecision = {
    alternatives: enLice.map((c) => c.id),
    criteres: colonnes,
    valeurs,
    poids: poidsColonnes,
  }

  // 4. Scores selon les quatre méthodes.
  const methodes = Object.keys(METHODES) as MethodeAgregation[]
  const scoresParMethode = new Map<MethodeAgregation, number[]>(
    methodes.map((m) => [m, agreger(matrice, m)]),
  )
  const rangsParMethode = new Map<MethodeAgregation, number[]>(
    methodes.map((m) => [m, rangsDepuisScores(scoresParMethode.get(m)!)]),
  )

  const scoresRetenus = scoresParMethode.get(preferences.methode)!
  const poidsNormalises = normaliserPoids(poidsColonnes)

  const resultats: ResultatCandidat[] = enLice
    .map((candidat, i) => {
      const contributions: ContributionCritere[] = colonnes.map((critereId, j) => {
        const note = valeurs[i][j]
        const manquante =
          critereId !== COLONNE_AFFINITE && noteDe(candidat, critereId).manquante
        return {
          critereId,
          note,
          poidsNormalise: poidsNormalises[j],
          apport: poidsNormalises[j] * note,
          manquante,
        }
      })

      const contributionsCriteres = contributions.filter((c) => c.critereId !== COLONNE_AFFINITE)
      const poidsCriteresSeuls = contributionsCriteres.reduce((a, c) => a + c.poidsNormalise, 0)
      const scoreCriteres =
        poidsCriteresSeuls > 0
          ? contributionsCriteres.reduce((a, c) => a + c.apport, 0) / poidsCriteresSeuls
          : NOTE_NEUTRE

      const classees = [...contributions].sort((a, b) => b.apport - a.apport)
      const significatives = classees.filter((c) => c.poidsNormalise > 0.01)

      return {
        candidat,
        rang: 0,
        scoreFinal: scoresRetenus[i] * 100,
        scoreCriteres,
        affinite: affinites.get(candidat.id)!,
        contributions,
        pointsForts: significatives.filter((c) => c.note >= 65).slice(0, 3),
        pointsFaibles: significatives
          .filter((c) => c.note <= 45)
          .sort((a, b) => a.note - b.note)
          .slice(0, 3),
        scoresParMethode: Object.fromEntries(
          methodes.map((m) => [m, scoresParMethode.get(m)![i] * 100]),
        ) as Record<MethodeAgregation, number>,
        rangsParMethode: Object.fromEntries(
          methodes.map((m) => [m, rangsParMethode.get(m)![i]]),
        ) as Record<MethodeAgregation, number>,
      }
    })
    .sort((a, b) => b.scoreFinal - a.scoreFinal)
    .map((r, index) => ({ ...r, rang: index + 1 }))

  // 5. Concordance entre méthodes : moyenne des tau de Kendall deux à deux.
  let sommeTau = 0
  let paires = 0
  for (let i = 0; i < methodes.length; i++) {
    for (let j = i + 1; j < methodes.length; j++) {
      sommeTau += kendallTau(
        scoresParMethode.get(methodes[i])!,
        scoresParMethode.get(methodes[j])!,
      )
      paires++
    }
  }

  return {
    resultats,
    ecartes,
    exclus,
    sensibilite: analyserSensibilite(matrice, preferences.methode),
    matrice,
    concordanceMethodes: paires > 0 ? sommeTau / paires : 1,
    partProgramme,
    notesManquantes,
  }
}
