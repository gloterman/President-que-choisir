import { describe, expect, it } from 'vitest'
import { lireFlux, normaliserNom } from './rss'

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

describe('normalisation des noms', () => {
  it('retire les diacritiques, la casse et la ponctuation', () => {
    expect(normaliserNom('Jean-Luc Mélenchon')).toBe('jean luc melenchon')
    expect(normaliserNom('Dominique de Villepin')).toBe('dominique de villepin')
  })

  it('rapproche deux écritures du même nom', () => {
    expect(normaliserNom('LE PEN')).toBe(normaliserNom('Le Pen'))
  })
})
