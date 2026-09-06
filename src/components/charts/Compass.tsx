import { Figure, useTooltip, type LegendEntry, type Table } from './primitives'

export interface CandidatePoint {
  id: string
  label: string
  initials: string
  /** −1 à +1. */
  eco: number
  /** −1 à +1. */
  soc: number
}

const T = 400
const MARGIN = 34
const PLOT = T - MARGIN * 2

/**
 * Boussole politique en deux dimensions.
 *
 * L'identité n'est pas portée par la couleur : chaque point est étiqueté
 * directement par les initiales du candidat. Deux couleurs seulement
 * interviennent — les candidats d'une part, la position de l'utilisateur de
 * l'autre — ce qui laisse la lecture possible quelle que soit la vision des
 * couleurs, y compris avec onze points sur la même surface.
 */
export function Compass({
  title,
  subtitle,
  candidates,
  user,
  rating,
}: {
  title: string
  subtitle?: string
  candidates: CandidatePoint[]
  user?: { eco: number; soc: number } | null
  rating?: string
}) {
  const { setBulle, rendered } = useTooltip()

  const toX = (eco: number) => MARGIN + ((eco + 1) / 2) * PLOT
  // L'axe des ordonnées est inversé : le pôle conservateur est en haut.
  const toY = (soc: number) => MARGIN + ((1 - soc) / 2) * PLOT

  const legend: LegendEntry[] = [
    { label: 'Candidats', color: 'var(--pqc-series-1)', shape: 'point' },
    ...(user
      ? [{ label: 'Votre position', color: 'var(--pqc-series-2)', shape: 'point' as const }]
      : []),
  ]

  const table: Table = {
    headers: ['Candidat', 'Axe économique', 'Axe culturel'],
    rows: [
      ...candidates.map((c) => [c.label, c.eco.toFixed(2), c.soc.toFixed(2)]),
      ...(user ? [['Votre position', user.eco.toFixed(2), user.soc.toFixed(2)]] : []),
    ],
    legend: 'Coordonnées sur la boussole, de −1 à +1.',
  }

  return (
    <Figure title={title} subtitle={subtitle} legend={legend} table={table} rating={rating}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${T} ${T}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${title}. Coordonnées détaillées dans le tableau sous la figure.`}
        >
          <rect
            x={MARGIN}
            y={MARGIN}
            width={PLOT}
            height={PLOT}
            fill="none"
            stroke="var(--pqc-grid)"
            strokeWidth={1}
          />
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <line
                x1={MARGIN + f * PLOT}
                y1={MARGIN}
                x2={MARGIN + f * PLOT}
                y2={MARGIN + PLOT}
                stroke="var(--pqc-grid)"
                strokeWidth={1}
              />
              <line
                x1={MARGIN}
                y1={MARGIN + f * PLOT}
                x2={MARGIN + PLOT}
                y2={MARGIN + f * PLOT}
                stroke="var(--pqc-grid)"
                strokeWidth={1}
              />
            </g>
          ))}
          {/* Axes centraux, un ton plus marqué que la grille. */}
          <line
            x1={MARGIN + PLOT / 2}
            y1={MARGIN}
            x2={MARGIN + PLOT / 2}
            y2={MARGIN + PLOT}
            stroke="var(--pqc-axis)"
            strokeWidth={1}
          />
          <line
            x1={MARGIN}
            y1={MARGIN + PLOT / 2}
            x2={MARGIN + PLOT}
            y2={MARGIN + PLOT / 2}
            stroke="var(--pqc-axis)"
            strokeWidth={1}
          />

          <text x={T / 2} y={16} textAnchor="middle" fontSize={11} fill="var(--pqc-muted)">
            Conservateur, souverainiste
          </text>
          <text x={T / 2} y={T - 6} textAnchor="middle" fontSize={11} fill="var(--pqc-muted)">
            Progressiste, européen
          </text>
          <text
            x={12}
            y={T / 2}
            textAnchor="middle"
            fontSize={11}
            fill="var(--pqc-muted)"
            transform={`rotate(-90 12 ${T / 2})`}
          >
            Interventionnisme
          </text>
          <text
            x={T - 12}
            y={T / 2}
            textAnchor="middle"
            fontSize={11}
            fill="var(--pqc-muted)"
            transform={`rotate(90 ${T - 12} ${T / 2})`}
          >
            Libéralisme économique
          </text>

          {candidates.map((candidate) => {
            const x = toX(candidate.eco)
            const y = toY(candidate.soc)
            const leftAligned = x > MARGIN + PLOT * 0.72
            return (
              <g key={candidate.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="var(--pqc-series-1)"
                  stroke="var(--pqc-surface)"
                  strokeWidth={2}
                  onMouseEnter={() =>
                    setBulle({
                      x: (x / T) * 100,
                      y: (y / T) * 100,
                      content: <strong>{candidate.label}</strong>,
                    })
                  }
                  onMouseLeave={() => setBulle(null)}
                />
                <text
                  x={leftAligned ? x - 9 : x + 9}
                  y={y}
                  textAnchor={leftAligned ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--pqc-ink-2)"
                >
                  {candidate.initials}
                </text>
              </g>
            )
          })}

          {user && (
            <g>
              <circle
                cx={toX(user.eco)}
                cy={toY(user.soc)}
                r={8}
                fill="var(--pqc-series-2)"
                stroke="var(--pqc-surface)"
                strokeWidth={2.5}
              />
              <text
                x={toX(user.eco)}
                y={toY(user.soc) - 15}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill="var(--pqc-ink)"
              >
                Vous
              </text>
            </g>
          )}
        </svg>
        {rendered}
      </div>
    </Figure>
  )
}
