import type { Axe, Proposition, Theme } from './types'

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
    nom: 'Économie et travail',
    resume: "Emploi, entreprises, place de l'État dans l'économie et échanges internationaux.",
    icone: '⚙',
  },
  {
    id: 'fiscalite',
    nom: 'Fiscalité et dépense publique',
    resume: "Niveau des prélèvements, progressivité de l'impôt et équilibre des comptes.",
    icone: '€',
  },
  {
    id: 'social',
    nom: 'Protection sociale, retraites et santé',
    resume: "Âge de départ, financement de la protection sociale, hôpital et accès aux soins.",
    icone: '♥',
  },
  {
    id: 'ecologie',
    nom: 'Écologie et énergie',
    resume: "Rythme de la transition, contraintes réglementaires et composition du mix énergétique.",
    icone: '☘',
  },
  {
    id: 'immigration',
    nom: 'Immigration et identité',
    resume: "Entrées sur le territoire, conditions d'accès à la nationalité et modèle d'intégration.",
    icone: '⇄',
  },
  {
    id: 'securite',
    nom: 'Sécurité et justice',
    resume: "Réponse pénale, moyens de police, équilibre entre libertés publiques et surveillance.",
    icone: '⚖',
  },
  {
    id: 'institutions',
    nom: 'Institutions et démocratie',
    resume: "Mode de scrutin, participation citoyenne, équilibre entre l'État et les territoires.",
    icone: '◫',
  },
  {
    id: 'international',
    nom: 'Europe, défense et international',
    resume: "Place de la France dans l'Union européenne, alliances militaires et effort de défense.",
    icone: '◈',
  },
]

export const axes: Axe[] = [
  {
    id: 'marche-travail',
    themeId: 'economie',
    nom: 'Marché du travail',
    poleNegatif: 'Protéger l’emploi par la loi',
    polePositif: 'Assouplir les règles du travail',
    resume: "Faut-il sécuriser les parcours par la réglementation ou fluidifier l'embauche et le licenciement ?",
    boussole: { eco: 1, soc: 0 },
  },
  {
    id: 'interventionnisme',
    themeId: 'economie',
    nom: 'Rôle de l’État et échanges',
    poleNegatif: 'Ouverture et libre-échange',
    polePositif: 'État stratège et protections commerciales',
    resume: "L'État doit-il s'effacer devant le marché ou piloter et protéger les filières jugées stratégiques ?",
    boussole: { eco: 0, soc: 0.5 },
  },
  {
    id: 'pression-fiscale',
    themeId: 'fiscalite',
    nom: 'Niveau des prélèvements',
    poleNegatif: 'Baisser les impôts et la dépense',
    polePositif: 'Augmenter les recettes publiques',
    resume: "Réduire la part des prélèvements dans la richesse produite, ou la relever pour financer l'action publique ?",
    boussole: { eco: -1, soc: 0 },
  },
  {
    id: 'redistribution',
    themeId: 'fiscalite',
    nom: 'Redistribution',
    poleNegatif: "Récompenser l'effort individuel",
    polePositif: 'Réduire les écarts de revenus',
    resume: "L'écart entre les revenus doit-il être corrigé par la puissance publique, ou reflète-t-il des contributions différentes ?",
    boussole: { eco: -1, soc: 0 },
  },
  {
    id: 'retraites',
    themeId: 'social',
    nom: 'Retraites',
    poleNegatif: "Reculer l'âge de départ",
    polePositif: "Abaisser l'âge de départ",
    resume: "Équilibrer le système par la durée de travail, ou par d'autres ressources afin de partir plus tôt ?",
    boussole: { eco: -1, soc: 0 },
  },
  {
    id: 'services-publics',
    themeId: 'social',
    nom: 'Services publics',
    poleNegatif: "Rationaliser l'offre publique",
    polePositif: 'Étendre les services publics',
    resume: "Faut-il resserrer le périmètre de l'État et ouvrir au privé, ou renforcer l'offre publique ?",
    boussole: { eco: -1, soc: 0 },
  },
  {
    id: 'ambition-climat',
    themeId: 'ecologie',
    nom: 'Rythme de la transition',
    poleNegatif: 'Transition graduelle et incitative',
    polePositif: 'Planification écologique contraignante',
    resume: "Accompagner la transition par l'incitation, ou l'imposer par la norme et l'investissement public ?",
    boussole: { eco: -0.5, soc: -0.5 },
  },
  {
    id: 'mix-energetique',
    themeId: 'ecologie',
    nom: 'Mix énergétique',
    poleNegatif: 'Priorité au nucléaire',
    polePositif: 'Priorité aux énergies renouvelables',
    resume: "Sur quelle source adosser en priorité la production d'électricité décarbonée ?",
    boussole: { eco: 0, soc: 0 },
  },
  {
    id: 'flux-migratoires',
    themeId: 'immigration',
    nom: 'Flux migratoires',
    poleNegatif: 'Accueil et régularisation',
    polePositif: 'Restriction des entrées',
    resume: "Ouvrir des voies légales et régulariser, ou réduire le nombre d'entrées et durcir les conditions ?",
    boussole: { eco: 0, soc: 1 },
  },
  {
    id: 'integration-identite',
    themeId: 'immigration',
    nom: 'Modèle d’intégration',
    poleNegatif: 'Reconnaissance des différences',
    polePositif: 'Assimilation et priorité nationale',
    resume: "L'appartenance à la nation passe-t-elle par la reconnaissance des particularités ou par leur effacement dans l'espace public ?",
    boussole: { eco: 0, soc: 1 },
  },
  {
    id: 'fermete-penale',
    themeId: 'securite',
    nom: 'Réponse pénale',
    poleNegatif: 'Prévention et réinsertion',
    polePositif: 'Fermeté et automaticité des peines',
    resume: "Réduire la délinquance par l'accompagnement en amont, ou par une sanction plus systématique ?",
    boussole: { eco: 0, soc: 1 },
  },
  {
    id: 'libertes-surveillance',
    themeId: 'securite',
    nom: 'Libertés et surveillance',
    poleNegatif: 'Priorité aux libertés publiques',
    polePositif: 'Priorité aux moyens de surveillance',
    resume: "Jusqu'où étendre les outils de sécurité quand ils réduisent l'anonymat dans l'espace public ?",
    boussole: { eco: 0, soc: 0.7 },
  },
  {
    id: 'democratie-directe',
    themeId: 'institutions',
    nom: 'Participation citoyenne',
    poleNegatif: 'Démocratie représentative classique',
    polePositif: 'Démocratie directe et proportionnelle',
    resume: "Le pouvoir doit-il rester entre les mains des élus, ou revenir plus souvent aux citoyens entre deux élections ?",
    boussole: { eco: 0, soc: 0 },
  },
  {
    id: 'decentralisation',
    themeId: 'institutions',
    nom: 'Organisation territoriale',
    poleNegatif: 'État central fort',
    polePositif: 'Pouvoir accru aux territoires',
    resume: "Garantir l'égalité par l'uniformité nationale, ou adapter les règles au plus près du terrain ?",
    boussole: { eco: 0, soc: 0 },
  },
  {
    id: 'souverainete-europeenne',
    themeId: 'international',
    nom: 'Souveraineté et Europe',
    poleNegatif: "Souveraineté nationale d'abord",
    polePositif: "Approfondir l'intégration européenne",
    resume: "Reprendre des compétences à l'Union européenne, ou en transférer davantage pour peser collectivement ?",
    boussole: { eco: 0, soc: -0.8 },
  },
  {
    id: 'defense-alliances',
    themeId: 'international',
    nom: 'Défense et alliances',
    poleNegatif: 'Autonomie stratégique et non-alignement',
    polePositif: 'Alliances occidentales et effort de défense',
    resume: "Prendre ses distances avec les alliances existantes, ou renforcer l'engagement militaire et atlantique ?",
    boussole: { eco: 0, soc: 0.3 },
  },
]

export const propositions: Proposition[] = [
  // — Économie et travail —
  {
    id: 'p-eco-1',
    axeId: 'marche-travail',
    themeId: 'economie',
    nature: 'principe',
    polarite: -1,
    texte:
      "Entre la stabilité de l’emploi et la souplesse de gestion des entreprises, la loi doit privilégier la stabilité.",
    contexte:
      "Les deux objectifs sont poursuivis par tous les pays développés ; ils entrent en tension dès qu’il s’agit de fixer les règles du licenciement.",
  },
  {
    id: 'p-eco-2',
    axeId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un employeur doit pouvoir rompre un contrat de travail plus facilement qu’aujourd’hui.",
    contexte:
      "Le droit du licenciement a été modifié à plusieurs reprises depuis 2016, notamment sur le barème des indemnités prud’homales.",
  },
  {
    id: 'p-eco-3',
    axeId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarite: -1,
    texte:
      "La durée légale du travail doit être abaissée en dessous de 35 heures hebdomadaires.",
    contexte:
      "La durée légale est fixée à 35 heures depuis 2000. Elle détermine le seuil de déclenchement des heures supplémentaires, pas un plafond de travail.",
  },
  {
    id: 'p-eco-4',
    axeId: 'marche-travail',
    themeId: 'economie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le versement des allocations chômage doit être suspendu après le refus de plusieurs offres d’emploi.",
    contexte:
      "Un dispositif de ce type existe déjà ; le débat porte sur le nombre de refus, la définition d’une offre acceptable et la durée de la suspension.",
  },
  {
    id: 'p-eco-5',
    axeId: 'interventionnisme',
    themeId: 'economie',
    nature: 'principe',
    polarite: 1,
    texte:
      "Lorsqu’un intérêt économique national est en jeu, l’État doit pouvoir passer outre les règles du marché.",
    contexte:
      "Cette question traverse les familles politiques : elle oppose la confiance dans la concurrence à la volonté de piloter certaines activités.",
  },
  {
    id: 'p-eco-6',
    axeId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "L’État doit pouvoir prendre le contrôle du capital d’entreprises qu’il juge stratégiques.",
    contexte:
      "L’État détient déjà des participations dans plusieurs grands groupes ; la nationalisation complète reste un outil exceptionnel.",
  },
  {
    id: 'p-eco-7',
    axeId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Des droits de douane doivent être appliqués aux produits importés qui concurrencent la production française.",
    contexte:
      "La politique commerciale est une compétence exclusive de l’Union européenne : une mesure nationale supposerait de renégocier ce cadre.",
  },
  {
    id: 'p-eco-8',
    axeId: 'interventionnisme',
    themeId: 'economie',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Les accords de libre-échange négociés par l’Union européenne doivent être ratifiés.",
    contexte:
      "Ces accords ouvrent des débouchés à l’exportation et exposent certaines filières, agricoles notamment, à une concurrence accrue.",
  },
  // — Fiscalité et dépense publique —
  {
    id: 'p-fis-1',
    axeId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'principe',
    polarite: -1,
    texte:
      "Entre baisser les impôts et maintenir le niveau des services publics, la priorité doit aller à la baisse des impôts.",
    contexte:
      "La France figure parmi les pays où le taux de prélèvements obligatoires est le plus élevé, comme le niveau de dépense publique.",
  },
  {
    id: 'p-fis-2',
    axeId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Le nombre d’agents publics doit diminuer au cours du prochain quinquennat.",
    contexte:
      "La fonction publique compte environ 5,7 millions d’agents, dont plus de la moitié dans les collectivités territoriales et l’hôpital.",
  },
  {
    id: 'p-fis-3',
    axeId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un impôt annuel doit porter sur les patrimoines les plus élevés.",
    contexte:
      "L’impôt de solidarité sur la fortune a été remplacé en 2018 par un impôt limité au patrimoine immobilier.",
  },
  {
    id: 'p-fis-4',
    axeId: 'pression-fiscale',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Les droits de succession doivent augmenter sur les patrimoines les plus élevés.",
    contexte:
      "Les taux français sont parmi les plus élevés de l’OCDE, avec de nombreux dispositifs d’exonération qui en réduisent la portée.",
  },
  {
    id: 'p-fis-5',
    axeId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'principe',
    polarite: -1,
    texte:
      "Un écart de revenus important est acceptable lorsqu’il récompense un effort ou une prise de risque.",
    contexte:
      "L’acceptabilité des inégalités est l’un des clivages les plus stables mesurés par les enquêtes d’opinion, indépendamment de l’actualité.",
  },
  {
    id: 'p-fis-6',
    axeId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'principe',
    polarite: 1,
    texte:
      "La collectivité doit garantir à chacun un revenu minimum, sans condition d’activité.",
    contexte:
      "Plusieurs pays ont expérimenté un revenu inconditionnel. En France, les minima sociaux restent conditionnés à des critères de ressources ou d’insertion.",
  },
  {
    id: 'p-fis-7',
    axeId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La loi doit plafonner l’écart de rémunération au sein d’une même entreprise.",
    contexte:
      "Aucun pays du G7 n’applique aujourd’hui un tel plafond légal ; certains imposent la publication de l’écart.",
  },
  {
    id: 'p-fis-8',
    axeId: 'redistribution',
    themeId: 'fiscalite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le salaire minimum doit augmenter plus vite que l’inflation.",
    contexte:
      "Le SMIC est revalorisé automatiquement selon l’inflation ; une hausse supérieure relève d’une décision discrétionnaire du gouvernement.",
  },
  // — Protection sociale, retraites et santé —
  {
    id: 'p-soc-1',
    axeId: 'retraites',
    themeId: 'social',
    nature: 'principe',
    polarite: -1,
    texte:
      "L’équilibre du système de retraite doit être recherché en travaillant plus longtemps plutôt qu’en augmentant les prélèvements.",
    contexte:
      "Trois leviers existent et se substituent l’un à l’autre : la durée d’activité, le niveau des cotisations et le montant des pensions.",
  },
  {
    id: 'p-soc-2',
    axeId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarite: 1,
    texte:
      "L’âge légal de départ à la retraite doit être abaissé.",
    contexte:
      "La réforme de 2023 porte l’âge légal à 64 ans. Le Conseil d’orientation des retraites publie chaque année des projections d’équilibre.",
  },
  {
    id: 'p-soc-3',
    axeId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarite: -1,
    texte:
      "La durée de cotisation exigée pour une retraite à taux plein doit être allongée.",
    contexte:
      "Cette durée augmente déjà progressivement pour atteindre 43 annuités, indépendamment de l’âge légal.",
  },
  {
    id: 'p-soc-4',
    axeId: 'retraites',
    themeId: 'social',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un travail reconnu comme pénible doit ouvrir un départ anticipé sans réduction de pension.",
    contexte:
      "Le compte professionnel de prévention couvre six facteurs de risque depuis 2017, après en avoir couvert dix.",
  },
  {
    id: 'p-soc-5',
    axeId: 'services-publics',
    themeId: 'social',
    nature: 'principe',
    polarite: 1,
    texte:
      "Un service public doit rester accessible partout, même là où il coûte plus qu’il ne rapporte.",
    contexte:
      "La question se pose pour l’école, la poste, l’hôpital ou le rail dans les zones peu peuplées.",
  },
  {
    id: 'p-soc-6',
    axeId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le nombre de soignants à l’hôpital public doit augmenter, même si le déficit se creuse.",
    contexte:
      "Le déficit des hôpitaux publics s’est creusé depuis 2022, dans un contexte de postes durablement non pourvus.",
  },
  {
    id: 'p-soc-7',
    axeId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le lieu d’installation des médecins libéraux doit être encadré par la puissance publique.",
    contexte:
      "Une régulation à l’installation existe pour les infirmiers et les pharmaciens, mais pas pour les médecins.",
  },
  {
    id: 'p-soc-8',
    axeId: 'services-publics',
    themeId: 'social',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Une part plus grande de l’offre de soins et d’enseignement peut être assurée par des acteurs privés.",
    contexte:
      "Le privé assure déjà une part significative de l’offre de soins ; l’enseignement privé sous contrat scolarise environ 17 % des élèves.",
  },
  // — Écologie et énergie —
  {
    id: 'p-ecolo-1',
    axeId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'principe',
    polarite: 1,
    texte:
      "La protection de l’environnement doit primer sur la croissance économique lorsque les deux s’opposent.",
    contexte:
      "Les deux objectifs coïncident dans certains secteurs et divergent dans d’autres ; cette question porte sur les cas de divergence.",
  },
  {
    id: 'p-ecolo-2',
    axeId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'principe',
    polarite: 1,
    texte:
      "Pour réduire les émissions, l’État doit imposer des changements de mode de vie plutôt que s’en remettre aux choix individuels.",
    contexte:
      "La contrainte réglementaire et l’incitation économique sont les deux instruments classiques des politiques environnementales.",
  },
  {
    id: 'p-ecolo-3',
    axeId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Les obligations environnementales pesant sur les exploitations agricoles doivent être réduites.",
    contexte:
      "Ces obligations résultent en grande partie de règles européennes ; les mobilisations agricoles de 2024 ont porté sur leur charge administrative.",
  },
  {
    id: 'p-ecolo-4',
    axeId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La vente de véhicules neufs à moteur thermique doit cesser à une date fixée par la loi.",
    contexte:
      "Un règlement européen fixe cette échéance à 2035, assortie d’une clause de réexamen.",
  },
  {
    id: 'p-ecolo-5',
    axeId: 'ambition-climat',
    themeId: 'ecologie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La rénovation énergétique des logements doit être financée par l’emprunt public.",
    contexte:
      "Les estimations de besoin d’investissement pour le bâtiment se situent entre 15 et 25 milliards d’euros par an.",
  },
  {
    id: 'p-ecolo-6',
    axeId: 'mix-energetique',
    themeId: 'ecologie',
    nature: 'mesure',
    polarite: -1,
    texte:
      "De nouveaux réacteurs nucléaires doivent être construits en France.",
    contexte:
      "Un programme de six réacteurs a été engagé ; les débats portent sur le calendrier, le coût et le mode de financement.",
  },
  {
    id: 'p-ecolo-7',
    axeId: 'mix-energetique',
    themeId: 'ecologie',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La production d’électricité éolienne doit augmenter, y compris en mer.",
    contexte:
      "La France est en retard sur ses objectifs de production renouvelable ; l’éolien terrestre suscite des oppositions locales.",
  },
  // — Immigration et identité —
  {
    id: 'p-imm-1',
    axeId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'principe',
    polarite: 1,
    texte:
      "L’entrée sur le territoire relève d’abord d’une décision souveraine de la nation, avant d’être un droit de la personne.",
    contexte:
      "Le droit d’asile et le droit à la vie familiale découlent d’engagements internationaux ratifiés par la France.",
  },
  {
    id: 'p-imm-2',
    axeId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le Parlement doit fixer chaque année un plafond au nombre de titres de séjour délivrés.",
    contexte:
      "Plusieurs pays appliquent des quotas par motif. Un plafond ne peut porter sur les titres découlant d’engagements internationaux.",
  },
  {
    id: 'p-imm-3',
    axeId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Une personne sans titre de séjour qui travaille depuis plusieurs années doit pouvoir être régularisée.",
    contexte:
      "La loi de 2024 a créé un titre de séjour « métiers en tension », délivré à titre exceptionnel et temporaire.",
  },
  {
    id: 'p-imm-4',
    axeId: 'flux-migratoires',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Les conditions du regroupement familial doivent être durcies.",
    contexte:
      "Le regroupement familial représente une part minoritaire des premiers titres de séjour délivrés chaque année.",
  },
  {
    id: 'p-imm-5',
    axeId: 'integration-identite',
    themeId: 'immigration',
    nature: 'principe',
    polarite: 1,
    texte:
      "Une société tient mieux ensemble lorsqu’elle demande à chacun d’adopter des usages communs que lorsqu’elle reconnaît les particularités de chacun.",
    contexte:
      "Ce clivage entre modèle assimilationniste et modèle multiculturel structure le débat dans la plupart des démocraties.",
  },
  {
    id: 'p-imm-6',
    axeId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Certaines prestations sociales doivent être réservées aux personnes de nationalité française.",
    contexte:
      "Une telle distinction se heurterait au principe constitutionnel d’égalité ; ses promoteurs proposent une révision de la Constitution.",
  },
  {
    id: 'p-imm-7',
    axeId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: 1,
    texte:
      "L’acquisition de la nationalité par la naissance en France doit être subordonnée à une démarche de l’intéressé.",
    contexte:
      "Elle est aujourd’hui automatique à 18 ans sous conditions de résidence, avec possibilité d’anticipation dès 13 ans.",
  },
  {
    id: 'p-imm-8',
    axeId: 'integration-identite',
    themeId: 'immigration',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Le port de signes religieux doit être autorisé dans l’ensemble des établissements d’enseignement supérieur.",
    contexte:
      "L’interdiction de 2004 vise les écoles, collèges et lycées publics ; elle ne s’applique pas à l’université.",
  },
  // — Sécurité et justice —
  {
    id: 'p-sec-1',
    axeId: 'fermete-penale',
    themeId: 'securite',
    nature: 'principe',
    polarite: 1,
    texte:
      "La peine a d’abord pour objet de sanctionner, avant de préparer la réinsertion.",
    contexte:
      "Le code pénal assigne les deux finalités à la peine ; leur hiérarchie relève d’un choix politique.",
  },
  {
    id: 'p-sec-2',
    axeId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La loi doit fixer des peines minimales que le juge ne peut pas abaisser.",
    contexte:
      "Instaurées en 2007 et supprimées en 2014, les peines planchers pouvaient être écartées par décision motivée.",
  },
  {
    id: 'p-sec-3',
    axeId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le nombre de places de prison doit augmenter.",
    contexte:
      "La densité carcérale dépasse 150 % dans les maisons d’arrêt, ce qui a valu à la France plusieurs condamnations européennes.",
  },
  {
    id: 'p-sec-4',
    axeId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarite: -1,
    texte:
      "Les peines exécutées hors de la prison doivent être développées.",
    contexte:
      "Travail d’intérêt général, bracelet électronique et sursis probatoire concernent déjà une part importante des condamnations.",
  },
  {
    id: 'p-sec-5',
    axeId: 'fermete-penale',
    themeId: 'securite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un mineur délinquant doit pouvoir être jugé comme un majeur.",
    contexte:
      "L’atténuation de la peine en raison de la minorité a valeur constitutionnelle ; le juge peut déjà l’écarter par décision motivée.",
  },
  {
    id: 'p-sec-6',
    axeId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'principe',
    polarite: -1,
    texte:
      "Entre la protection de la vie privée et l’efficacité des dispositifs de sécurité, la loi doit privilégier la vie privée.",
    contexte:
      "Les deux termes sont nommés pour éviter de faire porter l’énoncé par un seul des deux camps. La question porte sur l’arbitrage, indépendamment de l’efficacité réelle de tel ou tel dispositif.",
  },
  {
    id: 'p-sec-7',
    axeId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "L’identification des personnes par reconnaissance faciale doit être autorisée dans l’espace public.",
    contexte:
      "Le règlement européen sur l’intelligence artificielle encadre strictement l’identification biométrique à distance en temps réel.",
  },
  {
    id: 'p-sec-8',
    axeId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le nombre de caméras de surveillance dans l’espace public doit augmenter.",
    contexte:
      "Les évaluations disponibles concluent à un effet variable selon le type de délinquance et selon l’accompagnement humain du dispositif.",
  },
  {
    id: 'p-sec-9',
    axeId: 'libertes-surveillance',
    themeId: 'securite',
    nature: 'mesure',
    polarite: -1,
    texte:
      "La mise en œuvre des techniques de renseignement doit être autorisée par un juge.",
    contexte:
      "Le contrôle relève aujourd’hui d’une autorité administrative indépendante, la CNCTR, et non d’un magistrat du siège.",
  },
  // — Institutions et démocratie —
  {
    id: 'p-ins-1',
    axeId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'principe',
    polarite: 1,
    texte:
      "Sur les sujets qui engagent durablement le pays, la décision revient aux citoyens plutôt qu’aux élus.",
    contexte:
      "La Constitution combine les deux logiques : représentation parlementaire et recours au référendum.",
  },
  {
    id: 'p-ins-2',
    axeId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un référendum doit pouvoir être déclenché par une pétition citoyenne atteignant un seuil de signatures.",
    contexte:
      "Le référendum d’initiative partagée existe depuis 2008 mais n’a jamais abouti, faute d’atteindre les seuils requis.",
  },
  {
    id: 'p-ins-3',
    axeId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Les députés doivent être élus à la représentation proportionnelle.",
    contexte:
      "Le scrutin majoritaire à deux tours favorise des majorités nettes ; la proportionnelle reflète plus fidèlement les rapports de force.",
  },
  {
    id: 'p-ins-4',
    axeId: 'democratie-directe',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Le gouvernement doit perdre la possibilité de faire adopter un texte sans vote de l’Assemblée.",
    contexte:
      "L’article 49.3 permet cette adoption, sauf motion de censure. Son usage est limité depuis 2008 hors textes budgétaires.",
  },
  {
    id: 'p-ins-5',
    axeId: 'decentralisation',
    themeId: 'institutions',
    nature: 'principe',
    polarite: -1,
    texte:
      "Une règle identique partout garantit mieux l’égalité qu’une règle adaptée à chaque territoire.",
    contexte:
      "L’unité de la loi et l’adaptation locale sont deux façons opposées de comprendre l’égalité entre citoyens.",
  },
  {
    id: 'p-ins-6',
    axeId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Les régions doivent pouvoir édicter leurs propres règles dans leurs domaines de compétence.",
    contexte:
      "La Constitution prévoit un droit à l’expérimentation, dont les conditions d’exercice restent restrictives.",
  },
  {
    id: 'p-ins-7',
    axeId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Un statut d’autonomie doit pouvoir être accordé à un territoire qui le demande.",
    contexte:
      "Un projet de révision constitutionnelle sur la Corse a été négocié en 2024 ; son adoption suppose une majorité des trois cinquièmes du Congrès.",
  },
  {
    id: 'p-ins-8',
    axeId: 'decentralisation',
    themeId: 'institutions',
    nature: 'mesure',
    polarite: -1,
    texte:
      "L’État doit reprendre des compétences aujourd’hui exercées par les collectivités.",
    contexte:
      "Les collectivités portent une part importante de l’investissement public, avec des écarts de moyens marqués entre territoires.",
  },
  // — Europe, défense et international —
  {
    id: 'p-int-1',
    axeId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'principe',
    polarite: -1,
    texte:
      "Un État doit pouvoir écarter une règle internationale qu’il a acceptée, s’il l’estime contraire à son intérêt.",
    contexte:
      "Cette question porte sur la valeur de l’engagement international en général, avant tout cas particulier.",
  },
  {
    id: 'p-int-2',
    axeId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarite: -1,
    texte:
      "En cas de contradiction, le droit français doit l’emporter sur le droit de l’Union européenne.",
    contexte:
      "La primauté du droit de l’Union est un principe fondateur ; le Conseil constitutionnel réserve le cas de l’identité constitutionnelle de la France.",
  },
  {
    id: 'p-int-3',
    axeId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarite: 1,
    texte:
      "L’Union européenne doit pouvoir emprunter en commun pour financer des dépenses communes.",
    contexte:
      "Le plan de relance de 2020 a créé un précédent d’emprunt commun, présenté à l’époque comme exceptionnel.",
  },
  {
    id: 'p-int-4',
    axeId: 'souverainete-europeenne',
    themeId: 'international',
    nature: 'mesure',
    polarite: 1,
    texte:
      "Les décisions fiscales européennes doivent pouvoir être prises sans l’accord de tous les États membres.",
    contexte:
      "L’unanimité protège le veto de chaque État et bloque de nombreux dossiers, dont la fiscalité et la politique étrangère.",
  },
  {
    id: 'p-int-5',
    axeId: 'defense-alliances',
    themeId: 'international',
    nature: 'principe',
    polarite: 1,
    texte:
      "La sécurité du pays est mieux assurée au sein d’alliances militaires que par une défense indépendante.",
    contexte:
      "La France combine les deux : elle appartient à l’OTAN et conserve une dissuasion nucléaire autonome.",
  },
  {
    id: 'p-int-6',
    axeId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La part du budget de l’État consacrée à la défense doit augmenter.",
    contexte:
      "La loi de programmation militaire 2024-2030 prévoit 413 milliards d’euros, soit un effort proche de 2 % du produit intérieur brut.",
  },
  {
    id: 'p-int-7',
    axeId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La France doit rester dans le commandement militaire intégré de l’OTAN.",
    contexte:
      "La France a quitté ce commandement en 1966 et l’a réintégré en 2009, tout en conservant sa dissuasion autonome.",
  },
  {
    id: 'p-int-8',
    axeId: 'defense-alliances',
    themeId: 'international',
    nature: 'mesure',
    polarite: 1,
    texte:
      "La France doit continuer à livrer des armes à l’Ukraine.",
    contexte:
      "Le soutien français combine livraisons d’équipements, formation et accord bilatéral de sécurité signé en 2024.",
  },
]
export const themeById = new Map(themes.map((t) => [t.id, t]))
export const axeById = new Map(axes.map((a) => [a.id, a]))
export const propositionById = new Map(propositions.map((p) => [p.id, p]))

export const propositionsParTheme = themes.map((theme) => ({
  theme,
  propositions: propositions.filter((p) => p.themeId === theme.id),
}))
