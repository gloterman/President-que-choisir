import { Figure, couleurSerie, type EntreeLegende, type Tableau } from './primitives'

export interface GroupeBarres {
  /** Libellé de la catégorie, en abscisse. */
  categorie: string
  /** Une valeur 0–100 par série, ou `null` si non applicable. */
  valeurs: (number | null)[]
}

/**
 * Barres groupées, trois séries au maximum.
 *
 * Les barres voisines sont séparées par un vide de 2 pixels dans la couleur de
 * la surface — jamais par un contour, qui ajouterait de l'encre sans ajouter
 * d'information.
 */
export function BarresGroupees({
  titre,
  soustitre,
  series,
  groupes,
  note,
  unite = ' %',
}: {
  titre: string
  soustitre?: string
  series: { id: string; label: string }[]
  groupes: GroupeBarres[]
  note?: string
  unite?: string
}) {
  const legende: EntreeLegende[] = series.map((serie, i) => ({
    label: serie.label,
    couleur: couleurSerie(i),
  }))

  const tableau: Tableau = {
    entetes: ['Thème', ...series.map((s) => s.label)],
    lignes: groupes.map((g) => [
      g.categorie,
      ...g.valeurs.map((v) => (v === null ? 'non exprimé' : Math.round(v))),
    ]),
    legende: titre,
  }

  return (
    <Figure
      titre={titre}
      soustitre={soustitre}
      legende={series.length >= 2 ? legende : undefined}
      tableau={tableau}
      note={note}
    >
      <ul className="space-y-3.5">
        {groupes.map((groupe) => (
          <li key={groupe.categorie}>
            <p className="text-[0.8rem] font-medium text-ink">{groupe.categorie}</p>
            <div className="mt-1.5 space-y-[2px]">
              {groupe.valeurs.map((valeur, i) => (
                <div key={series[i]?.id ?? i} className="flex items-center gap-2">
                  <div
                    className="h-3 min-w-0 flex-1 overflow-hidden rounded-r-[4px]"
                    style={{ background: 'var(--pqc-surface-3)' }}
                  >
                    {valeur !== null && (
                      <div
                        className="h-full rounded-r-[4px]"
                        style={{
                          width: `${Math.max(0, Math.min(100, valeur))}%`,
                          background: couleurSerie(i),
                        }}
                      />
                    )}
                  </div>
                  <span className="tabular w-16 shrink-0 text-right text-[0.75rem] text-ink-2">
                    {valeur === null ? '—' : `${Math.round(valeur)}${unite}`}
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
