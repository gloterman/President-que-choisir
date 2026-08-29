import { useMemo } from 'react'
import { candidats } from '@/data/candidats'
import { calculerClassement, type Classement } from '@/lib/scoring'
import { notesVeraciteDynamiques } from '@/lib/factcheck/veracite'
import { useFactCheck } from '@/lib/factcheck/store'
import { usePreferences } from '@/lib/store'

/**
 * Recalcule le classement à chaque changement de préférences ou de
 * vérifications publiées.
 *
 * Le calcul complet — quatre méthodes plus mille tirages de sensibilité sur une
 * quinzaine de candidats — tient en une quinzaine de millisecondes, ce qui
 * permet de le refaire de façon synchrone à chaque déplacement de curseur
 * plutôt que de gérer un état dérivé.
 */
export function useClassement(): Classement {
  const { preferences } = usePreferences()
  const { instantane } = useFactCheck()

  const notesDynamiques = useMemo(
    () =>
      notesVeraciteDynamiques(
        instantane,
        candidats.map((c) => c.id),
      ),
    [instantane],
  )

  return useMemo(
    () => calculerClassement(candidats, preferences, notesDynamiques),
    [preferences, notesDynamiques],
  )
}
