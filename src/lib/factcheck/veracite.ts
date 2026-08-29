import { VERDICTS, type InstantaneFactCheck, type Verdict } from '@/data/factcheck'
import type { Confiance, NoteCritere } from '@/data/types'

/**
 * Calcul de la note « Rapport aux faits » à partir des vérifications publiées.
 *
 * Le barème n'est pas réinventé ici : il est appliqué tel qu'il est écrit dans
 * le référentiel des critères, et affiché à côté de la note. C'est ce qui rend
 * le calcul contestable ligne à ligne — la propriété que tout le reste de
 * l'outil cherche à préserver.
 *
 *   Note      = part des affirmations vérifiées jugées exactes ou plutôt exactes
 *   Bonus     = +5 en cas de rectification publique après une erreur
 *   Malus     = −10 par reprise d'une affirmation déjà démentie
 *   Confiance = faible en dessous de dix vérifications
 */

const ECHANTILLON_MINIMAL = 10
const ECHANTILLON_CONFORTABLE = 20

export interface BilanVeracite {
  candidatId: string
  /** Vérifications retenues dans le calcul. */
  effectif: number
  /** Détail par verdict, y compris ceux qui ne comptent pas dans la note. */
  parVerdict: Record<Verdict, number>
  /** Nombre de citations collectées mais pas encore examinées. */
  enAttente: number
  note: number
  confiance: Confiance
  rectifications: number
  reprisesApresDementi: number
}

export function bilanVeracite(
  instantane: InstantaneFactCheck,
  candidatId: string,
): BilanVeracite | null {
  const citations = new Map(
    instantane.citations.filter((c) => c.candidatId === candidatId).map((c) => [c.id, c]),
  )
  if (citations.size === 0) return null

  const verifications = instantane.verifications.filter((v) => citations.has(v.citationId))

  const parVerdict = Object.fromEntries(
    (Object.keys(VERDICTS) as Verdict[]).map((v) => [v, 0]),
  ) as Record<Verdict, number>
  for (const verification of verifications) parVerdict[verification.verdict]++

  const enAttente = citations.size - verifications.length + parVerdict['en-attente']

  const comptees = verifications.filter((v) => VERDICTS[v.verdict].compteDansLaNote)
  if (comptees.length === 0) return null

  const exactes = comptees.filter(
    (v) => v.verdict === 'exact' || v.verdict === 'plutot-exact',
  ).length
  const rectifications = verifications.filter((v) => v.rectificationPublique).length
  const reprises = verifications.filter((v) => v.repriseApresDementi).length

  const brute = (exactes / comptees.length) * 100 + (rectifications > 0 ? 5 : 0) - reprises * 10

  return {
    candidatId,
    effectif: comptees.length,
    parVerdict,
    enAttente,
    note: Math.round(Math.min(100, Math.max(0, brute))),
    confiance:
      comptees.length >= ECHANTILLON_CONFORTABLE
        ? 'haute'
        : comptees.length >= ECHANTILLON_MINIMAL
          ? 'moyenne'
          : 'faible',
    rectifications,
    reprisesApresDementi: reprises,
  }
}

/**
 * Notes dynamiques à superposer aux notes statiques des fiches.
 *
 * En dessous de l'échantillon minimal prévu au barème, aucune note n'est
 * produite : le critère reste « non documenté » et le moteur lui substitue sa
 * valeur neutre. Publier une note sur trois vérifications serait plus
 * trompeur que de n'en publier aucune.
 */
export function notesVeraciteDynamiques(
  instantane: InstantaneFactCheck,
  candidatIds: string[],
): Record<string, NoteCritere[]> {
  const sortie: Record<string, NoteCritere[]> = {}
  for (const candidatId of candidatIds) {
    const bilan = bilanVeracite(instantane, candidatId)
    if (!bilan || bilan.effectif < ECHANTILLON_MINIMAL) continue
    sortie[candidatId] = [
      {
        critereId: 'veracite',
        note: bilan.note,
        confiance: bilan.confiance,
        justification:
          `Calculé sur ${bilan.effectif} vérification(s) publiée(s) : ` +
          `${bilan.parVerdict.exact + bilan.parVerdict['plutot-exact']} exacte(s) ou plutôt exacte(s), ` +
          `${bilan.parVerdict.trompeur} trompeuse(s), ` +
          `${bilan.parVerdict['plutot-faux'] + bilan.parVerdict.faux} fausse(s) ou plutôt fausse(s).` +
          (bilan.rectifications > 0 ? ' Bonus de rectification publique appliqué.' : '') +
          (bilan.reprisesApresDementi > 0
            ? ` Malus pour ${bilan.reprisesApresDementi} reprise(s) d’une affirmation déjà démentie.`
            : ''),
        sourceIds: [],
        verification: 'recoupe',
      },
    ]
  }
  return sortie
}

export { ECHANTILLON_MINIMAL }
