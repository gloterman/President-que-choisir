import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { MAX_BODY, json, read, reason } from './reseau'

/**
 * Ces cas se jouent contre un vrai serveur local.
 *
 * Les défauts qui ont coûté deux collectes n'étaient pas dans le choix des
 * sources mais dans la conduite des requêtes : un délai qui ne couvrait pas la
 * lecture du corps, un corps non consommé qui retenait sa connexion. Aucun ne
 * se voit sur un `fetch` simulé — il faut un serveur qui réponde puis se taise.
 */
let server: Server
let root = ''

beforeAll(async () => {
  server = createServer((request, answer) => {
    const path = request.url ?? '/'
    if (path === '/flux') {
      answer.writeHead(200, { 'Content-Type': 'application/rss+xml' })
      answer.end('<rss><channel><item><title>Bonjour</title></item></channel></rss>')
      return
    }
    if (path === '/json') {
      answer.writeHead(200, { 'Content-Type': 'application/json' })
      answer.end('{"a":1}')
      return
    }
    if (path === '/absent') {
      answer.writeHead(404).end('<html>rien ici</html>')
      return
    }
    if (path === '/muet') {
      // En-têtes envoyés, puis plus rien : la connexion reste ouverte.
      answer.writeHead(200, { 'Content-Type': 'text/html' })
      answer.write('<html><head>')
      return
    }
    if (path === '/torrent') {
      answer.writeHead(200, { 'Content-Type': 'text/plain' })
      const block = 'x'.repeat(64 * 1024)
      const push = () => {
        while (answer.write(block)) {
          /* jusqu'à saturation du tampon */
        }
      }
      answer.on('drain', push)
      push()
      return
    }
    answer.writeHead(500).end()
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  root = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(async () => {
  server.closeAllConnections?.()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('lecture réseau', () => {
  it('rend le corps entier d’une réponse normale', async () => {
    const answer = await read(`${root}/flux`)
    expect(answer.ok).toBe(true)
    expect(answer.status).toBe(200)
    expect(answer.text).toContain('Bonjour')
  })

  it('rend le statut d’une erreur sans son corps', async () => {
    const answer = await read(`${root}/absent`, { retry: false })
    expect(answer.ok).toBe(false)
    expect(answer.status).toBe(404)
    expect(answer.text).toBe('')
  })

  it('abandonne un serveur qui répond puis se tait', async () => {
    // Le cas qui a suspendu la collecte : les en-têtes arrivent, le corps
    // jamais. Le délai doit couvrir la lecture, pas seulement la connexion.
    const start = Date.now()
    await expect(read(`${root}/muet`, { retry: false, timeoutMs: 300 })).rejects.toThrow()
    expect(Date.now() - start).toBeLessThan(3000)
  })

  it('s’arrête au plafond sur un corps sans fin', async () => {
    const answer = await read(`${root}/torrent`, { retry: false, timeoutMs: 15000 })
    expect(answer.ok).toBe(true)
    expect(answer.text.length).toBeGreaterThanOrEqual(MAX_BODY)
    // Le plafond est un plafond : on ne lit pas beaucoup plus que demandé.
    expect(answer.text.length).toBeLessThan(MAX_BODY * 2)
  }, 20000)

  it('n’insiste pas quand la reprise est désactivée', async () => {
    const start = Date.now()
    await expect(read('http://127.0.0.1:1/rien', { retry: false })).rejects.toThrow()
    // Avec reprise, l'échec coûterait la pause de 1,5 s en plus.
    expect(Date.now() - start).toBeLessThan(1400)
  })

  it('json refuse un statut d’erreur en le nommant', async () => {
    await expect(json(`${root}/absent`)).rejects.toThrow('réponse 404')
  })

  it('json lit un corps valide', async () => {
    await expect(json<{ a: number }>(`${root}/json`)).resolves.toEqual({ a: 1 })
  })
})

describe('motif d’échec', () => {
  it('déplie la cause rangée sous « fetch failed »', () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' })
    const error = Object.assign(new Error('fetch failed'), { cause })
    expect(reason(error)).toContain('connect ECONNREFUSED')
    expect(reason(error)).toContain('fetch failed')
  })

  it('nomme un délai de connexion pour ce qu’il est', () => {
    const cause = Object.assign(new Error('Connect Timeout Error'), {
      code: 'UND_ERR_CONNECT_TIMEOUT',
    })
    expect(reason(Object.assign(new Error('fetch failed'), { cause }))).toContain('injoignable')
  })
})
