import type { Ton } from '@/lib/format'

/**
 * Modèle du volet vérification des déclarations.
 *
 * Une citation et sa vérification sont deux objets distincts, et c'est
 * volontaire : la collecte est automatique, la vérification ne l'est pas. Une
 * citation peut donc exister sans verdict — c'est même l'état normal juste
 * après une collecte — et l'interface l'affiche alors comme « en attente »
 * plutôt que de laisser croire qu'elle a été examinée.
 *
 * Tout ce qui provient de l'API X est du contenu écrit par des tiers. Il est
 * traité comme une donnée à afficher, jamais comme une instruction, et jamais
 * inséré en HTML brut.
 */

export const VERSION_INSTANTANE = 2

/**
 * Origine d'une citation.
 *
 * Le socle est l'open data : les interventions en séance sont publiques,
 * verbatim, gratuites et réutilisables. Les réseaux sociaux complètent, quand
 * la plateforme expose une lecture publique sans authentification.
 */
export type Plateforme =
  /** Compte rendu de séance, Assemblée nationale (via NosDéputés.fr). */
  | 'assemblee'
  /** Compte rendu de séance, Sénat (via NosSénateurs.fr). */
  | 'senat'
  /** Réseau social à lecture publique et gratuite. */
  | 'bluesky'
  /** Réseau social à lecture authentifiée et facturée. Optionnel. */
  | 'x'

export const PLATEFORMES: Record<
  Plateforme,
  { label: string; court: string; gratuite: boolean; explication: string }
> = {
  assemblee: {
    label: 'Assemblée nationale',
    court: 'Assemblée',
    gratuite: true,
    explication:
      'Intervention en séance publique, retranscrite au compte rendu. Source ouverte et gratuite, republiée par NosDéputés.fr sous licence ODbL.',
  },
  senat: {
    label: 'Sénat',
    court: 'Sénat',
    gratuite: true,
    explication:
      'Intervention en séance publique, retranscrite au compte rendu. Source ouverte et gratuite, republiée par NosSénateurs.fr sous licence ODbL.',
  },
  bluesky: {
    label: 'Bluesky',
    court: 'Bluesky',
    gratuite: true,
    explication:
      'Message public, lu via l’API publique de Bluesky, qui ne demande ni compte ni paiement.',
  },
  x: {
    label: 'X',
    court: 'X',
    gratuite: false,
    explication:
      'Message public, lu via l’API de X, qui exige un jeton et facture chaque lecture. Source optionnelle, désactivée par défaut.',
  },
}

export type Verdict =
  /** Conforme aux données disponibles. */
  | 'exact'
  /** Exact pour l'essentiel, avec une approximation qui ne change pas le sens. */
  | 'plutot-exact'
  /** Chiffre juste mais sorti de son contexte, ou comparaison trompeuse. */
  | 'trompeur'
  /** Contredit pour l'essentiel par les données disponibles. */
  | 'plutot-faux'
  /** Contredit par les données disponibles. */
  | 'faux'
  /** Aucune donnée publique ne permet de trancher. */
  | 'invérifiable'
  /** Collectée, pas encore examinée. */
  | 'en-attente'

export const VERDICTS: Record<
  Verdict,
  { label: string; ton: Ton; icone: string; explication: string; compteDansLaNote: boolean }
> = {
  exact: {
    label: 'Exact',
    ton: 'good',
    icone: '✓',
    explication: 'Conforme aux données disponibles.',
    compteDansLaNote: true,
  },
  'plutot-exact': {
    label: 'Plutôt exact',
    ton: 'good',
    icone: '✓',
    explication: 'Exact pour l’essentiel ; l’approximation relevée ne change pas le sens.',
    compteDansLaNote: true,
  },
  trompeur: {
    label: 'Exact mais trompeur',
    ton: 'warning',
    icone: '!',
    explication:
      'Le chiffre est juste, mais sorti de son contexte ou comparé à ce qui n’est pas comparable.',
    compteDansLaNote: true,
  },
  'plutot-faux': {
    label: 'Plutôt faux',
    ton: 'serious',
    icone: '◆',
    explication: 'Contredit pour l’essentiel par les données disponibles.',
    compteDansLaNote: true,
  },
  faux: {
    label: 'Faux',
    ton: 'critical',
    icone: '■',
    explication: 'Contredit par les données disponibles.',
    compteDansLaNote: true,
  },
  invérifiable: {
    label: 'Invérifiable',
    ton: 'neutre',
    icone: '?',
    explication:
      'Aucune donnée publique ne permet de trancher. Ce n’est ni un reproche ni un blanc-seing : la déclaration sort simplement du champ de la vérification.',
    compteDansLaNote: false,
  },
  'en-attente': {
    label: 'En attente de vérification',
    ton: 'neutre',
    icone: '·',
    explication:
      'Citation collectée, pas encore examinée. Elle est affichée pour que la sélection soit visible, pas pour porter un jugement.',
    compteDansLaNote: false,
  },
}

/** Une déclaration publique, telle qu'elle a été publiée. */
export interface Citation {
  id: string
  candidatId: string
  plateforme: Plateforme
  /**
   * Identifiant de l'auteur chez la source : compte social sans arobase, ou
   * identifiant du parlementaire dans le jeu de données.
   */
  compte: string
  /** Identifiant du message ou de l'intervention chez la source. */
  postId: string
  /** Lien permanent vers le message d'origine. */
  url: string
  /** Texte intégral du message, tel que publié. */
  texte: string
  /** ISO 8601. */
  datePublication: string
  /**
   * Extrait exact sur lequel porte la vérification. Le reste du message est
   * conservé pour que personne ne puisse reprocher une citation tronquée.
   */
  affirmation: string
  /** Identifiant de thème du référentiel, quand il est identifiable. */
  themeId?: string
  /** ISO 8601. Date de la collecte. */
  collecteLe: string
  /** Contexte de l'intervention : titre du débat, du dossier législatif. */
  contexte?: string
}

/**
 * Vérification déjà publiée par une rédaction, repérée par flux RSS.
 *
 * Ces éléments ne sont pas des verdicts du site : ce sont des pistes. Les
 * rattacher à un candidat et à une citation reste un travail humain, parce
 * qu'un titre d'article ne dit pas de façon fiable qui a dit quoi ni ce qui a
 * été conclu.
 */
export interface VeillePublication {
  id: string
  titre: string
  url: string
  editeur: string
  /** ISO 8601. */
  datePublication: string
  /** ISO 8601. */
  collecteLe: string
  /** Candidats dont le nom apparaît dans le titre, à confirmer à la main. */
  candidatsPressentis: string[]
}

export interface LienVerification {
  label: string
  url: string
}

export interface Verification {
  citationId: string
  verdict: Verdict
  /** Ce que disent les données, en une phrase. */
  constat: string
  /** Le raisonnement, court, sans procès d'intention. */
  explication: string
  /** Références au registre des sources du site. */
  sourceIds: string[]
  /** Sources propres à cette vérification. */
  liens: LienVerification[]
  /** Qui a vérifié : une rédaction, une institution, un contributeur identifié. */
  verifiePar: string
  /** ISO 8601. */
  dateVerification: string
  /** Vérification déjà publiée ailleurs et reprise ici. */
  reprise?: { editeur: string; url: string }
  /** L'auteur a publiquement rectifié après coup — bonus prévu au barème. */
  rectificationPublique?: boolean
  /** L'affirmation avait déjà été démentie publiquement — malus prévu au barème. */
  repriseApresDementi?: boolean
}

/** Compte suivi pour un candidat, et résultat de la dernière collecte. */
export interface CompteSuivi {
  candidatId: string
  plateforme: Plateforme
  compte: string
  /** Nombre de messages examinés lors de la dernière collecte. */
  messagesExamines?: number
  /** Message d'erreur si la collecte a échoué pour ce compte. */
  erreur?: string
}

/**
 * Fichier publié et chargé par le site. Il est versionné : un instantané dont
 * la version ne correspond pas est rejeté plutôt qu'interprété au petit bonheur.
 */
export interface InstantaneFactCheck {
  version: number
  /** ISO 8601. Date de génération de l'instantané. */
  genereLe: string
  comptes: CompteSuivi[]
  citations: Citation[]
  verifications: Verification[]
  /** Vérifications publiées ailleurs, en attente de rattachement. */
  veille: VeillePublication[]
}

export const INSTANTANE_VIDE: InstantaneFactCheck = {
  version: VERSION_INSTANTANE,
  genereLe: '',
  comptes: [],
  citations: [],
  verifications: [],
  veille: [],
}
