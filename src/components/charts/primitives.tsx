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

export const seriesColor = (index: number): string => SERIES[index % SERIES.length]

export interface LegendEntry {
  label: string
  color: string
  shape?: 'carre' | 'ligne' | 'point'
}

export function Legend({ entries }: { entries: LegendEntry[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5 text-[0.78rem] text-ink-2">
          <span
            aria-hidden="true"
            className={clsx(
              'inline-block shrink-0',
              entry.shape === 'ligne' ? 'h-0.5 w-4 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]',
              entry.shape === 'point' && 'rounded-full',
            )}
            style={{ background: entry.color }}
          />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}

export interface Table {
  headers: string[]
  rows: (string | number)[][]
  legend?: string
}

export function Figure({
  title,
  subtitle,
  legend,
  table,
  rating,
  children,
  className,
}: {
  title: string
  subtitle?: ReactNode
  legend?: LegendEntry[]
  table?: Table
  rating?: ReactNode
  children: ReactNode
  className?: string
}) {
  const titleId = useId()
  return (
    <figure className={clsx('min-w-0', className)} aria-labelledby={titleId}>
      <figcaption className="mb-3">
        <h3 id={titleId} className="text-[0.95rem] font-semibold tracking-tight text-ink">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[0.8rem] leading-snug text-ink-2">{subtitle}</p>}
      </figcaption>

      {legend && legend.length >= 2 && (
        <div className="mb-3">
          <Legend entries={legend} />
        </div>
      )}

      <div className="min-w-0">{children}</div>

      {rating && <p className="mt-3 text-[0.75rem] leading-snug text-muted">{rating}</p>}

      {table && (
        <details className="mt-3 no-print">
          <summary className="cursor-pointer text-[0.75rem] font-medium text-accent marker:content-none hover:underline">
            Voir les données
          </summary>
          <div className="pqc-scroll-x mt-2 rounded-lg border border-line">
            <table className="w-full border-collapse text-left text-[0.78rem]">
              {table.legend && <caption className="sr-only">{table.legend}</caption>}
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {table.headers.map((header, i) => (
                    <th
                      key={header}
                      scope="col"
                      className={clsx(
                        'px-3 py-2 font-semibold text-ink-2 whitespace-nowrap',
                        i > 0 && 'text-right',
                      )}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={String(row[0])} className="border-b border-line last:border-0">
                    {row.map((cell, i) => (
                      <td
                        key={i}
                        className={clsx(
                          'px-3 py-1.5 text-ink',
                          i > 0 && 'tabular text-right whitespace-nowrap',
                        )}
                      >
                        {cell}
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
export function useTooltip() {
  const [bulle, setBulle] = useState<{ x: number; y: number; content: ReactNode } | null>(null)

  const rendered = bulle ? (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 max-w-[15rem] -translate-x-1/2 -translate-y-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-[0.75rem] leading-snug text-ink shadow-lg"
      style={{ left: `${bulle.x}%`, top: `${bulle.y}%` }}
    >
      {bulle.content}
    </div>
  ) : null

  return { setBulle, rendered }
}

/**
 * Tracé d'une barre horizontale : extrémité arrondie côté donnée, angle droit
 * côté ligne de base. Le rayon est réduit sur les barres très courtes pour ne
 * pas déformer la valeur.
 */
export function horizontalBarPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, width, height / 2)
  if (width <= 0.5) return ''
  return [
    `M ${x} ${y}`,
    `H ${x + width - r}`,
    `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
    `V ${y + height - r}`,
    `A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}`,
    `H ${x}`,
    'Z',
  ].join(' ')
}
