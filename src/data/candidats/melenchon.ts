import type { Candidat } from '../types'
import { LIENS_INSTITUTIONNELS, note, positions } from './_helpers'

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
  statutCandidature: 'declare',
  presentation:
    "Figure de la gauche de rupture depuis quinze ans, trois fois candidat à la présidentielle avec une progression continue (11,1 % en 2012, 19,6 % en 2017, 21,95 % en 2022). Défend une bifurcation écologique et sociale financée par la fiscalité sur les hauts patrimoines, et la convocation d'une assemblée constituante pour une VIᵉ République.",
  comptesSociaux: [
    { plateforme: 'x', identifiant: 'JLMelenchon' },
    { plateforme: 'bluesky', identifiant: 'jlmelenchon.bsky.social' },
  ],
  liensOfficiels: [
    {
      label: 'Mélenchon 2027 — site de campagne',
      url: 'https://melenchon2027.fr/',
      type: 'candidat',
      usage: 'Programme et engagements pris par le candidat lui-même.',
    },
    {
      label: 'La France insoumise — site officiel du mouvement',
      url: 'https://lafranceinsoumise.fr/',
      type: 'parti',
      usage: 'Corpus programmatique et positions du mouvement.',
    },
    LIENS_INSTITUTIONNELS.assemblee,
    LIENS_INSTITUTIONNELS.europarl,
    LIENS_INSTITUTIONNELS.hatvp,
    LIENS_INSTITUTIONNELS.viePublique,
  ],
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
      'haute',
      "Aucune condamnation ni mise en examen personnelle pour atteinte à la probité. Deux vérifications appuient cette note : l'instruction sur les assistants parlementaires européens qui le visait a été close en mai 2026 sans aucune mise en examen le concernant, et dans l'affaire des comptes de campagne de 2017, les quatre mises en examen prononcées concernent d'autres personnes et structures, pas lui. La condamnation de décembre 2019 relève d'un autre chef — rébellion et provocation — et n'entre pas dans ce barème : elle est comptée par le critère « Antécédents judiciaires » et figure intégralement dans la section judiciaire de cette fiche.",
      ['touteleurope-melenchon-assistants', 'europe1-lfi-comptes-2017', 'legifrance'],
      'recoupe',
    ),
    note(
      'antecedents-judiciaires',
      70,
      'haute',
      "Barème appliqué : 100 points de base, moins 30 points pour une condamnation définitive — celle de décembre 2019 pour rébellion et provocation, devenue définitive faute d'appel. Aucune autre condamnation connue.",
      ['publicsenat-melenchon-perquisition', 'legifrance'],
      'recoupe',
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
      id: 'melenchon-f5',
      date: '2026-05-03',
      titre: 'Candidature déclarée pour 2027',
      description:
        "Annonce sa quatrième candidature à l'élection présidentielle, quelques jours avant la clôture de l'enquête sur les assistants parlementaires européens qui le visait.",
      categorie: 'prise-de-position',
      portee: 'majeur',
      verification: 'recoupe',
      sourceIds: ['lcp-candidats-2027', 'publicsenat-candidats-2027'],
    },
    {
      id: 'melenchon-f6',
      date: '2026-05',
      titre: 'Clôture sans mise en examen de l’instruction sur les assistants européens',
      description:
        "Après huit ans d'enquête, les juges closent l'instruction le visant dans l'affaire des assistants parlementaires européens, sans l'avoir mis en examen. Le parquet doit encore prendre ses réquisitions avant qu'un non-lieu ou un renvoi soit décidé.",
      categorie: 'judiciaire',
      portee: 'majeur',
      verification: 'recoupe',
      sourceIds: ['cnews-melenchon-instruction', 'touteleurope-melenchon-assistants'],
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
        "Poursuites engagées à la suite de la perquisition d'octobre 2018 au siège du mouvement, pour les faits survenus pendant l'opération : appel à forcer la porte et bousculade d'un représentant du parquet et d'un policier.",
      statut: 'condamnation-definitive',
      qualification:
        'Rébellion et provocation. Ces chefs ne relèvent pas des atteintes à la probité et ne modifient donc pas la note de probité ; ils sont comptés par le critère « Antécédents judiciaires ».',
      juridiction: 'Tribunal correctionnel de Bobigny',
      dateDecision: '2019-12-09',
      peine: 'Trois mois d’emprisonnement avec sursis et 8 000 euros d’amende',
      recours:
        "Aucun. Jean-Luc Mélenchon a annoncé publiquement qu'il ne ferait pas appel : la condamnation est donc devenue définitive.",
      verification: 'recoupe',
      sourceIds: ['publicsenat-melenchon-perquisition', 'aljazeera-melenchon-2019', 'legifrance'],
    },
    {
      id: 'melenchon-j2',
      intitule: 'Assistants parlementaires européens de La France insoumise',
      resume:
        "Signalement de l'Office européen de lutte antifraude en 2017, puis information judiciaire ouverte en France en 2018, portant sur l'emploi d'assistants du Parlement européen pour des activités politiques nationales.",
      statut: 'enquete',
      juridiction: 'Juges d’instruction, Paris',
      dateDecision: '2026-05',
      recours:
        "Instruction close en mai 2026 sans aucune mise en examen de Jean-Luc Mélenchon, après huit ans d'enquête. Ce n'est pas encore un non-lieu : le parquet doit prendre ses réquisitions, après quoi les juges décideront d'un non-lieu ou d'un renvoi. Deux anciens assistants conservent le statut de témoin assisté. Les sources consultées divergent sur le jour exact de la clôture, d'où une date au mois.",
      verification: 'recoupe',
      sourceIds: ['cnews-melenchon-instruction', 'touteleurope-melenchon-assistants'],
    },
    {
      id: 'melenchon-j3',
      intitule: 'Comptes de campagne de la présidentielle de 2017',
      resume:
        "Enquête ouverte en 2018 après un signalement de la CNCCFP, portant sur une possible surfacturation de prestataires liés au mouvement. Quatre mises en examen ont été prononcées, visant d'autres personnes et structures ; Jean-Luc Mélenchon n'est personnellement ni mis en examen ni placé sous statut de témoin assisté à la date de revue.",
      statut: 'enquete',
      juridiction: 'Juges d’instruction, Paris',
      recours:
        "Procédure en cours contre d'autres personnes. Cette entrée figure ici parce que l'affaire est régulièrement associée à son nom : elle ne lui est pas imputée.",
      verification: 'recoupe',
      sourceIds: ['europe1-lfi-comptes-2017', 'cnccfp'],
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
      valeur: 'Aucune',
      periode: 'Au 20 août 2026',
      verification: 'recoupe',
      sourceIds: ['touteleurope-melenchon-assistants', 'europe1-lfi-comptes-2017'],
    },
    {
      id: 'melenchon-i4',
      label: 'Condamnations définitives, toutes infractions',
      valeur: 'Une (rébellion et provocation, 2019)',
      periode: 'Au 20 août 2026',
      verification: 'recoupe',
      sourceIds: ['publicsenat-melenchon-perquisition', 'aljazeera-melenchon-2019'],
    },
  ],
  derniereMaj: '2026-08-20',
}
