import { clsx } from '@/lib/format'
import type { Candidat } from '@/data/types'

/**
 * Vignette d'identité. La couleur du parti n'apparaît que sur ce liseré : elle
 * n'entre jamais dans un graphique, où seule la palette validée s'applique.
 */
export function Pastille({
  candidat,
  taille = 'normale',
}: {
  candidat: Candidat
  taille?: 'petite' | 'normale' | 'grande'
}) {
  const tailles = {
    petite: 'h-8 w-8 text-[0.65rem]',
    normale: 'h-11 w-11 text-[0.78rem]',
    grande: 'h-16 w-16 text-[1.05rem]',
  }
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'grid shrink-0 place-items-center rounded-full border-2 bg-surface-2 font-bold tracking-tight text-ink',
        tailles[taille],
      )}
      style={{ borderColor: candidat.couleurParti }}
    >
      {candidat.initiales}
    </span>
  )
}
