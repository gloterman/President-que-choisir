import type { Candidate } from '../types'
import { INSTITUTIONAL_LINKS, rating, positions } from './_helpers'

export const villepin: Candidate = {
  id: 'villepin',
  firstName: 'Dominique',
  lastName: 'de Villepin',
  initials: 'DdV',
  party: 'La France humaniste',
  partyShort: 'LFH',
  family: 'divers',
  partyColor: '#6b7f9e',
  birth: '1953-11-14',
  currentRole: 'Président de La France humaniste',
  candidacyStatus: 'declare',
  summary:
    "Ministre des Affaires étrangères lors du discours de 2003 à l'ONU contre la guerre en Irak, puis Premier ministre de 2005 à 2007. Revenu au premier plan par ses positions sur la politique étrangère, il a lancé le mouvement La France humaniste pour 2027. Défend une ligne gaulliste d'indépendance diplomatique, associée à un discours social et à une hostilité marquée aux logiques de bloc.",
  // Aucun compte social officiel confirmé à la date de revue : la collecte
  // s'appuie alors sur les seules sources parlementaires.
  socialAccounts: [],
  officialLinks: [
    INSTITUTIONAL_LINKS.viePublique,
    INSTITUTIONAL_LINKS.journalOfficiel,
    INSTITUTIONAL_LINKS.hatvp,
  ],
  positions: positions([0, 1, 0, 1, 0, 1, 1, -1, -1, -1, 0, -1, 1, 1, 1, -2]),
  ratedPositions: {
    'defense-alliances':
      "Position la plus éloignée de l'atlantisme du panel : indépendance stratégique française et refus des alignements automatiques, dans la continuité de 2003.",
    'flux-migratoires':
      "Discours d'accueil et de responsabilité internationale, à rebours de la droite dont il est issu.",
  },
  ratings: [
    rating(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation pour atteinte à la probité. Poursuivi puis relaxé dans l'affaire Clearstream, relaxe confirmée en appel en 2011 : le barème ne retire aucun point pour une relaxe.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    rating(
      'antecedents-judiciaires',
      100,
      'moyenne',
      "Aucune condamnation. La procédure Clearstream s'est achevée par une relaxe définitive, qui ne retire aucun point.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    rating(
      'transparence',
      60,
      'faible',
      "Aucune obligation déclarative en cours faute de mandat électif. Activité de conseil international exercée après 2007, dont le détail public reste partiel.",
      ['hatvp'],
    ),
    rating(
      'experience',
      72,
      'haute',
      "Deux années à Matignon et environ cinq années de fonctions ministérielles régaliennes — Affaires étrangères puis Intérieur — soit le plafond de 40 points ; aucun mandat local ni parlementaire ; points maximaux d'expérience internationale, au titre de la négociation diplomatique au plus haut niveau.",
      ['journal-officiel', 'vie-publique'],
    ),
    rating(
      'constance',
      86,
      'faible',
      "Ligne d'indépendance diplomatique constante depuis 2003, y compris à contre-courant de son camp d'origine. Aucun revirement structurant documenté.",
      ['vie-publique'],
    ),
    rating(
      'clarte-programme',
      44,
      'faible',
      "Positions internationales abondantes et publiques, mais pas de programme présidentiel écrit, chiffré et daté à la date de revue, notamment sur les volets économique et social.",
      ['programme-officiel'],
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
      "Aucune proposition affaiblissant un contre-pouvoir relevée ; positions publiques répétées en faveur du droit international et des institutions multilatérales.",
      ['vie-publique'],
    ),
    rating(
      'capacite-rassemblement',
      24,
      'moyenne',
      "Mouvement récent, sans élus, sans groupe parlementaire et sans implantation locale. Notoriété nationale forte mais base institutionnelle quasi nulle.",
      ['assemblee'],
    ),
    rating(
      'engagement-national',
      70,
      'faible',
      "Carrière diplomatique et gouvernementale de près de trente ans, suivie d'une activité privée de conseil international — élément que le barème traite comme un point d'attention sur l'indépendance, et qui doit être documenté avant publication.",
      ['hatvp', 'hatvp-repertoire'],
    ),
  ],
  measures: [
    {
      id: 'villepin-m1',
      themeId: 'international',
      title: 'Indépendance stratégique et refus des logiques de bloc',
      detail:
        "Distance vis-à-vis des alignements automatiques, priorité au droit international et à la médiation, dans la continuité de la position française de 2003 sur l'Irak.",
      verification: 'estimation',
      sourceIds: ['programme-officiel', 'vie-publique'],
    },
    {
      id: 'villepin-m2',
      themeId: 'institutions',
      title: 'Rénovation démocratique et place du Parlement',
      detail: "Revalorisation du rôle du Parlement et recours élargi à la consultation citoyenne.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'villepin-m3',
      themeId: 'social',
      title: 'Cohésion sociale et lutte contre les fractures territoriales',
      detail:
        "Plan de réinvestissement dans les services publics des territoires les plus éloignés de l'offre existante.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  facts: [
    {
      id: 'villepin-f1',
      date: '2003-02-14',
      title: 'Discours à l’ONU contre la guerre en Irak',
      description:
        "Comme ministre des Affaires étrangères, expose l'opposition française à l'intervention américaine devant le Conseil de sécurité. Le discours reste la référence de sa ligne diplomatique.",
      category: 'prise-de-position',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'villepin-f2',
      date: '2005-05-31',
      title: 'Nommé Premier ministre',
      description:
        "Dirige le gouvernement jusqu'en mai 2007. Son mandat est marqué par la crise des banlieues de 2005 et par le retrait du contrat première embauche en 2006.",
      category: 'mandat',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['journal-officiel'],
    },
    {
      id: 'villepin-f3',
      date: '2011-09',
      title: 'Relaxe définitive dans l’affaire Clearstream',
      description:
        "La cour d'appel de Paris confirme sa relaxe, mettant fin à une procédure qui avait occupé la fin des années 2000.",
      category: 'judiciaire',
      scope: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
  ],
  legal: [
    {
      id: 'villepin-j1',
      label: 'Affaire Clearstream',
      summary:
        "Poursuivi pour son rôle supposé dans la diffusion de listings mettant en cause des personnalités politiques. Relaxé en première instance en 2010, relaxe confirmée en appel en 2011.",
      status: 'relaxe',
      short: 'Cour d’appel de Paris',
      decisionDate: '2011-09',
      appeal:
        "Relaxe définitive. Le barème de probité ne retire aucun point pour une relaxe : cette entrée figure ici parce que l'affaire est associée à son nom, et pour que l'issue soit connue.",
      verification: 'a-verifier',
      sourceIds: ['legifrance', 'courdecassation'],
    },
  ],
  indicators: [
    { id: 'villepin-i0', label: 'Recherche d’antécédents judiciaires', value: 'Effectuée, une relaxe définitive, aucune condamnation', period: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    { id: 'villepin-i1', label: 'Mandats électifs exercés', value: 'Aucun', period: 'Carrière entière', verification: 'a-verifier', sourceIds: ['vie-publique'] },
  ],
  lastUpdated: '2026-08-20',
}
