import { clsx } from '@/lib/format'

/**
 * Jauge de note.
 *
 * Le remplissage porte la valeur, la piste est une marche claire de la même
 * rampe : l'état se lit sur toute la longueur de la barre, pas seulement sur
 * la partie remplie. Volontairement monochrome : colorer une note de candidat
 * en rouge ou en vert reviendrait à porter un jugement que le barème, lui, ne
 * porte pas.
 */
export function Gauge({
  value,
  label,
  tier,
  compact = false,
  softened = false,
}: {
  value: number
  label?: string
  tier?: string
  compact?: boolean
  /** Rend la jauge grisée : note manquante, remplacée par la valeur neutre. */
  softened?: boolean
}) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div className={clsx(softened && 'opacity-60')}>
      {(label || tier) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && <span className="text-[0.82rem] font-medium text-ink">{label}</span>}
          <span className="tabular shrink-0 text-[0.8rem] font-semibold text-ink">
            {Math.round(value)}
            <span className="text-[0.72rem] font-normal text-muted">/100</span>
          </span>
        </div>
      )}
      <div
        className={clsx('mt-1 overflow-hidden rounded-full', compact ? 'h-1.5' : 'h-2')}
        style={{ background: softened ? 'var(--pqc-surface-3)' : 'var(--pqc-seq-100)' }}
        role="meter"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Note sur 100'}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            background: softened ? 'var(--pqc-muted)' : 'var(--pqc-seq-400)',
          }}
        />
      </div>
      {tier && <p className="mt-1 text-[0.72rem] leading-snug text-muted">{tier}</p>}
    </div>
  )
}
