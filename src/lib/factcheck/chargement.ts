import { INSTANTANE_VIDE, type InstantaneFactCheck } from '@/data/factcheck'
import { validerInstantane } from './schema'

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

const CHEMIN_INSTANTANE = 'donnees/factcheck.json'
const DELAI_MAX_MS = 8000

export type OrigineInstantane = 'direct' | 'instantane'

export interface ChargementReussi {
  instantane: InstantaneFactCheck
  origine: OrigineInstantane
  /** Entrées écartées par la validation. */
  rejets: number
  /** Le point d'accès direct a échoué et l'instantané statique a pris le relais. */
  replisurInstantane: boolean
}

function urlInstantane(sansCache: boolean): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const chemin = `${base}${base.endsWith('/') ? '' : '/'}${CHEMIN_INSTANTANE}`
  return sansCache ? `${chemin}?t=${Date.now()}` : chemin
}

async function recuperer(url: string, sansCache: boolean): Promise<unknown> {
  const abandon = new AbortController()
  const minuterie = setTimeout(() => abandon.abort(), DELAI_MAX_MS)
  try {
    const reponse = await fetch(url, {
      signal: abandon.signal,
      cache: sansCache ? 'no-store' : 'default',
      headers: { Accept: 'application/json' },
    })
    if (!reponse.ok) throw new Error(`Réponse ${reponse.status}.`)
    return await reponse.json()
  } finally {
    clearTimeout(minuterie)
  }
}

export async function chargerInstantane(
  options: { sansCache?: boolean } = {},
): Promise<ChargementReussi> {
  const sansCache = options.sansCache ?? false
  const pointAcces = import.meta.env.VITE_FACTCHECK_ENDPOINT as string | undefined

  if (pointAcces) {
    try {
      const brut = await recuperer(
        sansCache ? `${pointAcces}${pointAcces.includes('?') ? '&' : '?'}t=${Date.now()}` : pointAcces,
        sansCache,
      )
      const { instantane, rejets } = validerInstantane(brut)
      return { instantane, origine: 'direct', rejets, replisurInstantane: false }
    } catch {
      // Le point d'accès est optionnel : son échec ne doit pas priver le
      // visiteur des vérifications déjà publiées.
      const brut = await recuperer(urlInstantane(true), true)
      const { instantane, rejets } = validerInstantane(brut)
      return { instantane, origine: 'instantane', rejets, replisurInstantane: true }
    }
  }

  const brut = await recuperer(urlInstantane(sansCache), sansCache)
  const { instantane, rejets } = validerInstantane(brut)
  return { instantane, origine: 'instantane', rejets, replisurInstantane: false }
}

export { INSTANTANE_VIDE }
