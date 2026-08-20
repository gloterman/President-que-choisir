import { Badge, Alerte } from '@/components/ui/base'
import { BadgeVerification } from './BadgeVerification'
import { formatDate, STATUT_JUDICIAIRE } from '@/lib/format'
import type { AffaireJudiciaire } from '@/data/types'

/**
 * Volet judiciaire.
 *
 * Trois précautions sont câblées ici plutôt que laissées à la rédaction :
 * l'état procédural est toujours nommé explicitement, il porte une icône en
 * plus de sa couleur, et le rappel de la présomption d'innocence accompagne
 * toute affaire non définitivement jugée.
 */
export function BlocJudiciaire({ affaires }: { affaires: AffaireJudiciaire[] }) {
  if (affaires.length === 0) {
    return (
      <Alerte titre="Aucune affaire judiciaire renseignée" ton="neutre" icone="·">
        Cela signifie qu’aucun élément n’a été saisi dans cette base, et non qu’il est établi qu’il
        n’en existe pas. Voir la page Sources pour l’état d’avancement des vérifications.
      </Alerte>
    )
  }

  const enCours = affaires.some(
    (a) =>
      a.statut === 'condamnation-non-definitive' ||
      a.statut === 'mise-en-examen' ||
      a.statut === 'enquete',
  )

  return (
    <div className="space-y-3">
      {affaires.map((affaire) => {
        const meta = STATUT_JUDICIAIRE[affaire.statut]
        return (
          <article key={affaire.id} className="rounded-xl border border-line bg-surface-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge ton={meta.ton} icone={meta.icone} titre={meta.explication}>
                {meta.label}
              </Badge>
              <BadgeVerification verification={affaire.verification} />
              {affaire.dateDecision && (
                <span className="text-[0.75rem] text-muted">{formatDate(affaire.dateDecision)}</span>
              )}
            </div>
            <h4 className="mt-2.5 text-[0.9rem] font-semibold text-ink">{affaire.intitule}</h4>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-ink-2">{affaire.resume}</p>
            <dl className="mt-3 grid gap-2 text-[0.8rem] sm:grid-cols-2">
              {affaire.qualification && (
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Qualification
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{affaire.qualification}</dd>
                </div>
              )}
              {affaire.juridiction && (
                <div>
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Juridiction
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{affaire.juridiction}</dd>
                </div>
              )}
              {affaire.peine && (
                <div className="sm:col-span-2">
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Décision
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{affaire.peine}</dd>
                </div>
              )}
              {affaire.recours && (
                <div className="sm:col-span-2">
                  <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    Voies de recours
                  </dt>
                  <dd className="mt-0.5 leading-snug text-ink-2">{affaire.recours}</dd>
                </div>
              )}
            </dl>
            <p className="mt-3 border-t border-line pt-2 text-[0.72rem] leading-snug text-muted">
              {meta.explication}
            </p>
          </article>
        )
      })}

      {enCours && (
        <Alerte titre="Présomption d’innocence" ton="neutre" icone="§">
          Une mise en examen, une enquête ou une condamnation frappée d’appel n’établit pas la
          culpabilité. Tant que les voies de recours ne sont pas épuisées, la personne est présumée
          innocente.
        </Alerte>
      )}
    </div>
  )
}
