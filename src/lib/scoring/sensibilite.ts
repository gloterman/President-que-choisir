import type { MatriceDecision } from './matrice'
import { normaliserPoids } from './matrice'
import { agreger } from './methodes'
import { creerRng, dirichlet } from './aleatoire'
import type { MethodeAgregation } from '@/data/types'

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

export interface ResultatSensibilite {
  alternativeId: string
  /** Probabilité d'arriver en tête sur l'ensemble des tirages, 0–1. */
  probabiliteTete: number
  /** Rang moyen (1 = premier). */
  rangMoyen: number
  /** Meilleur et pire rang atteints. */
  rangMin: number
  rangMax: number
}

export interface AnalyseSensibilite {
  resultats: ResultatSensibilite[]
  /** Probabilité que le vainqueur du classement affiché reste vainqueur. */
  stabiliteVainqueur: number
  tirages: number
  /**
   * Lecture prête à afficher de la stabilité du classement.
   */
  verdict: 'robuste' | 'nuance' | 'fragile'
}

export function analyserSensibilite(
  matrice: MatriceDecision,
  methode: MethodeAgregation,
  options: { tirages?: number; concentration?: number; graine?: number } = {},
): AnalyseSensibilite {
  const { tirages = 1000, concentration = 40, graine = 20270422 } = options
  const n = matrice.alternatives.length

  if (n === 0) {
    return { resultats: [], stabiliteVainqueur: 0, tirages: 0, verdict: 'fragile' }
  }
  if (n === 1) {
    return {
      resultats: [
        {
          alternativeId: matrice.alternatives[0],
          probabiliteTete: 1,
          rangMoyen: 1,
          rangMin: 1,
          rangMax: 1,
        },
      ],
      stabiliteVainqueur: 1,
      tirages: 0,
      verdict: 'robuste',
    }
  }

  const rng = creerRng(graine)
  const poidsBase = normaliserPoids(matrice.poids)

  const victoires = new Array<number>(n).fill(0)
  const sommeRangs = new Array<number>(n).fill(0)
  const rangMin = new Array<number>(n).fill(n)
  const rangMax = new Array<number>(n).fill(1)

  for (let t = 0; t < tirages; t++) {
    const poids = dirichlet(rng, poidsBase, concentration)
    const scores = agreger({ ...matrice, poids }, methode)
    const ordre = scores
      .map((score, i) => ({ i, score }))
      .sort((a, b) => b.score - a.score)

    ordre.forEach(({ i }, position) => {
      const rang = position + 1
      sommeRangs[i] += rang
      if (rang < rangMin[i]) rangMin[i] = rang
      if (rang > rangMax[i]) rangMax[i] = rang
    })
    victoires[ordre[0].i] += 1
  }

  const resultats: ResultatSensibilite[] = matrice.alternatives.map((id, i) => ({
    alternativeId: id,
    probabiliteTete: victoires[i] / tirages,
    rangMoyen: sommeRangs[i] / tirages,
    rangMin: rangMin[i],
    rangMax: rangMax[i],
  }))

  const scoresReference = agreger(matrice, methode)
  const indexVainqueur = scoresReference.reduce(
    (best, score, i) => (score > scoresReference[best] ? i : best),
    0,
  )
  const stabilite = victoires[indexVainqueur] / tirages

  return {
    resultats,
    stabiliteVainqueur: stabilite,
    tirages,
    verdict: stabilite >= 0.7 ? 'robuste' : stabilite >= 0.45 ? 'nuance' : 'fragile',
  }
}
