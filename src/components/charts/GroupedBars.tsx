import { Figure, seriesColor, type LegendEntry, type Table } from './primitives'

export interface BarGroup {
  /** Libellé de la catégorie, en abscisse. */
  category: string
  /** Une valeur 0–100 par série, ou `null` si non applicable. */
  values: (number | null)[]
}

/**
 * Barres groupées, trois séries au maximum.
 *
 * Les barres voisines sont séparées par un vide de 2 pixels dans la couleur de
 * la surface — jamais par un contour, qui ajouterait de l'encre sans ajouter
 * d'information.
 */
export function GroupedBars({
  title,
  subtitle,
  series,
  groups,
  rating,
  unit = ' %',
}: {
  title: string
  subtitle?: string
  series: { id: string; label: string }[]
  groups: BarGroup[]
  rating?: string
  unit?: string
}) {
  const legend: LegendEntry[] = series.map((series, i) => ({
    label: series.label,
    color: seriesColor(i),
  }))

  const table: Table = {
    headers: ['Thème', ...series.map((s) => s.label)],
    rows: groups.map((g) => [
      g.category,
      ...g.values.map((v) => (v === null ? 'non exprimé' : Math.round(v))),
    ]),
    legend: title,
  }

  return (
    <Figure
      title={title}
      subtitle={subtitle}
      legend={series.length >= 2 ? legend : undefined}
      table={table}
      rating={rating}
    >
      <ul className="space-y-3.5">
        {groups.map((group) => (
          <li key={group.category}>
            <p className="text-[0.8rem] font-medium text-ink">{group.category}</p>
            <div className="mt-1.5 space-y-[2px]">
              {group.values.map((value, i) => (
                <div key={series[i]?.id ?? i} className="flex items-center gap-2">
                  <div
                    className="h-3 min-w-0 flex-1 overflow-hidden rounded-r-[4px]"
                    style={{ background: 'var(--pqc-surface-3)' }}
                  >
                    {value !== null && (
                      <div
                        className="h-full rounded-r-[4px]"
                        style={{
                          width: `${Math.max(0, Math.min(100, value))}%`,
                          background: seriesColor(i),
                        }}
                      />
                    )}
                  </div>
                  <span className="tabular w-16 shrink-0 text-right text-[0.75rem] text-ink-2">
                    {value === null ? '—' : `${Math.round(value)}${unit}`}
                  </span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Figure>
  )
}
