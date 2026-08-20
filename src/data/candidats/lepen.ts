import type { Candidat } from '../types'
import { note, positions } from './_helpers'

export const lepen: Candidat = {
  id: 'lepen',
  prenom: 'Marine',
  nom: 'Le Pen',
  initiales: 'MLP',
  parti: 'Rassemblement national',
  partiCourt: 'RN',
  famille: 'droite-nationale',
  couleurParti: '#1d3f6e',
  naissance: '1968-08-05',
  fonctionActuelle: 'Députée du Pas-de-Calais',
  statutCandidature: 'hypothetique',
  presentation:
    "Trois fois candidate à la présidentielle, qualifiée au second tour en 2017 et 2022 avec 41,45 % des suffrages exprimés. Condamnée en première instance en mars 2025 dans l'affaire des assistants parlementaires européens, avec une peine d'inéligibilité assortie de l'exécution provisoire : sa capacité à se présenter en 2027 dépend de l'issue de l'appel.",
  positions: positions([0, 2, -1, 1, 2, 1, -1, -2, 2, 2, 2, 1, 2, -1, -2, -1]),
  positionsNotes: {
    'souverainete-europeenne':
      "Ne demande plus la sortie de l'euro ni de l'Union depuis 2017, mais revendique la primauté du droit national et une renégociation des traités.",
    redistribution: "Ligne sociale sur le pouvoir d'achat, associée à une préférence nationale dans l'accès aux prestations.",
  },
  notes: [
    note(
      'probite',
      75,
      'moyenne',
      "Barème appliqué : 100 points de base, moins 25 points pour une condamnation non définitive, frappée d'appel, pour détournement de fonds publics (jugement du 31 mars 2025). Aucune condamnation définitive pour atteinte à la probité à la date de revue : la présomption d'innocence demeure jusqu'à l'épuisement des voies de recours.",
      ['legifrance', 'courdecassation'],
    ),
    note(
      'transparence',
      65,
      'faible',
      "Déclarations HATVP déposées au titre des mandats. Points retirés au titre de décisions défavorables rendues sur le financement de campagnes du mouvement, à recouper auprès de la CNCCFP avant publication.",
      ['hatvp', 'cnccfp'],
    ),
    note(
      'experience',
      38,
      'haute',
      "Aucune fonction exécutive nationale ni locale. Plus de vingt ans de mandats parlementaires — Parlement européen puis Assemblée nationale — plafonnés à 20 points ; points de direction de grande organisation au titre de la présidence du mouvement pendant plus d'une décennie ; points d'expérience internationale au titre du mandat européen.",
      ['assemblee', 'vie-publique'],
    ),
    note(
      'constance',
      64,
      'faible',
      "Plusieurs inflexions majeures documentées et assumées publiquement : abandon de la sortie de l'euro après 2017, évolution sur la retraite à 60 ans, révision de la position sur l'OTAN. Ligne migratoire et régalienne inchangée depuis 2011.",
      ['vie-publique'],
    ),
    note(
      'clarte-programme',
      62,
      'faible',
      "Programmes présidentiels antérieurs écrits, publics et partiellement chiffrés. Aucun programme 2027 publié à la date de revue.",
      ['programme-officiel'],
    ),
    note(
      'credibilite-budgetaire',
      42,
      'faible',
      "Les évaluations indépendantes des programmes de 2017 et 2022 relevaient un écart de financement significatif et des hypothèses de recettes jugées non étayées par plusieurs évaluateurs. Note à recalculer sur le programme 2027.",
      ['institut-montaigne', 'ofce', 'ifrap'],
    ),
    note(
      'etat-de-droit',
      45,
      'faible',
      "Plusieurs propositions structurantes touchent aux contre-pouvoirs : révision constitutionnelle pour instaurer la priorité nationale, primauté du droit national sur les engagements européens, recours au référendum pour contourner la censure constitutionnelle. Le barème les compte comme des affaiblissements. Critère signalé comme contestable : la souveraineté populaire peut être invoquée en sens inverse.",
      ['vie-publique', 'legifrance'],
    ),
    note(
      'capacite-rassemblement',
      66,
      'moyenne',
      "Premier groupe d'opposition à l'Assemblée nationale et implantation locale en forte progression, mais alliances formalisées rares et réserve de voix historiquement limitée au second tour, même si l'écart s'est resserré.",
      ['assemblee'],
    ),
    note(
      'engagement-national',
      70,
      'faible',
      "Plus de vingt-cinq ans d'engagement public continu. Points retirés au titre de l'indépendance financière : les prêts contractés par le mouvement auprès d'établissements étrangers sont documentés et entrent dans le barème, ce qui reste un choix méthodologique discutable.",
      ['hatvp', 'cnccfp'],
    ),
  ],
  mesures: [
    {
      id: 'lepen-m1',
      themeId: 'immigration',
      titre: 'Priorité nationale inscrite dans la Constitution',
      detail:
        "Révision constitutionnelle par référendum instaurant une préférence nationale pour l'accès à l'emploi, au logement social et aux prestations non contributives.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'lepen-m2',
      themeId: 'fiscalite',
      titre: 'TVA réduite sur l’énergie et les carburants',
      detail: "Abaissement du taux de TVA sur les produits énergétiques, présenté comme une mesure de pouvoir d'achat.",
      chiffrage: { montantMdEurosAn: 12, sens: 'depense', origine: 'Chiffrage repris des campagnes précédentes' },
      verification: 'a-verifier',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'lepen-m3',
      themeId: 'social',
      titre: 'Abrogation de la réforme des retraites',
      detail: "Retour à 62 ans et départ anticipé pour les carrières longues.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
    {
      id: 'lepen-m4',
      themeId: 'ecologie',
      titre: 'Moratoire sur l’éolien et relance du nucléaire',
      detail: "Arrêt des nouveaux projets éoliens, démantèlement progressif de certains parcs et programme de nouveaux réacteurs.",
      verification: 'estimation',
      sourceIds: ['programme-officiel'],
    },
  ],
  faits: [
    {
      id: 'lepen-f1',
      date: '2022-04-24',
      titre: 'Second tour de la présidentielle',
      description: "Obtient 41,45 % des suffrages exprimés, meilleur score de son camp à une élection présidentielle.",
      categorie: 'election',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
    {
      id: 'lepen-f2',
      date: '2025-03-31',
      titre: 'Condamnation en première instance et inéligibilité',
      description:
        "Le tribunal correctionnel de Paris la condamne dans l'affaire des assistants parlementaires européens et prononce une peine d'inéligibilité assortie de l'exécution provisoire. Un appel est interjeté.",
      categorie: 'judiciaire',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['legifrance'],
    },
    {
      id: 'lepen-f3',
      date: '2011',
      titre: 'Présidence du mouvement et dédiabolisation (2011-2021)',
      description:
        "Dirige le Front national puis le Rassemblement national et conduit une stratégie de normalisation qui aboutit à une forte progression électorale.",
      categorie: 'mandat',
      portee: 'majeur',
      verification: 'a-verifier',
      sourceIds: ['vie-publique'],
    },
  ],
  judiciaire: [
    {
      id: 'lepen-j1',
      intitule: 'Assistants parlementaires européens du Rassemblement national',
      resume:
        "Affaire portant sur l'emploi présumé d'assistants rémunérés par le Parlement européen pour des tâches relevant du parti national, sur la période 2004-2016.",
      statut: 'condamnation-non-definitive',
      qualification: 'Détournement de fonds publics',
      juridiction: 'Tribunal correctionnel de Paris',
      dateDecision: '2025-03-31',
      peine:
        "Peine d'emprisonnement partiellement assortie du sursis, amende et cinq ans d'inéligibilité avec exécution provisoire, en première instance.",
      recours:
        "Appel interjeté : la condamnation n'est pas définitive et la présomption d'innocence demeure. Le détail de la peine et le calendrier d'appel doivent être recoupés sur source primaire avant publication.",
      verification: 'a-verifier',
      sourceIds: ['legifrance', 'decodeurs'],
    },
  ],
  indicateurs: [
    { id: 'lepen-i1', label: 'Score au second tour de la présidentielle', valeur: '41,45 %', periode: '2022', verification: 'a-verifier', sourceIds: ['vie-publique'] },
    { id: 'lepen-i2', label: 'Condamnations définitives pour atteinte à la probité', valeur: 'Aucune', periode: 'À la date de revue', verification: 'a-verifier', sourceIds: ['legifrance'] },
    { id: 'lepen-i3', label: 'Condamnations non définitives pour atteinte à la probité', valeur: 'Une, frappée d’appel', periode: '2025', verification: 'a-verifier', sourceIds: ['legifrance'] },
  ],
  derniereMaj: '2026-08-20',
}
