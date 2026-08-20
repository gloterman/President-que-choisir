import type { ReactNode } from 'react'
import { clsx } from '@/lib/format'

/** Curseur de pondération, avec libellé et valeur lisible. */
export function Curseur({
  id,
  label,
  valeur,
  min = 0,
  max = 5,
  pas = 1,
  onChange,
  valeurAffichee,
  aide,
}: {
  id: string
  label: ReactNode
  valeur: number
  min?: number
  max?: number
  pas?: number
  onChange: (v: number) => void
  valeurAffichee?: string
  aide?: string
}) {
  const remplissage = ((valeur - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-ink">
          {label}
        </label>
        <span className="tabular text-[0.78rem] font-semibold text-ink-2">
          {valeurAffichee ?? valeur}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="pqc-range mt-1"
        min={min}
        max={max}
        step={pas}
        value={valeur}
        aria-describedby={aide ? `${id}-aide` : undefined}
        style={{
          ['--pqc-track' as string]: `linear-gradient(to right, var(--pqc-accent) ${remplissage}%, var(--pqc-surface-3) ${remplissage}%)`,
        }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {aide && (
        <p id={`${id}-aide`} className="text-[0.75rem] leading-snug text-muted">
          {aide}
        </p>
      )}
    </div>
  )
}

export interface OptionSegment<T extends string | number> {
  valeur: T
  label: ReactNode
  titre?: string
}

/**
 * Groupe de boutons radio stylés en segments. Rendu en `radiogroup` pour rester
 * navigable au clavier et annoncé correctement par les lecteurs d'écran.
 */
export function GroupeSegmente<T extends string | number>({
  nom,
  legende,
  options,
  valeur,
  onChange,
  colonnes,
  taille = 'normale',
}: {
  nom: string
  legende: string
  options: OptionSegment<T>[]
  valeur: T | undefined
  onChange: (v: T) => void
  colonnes?: string
  taille?: 'normale' | 'petite'
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legende}</legend>
      <div
        className={clsx('grid gap-1.5', colonnes ?? `grid-cols-${Math.min(options.length, 5)}`)}
        style={colonnes ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const actif = valeur === option.valeur
          return (
            <label
              key={String(option.valeur)}
              title={option.titre}
              className={clsx(
                'flex cursor-pointer items-center justify-center rounded-lg border text-center font-medium transition-colors',
                taille === 'petite' ? 'px-2 py-1.5 text-[0.75rem]' : 'px-2 py-2 text-[0.8rem]',
                actif
                  ? 'border-accent bg-accent-soft text-ink shadow-[inset_0_0_0_1px_var(--pqc-accent)]'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
              )}
            >
              <input
                type="radio"
                name={nom}
                className="sr-only"
                checked={actif}
                onChange={() => onChange(option.valeur)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Interrupteur({
  id,
  label,
  actif,
  onChange,
  aide,
}: {
  id: string
  label: ReactNode
  actif: boolean
  onChange: (v: boolean) => void
  aide?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-ink">
          {label}
        </label>
        {aide && <p className="mt-0.5 text-[0.75rem] leading-snug text-muted">{aide}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={clsx(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
          actif ? 'border-accent bg-accent' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-surface shadow transition-[left]',
            actif ? 'left-[1.4rem]' : 'left-0.5',
          )}
          style={{ height: '1.1rem', width: '1.1rem' }}
        />
      </button>
    </div>
  )
}
