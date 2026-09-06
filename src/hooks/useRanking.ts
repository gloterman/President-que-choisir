import { useMemo } from 'react'
import { candidates } from '@/data/candidates'
import { computeRanking, type Ranking } from '@/lib/scoring'
import { dynamicAccuracyRatings } from '@/lib/factcheck/accuracy'
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
export function useRanking(): Ranking {
  const { preferences } = usePreferences()
  const { snapshot } = useFactCheck()

  const dynamicRatings = useMemo(
    () =>
      dynamicAccuracyRatings(
        snapshot,
        candidates.map((c) => c.id),
      ),
    [snapshot],
  )

  return useMemo(
    () => computeRanking(candidates, preferences, dynamicRatings),
    [preferences, dynamicRatings],
  )
}
