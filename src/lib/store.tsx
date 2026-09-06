import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Importance, Likert, AggregationMethod, Preferences } from '@/data/types'
import { defaultWeights } from '@/data/criteres'
import { propositions } from '@/data/referentiel'

const KEY = 'pqc.preferences.v1'

/** Trois candidats au maximum en comparaison : au-delà, la palette validée ne suit plus. */
export const MAX_COMPARISON = 3

const initialPreferences = (): Preferences => ({
  answers: {},
  weight: { ...defaultWeights },
  thresholds: {},
  programShare: 0.6,
  method: 'somme-ponderee',
  excluded: [],
  comparison: [],
})

function load(): Preferences {
  if (typeof localStorage === 'undefined') return initialPreferences()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialPreferences()
    const stored = JSON.parse(raw) as Partial<Preferences>
    // Fusion avec les valeurs par défaut : le jeu de critères peut avoir
    // changé depuis la dernière visite, et une clé manquante ne doit pas
    // faire disparaître un critère du classement.
    return {
      ...initialPreferences(),
      ...stored,
      weight: { ...defaultWeights, ...(stored.weight ?? {}) },
      answers: stored.answers ?? {},
      thresholds: stored.thresholds ?? {},
      excluded: stored.excluded ?? [],
      comparison: (stored.comparison ?? []).slice(0, MAX_COMPARISON),
    }
  } catch {
    return initialPreferences()
  }
}

interface StoreValue {
  preferences: Preferences
  setAnswer: (propositionId: string, value: Likert, importance: Importance) => void
  setWeight: (criterionId: string, weight: number) => void
  setThreshold: (criterionId: string, threshold: number) => void
  setProgramShare: (share: number) => void
  setMethod: (method: AggregationMethod) => void
  toggleExcluded: (candidateId: string) => void
  toggleComparison: (candidateId: string) => void
  resetQuestionnaire: () => void
  resetWeights: () => void
  resetAll: () => void
  /** Part des propositions auxquelles l'utilisateur a répondu, 0–1. */
  progress: number
  answerCount: number
  propositionCount: number
}

const Context = createContext<StoreValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(preferences))
    } catch {
      // Stockage indisponible (navigation privée, quota) : l'application
      // reste utilisable, les réglages ne survivront simplement pas au rechargement.
    }
  }, [preferences])

  const setAnswer = useCallback((propositionId: string, value: Likert, importance: Importance) => {
    setPreferences((p) => ({
      ...p,
      answers: { ...p.answers, [propositionId]: { value, importance } },
    }))
  }, [])

  const setWeight = useCallback((criterionId: string, weight: number) => {
    setPreferences((p) => ({ ...p, weight: { ...p.weight, [criterionId]: weight } }))
  }, [])

  const setThreshold = useCallback((criterionId: string, threshold: number) => {
    setPreferences((p) => ({ ...p, thresholds: { ...p.thresholds, [criterionId]: threshold } }))
  }, [])

  const setProgramShare = useCallback((share: number) => {
    setPreferences((p) => ({ ...p, programShare: Math.min(1, Math.max(0, share)) }))
  }, [])

  const setMethod = useCallback((method: AggregationMethod) => {
    setPreferences((p) => ({ ...p, method }))
  }, [])

  const toggleExcluded = useCallback((candidateId: string) => {
    setPreferences((p) => ({
      ...p,
      excluded: p.excluded.includes(candidateId)
        ? p.excluded.filter((id) => id !== candidateId)
        : [...p.excluded, candidateId],
    }))
  }, [])

  const toggleComparison = useCallback((candidateId: string) => {
    setPreferences((p) => {
      if (p.comparison.includes(candidateId)) {
        return { ...p, comparison: p.comparison.filter((id) => id !== candidateId) }
      }
      // File d'attente : le plus ancien sort quand la limite est atteinte.
      const resolve = [...p.comparison, candidateId]
      return { ...p, comparison: resolve.slice(-MAX_COMPARISON) }
    })
  }, [])

  const resetQuestionnaire = useCallback(() => {
    setPreferences((p) => ({ ...p, answers: {} }))
  }, [])

  const resetWeights = useCallback(() => {
    setPreferences((p) => ({ ...p, weight: { ...defaultWeights }, thresholds: {} }))
  }, [])

  const resetAll = useCallback(() => setPreferences(initialPreferences()), [])

  const answerCount = Object.keys(preferences.answers).length

  const value = useMemo<StoreValue>(
    () => ({
      preferences,
      setAnswer,
      setWeight,
      setThreshold,
      setProgramShare,
      setMethod,
      toggleExcluded,
      toggleComparison,
      resetQuestionnaire,
      resetWeights,
      resetAll,
      progress: answerCount / propositions.length,
      answerCount,
      propositionCount: propositions.length,
    }),
    [
      preferences,
      setAnswer,
      setWeight,
      setThreshold,
      setProgramShare,
      setMethod,
      toggleExcluded,
      toggleComparison,
      resetQuestionnaire,
      resetWeights,
      resetAll,
      answerCount,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePreferences(): StoreValue {
  const context = useContext(Context)
  if (!context) throw new Error('usePreferences doit être utilisé dans FournisseurPreferences.')
  return context
}

// ---------------------------------------------------------------------------

export type Theme = 'clair' | 'sombre' | 'systeme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage === 'undefined') return 'systeme'
    const stored = localStorage.getItem('pqc.theme')
    return stored === 'dark' ? 'sombre' : stored === 'light' ? 'clair' : 'systeme'
  })

  const apply = useCallback((next: Theme) => {
    setTheme(next)
    try {
      if (next === 'systeme') {
        delete document.documentElement.dataset.theme
        localStorage.removeItem('pqc.theme')
      } else {
        const value = next === 'sombre' ? 'dark' : 'light'
        document.documentElement.dataset.theme = value
        localStorage.setItem('pqc.theme', value)
      }
    } catch {
      // Préférence non persistée : sans effet sur le rendu de la session.
    }
  }, [])

  return [theme, apply]
}
