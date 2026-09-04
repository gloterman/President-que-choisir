import { describe, expect, it } from 'vitest'
import { identifiantVeille, lireFlux, normaliserNom } from './rss'

describe('lecture de flux', () => {
  it('lit un flux RSS classique', () => {
    const articles = lireFlux(`
      <rss><channel>
        <item>
          <title>Le chiffre de la dette est-il exact ?</title>
          <link>https://exemple.test/a</link>
          <pubDate>Tue, 25 Aug 2026 08:30:00 +0200</pubDate>
        </item>
      </channel></rss>`)
    expect(articles).toHaveLength(1)
    expect(articles[0].titre).toBe('Le chiffre de la dette est-il exact ?')
    expect(articles[0].lien).toBe('https://exemple.test/a')
    expect(articles[0].date.startsWith('2026-08-25')).toBe(true)
  })

  it('lit un flux Atom, dont le lien est un attribut', () => {
    const articles = lireFlux(`
      <feed><entry>
        <title>Un titre</title>
        <link rel="alternate" href="https://exemple.test/b"/>
        <updated>2026-08-24T10:00:00Z</updated>
      </entry></feed>`)
    expect(articles[0].lien).toBe('https://exemple.test/b')
    expect(articles[0].date).toBe('2026-08-24T10:00:00.000Z')
  })

  it('déballe les sections CDATA', () => {
    const articles = lireFlux(`
      <rss><item>
        <title><![CDATA[Titre & « citation »]]></title>
        <link><![CDATA[https://exemple.test/c]]></link>
      </item></rss>`)
    expect(articles[0].titre).toBe('Titre & « citation »')
  })

  it('décode les entités sans réintroduire celles qu’il vient de résoudre', () => {
    // « &amp;lt; » doit donner « &lt; » et non « < » : l'esperluette se décode
    // en dernier, sinon le décodage se relance sur son propre résultat.
    const articles = lireFlux(
      '<rss><item><title>a &amp;lt; b</title><link>https://exemple.test/d</link></item></rss>',
    )
    expect(articles[0].titre).toBe('a &lt; b')
  })

  it('écarte un lien qui n’est pas en https', () => {
    const articles = lireFlux(
      '<rss><item><title>T</title><link>javascript:alert(1)</link></item></rss>',
    )
    expect(articles).toHaveLength(0)
  })

  it('ignore une entrée sans titre ou sans lien plutôt que d’échouer', () => {
    const articles = lireFlux(`
      <rss>
        <item><link>https://exemple.test/e</link></item>
        <item><title>Sans lien</title></item>
        <item><title>Complet</title><link>https://exemple.test/f</link></item>
      </rss>`)
    expect(articles).toHaveLength(1)
    expect(articles[0].titre).toBe('Complet')
  })

  it('renvoie une date vide plutôt qu’une date inventée', () => {
    const articles = lireFlux(
      '<rss><item><title>T</title><link>https://exemple.test/g</link><pubDate>hier</pubDate></item></rss>',
    )
    expect(articles[0].date).toBe('')
  })

  it('ne renvoie rien sur une charge qui n’est pas un flux', () => {
    expect(lireFlux('<html><body>bonjour</body></html>')).toEqual([])
    expect(lireFlux('')).toEqual([])
  })
})

describe('identifiant de veille', () => {
  it('distingue deux articles d’un même site', () => {
    // Régression : une première version tronquait un encodage base64 de
    // l'adresse. Les articles d'un même site partageant leur préfixe, les
    // cinquante entrées d'un flux se réduisaient à un seul identifiant et
    // quarante-neuf disparaissaient sans bruit.
    const urls = [
      'https://www.lemonde.fr/les-decodeurs/article/2026/09/01/aaa_1.html',
      'https://www.lemonde.fr/les-decodeurs/article/2026/09/02/bbb_2.html',
      'https://www.lemonde.fr/les-decodeurs/video/2026/09/03/ccc_3.html',
    ]
    const identifiants = urls.map((u) => identifiantVeille('decodeurs', u))
    expect(new Set(identifiants).size).toBe(urls.length)
  })

  it('reste stable pour une même adresse', () => {
    const url = 'https://factuel.afp.com/doc.12345'
    expect(identifiantVeille('afp', url)).toBe(identifiantVeille('afp', url))
  })

  it('sépare deux sources qui publieraient la même adresse', () => {
    const url = 'https://exemple.test/a'
    expect(identifiantVeille('a', url)).not.toBe(identifiantVeille('b', url))
  })

  it('produit un identifiant court et lisible', () => {
    expect(identifiantVeille('decodeurs', 'https://exemple.test/a')).toMatch(
      /^veille-decodeurs-[0-9a-f]{16}$/,
    )
  })
})

describe('normalisation des noms', () => {
  it('retire les diacritiques, la casse et la ponctuation', () => {
    expect(normaliserNom('Jean-Luc Mélenchon')).toBe('jean luc melenchon')
    expect(normaliserNom('Dominique de Villepin')).toBe('dominique de villepin')
  })

  it('rapproche deux écritures du même nom', () => {
    expect(normaliserNom('LE PEN')).toBe(normaliserNom('Le Pen'))
  })
})
