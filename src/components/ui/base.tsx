import type { ReactNode } from 'react'
import { clsx, type Ton } from '@/lib/format'

const TONS: Record<Ton, string> = {
  neutre: 'bg-surface-2 text-ink-2 border-line',
  accent: 'bg-accent-soft text-ink border-accent-border',
  good: 'bg-good-soft text-ink border-good/40',
  warning: 'bg-warning-soft text-ink border-warning/50',
  serious: 'bg-serious-soft text-ink border-serious/50',
  critical: 'bg-critical-soft text-ink border-critical/50',
}

export function Carte({
  children,
  className,
  as: Composant = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <Composant
      className={clsx(
        'rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      {children}
    </Composant>
  )
}

export function EnteteCarte({
  titre,
  soustitre,
  action,
  niveau = 2,
}: {
  titre: ReactNode
  soustitre?: ReactNode
  action?: ReactNode
  niveau?: 2 | 3 | 4
}) {
  const Titre = `h${niveau}` as 'h2'
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <div className="min-w-0">
        <Titre className="text-[0.95rem] font-semibold tracking-tight text-ink">{titre}</Titre>
        {soustitre && <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">{soustitre}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/**
 * Une pastille de statut porte toujours une icône et un libellé : la couleur
 * ne suffit jamais à véhiculer l'information.
 */
export function Badge({
  children,
  ton = 'neutre',
  icone,
  titre,
  className,
}: {
  children: ReactNode
  ton?: Ton
  icone?: string
  titre?: string
  className?: string
}) {
  return (
    <span
      title={titre}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-medium leading-5 whitespace-nowrap',
        TONS[ton],
        className,
      )}
    >
      {icone && (
        <span aria-hidden="true" className="text-[0.7em] leading-none">
          {icone}
        </span>
      )}
      {children}
    </span>
  )
}

export function Bouton({
  children,
  variante = 'secondaire',
  taille = 'normale',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: 'primaire' | 'secondaire' | 'discret' | 'danger'
  taille?: 'normale' | 'petite'
}) {
  const variantes = {
    primaire: 'bg-accent text-[var(--pqc-accent-ink)] border-accent hover:opacity-90',
    secondaire: 'bg-surface text-ink border-line-strong hover:bg-surface-2',
    discret: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-2 hover:text-ink',
    danger: 'bg-surface text-ink border-critical/50 hover:bg-critical-soft',
  }
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        taille === 'petite' ? 'px-2.5 py-1.5 text-[0.78rem]' : 'px-3.5 py-2 text-[0.85rem]',
        variantes[variante],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Alerte({
  titre,
  children,
  ton = 'warning',
  icone = '!',
}: {
  titre: ReactNode
  children?: ReactNode
  ton?: Ton
  icone?: string
}) {
  return (
    <div className={clsx('rounded-xl border px-4 py-3', TONS[ton])}>
      <p className="flex items-start gap-2 text-[0.85rem] font-semibold text-ink">
        <span aria-hidden="true" className="mt-px shrink-0">
          {icone}
        </span>
        <span>{titre}</span>
      </p>
      {children && <div className="mt-1.5 pl-5 text-[0.82rem] leading-relaxed text-ink-2">{children}</div>}
    </div>
  )
}

/** Bloc dépliant, utilisé partout pour « pourquoi cette note ? ». */
export function Depliant({
  resume,
  children,
  className,
  ouvertParDefaut = false,
}: {
  resume: ReactNode
  children: ReactNode
  className?: string
  ouvertParDefaut?: boolean
}) {
  return (
    <details className={clsx('group', className)} open={ouvertParDefaut}>
      <summary className="cursor-pointer list-none text-[0.8rem] font-medium text-accent marker:content-none hover:underline">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="transition-transform group-open:rotate-90">
            ›
          </span>
          {resume}
        </span>
      </summary>
      <div className="mt-2 text-[0.82rem] leading-relaxed text-ink-2">{children}</div>
    </details>
  )
}

export function Etiquette({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted">{children}</p>
  )
}

export function ValeurCle({
  valeur,
  label,
  precision,
}: {
  valeur: ReactNode
  label: string
  precision?: string
}) {
  return (
    <div>
      <p className="text-[0.75rem] leading-tight text-ink-2">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-ink">{valeur}</p>
      {precision && <p className="mt-1 text-[0.72rem] leading-tight text-muted">{precision}</p>}
    </div>
  )
}
