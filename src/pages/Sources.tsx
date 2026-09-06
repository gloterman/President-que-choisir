import { useMemo } from 'react'
import { PageHeader } from '@/components/layout/EnTetePage'
import { Notice, Badge, Card, CardHeader } from '@/components/ui/base'
import { RankingBars } from '@/components/charts/BarresClassement'
import { VerificationBadge } from '@/components/candidat/BadgeVerification'
import { candidates } from '@/data/candidats'
import { sources } from '@/data/sources'
import { percent, VERIFICATION } from '@/lib/format'
import type { SourceType, Verification } from '@/data/types'

const TYPES: Record<SourceType, string> = {
  officiel: 'Source officielle',
  institution: 'Institution',
  presse: 'Presse et vérification factuelle',
  programme: 'Programme du candidat',
  ong: 'Association et société civile',
  universitaire: 'Recherche',
}

export function Sources() {
  const report = useMemo(() => {
    const byCandidate = candidates.map((candidate) => {
      const elements = [
        ...candidate.measures,
        ...candidate.facts,
        ...candidate.legal,
        ...candidate.indicators,
      ]
      // On compte ensemble le vérifié et le recoupé : les deux sortent de la
      // simple saisie, ce qui est la distinction utile à afficher ici.
      const verified = elements.filter(
        (e) => e.verification === 'verifie' || e.verification === 'recoupe',
      ).length
      return {
        candidate,
        total: elements.length,
        verified,
        share: elements.length > 0 ? (verified / elements.length) * 100 : 0,
      }
    })

    const all = candidates.flatMap((c) => [
      ...c.measures,
      ...c.facts,
      ...c.legal,
      ...c.indicators,
    ])
    const byStatus = (['verifie', 'recoupe', 'a-verifier', 'estimation'] as Verification[]).map((status) => ({
      status,
      nombre: all.filter((e) => e.verification === status).length,
    }))

    return { byCandidate, byStatus, total: all.length }
  }, [])

  const byType = useMemo(
    () =>
      (Object.keys(TYPES) as SourceType[])
        .map((type) => ({ type, sources: sources.filter((s) => s.type === type) }))
        .filter((group) => group.sources.length > 0),
    [],
  )

  return (
    <div>
      <PageHeader
        title="Sources et état de vérification"
        summary={
          <>
            Cette page dit exactement ce que vaut le jeu de données à ce jour. Elle est volontairement
            placée au même niveau que les résultats : une note ne vaut que ce que vaut la donnée
            qu’elle résume.
          </>
        }
      />

      <div className="mb-6">
        <Notice title="Le jeu de données n’est pas encore consolidé">
          Les décisions de justice ont été recoupées sur plusieurs sources indépendantes et
          concordantes, et la référence de la décision est indiquée à chaque fois — mais ces
          documents n’ont pas été ouverts un à un, ce qui est la dernière étape de la procédure.
          Les positions programmatiques restent des synthèses éditoriales. Concrètement : les
          barèmes et les calculs sont opérationnels, le volet judiciaire est solide, les positions
          sont discutables par construction.
        </Notice>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[0.95rem] font-semibold tracking-tight text-ink">
            Répartition des {report.total} éléments factuels
          </h2>
          <ul className="mt-4 space-y-3">
            {report.byStatus.map(({ status, nombre }) => {
              const meta = VERIFICATION[status]
              return (
                <li key={status}>
                  <div className="flex items-center justify-between gap-3">
                    <VerificationBadge verification={status} />
                    <span className="tabular text-[0.85rem] font-semibold text-ink">
                      {nombre}{' '}
                      <span className="text-[0.75rem] font-normal text-muted">
                        ({percent(report.total > 0 ? (nombre / report.total) * 100 : 0)})
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-[0.76rem] leading-snug text-muted">{meta.explanation}</p>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <RankingBars
            title="Éléments recoupés sur source primaire"
            subtitle="Part des faits, mesures, décisions et indicateurs sortis de la simple saisie — recoupés ou lus sur source primaire — par fiche."
            data={report.byCandidate.map((row) => ({
              id: row.candidate.id,
              label: `${row.candidate.firstName} ${row.candidate.lastName}`,
              value: row.share,
              displayValue: `${row.verified}/${row.total}`,
            }))}
            valueHeader="Vérifiés"
            rating="Cet indicateur est la mesure la plus honnête de la maturité de l’outil. Tant qu’il est bas, les notes sont des démonstrations de méthode."
          />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Registre des sources"
          subtitle="Portails et rubriques référencés. Le lien profond vers la décision ou la déclaration précise est ajouté au moment de la vérification de chaque fait."
        />
        <div className="divide-y divide-[color:var(--pqc-line)]">
          {byType.map((group) => (
            <section key={group.type} className="p-4 sm:p-5">
              <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-muted">
                {TYPES[group.type]}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {group.sources.map((source) => (
                  <li key={source.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[0.87rem] font-medium text-ink">{source.publisher}</span>
                    <span className="text-[0.82rem] text-ink-2">— {source.title}</span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.78rem] text-accent hover:underline"
                      >
                        consulter ↗
                      </a>
                    ) : (
                      <Badge tone="neutre">à renseigner par candidat</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Comment un fait passe de « à vérifier » à « vérifié »"
          subtitle="La procédure appliquée, en quatre temps."
        />
        <ol className="divide-y divide-[color:var(--pqc-line)]">
          {[
            {
              title: 'Retrouver la source primaire',
              text:
                "Décision de justice sur Légifrance ou sur le site de la juridiction, déclaration sur le site de la HATVP, nomination au Journal officiel, scrutin sur le site de l’assemblée concernée. Un article de presse relatant un fait n’est pas une source primaire : c’est un point de départ.",
            },
            {
              title: 'Vérifier la qualification exacte',
              text:
                "Le chef retenu, la juridiction, la date, la peine, l’état des voies de recours. C’est là que se joue la différence entre « mis en examen », « condamné en première instance » et « condamné définitivement ».",
            },
            {
              title: 'Recouper avec une seconde source indépendante',
              text:
                "Deux rédactions distinctes, ou une rédaction et un document officiel. Un fait relayé par dix médias reprenant la même dépêche compte pour une source.",
            },
            {
              title: 'Consigner le lien et basculer le statut',
              text:
                "Le lien profond est ajouté au registre des sources, l’élément passe au statut « vérifié » et la date de revue de la fiche est mise à jour. Un fait qui ne franchit pas ces quatre étapes reste affiché avec sa mention « à vérifier », ou est retiré.",
            },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4 p-4 sm:p-5">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-[0.8rem] font-bold text-ink"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-2">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
