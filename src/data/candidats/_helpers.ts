import type { Confiance, Likert, NoteCritere, Verification } from '../types'

/** Fabrique une note de critère. Par défaut la note est en attente de recoupement. */
export const note = (
  critereId: string,
  valeur: number,
  confiance: Confiance,
  justification: string,
  sourceIds: string[] = [],
  verification: Verification = 'a-verifier',
): NoteCritere => ({
  critereId,
  note: Math.round(Math.min(100, Math.max(0, valeur))),
  confiance,
  justification,
  sourceIds,
  verification,
})

/**
 * Positions sur les seize axes, dans l'ordre du référentiel.
 * L'écriture positionnelle évite les fautes de frappe sur les identifiants
 * d'axes et rend les profils comparables d'un coup d'œil dans le code source.
 */
export const ORDRE_AXES = [
  'marche-travail',
  'interventionnisme',
  'pression-fiscale',
  'redistribution',
  'retraites',
  'services-publics',
  'ambition-climat',
  'mix-energetique',
  'flux-migratoires',
  'integration-identite',
  'fermete-penale',
  'libertes-surveillance',
  'democratie-directe',
  'decentralisation',
  'souverainete-europeenne',
  'defense-alliances',
] as const

export function positions(valeurs: readonly Likert[]): Record<string, Likert> {
  if (valeurs.length !== ORDRE_AXES.length) {
    throw new Error(
      `Profil incomplet : ${valeurs.length} positions pour ${ORDRE_AXES.length} axes.`,
    )
  }
  return Object.fromEntries(ORDRE_AXES.map((axe, i) => [axe, valeurs[i]]))
}
