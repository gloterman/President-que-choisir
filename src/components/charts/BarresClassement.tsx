import { Figure, type Tableau } from './primitives'
import { clsx } from '@/lib/format'

export interface BarreDonnee {
  id: string
  label: string
  /** Valeur affichée, sur l'échelle 0–`max`. */
  valeur: number
  /** Texte affiché au bout de la barre. À défaut, la valeur arrondie. */
  valeurAffichee?: string
  /** Second niveau d'information, sous le libellé. */
  detail?: string
  /** Met la barre en avant (le résultat de l'utilisateur, par exemple). */
  saillant?: boolean
}

/**
 * Barres horizontales classées — une seule série, donc une seule couleur et
 * pas de boîte de légende : le titre dit ce qui est mesuré. Les valeurs sont
 * étiquetées au bout de chaque barre, hors de la barre, ce qui évite tout
 * risque de rognage.
 */
export function BarresClassement({
  titre,
  soustitre,
  donnees,
  max = 100,
  unite = '',
  note,
  enteteValeur = 'Valeur',
  onSelection,
}: {
  titre: string
  soustitre?: string
  donnees: BarreDonnee[]
  max?: number
  unite?: string
  note?: string
  enteteValeur?: string
  onSelection?: (id: string) => void
}) {
  const tableau: Tableau = {
    entetes: ['Candidat', enteteValeur],
    lignes: donnees.map((d) => [d.label, d.valeurAffichee ?? Math.round(d.valeur)]),
    legende: titre,
  }

  return (
    <Figure titre={titre} soustitre={soustitre} note={note} tableau={tableau}>
      <ol className="space-y-2.5">
        {donnees.map((donnee, index) => {
          const largeur = Math.max(0, Math.min(100, (donnee.valeur / max) * 100))
          const Contenu = onSelection ? 'button' : 'div'
          return (
            <li key={donnee.id}>
              <Contenu
                {...(onSelection
                  ? { type: 'button' as const, onClick: () => onSelection(donnee.id) }
                  : {})}
                className={clsx(
                  'block w-full text-left',
                  onSelection && 'cursor-pointer rounded-lg focus-visible:outline-2',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="tabular w-5 shrink-0 text-[0.75rem] text-muted">
                      {index + 1}
                    </span>
                    <span className="truncate text-[0.85rem] font-medium text-ink">
                      {donnee.label}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-[0.82rem] font-semibold text-ink">
                    {donnee.valeurAffichee ?? Math.round(donnee.valeur)}
                    {unite}
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
                        width: `${largeur}%`,
                        background: donnee.saillant
                          ? 'var(--pqc-series-2)'
                          : 'var(--pqc-series-1)',
                      }}
                    />
                  </div>
                </div>
                {donnee.detail && (
                  <p className="mt-1 ml-7 text-[0.74rem] leading-snug text-muted">{donnee.detail}</p>
                )}
              </Contenu>
            </li>
          )
        })}
      </ol>
    </Figure>
  )
}
