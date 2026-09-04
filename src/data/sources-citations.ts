import type { Plateforme } from './factcheck'

/**
 * Registre des sources de collecte.
 *
 * Toutes celles activées par défaut sont **publiques, gratuites et sans clé**.
 * Chacune déclare sa licence de réutilisation, parce qu'un outil qui republie
 * des propos doit pouvoir dire à quel titre il le fait.
 *
 * Le champ `urlConfirmee` dit si l'adresse a réellement répondu. Les quatre
 * flux de veille l'ont fait lors de la collecte du 4 septembre 2026 ; les deux
 * API parlementaires ont échoué au niveau de la connexion, avant même toute
 * réponse HTTP, et restent donc à confirmer. Le collecteur affiche le statut de
 * chaque source à l'exécution avec le motif exact de l'échec.
 */

export interface SourceParlementaire {
  id: string
  plateforme: Extract<Plateforme, 'assemblee' | 'senat'>
  nom: string
  editeur: string
  licence: string
  /**
   * Racines à essayer dans l'ordre. Plusieurs entrées permettent de survivre à
   * un service qui répond sur un hôte et pas sur l'autre — cas courant quand un
   * site public a changé de configuration sans redirection.
   */
  racines: string[]
  /** Chemin listant les élus, utilisé pour résoudre un nom en identifiant. */
  cheminAnnuaire: string
  /** Chemin des interventions, `{slug}` étant remplacé par l'identifiant. */
  cheminInterventions: string
  urlConfirmee: boolean
}

export interface SourceVeille {
  id: string
  nom: string
  editeur: string
  url: string
  /** Réutilisation limitée au titre et au lien, jamais au texte de l'article. */
  licence: string
  urlConfirmee: boolean
}

/**
 * Open data parlementaire.
 *
 * C'est le socle : une intervention en séance est verbatim, horodatée,
 * rattachée à un débat identifié, et publiée sous licence ouverte. Contrairement
 * à un message sur un réseau social, elle ne disparaît pas si son auteur
 * l'efface.
 */
export const SOURCES_PARLEMENTAIRES: SourceParlementaire[] = [
  {
    id: 'nosdeputes',
    plateforme: 'assemblee',
    nom: 'NosDéputés.fr',
    editeur: 'Regards Citoyens',
    licence: 'ODbL',
    racines: ['https://www.nosdeputes.fr', 'https://nosdeputes.fr'],
    cheminAnnuaire: '/deputes/json',
    cheminInterventions: '/{slug}/interventions/json',
    urlConfirmee: false,
  },
  {
    id: 'nossenateurs',
    plateforme: 'senat',
    nom: 'NosSénateurs.fr',
    editeur: 'Regards Citoyens',
    licence: 'ODbL',
    racines: ['https://www.nossenateurs.fr', 'https://nossenateurs.fr'],
    cheminAnnuaire: '/senateurs/json',
    cheminInterventions: '/{slug}/interventions/json',
    urlConfirmee: false,
  },
]

/** API publique de Bluesky : lecture sans compte ni jeton. */
export const SOURCE_BLUESKY = {
  id: 'bluesky',
  nom: 'Bluesky',
  racine: 'https://public.api.bsky.app',
  cheminFil: '/xrpc/app.bsky.feed.getAuthorFeed',
  licence: 'Messages publics de leurs auteurs, cités avec lien vers l’original.',
  urlConfirmee: true,
} as const

/**
 * Veille des vérifications déjà publiées.
 *
 * Ces flux ne fournissent pas de verdict exploitable tel quel : un titre
 * d'article ne dit pas de façon fiable qui a dit quoi ni ce qui a été conclu.
 * Ils servent de pistes pour le travail humain de vérification, et seuls le
 * titre et le lien sont repris — jamais le texte de l'article.
 */
export const SOURCES_VEILLE: SourceVeille[] = [
  {
    id: 'decodeurs',
    nom: 'Les Décodeurs',
    editeur: 'Le Monde',
    url: 'https://www.lemonde.fr/les-decodeurs/rss_full.xml',
    licence: 'Titre et lien uniquement, avec attribution.',
    urlConfirmee: true,
  },
  {
    id: 'afp-factuel',
    nom: 'AFP Factuel',
    editeur: 'Agence France-Presse',
    url: 'https://factuel.afp.com/rss.xml',
    licence: 'Titre et lien uniquement, avec attribution.',
    urlConfirmee: true,
  },
  {
    id: 'vrai-ou-faux',
    nom: 'Vrai ou Faux',
    editeur: 'franceinfo',
    url: 'https://www.francetvinfo.fr/vrai-ou-fake.rss',
    licence: 'Titre et lien uniquement, avec attribution.',
    urlConfirmee: true,
  },
  {
    id: 'checknews',
    nom: 'CheckNews',
    editeur: 'Libération',
    url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/category/checknews/?outputType=xml',
    licence: 'Titre et lien uniquement, avec attribution.',
    urlConfirmee: true,
  },
]
