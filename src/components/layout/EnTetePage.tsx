import type { ReactNode } from 'react'

export function EnTetePage({
  surtitre,
  titre,
  chapo,
  actions,
}: {
  surtitre?: string
  titre: string
  chapo?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-8">
      {surtitre && (
        <p className="mb-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-accent">
          {surtitre}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-2xl text-[1.7rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.1rem]">
          {titre}
        </h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {chapo && <div className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-ink-2">{chapo}</div>}
    </div>
  )
}
