import { useId, useState, type ReactNode } from 'react'
import { clsx } from '@/lib/format'

/**
 * Socle commun aux graphiques.
 *
 * Trois règles y sont câblées une fois pour toutes :
 *  — les couleurs de série sont assignées dans un ordre figé et suivent
 *    l'entité, jamais son rang, pour qu'un filtre ne repeigne pas les
 *    survivants ;
 *  — au-delà de deux séries, une légende est toujours présente ;
 *  — chaque figure expose une vue tableau, qui sert à la fois de repli
 *    d'accessibilité et de secours quand un libellé ne tient pas.
 */

/**
 * Palette catégorielle validée (guide dataviz, mode clair et sombre, toutes
 * paires). Trois emplacements seulement : au-delà, les paires ne tiennent plus
 * les seuils de séparation sous déficience de la vision des couleurs. Les vues
 * qui doivent montrer plus de trois entités passent par le tableau ou par une
 * série unique avec libellés directs.
 */
export const SERIES = ['var(--pqc-series-1)', 'var(--pqc-series-2)', 'var(--pqc-series-3)'] as const
export const MAX_SERIES = SERIES.length

export const couleurSerie = (index: number): string => SERIES[index % SERIES.length]

export interface EntreeLegende {
  label: string
  couleur: string
  forme?: 'carre' | 'ligne' | 'point'
}

export function Legende({ entrees }: { entrees: EntreeLegende[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {entrees.map((entree) => (
        <li key={entree.label} className="flex items-center gap-1.5 text-[0.78rem] text-ink-2">
          <span
            aria-hidden="true"
            className={clsx(
              'inline-block shrink-0',
              entree.forme === 'ligne' ? 'h-0.5 w-4 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]',
              entree.forme === 'point' && 'rounded-full',
            )}
            style={{ background: entree.couleur }}
          />
          {entree.label}
        </li>
      ))}
    </ul>
  )
}

export interface Tableau {
  entetes: string[]
  lignes: (string | number)[][]
  legende?: string
}

export function Figure({
  titre,
  soustitre,
  legende,
  tableau,
  note,
  children,
  className,
}: {
  titre: string
  soustitre?: ReactNode
  legende?: EntreeLegende[]
  tableau?: Tableau
  note?: ReactNode
  children: ReactNode
  className?: string
}) {
  const idTitre = useId()
  return (
    <figure className={clsx('min-w-0', className)} aria-labelledby={idTitre}>
      <figcaption className="mb-3">
        <h3 id={idTitre} className="text-[0.95rem] font-semibold tracking-tight text-ink">
          {titre}
        </h3>
        {soustitre && <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-2">{soustitre}</p>}
      </figcaption>

      {legende && legende.length >= 2 && (
        <div className="mb-3">
          <Legende entrees={legende} />
        </div>
      )}

      <div className="min-w-0">{children}</div>

      {note && <p className="mt-3 text-[0.75rem] leading-snug text-muted">{note}</p>}

      {tableau && (
        <details className="mt-3 no-print">
          <summary className="cursor-pointer text-[0.75rem] font-medium text-accent marker:content-none hover:underline">
            Voir les données
          </summary>
          <div className="pqc-scroll-x mt-2 rounded-lg border border-line">
            <table className="w-full border-collapse text-left text-[0.78rem]">
              {tableau.legende && <caption className="sr-only">{tableau.legende}</caption>}
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {tableau.entetes.map((entete, i) => (
                    <th
                      key={entete}
                      scope="col"
                      className={clsx(
                        'px-3 py-2 font-semibold text-ink-2 whitespace-nowrap',
                        i > 0 && 'text-right',
                      )}
                    >
                      {entete}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableau.lignes.map((ligne) => (
                  <tr key={String(ligne[0])} className="border-b border-line last:border-0">
                    {ligne.map((cellule, i) => (
                      <td
                        key={i}
                        className={clsx(
                          'px-3 py-1.5 text-ink',
                          i > 0 && 'tabular text-right whitespace-nowrap',
                        )}
                      >
                        {cellule}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  )
}

/** Infobulle positionnée au survol, partagée par les graphiques SVG. */
export function useInfobulle() {
  const [bulle, setBulle] = useState<{ x: number; y: number; contenu: ReactNode } | null>(null)

  const rendu = bulle ? (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-[15rem] -translate-x-1/2 -translate-y-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[0.75rem] leading-snug text-ink shadow-lg"
      style={{ left: `${bulle.x}%`, top: `${bulle.y}%` }}
    >
      {bulle.contenu}
    </div>
  ) : null

  return { setBulle, rendu }
}

/**
 * Tracé d'une barre horizontale : extrémité arrondie côté donnée, angle droit
 * côté ligne de base. Le rayon est réduit sur les barres très courtes pour ne
 * pas déformer la valeur.
 */
export function cheminBarreHorizontale(x: number, y: number, largeur: number, hauteur: number): string {
  const r = Math.min(4, largeur, hauteur / 2)
  if (largeur <= 0.5) return ''
  return [
    `M ${x} ${y}`,
    `H ${x + largeur - r}`,
    `A ${r} ${r} 0 0 1 ${x + largeur} ${y + r}`,
    `V ${y + hauteur - r}`,
    `A ${r} ${r} 0 0 1 ${x + largeur - r} ${y + hauteur}`,
    `H ${x}`,
    'Z',
  ].join(' ')
}
