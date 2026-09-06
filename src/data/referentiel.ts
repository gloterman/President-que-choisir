import type { Axis, Proposition, Theme } from './types'

/**
 * Référentiel des thèmes, axes et propositions du questionnaire.
 *
 * Une proposition mal rédigée fabrique le résultat qu'elle prétend mesurer.
 * Huit règles s'appliquent donc à chaque énoncé ; les six premières sont
 * contrôlées automatiquement par `npm run lint:data`.
 *
 *  R1. Pas de justification intégrée. « Assouplir les licenciements pour
 *      encourager l'embauche » fait accepter une thèse économique contestée
 *      en même temps que la mesure. On énonce la mesure, pas son bénéfice
 *      supposé.
 *  R2. Pas de superlatif ni d'adverbe d'appréciation : « le meilleur levier »,
 *      « massivement », « fortement », « évidemment ». Ils demandent d'adhérer
 *      à une intensité autant qu'à une idée.
 *  R3. Une seule chose par proposition. « Poursuivi et amplifié » mélange deux
 *      questions dont on ne peut plus séparer les réponses.
 *  R4. Pas de fausse alternative dans une proposition de mesure. Construire des
 *      prisons et développer les peines alternatives ne s'excluent pas : ce
 *      sont deux énoncés distincts. L'opposition n'est admise que dans une
 *      proposition de principe, où l'arbitrage est précisément l'objet et où
 *      les deux termes sont nommés symétriquement.
 *  R5. Pas de « il faut ». La formule installe une nécessité avant même la
 *      réponse ; on écrit qui doit faire quoi.
 *  R6. Pas de vocabulaire militant repris tel quel — « préférence nationale »,
 *      « assistanat », « ultra-riches ». On décrit le mécanisme, pas le slogan.
 *  R7. Pas de présupposé dans le verbe. « Rétablir » suppose qu'un état
 *      antérieur était légitime ; on écrit « instaurer » ou on décrit.
 *  R8. Polarités mélangées au sein d'un thème, pour limiter le biais
 *      d'acquiescement — la tendance à approuver quoi qu'on demande.
 *
 * Les propositions de principe portent sur des arbitrages de valeurs et sont
 * rédigées pour survivre au cycle médiatique : un questionnaire composé
 * uniquement de mesures d'actualité mesure surtout la position d'une personne
 * dans le débat du moment.
 */

export const themes: Theme[] = [
  {
    id: 'economie',
    lastName: 'Économie et travail',
    summary: "Emploi, entreprises, place de l'État dans l'économie et échanges internationaux.",
    icon: '⚙',
  },
  {
    id: 'fiscalite',
    lastName: 'Fiscalité et dépense publique',
    summary: "Niveau des prélèvements, progressivité de l'impôt et équilibre des comptes.",
    icon: '€',
  },
  {
    id: 'social',
    lastName: 'Protection sociale, retraites et santé',
    summary: "Âge de départ, financement de la protection sociale, hôpital et accès aux soins.",
    icon: '♥',
  },
  {
    id: 'ecologie',
    lastName: 'Écologie et énergie',
    summary: "Rythme de la transition, contraintes réglementaires et composition du mix énergétique.",
    icon: '☘',
  },
  {
    id: 'immigration',
    lastName: 'Immigration et identité',
    summary: "Entrées sur le territoire, conditions d'accès à la nationalité et modèle d'intégration.",
    icon: '⇄',
  },
  {
    id: 'securite',
    lastName: 'Sécurité et justice',
    summary: "Réponse pénale, moyens de police, équilibre entre libertés publiques et surveillance.",
    icon: '⚖',
  },
  {
    id: 'institutions',
    lastName: 'Institutions et démocratie',
    summary: "Mode de scrutin, participation citoyenne, équilibre entre l'État et les territoires.",
    icon: '◫',
  },
  {
    id: 'international',
    lastName: 'Europe, défense et international',
    summary: "Place de la France dans l'Union européenne, alliances militaires et effort de défense.",
    icon: '◈',
  },
]

export const axes: Axis[] = [
  {
    id: 'marche-travail',
    themeId: 'economie',
    lastName: 'Marché du travail',
    negativePole: 'Protéger l’emploi par la loi',
    positivePole: 'Assouplir les règles du travail',
    summary: "Faut-il sécuriser les parcours par la réglementation ou fluidifier l'embauche et le licenciement ?",
    compass: { eco: 1, soc: 0 },
  },
  {
    id: 'interventionnisme',
    themeId: 'economie',
    lastName: 'Rôle de l’État et échanges',
    negativePole: 'Ouverture et libre-échange',
    positivePole: 'État stratège et protections commerciales',
    summary: "L'État doit-il s'effacer devant le marché ou piloter et protéger les filières jugées stratégiques ?",
    compass: { eco: 0, soc: 0.5 },
  },
  {
    id: 'pression-fiscale',
    themeId: 'fiscalite',
    lastName: 'Niveau des prélèvements',
    negativePole: 'Baisser les impôts et la dépense',
    positivePole: 'Augmenter les recettes publiques',
    summary: "Réduire la part des prélèvements dans la richesse produite, ou la relever pour financer l'action publique ?",
    compass: { eco: -1, soc: 0 },
  },
  {
    id: 'redistribution',
    themeId: 'fiscalite',
    lastName: 'Redistribution',
    negativePole: "Récompenser l'effort individuel",
    positivePole: 'Réduire les écarts de revenus',
    summary: "L'écart entre les revenus doit-il être corrigé par la puissance publique, ou reflète-t-il des contributions différentes ?",
    compass: { eco: -1, soc: 0 },
  },
  {
    id: 'retraites',
    themeId: 'social',
    lastName: 'Retraites',
    negativePole: "Reculer l'âge de départ",
    positivePole: "Abaisser l'âge de départ",
    summary: "Équilibrer le système par la durée de travail, ou par d'autres ressources afin de partir plus tôt ?",
    compass: { eco: -1, soc: 0 },
  },
  {
    id: 'services-publics',
    themeId: 'social',
    lastName: 'Services publics',
    negativePole: "Rationaliser l'offre publique",
    positivePole: 'Étendre les services publics',
    summary: "Faut-il resserrer le périmètre de l'État et ouvrir au privé, ou renforcer l'offre publique ?",
    compass: { eco: -1, soc: 0 },
  },
  {
    id: 'ambition-climat',
    themeId: 'ecologie',
    lastName: 'Rythme de la transition',
    negativePole: 'Transition graduelle et incitative',
    positivePole: 'Planification écologique contraignante',
    summary: "Accompagner la transition par l'incitation, ou l'imposer par la norme et l'investissement public ?",
    compass: { eco: -0.5, soc: -0.5 },
  },
  {
    id: 'mix-energetique',
    themeId: 'ecologie',
    lastName: 'Mix énergétique',
    negativePole: 'Priorité au nucléaire',
    positivePole: 'Priorité aux énergies renouvelables',
    summary: "Sur quelle source adosser en priorité la production d'électricité décarbonée ?",
    compass: { eco: 0, soc: 0 },
  },
  {
    id: 'flux-migratoires',
    themeId: 'immigration',
    lastName: 'Flux migratoires',
    negativePole: 'Accueil et régularisation',
    positivePole: 'Restriction des entrées',
    summary: "Ouvrir des voies légales et régulariser, ou réduire le nombre d'entrées et durcir les conditions ?",
    compass: { eco: 0, soc: 1 },
  },
  {
    id: 'integration-identite',
    themeId: 'immigration',
    lastName: 'Modèle d’intégration',
    negativePole: 'Reconnaissance des différences',
    positivePole: 'Assimilation et priorité nationale',
    summary: "L'appartenance à la nation passe-t-elle par la reconnaissance des particularités ou par leur effacement dans l'espace public ?",
    compass: { eco: 0, soc: 1 },
  },
  {
    id: 'fermete-penale',
    themeId: 'securite',
    lastName: 'Réponse pénale',
    negativePole: 'Prévention et réinsertion',
    positivePole: 'Fermeté et automaticité des peines',
    summary: "Réduire la délinquance par l'accompagnement en amont, ou par une sanction plus systématique ?",
    compass: { eco: 0, soc: 1 },
  },
  {
    id: 'libertes-surveillance',
    themeId: 'securite',
    lastName: 'Libertés et surveillance',
    negativePole: 'Priorité aux libertés publiques',
    positivePole: 'Priorité aux moyens de surveillance',
    summary: "Jusqu'où étendre les outils de sécurité quand ils réduisent l'anonymat dans l'espace public ?",
    compass: { eco: 0, soc: 0.7 },
  },
  {
    id: 'democratie-directe',
    themeId: 'institutions',
    lastName: 'Participation citoyenne',
    negativePole: 'Démocratie représentative classique',
    positivePole: 'Démocratie directe et proportionnelle',
    summary: "Le pouvoir doit-il rester entre les mains des élus, ou revenir plus souvent aux citoyens entre deux élections ?",
    compass: { eco: 0, soc: 0 },
  },
  {
    id: 'decentralisation',
    themeId: 'institutions',
    lastName: 'Organisation territoriale',
    negativePole: 'État central fort',
    positivePole: 'Pouvoir accru aux territoires',
    summary: "Garantir l'égalité par l'uniformité nationale, ou adapter les règles au plus près du terrain ?",
    compass: { eco: 0, soc: 0 },
  },
  {
    id: 'souverainete-europeenne',
    themeId: 'international',
    lastName: 'Souveraineté et Europe',
    negativePole: "Souveraineté nationale d'abord",
    positivePole: "Approfondir l'intégration européenne",
    summary: "Reprendre des compétences à l'Union européenne, ou en transférer davantage pour peser collectivement ?",
    compass: { eco: 0, soc: -0.8 },
  },
  {
    id: 'defense-alliances',
    themeId: 'international',
    lastName: 'Défense et alliances',
    negativePole: 'Autonomie stratégique et non-alignement',
    positivePole: 'Alliances occidentales et effort de défense',
    summary: "Prendre ses distances avec les alliances existantes, ou renforcer l'engagement militaire et atlantique ?",
    compass: { eco: 0, soc: 0.3 },
  },
]

export const propositions: Proposition[] = [
  // — Économie et travail —
  {
    id: 'p-eco-1',
    axisId: 'marche-travail',
    themeId: 'economie',
    nature: 'principe',
    polarity: -1,
    text:
      "Entre la stabilité de l’emploi et la souplesse de gestion des entreprises, la loi doit privilégier la stabilité.",
    context:
      "Les deux objectifs sont poursuivis par tous les pays développés ; ils entrent en tension dès qu’il s’agit de fixer les règles du licenciement.",
  },
  {
    id: 'p-eco-2',
    axisId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarity: 1,
    text:
      "Un employeur doit pouvoir licencier un salarié avec moins de contraintes de motif, de procédure et d’indemnisation qu’aujourd’hui.",
    context:
      "Le droit du licenciement a été modifié à plusieurs reprises depuis 2016, notamment par le plafonnement des indemnités prud’homales.",
  },
  {
    id: 'p-eco-3',
    axisId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarity: -1,
    text:
      "La durée légale du travail doit être abaissée en dessous de 35 heures hebdomadaires.",
    context:
      "La durée légale est fixée à 35 heures depuis 2000. Elle détermine le seuil de déclenchement des heures supplémentaires, pas un plafond de travail.",
  },
  {
    id: 'p-eco-4',
    axisId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les règles de suspension des allocations chômage en cas de refus d’offres d’emploi doivent être durcies par rapport au droit actuel.",
    context:
      "Une suspension est déjà prévue après deux refus d’offres jugées raisonnables ; le débat porte sur le nombre de refus, la définition d’une offre acceptable et la durée de la suspension.",
  },
  {
    id: 'p-eco-5',
    axisId: 'interventionnisme',
    themeId: 'economie',
    nature: 'principe',
    polarity: -1,
    text:
      "Lorsque les règles de concurrence et un intérêt économique national s’opposent, les règles de concurrence doivent l’emporter.",
    context:
      "Le droit européen de la concurrence encadre les aides d’État et les concentrations ; il prévoit des dérogations, dont la portée est discutée.",
  },
  {
    id: 'p-eco-6',
    axisId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’État doit pouvoir prendre le contrôle du capital d’entreprises considérées comme stratégiques.",
    context:
      "L’État détient déjà des participations dans plusieurs grands groupes ; la nationalisation complète reste un outil exceptionnel.",
  },
  {
    id: 'p-eco-7',
    axisId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarity: 1,
    text:
      "Des droits de douane doivent être appliqués aux produits importés qui concurrencent la production française.",
    context:
      "La politique commerciale est une compétence exclusive de l’Union européenne : une mesure nationale supposerait de renégocier ce cadre.",
  },
  {
    id: 'p-eco-8',
    axisId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarity: -1,
    text:
      "La France doit soutenir la ratification de nouveaux accords de libre-échange par l’Union européenne.",
    context:
      "Ces accords ouvrent des débouchés à l’exportation et exposent certaines filières, agricoles notamment, à une concurrence accrue.",
  },
  // — Fiscalité et dépense publique —
  {
    id: 'p-fis-1',
    axisId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'principe',
    polarity: -1,
    text:
      "Entre baisser les impôts et maintenir le niveau des services publics, la priorité doit aller à la baisse des impôts.",
    context:
      "Rapportés au produit intérieur brut, les prélèvements obligatoires et la dépense publique français sont parmi les plus élevés de l’OCDE ; une partie de cet écart tient au périmètre plus large du financement public, notamment des retraites et de la santé.",
  },
  {
    id: 'p-fis-2',
    axisId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarity: -1,
    text:
      "Le nombre d’agents publics doit diminuer au cours du prochain quinquennat.",
    context:
      "La fonction publique compte environ 5,7 millions d’agents, dont plus de la moitié dans les collectivités territoriales et l’hôpital.",
  },
  {
    id: 'p-fis-3',
    axisId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarity: 1,
    text:
      "Un impôt annuel doit porter sur les patrimoines les plus élevés.",
    context:
      "L’impôt de solidarité sur la fortune a été remplacé en 2018 par un impôt limité au patrimoine immobilier.",
  },
  {
    id: 'p-fis-4',
    axisId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les droits de succession doivent augmenter sur les patrimoines les plus élevés.",
    context:
      "Les taux français sont parmi les plus élevés de l’OCDE, avec de nombreux dispositifs d’exonération qui en réduisent la portée.",
  },
  {
    id: 'p-fis-5',
    axisId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'principe',
    polarity: -1,
    text:
      "Entre récompenser l’effort individuel et limiter les écarts de revenus, la société doit d’abord récompenser l’effort.",
    context:
      "L’acceptabilité des inégalités est l’un des clivages les plus stables mesurés par les enquêtes d’opinion, indépendamment de l’actualité.",
  },
  {
    id: 'p-fis-6',
    axisId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'principe',
    polarity: 1,
    text:
      "La collectivité doit garantir à chacun un revenu minimum, sans condition d’activité.",
    context:
      "Plusieurs pays ont expérimenté un revenu inconditionnel. En France, les minima sociaux restent conditionnés à des critères de ressources ou d’insertion.",
  },
  {
    id: 'p-fis-7',
    axisId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarity: 1,
    text:
      "La loi doit plafonner l’écart de rémunération au sein d’une même entreprise.",
    context:
      "Aucun pays du G7 n’impose de plafond légal à l’écart de rémunération dans les entreprises privées ; plusieurs imposent la publication de cet écart, et la France plafonne déjà la rémunération des dirigeants des entreprises qu’elle contrôle.",
  },
  {
    id: 'p-fis-8',
    axisId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le salaire minimum doit augmenter plus vite que l’inflation.",
    context:
      "Le SMIC est revalorisé automatiquement selon l’inflation ; une hausse supérieure relève d’une décision discrétionnaire du gouvernement.",
  },
  // — Protection sociale, retraites et santé —
  {
    id: 'p-soc-1',
    axisId: 'retraites',
    themeId: 'social',
    nature: 'principe',
    polarity: -1,
    text:
      "Pour équilibrer le système de retraite, la priorité doit aller à l’allongement de la durée d’activité, plutôt qu’à la hausse des cotisations ou à la baisse des pensions.",
    context:
      "Trois leviers existent et se substituent l’un à l’autre : la durée d’activité, le niveau des cotisations et le montant des pensions.",
  },
  {
    id: 'p-soc-2',
    axisId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’âge légal de départ à la retraite doit être abaissé.",
    context:
      "La réforme de 2023 porte l’âge légal à 64 ans. Le Conseil d’orientation des retraites publie chaque année des projections d’équilibre.",
  },
  {
    id: 'p-soc-3',
    axisId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarity: -1,
    text:
      "La durée de cotisation exigée pour une retraite à taux plein doit être allongée.",
    context:
      "Cette durée augmente déjà progressivement pour atteindre 43 annuités, indépendamment de l’âge légal.",
  },
  {
    id: 'p-soc-4',
    axisId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les critères de pénibilité ouvrant droit à un départ anticipé à taux plein doivent être élargis.",
    context:
      "Le compte professionnel de prévention couvre six facteurs de risque depuis 2017, après en avoir couvert dix.",
  },
  {
    id: 'p-soc-5',
    axisId: 'services-publics',
    themeId: 'social',
    nature: 'principe',
    polarity: -1,
    text:
      "Un service public peut être fermé là où son coût par usager est très supérieur à la moyenne.",
    context:
      "La question se pose pour l’école, la poste, l’hôpital ou le rail dans les zones peu peuplées.",
  },
  {
    id: 'p-soc-6',
    axisId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le nombre de soignants à l’hôpital public doit augmenter, même si cela suppose d’accroître les dépenses publiques.",
    context:
      "Le déficit des hôpitaux publics s’est creusé depuis 2022, dans un contexte de postes durablement non pourvus.",
  },
  {
    id: 'p-soc-7',
    axisId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le lieu d’installation des médecins libéraux doit être encadré par la puissance publique.",
    context:
      "Une régulation à l’installation existe pour les infirmiers et les pharmaciens, mais pas pour les médecins.",
  },
  {
    id: 'p-soc-8',
    axisId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarity: -1,
    text:
      "Une part plus grande de l’offre de soins doit être assurée par des acteurs privés.",
    context:
      "Cliniques et hôpitaux privés assurent déjà une part importante des séjours, notamment en chirurgie ; leur place varie fortement selon les spécialités et les territoires.",
  },
  // — Écologie et énergie —
  {
    id: 'p-ecolo-1',
    axisId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'principe',
    polarity: 1,
    text:
      "La protection de l’environnement doit primer sur la croissance économique lorsque les deux s’opposent.",
    context:
      "Les deux objectifs coïncident dans certains secteurs et divergent dans d’autres ; cette question porte sur les cas de divergence.",
  },
  {
    id: 'p-ecolo-2',
    axisId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'principe',
    polarity: 1,
    text:
      "Pour réduire les émissions, l’État doit recourir à des obligations réglementaires plutôt qu’à des incitations laissant le choix aux ménages et aux entreprises.",
    context:
      "La contrainte réglementaire et l’incitation économique sont les deux instruments classiques des politiques environnementales ; les deux sont employés aujourd’hui.",
  },
  {
    id: 'p-ecolo-3',
    axisId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarity: -1,
    text:
      "Les obligations environnementales applicables aux exploitations agricoles doivent être réduites.",
    context:
      "Issues en grande partie de règles européennes, ces obligations portent notamment sur l’usage des pesticides, la qualité de l’eau et le maintien de surfaces non cultivées.",
  },
  {
    id: 'p-ecolo-4',
    axisId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarity: -1,
    text:
      "La date d’interdiction de vente des véhicules neufs à moteur thermique doit être repoussée.",
    context:
      "Un règlement européen fixe cette échéance à 2035, assortie d’une clause de réexamen.",
  },
  {
    id: 'p-ecolo-5',
    axisId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’État doit financer la rénovation énergétique des logements, y compris en recourant à l’emprunt.",
    context:
      "Les estimations de besoin d’investissement pour le bâtiment se situent entre 15 et 25 milliards d’euros par an, publics et privés confondus.",
  },
  {
    id: 'p-ecolo-6',
    axisId: 'mix-energetique',
    themeId: 'ecologie',
    nature: 'mesure',
    polarity: -1,
    text:
      "De nouveaux réacteurs nucléaires doivent être construits en France.",
    context:
      "Un programme de six réacteurs a été engagé ; les débats portent sur le calendrier, le coût et le mode de financement.",
  },
  {
    id: 'p-ecolo-7',
    axisId: 'mix-energetique',
    themeId: 'ecologie',
    nature: 'mesure',
    polarity: 1,
    text:
      "La production d’électricité éolienne doit augmenter, y compris en mer.",
    context:
      "La France est en retard sur ses objectifs de production renouvelable ; l’éolien terrestre suscite des oppositions locales.",
  },
  // — Immigration et identité —
  {
    id: 'p-imm-1',
    axisId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'principe',
    polarity: -1,
    text:
      "L’entrée sur le territoire relève d’abord d’un droit de la personne, avant d’être une décision souveraine de la nation.",
    context:
      "L’admission des étrangers relève en principe de la compétence de chaque État ; la France a limité cette compétence en ratifiant des engagements internationaux, notamment en matière d’asile et de vie familiale.",
  },
  {
    id: 'p-imm-2',
    axisId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le Parlement doit fixer chaque année un plafond au nombre de titres de séjour délivrés.",
    context:
      "Plusieurs pays appliquent des quotas par motif. Un plafond ne peut porter sur les titres découlant d’engagements internationaux.",
  },
  {
    id: 'p-imm-3',
    axisId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: -1,
    text:
      "Une personne sans titre de séjour qui occupe un emploi depuis au moins trois ans doit être régularisée.",
    context:
      "La loi de 2024 a créé un titre de séjour « métiers en tension », délivré à titre exceptionnel et temporaire, sans droit à la régularisation.",
  },
  {
    id: 'p-imm-4',
    axisId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les conditions du regroupement familial doivent être durcies.",
    context:
      "Le regroupement familial est soumis à des conditions de durée de séjour, de ressources et de logement ; il constitue l’un des motifs de délivrance des titres de séjour, distinct de l’immigration familiale prise dans son ensemble.",
  },
  {
    id: 'p-imm-5',
    axisId: 'integration-identite',
    themeId: 'immigration',
    nature: 'principe',
    polarity: -1,
    text:
      "Une société tient mieux ensemble lorsqu’elle reconnaît les particularités de chacun que lorsqu’elle demande à tous d’adopter des usages communs.",
    context:
      "Ce clivage entre modèle assimilationniste et modèle multiculturel structure le débat dans la plupart des démocraties.",
  },
  {
    id: 'p-imm-6',
    axisId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les prestations sociales non contributives, comme le revenu de solidarité active ou les aides au logement, doivent être réservées aux personnes de nationalité française.",
    context:
      "Une telle distinction se heurterait au principe constitutionnel d’égalité ; ses promoteurs proposent une révision de la Constitution par référendum.",
  },
  {
    id: 'p-imm-7',
    axisId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’acquisition de la nationalité par la naissance en France doit être subordonnée à une démarche de l’intéressé.",
    context:
      "Elle est aujourd’hui automatique à 18 ans sous conditions de résidence, avec possibilité d’anticipation dès 13 ans.",
  },
  {
    id: 'p-imm-8',
    axisId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarity: -1,
    text:
      "Le port de signes religieux doit rester autorisé dans les établissements d’enseignement supérieur.",
    context:
      "L’interdiction de 2004 vise les écoles, collèges et lycées publics et ne s’applique pas à l’université ; des propositions d’extension au supérieur reviennent régulièrement.",
  },
  // — Sécurité et justice —
  {
    id: 'p-sec-1',
    axisId: 'fermete-penale',
    themeId: 'securite',
    nature: 'principe',
    polarity: -1,
    text:
      "La peine a d’abord pour objet de préparer la réinsertion, avant de sanctionner.",
    context:
      "Le code pénal assigne les deux finalités à la peine ; leur hiérarchie relève d’un choix politique.",
  },
  {
    id: 'p-sec-2',
    axisId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarity: 1,
    text:
      "La loi doit fixer des peines minimales que le juge ne peut pas abaisser.",
    context:
      "Instaurées en 2007 et supprimées en 2014, les peines planchers pouvaient être écartées par décision motivée.",
  },
  {
    id: 'p-sec-3',
    axisId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le nombre de places de prison doit augmenter.",
    context:
      "La densité carcérale dépasse 150 % dans les maisons d’arrêt et la France a été condamnée pour les conditions de détention qui en résultent ; le débat porte sur la réponse à y apporter.",
  },
  {
    id: 'p-sec-4',
    axisId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarity: -1,
    text:
      "Les peines exécutées hors de la prison doivent être développées.",
    context:
      "Travail d’intérêt général, bracelet électronique et sursis probatoire concernent déjà une part importante des condamnations.",
  },
  {
    id: 'p-sec-5',
    axisId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’atténuation de peine liée à la minorité ne doit plus s’appliquer par principe aux mineurs de 16 à 18 ans.",
    context:
      "Ce principe a valeur constitutionnelle. Le juge peut déjà l’écarter par décision spécialement motivée ; la question porte sur le renversement de la règle.",
  },
  {
    id: 'p-sec-6',
    axisId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'principe',
    polarity: -1,
    text:
      "Entre la protection de la vie privée et les moyens accordés aux services chargés de la sécurité, la loi doit privilégier la vie privée.",
    context:
      "Vidéoprotection, fichiers de police et techniques de renseignement supposent tous une collecte de données personnelles ; leur encadrement est fixé par la loi, sous le contrôle du Conseil constitutionnel.",
  },
  {
    id: 'p-sec-7',
    axisId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’identification des personnes par reconnaissance faciale doit être autorisée dans l’espace public.",
    context:
      "Le règlement européen sur l’intelligence artificielle encadre strictement l’identification biométrique à distance en temps réel.",
  },
  {
    id: 'p-sec-8',
    axisId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarity: 1,
    text:
      "Le nombre de caméras de surveillance dans l’espace public doit augmenter.",
    context:
      "Les évaluations disponibles concluent à un effet variable selon le type de délinquance et selon l’accompagnement humain du dispositif.",
  },
  {
    id: 'p-sec-9',
    axisId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarity: -1,
    text:
      "La mise en œuvre des techniques de renseignement doit être autorisée par un juge.",
    context:
      "Le contrôle relève aujourd’hui d’une autorité administrative indépendante, la CNCTR, et non d’un magistrat du siège.",
  },
  // — Institutions et démocratie —
  {
    id: 'p-ins-1',
    axisId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'principe',
    polarity: 1,
    text:
      "Sur les sujets qui engagent durablement le pays, la décision doit être prise par référendum plutôt que par le Parlement.",
    context:
      "La Constitution combine les deux procédures : le référendum est prévu par l’article 11, le vote parlementaire est la voie ordinaire.",
  },
  {
    id: 'p-ins-2',
    axisId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: 1,
    text:
      "Un référendum doit pouvoir être déclenché par une pétition citoyenne atteignant un seuil de signatures.",
    context:
      "Le référendum d’initiative partagée, créé en 2008, suppose le soutien d’un cinquième des parlementaires puis d’un dixième des électeurs inscrits, soit environ 4,8 millions de signatures.",
  },
  {
    id: 'p-ins-3',
    axisId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les députés doivent être élus à la représentation proportionnelle.",
    context:
      "Le scrutin majoritaire à deux tours favorise des majorités nettes ; la proportionnelle reflète plus fidèlement les rapports de force.",
  },
  {
    id: 'p-ins-4',
    axisId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: -1,
    text:
      "Le gouvernement doit conserver un moyen de faire adopter un texte lorsque l’Assemblée ne parvient pas à se prononcer.",
    context:
      "L’article 49.3 permet cette adoption, sauf si une motion de censure est votée. Son usage est limité depuis 2008 aux textes budgétaires et à un texte par session.",
  },
  {
    id: 'p-ins-5',
    axisId: 'decentralisation',
    themeId: 'institutions',
    nature: 'principe',
    polarity: -1,
    text:
      "Une règle identique partout garantit mieux l’égalité qu’une règle adaptée à chaque territoire.",
    context:
      "L’unité de la loi et l’adaptation locale sont deux façons opposées de comprendre l’égalité entre citoyens.",
  },
  {
    id: 'p-ins-6',
    axisId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les régions doivent pouvoir adapter les lois nationales, voire y déroger, dans leurs domaines de compétence.",
    context:
      "La Constitution prévoit un droit à l’expérimentation, dont les conditions d’exercice restent restrictives.",
  },
  {
    id: 'p-ins-7',
    axisId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: 1,
    text:
      "Un statut d’autonomie, comportant un pouvoir d’adaptation des lois, doit pouvoir être accordé à une collectivité qui le demande.",
    context:
      "Un projet de révision constitutionnelle sur la Corse a été négocié en 2024 ; plusieurs collectivités d’outre-mer disposent déjà d’un statut de ce type.",
  },
  {
    id: 'p-ins-8',
    axisId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarity: -1,
    text:
      "L’État doit reprendre des compétences aujourd’hui exercées par les collectivités.",
    context:
      "Les collectivités portent une part importante de l’investissement public, avec des écarts de moyens marqués entre territoires.",
  },
  // — Europe, défense et international —
  {
    id: 'p-int-1',
    axisId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'principe',
    polarity: -1,
    text:
      "Un État doit pouvoir cesser d’appliquer une règle internationale lorsqu’elle est contraire à son intérêt national.",
    context:
      "Le droit international repose sur la règle selon laquelle les traités ratifiés doivent être exécutés ; plusieurs États en ont néanmoins suspendu unilatéralement l’application.",
  },
  {
    id: 'p-int-2',
    axisId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarity: -1,
    text:
      "En cas de contradiction, le droit français doit l’emporter sur le droit de l’Union européenne.",
    context:
      "La primauté du droit de l’Union est un principe fondateur ; le Conseil constitutionnel réserve le cas de l’identité constitutionnelle de la France.",
  },
  {
    id: 'p-int-3',
    axisId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarity: 1,
    text:
      "L’Union européenne doit pouvoir recourir durablement à l’emprunt commun pour financer ses politiques, comme la défense ou l’énergie.",
    context:
      "Le plan de relance de 2020 a créé un précédent d’emprunt commun, présenté à l’époque comme exceptionnel et non reconductible.",
  },
  {
    id: 'p-int-4',
    axisId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarity: 1,
    text:
      "Les décisions fiscales européennes doivent pouvoir être prises sans l’accord de tous les États membres.",
    context:
      "L’unanimité protège le veto de chaque État et bloque de nombreux dossiers, dont la fiscalité et la politique étrangère.",
  },
  {
    id: 'p-int-5',
    axisId: 'defense-alliances',
    themeId: 'international',
    nature: 'principe',
    polarity: 1,
    text:
      "La sécurité du pays est mieux assurée au sein d’alliances militaires que par une défense indépendante.",
    context:
      "La France combine les deux : elle appartient à l’OTAN et conserve une dissuasion nucléaire autonome.",
  },
  {
    id: 'p-int-6',
    axisId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarity: 1,
    text:
      "La part du budget de l’État consacrée à la défense doit augmenter.",
    context:
      "La loi de programmation militaire 2024-2030 prévoit 413 milliards d’euros, soit un effort proche de 2 % du produit intérieur brut.",
  },
  {
    id: 'p-int-7',
    axisId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarity: -1,
    text:
      "La France doit quitter le commandement militaire intégré de l’OTAN.",
    context:
      "La France a quitté ce commandement en 1966 et l’a réintégré en 2009, tout en conservant en propre sa dissuasion nucléaire.",
  },
  {
    id: 'p-int-8',
    axisId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarity: 1,
    text:
      "La France doit continuer à livrer des armes à l’Ukraine.",
    context:
      "Le soutien français combine livraisons d’équipements, formation et accord bilatéral de sécurité signé en 2024.",
  },
]
export const themeById = new Map(themes.map((t) => [t.id, t]))
export const axisById = new Map(axes.map((a) => [a.id, a]))
export const propositionById = new Map(propositions.map((p) => [p.id, p]))

export const propositionsByTheme = themes.map((theme) => ({
  theme,
  propositions: propositions.filter((p) => p.themeId === theme.id),
}))
