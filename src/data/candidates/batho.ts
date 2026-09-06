import type { Candidate } from '../types'
import { INSTITUTIONAL_LINKS, rating, positions } from './_helpers'

export const batho: Candidate = {
  id: 'batho',
  firstName: 'Delphine',
  lastName: 'Batho',
  initials: 'DB',
  party: 'Génération Écologie',
  partyShort: 'GE',
  family: 'ecologie',
  partyColor: '#2f8f5b',
  birth: '1973-03-23',
  currentRole: 'Députée des Deux-Sèvres, présidente de Génération Écologie',
  candidacyStatus: 'declare',
  summary:
    "Députée des Deux-Sèvres, ministre de l'Écologie en 2012-2013 — fonction qu'elle a quittée après avoir critiqué publiquement le budget de son ministère —, elle a déclaré sa candidature le 25 novembre 2025. Porte une écologie de rupture assumée, articulée autour de la sobriété et de la remise en cause de la croissance comme objectif.",
  // Aucun compte social officiel confirmé à la date de revue : la collecte
  // s'appuie alors sur les seules sources parlementaires.
  socialAccounts: [],
  officialLinks: [
    INSTITUTIONAL_LINKS.assemblee,
    INSTITUTIONAL_LINKS.hatvp,
    INSTITUTIONAL_LINKS.viePublique,
  ],
  positions: positions([-1, 2, 2, 2, 1, 2, 2, 2, -1, -1, -1, -2, 2, 1, 1, -1]),
  ratedPositions: {
    'ambition-climat':
      "Position de rupture : remise en cause de la croissance comme objectif, au-delà de la seule planification écologique.",
    'mix-energetique':
      "Sortie du nucléaire et priorité à la sobriété, position constante depuis son passage au ministère.",
  },
  ratings: [
    rating(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation ni procédure connue pour atteinte à la probité. Déclarations HATVP déposées au titre du mandat de députée et des fonctions ministérielles.",
      ['legifrance', 'hatvp'],
      'recoupe',
    ),
    rating(
      'antecedents-judiciaires',
      100,
      'moyenne',
      "Aucune condamnation connue, ni définitive ni non définitive. Recherche conduite le 20 août 2026 ; l'absence de résultat n'est pas une preuve d'absence, elle est datée.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    rating(
      'transparence',
      78,
      'faible',
      "Déclarations HATVP déposées au titre du mandat parlementaire et des fonctions ministérielles. Comptes de campagne déposés.",
      ['hatvp', 'cnccfp'],
    ),
    rating(
      'experience',
      38,
      'haute',
      "Environ une année de fonction ministérielle — Écologie, 2012-2013 — soit 4 points ; aucun exécutif local ; près de vingt ans de mandat parlementaire, plafonnés à 20 points ; points de direction d'organisation au titre de la présidence de Génération Écologie.",
      ['assemblee', 'journal-officiel'],
    ),
    rating(
      'constance',
      90,
      'faible',
      "Ligne écologiste stable et documentée, y compris au prix de sa fonction ministérielle en 2013. Aucun revirement structurant relevé ; un changement de famille politique, du Parti socialiste vers l'écologie politique, assumé publiquement.",
      ['vie-publique'],
    ),
    rating(
      'clarte-programme',
      58,
      'faible',
      "Candidature déclarée tôt et corpus écologiste structuré, mais programme présidentiel chiffré et daté encore incomplet à la date de revue.",
      ['programme-officiel', 'jdd-candidats-2027'],
    ),
    rating(
      'credibilite-budgetaire',
      50,
      'faible',
      "Aucune évaluation indépendante disponible faute de programme chiffré. Note neutre en attente.",
      ['ofce'],
    ),
    rating(
      'etat-de-droit',
      88,
      'faible',
      "Aucune proposition affaiblissant un contre-pouvoir relevée. Propositions institutionnelles orientées vers la participation citoyenne et le contrôle parlementaire.",
      ['vie-publique', 'assemblee'],
    ),
    rating(
      'capacite-rassemblement',
      22,
      'moyenne',
      "Parti sans groupe parlementaire propre et implantation locale très limitée. La candidature se situe hors du processus de primaire qui structure le reste de la gauche.",
      ['assemblee'],
    ),
    rating(
      'engagement-national',
      74,
      'faible',
      "Plus de vingt-cinq ans d'engagement public continu, du militantisme associatif au mandat parlementaire, sans interruption par une activité dans un secteur régulé. Aucun conflit d'intérêts relevé.",
      ['hatvp'],
    ),
  ],
  measures: [
    {
      id: 'batho-m1',
      themeId: 'ecologie',
      title: 'Sobriété inscrite comme objectif de politique publique',
      detail:
        "Substitution d'indicateurs de sobriété et de bien-être à la croissance du produit intérieur brut comme boussole de l'action publique.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'batho-m2',
      themeId: 'ecologie',
      title: 'Sortie programmée du nucléaire et des énergies fossiles',
      detail:
        "Arrêt des projets de nouveaux réacteurs, développement des renouvelables et réduction de la demande énergétique.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'batho-m3',
      themeId: 'fiscalite',
      title: 'Fiscalité écologique redistributive',
      detail:
        "Taxation des patrimoines et des activités les plus émettrices, avec redistribution vers les ménages modestes.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  facts: [
    {
      id: 'batho-f1',
      date: '2025-11-25',
      title: 'Candidature déclarée pour 2027',
      description:
        "Annonce sa candidature à l'élection présidentielle, hors du processus de primaire de la gauche.",
      category: 'prise-de-position',
      scope: 'majeur',
      verification: 'recoupe',
      sourceIds: ['jdd-candidats-2027', 'publicsenat-candidats-2027'],
    },
    {
      id: 'batho-f2',
      date: '2013-07',
      title: 'Quitte le ministère de l’Écologie après une critique budgétaire',
      description:
        "Perd ses fonctions ministérielles après avoir qualifié publiquement de mauvais le budget alloué à son ministère.",
      category: 'controverse',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['journal-officiel', 'vie-publique'],
    },
    {
      id: 'batho-f3',
      date: '2007-06',
      title: 'Élue députée des Deux-Sèvres',
      description: "Siège à l'Assemblée nationale depuis 2007, avec une interruption ministérielle.",
      category: 'election',
      scope: 'notable',
      verification: 'a-verifier',
      sourceIds: ['assemblee'],
    },
  ],
  legal: [],
  indicators: [
    { id: 'batho-i0', label: 'Recherche d’antécédents judiciaires', value: 'Effectuée, aucun élément trouvé', period: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    { id: 'batho-i1', label: 'Années de mandat parlementaire', value: 'Près de 20 ans', period: '2007-2026', verification: 'a-verifier', sourceIds: ['assemblee'] },
  ],
  lastUpdated: '2026-08-20',
}
