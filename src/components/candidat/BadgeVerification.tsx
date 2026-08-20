import { Badge } from '@/components/ui/base'
import { CONFIANCE, VERIFICATION } from '@/lib/format'
import type { Confiance, Verification } from '@/data/types'

export function BadgeVerification({ verification }: { verification: Verification }) {
  const meta = VERIFICATION[verification]
  return (
    <Badge ton={meta.ton} icone={meta.icone} titre={meta.explication}>
      {meta.label}
    </Badge>
  )
}

export function BadgeConfiance({ confiance }: { confiance: Confiance }) {
  const meta = CONFIANCE[confiance]
  return (
    <Badge ton="neutre" titre={meta.explication}>
      {meta.label}
    </Badge>
  )
}
