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
    })
  }
  return articles
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
