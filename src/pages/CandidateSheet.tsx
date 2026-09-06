import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Notice, Badge, Button, Card, Disclosure, CardHeader, KeyValue } from '@/components/ui/base'
import { Gauge } from '@/components/charts/Gauge'
import { Radar } from '@/components/charts/Radar'
import { DataBanner } from '@/components/DataBanner'
import { Chip } from '@/components/candidate/Chip'
import { ConfidenceBadge, VerificationBadge } from '@/components/candidate/VerificationBadge'
import { LegalBlock } from '@/components/candidate/LegalBlock'
import { candidateById, FAMILIES, CANDIDACY_STATUSES } from '@/data/candidates'
import { criteria, criteriaByFamily, criterionById } from '@/data/criteria'
import { axes, themeById, themes } from '@/data/questionnaire'
import { sourceById } from '@/data/sources'
import { computeAffinity } from '@/lib/scoring'
import { useFactCheck } from '@/lib/factcheck/store'
import {
  accuracyReport,
  MINIMUM_SAMPLE,
  dynamicAccuracyRatings,
} from '@/lib/factcheck/accuracy'
import { PLATFORMS, VERDICTS } from '@/data/factcheck'
import { usePreferences } from '@/lib/store'
import { age, formatDate, LIKERT, billions, tierOf, percent } from '@/lib/format'
import type { OfficialLink } from '@/data/types'

const LINK_GROUPS: { type: OfficialLink['type']; title: string; help: string }[] = [
  {
    type: 'candidat',
    title: 'Ce que dit le candidat',
    help: 'Sa parole, telle qu’il la publie lui-même.',
  },
  { type: 'parti', title: 'Son parti', help: 'Le programme et la ligne officielle du mouvement.' },
  {
    type: 'institution',
    title: 'Registres publics',
    help: 'Les portails officiels où vérifier ce qui est affirmé ici.',
  },
]

/**
 * Pages officielles.
 *
 * Placé délibérément en tête de colonne latérale : c'est le point de départ de
 * toute vérification, et le moyen le plus direct de sortir de cet outil pour
 * aller lire la source.
 */
function OfficialPages({ links }: { links: OfficialLink[] }) {
  return (
    <Card className="p-4">
      <p className="text-[0.85rem] font-semibold text-ink">Pages officielles</p>
      <p className="mt-1 text-[0.75rem] leading-snug text-ink-2">
        Pour vérifier par vous-même, sans passer par nous.
      </p>
      {LINK_GROUPS.map((group) => {
        const ofGroup = links.filter((l) => l.type === group.type)
        if (ofGroup.length === 0) return null
        return (
          <section key={group.type} className="mt-4">
            <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.06em] text-muted">
              {group.title}
            </h3>
            <ul className="mt-1.5 space-y-2">
              {ofGroup.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[0.82rem] font-medium leading-snug text-accent hover:underline"
                  >
                    {link.label} ↗
                  </a>
                  {link.usage && (
                    <p className="mt-0.5 text-[0.72rem] leading-snug text-muted">{link.usage}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <p className="mt-4 border-t border-line pt-3 text-[0.72rem] leading-snug text-muted">
        Les liens institutionnels pointent vers les annuaires officiels, pas vers une fiche
        nominative : relever l’identifiant exact d’une personne fait partie de la vérification, et
        une URL devinée vaut moins qu’un point d’entrée sûr.
      </p>
    </Card>
  )
}

function SourceList({ sourceIds }: { sourceIds: string[] }) {
  if (sourceIds.length === 0) return null
  return (
    <p className="mt-2 text-[0.72rem] leading-snug text-muted">
      Sources :{' '}
      {sourceIds.map((id, i) => {
        const source = sourceById.get(id)
        if (!source) return null
        return (
          <span key={id}>
            {i > 0 && ', '}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                {source.publisher}
              </a>
            ) : (
              source.publisher
            )}
          </span>
        )
      })}
    </p>
  )
}

export function CandidateSheet() {
  const { id } = useParams<{ id: string }>()
  const candidate = id ? candidateById.get(id) : undefined
  const { preferences, toggleComparison, answerCount } = usePreferences()
  const { snapshot, state: etatFactCheck } = useFactCheck()

  const affinity = useMemo(
    () => (candidate ? computeAffinity(candidate, preferences.answers) : null),
    [candidate, preferences.answers],
  )

  if (!candidate) {
    return (
      <div className="py-16 text-center">
        <p className="text-[1rem] text-ink">Cette fiche n’existe pas.</p>
        <Link to="/candidats" className="mt-3 inline-block text-[0.85rem] text-accent hover:underline">
          ← Retour à la liste des candidats
        </Link>
      </div>
    )
  }

  const status = CANDIDACY_STATUSES[candidate.candidacyStatus]
  const report = accuracyReport(snapshot, candidate.id)
  const candidateQuotes = snapshot.quotes.filter((c) => c.candidateId === candidate.id)
  const candidateVerifications = snapshot.verifications.filter((v) =>
    candidateQuotes.some((c) => c.id === v.quoteId),
  )
  // La note « rapport aux faits » vient des vérifications publiées, pas de la
  // fiche : elle doit donc afficher ici la même valeur que dans le classement.
  const dynamicRatings = dynamicAccuracyRatings(snapshot, [candidate.id])[candidate.id] ?? []
  const collectedPlatforms = [...new Set(candidateQuotes.map((c) => c.platform))]
  const sortedFacts = [...candidate.facts].sort((a, b) => b.date.localeCompare(a.date))
  const inComparison = preferences.comparison.includes(candidate.id)

  return (
    <div>
      <Link to="/candidats" className="text-[0.8rem] text-accent hover:underline">
        ← Tous les candidats
      </Link>

      <header className="mt-4 mb-6 flex flex-wrap items-start gap-5">
        <Chip candidate={candidate} size="grande" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.9rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.3rem]">
            {candidate.firstName} {candidate.lastName}
          </h1>
          <p className="mt-1 text-[0.95rem] text-ink-2">
            {candidate.party} · {candidate.currentRole}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={candidate.candidacyStatus === 'declare' ? 'accent' : 'neutre'} title={status.summary}>
              {status.lastName}
            </Badge>
            <Badge tone="neutre">{FAMILIES[candidate.family].lastName}</Badge>
            <Badge tone="neutre">{age(candidate.birth)} ans</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={inComparison ? 'primaire' : 'secondaire'}
            onClick={() => toggleComparison(candidate.id)}
          >
            {inComparison ? 'Dans le comparateur' : 'Ajouter au comparateur'}
          </Button>
        </div>
      </header>

      <p className="mb-6 max-w-3xl text-[0.95rem] leading-relaxed text-ink-2">
        {candidate.summary}
      </p>

      <div className="mb-6">
        <DataBanner />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Situation judiciaire"
              subtitle="États procéduraux distingués : enquête, mise en examen, condamnation non définitive, condamnation définitive."
            />
            <div className="p-4 sm:p-5">
              <LegalBlock legalCases={candidate.legal} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Vérification de ses déclarations"
              subtitle={
                collectedPlatforms.length > 0
                  ? `Déclarations relevées sur ${collectedPlatforms.map((p) => PLATFORMS[p].label).join(', ')}, confrontées aux données disponibles.`
                  : 'Déclarations collectées depuis les sources publiques et gratuites : comptes rendus de séance et réseaux sociaux à lecture ouverte.'
              }
              action={
                <Link
                  to="/verifications"
                  className="text-[0.8rem] font-medium text-accent hover:underline"
                >
                  Toutes les vérifications →
                </Link>
              }
            />
            <div className="p-4 sm:p-5">
              {etatFactCheck === 'chargement' && (
                <p className="text-[0.83rem] text-muted">Chargement des vérifications…</p>
              )}
              {etatFactCheck === 'erreur' && (
                <p className="text-[0.83rem] text-muted">
                  Les vérifications n’ont pas pu être chargées. Le reste de la fiche reste à jour.
                </p>
              )}
              {etatFactCheck === 'pret' && candidateQuotes.length === 0 && (
                <p className="text-[0.83rem] leading-relaxed text-ink-2">
                  Aucune déclaration collectée à ce jour. Cela ne dit rien de l’exactitude de ses
                  propos : simplement qu’aucun n’a encore été relevé.{' '}
                  {candidate.socialAccounts.length === 0 &&
                    'Aucun compte social officiel n’a pu être confirmé pour ce candidat ; la collecte repose alors sur les seuls comptes rendus de séance.'}
                </p>
              )}
              {etatFactCheck === 'pret' && candidateQuotes.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(VERDICTS) as (keyof typeof VERDICTS)[])
                      .filter((v) => (report?.byVerdict[v] ?? 0) > 0)
                      .map((v) => (
                        <Badge
                          key={v}
                          tone={VERDICTS[v].tone}
                          icon={VERDICTS[v].icon}
                          title={VERDICTS[v].explanation}
                        >
                          {report!.byVerdict[v]} {VERDICTS[v].label.toLowerCase()}
                        </Badge>
                      ))}
                  </div>
                  <p className="mt-3 text-[0.83rem] leading-relaxed text-ink-2">
                    {candidateQuotes.length} déclaration(s) collectée(s),{' '}
                    {candidateVerifications.length} examinée(s).{' '}
                    {report && report.effective >= MINIMUM_SAMPLE
                      ? `L’échantillon dépasse le minimum de ${MINIMUM_SAMPLE} vérifications : le critère « rapport aux faits » est calculé à partir de ces données.`
                      : `En dessous de ${MINIMUM_SAMPLE} vérifications, le critère « rapport aux faits » reste non documenté plutôt que calculé sur un échantillon trop petit.`}
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Notes sur les critères d’évaluation"
              subtitle="Chaque note affiche le barème qui l’a produite, son niveau de confiance et ses sources."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {criteriaByFamily.map((family) => (
                <section key={family.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    {family.lastName}
                  </h3>
                  <ul className="mt-3 space-y-4">
                    {family.criteria.map((criterion) => {
                      const rating =
                        dynamicRatings.find((n) => n.criterionId === criterion.id) ??
                        candidate.ratings.find((n) => n.criterionId === criterion.id)
                      return (
                        <li key={criterion.id}>
                          {rating ? (
                            <>
                              <Gauge
                                value={rating.rating}
                                label={criterion.lastName}
                                tier={tierOf(criterion.tiers, rating.rating)}
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <ConfidenceBadge confidence={rating.confidence} />
                                <VerificationBadge verification={rating.verification} />
                                {criterion.debatable && (
                                  <Badge tone="serious" icon="≈">
                                    Critère contestable
                                  </Badge>
                                )}
                              </div>
                              <Disclosure summary="Pourquoi cette note ?" className="mt-2">
                                <p>{rating.rationale}</p>
                                <p className="mt-2 text-muted">
                                  <strong className="font-medium text-ink-2">Limites :</strong>{' '}
                                  {criterion.limits}
                                </p>
                                <SourceList sourceIds={rating.sourceIds} />
                              </Disclosure>
                            </>
                          ) : (
                            <>
                              <Gauge value={50} label={criterion.lastName} tier="Non documenté" softened />
                              <p className="mt-1.5 text-[0.75rem] leading-snug text-muted">
                                Ce critère n’a pas encore été renseigné pour ce candidat. Le
                                classement lui substitue une valeur neutre de 50, qui ne le
                                favorise ni ne le pénalise.
                              </p>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <Radar
              title={`Profil sur les ${criteria.length} critères`}
              subtitle="Notes brutes, avant application de vos pondérations."
              axes={criteria.map((c) => c.shortName)}
              series={[
                {
                  id: candidate.id,
                  label: `${candidate.firstName} ${candidate.lastName}`,
                  values: criteria.map(
                    (criterion) => candidate.ratings.find((n) => n.criterionId === criterion.id)?.rating ?? 50,
                  ),
                },
              ]}
              rating="Les sommets à 50 peuvent signaler une note moyenne ou une donnée manquante — le détail est dans la liste ci-dessus."
            />
          </Card>

          <Card>
            <CardHeader
              title="Mesures annoncées"
              subtitle={`${candidate.measures.length} mesure(s) renseignée(s), réparties par thème.`}
            />
            <ul className="divide-y divide-[color:var(--pqc-line)]">
              {candidate.measures.map((measure) => (
                <li key={measure.id} className="p-4 sm:p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    {themeById.get(measure.themeId)?.lastName}
                  </p>
                  <h4 className="mt-1 text-[0.92rem] font-semibold leading-snug text-ink">
                    {measure.title}
                  </h4>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-2">{measure.detail}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <VerificationBadge verification={measure.verification} />
                    {measure.costing && (
                      <Badge tone="neutre" title={`Origine du chiffrage : ${measure.costing.origin}`}>
                        {measure.costing.direction === 'recette' ? 'Recette' : 'Dépense'} ·{' '}
                        {billions(measure.costing.billionEurosPerYear)}/an
                      </Badge>
                    )}
                    {measure.horizon && <Badge tone="neutre">{measure.horizon}</Badge>}
                  </div>
                  <SourceList sourceIds={measure.sourceIds} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Faits marquants" subtitle="Du plus récent au plus ancien." />
            <ol className="divide-y divide-[color:var(--pqc-line)]">
              {sortedFacts.map((fact) => (
                <li key={fact.id} className="flex gap-4 p-4 sm:p-5">
                  <div className="w-24 shrink-0">
                    <p className="tabular text-[0.78rem] font-semibold text-ink-2">
                      {formatDate(fact.date)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-line pl-4">
                    <h4 className="text-[0.9rem] font-semibold leading-snug text-ink">
                      {fact.title}
                    </h4>
                    <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-2">
                      {fact.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <VerificationBadge verification={fact.verification} />
                      {fact.scope === 'majeur' && <Badge tone="accent">Fait majeur</Badge>}
                    </div>
                    <SourceList sourceIds={fact.sourceIds} />
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <CardHeader
              title="Positions programmatiques"
              subtitle="Seize axes, regroupés par thème. Ces positions sont des synthèses éditoriales, pas des citations."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {themes.map((theme) => (
                <section key={theme.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.85rem] font-semibold text-ink">{theme.lastName}</h3>
                  <ul className="mt-3 space-y-3">
                    {axes
                      .filter((axis) => axis.themeId === theme.id)
                      .map((axis) => {
                        const position = candidate.positions[axis.id]
                        const percentage = ((position + 2) / 4) * 100
                        return (
                          <li key={axis.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-[0.82rem] font-medium text-ink">{axis.lastName}</span>
                              <span className="text-[0.75rem] text-muted">
                                {LIKERT.find((l) => l.value === position)?.label}
                              </span>
                            </div>
                            <div
                              className="relative mt-2 h-1.5 rounded-full"
                              style={{ background: 'var(--pqc-surface-3)' }}
                            >
                              <span
                                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                                style={{
                                  left: `${percentage}%`,
                                  background: 'var(--pqc-series-1)',
                                  borderColor: 'var(--pqc-surface)',
                                }}
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between gap-3 text-[0.7rem] leading-snug text-muted">
                              <span className="max-w-[45%]">{axis.negativePole}</span>
                              <span className="max-w-[45%] text-right">{axis.positivePole}</span>
                            </div>
                            {candidate.ratedPositions?.[axis.id] && (
                              <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-2">
                                {candidate.ratedPositions[axis.id]}
                              </p>
                            )}
                          </li>
                        )
                      })}
                  </ul>
                </section>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <OfficialPages
            links={[
              ...candidate.socialAccounts.map((account) => ({
                label:
                  account.platform === 'x'
                    ? `@${account.handle} — compte X`
                    : `${account.handle} — compte Bluesky`,
                url:
                  account.platform === 'x'
                    ? `https://x.com/${account.handle}`
                    : `https://bsky.app/profile/${account.handle}`,
                type: 'candidat' as const,
                usage: PLATFORMS[account.platform].free
                  ? 'Ses déclarations publiques. Lecture ouverte : cette source alimente la collecte.'
                  : 'Ses déclarations publiques. Lecture payante : cette source n’alimente la collecte que si l’exploitant y a souscrit.',
              })),
              ...candidate.officialLinks,
            ]}
          />

          {affinity && (
            <Card className="p-4">
              {answerCount === 0 ? (
                <>
                  <p className="text-[0.85rem] font-semibold text-ink">Votre affinité</p>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-2">
                    Répondez au questionnaire pour mesurer votre accord avec ce candidat, thème par
                    thème.
                  </p>
                  <Link
                    to="/questionnaire"
                    className="mt-3 inline-block text-[0.82rem] font-medium text-accent hover:underline"
                  >
                    Commencer →
                  </Link>
                </>
              ) : (
                <>
                  <KeyValue
                    label="Affinité avec vos réponses"
                    value={percent(affinity.score)}
                    precision={`${affinity.countedIn} proposition(s) prise(s) en compte`}
                  />
                  <ul className="mt-4 space-y-2.5">
                    {affinity.byTheme
                      .filter((t) => t.score !== null)
                      .map((t) => (
                        <li key={t.themeId}>
                          <Gauge
                            value={t.score!}
                            label={themeById.get(t.themeId)?.lastName ?? t.themeId}
                            compact
                          />
                        </li>
                      ))}
                  </ul>
                  {affinity.majorDisagreements.length > 0 && (
                    <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                      {affinity.majorDisagreements.length} désaccord(s) marqué(s) sur des sujets que
                      vous jugez importants.
                    </p>
                  )}
                </>
              )}
            </Card>
          )}

          <Card className="p-4">
            <p className="text-[0.85rem] font-semibold text-ink">Indicateurs</p>
            <dl className="mt-3 space-y-3">
              {candidate.indicators.map((indicator) => (
                <div key={indicator.id}>
                  <dt className="text-[0.75rem] leading-snug text-ink-2">{indicator.label}</dt>
                  <dd className="mt-0.5 text-[0.9rem] font-semibold text-ink">
                    {indicator.value}
                  </dd>
                  {indicator.period && (
                    <p className="text-[0.7rem] text-muted">{indicator.period}</p>
                  )}
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[0.72rem] text-muted">
              Fiche revue le {formatDate(candidate.lastUpdated)}.
            </p>
          </Card>

          <Notice title="Ce que cette fiche n’est pas" tone="neutre" icon="·">
            Ni un portrait, ni un jugement. Un ensemble d’éléments vérifiables — ou en cours de
            vérification — assortis de barèmes explicites. Les critères marqués « contestable »
            peuvent être neutralisés sur la page{' '}
            <Link to="/criteres" className="font-medium text-accent hover:underline">
              Mes critères
            </Link>
            .
          </Notice>

          {criterionById.get('probite') && (
            <p className="text-[0.72rem] leading-relaxed text-muted">
              Rappel : la note de probité ne prend en compte que les atteintes à la probité. Les
              condamnations d’une autre nature figurent en haut de cette fiche, dans la section
              judiciaire, sans être converties en points.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
