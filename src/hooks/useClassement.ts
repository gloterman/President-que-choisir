import { useMemo } from 'react'
import { candidats } from '@/data/candidats'
import { calculerClassement, type Classement } from '@/lib/scoring'
import { usePreferences } from '@/lib/store'

/**
 * Recalcule le classement à chaque changement de préférences.
 *
 * Le calcul complet — quatre méthodes plus mille tirages de sensibilité sur
 * une dizaine de candidats — reste très en deçà du budget d'une image de
 * rendu, ce qui permet de le refaire de façon synchrone à chaque déplacement
 * de curseur plutôt que de gérer un état dérivé.
 */
export function useClassement(): Classement {
  const { preferences } = usePreferences()
  return useMemo(() => calculerClassement(candidats, preferences), [preferences])
}
