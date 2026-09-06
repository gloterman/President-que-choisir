import type { Candidate } from '../types'
import { INSTITUTIONAL_LINKS, rating, positions } from './_helpers'

export const tondelier: Candidate = {
  id: 'tondelier',
  firstName: 'Marine',
  lastName: 'Tondelier',
  initials: 'MT',
  party: 'Les Écologistes',
  partyShort: 'LE',
  family: 'ecologie',
  partyColor: '#1f8a4c',
  birth: '1986-10-16',
  currentRole: 'Secrétaire nationale des Écologistes, conseillère municipale d’Hénin-Beaumont',
  candidacyStatus: 'pressenti',
  summary:
    "Élue d'opposition à Hénin-Beaumont face au Rassemblement national depuis 2014, devenue en 2022 secrétaire nationale des Écologistes. Défend une planification écologique articulée à la justice sociale et une VIᵉ République parlementaire, avec un ancrage revendiqué dans les territoires populaires.",
  socialAccounts: [
    { platform: 'x', handle: 'marinetondelier' },
  ],
  officialLinks: [
    {
      label: 'Les Écologistes — site officiel du parti',
      url: 'https://lesecologistes.fr/',
      type: 'parti',
      usage: 'Programme et prises de position officielles du mouvement.',
    },
    INSTITUTIONAL_LINKS.hatvp,
    INSTITUTIONAL_LINKS.viePublique,
  ],
  positions: positions([-1, 1, 1, 2, 1, 2, 2, 2, -2, -1, -1, -2, 2, 2, 2, 0]),
  ratedPositions: {
    'mix-energetique':
      "Sortie progressive du nucléaire et priorité au développement des renouvelables et à la sobriété.",
    'defense-alliances':
      "Soutien à l'Ukraine et à l'effort européen de défense, sans adhésion à un alignement atlantique renforcé : position médiane sur cet axe.",
  },
  ratings: [
    rating(
      'probite',
      100,
      'moyenne',
      "Aucune procédure connue pour atteinte à la probité à la date de revue. La confiance reste moyenne tant que la vérification systématique auprès des sources primaires n'a pas été conduite.",
      ['legifrance', 'hatvp'],
    ),
    rating(
      'antecedents-judiciaires',
      100,
      'moyenne',
      "Aucune condamnation connue, ni définitive ni non définitive, et aucune procédure en cours identifiée. Recherche conduite le 20 août 2026 sur les bases publiques et la presse de référence ; l'absence de résultat n'est pas une preuve d'absence, elle est datée.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    rating(
      'transparence',
      60,
      'faible',
      "Obligations déclaratives limitées faute de mandat national. Le financement du mouvement est public ; le chiffrage d'un programme présidentiel reste à publier.",
      ['hatvp', 'cnccfp'],
    ),
    rating(
      'experience',
      24,
      'haute',
      "Aucune fonction exécutive nationale ; conseillère municipale d'opposition depuis 2014, sans exécutif local, ce qui n'ouvre pas les points d'exécutif du barème ; aucun mandat parlementaire. Points attribués au titre de la direction d'un parti national. Ce profil illustre la limite du critère : il mesure les responsabilités exercées, pas l'aptitude.",
      ['vie-publique'],
    ),
    rating(
      'constance',
      88,
      'moyenne',
      "Parcours politique effectué dans une seule famille, sans changement de parti ni revirement documenté sur une position structurante.",
      ['vie-publique'],
    ),
    rating(
      'clarte-programme',
      55,
      'faible',
      "Corpus programmatique écologiste disponible et structuré, mais aucun programme présidentiel personnel chiffré et daté à la date de revue. Note appelée à évoluer fortement à la publication.",
      ['programme-officiel'],
    ),
    rating(
      'credibilite-budgetaire',
      50,
      'faible',
      "Aucune évaluation indépendante disponible faute de programme chiffré publié. Note neutre en attente, et non note de défiance.",
      ['ofce', 'institut-montaigne'],
    ),
    rating(
      'etat-de-droit',
      90,
      'faible',
      "Propositions institutionnelles orientées vers le renforcement du Parlement, de la proportionnelle et de l'indépendance de l'audiovisuel public. Aucune proposition affaiblissant un contre-pouvoir relevée.",
      ['vie-publique'],
    ),
    rating(
      'capacite-rassemblement',
      38,
      'moyenne',
      "Groupe parlementaire réduit et implantation surtout municipale dans les grandes villes. Réserve de voix réelle à gauche, mais base parlementaire étroite pour gouverner seule.",
      ['assemblee'],
    ),
    rating(
      'engagement-national',
      62,
      'faible',
      "Une quinzaine d'années d'engagement public continu, dont dix ans d'opposition municipale dans une commune tenue par le RN. Aucun conflit d'intérêts relevé, aucune dépendance financière documentée.",
      ['hatvp'],
    ),
  ],
  measures: [
    {
      id: 'tondelier-m1',
      themeId: 'ecologie',
      title: 'Plan de rénovation thermique massif du bâti',
      detail:
        "Rénovation performante de l'ensemble des passoires thermiques sur le quinquennat, financée par un fonds public dédié et un reste à charge nul pour les ménages modestes.",
      costing: { billionEurosPerYear: 20, direction: 'depense', origin: 'Ordres de grandeur du secteur' },
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'tondelier-m2',
      themeId: 'fiscalite',
      title: 'Impôt sur la fortune climatique',
      detail:
        "Rétablissement d'un impôt sur la fortune modulé selon l'empreinte carbone des patrimoines financiers.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'tondelier-m3',
      themeId: 'institutions',
      title: 'Proportionnelle intégrale aux législatives',
      detail:
        "Élection des députés à la représentation proportionnelle, assortie du non-cumul strict et d'une réforme du financement de la vie politique.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'tondelier-m4',
      themeId: 'social',
      title: 'Revenu d’autonomie pour les jeunes',
      detail: "Ouverture des minima sociaux aux 18-25 ans, sous condition de ressources.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  facts: [
    {
      id: 'tondelier-f1',
      date: '2014',
      title: 'Élue d’opposition à Hénin-Beaumont',
      description:
        "Conduit l'opposition municipale dans une commune passée au Rassemblement national, et en tire un livre-enquête sur la gestion municipale RN.",
      category: 'mandat',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'tondelier-f2',
      date: '2022-12',
      title: 'Élue secrétaire nationale des Écologistes',
      description: "Prend la tête du parti après le congrès de décembre 2022 et engage sa refondation.",
      category: 'mandat',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'tondelier-f3',
      date: '2024-06',
      title: 'Négociatrice du Nouveau Front populaire',
      description:
        "Participe à la constitution de la coalition de gauche formée en quelques jours après la dissolution de juin 2024.",
      category: 'prise-de-position',
      scope: 'notable',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
  ],
  legal: [],
  indicators: [
    { id: 'tondelier-i0', label: 'Recherche d’antécédents judiciaires', value: 'Effectuée, aucun élément trouvé', period: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    {
      id: 'tondelier-i1',
      label: 'Condamnations connues',
      value: 'Aucune',
      period: 'À la date de revue',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
    {
      id: 'tondelier-i2',
      label: 'Mandats exécutifs exercés',
      value: 'Aucun',
      period: '2014-2026',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
  ],
  lastUpdated: '2026-08-20',
}
