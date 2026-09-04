import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { CORPS_MAXIMAL, json, lire, motif } from './reseau'

/**
 * Ces cas se jouent contre un vrai serveur local.
 *
 * Les défauts qui ont coûté deux collectes n'étaient pas dans le choix des
 * sources mais dans la conduite des requêtes : un délai qui ne couvrait pas la
 * lecture du corps, un corps non consommé qui retenait sa connexion. Aucun ne
 * se voit sur un `fetch` simulé — il faut un serveur qui réponde puis se taise.
 */
let serveur: Server
let racine = ''

beforeAll(async () => {
  serveur = createServer((requete, reponse) => {
    const chemin = requete.url ?? '/'
    if (chemin === '/flux') {
      reponse.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      reponse.end('<rss><channel><item><title>Bonjour</title></item></channel></rss>')
      return
    }
    if (chemin === '/json') {
      reponse.writeHead(200, { 'Content-Type': 'application/json' })
      reponse.end('{"a":1}')
      return
    }
    if (chemin === '/absent') {
      reponse.writeHead(404).end('<html>rien ici</html>')
      return
    }
    if (chemin === '/muet') {
      // En-têtes envoyés, puis plus rien : la connexion reste ouverte.
      reponse.writeHead(200, { 'Content-Type': 'text/html' })
      reponse.write('<html><head>')
      return
    }
    if (chemin === '/torrent') {
      reponse.writeHead(200, { 'Content-Type': 'text/plain' })
      const bloc = 'x'.repeat(64 * 1024)
      const pousser = () => {
        while (reponse.write(bloc)) {
          /* jusqu'à saturation du tampon */
        }
      }
      reponse.on('drain', pousser)
      pousser()
      return
    }
    reponse.writeHead(500).end()
  })
  await new Promise<void>((suite) => serveur.listen(0, '127.0.0.1', suite))
  const adresse = serveur.address()
  racine = `http://127.0.0.1:${typeof adresse === 'object' && adresse ? adresse.port : 0}`
})

afterAll(async () => {
  serveur.closeAllConnections?.()
  await new Promise<void>((suite) => serveur.close(() => suite()))
})

describe('lecture réseau', () => {
  it('rend le corps entier d’une réponse normale', async () => {
    const reponse = await lire(`${racine}/flux`)
    expect(reponse.ok).toBe(true)
    expect(reponse.statut).toBe(200)
    expect(reponse.texte).toContain('Bonjour')
  })

  it('rend le statut d’une erreur sans son corps', async () => {
    const reponse = await lire(`${racine}/absent`, { reprise: false })
    expect(reponse.ok).toBe(false)
    expect(reponse.statut).toBe(404)
    expect(reponse.texte).toBe('')
  })

  it('abandonne un serveur qui répond puis se tait', async () => {
    // Le cas qui a suspendu la collecte : les en-têtes arrivent, le corps
    // jamais. Le délai doit couvrir la lecture, pas seulement la connexion.
    const debut = Date.now()
    await expect(lire(`${racine}/muet`, { reprise: false, delaiMs: 300 })).rejects.toThrow()
    expect(Date.now() - debut).toBeLessThan(3000)
  })

  it('s’arrête au plafond sur un corps sans fin', async () => {
    const reponse = await lire(`${racine}/torrent`, { reprise: false, delaiMs: 15000 })
    expect(reponse.ok).toBe(true)
    expect(reponse.texte.length).toBeGreaterThanOrEqual(CORPS_MAXIMAL)
    // Le plafond est un plafond : on ne lit pas beaucoup plus que demandé.
    expect(reponse.texte.length).toBeLessThan(CORPS_MAXIMAL * 2)
  }, 20000)

  it('n’insiste pas quand la reprise est désactivée', async () => {
    const debut = Date.now()
    await expect(lire('http://127.0.0.1:1/rien', { reprise: false })).rejects.toThrow()
    // Avec reprise, l'échec coûterait la pause de 1,5 s en plus.
    expect(Date.now() - debut).toBeLessThan(1400)
  })

  it('json refuse un statut d’erreur en le nommant', async () => {
    await expect(json(`${racine}/absent`)).rejects.toThrow('réponse 404')
  })

  it('json lit un corps valide', async () => {
    await expect(json<{ a: number }>(`${racine}/json`)).resolves.toEqual({ a: 1 })
  })
})

describe('motif d’échec', () => {
  it('déplie la cause rangée sous « fetch failed »', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
    const erreur = Object.assign(new Error('fetch failed'), { cause })
    expect(motif(erreur)).toContain('connect ECONNREFUSED')
    expect(motif(erreur)).toContain('fetch failed')
  })

  it('nomme un délai de connexion pour ce qu’il est', () => {
    const cause = Object.assign(new Error('Connect Timeout Error'), {
      code: 'UND_ERR_CONNECT_TIMEOUT',
    })
    expect(motif(Object.assign(new Error('fetch failed'), { cause }))).toContain('injoignable')
  })
})
