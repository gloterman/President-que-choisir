import type { ReactNode } from 'react'
import { clsx } from '@/lib/format'

/** Curseur de pondération, avec libellé et valeur lisible. */
export function Slider({
  id,
  label,
  value,
  min = 0,
  max = 5,
  step = 1,
  onChange,
  displayValue,
  help,
}: {
  id: string
  label: ReactNode
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  displayValue?: string
  help?: string
}) {
  const fill = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-ink">
          {label}
        </label>
        <span className="tabular text-[0.78rem] font-semibold text-ink-2">
          {displayValue ?? value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="pqc-range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={help ? `${id}-aide` : undefined}
        style={{
          ['--pqc-track' as string]: `linear-gradient(to right, var(--pqc-accent) ${fill}%, var(--pqc-surface-3) ${fill}%)`,
        }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {help && (
        <p id={`${id}-aide`} className="text-[0.75rem] leading-snug text-muted">
          {help}
        </p>
      )}
    </div>
  )
}

export interface SegmentOption<T extends string | number> {
  value: T
  label: ReactNode
  title?: string
}

/**
 * Groupe de boutons radio stylés en segments. Rendu en `radiogroup` pour rester
 * navigable au clavier et annoncé correctement par les lecteurs d'écran.
 */
export function SegmentedGroup<T extends string | number>({
  lastName,
  legend,
  options,
  value,
  onChange,
  columns,
  size = 'normale',
}: {
  lastName: string
  legend: string
  options: SegmentOption<T>[]
  value: T | undefined
  onChange: (v: T) => void
  columns?: string
  size?: 'normale' | 'petite'
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div
        className={clsx('grid gap-1.5', columns ?? `grid-cols-${Math.min(options.length, 5)}`)}
        style={columns ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => {
          const isActive = value === option.value
          return (
            <label
              key={String(option.value)}
              title={option.title}
              className={clsx(
                'flex cursor-pointer items-center justify-center rounded-lg border text-center font-medium transition-colors',
                size === 'petite' ? 'px-2 py-1.5 text-[0.75rem]' : 'px-2 py-2 text-[0.8rem]',
                isActive
                  ? 'border-accent bg-accent-soft text-ink shadow-[inset_0_0_0_1px_var(--pqc-accent)]'
                  : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
              )}
            >
              <input
                type="radio"
                name={lastName}
                className="sr-only"
                checked={isActive}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function Toggle({
  id,
  label,
  isActive,
  onChange,
  help,
}: {
  id: string
  label: ReactNode
  isActive: boolean
  onChange: (v: boolean) => void
  help?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-ink">
          {label}
        </label>
        {help && <p className="mt-0.5 text-[0.75rem] leading-snug text-muted">{help}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isActive}
        onClick={() => onChange(!isActive)}
        className={clsx(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
          isActive ? 'border-accent bg-accent' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-4.5 w-4.5 rounded-full bg-surface shadow transition-[left]',
            isActive ? 'left-[1.4rem]' : 'left-0.5',
          )}
          style={{ height: '1.1rem', width: '1.1rem' }}
        />
      </button>
    </div>
  )
}
