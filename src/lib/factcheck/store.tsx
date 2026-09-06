import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { EMPTY_SNAPSHOT, type FactCheckSnapshot } from '@/data/factcheck'
import { loadSnapshot, type SnapshotOrigin } from './chargement'

/**
 * État partagé des vérifications.
 *
 * Le chargement part une seule fois, à l'ouverture du site, et le résultat est
 * partagé par toutes les pages : la fiche d'un candidat, la page des
 * vérifications et le classement lisent le même instantané. Recharger à chaque
 * navigation rejouerait le même téléchargement sans rien apporter.
 */

export type LoadState = 'initial' | 'chargement' | 'pret' | 'erreur'

interface FactCheckValue {
  snapshot: FactCheckSnapshot
  state: LoadState
  error: string | null
  origin: SnapshotOrigin | null
  rejected: number
  fellBackToSnapshot: boolean
  /** Date de fin du dernier chargement réussi. */
  loadedAt: Date | null
  /** Relance un chargement en contournant le cache du navigateur. */
  refresh: () => void
  /** Un chargement est en cours alors que des données sont déjà affichées. */
  refreshInProgress: boolean
}

const Context = createContext<FactCheckValue | null>(null)

export function FactCheckProvider({ children }: { children: ReactNode }) {
  const [snapshot, setInstantane] = useState<FactCheckSnapshot>(EMPTY_SNAPSHOT)
  const [state, setEtat] = useState<LoadState>('initial')
  const [error, setErreur] = useState<string | null>(null)
  const [origin, setOrigine] = useState<SnapshotOrigin | null>(null)
  const [rejected, setRejets] = useState(0)
  const [repli, setRepli] = useState(false)
  const [loadedAt, setChargeLe] = useState<Date | null>(null)
  const [refreshInProgress, setActualisationEnCours] = useState(false)

  // Évite qu'une réponse lente écrase le résultat d'une actualisation plus
  // récente, et coupe la mise à jour d'état après démontage.
  const generation = useRef(0)
  const ascending = useRef(true)
  useEffect(() => {
    ascending.current = true
    return () => {
      ascending.current = false
    }
  }, [])

  const load = useCallback(async (noCache: boolean) => {
    const mine = ++generation.current
    if (noCache) setActualisationEnCours(true)
    else setEtat('chargement')
    try {
      const result = await loadSnapshot({ noCache })
      if (!ascending.current || mine !== generation.current) return
      setInstantane(result.snapshot)
      setOrigine(result.origin)
      setRejets(result.rejected)
      setRepli(result.fellBackToSnapshot)
      setChargeLe(new Date())
      setErreur(null)
      setEtat('pret')
    } catch (e) {
      if (!ascending.current || mine !== generation.current) return
      setErreur(e instanceof Error ? e.message : 'Chargement impossible.')
      setEtat('erreur')
    } finally {
      if (ascending.current && mine === generation.current) setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    void load(false)
  }, [load])

  const value = useMemo<FactCheckValue>(
    () => ({
      snapshot,
      state,
      error,
      origin,
      rejected,
      fellBackToSnapshot: repli,
      loadedAt,
      refresh: () => void load(true),
      refreshInProgress,
    }),
    [snapshot, state, error, origin, rejected, repli, loadedAt, load, refreshInProgress],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useFactCheck(): FactCheckValue {
  const context = useContext(Context)
  if (!context) throw new Error('useFactCheck doit être utilisé dans FournisseurFactCheck.')
  return context
}
