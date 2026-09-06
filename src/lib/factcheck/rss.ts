import { createHash } from 'node:crypto'

/**
 * Lecture de flux RSS et Atom, sans dépendance.
 *
 * Le besoin est étroit — titre, lien, date — et n'appelle pas un analyseur XML
 * complet. La fonction est pure et testée sur des flux malformés, parce qu'un
 * flux de presse en production l'est régulièrement : entités mal échappées,
 * sections CDATA imbriquées, dates dans trois formats.
 */

export interface FeedArticle {
  title: string
  link: string
  /** ISO 8601, ou chaîne vide si la date est absente ou illisible. */
  date: string
  /** Chapô ou corps du billet, débarrassé de son balisage. Peut être vide. */
  description: string
}

const CDATA = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/

function decode(raw: string): string {
  const cdata = raw.match(CDATA)
  const text = cdata ? cdata[1] : raw
  return text
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

function extract(block: string, tag: string): string | null {
  const reason = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i')
  const found = block.match(reason)
  return found ? decode(found[1]) : null
}

/** Atom place le lien dans un attribut plutôt que dans le contenu de la balise. */
function extractAtomLink(block: string): string | null {
  const alternate = block.match(/<link[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i)
  if (alternate) return decode(alternate[1])
  const plain = block.match(/<link[^>]*\bhref=["']([^"']+)["']/i)
  return plain ? decode(plain[1]) : null
}

/**
 * Retire le balisage d'un contenu de flux.
 *
 * Les descriptions arrivent en HTML échappé. Le texte est ce qui nous
 * intéresse — il sera affiché comme citation — et le balisage n'a rien à faire
 * dans une déclaration attribuée à quelqu'un.
 */
function stripMarkup(raw: string | null): string {
  if (!raw) return ''
  return decode(raw)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeDate(raw: string | null): string {
  if (!raw) return ''
  const instant = Date.parse(raw)
  return Number.isNaN(instant) ? '' : new Date(instant).toISOString()
}

export function readFeed(xml: string): FeedArticle[] {
  const blocks = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ]

  const articles: FeedArticle[] = []
  for (const block of blocks) {
    const content = block[1]
    const title = extract(content, 'title')
    const link = extract(content, 'link') || extractAtomLink(content)
    if (!title || !link) continue
    // Seul le https est retenu : un flux compromis ne doit pas pouvoir glisser
    // un lien qui s'exécuterait au clic.
    if (!/^https:\/\//i.test(link)) continue
    articles.push({
      title,
      link,
      date: normalizeDate(
        extract(content, 'pubDate') ?? extract(content, 'published') ?? extract(content, 'updated'),
      ),
      description: stripMarkup(
        extract(content, 'content:encoded') ??
          extract(content, 'description') ??
          extract(content, 'summary') ??
          extract(content, 'content'),
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
export function urlDigest(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16)
}

export function watchId(sourceId: string, url: string): string {
  return `veille-${sourceId}-${urlDigest(url)}`
}

/** Retire les diacritiques et la casse, pour comparer des noms propres. */
export function normalizeName(lastName: string): string {
  return lastName
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
export function declaredFeedLinks(html: string, base: string): string[] {
  const found: string[] = []
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = tag[0]
    if (!/\brel=["']?[^"'>]*\balternate\b/i.test(attributes)) continue
    if (!/\btype=["']?application\/(?:rss|atom)\+xml/i.test(attributes)) continue
    const href = attributes.match(/\bhref=["']([^"']+)["']/i)
    if (!href) continue
    try {
      const absolute = new URL(decode(href[1]), base)
      if (absolute.protocol !== 'https:') continue
      if (!found.includes(absolute.href)) found.push(absolute.href)
    } catch {
      // Une adresse illisible est ignorée : la découverte continue.
    }
  }
  return found
}
