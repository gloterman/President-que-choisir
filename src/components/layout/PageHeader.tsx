import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  summary,
  actions,
}: {
  eyebrow?: string
  title: string
  summary?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-accent">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-2xl text-[1.7rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.1rem]">
          {title}
        </h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {summary && <div className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-2">{summary}</div>}
    </div>
  )
}
