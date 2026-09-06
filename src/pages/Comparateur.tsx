import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/EnTetePage'
import { Notice, Badge, Button, Card, CardHeader } from '@/components/ui/base'
import { GroupedBars } from '@/components/charts/BarresGroupees'
import { Radar } from '@/components/charts/Radar'
import { DataBanner } from '@/components/BandeauDonnees'
import { Chip } from '@/components/candidat/Pastille'
import { VerificationBadge } from '@/components/candidat/BadgeVerification'
import { candidates, candidateById } from '@/data/candidats'
import { criteria } from '@/data/criteres'
import { axes, themes } from '@/data/referentiel'
import { computeAffinity } from '@/lib/scoring'
import { seriesColor } from '@/components/charts/primitives'
import { MAX_COMPARISON, usePreferences } from '@/lib/store'
import { clsx, billions, percent } from '@/lib/format'
import { LIKERT } from '@/lib/format'
import type { Likert } from '@/data/types'

const SCALE: Likert[] = [-2, -1, 0, 1, 2]

/** Une colonne sur téléphone, puis deux, puis autant que de candidats comparés. */
const COLUMNS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

/** Petite frise de position : cinq crans, le cran retenu est plein. */
function Position({ value, color }: { value: Likert | undefined; color: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {SCALE.map((notch) => (
        <span
          key={notch}
          className={clsx('block h-3 w-1.5 rounded-[2px]')}
          style={{
            background: value === notch ? color : 'var(--pqc-surface-3)',
          }}
        />
      ))}
    </span>
  )
}

export function Comparator() {
  const { preferences, toggleComparison } = usePreferences()
  const [themeActif, setThemeActif] = useState<string>('tous')

  const selection = preferences.comparison
    .map((id) => candidateById.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const affinities = useMemo(
    () => new Map(selection.map((c) => [c.id, computeAffinity(c, preferences.answers)])),
    [selection, preferences.answers],
  )

  const shownThemes = themeActif === 'tous' ? themes : themes.filter((t) => t.id === themeActif)

  return (
    <div>
      <PageHeader
        title="Comparateur de programmes"
        summary={
          <>
            Trois candidats côte à côte, position par position et mesure par mesure. La limite de
            trois n’est pas décorative : au-delà, deux couleurs de série deviennent indiscernables
            pour une partie des lecteurs, et une comparaison illisible ne compare rien.
          </>
        }
      />

      <div className="mb-6">
        <DataBanner />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Choisir les candidats"
          subtitle={`${selection.length} sur ${MAX_COMPARISON} sélectionné(s). Au-delà de trois, le plus ancien sort de la comparaison.`}
        />
        <div className="flex flex-wrap gap-2 p-4">
          {candidates.map((candidate) => {
            const index = preferences.comparison.indexOf(candidate.id)
            const isActive = index >= 0
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggleComparison(candidate.id)}
                aria-pressed={isActive}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors',
                  isActive
                    ? 'border-transparent text-ink shadow-[inset_0_0_0_2px_currentColor]'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                )}
                style={isActive ? { color: seriesColor(index) } : undefined}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: seriesColor(index) }}
                  />
                )}
                <span className="text-ink">{candidate.lastName}</span>
                <span className="text-muted">{candidate.partyShort}</span>
              </button>
            )
          })}
        </div>
      </Card>

      {selection.length === 0 ? (
        <Notice title="Sélectionnez au moins un candidat" tone="neutre" icon="·">
          Choisissez-en deux ou trois pour que la comparaison soit utile.
        </Notice>
      ) : (
        <div className="space-y-6">
          <div className={clsx('grid gap-4', COLUMNS[selection.length] ?? COLUMNS[3])}>
            {selection.map((candidate, index) => (
              <Card key={candidate.id} className="p-4">
                <div
                  className="mb-3 h-1 w-10 rounded-full"
                  style={{ background: seriesColor(index) }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-2.5">
                  <Chip candidate={candidate} size="petite" />
                  <div className="min-w-0">
                    <h2 className="truncate text-[0.9rem] font-semibold tracking-tight text-ink">
                      <Link to={`/candidats/${candidate.id}`} className="hover:underline">
                        {candidate.firstName} {candidate.lastName}
                      </Link>
                    </h2>
                    <p className="truncate text-[0.75rem] text-ink-2">{candidate.partyShort}</p>
                  </div>
                </div>
                <p className="tabular mt-3 text-[1.5rem] font-semibold leading-none text-ink">
                  {Math.round(affinities.get(candidate.id)?.score ?? 50)}
                  <span className="text-[0.8rem] font-normal text-muted"> % d’affinité</span>
                </p>
                <Button
                  variant="discret"
                  size="petite"
                  className="mt-3"
                  onClick={() => toggleComparison(candidate.id)}
                >
                  Retirer
                </Button>
              </Card>
            ))}
          </div>

          {selection.length >= 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <GroupedBars
                  title="Affinité par thème"
                  subtitle="Accord pondéré avec vos réponses, thème par thème."
                  series={selection.map((c) => ({ id: c.id, label: c.lastName }))}
                  groups={themes.map((theme) => ({
                    category: theme.lastName,
                    values: selection.map(
                      (c) => affinities.get(c.id)?.byTheme.find((t) => t.themeId === theme.id)?.score ?? null,
                    ),
                  }))}
                  rating="Un tiret signale un thème sur lequel vous n’avez exprimé aucune importance : il est retiré du calcul."
                />
              </Card>

              <Card className="p-5">
                <Radar
                  title="Profil sur les critères d’évaluation"
                  subtitle="Notes issues des barèmes publics, indépendamment de vos pondérations."
                  axes={criteria.map((c) => c.shortName)}
                  series={selection.map((candidate) => ({
                    id: candidate.id,
                    label: candidate.lastName,
                    values: criteria.map(
                      (criterion) =>
                        candidate.ratings.find((n) => n.criterionId === criterion.id)?.rating ?? 50,
                    ),
                  }))}
                  rating="Une valeur à 50 peut signifier « moyen » ou « non documenté » : le détail figure sur chaque fiche."
                />
              </Card>
            </div>
          )}

          <Card>
            <CardHeader
              title="Positions, axe par axe"
              subtitle="Chaque ligne va du pôle de gauche au pôle de droite indiqués en en-tête."
              action={
                <select
                  value={themeActif}
                  onChange={(e) => setThemeActif(e.target.value)}
                  className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[0.8rem] text-ink"
                  aria-label="Filtrer par thème"
                >
                  <option value="tous">Tous les thèmes</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.lastName}
                    </option>
                  ))}
                </select>
              }
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {shownThemes.map((theme) => (
                <section key={theme.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.88rem] font-semibold text-ink">{theme.lastName}</h3>
                  <ul className="mt-3 space-y-4">
                    {axes
                      .filter((axis) => axis.themeId === theme.id)
                      .map((axis) => (
                        <li key={axis.id}>
                          <p className="text-[0.8rem] font-medium text-ink-2">{axis.lastName}</p>
                          <p className="mt-0.5 text-[0.72rem] leading-snug text-muted">
                            {axis.negativePole} <span aria-hidden="true">↔</span> {axis.positivePole}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {selection.map((candidate, index) => (
                              <li key={candidate.id} className="flex items-center gap-3">
                                <Position value={candidate.positions[axis.id]} color={seriesColor(index)} />
                                <span className="min-w-0 flex-1 text-[0.78rem] leading-snug text-ink-2">
                                  {candidate.lastName}
                                  {candidate.ratedPositions?.[axis.id] && (
                                    <span className="ml-2 text-muted">
                                      — {candidate.ratedPositions[axis.id]}
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 text-[0.72rem] text-muted">
                                  {LIKERT.find((l) => l.value === candidate.positions[axis.id])?.short}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </div>
            <p className="border-t border-line px-4 py-3 text-[0.75rem] leading-relaxed text-muted">
              Les positions sont des synthèses éditoriales des lignes politiques exprimées, pas des
              citations. Elles portent le statut « estimation » et sont, par nature, discutables.
            </p>
          </Card>

          <Card>
            <CardHeader
              title="Mesures annoncées"
              subtitle="Ce que chaque candidat propose sur les thèmes sélectionnés."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {shownThemes.map((theme) => {
                const byCandidate = selection.map((candidate) => ({
                  candidate,
                  measures: candidate.measures.filter((m) => m.themeId === theme.id),
                }))
                if (byCandidate.every((p) => p.measures.length === 0)) return null
                return (
                  <section key={theme.id} className="p-4 sm:p-5">
                    <h3 className="text-[0.88rem] font-semibold text-ink">{theme.lastName}</h3>
                    <div className={clsx('mt-3 grid gap-4', COLUMNS[selection.length] ?? COLUMNS[3])}>
                      {byCandidate.map(({ candidate, measures }, index) => (
                        <div key={candidate.id}>
                          <p className="flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-2">
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full"
                              style={{ background: seriesColor(index) }}
                            />
                            {candidate.lastName}
                          </p>
                          {measures.length === 0 ? (
                            <p className="mt-2 text-[0.78rem] text-muted">Aucune mesure renseignée.</p>
                          ) : (
                            <ul className="mt-2 space-y-3">
                              {measures.map((measure) => (
                                <li key={measure.id} className="rounded-lg bg-surface-2 p-3">
                                  <p className="text-[0.82rem] font-medium leading-snug text-ink">
                                    {measure.title}
                                  </p>
                                  <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-2">
                                    {measure.detail}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <VerificationBadge verification={measure.verification} />
                                    {measure.costing && (
                                      <Badge
                                        tone="neutre"
                                        title={`Origine du chiffrage : ${measure.costing.origin}`}
                                      >
                                        {measure.costing.direction === 'recette' ? '+' : '−'}
                                        {billions(measure.costing.billionEurosPerYear)}/an
                                      </Badge>
                                    )}
                                    {measure.horizon && <Badge tone="neutre">{measure.horizon}</Badge>}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </Card>

          {selection.length >= 2 && (
            <Card>
              <CardHeader
                title={`Notes sur les ${criteria.length} critères`}
                subtitle="Valeurs brutes issues des barèmes, avant application de vos pondérations."
              />
              <div className="pqc-scroll-x">
                <table className="w-full border-collapse text-left text-[0.82rem]">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th scope="col" className="px-4 py-2.5 font-semibold text-ink-2">
                        Critère
                      </th>
                      {selection.map((candidate) => (
                        <th
                          key={candidate.id}
                          scope="col"
                          className="px-3 py-2.5 text-right font-semibold text-ink-2 whitespace-nowrap"
                        >
                          {candidate.lastName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-2 font-medium text-ink">
                          {criterion.lastName}
                          {criterion.debatable && (
                            <span className="ml-1.5 text-[0.7rem] text-muted">(contestable)</span>
                          )}
                        </th>
                        {selection.map((candidate) => {
                          const rating = candidate.ratings.find((n) => n.criterionId === criterion.id)
                          return (
                            <td
                              key={candidate.id}
                              className="tabular px-3 py-2 text-right text-ink"
                              title={rating?.rationale}
                            >
                              {rating ? Math.round(rating.rating) : <span className="text-muted">n. d.</span>}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line px-4 py-3 text-[0.75rem] text-muted">
                « n. d. » signale un critère non documenté : le classement lui substitue une valeur
                neutre de 50, ce qui ne favorise ni ne pénalise le candidat.
              </p>
            </Card>
          )}

          {selection.length === 1 && (
            <Notice title="Ajoutez un second candidat" tone="neutre" icon="·">
              La comparaison prend tout son sens à partir de deux profils.{' '}
              {percent(affinities.get(selection[0].id)?.score ?? 50)} d’affinité, seul, ne dit pas
              grand-chose.
            </Notice>
          )}
        </div>
      )}
    </div>
  )
}
