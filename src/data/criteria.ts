import type { Criterion, CriterionFamily } from './types'

/**
 * Référentiel des critères de notation.
 *
 * Principe directeur : une note n'est jamais une opinion posée à la main.
 * Chaque critère déclare les indicateurs factuels qui l'alimentent et le barème
 * qui transforme ces indicateurs en points. Le barème est affiché dans
 * l'application, à côté de la note, avec ses limites.
 *
 * Les critères marqués `contestable` reposent sur un jugement de valeur qui
 * n'est pas partagé par tout le monde. Ils sont signalés comme tels et peuvent
 * être mis à zéro d'un clic.
 */

export const criteriaFamilies: Record<CriterionFamily, { lastName: string; summary: string }> = {
  integrite: {
    lastName: 'Intégrité',
    summary: "Rapport à la loi, à l'argent public et aux faits.",
  },
  competence: {
    lastName: 'Compétence et sérieux',
    summary: "Expérience des responsabilités, travail effectif, constance des engagements.",
  },
  programme: {
    lastName: 'Qualité du programme',
    summary: "Précision des mesures et solidité de leur financement, indépendamment de leur contenu.",
  },
  action: {
    lastName: "Capacité d'action",
    summary: "Aptitude à obtenir une majorité et à exercer effectivement le pouvoir.",
  },
}

export const criteria: Criterion[] = [
  {
    id: 'probite',
    lastName: 'Probité',
    shortName: 'Probité',
    family: 'integrite',
    summary: "Situation judiciaire et respect des obligations liées à l'exercice d'un mandat.",
    question: "La personne a-t-elle été sanctionnée pour des manquements à la probité ?",
    indicators: [
      'Condamnations définitives pour atteinte à la probité (corruption, détournement de fonds publics, prise illégale d’intérêts, fraude fiscale)',
      'Condamnations non définitives, frappées d’appel ou de pourvoi',
      'Mises en examen en cours',
      'Sanctions ou signalements de la Haute Autorité pour la transparence de la vie publique',
      'Rejet ou réformation des comptes de campagne par la CNCCFP',
    ],
    scale: [
      'Base de départ : 100 points.',
      '−45 points par condamnation définitive pour atteinte à la probité.',
      '−35 points par condamnation prononcée en appel et frappée d’un pourvoi en cassation : les faits ont alors été jugés deux fois, mais la condamnation n’est pas définitive.',
      '−25 points par condamnation de première instance frappée d’appel.',
      '−12 points par mise en examen en cours pour un fait de probité.',
      '−10 points par sanction de la HATVP ou rejet de comptes de campagne.',
      'Une relaxe, un non-lieu ou un classement sans suite ne retire aucun point.',
      'Aucune procédure connue à la date de revue : 100 points, avec une confiance abaissée si la fiche est peu documentée.',
      'Les condamnations sans lien avec la probité — diffamation, provocation, infractions routières, délits d’audience — ne modifient pas cette note. Elles figurent intégralement sur la fiche du candidat, où chacun leur donne le poids qu’il juge bon.',
    ],
    tiers: [
      { min: 90, label: 'Aucun élément défavorable connu' },
      { min: 70, label: 'Procédure en cours, aucune condamnation définitive' },
      { min: 60, label: 'Condamnation de première instance, appel en cours' },
      { min: 45, label: 'Condamnation confirmée en appel, pourvoi en cours' },
      { min: 0, label: 'Condamnation définitive' },
    ],
    limits:
      "Une mise en examen n'est pas une condamnation : elle ouvre une enquête et la présomption d'innocence reste entière. Ce critère mesure ce qui a été jugé ou est en cours de jugement, pas ce qui existerait sans avoir été poursuivi. Les personnes les plus exposées médiatiquement sont aussi les plus contrôlées.",
    defaultWeight: 5,
    debatable: false,
    readingDirection: 'Une note haute signifie « aucun manquement établi », pas « personne vertueuse ».',
  },
  {
    id: 'antecedents-judiciaires',
    lastName: 'Antécédents judiciaires',
    shortName: 'Antécédents',
    family: 'integrite',
    summary:
      "Ensemble des condamnations prononcées, quelle que soit la nature de l'infraction.",
    question: 'La personne a-t-elle déjà été condamnée, pour quoi que ce soit ?',
    indicators: [
      'Condamnations définitives, toutes infractions confondues',
      'Condamnations non définitives, frappées d’appel ou de pourvoi',
      'Nature de l’infraction et juridiction ayant statué',
      'Relaxes, non-lieux et classements sans suite, qui ne retirent aucun point',
    ],
    scale: [
      'Base de départ : 100 points.',
      '−30 points pour la première condamnation définitive, quelle que soit l’infraction.',
      '−15 points par condamnation définitive supplémentaire.',
      '−20 points pour une première condamnation non définitive, −10 par condamnation non définitive supplémentaire.',
      'Une relaxe, un non-lieu ou un classement sans suite ne retire aucun point.',
    ],
    tiers: [
      { min: 90, label: 'Aucune condamnation connue' },
      { min: 70, label: 'Une condamnation' },
      { min: 45, label: 'Plusieurs condamnations' },
      { min: 0, label: 'Condamnations répétées' },
    ],
    limits:
      "Ce critère additionne des choses que le droit distingue : une fraude fiscale, une infraction de presse et un délit d'audience n'ont ni la même gravité ni le même sens politique. C'est précisément pourquoi il est séparé de la probité, et pourquoi son poids par défaut est faible : à chacun de décider si une condamnation pour propos publics doit compter autant qu'un détournement de fonds — ou pas du tout. Attention aussi au double décompte : une condamnation pour atteinte à la probité fait baisser les deux critères à la fois, ce qui est voulu mais doit être su. Enfin, il pénalise mécaniquement les personnalités les plus exposées, davantage poursuivies parce que davantage écoutées.",
    defaultWeight: 2,
    debatable: true,
    readingDirection:
      'Compte des condamnations, sans les hiérarchiser. La hiérarchie, c’est vous qui la faites en réglant le poids.',
  },
  {
    id: 'transparence',
    lastName: 'Transparence',
    shortName: 'Transparence',
    family: 'integrite',
    summary: "Ce que la personne rend public de son patrimoine, de ses intérêts et de son financement.",
    question: "Peut-on vérifier d'où vient son argent et à qui elle est liée ?",
    indicators: [
      'Déclaration de patrimoine et d’intérêts déposée et publiée par la HATVP',
      'Publication du financement de campagne et des dons',
      'Publication du chiffrage détaillé du programme',
      'Réponses publiques aux questionnaires citoyens et associatifs',
      'Déclaration des rencontres avec des représentants d’intérêts',
    ],
    scale: [
      '20 points par indicateur satisfait, sur les cinq listés.',
      'Demi-point de barème (10 points) lorsque la publication est partielle ou tardive.',
      '0 point lorsque l’élément n’est pas public.',
    ],
    tiers: [
      { min: 80, label: 'Très documenté' },
      { min: 60, label: 'Documenté' },
      { min: 40, label: 'Partiel' },
      { min: 0, label: 'Peu ou pas documenté' },
    ],
    limits:
      "Publier n'est pas être irréprochable : une déclaration complète peut décrire une situation problématique. À l'inverse, un candidat sans mandat n'est soumis à aucune obligation déclarative et se trouve mécaniquement pénalisé.",
    defaultWeight: 3,
    debatable: false,
    readingDirection: 'Mesure la vérifiabilité, pas la vertu.',
  },
  {
    id: 'veracite',
    lastName: 'Rapport aux faits',
    shortName: 'Rapport aux faits',
    family: 'integrite',
    summary: "Exactitude des affirmations publiques, telle qu'établie par les cellules de vérification.",
    question: 'Ses déclarations résistent-elles à la vérification ?',
    indicators: [
      'Part des affirmations vérifiées jugées exactes par au moins deux rédactions de fact-checking indépendantes',
      'Rectifications publiques après une erreur établie',
      'Reprise d’affirmations déjà démenties',
    ],
    scale: [
      'Note = part des affirmations vérifiées jugées exactes ou globalement exactes, exprimée en pourcentage.',
      '+5 points en cas de rectification publique documentée après une erreur.',
      '−10 points par reprise avérée d’une affirmation déjà démentie publiquement.',
      "Échantillon minimal de 10 vérifications ; en deçà, la confiance est marquée « faible ».",
    ],
    tiers: [
      { min: 80, label: 'Affirmations solides' },
      { min: 60, label: 'Globalement fiable' },
      { min: 40, label: 'Approximations fréquentes' },
      { min: 0, label: 'Affirmations souvent démenties' },
    ],
    limits:
      "Les vérificateurs choisissent ce qu'ils vérifient : une personnalité très exposée, ou dont les propos surprennent, est davantage contrôlée. L'échantillon n'est donc jamais représentatif de l'ensemble des déclarations.",
    defaultWeight: 3,
    debatable: false,
    readingDirection: "Une note haute signale la rigueur factuelle, pas l'accord avec le propos.",
  },
  {
    id: 'etat-de-droit',
    lastName: 'Respect des institutions',
    shortName: 'Institutions',
    family: 'integrite',
    summary: "Attitude déclarée envers la justice, la presse, la Constitution et les contre-pouvoirs.",
    question: 'Que propose la personne pour les contre-pouvoirs, et comment les traite-t-elle ?',
    indicators: [
      'Positions publiques sur l’indépendance de la justice et sur l’exécution des décisions de justice',
      'Positions publiques sur la liberté de la presse et le statut de l’audiovisuel public',
      'Propositions de révision constitutionnelle touchant aux contre-pouvoirs',
      'Recours annoncé au référendum pour contourner le Parlement ou le Conseil constitutionnel',
    ],
    scale: [
      'Base de départ : 100 points.',
      '−20 points par proposition affaiblissant explicitement un contre-pouvoir (justice, presse, Conseil constitutionnel, Parlement).',
      '−15 points par mise en cause publique et personnelle de magistrats à raison de leurs décisions.',
      '+10 points par engagement précis de renforcement d’un contre-pouvoir.',
    ],
    tiers: [
      { min: 85, label: 'Contre-pouvoirs préservés ou renforcés' },
      { min: 65, label: 'Réformes institutionnelles sans effet clair' },
      { min: 40, label: 'Contre-pouvoirs affaiblis' },
      { min: 0, label: 'Remise en cause frontale' },
    ],
    limits:
      "Vouloir réformer une institution n'est pas vouloir l'affaiblir : la frontière relève d'une appréciation. Ce critère lit des propositions écrites, pas des intentions. C'est le critère le plus discutable de la famille « intégrité » — sa pondération mérite un examen personnel.",
    defaultWeight: 3,
    debatable: true,
    readingDirection: "Reflète un attachement à l'équilibre des pouvoirs, qui est lui-même un choix politique.",
  },
  {
    id: 'experience',
    lastName: 'Expérience des responsabilités',
    shortName: 'Expérience',
    family: 'competence',
    summary: "Fonctions exécutives, parlementaires et internationales déjà exercées.",
    question: 'La personne a-t-elle déjà dirigé quelque chose, et à quelle échelle ?',
    indicators: [
      'Années passées dans une fonction exécutive nationale (ministre, Premier ministre)',
      'Années passées à la tête d’un exécutif local (maire, président de région ou de département)',
      'Années de mandat parlementaire national ou européen',
      'Expérience de négociation internationale',
      'Direction d’une organisation de plus de mille personnes, publique ou privée',
    ],
    scale: [
      '4 points par année d’exécutif national, plafonnés à 40 points.',
      '2,5 points par année d’exécutif local, plafonnés à 25 points.',
      '1,5 point par année de mandat parlementaire, plafonné à 20 points.',
      "Jusqu'à 15 points pour l'expérience internationale et la direction de grande organisation.",
      'Note plafonnée à 100.',
    ],
    tiers: [
      { min: 75, label: 'Très expérimenté' },
      { min: 50, label: 'Expérimenté' },
      { min: 25, label: 'Expérience limitée' },
      { min: 0, label: 'Peu ou pas d’expérience exécutive' },
    ],
    limits:
      "L'expérience mesure la durée, pas la réussite : un bilan contesté et un bilan salué comptent pareil. Certains électeurs recherchent précisément l'inverse de ce critère — le renouvellement. Dans ce cas, mettre son poids à zéro est la bonne réponse.",
    defaultWeight: 3,
    debatable: false,
    readingDirection: "Une note haute signifie « a déjà exercé », jamais « a bien exercé ».",
  },
  {
    id: 'assiduite',
    lastName: 'Assiduité dans les mandats',
    shortName: 'Assiduité',
    family: 'competence',
    summary: "Travail effectivement accompli dans les mandats exercés.",
    question: 'La personne a-t-elle fait le travail pour lequel elle a été élue ?',
    indicators: [
      'Taux de participation aux scrutins publics et aux commissions',
      'Nombre de textes et amendements déposés, rapports rendus',
      'Cumul avec d’autres activités rémunérées pendant le mandat',
      'Abandon d’un mandat en cours avant son terme',
    ],
    scale: [
      'Note initiale = taux de présence en séance et en commission, ramené sur 100.',
      "+10 points pour une activité législative supérieure à la médiane de l'assemblée concernée.",
      '−15 points en cas d’abandon d’un mandat en cours sans motif institutionnel.',
      "Critère non applicable en l'absence de mandat : la note est alors neutralisée, pas mise à zéro.",
    ],
    tiers: [
      { min: 80, label: 'Très assidu' },
      { min: 60, label: 'Assidu' },
      { min: 40, label: 'Assiduité irrégulière' },
      { min: 0, label: 'Faible assiduité' },
    ],
    limits:
      "Les statistiques de présence sont imparfaites : un ministre ne siège pas, un président de groupe négocie hors séance, une absence peut couvrir un travail de terrain. À lire avec le nombre de textes déposés, jamais seule.",
    defaultWeight: 2,
    debatable: false,
    readingDirection: 'Mesure la quantité de travail parlementaire, pas sa qualité.',
  },
  {
    id: 'constance',
    lastName: 'Constance des engagements',
    shortName: 'Constance',
    family: 'competence',
    summary: "Stabilité des positions dans le temps et suites données aux promesses passées.",
    question: 'Ce qui est promis aujourd’hui ressemble-t-il à ce qui a été fait hier ?',
    indicators: [
      'Revirements documentés sur des positions structurantes',
      'Part des engagements de campagne précédents effectivement mis en œuvre',
      'Changements de parti ou de famille politique',
      'Écart entre le discours et les votes au Parlement',
    ],
    scale: [
      'Base de départ : 100 points.',
      '−12 points par revirement documenté sur une position structurante, sans explication publique.',
      '−6 points seulement lorsque le changement de position a été assumé et argumenté publiquement.',
      "+ jusqu'à 20 points selon la part des engagements précédents tenus, lorsque cette part est mesurable.",
    ],
    tiers: [
      { min: 80, label: 'Ligne stable' },
      { min: 60, label: 'Inflexions assumées' },
      { min: 40, label: 'Revirements notables' },
      { min: 0, label: 'Ligne très mouvante' },
    ],
    limits:
      "Changer d'avis devant des faits nouveaux est une qualité, pas un défaut : le barème pénalise donc deux fois moins un revirement assumé et argumenté. La frontière entre adaptation et opportunisme reste une appréciation.",
    defaultWeight: 3,
    debatable: true,
    readingDirection: 'La constance est une valeur parmi d’autres, pas un absolu.',
  },
  {
    id: 'clarte-programme',
    lastName: 'Clarté du programme',
    shortName: 'Clarté',
    family: 'programme',
    summary: "Précision, datation et chiffrage des mesures annoncées — quel que soit leur contenu.",
    question: 'Sait-on précisément ce qui serait fait, quand, et avec quel argent ?',
    indicators: [
      'Part des mesures assorties d’un chiffrage public',
      'Part des mesures assorties d’un calendrier',
      'Existence d’un programme écrit et accessible',
      'Précision du véhicule juridique envisagé (loi, décret, révision constitutionnelle, négociation européenne)',
    ],
    scale: [
      '40 points au prorata de la part des mesures chiffrées.',
      '25 points au prorata de la part des mesures datées.',
      '20 points pour un programme écrit, complet et librement accessible.',
      '15 points pour la précision du véhicule juridique.',
    ],
    tiers: [
      { min: 80, label: 'Programme précis et chiffré' },
      { min: 60, label: 'Programme structuré' },
      { min: 40, label: 'Programme partiel' },
      { min: 0, label: 'Orientations générales' },
    ],
    limits:
      "Un programme précis n'est pas un bon programme : la clarté ne dit rien de la pertinence des mesures. Un chiffrage détaillé peut aussi reposer sur des hypothèses irréalistes — c'est le critère suivant qui s'en charge.",
    defaultWeight: 4,
    debatable: false,
    readingDirection: 'Mesure la lisibilité de l’offre politique, pas son bien-fondé.',
  },
  {
    id: 'credibilite-budgetaire',
    lastName: 'Crédibilité budgétaire',
    shortName: 'Budget',
    family: 'programme',
    summary: "Cohérence entre les dépenses annoncées et les recettes prévues, selon des évaluateurs tiers.",
    question: 'Les comptes du programme tiennent-ils debout selon des évaluateurs indépendants ?',
    indicators: [
      'Écart entre dépenses et recettes annoncées, en milliards d’euros par an',
      'Évaluations publiées par des organismes indépendants (Institut Montaigne, OFCE, Cour des comptes, iFRAP)',
      'Réalisme des hypothèses de croissance et de recettes retenues',
      'Trajectoire de dette et de déficit assumée',
    ],
    scale: [
      'Base de départ : 100 points.',
      "−2 points par milliard d'euros d'écart annuel non financé, plafonné à −60 points.",
      "−20 points lorsque les hypothèses de recettes sont jugées non étayées par au moins deux évaluateurs indépendants.",
      '+10 points lorsque la trajectoire de déficit est explicite et assumée, y compris si elle est expansionniste.',
    ],
    tiers: [
      { min: 75, label: 'Trajectoire cohérente' },
      { min: 55, label: 'Cohérence partielle' },
      { min: 35, label: 'Financement incertain' },
      { min: 0, label: 'Écart de financement majeur' },
    ],
    limits:
      "Les évaluateurs indépendants ont leurs propres orientations : leurs chiffrages divergent, parfois du simple au double. Ce critère retient l'écart médian entre évaluations et signale la dispersion. Assumer un déficit n'est pas une faute en soi — c'est un choix macroéconomique, ici noté sur sa cohérence interne et non sur sa direction.",
    defaultWeight: 3,
    debatable: true,
    readingDirection: "Note la cohérence des comptes, pas l'orientation budgétaire choisie.",
  },
  {
    id: 'capacite-rassemblement',
    lastName: 'Capacité à gouverner',
    shortName: 'Gouvernabilité',
    family: 'action',
    summary: "Perspective de réunir une majorité pour appliquer effectivement le programme.",
    question: 'En cas de victoire, la personne pourrait-elle réellement appliquer son programme ?',
    indicators: [
      'Nombre de parlementaires du camp politique sortant',
      'Alliances déclarées et réserves de voix au second tour',
      'Implantation locale du mouvement (élus municipaux, régionaux)',
      'Capacité démontrée à faire adopter des textes dans une assemblée sans majorité absolue',
    ],
    scale: [
      '40 points au prorata du poids parlementaire du camp politique.',
      '30 points pour les alliances formalisées et la réserve de voix estimée.',
      "20 points pour l'implantation locale.",
      '10 points pour un précédent de négociation parlementaire aboutie.',
    ],
    tiers: [
      { min: 75, label: 'Base large' },
      { min: 50, label: 'Base solide, alliances nécessaires' },
      { min: 30, label: 'Base étroite' },
      { min: 0, label: 'Sans relais parlementaire' },
    ],
    limits:
      "Ce critère décrit un rapport de force à un instant donné, et une présidentielle le reconfigure : les législatives qui suivent produisent souvent une majorité que rien ne laissait prévoir. Il pénalise structurellement les candidats nouveaux, ce qui est une information, pas un jugement.",
    defaultWeight: 2,
    debatable: true,
    readingDirection: 'Décrit une probabilité de mise en œuvre, pas un mérite.',
  },
  {
    id: 'engagement-national',
    lastName: "Engagement au service de l'intérêt général",
    shortName: 'Engagement public',
    family: 'action',
    summary: "Durée et continuité de l'engagement public, indépendance vis-à-vis d'intérêts particuliers.",
    question: "Combien de temps, et sans quelles attaches, la personne a-t-elle servi la collectivité ?",
    indicators: [
      'Années de service public ou d’engagement associatif, syndical ou humanitaire',
      'Continuité de cet engagement, hors périodes d’activité privée rémunérée par des intérêts régulés',
      'Absence de conflit d’intérêts relevé par la HATVP',
      'Absence de financement par des intérêts étrangers ou par des acteurs qu’un mandat régulerait',
      'Présence effective sur le terrain pendant les mandats',
    ],
    scale: [
      '2 points par année d’engagement public, associatif ou syndical, plafonnés à 50 points.',
      '20 points pour la continuité de l’engagement.',
      '15 points en l’absence de conflit d’intérêts relevé.',
      '15 points en l’absence de dépendance financière à des intérêts qu’un mandat régulerait.',
    ],
    tiers: [
      { min: 75, label: 'Engagement long et continu' },
      { min: 55, label: 'Engagement établi' },
      { min: 35, label: 'Engagement récent' },
      { min: 0, label: 'Engagement peu documenté' },
    ],
    limits:
      "Ce critère répond à une demande fréquente — « qui s'engage vraiment pour le pays ? » — mais il ne peut pas la satisfaire complètement : le patriotisme et le dévouement ne se mesurent pas. Ce qui est mesuré ici, ce sont des faits de carrière et des liens d'intérêts. Il favorise mécaniquement les carrières longues et pénalise les parcours venus du privé, ce qui est une convention, pas une vérité. Chacun peut légitimement le pondérer à zéro.",
    defaultWeight: 2,
    debatable: true,
    readingDirection:
      "Ne mesure pas l'attachement au pays — aucune donnée ne le permet — mais la durée de l'engagement public et l'absence de liens d'intérêts documentés.",
  },
]

export const criterionById = new Map(criteria.map((c) => [c.id, c]))

export const criteriaByFamily = (Object.keys(criteriaFamilies) as CriterionFamily[]).map((id) => ({
  id,
  ...criteriaFamilies[id],
  criteria: criteria.filter((c) => c.family === id),
}))

export const defaultWeights: Record<string, number> = Object.fromEntries(
  criteria.map((c) => [c.id, c.defaultWeight]),
)
