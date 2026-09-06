import { Figure, type Table } from './primitives'
import { clsx } from '@/lib/format'

export interface DataBar {
  id: string
  label: string
  /** Valeur affichée, sur l'échelle 0–`max`. */
  value: number
  /** Texte affiché au bout de la barre. À défaut, la valeur arrondie. */
  displayValue?: string
  /** Second niveau d'information, sous le libellé. */
  detail?: string
  /** Met la barre en avant (le résultat de l'utilisateur, par exemple). */
  salient?: boolean
}

/**
 * Barres horizontales classées — une seule série, donc une seule couleur et
 * pas de boîte de légende : le titre dit ce qui est mesuré. Les valeurs sont
 * étiquetées au bout de chaque barre, hors de la barre, ce qui évite tout
 * risque de rognage.
 */
export function RankingBars({
  title,
  subtitle,
  data,
  max = 100,
  unit = '',
  rating,
  valueHeader = 'Valeur',
  onSelect,
}: {
  title: string
  subtitle?: string
  data: DataBar[]
  max?: number
  unit?: string
  rating?: string
  valueHeader?: string
  onSelect?: (id: string) => void
}) {
  const table: Table = {
    headers: ['Candidat', valueHeader],
    rows: data.map((d) => [d.label, d.displayValue ?? Math.round(d.value)]),
    legend: title,
  }

  return (
    <Figure title={title} subtitle={subtitle} rating={rating} table={table}>
      <ol className="space-y-2.5">
        {data.map((datum, index) => {
          const width = Math.max(0, Math.min(100, (datum.value / max) * 100))
          const Content = onSelect ? 'button' : 'div'
          return (
            <li key={datum.id}>
              <Content
                {...(onSelect
                  ? { type: 'button' as const, onClick: () => onSelect(datum.id) }
                  : {})}
                className={clsx(
                  'block w-full text-left',
                  onSelect && 'cursor-pointer rounded-lg focus-visible:outline-2',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="tabular w-5 shrink-0 text-[0.75rem] text-muted">
                      {index + 1}
                    </span>
                    <span className="truncate text-[0.85rem] font-medium text-ink">
                      {datum.label}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[0.82rem] font-semibold text-ink">
                    {datum.displayValue ?? Math.round(datum.value)}
                    {unit}
                  </span>
                </div>
                <div className="mt-1 ml-7 flex items-center gap-2">
                  {/* Piste : une marche claire de la même rampe que le remplissage. */}
                  <div
                    className="h-[10px] min-w-0 flex-1 overflow-hidden rounded-r-[4px]"
                    style={{ background: 'var(--pqc-surface-3)' }}
                  >
                    <div
                      className="h-full rounded-r-[4px]"
                      style={{
                        width: `${width}%`,
                        background: datum.salient
                          ? 'var(--pqc-series-2)'
                          : 'var(--pqc-series-1)',
                      }}
                    />
                  </div>
                </div>
                {datum.detail && (
                  <p className="mt-1 ml-7 text-[0.74rem] leading-snug text-muted">{datum.detail}</p>
                )}
              </Content>
            </li>
          )
        })}
      </ol>
    </Figure>
  )
}
