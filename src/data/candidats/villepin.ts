import type { Candidat } from '../types'
import { LIENS_INSTITUTIONNELS, note, positions } from './_helpers'

export const villepin: Candidat = {
  id: 'villepin',
  prenom: 'Dominique',
  nom: 'de Villepin',
  initiales: 'DdV',
  parti: 'La France humaniste',
  partiCourt: 'LFH',
  famille: 'divers',
  couleurParti: '#6b7f9e',
  naissance: '1953-11-14',
  fonctionActuelle: 'Président de La France humaniste',
  statutCandidature: 'declare',
  presentation:
    "Ministre des Affaires étrangères lors du discours de 2003 à l'ONU contre la guerre en Irak, puis Premier ministre de 2005 à 2007. Revenu au premier plan par ses positions sur la politique étrangère, il a lancé le mouvement La France humaniste pour 2027. Défend une ligne gaulliste d'indépendance diplomatique, associée à un discours social et à une hostilité marquée aux logiques de bloc.",
  // Aucun compte social officiel confirmé à la date de revue : la collecte
  // s'appuie alors sur les seules sources parlementaires.
  comptesSociaux: [],
  liensOfficiels: [
    LIENS_INSTITUTIONNELS.viePublique,
    LIENS_INSTITUTIONNELS.journalOfficiel,
    LIENS_INSTITUTIONNELS.hatvp,
  ],
  positions: positions([0, 1, 0, 1, 0, 1, 1, -1, -1, -1, 0, -1, 1, 1, 1, -2]),
  positionsNotes: {
    'defense-alliances':
      "Position la plus éloignée de l'atlantisme du panel : indépendance stratégique française et refus des alignements automatiques, dans la continuité de 2003.",
    'flux-migratoires':
      "Discours d'accueil et de responsabilité internationale, à rebours de la droite dont il est issu.",
  },
  notes: [
    note(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation pour atteinte à la probité. Poursuivi puis relaxé dans l'affaire Clearstream, relaxe confirmée en appel en 2011 : le barème ne retire aucun point pour une relaxe.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    note(
      'antecedents-judiciaires',
      100,
      'moyenne',
      "Aucune condamnation. La procédure Clearstream s'est achevée par une relaxe définitive, qui ne retire aucun point.",
      ['legifrance', 'courdecassation'],
      'recoupe',
    ),
    note(
      'transparence',
      60,
      'faible',
      "Aucune obligation déclarative en cours faute de mandat électif. Activité de conseil international exercée après 2007, dont le détail public reste partiel.",
      ['hatvp'],
    ),
    note(
      'experience',
      72,
      'haute',
      "Deux années à Matignon et environ cinq années de fonctions ministérielles régaliennes — Affaires étrangères puis Intérieur — soit le plafond de 40 points ; aucun mandat local ni parlementaire ; points maximaux d'expérience internationale, au titre de la négociation diplomatique au plus haut niveau.",
      ['journal-officiel', 'vie-publique'],
    ),
    note(
      'constance',
      86,
      'faible',
      "Ligne d'indépendance diplomatique constante depuis 2003, y compris à contre-courant de son camp d'origine. Aucun revirement structurant documenté.",
      ['vie-publique'],
    ),
    note(
      'clarte-programme',
      44,
      'faible',
      "Positions internationales abondantes et publiques, mais pas de programme présidentiel écrit, chiffré et daté à la date de revue, notamment sur les volets économique et social.",
      ['programme-officiel'],
    ),
    note(
      'credibilite-budgetaire',
      50,
      'faible',
      "Aucune évaluation indépendante disponible faute de programme chiffré. Note neutre en attente.",
      ['ofce'],
    ),
    note(
      'etat-de-droit',
      88,
      'faible',
      "Aucune proposition affaiblissant un contre-pouvoir relevée ; positions publiques répétées en faveur du droit international et des institutions multilatérales.",
      ['vie-publique'],
    ),
    note(
      'capacite-rassemblement',
      24,
      'moyenne',
      "Mouvement récent, sans élus, sans groupe parlementaire et sans implantation locale. Notoriété nationale forte mais base institutionnelle quasi nulle.",
      ['assemblee'],
    ),
    note(
      'engagement-national',
      70,
      'faible',
      "Carrière diplomatique et gouvernementale de près de trente ans, suivie d'une activité privée de conseil international — élément que le barème traite comme un point d'attention sur l'indépendance, et qui doit être documenté avant publication.",
      ['hatvp', 'hatvp-repertoire'],
    ),
  ],
  mesures: [
    {
      id: 'villepin-m1',
      themeId: 'international',
      titre: 'Indépendance stratégique et refus des logiques de bloc',
      detail:
        "Distance vis-à-vis des alignements automatiques, priorité au droit international et à la médiation, dans la continuité de la position française de 2003 sur l'Irak.",
      verification: 'estimation',
      sourceIds: ['programme-officiel', 'vie-publique'],
    },
    {
      id: 'villepin-m2',
      themeId: 'institutions',
      titre: 'Rénovation démocratique et place du Parlement',
      detail: "Revalorisation du rôle du Parlement et recours élargi à la consultation citoyenne.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'villepin-m3',
      themeId: 'social',
      titre: 'Cohésion sociale et lutte contre les fractures territoriales',
      detail:
        "Plan de réinvestissement dans les services publics des territoires les plus éloignés de l'offre existante.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  faits: [
    {
      id: 'villepin-f1',
      date: '2003-02-14',
      titre: 'Discours à l’ONU contre la guerre en Irak',
      description:
        "Comme ministre des Affaires étrangères, expose l'opposition française à l'intervention américaine devant le Conseil de sécurité. Le discours reste la référence de sa ligne diplomatique.",
      categorie: 'prise-de-position',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'villepin-f2',
      date: '2005-05-31',
      titre: 'Nommé Premier ministre',
      description:
        "Dirige le gouvernement jusqu'en mai 2007. Son mandat est marqué par la crise des banlieues de 2005 et par le retrait du contrat première embauche en 2006.",
      categorie: 'mandat',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['journal-officiel'],
    },
    {
      id: 'villepin-f3',
      date: '2011-09',
      titre: 'Relaxe définitive dans l’affaire Clearstream',
      description:
        "La cour d'appel de Paris confirme sa relaxe, mettant fin à une procédure qui avait occupé la fin des années 2000.",
      categorie: 'judiciaire',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
  ],
  judiciaire: [
    {
      id: 'villepin-j1',
      intitule: 'Affaire Clearstream',
      resume:
        "Poursuivi pour son rôle supposé dans la diffusion de listings mettant en cause des personnalités politiques. Relaxé en première instance en 2010, relaxe confirmée en appel en 2011.",
      statut: 'relaxe',
      juridiction: 'Cour d’appel de Paris',
      dateDecision: '2011-09',
      recours:
        "Relaxe définitive. Le barème de probité ne retire aucun point pour une relaxe : cette entrée figure ici parce que l'affaire est associée à son nom, et pour que l'issue soit connue.",
      verification: 'a-verifier',
      sourceIds: ['legifrance', 'courdecassation'],
    },
  ],
  indicateurs: [
    { id: 'villepin-i0', label: 'Recherche d’antécédents judiciaires', valeur: 'Effectuée, une relaxe définitive, aucune condamnation', periode: 'Au 20 août 2026', verification: 'recoupe', sourceIds: ['legifrance', 'courdecassation'] },
    { id: 'villepin-i1', label: 'Mandats électifs exercés', valeur: 'Aucun', periode: 'Carrière entière', verification: 'a-verifier', sourceIds: ['vie-publique'] },
  ],
  derniereMaj: '2026-08-20',
}
