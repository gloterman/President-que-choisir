import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Importance, Likert, MethodeAgregation, Preferences } from '@/data/types'
import { poidsParDefaut } from '@/data/criteres'
import { propositions } from '@/data/referentiel'

const CLE = 'pqc.preferences.v1'

/** Trois candidats au maximum en comparaison : au-delà, la palette validée ne suit plus. */
export const MAX_COMPARAISON = 3

const preferencesInitiales = (): Preferences => ({
  reponses: {},
  poids: { ...poidsParDefaut },
  seuils: {},
  partProgramme: 0.6,
  methode: 'somme-ponderee',
  exclus: [],
  comparaison: [],
})

function charger(): Preferences {
  if (typeof localStorage === 'undefined') return preferencesInitiales()
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return preferencesInitiales()
    const stocke = JSON.parse(brut) as Partial<Preferences>
    // Fusion avec les valeurs par défaut : le jeu de critères peut avoir
    // changé depuis la dernière visite, et une clé manquante ne doit pas
    // faire disparaître un critère du classement.
    return {
      ...preferencesInitiales(),
      ...stocke,
      poids: { ...poidsParDefaut, ...(stocke.poids ?? {}) },
      reponses: stocke.reponses ?? {},
      seuils: stocke.seuils ?? {},
      exclus: stocke.exclus ?? [],
      comparaison: (stocke.comparaison ?? []).slice(0, MAX_COMPARAISON),
    }
  } catch {
    return preferencesInitiales()
  }
}

interface ValeurStore {
  preferences: Preferences
  repondre: (propositionId: string, valeur: Likert, importance: Importance) => void
  definirPoids: (critereId: string, poids: number) => void
  definirSeuil: (critereId: string, seuil: number) => void
  definirPartProgramme: (part: number) => void
  definirMethode: (methode: MethodeAgregation) => void
  basculerExclu: (candidatId: string) => void
  basculerComparaison: (candidatId: string) => void
  reinitialiserQuestionnaire: () => void
  reinitialiserPoids: () => void
  toutReinitialiser: () => void
  /** Part des propositions auxquelles l'utilisateur a répondu, 0–1. */
  progression: number
  nbReponses: number
  nbPropositions: number
}

const Contexte = createContext<ValeurStore | null>(null)

export function FournisseurPreferences({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(charger)

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(preferences))
    } catch {
      // Stockage indisponible (navigation privée, quota) : l'application
      // reste utilisable, les réglages ne survivront simplement pas au rechargement.
    }
  }, [preferences])

  const repondre = useCallback((propositionId: string, valeur: Likert, importance: Importance) => {
    setPreferences((p) => ({
      ...p,
      reponses: { ...p.reponses, [propositionId]: { valeur, importance } },
    }))
  }, [])

  const definirPoids = useCallback((critereId: string, poids: number) => {
    setPreferences((p) => ({ ...p, poids: { ...p.poids, [critereId]: poids } }))
  }, [])

  const definirSeuil = useCallback((critereId: string, seuil: number) => {
    setPreferences((p) => ({ ...p, seuils: { ...p.seuils, [critereId]: seuil } }))
  }, [])

  const definirPartProgramme = useCallback((part: number) => {
    setPreferences((p) => ({ ...p, partProgramme: Math.min(1, Math.max(0, part)) }))
  }, [])

  const definirMethode = useCallback((methode: MethodeAgregation) => {
    setPreferences((p) => ({ ...p, methode }))
  }, [])

  const basculerExclu = useCallback((candidatId: string) => {
    setPreferences((p) => ({
      ...p,
      exclus: p.exclus.includes(candidatId)
        ? p.exclus.filter((id) => id !== candidatId)
        : [...p.exclus, candidatId],
    }))
  }, [])

  const basculerComparaison = useCallback((candidatId: string) => {
    setPreferences((p) => {
      if (p.comparaison.includes(candidatId)) {
        return { ...p, comparaison: p.comparaison.filter((id) => id !== candidatId) }
      }
      // File d'attente : le plus ancien sort quand la limite est atteinte.
      const suite = [...p.comparaison, candidatId]
      return { ...p, comparaison: suite.slice(-MAX_COMPARAISON) }
    })
  }, [])

  const reinitialiserQuestionnaire = useCallback(() => {
    setPreferences((p) => ({ ...p, reponses: {} }))
  }, [])

  const reinitialiserPoids = useCallback(() => {
    setPreferences((p) => ({ ...p, poids: { ...poidsParDefaut }, seuils: {} }))
  }, [])

  const toutReinitialiser = useCallback(() => setPreferences(preferencesInitiales()), [])

  const nbReponses = Object.keys(preferences.reponses).length

  const valeur = useMemo<ValeurStore>(
    () => ({
      preferences,
      repondre,
      definirPoids,
      definirSeuil,
      definirPartProgramme,
      definirMethode,
      basculerExclu,
      basculerComparaison,
      reinitialiserQuestionnaire,
      reinitialiserPoids,
      toutReinitialiser,
      progression: nbReponses / propositions.length,
      nbReponses,
      nbPropositions: propositions.length,
    }),
    [
      preferences,
      repondre,
      definirPoids,
      definirSeuil,
      definirPartProgramme,
      definirMethode,
      basculerExclu,
      basculerComparaison,
      reinitialiserQuestionnaire,
      reinitialiserPoids,
      toutReinitialiser,
      nbReponses,
    ],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function usePreferences(): ValeurStore {
  const contexte = useContext(Contexte)
  if (!contexte) throw new Error('usePreferences doit être utilisé dans FournisseurPreferences.')
  return contexte
}

// ---------------------------------------------------------------------------

export type Theme = 'clair' | 'sombre' | 'systeme'

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage === 'undefined') return 'systeme'
    const stocke = localStorage.getItem('pqc.theme')
    return stocke === 'dark' ? 'sombre' : stocke === 'light' ? 'clair' : 'systeme'
  })

  const appliquer = useCallback((suivant: Theme) => {
    setTheme(suivant)
    try {
      if (suivant === 'systeme') {
        delete document.documentElement.dataset.theme
        localStorage.removeItem('pqc.theme')
      } else {
        const valeur = suivant === 'sombre' ? 'dark' : 'light'
        document.documentElement.dataset.theme = valeur
        localStorage.setItem('pqc.theme', valeur)
      }
    } catch {
      // Préférence non persistée : sans effet sur le rendu de la session.
    }
  }, [])

  return [theme, appliquer]
}
