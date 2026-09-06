import { VERDICTS, type FactCheckSnapshot, type Verdict } from '@/data/factcheck'
import type { Confidence, CriterionRating } from '@/data/types'

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

const MINIMUM_SAMPLE = 10
const COMFORTABLE_SAMPLE = 20

export interface AccuracyReport {
  candidateId: string
  /** Vérifications retenues dans le calcul. */
  effective: number
  /** Détail par verdict, y compris ceux qui ne comptent pas dans la note. */
  byVerdict: Record<Verdict, number>
  /** Nombre de citations collectées mais pas encore examinées. */
  pending: number
  rating: number
  confidence: Confidence
  corrections: number
  repeatsAfterDenial: number
}

export function accuracyReport(
  snapshot: FactCheckSnapshot,
  candidateId: string,
): AccuracyReport | null {
  const quotes = new Map(
    snapshot.quotes.filter((c) => c.candidateId === candidateId).map((c) => [c.id, c]),
  )
  if (quotes.size === 0) return null

  const verifications = snapshot.verifications.filter((v) => quotes.has(v.quoteId))

  const byVerdict = Object.fromEntries(
    (Object.keys(VERDICTS) as Verdict[]).map((v) => [v, 0]),
  ) as Record<Verdict, number>
  for (const verification of verifications) byVerdict[verification.verdict]++

  const pending = quotes.size - verifications.length + byVerdict['en-attente']

  const counted = verifications.filter((v) => VERDICTS[v.verdict].countsInRating)
  if (counted.length === 0) return null

  const accurate = counted.filter(
    (v) => v.verdict === 'exact' || v.verdict === 'plutot-exact',
  ).length
  const corrections = verifications.filter((v) => v.publicCorrection).length
  const retries = verifications.filter((v) => v.repeatedAfterDenial).length

  const raw = (accurate / counted.length) * 100 + (corrections > 0 ? 5 : 0) - retries * 10

  return {
    candidateId,
    effective: counted.length,
    byVerdict,
    pending,
    rating: Math.round(Math.min(100, Math.max(0, raw))),
    confidence:
      counted.length >= COMFORTABLE_SAMPLE
        ? 'haute'
        : counted.length >= MINIMUM_SAMPLE
          ? 'moyenne'
          : 'faible',
    corrections,
    repeatsAfterDenial: retries,
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
export function dynamicAccuracyRatings(
  snapshot: FactCheckSnapshot,
  candidateIds: string[],
): Record<string, CriterionRating[]> {
  const output: Record<string, CriterionRating[]> = {}
  for (const candidateId of candidateIds) {
    const report = accuracyReport(snapshot, candidateId)
    if (!report || report.effective < MINIMUM_SAMPLE) continue
    output[candidateId] = [
      {
        criterionId: 'veracite',
        rating: report.rating,
        confidence: report.confidence,
        rationale:
          `Calculé sur ${report.effective} vérification(s) publiée(s) : ` +
          `${report.byVerdict.exact + report.byVerdict['plutot-exact']} exacte(s) ou plutôt exacte(s), ` +
          `${report.byVerdict.trompeur} trompeuse(s), ` +
          `${report.byVerdict['plutot-faux'] + report.byVerdict.faux} fausse(s) ou plutôt fausse(s).` +
          (report.corrections > 0 ? ' Bonus de rectification publique appliqué.' : '') +
          (report.repeatsAfterDenial > 0
            ? ` Malus pour ${report.repeatsAfterDenial} reprise(s) d’une affirmation déjà démentie.`
            : ''),
        sourceIds: [],
        verification: 'recoupe',
      },
    ]
  }
  return output
}

export { MINIMUM_SAMPLE }
