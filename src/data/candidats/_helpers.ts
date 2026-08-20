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

/**
 * Liens institutionnels réutilisables.
 *
 * Ce sont des annuaires et des portails, pas des fiches nominatives : le lien
 * profond vers la fiche d'une personne exige de relever son identifiant sur le
 * site concerné, ce qui fait partie du travail de vérification décrit dans
 * `docs/DONNEES.md`. Mieux vaut un point d'entrée exact qu'une URL devinée.
 */
export const LIENS_INSTITUTIONNELS = {
  hatvp: {
    label: 'Déclarations de patrimoine et d’intérêts (HATVP)',
    url: 'https://www.hatvp.fr/consulter-les-declarations/',
    type: 'institution' as const,
    usage: 'Vérifier le patrimoine déclaré, les intérêts et les activités annexes.',
  },
  assemblee: {
    label: 'Fiche de député (Assemblée nationale)',
    url: 'https://www.assemblee-nationale.fr/dyn/deputes',
    type: 'institution' as const,
    usage: 'Vérifier les mandats, les votes, les textes déposés et la participation.',
  },
  senat: {
    label: 'Fiche de sénateur (Sénat)',
    url: 'https://www.senat.fr/senateurs/senatl.html',
    type: 'institution' as const,
    usage: 'Vérifier les mandats, les votes et les travaux en commission.',
  },
  europarl: {
    label: 'Fiche de député européen (Parlement européen)',
    url: 'https://www.europarl.europa.eu/meps/fr/home',
    type: 'institution' as const,
    usage: 'Vérifier les mandats européens, les votes et les rapports.',
  },
  viePublique: {
    label: 'Biographie et discours publics (vie-publique.fr)',
    url: 'https://www.vie-publique.fr/',
    type: 'institution' as const,
    usage: 'Vérifier le parcours institutionnel et retrouver les discours officiels.',
  },
  cnccfp: {
    label: 'Comptes de campagne (CNCCFP)',
    url: 'https://www.cnccfp.fr/',
    type: 'institution' as const,
    usage: 'Vérifier le financement des campagnes et les décisions sur les comptes.',
  },
  legifrance: {
    label: 'Textes et jurisprudence (Légifrance)',
    url: 'https://www.legifrance.gouv.fr/',
    type: 'institution' as const,
    usage: 'Retrouver les textes portés ou les décisions publiées.',
  },
} satisfies Record<string, { label: string; url: string; type: 'institution'; usage: string }>
