import { Badge, Notice } from '@/components/ui/base'
import { VerificationBadge } from './BadgeVerification'
import { formatDate, LEGAL_STATUS } from '@/lib/format'
import type { LegalCase } from '@/data/types'

/**
 * Volet judiciaire.
 *
 * Trois précautions sont câblées ici plutôt que laissées à la rédaction :
 * l'état procédural est toujours nommé explicitement, il porte une icône en
 * plus de sa couleur, et le rappel de la présomption d'innocence accompagne
 * toute affaire non définitivement jugée.
 */
export function LegalBlock({ legalCases }: { legalCases: LegalCase[] }) {
  if (legalCases.length === 0) {
    return (
      <Notice title="Aucune affaire judiciaire renseignée" tone="neutre" icon="·">
        Cela signifie qu’aucun élément n’a été saisi dans cette base, et non qu’il est établi qu’il
        n’en existe pas. Voir la page Sources pour l’état d’avancement des vérifications.
      </Notice>
    )
  }

  const inProgress = legalCases.some(
    (a) =>
      a.status === 'condamnation-non-definitive' ||
      a.status === 'mise-en-examen' ||
      a.status === 'enquete',
  )

  return (
    <div className="space-y-3">
      {legalCases.map((legalCase) => {
        const meta = LEGAL_STATUS[legalCase.status]
        return (
          <article key={legalCase.id} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone} icon={meta.icon} title={meta.explanation}>
                {meta.label}
              </Badge>
              <VerificationBadge verification={legalCase.verification} />
              {legalCase.decisionDate && (
                <span className="text-[0.75rem] text-muted">{formatDate(legalCase.decisionDate)}</span>
              )}
            </div>
            <h4 className="mt-2.5 text-[0.9rem] font-semibold text-ink">{legalCase.label}</h4>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-ink-2">{legalCase.summary}</p>
            <dl className="mt-3 grid gap-2 text-[0.8rem] sm:grid-cols-2">
              {legalCase.charge && (
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Qualification
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{legalCase.charge}</dd>
                </div>
              )}
              {legalCase.short && (
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Juridiction
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{legalCase.short}</dd>
                </div>
              )}
              {legalCase.sentence && (
                <div className="sm:col-span-2">
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Décision
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{legalCase.sentence}</dd>
                </div>
              )}
              {legalCase.appeal && (
                <div className="sm:col-span-2">
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Voies de recours
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{legalCase.appeal}</dd>
                </div>
              )}
            </dl>
            <p className="mt-3 border-t border-line pt-2 text-[0.72rem] leading-snug text-muted">
              {meta.explanation}
            </p>
          </article>
        )
      })}

      {inProgress && (
        <Notice title="Présomption d’innocence" tone="neutre" icon="§">
          Une mise en examen, une enquête ou une condamnation frappée d’appel n’établit pas la
          culpabilité. Tant que les voies de recours ne sont pas épuisées, la personne est présumée
          innocente.
        </Notice>
      )}
    </div>
  )
}
