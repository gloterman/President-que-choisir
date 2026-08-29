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
import { INSTANTANE_VIDE, type InstantaneFactCheck } from '@/data/factcheck'
import { chargerInstantane, type OrigineInstantane } from './chargement'

/**
 * État partagé des vérifications.
 *
 * Le chargement part une seule fois, à l'ouverture du site, et le résultat est
 * partagé par toutes les pages : la fiche d'un candidat, la page des
 * vérifications et le classement lisent le même instantané. Recharger à chaque
 * navigation rejouerait le même téléchargement sans rien apporter.
 */

export type EtatChargement = 'initial' | 'chargement' | 'pret' | 'erreur'

interface ValeurFactCheck {
  instantane: InstantaneFactCheck
  etat: EtatChargement
  erreur: string | null
  origine: OrigineInstantane | null
  rejets: number
  replisurInstantane: boolean
  /** Date de fin du dernier chargement réussi. */
  chargeLe: Date | null
  /** Relance un chargement en contournant le cache du navigateur. */
  actualiser: () => void
  /** Un chargement est en cours alors que des données sont déjà affichées. */
  actualisationEnCours: boolean
}

const Contexte = createContext<ValeurFactCheck | null>(null)

export function FournisseurFactCheck({ children }: { children: ReactNode }) {
  const [instantane, setInstantane] = useState<InstantaneFactCheck>(INSTANTANE_VIDE)
  const [etat, setEtat] = useState<EtatChargement>('initial')
  const [erreur, setErreur] = useState<string | null>(null)
  const [origine, setOrigine] = useState<OrigineInstantane | null>(null)
  const [rejets, setRejets] = useState(0)
  const [repli, setRepli] = useState(false)
  const [chargeLe, setChargeLe] = useState<Date | null>(null)
  const [actualisationEnCours, setActualisationEnCours] = useState(false)

  // Évite qu'une réponse lente écrase le résultat d'une actualisation plus
  // récente, et coupe la mise à jour d'état après démontage.
  const generation = useRef(0)
  const monte = useRef(true)
  useEffect(() => {
    monte.current = true
    return () => {
      monte.current = false
    }
  }, [])

  const charger = useCallback(async (sansCache: boolean) => {
    const mienne = ++generation.current
    if (sansCache) setActualisationEnCours(true)
    else setEtat('chargement')
    try {
      const resultat = await chargerInstantane({ sansCache })
      if (!monte.current || mienne !== generation.current) return
      setInstantane(resultat.instantane)
      setOrigine(resultat.origine)
      setRejets(resultat.rejets)
      setRepli(resultat.replisurInstantane)
      setChargeLe(new Date())
      setErreur(null)
      setEtat('pret')
    } catch (e) {
      if (!monte.current || mienne !== generation.current) return
      setErreur(e instanceof Error ? e.message : 'Chargement impossible.')
      setEtat('erreur')
    } finally {
      if (monte.current && mienne === generation.current) setActualisationEnCours(false)
    }
  }, [])

  useEffect(() => {
    void charger(false)
  }, [charger])

  const valeur = useMemo<ValeurFactCheck>(
    () => ({
      instantane,
      etat,
      erreur,
      origine,
      rejets,
      replisurInstantane: repli,
      chargeLe,
      actualiser: () => void charger(true),
      actualisationEnCours,
    }),
    [instantane, etat, erreur, origine, rejets, repli, chargeLe, charger, actualisationEnCours],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useFactCheck(): ValeurFactCheck {
  const contexte = useContext(Contexte)
  if (!contexte) throw new Error('useFactCheck doit être utilisé dans FournisseurFactCheck.')
  return contexte
}
