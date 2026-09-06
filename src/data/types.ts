/**
 * Modèle de données de « Président, que choisir ? ».
 *
 * Deux familles d'information cohabitent, volontairement séparées :
 *
 *  1. Les ORIENTATIONS (axes, propositions, mesures) — elles n'ont ni bonne ni
 *     mauvaise valeur. On les compare à celles de l'utilisateur, on ne les note pas.
 *  2. Les CRITÈRES DE NOTATION (probité, assiduité, clarté du programme…) — ils
 *     produisent une note 0–100 à partir d'indicateurs factuels et d'un barème
 *     publiquement écrit. Chaque note porte sa justification et ses sources.
 *
 * Toute affirmation factuelle porte un niveau de vérification et des sources.
 */

/** Niveau de vérification d'une donnée. Rien n'est affiché sans ce marqueur. */
export type Verification =
  /**
   * Recoupé sur une source primaire consultée directement : décision de
   * justice, déclaration HATVP, Journal officiel, scrutin d'une assemblée.
   */
  | 'verifie'
  /**
   * Recoupé sur au moins deux sources secondaires indépendantes et
   * concordantes, avec la référence de la source primaire identifiée mais
   * non ouverte. Statut intermédiaire honnête : plus solide qu'une simple
   * saisie, moins qu'une lecture du document lui-même.
   */
  | 'recoupe'
  /** Saisi depuis une source secondaire unique, en attente de recoupement. */
  | 'a-verifier'
  /** Synthèse éditoriale d'une ligne politique, pas une citation. */
  | 'estimation'

export type SourceType =
  | 'officiel'
  | 'institution'
  | 'presse'
  | 'programme'
  | 'ong'
  | 'universitaire'

export interface Source {
  id: string
  title: string
  publisher: string
  url: string
  /** Date de publication ou de consultation, ISO `AAAA-MM-JJ`. */
  date: string
  type: SourceType
}

/** Position sur un axe, échelle de Likert symétrique. */
export type Likert = -2 | -1 | 0 | 1 | 2

/** Importance accordée par l'utilisateur à une proposition. */
export type Importance = 0 | 1 | 2 | 3

export interface Theme {
  id: string
  lastName: string
  /** Une phrase : ce que le thème recouvre. */
  summary: string
  /** Glyphe décoratif (aria-hidden côté rendu). */
  icon: string
}

/**
 * Un axe est un continuum entre deux pôles nommés. Les deux pôles sont rédigés
 * pour être également défendables : c'est la condition d'un questionnaire neutre.
 */
export interface Axis {
  id: string
  lastName: string
  themeId: string
  /** Libellé du pôle −2. */
  negativePole: string
  /** Libellé du pôle +2. */
  positivePole: string
  summary: string
  /**
   * Contribution de l'axe aux deux dimensions de la boussole 2D.
   * `eco` : axe économique gauche(−)/droite(+). `soc` : axe culturel
   * ouvert(−)/conservateur(+). 0 = l'axe ne pèse pas sur cette dimension.
   */
  compass: { eco: number; soc: number }
}

/**
 * Nature d'une proposition.
 *
 * La distinction n'est pas cosmétique : un questionnaire composé uniquement de
 * mesures d'actualité mesure surtout la position d'une personne dans le débat
 * du moment. Les propositions de principe portent sur des arbitrages de valeurs
 * qui survivent au cycle médiatique, et permettent une version courte du
 * questionnaire.
 */
export type PropositionNature =
  /** Arbitrage de valeurs, formulé indépendamment de l'actualité. */
  | 'principe'
  /** Mesure concrète, telle qu'elle se discute aujourd'hui. */
  | 'mesure'

export interface Proposition {
  id: string
  axisId: string
  themeId: string
  nature: PropositionNature
  /**
   * Énoncé soumis à l'utilisateur. Les règles de rédaction sont listées en tête
   * de `referentiel.ts` et contrôlées automatiquement par `npm run lint:data`.
   */
  text: string
  /** +1 : « d'accord » pousse vers le pôle positif de l'axe. −1 : l'inverse. */
  polarity: 1 | -1
  /** Contexte factuel affiché sous la question, sans prise de position. */
  context: string
}

// ---------------------------------------------------------------------------
// Critères de notation
// ---------------------------------------------------------------------------

export type CriterionFamily = 'integrite' | 'competence' | 'programme' | 'action'

/** Un palier du barème : « à partir de `min` points, la note se lit ainsi ». */
export interface ScaleTier {
  min: number
  label: string
}

export interface Criterion {
  id: string
  lastName: string
  /** Nom abrégé, pour les axes de graphiques et les en-têtes de tableaux. */
  shortName: string
  family: CriterionFamily
  /** Ce que le critère prétend mesurer, en une phrase. */
  summary: string
  /** La question à laquelle la note répond. */
  question: string
  /** Les indicateurs factuels qui alimentent la note. */
  indicators: string[]
  /** Les règles de calcul, en français, telles qu'appliquées. */
  scale: string[]
  tiers: ScaleTier[]
  /** Ce que la note ne dit pas. Affiché systématiquement à côté du score. */
  limits: string
  /** Poids par défaut, 0–5. */
  defaultWeight: number
  /**
   * `true` quand le critère repose sur un jugement de valeur que des gens
   * raisonnables peuvent refuser. L'interface l'affiche et permet de le neutraliser.
   */
  debatable: boolean
  /** Sens de lecture : une note haute est-elle toujours souhaitable ? */
  readingDirection: string
}

export type Confidence = 'haute' | 'moyenne' | 'faible'

export interface CriterionRating {
  criterionId: string
  /** 0–100. */
  rating: number
  confidence: Confidence
  /** Pourquoi cette note, en citant les faits retenus. */
  rationale: string
  sourceIds: string[]
  verification: Verification
}

// ---------------------------------------------------------------------------
// Faits, judiciaire, programme
// ---------------------------------------------------------------------------

export type FactCategory =
  | 'mandat'
  | 'reforme'
  | 'election'
  | 'prise-de-position'
  | 'controverse'
  | 'judiciaire'

export interface Fact {
  id: string
  /** ISO `AAAA` ou `AAAA-MM` ou `AAAA-MM-JJ`. */
  date: string
  title: string
  description: string
  category: FactCategory
  scope: 'majeur' | 'notable'
  verification: Verification
  sourceIds: string[]
}

/**
 * État procédural d'une affaire. Le vocabulaire est celui du droit français :
 * une mise en examen n'est pas une condamnation, une condamnation frappée
 * d'appel n'est pas définitive. L'interface ne mélange jamais ces états.
 */
export type LegalStatus =
  | 'condamnation-definitive'
  /** Condamné en appel, pourvoi en cassation pendant : les faits sont jugés deux fois. */
  | 'condamnation-appel-pourvoi'
  /** Condamné en première instance, appel pendant. */
  | 'condamnation-non-definitive'
  | 'mise-en-examen'
  | 'enquete'
  | 'relaxe'
  | 'non-lieu'
  | 'classement-sans-suite'
  | 'prescription'

export interface LegalCase {
  id: string
  label: string
  summary: string
  status: LegalStatus
  /** Qualification pénale telle que retenue par la juridiction. */
  charge?: string
  short?: string
  /** ISO. Date de la dernière décision connue. */
  decisionDate?: string
  sentence?: string
  /** Voies de recours en cours, le cas échéant. */
  appeal?: string
  verification: Verification
  sourceIds: string[]
}

export interface Costing {
  /** Milliards d'euros par an. Positif = montant en jeu, le sens est porté par `sens`. */
  billionEurosPerYear: number
  direction: 'depense' | 'recette' | 'neutre'
  /** Qui a chiffré : le candidat, un institut indépendant… */
  origin: string
}

export interface Measure {
  id: string
  themeId: string
  title: string
  detail: string
  costing?: Costing
  /** « dès 2027 », « sur le quinquennat »… */
  horizon?: string
  verification: Verification
  sourceIds: string[]
}

/** Indicateur brut, affiché tel quel sur la fiche : c'est la matière des notes. */
/** Lien vers une page officielle : celle du candidat, de son parti, ou d'une institution. */
/** Compte officiel sur une plateforme à lecture publique. */
export interface SocialAccount {
  platform: 'x' | 'bluesky'
  handle: string
}

/** Lien vers une page officielle : celle du candidat, de son parti, ou d'une institution. */
export interface OfficialLink {
  label: string
  url: string
  type: 'candidat' | 'parti' | 'institution'
  /** Ce que le lien permet de vérifier. */
  usage?: string
}

export interface Indicator {
  id: string
  label: string
  value: string
  /** Période ou date de mesure. */
  period?: string
  verification: Verification
  sourceIds: string[]
}

export type PoliticalFamily =
  | 'gauche-radicale'
  | 'gauche'
  | 'ecologie'
  | 'centre'
  | 'droite'
  | 'droite-nationale'
  | 'divers'

export type CandidacyStatus =
  /** A officiellement annoncé sa candidature. */
  | 'declare'
  /** Cité comme candidat probable par son camp, sans annonce. */
  | 'pressenti'
  /** Hypothèse de travail, à confirmer. */
  | 'hypothetique'

export interface Candidate {
  id: string
  firstName: string
  lastName: string
  initials: string
  party: string
  partyShort: string
  family: PoliticalFamily
  /**
   * Couleur d'identification du parti. Utilisée uniquement comme pastille
   * d'identité dans l'interface — jamais comme encodage de série dans un
   * graphique, où la palette validée s'applique.
   */
  partyColor: string
  birth: string
  currentRole: string
  candidacyStatus: CandidacyStatus
  summary: string
  programSite?: string
  /**
   * Comptes sociaux officiels, sans arobase. Le collecteur n'interroge que ce
   * qui est déclaré ici et signale les absences : mieux vaut un trou assumé
   * qu'un identifiant deviné, qui ferait citer la mauvaise personne.
   *
   * Un compte de soutien ou de campagne tenu par une équipe n'a pas sa place
   * ici : ses messages ne sont pas la parole du candidat.
   */
  socialAccounts: SocialAccount[]
  /**
   * Pages officielles : site du candidat ou de son parti d'une part, pages
   * institutionnelles d'autre part. C'est le point de départ de toute
   * vérification — la parole du candidat et le registre public.
   */
  officialLinks: OfficialLink[]
  /** Position sur chaque axe, indexée par `Axe.id`. */
  positions: Record<string, Likert>
  /** Justification courte d'une position, indexée par `Axe.id`. */
  ratedPositions?: Record<string, string>
  ratings: CriterionRating[]
  measures: Measure[]
  facts: Fact[]
  legal: LegalCase[]
  indicators: Indicator[]
  /** ISO. Date de dernière revue de la fiche. */
  lastUpdated: string
}

// ---------------------------------------------------------------------------
// Préférences utilisateur
// ---------------------------------------------------------------------------

export interface UserAnswer {
  value: Likert
  importance: Importance
}

/** Méthode d'agrégation multicritère retenue par l'utilisateur. */
export type AggregationMethod = 'somme-ponderee' | 'produit-pondere' | 'topsis' | 'copeland'

export interface Preferences {
  /** Réponses au questionnaire, indexées par `Proposition.id`. */
  answers: Record<string, UserAnswer>
  /** Poids 0–5 par critère, indexés par `Critere.id`. */
  weight: Record<string, number>
  /** Seuils rédhibitoires : note minimale exigée, indexés par `Critere.id`. */
  thresholds: Record<string, number>
  /** Part de l'affinité programmatique dans le score final, 0–1. */
  programShare: number
  method: AggregationMethod
  /** Candidats explicitement écartés par l'utilisateur. */
  excluded: string[]
  /** Candidats épinglés pour la comparaison (3 maximum). */
  comparison: string[]
}
