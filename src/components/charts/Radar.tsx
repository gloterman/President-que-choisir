import { Figure, seriesColor, useTooltip, type LegendEntry, type Table } from './primitives'

export interface RadarSeries {
  id: string
  label: string
  /** Une valeur 0–100 par axe, dans l'ordre de `axes`. */
  values: number[]
}

const SIZE = 420
const HEIGHT = 380
const CX = 210
const CY = 182
const R = 112

const point = (angle: number, radius: number) => ({
  x: CX + Math.cos(angle) * radius,
  y: CY + Math.sin(angle) * radius,
})

/**
 * Profil multicritère superposé, trois séries au maximum.
 *
 * Les sommets se croisent : deux séries quelconques peuvent devenir voisines,
 * ce qui impose de valider la palette sur toutes les paires — et donc de
 * s'arrêter à trois. Au-delà, on lit la vue tableau, exposée sous la figure.
 */
export function Radar({
  title,
  subtitle,
  axes,
  series,
  rating,
}: {
  title: string
  subtitle?: string
  axes: string[]
  series: RadarSeries[]
  rating?: string
}) {
  const { setBulle, rendered } = useTooltip()
  const n = axes.length
  if (n < 3) return null

  // On démarre à midi et on tourne dans le sens horaire.
  const angleOf = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2
  const levels = [25, 50, 75, 100]

  const legend: LegendEntry[] = series.map((series, i) => ({
    label: series.label,
    color: seriesColor(i),
    shape: 'ligne',
  }))

  const table: Table = {
    headers: ['Critère', ...series.map((s) => s.label)],
    rows: axes.map((axis, i) => [axis, ...series.map((s) => Math.round(s.values[i] ?? 0))]),
    legend: title,
  }

  return (
    <Figure
      title={title}
      subtitle={subtitle}
      legend={legend}
      table={table}
      rating={rating}
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${SIZE} ${HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title}. ${series.map((s) => s.label).join(', ')}. Détail dans le tableau sous la figure.`}
        >
          {/* Grille : traits pleins, une marche au-dessus de la surface. */}
          {levels.map((level) => (
            <polygon
              key={level}
              points={axes
                .map((_, i) => {
                  const p = point(angleOf(i), (level / 100) * R)
                  return `${p.x},${p.y}`
                })
                .join(' ')}
              fill="none"
              stroke="var(--pqc-grid)"
              strokeWidth={1}
            />
          ))}
          {axes.map((_, i) => {
            const p = point(angleOf(i), R)
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                stroke="var(--pqc-grid)"
                strokeWidth={1}
              />
            )
          })}

          {series.map((series, seriesIndex) => {
            const color = seriesColor(seriesIndex)
            const vertices = axes.map((_, i) =>
              point(angleOf(i), (Math.max(0, Math.min(100, series.values[i] ?? 0)) / 100) * R),
            )
            return (
              <g key={series.id}>
                <polygon
                  points={vertices.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill={color}
                  fillOpacity={0.1}
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {vertices.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={color}
                    stroke="var(--pqc-surface)"
                    strokeWidth={2}
                    onMouseEnter={() =>
                      setBulle({
                        x: (p.x / SIZE) * 100,
                        y: (p.y / HEIGHT) * 100,
                        content: (
                          <>
                            <strong>{series.label}</strong> — {axes[i]} :{' '}
                            {Math.round(series.values[i] ?? 0)}/100
                          </>
                        ),
                      })
                    }
                    onMouseLeave={() => setBulle(null)}
                  />
                ))}
              </g>
            )
          })}

          {/* Libellés d'axes : encre de texte, jamais la couleur de série. */}
          {axes.map((axis, i) => {
            const angle = angleOf(i)
            const p = point(angle, R + 20)
            const cos = Math.cos(angle)
            const anchor = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle'
            return (
              <text
                key={axis}
                x={p.x}
                y={p.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--pqc-muted)"
              >
                {axis}
              </text>
            )
          })}
        </svg>
        {rendered}
      </div>
    </Figure>
  )
}
