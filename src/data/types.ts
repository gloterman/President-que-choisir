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
  titre: string
  editeur: string
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
  nom: string
  /** Une phrase : ce que le thème recouvre. */
  resume: string
  /** Glyphe décoratif (aria-hidden côté rendu). */
  icone: string
}

/**
 * Un axe est un continuum entre deux pôles nommés. Les deux pôles sont rédigés
 * pour être également défendables : c'est la condition d'un questionnaire neutre.
 */
export interface Axe {
  id: string
  nom: string
  themeId: string
  /** Libellé du pôle −2. */
  poleNegatif: string
  /** Libellé du pôle +2. */
  polePositif: string
  resume: string
  /**
   * Contribution de l'axe aux deux dimensions de la boussole 2D.
   * `eco` : axe économique gauche(−)/droite(+). `soc` : axe culturel
   * ouvert(−)/conservateur(+). 0 = l'axe ne pèse pas sur cette dimension.
   */
  boussole: { eco: number; soc: number }
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
export type NatureProposition =
  /** Arbitrage de valeurs, formulé indépendamment de l'actualité. */
  | 'principe'
  /** Mesure concrète, telle qu'elle se discute aujourd'hui. */
  | 'mesure'

export interface Proposition {
  id: string
  axeId: string
  themeId: string
  nature: NatureProposition
  /**
   * Énoncé soumis à l'utilisateur. Les règles de rédaction sont listées en tête
   * de `referentiel.ts` et contrôlées automatiquement par `npm run lint:data`.
   */
  texte: string
  /** +1 : « d'accord » pousse vers le pôle positif de l'axe. −1 : l'inverse. */
  polarite: 1 | -1
  /** Contexte factuel affiché sous la question, sans prise de position. */
  contexte: string
}

// ---------------------------------------------------------------------------
// Critères de notation
// ---------------------------------------------------------------------------

export type FamilleCritere = 'integrite' | 'competence' | 'programme' | 'action'

/** Un palier du barème : « à partir de `min` points, la note se lit ainsi ». */
export interface PalierBareme {
  min: number
  label: string
}

export interface Critere {
  id: string
  nom: string
  /** Nom abrégé, pour les axes de graphiques et les en-têtes de tableaux. */
  nomCourt: string
  famille: FamilleCritere
  /** Ce que le critère prétend mesurer, en une phrase. */
  resume: string
  /** La question à laquelle la note répond. */
  question: string
  /** Les indicateurs factuels qui alimentent la note. */
  indicateurs: string[]
  /** Les règles de calcul, en français, telles qu'appliquées. */
  bareme: string[]
  paliers: PalierBareme[]
  /** Ce que la note ne dit pas. Affiché systématiquement à côté du score. */
  limites: string
  /** Poids par défaut, 0–5. */
  poidsDefaut: number
  /**
   * `true` quand le critère repose sur un jugement de valeur que des gens
   * raisonnables peuvent refuser. L'interface l'affiche et permet de le neutraliser.
   */
  contestable: boolean
  /** Sens de lecture : une note haute est-elle toujours souhaitable ? */
  sensLecture: string
}

export type Confiance = 'haute' | 'moyenne' | 'faible'

export interface NoteCritere {
  critereId: string
  /** 0–100. */
  note: number
  confiance: Confiance
  /** Pourquoi cette note, en citant les faits retenus. */
  justification: string
  sourceIds: string[]
  verification: Verification
}

// ---------------------------------------------------------------------------
// Faits, judiciaire, programme
// ---------------------------------------------------------------------------

export type CategorieFait =
  | 'mandat'
  | 'reforme'
  | 'election'
  | 'prise-de-position'
  | 'controverse'
  | 'judiciaire'

export interface Fait {
  id: string
  /** ISO `AAAA` ou `AAAA-MM` ou `AAAA-MM-JJ`. */
  date: string
  titre: string
  description: string
  categorie: CategorieFait
  portee: 'majeur' | 'notable'
  verification: Verification
  sourceIds: string[]
}

/**
 * État procédural d'une affaire. Le vocabulaire est celui du droit français :
 * une mise en examen n'est pas une condamnation, une condamnation frappée
 * d'appel n'est pas définitive. L'interface ne mélange jamais ces états.
 */
export type StatutJudiciaire =
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

export interface AffaireJudiciaire {
  id: string
  intitule: string
  resume: string
  statut: StatutJudiciaire
  /** Qualification pénale telle que retenue par la juridiction. */
  qualification?: string
  juridiction?: string
  /** ISO. Date de la dernière décision connue. */
  dateDecision?: string
  peine?: string
  /** Voies de recours en cours, le cas échéant. */
  recours?: string
  verification: Verification
  sourceIds: string[]
}

export interface Chiffrage {
  /** Milliards d'euros par an. Positif = montant en jeu, le sens est porté par `sens`. */
  montantMdEurosAn: number
  sens: 'depense' | 'recette' | 'neutre'
  /** Qui a chiffré : le candidat, un institut indépendant… */
  origine: string
}

export interface Mesure {
  id: string
  themeId: string
  titre: string
  detail: string
  chiffrage?: Chiffrage
  /** « dès 2027 », « sur le quinquennat »… */
  horizon?: string
  verification: Verification
  sourceIds: string[]
}

/** Indicateur brut, affiché tel quel sur la fiche : c'est la matière des notes. */
/** Lien vers une page officielle : celle du candidat, de son parti, ou d'une institution. */
export interface LienOfficiel {
  label: string
  url: string
  type: 'candidat' | 'parti' | 'institution'
  /** Ce que le lien permet de vérifier. */
  usage?: string
}

export interface Indicateur {
  id: string
  label: string
  valeur: string
  /** Période ou date de mesure. */
  periode?: string
  verification: Verification
  sourceIds: string[]
}

export type FamillePolitique =
  | 'gauche-radicale'
  | 'gauche'
  | 'ecologie'
  | 'centre'
  | 'droite'
  | 'droite-nationale'
  | 'divers'

export type StatutCandidature =
  /** A officiellement annoncé sa candidature. */
  | 'declare'
  /** Cité comme candidat probable par son camp, sans annonce. */
  | 'pressenti'
  /** Hypothèse de travail, à confirmer. */
  | 'hypothetique'

export interface Candidat {
  id: string
  prenom: string
  nom: string
  initiales: string
  parti: string
  partiCourt: string
  famille: FamillePolitique
  /**
   * Couleur d'identification du parti. Utilisée uniquement comme pastille
   * d'identité dans l'interface — jamais comme encodage de série dans un
   * graphique, où la palette validée s'applique.
   */
  couleurParti: string
  naissance: string
  fonctionActuelle: string
  statutCandidature: StatutCandidature
  presentation: string
  siteProgramme?: string
  /**
   * Compte X officiel, sans arobase, ou `null` quand aucun compte n'a pu être
   * confirmé. Le collecteur de citations n'interroge que les comptes renseignés
   * ici, et signale les candidats laissés à `null` : mieux vaut un trou déclaré
   * qu'un identifiant deviné, qui ferait citer la mauvaise personne.
   */
  compteX: string | null
  /**
   * Pages officielles : site du candidat ou de son parti d'une part, pages
   * institutionnelles d'autre part. C'est le point de départ de toute
   * vérification — la parole du candidat et le registre public.
   */
  liensOfficiels: LienOfficiel[]
  /** Position sur chaque axe, indexée par `Axe.id`. */
  positions: Record<string, Likert>
  /** Justification courte d'une position, indexée par `Axe.id`. */
  positionsNotes?: Record<string, string>
  notes: NoteCritere[]
  mesures: Mesure[]
  faits: Fait[]
  judiciaire: AffaireJudiciaire[]
  indicateurs: Indicateur[]
  /** ISO. Date de dernière revue de la fiche. */
  derniereMaj: string
}

// ---------------------------------------------------------------------------
// Préférences utilisateur
// ---------------------------------------------------------------------------

export interface ReponseUtilisateur {
  valeur: Likert
  importance: Importance
}

/** Méthode d'agrégation multicritère retenue par l'utilisateur. */
export type MethodeAgregation = 'somme-ponderee' | 'produit-pondere' | 'topsis' | 'copeland'

export interface Preferences {
  /** Réponses au questionnaire, indexées par `Proposition.id`. */
  reponses: Record<string, ReponseUtilisateur>
  /** Poids 0–5 par critère, indexés par `Critere.id`. */
  poids: Record<string, number>
  /** Seuils rédhibitoires : note minimale exigée, indexés par `Critere.id`. */
  seuils: Record<string, number>
  /** Part de l'affinité programmatique dans le score final, 0–1. */
  partProgramme: number
  methode: MethodeAgregation
  /** Candidats explicitement écartés par l'utilisateur. */
  exclus: string[]
  /** Candidats épinglés pour la comparaison (3 maximum). */
  comparaison: string[]
}
