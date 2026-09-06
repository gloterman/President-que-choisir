import type { Tone } from '@/lib/format'

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

export const SNAPSHOT_VERSION = 3

/**
 * Origine d'une citation.
 *
 * Le socle est l'open data : les interventions en séance sont publiques,
 * verbatim, gratuites et réutilisables. Les réseaux sociaux complètent, quand
 * la plateforme expose une lecture publique sans authentification.
 */
export type Platform =
  /** Publication du site officiel du candidat ou de son mouvement. */
  | 'site-officiel'
  /** Réseau social à lecture publique et gratuite. */
  | 'bluesky'
  /** Réseau social à lecture authentifiée et facturée. Optionnel. */
  | 'x'

export const PLATFORMS: Record<
  Platform,
  { label: string; short: string; free: boolean; explanation: string }
> = {
  'site-officiel': {
    label: 'Site officiel',
    short: 'Site officiel',
    free: true,
    explanation:
      'Publication du site du candidat ou de son mouvement, relevée par son flux de syndication. C’est une parole assumée et publiée par l’intéressé lui-même.',
  },
  bluesky: {
    label: 'Bluesky',
    short: 'Bluesky',
    free: true,
    explanation:
      'Message public, lu via l’API publique de Bluesky, qui ne demande ni compte ni paiement.',
  },
  x: {
    label: 'X',
    short: 'X',
    free: false,
    explanation:
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
  { label: string; tone: Tone; icon: string; explanation: string; countsInRating: boolean }
> = {
  exact: {
    label: 'Exact',
    tone: 'good',
    icon: '✓',
    explanation: 'Conforme aux données disponibles.',
    countsInRating: true,
  },
  'plutot-exact': {
    label: 'Plutôt exact',
    tone: 'good',
    icon: '✓',
    explanation: 'Exact pour l’essentiel ; l’approximation relevée ne change pas le sens.',
    countsInRating: true,
  },
  trompeur: {
    label: 'Exact mais trompeur',
    tone: 'warning',
    icon: '!',
    explanation:
      'Le chiffre est juste, mais sorti de son contexte ou comparé à ce qui n’est pas comparable.',
    countsInRating: true,
  },
  'plutot-faux': {
    label: 'Plutôt faux',
    tone: 'serious',
    icon: '◆',
    explanation: 'Contredit pour l’essentiel par les données disponibles.',
    countsInRating: true,
  },
  faux: {
    label: 'Faux',
    tone: 'critical',
    icon: '■',
    explanation: 'Contredit par les données disponibles.',
    countsInRating: true,
  },
  invérifiable: {
    label: 'Invérifiable',
    tone: 'neutre',
    icon: '?',
    explanation:
      'Aucune donnée publique ne permet de trancher. Ce n’est ni un reproche ni un blanc-seing : la déclaration sort simplement du champ de la vérification.',
    countsInRating: false,
  },
  'en-attente': {
    label: 'En attente de vérification',
    tone: 'neutre',
    icon: '·',
    explanation:
      'Citation collectée, pas encore examinée. Elle est affichée pour que la sélection soit visible, pas pour porter un jugement.',
    countsInRating: false,
  },
}

/** Une déclaration publique, telle qu'elle a été publiée. */
export interface Quote {
  id: string
  candidateId: string
  platform: Platform
  /**
   * Identifiant de l'auteur chez la source : compte social sans arobase, ou
   * identifiant du parlementaire dans le jeu de données.
   */
  account: string
  /** Identifiant du message ou de l'intervention chez la source. */
  postId: string
  /** Lien permanent vers le message d'origine. */
  url: string
  /** Texte intégral du message, tel que publié. */
  text: string
  /** ISO 8601. */
  publishedAt: string
  /**
   * Extrait exact sur lequel porte la vérification. Le reste du message est
   * conservé pour que personne ne puisse reprocher une citation tronquée.
   */
  claim: string
  /** Identifiant de thème du référentiel, quand il est identifiable. */
  themeId?: string
  /** ISO 8601. Date de la collecte. */
  collectedAt: string
  /** Contexte de la déclaration : titre du débat, de la publication. */
  context?: string
  /**
   * Qui parle exactement.
   *
   * Un communiqué de parti n'est pas la parole personnelle du candidat, même
   * lorsqu'il porte sa ligne. La distinction est affichée plutôt que gommée.
   */
  speaker?: 'candidat' | 'parti'
}

/**
 * Vérification déjà publiée par une rédaction, repérée par flux RSS.
 *
 * Ces éléments ne sont pas des verdicts du site : ce sont des pistes. Les
 * rattacher à un candidat et à une citation reste un travail humain, parce
 * qu'un titre d'article ne dit pas de façon fiable qui a dit quoi ni ce qui a
 * été conclu.
 */
export interface WatchPublication {
  id: string
  title: string
  url: string
  publisher: string
  /** ISO 8601. */
  publishedAt: string
  /** ISO 8601. */
  collectedAt: string
  /** Candidats dont le nom apparaît dans le titre, à confirmer à la main. */
  likelyCandidates: string[]
}

export interface VerificationLink {
  label: string
  url: string
}

export interface Verification {
  quoteId: string
  verdict: Verdict
  /** Ce que disent les données, en une phrase. */
  finding: string
  /** Le raisonnement, court, sans procès d'intention. */
  explanation: string
  /** Références au registre des sources du site. */
  sourceIds: string[]
  /** Sources propres à cette vérification. */
  links: VerificationLink[]
  /** Qui a vérifié : une rédaction, une institution, un contributeur identifié. */
  verifiedBy: string
  /** ISO 8601. */
  verificationDate: string
  /** Vérification déjà publiée ailleurs et reprise ici. */
  retry?: { publisher: string; url: string }
  /** L'auteur a publiquement rectifié après coup — bonus prévu au barème. */
  publicCorrection?: boolean
  /** L'affirmation avait déjà été démentie publiquement — malus prévu au barème. */
  repeatedAfterDenial?: boolean
}

/** Compte suivi pour un candidat, et résultat de la dernière collecte. */
export interface TrackedAccount {
  candidateId: string
  platform: Platform
  account: string
  /** Nombre de messages examinés lors de la dernière collecte. */
  messagesExamined?: number
  /** Message d'erreur si la collecte a échoué pour ce compte. */
  error?: string
}

/**
 * Fichier publié et chargé par le site. Il est versionné : un instantané dont
 * la version ne correspond pas est rejeté plutôt qu'interprété au petit bonheur.
 */
export interface FactCheckSnapshot {
  version: number
  /** ISO 8601. Date de génération de l'instantané. */
  generatedAt: string
  accounts: TrackedAccount[]
  quotes: Quote[]
  verifications: Verification[]
  /** Vérifications publiées ailleurs, en attente de rattachement. */
  watch: WatchPublication[]
}

export const EMPTY_SNAPSHOT: FactCheckSnapshot = {
  version: SNAPSHOT_VERSION,
  generatedAt: '',
  accounts: [],
  quotes: [],
  verifications: [],
  watch: [],
}
