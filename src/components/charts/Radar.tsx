import { Figure, couleurSerie, useInfobulle, type EntreeLegende, type Tableau } from './primitives'

export interface SerieRadar {
  id: string
  label: string
  /** Une valeur 0–100 par axe, dans l'ordre de `axes`. */
  valeurs: number[]
}

const TAILLE = 420
const HAUTEUR = 380
const CX = 210
const CY = 182
const R = 112

const point = (angle: number, rayon: number) => ({
  x: CX + Math.cos(angle) * rayon,
  y: CY + Math.sin(angle) * rayon,
})

/**
 * Profil multicritère superposé, trois séries au maximum.
 *
 * Les sommets se croisent : deux séries quelconques peuvent devenir voisines,
 * ce qui impose de valider la palette sur toutes les paires — et donc de
 * s'arrêter à trois. Au-delà, on lit la vue tableau, exposée sous la figure.
 */
export function Radar({
  titre,
  soustitre,
  axes,
  series,
  note,
}: {
  titre: string
  soustitre?: string
  axes: string[]
  series: SerieRadar[]
  note?: string
}) {
  const { setBulle, rendu } = useInfobulle()
  const n = axes.length
  if (n < 3) return null

  // On démarre à midi et on tourne dans le sens horaire.
  const angleDe = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2
  const niveaux = [25, 50, 75, 100]

  const legende: EntreeLegende[] = series.map((serie, i) => ({
    label: serie.label,
    couleur: couleurSerie(i),
    forme: 'ligne',
  }))

  const tableau: Tableau = {
    entetes: ['Critère', ...series.map((s) => s.label)],
    lignes: axes.map((axe, i) => [axe, ...series.map((s) => Math.round(s.valeurs[i] ?? 0))]),
    legende: titre,
  }

  return (
    <Figure
      titre={titre}
      soustitre={soustitre}
      legende={legende}
      tableau={tableau}
      note={note}
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${TAILLE} ${HAUTEUR}`}
          className="h-auto w-full"
          role="img"
          aria-label={`${titre}. ${series.map((s) => s.label).join(', ')}. Détail dans le tableau sous la figure.`}
        >
          {/* Grille : traits pleins, une marche au-dessus de la surface. */}
          {niveaux.map((niveau) => (
            <polygon
              key={niveau}
              points={axes
                .map((_, i) => {
                  const p = point(angleDe(i), (niveau / 100) * R)
                  return `${p.x},${p.y}`
                })
                .join(' ')}
              fill="none"
              stroke="var(--pqc-grid)"
              strokeWidth={1}
            />
          ))}
          {axes.map((_, i) => {
            const p = point(angleDe(i), R)
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

          {series.map((serie, indexSerie) => {
            const couleur = couleurSerie(indexSerie)
            const sommets = axes.map((_, i) =>
              point(angleDe(i), (Math.max(0, Math.min(100, serie.valeurs[i] ?? 0)) / 100) * R),
            )
            return (
              <g key={serie.id}>
                <polygon
                  points={sommets.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill={couleur}
                  fillOpacity={0.1}
                  stroke={couleur}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {sommets.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={couleur}
                    stroke="var(--pqc-surface)"
                    strokeWidth={2}
                    onMouseEnter={() =>
                      setBulle({
                        x: (p.x / TAILLE) * 100,
                        y: (p.y / HAUTEUR) * 100,
                        contenu: (
                          <>
                            <strong>{serie.label}</strong> — {axes[i]} :{' '}
                            {Math.round(serie.valeurs[i] ?? 0)}/100
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
          {axes.map((axe, i) => {
            const angle = angleDe(i)
            const p = point(angle, R + 20)
            const cos = Math.cos(angle)
            const ancrage = cos > 0.25 ? 'start' : cos < -0.25 ? 'end' : 'middle'
            return (
              <text
                key={axe}
                x={p.x}
                y={p.y}
                textAnchor={ancrage}
                dominantBaseline="middle"
                fontSize={11}
                fill="var(--pqc-muted)"
              >
                {axe}
              </text>
            )
          })}
        </svg>
        {rendu}
      </div>
    </Figure>
  )
}
