import type { Candidate } from '../types'
import { INSTITUTIONAL_LINKS, rating, positions } from './_helpers'

export const bertrand: Candidate = {
  id: 'bertrand',
  firstName: 'Xavier',
  lastName: 'Bertrand',
  initials: 'XB',
  party: 'Nous France',
  partyShort: 'NF',
  family: 'droite',
  partyColor: '#3b6ea5',
  birth: '1965-03-21',
  currentRole: 'Président du conseil régional des Hauts-de-France',
  candidacyStatus: 'declare',
  summary:
    "Ministre de la Santé puis du Travail sous Jacques Chirac et Nicolas Sarkozy, président des Hauts-de-France depuis 2015, il a officialisé sa candidature dès février 2024 à la tête du mouvement Nous France. Défend une droite sociale et territoriale, attentive aux classes populaires du nord de la France et frontalement opposée au Rassemblement national.",
  // Aucun compte social officiel confirmé à la date de revue : la collecte
  // s'appuie alors sur les seules sources parlementaires.
  socialAccounts: [],
  officialLinks: [
    INSTITUTIONAL_LINKS.hatvp,
    INSTITUTIONAL_LINKS.viePublique,
    INSTITUTIONAL_LINKS.journalOfficiel,
    INSTITUTIONAL_LINKS.cnccfp,
  ],
  positions: positions([1, 1, -1, -1, -1, 0, 1, -2, 1, 1, 2, 1, 0, 2, 1, 1]),
  ratedPositions: {
    decentralisation:
      "Ligne construite sur l'expérience régionale : transfert de compétences économiques et de formation aux régions.",
    interventionnisme:
      "Défend une politique industrielle active et la protection des filières, position peu commune à droite sur cet axe.",
  },
  ratings: [
    rating(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation ni procédure connue pour atteinte à la probité. Déclarations HATVP déposées au titre des fonctions ministérielles puis de la présidence de région.",
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
      "Déclarations HATVP déposées au titre des fonctions ministérielles et de la présidence de région, soumises au contrôle renforcé applicable aux membres du gouvernement.",
      ['hatvp'],
    ),
    rating(
      'experience',
      66,
      'haute',
      "Environ six années de fonctions ministérielles — Santé puis Travail — soit 24 points ; plus de dix ans à la tête de l'exécutif régional des Hauts-de-France, plafonnés à 25 points ; une dizaine d'années de mandat parlementaire, soit 15 points ; points de direction de grande organisation au titre de la présidence de région.",
      ['journal-officiel', 'vie-publique'],
    ),
    rating(
      'constance',
      74,
      'faible',
      "Ligne de droite sociale stable, et opposition constante au Rassemblement national depuis 2015. Une rupture partisane documentée : départ des Républicains en 2017, puis création de son propre mouvement.",
      ['vie-publique'],
    ),
    rating(
      'clarte-programme',
      56,
      'faible',
      "Candidature déclarée très tôt et corpus de positions abondant, mais programme présidentiel écrit, chiffré et daté encore incomplet à la date de revue.",
      ['programme-officiel', 'jdd-candidats-2027'],
    ),
    rating(
      'credibilite-budgetaire',
      50,
      'faible',
      "Aucune évaluation indépendante disponible faute de programme chiffré publié. Note neutre en attente.",
      ['ofce', 'ifrap'],
    ),
    rating(
      'etat-de-droit',
      85,
      'faible',
      "Aucune proposition affaiblissant explicitement un contre-pouvoir relevée. Le projet institutionnel porte sur la décentralisation, pas sur l'équilibre des pouvoirs nationaux.",
      ['vie-publique'],
    ),
    rating(
      'capacite-rassemblement',
      44,
      'moyenne',
      "Aucun groupe parlementaire propre depuis la création de Nous France, mais une implantation régionale forte et une expérience gouvernementale qui élargit la réserve de voix au second tour.",
      ['assemblee'],
    ),
    rating(
      'engagement-national',
      76,
      'faible',
      "Plus de vingt-cinq ans d'engagement public continu, sans interruption par une activité dans un secteur régulé. Aucun conflit d'intérêts relevé par la HATVP à la date de revue.",
      ['hatvp'],
    ),
  ],
  measures: [
    {
      id: 'bertrand-m1',
      themeId: 'institutions',
      title: 'Transfert de compétences économiques aux régions',
      detail:
        "Décentralisation de la formation professionnelle, de l'emploi et du développement économique vers les régions, avec les ressources correspondantes.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'bertrand-m2',
      themeId: 'economie',
      title: 'Politique industrielle et protection des filières',
      detail:
        "Soutien public ciblé aux filières industrielles et clauses de réciprocité dans les échanges commerciaux.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'bertrand-m3',
      themeId: 'securite',
      title: 'Renforcement de la réponse pénale',
      detail: "Fermeté sur la récidive et moyens supplémentaires pour la police et la justice.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  facts: [
    {
      id: 'bertrand-f1',
      date: '2024-02',
      title: 'Candidature déclarée pour 2027',
      description:
        "Officialise sa candidature plus de trois ans avant le scrutin, à la tête du mouvement Nous France.",
      category: 'prise-de-position',
      scope: 'majeur',
      verification: 'recoupe',
      sourceIds: ['jdd-candidats-2027', 'lcp-candidats-2027'],
    },
    {
      id: 'bertrand-f2',
      date: '2015-12',
      title: 'Élu président des Hauts-de-France',
      description:
        "Remporte la région face au Rassemblement national et en fait le socle de son implantation politique.",
      category: 'election',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'bertrand-f3',
      date: '2007',
      title: 'Ministre du Travail, puis de la Santé',
      description:
        "Occupe des fonctions ministérielles sociales sous Jacques Chirac puis Nicolas Sarkozy, dont la réforme des régimes spéciaux de retraite.",
      category: 'mandat',
      scope: 'notable',
      verification: 'a-verifier',
      sourceIds: ['journal-officiel', 'vie-publique'],
    },
  ],
  legal: [],
  indicators: [
    { id: 'bertrand-i0', label: 'Recherche d’antécédents judiciaires', value: 'Effectuée, aucun élément trouvé', period: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    { id: 'bertrand-i1', label: 'Années à la tête d’un exécutif régional', value: 'Plus de 10 ans', period: '2015-2026', verification: 'a-verifier', sourceIds: ['vie-publique'] },
  ],
  lastUpdated: '2026-08-20',
}
