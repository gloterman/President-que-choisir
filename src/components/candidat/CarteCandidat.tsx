import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card } from '@/components/ui/base'
import { Chip } from './Pastille'
import { Gauge } from '@/components/charts/Jauge'
import { CANDIDACY_STATUSES } from '@/data/candidats'
import { clsx, percent, LEGAL_STATUS } from '@/lib/format'
import type { Candidate, LegalStatus } from '@/data/types'

/** Du plus grave au moins grave : la pastille annonce l'état le plus lourd de la fiche. */
const SEVERITY: LegalStatus[] = [
  'condamnation-definitive',
  'condamnation-appel-pourvoi',
  'condamnation-non-definitive',
  'mise-en-examen',
  'enquete',
  'prescription',
  'classement-sans-suite',
  'non-lieu',
  'relaxe',
]

function mostSevereStatus(candidate: Candidate): LegalStatus | null {
  return SEVERITY.find((status) => candidate.legal.some((a) => a.status === status)) ?? null
}

export function CandidateCard({
  candidate,
  affinity,
  rank,
  actions,
  className,
}: {
  candidate: Candidate
  affinity?: number
  rank?: number
  actions?: ReactNode
  className?: string
}) {
  const status = CANDIDACY_STATUSES[candidate.candidacyStatus]
  return (
    <Card as="article" className={clsx('flex flex-col p-4', className)}>
      <div className="flex items-start gap-3">
        <Chip candidate={candidate} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {rank !== undefined && (
              <span className="tabular text-[0.78rem] font-semibold text-muted">#{rank}</span>
            )}
            <h3 className="truncate text-[0.95rem] font-semibold tracking-tight text-ink">
              <Link to={`/candidats/${candidate.id}`} className="hover:underline">
                {candidate.firstName} {candidate.lastName}
              </Link>
            </h3>
          </div>
          <p className="mt-0.5 truncate text-[0.8rem] text-ink-2">{candidate.party}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge
          tone={candidate.candidacyStatus === 'declare' ? 'accent' : 'neutre'}
          title={status.summary}
        >
          {status.lastName}
        </Badge>
        {(() => {
          // Un simple compteur d'affaires met sur le même plan une relaxe et une
          // condamnation définitive. La pastille nomme donc l'état le plus lourd.
          const status = mostSevereStatus(candidate)
          if (!status) return null
          const meta = LEGAL_STATUS[status]
          return (
            <Badge tone={meta.tone} icon={meta.icon} title={meta.explanation}>
              {meta.label}
              {candidate.legal.length > 1 && ` · ${candidate.legal.length} affaires`}
            </Badge>
          )
        })()}
      </div>

      {affinity !== undefined && (
        <div className="mt-4">
          <Gauge value={affinity} label="Affinité avec vos réponses" compact />
          <p className="mt-1 text-[0.72rem] text-muted">{percent(affinity)} d’accord pondéré</p>
        </div>
      )}

      <p className="mt-3 line-clamp-3 text-[0.8rem] leading-relaxed text-ink-2">
        {candidate.summary}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Link
          to={`/candidats/${candidate.id}`}
          className="text-[0.8rem] font-medium text-accent hover:underline"
        >
          Voir la fiche →
        </Link>
        {actions}
      </div>
    </Card>
  )
}
