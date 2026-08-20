import type { Candidat } from '../types'
import { LIENS_INSTITUTIONNELS, note, positions } from './_helpers'

export const lisnard: Candidat = {
  id: 'lisnard',
  prenom: 'David',
  nom: 'Lisnard',
  initiales: 'DL',
  parti: 'Nouvelle Énergie',
  partiCourt: 'NE',
  famille: 'droite',
  couleurParti: '#1e7a8c',
  naissance: '1969-06-05',
  fonctionActuelle: 'Maire de Cannes, président de Nouvelle Énergie',
  statutCandidature: 'declare',
  presentation:
    "Maire de Cannes depuis 2014 et président de l'Association des maires de France, il a fondé Nouvelle Énergie en 2021 puis quitté Les Républicains le 31 mars 2026, jour où il a déclaré sa candidature. Défend une ligne libérale et décentralisatrice : réduction de la bureaucratie et de la dépense publique, transfert de compétences aux communes, autorité de l'État recentrée sur ses missions régaliennes.",
  liensOfficiels: [
    {
      label: 'Nouvelle Énergie — site officiel du mouvement',
      url: 'https://www.unenouvelleenergie.fr/',
      type: 'parti',
      usage: 'Programme et prises de position du candidat et de son mouvement.',
    },
    LIENS_INSTITUTIONNELS.hatvp,
    LIENS_INSTITUTIONNELS.viePublique,
    LIENS_INSTITUTIONNELS.cnccfp,
  ],
  positions: positions([2, -1, -2, -2, -2, -2, 0, -2, 1, 1, 2, 1, 1, 2, 0, 1]),
  positionsNotes: {
    decentralisation:
      "Position la plus décentralisatrice du panel : transfert de compétences et de fiscalité au bloc communal, adossé à son expérience de maire et à la présidence de l'Association des maires de France.",
    'pression-fiscale':
      "Réduction de la dépense publique et des impôts de production présentée comme le cœur du projet, avant toute autre réforme.",
  },
  notes: [
    note(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation ni procédure connue pour atteinte à la probité. Déclarations HATVP déposées au titre du mandat de maire.",
      ['legifrance', 'hatvp'],
      'recoupe',
    ),
    note(
      'antecedents-judiciaires',
      100,
      'moyenne',
      "Aucune condamnation connue, ni définitive ni non définitive. Recherche conduite le 20 août 2026 ; l'absence de résultat n'est pas une preuve d'absence, elle est datée.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    note(
      'transparence',
      75,
      'faible',
      "Déclarations HATVP déposées au titre du mandat de maire et de la présidence de l'Association des maires de France. Programme écrit publié ; le chiffrage détaillé reste à paraître.",
      ['hatvp', 'cnews-lisnard-programme'],
    ),
    note(
      'experience',
      42,
      'haute',
      "Aucune fonction exécutive nationale ni mandat parlementaire. Plus de douze ans à la tête de l'exécutif municipal d'une ville de 75 000 habitants, soit 25 points au plafond du barème ; points de direction de grande organisation au titre de la présidence de l'Association des maires de France, qui fédère 35 000 communes.",
      ['vie-publique', 'hatvp'],
    ),
    note(
      'constance',
      80,
      'faible',
      "Ligne libérale et décentralisatrice stable depuis la fondation de Nouvelle Énergie en 2021. Un changement de parti documenté et assumé publiquement en mars 2026, au départ des Républicains.",
      ['vie-publique', 'jdd-candidats-2027'],
    ),
    note(
      'clarte-programme',
      70,
      'faible',
      "Programme écrit et public, structuré autour d'axes explicites, présenté dès juillet 2026 — soit très en amont. Le chiffrage mesure par mesure et le calendrier restent partiels à la date de revue.",
      ['cnews-lisnard-programme', 'programme-officiel'],
    ),
    note(
      'credibilite-budgetaire',
      50,
      'faible',
      "Aucune évaluation indépendante disponible à la date de revue. Note neutre en attente, et non note de défiance.",
      ['ofce', 'ifrap'],
    ),
    note(
      'etat-de-droit',
      85,
      'faible',
      "Aucune proposition affaiblissant explicitement un contre-pouvoir relevée. Le projet institutionnel porte sur la répartition des compétences entre l'État et les communes, pas sur l'équilibre des pouvoirs nationaux.",
      ['vie-publique'],
    ),
    note(
      'capacite-rassemblement',
      26,
      'moyenne',
      "Mouvement récent, sans groupe parlementaire, crédité de 1 à 2 % d'intentions de vote au printemps 2026. En sens inverse, un réseau d'élus locaux dense hérité de la présidence de l'Association des maires de France.",
      ['assemblee', 'jdd-candidats-2027'],
    ),
    note(
      'engagement-national',
      68,
      'faible',
      "Plus de vingt-cinq ans d'engagement public continu, essentiellement local, sans interruption par une activité dans un secteur régulé. Aucun conflit d'intérêts relevé par la HATVP à la date de revue.",
      ['hatvp'],
    ),
  ],
  mesures: [
    {
      id: 'lisnard-m1',
      themeId: 'fiscalite',
      titre: 'Réduction de la dépense publique et des impôts de production',
      detail:
        "Baisse du poids de la dépense publique dans la richesse produite et allégement de la fiscalité pesant sur la production, présentés comme le préalable à toute autre réforme.",
      verification: 'estimation',
      sourceIds: ['cnews-lisnard-programme', 'programme-officiel'],
    },
    {
      id: 'lisnard-m2',
      themeId: 'institutions',
      titre: 'Transfert de compétences et de fiscalité aux communes',
      detail:
        "Décentralisation de compétences vers le bloc communal, assortie d'une autonomie fiscale, et réduction du nombre d'échelons et de normes.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'lisnard-m3',
      themeId: 'social',
      titre: 'Refonte de l’école autour de l’accès au savoir',
      detail:
        "« Révolution de l'école de la démocratie » : recentrage sur les savoirs fondamentaux et autonomie accrue des établissements.",
      verification: 'a-verifier',
      sourceIds: ['cnews-lisnard-programme'],
    },
    {
      id: 'lisnard-m4',
      themeId: 'securite',
      titre: 'Recentrage de l’État sur ses missions régaliennes',
      detail:
        "Renforcement des moyens de la police, de la justice et de la défense, financé par la réduction du périmètre de l'État ailleurs.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  faits: [
    {
      id: 'lisnard-f1',
      date: '2026-03-31',
      titre: 'Départ des Républicains et candidature déclarée',
      description:
        "Quitte Les Républicains en dénonçant les ambiguïtés du parti vis-à-vis du macronisme, et déclare sa candidature à la présidentielle sous la bannière de Nouvelle Énergie.",
      categorie: 'prise-de-position',
      portee: 'majeur',
      verification: 'recoupe',
      sourceIds: ['jdd-candidats-2027', 'lcp-candidats-2027'],
    },
    {
      id: 'lisnard-f2',
      date: '2021-11',
      titre: 'Élu président de l’Association des maires de France',
      description:
        "Prend la tête de l'organisation qui fédère les 35 000 communes françaises, fonction qui lui donne une audience nationale sans mandat national.",
      categorie: 'mandat',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'lisnard-f3',
      date: '2014-03',
      titre: 'Élu maire de Cannes',
      description: "Dirige l'exécutif municipal depuis 2014, réélu depuis.",
      categorie: 'election',
      portee: 'notable',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
  ],
  judiciaire: [],
  indicateurs: [
    { id: 'lisnard-i0', label: 'Recherche d’antécédents judiciaires', valeur: 'Effectuée, aucun élément trouvé', periode: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    { id: 'lisnard-i1', label: 'Années à la tête d’un exécutif local', valeur: 'Plus de 12 ans', periode: '2014-2026', verification: 'a-verifier', sourceIds: ['vie-publique'] },
    { id: 'lisnard-i2', label: 'Intentions de vote au premier tour', valeur: '1 à 2 %', periode: 'Printemps 2026', verification: 'a-verifier', sourceIds: ['jdd-candidats-2027'] },
  ],
  derniereMaj: '2026-08-20',
}
