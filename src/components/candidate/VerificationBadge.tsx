import { Badge } from '@/components/ui/base'
import { CONFIDENCE, VERIFICATION } from '@/lib/format'
import type { Confidence, Verification } from '@/data/types'

export function VerificationBadge({ verification }: { verification: Verification }) {
  const meta = VERIFICATION[verification]
  return (
    <Badge tone={meta.tone} icon={meta.icon} title={meta.explanation}>
      {meta.label}
    </Badge>
  )
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const meta = CONFIDENCE[confidence]
  return (
    <Badge tone="neutre" title={meta.explanation}>
      {meta.label}
    </Badge>
  )
}
