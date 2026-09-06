import { EMPTY_SNAPSHOT, type FactCheckSnapshot } from '@/data/factcheck'
import { validateSnapshot } from './schema'

/**
 * Chargement de l'instantané de vérifications.
 *
 * Deux origines possibles, dans cet ordre :
 *
 *  1. un point d'accès direct, si l'exploitant en a configuré un
 *     (`VITE_FACTCHECK_ENDPOINT`). C'est là que peut vivre un service qui
 *     interroge réellement X — service qui détient le jeton, met en cache et
 *     n'expose que le résultat ;
 *  2. l'instantané statique publié avec le site, qui sert aussi de repli
 *     lorsque le point d'accès est absent, lent ou en panne.
 *
 * Le site reste donc fonctionnel sans aucun service : c'est le mode par défaut.
 */

const SNAPSHOT_PATH = 'data/factcheck.json'
const MAX_TIMEOUT_MS = 8000

export type SnapshotOrigin = 'direct' | 'instantane'

export interface LoadSuccess {
  snapshot: FactCheckSnapshot
  origin: SnapshotOrigin
  /** Entrées écartées par la validation. */
  rejected: number
  /** Le point d'accès direct a échoué et l'instantané statique a pris le relais. */
  fellBackToSnapshot: boolean
}

function snapshotUrl(noCache: boolean): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const path = `${base}${base.endsWith('/') ? '' : '/'}${SNAPSHOT_PATH}`
  return noCache ? `${path}?t=${Date.now()}` : path
}

async function fetchWithRetry(url: string, noCache: boolean): Promise<unknown> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), MAX_TIMEOUT_MS)
  try {
    const answer = await fetch(url, {
      signal: abort.signal,
      cache: noCache ? 'no-store' : 'default',
      headers: { Accept: 'application/json' },
    })
    if (!answer.ok) throw new Error(`Réponse ${answer.status}.`)
    return await answer.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function loadSnapshot(
  options: { noCache?: boolean } = {},
): Promise<LoadSuccess> {
  const noCache = options.noCache ?? false
  const endpoint = import.meta.env.VITE_FACTCHECK_ENDPOINT as string | undefined

  if (endpoint) {
    try {
      const raw = await fetchWithRetry(
        noCache ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${Date.now()}` : endpoint,
        noCache,
      )
      const { snapshot, rejected } = validateSnapshot(raw)
      return { snapshot, origin: 'direct', rejected, fellBackToSnapshot: false }
    } catch {
      // Le point d'accès est optionnel : son échec ne doit pas priver le
      // visiteur des vérifications déjà publiées.
      const raw = await fetchWithRetry(snapshotUrl(true), true)
      const { snapshot, rejected } = validateSnapshot(raw)
      return { snapshot, origin: 'instantane', rejected, fellBackToSnapshot: true }
    }
  }

  const raw = await fetchWithRetry(snapshotUrl(noCache), noCache)
  const { snapshot, rejected } = validateSnapshot(raw)
  return { snapshot, origin: 'instantane', rejected, fellBackToSnapshot: false }
}

export { EMPTY_SNAPSHOT }
