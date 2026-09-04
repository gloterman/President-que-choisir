import { createHash } from 'node:crypto'

/**
 * Lecture de flux RSS et Atom, sans dépendance.
 *
 * Le besoin est étroit — titre, lien, date — et n'appelle pas un analyseur XML
 * complet. La fonction est pure et testée sur des flux malformés, parce qu'un
 * flux de presse en production l'est régulièrement : entités mal échappées,
 * sections CDATA imbriquées, dates dans trois formats.
 */

export interface ArticleFlux {
  titre: string
  lien: string
  /** ISO 8601, ou chaîne vide si la date est absente ou illisible. */
  date: string
  /** Chapô ou corps du billet, débarrassé de son balisage. Peut être vide. */
  description: string
}

const CDATA = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/

function decoder(brut: string): string {
  const cdata = brut.match(CDATA)
  const texte = cdata ? cdata[1] : brut
  return texte
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    // L'esperluette se décode en dernier, sinon elle réintroduit les entités
    // qu'on vient de résoudre.
    .replace(/&amp;/g, '&')
    .trim()
}

function extraire(bloc: string, balise: string): string | null {
  const motif = new RegExp(`<${balise}(?:\\s[^>]*)?>([\\s\\S]*?)</${balise}>`, 'i')
  const trouve = bloc.match(motif)
  return trouve ? decoder(trouve[1]) : null
}

/** Atom place le lien dans un attribut plutôt que dans le contenu de la balise. */
function extraireLienAtom(bloc: string): string | null {
  const alternatif = bloc.match(/<link[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i)
  if (alternatif) return decoder(alternatif[1])
  const simple = bloc.match(/<link[^>]*\bhref=["']([^"']+)["']/i)
  return simple ? decoder(simple[1]) : null
}

/**
 * Retire le balisage d'un contenu de flux.
 *
 * Les descriptions arrivent en HTML échappé. Le texte est ce qui nous
 * intéresse — il sera affiché comme citation — et le balisage n'a rien à faire
 * dans une déclaration attribuée à quelqu'un.
 */
function sansBalisage(brut: string | null): string {
  if (!brut) return ''
  return decoder(brut)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normaliserDate(brut: string | null): string {
  if (!brut) return ''
  const instant = Date.parse(brut)
  return Number.isNaN(instant) ? '' : new Date(instant).toISOString()
}

export function lireFlux(xml: string): ArticleFlux[] {
  const blocs = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ]

  const articles: ArticleFlux[] = []
  for (const bloc of blocs) {
    const contenu = bloc[1]
    const titre = extraire(contenu, 'title')
    const lien = extraire(contenu, 'link') || extraireLienAtom(contenu)
    if (!titre || !lien) continue
    // Seul le https est retenu : un flux compromis ne doit pas pouvoir glisser
    // un lien qui s'exécuterait au clic.
    if (!/^https:\/\//i.test(lien)) continue
    articles.push({
      titre,
      lien,
      date: normaliserDate(
        extraire(contenu, 'pubDate') ?? extraire(contenu, 'published') ?? extraire(contenu, 'updated'),
      ),
      description: sansBalisage(
        extraire(contenu, 'content:encoded') ??
          extraire(contenu, 'description') ??
          extraire(contenu, 'summary') ??
          extraire(contenu, 'content'),
      ),
    })
  }
  return articles
}

/**
 * Identifiant stable d'une entrée de veille.
 *
 * Le condensé porte sur l'URL **entière**. Une première version tronquait un
 * encodage base64 de l'adresse : comme les articles d'un même site partagent
 * leur préfixe, les cinquante entrées d'un flux se réduisaient à un seul
 * identifiant et quarante-neuf étaient silencieusement perdues. Une troncature
 * ne peut porter que sur un condensé, jamais sur la donnée elle-même.
 */
export function condenseUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

export function identifiantVeille(sourceId: string, url: string): string {
  return `veille-${sourceId}-${condenseUrl(url)}`
}

/** Retire les diacritiques et la casse, pour comparer des noms propres. */
export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Flux déclarés par une page HTML.
 *
 * C'est le mécanisme normalisé de découverte : un site qui publie un flux
 * l'annonce dans son en-tête par un `<link rel="alternate">`. Le lire d'abord
 * évite de deviner des chemins, et trouve les flux que les conventions ne
 * couvrent pas — un `/actualites/rss` ou une adresse chez un hébergeur tiers
 * resteraient invisibles à toute liste écrite d'avance.
 *
 * Les adresses relatives sont résolues contre la page qui les déclare, et le
 * https reste exigé : la découverte ne doit pas être un moyen de faire pointer
 * la collecte ailleurs que sur le site consulté.
 */
export function liensFluxDeclares(html: string, base: string): string[] {
  const trouves: string[] = []
  for (const balise of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributs = balise[0]
    if (!/\brel=["']?[^"'>]*\balternate\b/i.test(attributs)) continue
    if (!/\btype=["']?application\/(?:rss|atom)\+xml/i.test(attributs)) continue
    const href = attributs.match(/\bhref=["']([^"']+)["']/i)
    if (!href) continue
    try {
      const absolue = new URL(decoder(href[1]), base)
      if (absolue.protocol !== 'https:') continue
      if (!trouves.includes(absolue.href)) trouves.push(absolue.href)
    } catch {
      // Une adresse illisible est ignorée : la découverte continue.
    }
  }
  return trouves
}
