/**
 * Registre des sources de collecte.
 *
 * Toutes sont **publiques, gratuites et sans clé**, et chacune déclare sa
 * licence de réutilisation : un outil qui republie des propos doit pouvoir dire
 * à quel titre il le fait.
 *
 * Le champ `urlConfirmee` dit si l'adresse a réellement répondu lors d'une
 * collecte. Les quatre flux de veille et l'API Bluesky l'ont fait le
 * 4 septembre 2026.
 *
 * NosDéputés.fr et NosSénateurs.fr ont été retirés : le service est hors ligne,
 * confirmé depuis deux réseaux distincts. Les interventions en séance restent
 * la meilleure matière première imaginable — verbatim, horodatées, sous licence
 * ouverte — mais l'open data officiel de l'Assemblée ne les publie qu'en
 * archives volumineuses, dont l'exploitation demande un adaptateur d'un tout
 * autre ordre. Écrire cet adaptateur sans pouvoir l'exécuter serait reproduire
 * l'erreur qui a coûté deux collectes.
 */

/** Ce qui parle : la personne, ou le mouvement qu'elle dirige. */
export type PorteParole = 'candidat' | 'parti'

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
 * Chemins de flux sondés sur un site officiel, dans cet ordre.
 *
 * Ce n'est que le second recours. On demande d'abord au site lui-même : une
 * page qui publie un flux l'annonce par un `<link rel="alternate">`, seul
 * moyen de trouver une adresse qui ne suit aucune convention. Ces chemins
 * couvrent le cas du site qui sert un flux sans le déclarer.
 *
 * Aucun annuaire ne recense les flux des sites politiques français, et deviner
 * une adresse fixe par site reviendrait à en inventer quinze : la découverte
 * remplace la configuration, et un site qui change de moteur reste couvert
 * sans intervention.
 */
export const CHEMINS_FLUX_COURANTS = [
  '/feed/',
  '/rss',
  '/feed',
  '/rss.xml',
  '/atom.xml',
  '/index.php/feed/',
] as const

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
