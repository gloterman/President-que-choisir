import type { Candidat } from '../types'
import { note, positions } from './_helpers'

export const melenchon: Candidat = {
  id: 'melenchon',
  prenom: 'Jean-Luc',
  nom: 'Mélenchon',
  initiales: 'JLM',
  parti: 'La France insoumise',
  partiCourt: 'LFI',
  famille: 'gauche-radicale',
  couleurParti: '#c9462c',
  naissance: '1951-08-19',
  fonctionActuelle: 'Fondateur de La France insoumise',
  statutCandidature: 'pressenti',
  presentation:
    "Figure de la gauche de rupture depuis quinze ans, trois fois candidat à la présidentielle avec une progression continue (11,1 % en 2012, 19,6 % en 2017, 21,95 % en 2022). Défend une bifurcation écologique et sociale financée par la fiscalité sur les hauts patrimoines, et la convocation d'une assemblée constituante pour une VIᵉ République.",
  positions: positions([
    -2, 2, 2, 2, 2, 2, 2, 2, -2, -2, -1, -2, 2, 0, -1, -2,
  ]),
  positionsNotes: {
    'souverainete-europeenne':
      "Ne demande pas la sortie de l'Union européenne mais la désobéissance aux traités jugés contraires au programme : position intermédiaire sur cet axe, et non un pôle.",
    retraites: 'Retraite à 60 ans à taux plein après 40 annuités, présentée comme une mesure de premier mandat.',
    'fermete-penale':
      "Position composite : refus des peines planchers et priorité à la prévention, mais renforcement annoncé des moyens de la police judiciaire.",
  },
  notes: [
    note(
      'probite',
      100,
      'moyenne',
      "Aucune condamnation pour atteinte à la probité connue à la date de revue. La condamnation prononcée en décembre 2019 relève d'un autre chef (rébellion, provocation) et n'entre pas dans le barème de ce critère : elle figure intégralement dans la section judiciaire de cette fiche.",
      ['legifrance', 'hatvp'],
    ),
    note(
      'transparence',
      70,
      'moyenne',
      "Déclarations HATVP déposées au titre des mandats parlementaires successifs. Le chiffrage du programme 2022 avait été publié dans un livret dédié ; l'équivalent pour 2027 reste à paraître.",
      ['hatvp', 'cnccfp'],
    ),
    note(
      'experience',
      36,
      'haute',
      "Environ 2 ans d'exécutif national (ministre délégué à l'Enseignement professionnel, 2000-2002) soit 8 points ; aucun exécutif local ; plus de trente ans de mandats parlementaires (Sénat, Parlement européen, Assemblée nationale) plafonnés à 20 points ; 8 points pour la direction d'un mouvement national. Le plafond du barème sur les mandats parlementaires pèse lourd sur ce profil.",
      ['vie-publique', 'assemblee', 'senat'],
    ),
    note(
      'constance',
      76,
      'moyenne',
      "Ligne programmatique stable depuis la fondation du Parti de gauche en 2008. Le principal point d'inflexion documenté porte sur l'Europe, passé de la sortie de l'euro évoquée en 2017 à la désobéissance aux traités, changement assumé et argumenté publiquement — donc pénalisé au demi-tarif prévu par le barème. Deux changements de famille politique au cours de la carrière (PS puis Parti de gauche).",
      ['vie-publique'],
    ),
    note(
      'clarte-programme',
      82,
      'moyenne',
      "L'Avenir en commun est un programme écrit, public, structuré en livrets thématiques et chiffré mesure par mesure : les quatre composantes du barème sont réunies. La précision du véhicule juridique est inégale pour les mesures supposant une renégociation européenne.",
      ['programme-officiel'],
    ),
    note(
      'credibilite-budgetaire',
      45,
      'faible',
      "Les évaluations indépendantes du programme 2022 concluaient à un écart de financement significatif, avec une dispersion très large entre évaluateurs selon les hypothèses de recettes retenues sur la fiscalité du capital. Note à recalculer sur le programme 2027 dès sa publication.",
      ['institut-montaigne', 'ofce', 'ifrap'],
    ),
    note(
      'etat-de-droit',
      70,
      'faible',
      "Le projet d'assemblée constituante et de VIᵉ République réorganise les pouvoirs sans les supprimer, et renforce explicitement le Parlement et le référendum. En sens inverse, plusieurs mises en cause publiques et personnelles de magistrats sont documentées. Critère signalé comme contestable : sa lecture dépend de ce que l'on considère comme un contre-pouvoir légitime.",
      ['vie-publique'],
    ),
    note(
      'capacite-rassemblement',
      55,
      'moyenne',
      "Groupe parlementaire important et implantation urbaine solide, mais réserve de voix limitée au second tour selon les enquêtes d'opinion successives, et alliances à gauche instables depuis 2024.",
      ['assemblee'],
    ),
    note(
      'engagement-national',
      74,
      'faible',
      "Plus de quarante ans d'engagement public continu (enseignement, syndicalisme étudiant, mandats électifs), sans interruption par une activité privée dans un secteur régulé. Aucun conflit d'intérêts relevé par la HATVP à la date de revue.",
      ['hatvp', 'vie-publique'],
    ),
  ],
  mesures: [
    {
      id: 'melenchon-m1',
      themeId: 'social',
      titre: 'Retraite à 60 ans après 40 annuités de cotisation',
      detail:
        "Abrogation de la réforme de 2023 et retour à un âge légal de 60 ans, financé par l'élargissement de l'assiette des cotisations et la mise à contribution des revenus du capital.",
      chiffrage: { montantMdEurosAn: 70, sens: 'depense', origine: 'Estimations publiées lors de la campagne 2022' },
      horizon: 'Premier semestre du mandat',
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'melenchon-m2',
      themeId: 'fiscalite',
      titre: 'Impôt sur la fortune rétabli et progressivité renforcée',
      detail:
        "Rétablissement d'un ISF élargi assorti d'un volet climatique, retour à quatorze tranches d'impôt sur le revenu et taxation des superprofits.",
      chiffrage: { montantMdEurosAn: 25, sens: 'recette', origine: 'Chiffrage du candidat' },
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'melenchon-m3',
      themeId: 'institutions',
      titre: 'Convocation d’une assemblée constituante',
      detail:
        "Élection d'une assemblée chargée de rédiger une constitution de VIᵉ République soumise à référendum, avec instauration d'un référendum d'initiative citoyenne et du droit de révoquer les élus.",
      horizon: 'Dès les premiers mois',
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'melenchon-m4',
      themeId: 'ecologie',
      titre: 'Planification écologique et sortie programmée du nucléaire',
      detail:
        "Objectif de 100 % d'énergies renouvelables à l'horizon 2050, arrêt des projets de nouveaux réacteurs et plan de rénovation thermique de sept millions de logements.",
      chiffrage: { montantMdEurosAn: 40, sens: 'depense', origine: 'Chiffrage du candidat' },
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'melenchon-m5',
      themeId: 'economie',
      titre: 'SMIC porté à 1 600 euros nets et blocage des prix de première nécessité',
      detail:
        "Revalorisation immédiate du salaire minimum, indexation des salaires sur l'inflation et blocage des prix sur un panier de biens essentiels.",
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
  ],
  faits: [
    {
      id: 'melenchon-f1',
      date: '2022-04-10',
      titre: 'Troisième place au premier tour de la présidentielle',
      description:
        "21,95 % des suffrages exprimés, à environ 400 000 voix de la qualification pour le second tour. Meilleur score de sa carrière présidentielle.",
      categorie: 'election',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'melenchon-f2',
      date: '2022-05',
      titre: 'Artisan de la NUPES',
      description:
        "Négocie l'union des gauches pour les législatives de 2022, qui devient le premier groupe d'opposition à l'Assemblée nationale. La coalition se disloque au cours de la législature suivante.",
      categorie: 'mandat',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['assemblee'],
    },
    {
      id: 'melenchon-f3',
      date: '2018-10-16',
      titre: 'Perquisition au siège de La France insoumise',
      description:
        "Perquisition dans le cadre d'enquêtes visant les comptes de campagne de 2017 et les assistants parlementaires européens du mouvement. La scène, filmée, donne lieu à des poursuites pour rébellion.",
      categorie: 'judiciaire',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
    {
      id: 'melenchon-f4',
      date: '2000',
      titre: 'Ministre délégué à l’Enseignement professionnel (2000-2002)',
      description:
        "Seule expérience gouvernementale, dans le gouvernement de Lionel Jospin. Porte notamment la validation des acquis de l'expérience.",
      categorie: 'mandat',
      portee: 'notable',
      verification: 'a-verifier',
      sourceIds: ['journal-officiel', 'vie-publique'],
    },
  ],
  judiciaire: [
    {
      id: 'melenchon-j1',
      intitule: 'Perquisition du siège de La France insoumise',
      resume:
        "Poursuites engagées à la suite de la perquisition d'octobre 2018 au siège du mouvement, pour les faits survenus pendant l'opération.",
      statut: 'condamnation-non-definitive',
      qualification: 'Rébellion et provocation. Ces chefs ne relèvent pas des atteintes à la probité.',
      juridiction: 'Tribunal correctionnel de Bobigny',
      dateDecision: '2019-12-09',
      peine: 'Trois mois d’emprisonnement avec sursis et amende, en première instance',
      recours: 'Suites données en appel à vérifier sur source primaire avant publication.',
      verification: 'a-verifier',
      sourceIds: ['legifrance', 'decodeurs'],
    },
  ],
  indicateurs: [
    {
      id: 'melenchon-i1',
      label: 'Score au premier tour de la présidentielle',
      valeur: '21,95 %',
      periode: '2022',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'melenchon-i2',
      label: 'Années de mandat électif',
      valeur: 'Environ 35 ans',
      periode: '1983-2022',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'melenchon-i3',
      label: 'Condamnations définitives pour atteinte à la probité',
      valeur: 'Aucune connue',
      periode: 'À la date de revue',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
  ],
  derniereMaj: '2026-08-20',
}
