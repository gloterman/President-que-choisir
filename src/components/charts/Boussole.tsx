import { Figure, useInfobulle, type EntreeLegende, type Tableau } from './primitives'

export interface PointCandidat {
  id: string
  label: string
  initiales: string
  /** −1 à +1. */
  eco: number
  /** −1 à +1. */
  soc: number
}

const T = 400
const MARGE = 34
const PLOT = T - MARGE * 2

/**
 * Boussole politique en deux dimensions.
 *
 * L'identité n'est pas portée par la couleur : chaque point est étiqueté
 * directement par les initiales du candidat. Deux couleurs seulement
 * interviennent — les candidats d'une part, la position de l'utilisateur de
 * l'autre — ce qui laisse la lecture possible quelle que soit la vision des
 * couleurs, y compris avec onze points sur la même surface.
 */
export function Boussole({
  titre,
  soustitre,
  candidats,
  utilisateur,
  note,
}: {
  titre: string
  soustitre?: string
  candidats: PointCandidat[]
  utilisateur?: { eco: number; soc: number } | null
  note?: string
}) {
  const { setBulle, rendu } = useInfobulle()

  const enX = (eco: number) => MARGE + ((eco + 1) / 2) * PLOT
  // L'axe des ordonnées est inversé : le pôle conservateur est en haut.
  const enY = (soc: number) => MARGE + ((1 - soc) / 2) * PLOT

  const legende: EntreeLegende[] = [
    { label: 'Candidats', couleur: 'var(--pqc-series-1)', forme: 'point' },
    ...(utilisateur
      ? [{ label: 'Votre position', couleur: 'var(--pqc-series-2)', forme: 'point' as const }]
      : []),
  ]

  const tableau: Tableau = {
    entetes: ['Candidat', 'Axe économique', 'Axe culturel'],
    lignes: [
      ...candidats.map((c) => [c.label, c.eco.toFixed(2), c.soc.toFixed(2)]),
      ...(utilisateur ? [['Votre position', utilisateur.eco.toFixed(2), utilisateur.soc.toFixed(2)]] : []),
    ],
    legende: 'Coordonnées sur la boussole, de −1 à +1.',
  }

  return (
    <Figure titre={titre} soustitre={soustitre} legende={legende} tableau={tableau} note={note}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${T} ${T}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${titre}. Coordonnées détaillées dans le tableau sous la figure.`}
        >
          <rect
            x={MARGE}
            y={MARGE}
            width={PLOT}
            height={PLOT}
            fill="none"
            stroke="var(--pqc-grid)"
            strokeWidth={1}
          />
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <line
                x1={MARGE + f * PLOT}
                y1={MARGE}
                x2={MARGE + f * PLOT}
                y2={MARGE + PLOT}
                stroke="var(--pqc-grid)"
                strokeWidth={1}
              />
              <line
                x1={MARGE}
                y1={MARGE + f * PLOT}
                x2={MARGE + PLOT}
                y2={MARGE + f * PLOT}
                stroke="var(--pqc-grid)"
                strokeWidth={1}
              />
            </g>
          ))}
          {/* Axes centraux, un ton plus marqué que la grille. */}
          <line
            x1={MARGE + PLOT / 2}
            y1={MARGE}
            x2={MARGE + PLOT / 2}
            y2={MARGE + PLOT}
            stroke="var(--pqc-axis)"
            strokeWidth={1}
          />
          <line
            x1={MARGE}
            y1={MARGE + PLOT / 2}
            x2={MARGE + PLOT}
            y2={MARGE + PLOT / 2}
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

          {candidats.map((candidat) => {
            const x = enX(candidat.eco)
            const y = enY(candidat.soc)
            const aGauche = x > MARGE + PLOT * 0.72
            return (
              <g key={candidat.id}>
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
                      contenu: <strong>{candidat.label}</strong>,
                    })
                  }
                  onMouseLeave={() => setBulle(null)}
                />
                <text
                  x={aGauche ? x - 9 : x + 9}
                  y={y}
                  textAnchor={aGauche ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill="var(--pqc-ink-2)"
                >
                  {candidat.initiales}
                </text>
              </g>
            )
          })}

          {utilisateur && (
            <g>
              <circle
                cx={enX(utilisateur.eco)}
                cy={enY(utilisateur.soc)}
                r={8}
                fill="var(--pqc-series-2)"
                stroke="var(--pqc-surface)"
                strokeWidth={2.5}
              />
              <text
                x={enX(utilisateur.eco)}
                y={enY(utilisateur.soc) - 15}
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
        {rendu}
      </div>
    </Figure>
  )
}
