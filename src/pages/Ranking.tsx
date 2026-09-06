import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Notice, Badge, Button, Card, Disclosure, CardHeader } from '@/components/ui/base'
import { RankingBars } from '@/components/charts/RankingBars'
import { Radar } from '@/components/charts/Radar'
import { Gauge } from '@/components/charts/Gauge'
import { DataBanner } from '@/components/DataBanner'
import { Chip } from '@/components/candidate/Chip'
import { criterionById } from '@/data/criteria'
import { themeById } from '@/data/questionnaire'
import { AFFINITY_COLUMN, METHODS } from '@/lib/scoring'
import { useRanking } from '@/hooks/useRanking'
import { usePreferences } from '@/lib/store'
import { percent } from '@/lib/format'
import type { AggregationMethod } from '@/data/types'

const VERDICTS = {
  robuste: {
    tone: 'good' as const,
    icon: '✓',
    title: 'Classement robuste',
    text:
      "Le premier reste premier dans la grande majorité des variantes de pondération testées. Votre tête de classement ne tient pas à un réglage particulier.",
  },
  nuance: {
    tone: 'warning' as const,
    icon: '!',
    title: 'Classement à nuancer',
    text:
      "Le premier change dans une part notable des simulations. Les candidats de tête sont proches : traitez-les comme un groupe plutôt que comme un ordre.",
  },
  fragile: {
    tone: 'serious' as const,
    icon: '≈',
    title: 'Classement fragile',
    text:
      "Une variation modeste de vos pondérations suffit à changer le vainqueur. Ce que ce classement établit, c’est un peloton de tête — pas un gagnant.",
  },
}

export function Ranking() {
  const ranking = useRanking()
  const { preferences, toggleExcluded, answerCount } = usePreferences()
  const { results, sensitivity, dropped, excluded } = ranking

  const first = results[0]
  // Rangs occupés par plus d'un candidat : ce sont eux qu'il faut annoter,
  // sans quoi deux « 1 » consécutifs passent pour un défaut d'affichage.
  const tied = useMemo(() => {
    const account = new Map<number, number>()
    for (const r of results) account.set(r.rank, (account.get(r.rank) ?? 0) + 1)
    return new Set([...account].filter(([, n]) => n > 1).map(([rank]) => rank))
  }, [results])
  const verdict = VERDICTS[sensitivity.verdict]
  const methods = Object.keys(METHODS) as AggregationMethod[]

  const weightedCriteria = first
    ? first.contributions
        .filter((c) => c.criterionId !== AFFINITY_COLUMN && c.normalizedWeight > 0.01)
        .map((c) => criterionById.get(c.criterionId)!)
        .filter(Boolean)
    : []

  const topThree = results.slice(0, 3)

  return (
    <div>
      <PageHeader
        eyebrow="Étape 3 sur 3"
        title="Votre classement"
        summary={
          <>
            Construit à partir de vos {answerCount} réponses et de vos pondérations, avec la méthode{' '}
            « {METHODS[preferences.method].lastName} ». Il est recalculé en direct : revenez sur{' '}
            <Link to="/criteres" className="font-medium text-accent hover:underline">
              vos critères
            </Link>{' '}
            pour voir l’effet de chaque réglage.
          </>
        }
        actions={
          <Button variant="secondaire" size="petite" onClick={() => window.print()}>
            Imprimer
          </Button>
        }
      />

      <div className="mb-6">
        <DataBanner />
      </div>

      {results.length === 0 ? (
        <Notice title="Aucun candidat ne franchit vos seuils" tone="serious" icon="≈">
          Vos seuils rédhibitoires écartent tout le monde. C’est une information en soi, mais pour
          obtenir un classement il faut en abaisser au moins un sur la page{' '}
          <Link to="/criteres" className="font-medium text-accent hover:underline">
            Mes critères
          </Link>
          .
        </Notice>
      ) : (
        <div className="space-y-6">
          {ranking.rankingUndetermined && (
            <Notice title="Ce classement n’ordonne rien" tone="serious" icon="=">
              Tous les candidats obtiennent le même score : aucun critère n’est pondéré et le
              questionnaire ne départage pas non plus. Les candidats sont donc affichés{' '}
              <strong>ex æquo</strong>, par ordre alphabétique — cet ordre ne veut rien dire.{' '}
              <Link to="/criteres" className="font-medium text-accent hover:underline">
                Donner du poids à au moins un critère
              </Link>{' '}
              ou répondre au questionnaire fera apparaître un ordre qui, lui, en aura un.
            </Notice>
          )}

          {answerCount === 0 && (
            <Notice title="Le questionnaire n’a pas encore été rempli">
              L’affinité programmatique est neutralisée à 50 % pour tout le monde : le classement ne
              reflète donc que les critères de notation.{' '}
              <Link to="/questionnaire" className="font-medium text-accent hover:underline">
                Répondre au questionnaire
              </Link>{' '}
              change généralement l’ordre du tout au tout.
            </Notice>
          )}

          {/* Tête de classement : un seul chiffre mis en avant, pas huit couleurs. */}
          <Card className="overflow-hidden">
            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex items-start gap-4">
                <Chip candidate={first.candidate} size="grande" />
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-accent">
                    En tête de votre classement
                  </p>
                  <h2 className="mt-1 text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">
                    {first.candidate.firstName} {first.candidate.lastName}
                  </h2>
                  <p className="mt-1 text-[0.85rem] text-ink-2">{first.candidate.party}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {first.strengths.slice(0, 3).map((contribution) => (
                      <Badge key={contribution.criterionId} tone="neutre">
                        {contribution.criterionId === AFFINITY_COLUMN
                          ? 'Accord programmatique'
                          : (criterionById.get(contribution.criterionId)?.shortName ?? '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:text-right">
                <p className="text-[0.78rem] text-ink-2">Score pondéré</p>
                <p className="text-[3.2rem] font-semibold leading-none tracking-tight text-ink">
                  {Math.round(first.finalScore)}
                </p>
                <p className="mt-1 text-[0.78rem] text-muted">
                  sur 100 · en tête dans {percent(sensitivity.winnerStability * 100)} des
                  simulations
                </p>
              </div>
            </div>
          </Card>

          <Notice title={verdict.title} tone={verdict.tone} icon={verdict.icon}>
            {verdict.text} Sur {sensitivity.draws} tirages où vos pondérations sont légèrement
            perturbées, {first.candidate.lastName} arrive en tête dans{' '}
            {percent(sensitivity.winnerStability * 100)} des cas.
          </Notice>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <RankingBars
                title="Score final pondéré"
                subtitle={`Méthode « ${METHODS[preferences.method].lastName} », affinité programmatique comptée pour ${Math.round(ranking.programShare * 100)} %.`}
                data={results.map((r) => ({
                  id: r.candidate.id,
                  label: `${r.candidate.firstName} ${r.candidate.lastName}`,
                  value: r.finalScore,
                  detail: `${r.candidate.partyShort} · affinité ${percent(r.affinity.score)}`,
                }))}
                valueHeader="Score /100"
                rating="Une seule série, donc une seule couleur : la longueur de la barre porte déjà l’information."
              />
            </Card>

            <Card className="p-5">
              <RankingBars
                title="Probabilité d’arriver en tête"
                subtitle={`${sensitivity.draws} tirages avec des pondérations légèrement perturbées autour des vôtres.`}
                data={[...sensitivity.results]
                  .sort((a, b) => b.topProbability - a.topProbability)
                  .map((r) => {
                    const candidate = results.find((x) => x.candidate.id === r.alternativeId)!.candidate
                    return {
                      id: r.alternativeId,
                      label: `${candidate.firstName} ${candidate.lastName}`,
                      value: r.topProbability * 100,
                      displayValue: percent(r.topProbability * 100),
                      detail: `rang moyen ${r.meanRank.toFixed(1)} · de ${r.minRank} à ${r.maxRank}`,
                    }
                  })}
                unit=""
                valueHeader="Probabilité"
                rating="C’est l’indicateur le plus utile de la page : il dit si votre premier est vraiment premier, ou seulement premier ex æquo."
              />
            </Card>
          </div>

          {topThree.length >= 2 && weightedCriteria.length >= 3 && (
            <Card className="p-5">
              <Radar
                title="Profil comparé des trois premiers"
                subtitle="Notes sur les critères auxquels vous avez donné un poids non nul."
                axes={weightedCriteria.map((c) => c.shortName)}
                series={topThree.map((r) => ({
                  id: r.candidate.id,
                  label: `${r.candidate.firstName} ${r.candidate.lastName}`,
                  values: weightedCriteria.map(
                    (criterion) =>
                      r.contributions.find((c) => c.criterionId === criterion.id)?.rating ?? 50,
                  ),
                }))}
                rating="Trois séries au maximum : au-delà, deux couleurs superposées deviennent indiscernables pour une partie des lecteurs. Le tableau sous la figure porte toutes les valeurs."
              />
            </Card>
          )}

          <Card>
            <CardHeader
              title="Le classement change-t-il selon la méthode ?"
              subtitle="Rang obtenu avec chacune des quatre règles d’agrégation, sur les mêmes données et les mêmes poids."
            />
            <div className="pqc-scroll-x">
              <table className="w-full border-collapse text-left text-[0.82rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th scope="col" className="px-4 py-2.5 font-semibold text-ink-2">
                      Candidat
                    </th>
                    {methods.map((method) => (
                      <th
                        key={method}
                        scope="col"
                        className="px-3 py-2.5 text-center font-semibold text-ink-2 whitespace-nowrap"
                        title={METHODS[method].summary}
                      >
                        {METHODS[method].lastName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.candidate.id} className="border-b border-line last:border-0">
                      <th scope="row" className="px-4 py-2 font-medium text-ink whitespace-nowrap">
                        {result.candidate.firstName} {result.candidate.lastName}
                      </th>
                      {methods.map((method) => {
                        const rank = result.ranksByMethod[method]
                        return (
                          <td key={method} className="tabular px-3 py-2 text-center text-ink-2">
                            <span
                              className={
                                rank === 1 ? 'font-semibold text-ink' : undefined
                              }
                            >
                              {rank}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-3 text-[0.78rem] leading-relaxed text-ink-2">
              Concordance moyenne entre méthodes :{' '}
              <strong className="font-semibold text-ink">
                {percent(((ranking.methodAgreement + 1) / 2) * 100)}
              </strong>
              . Une colonne qui s’écarte des autres n’est pas une erreur : elle indique un profil
              déséquilibré, que certaines méthodes pénalisent et d’autres non.
            </p>
          </Card>

          <section aria-labelledby="detail">
            <h2 id="detail" className="mb-4 text-[1.35rem] font-semibold tracking-tight text-ink">
              D’où vient chaque score
            </h2>
            <ol className="space-y-3">
              {results.map((result) => {
                const contributions = [...result.contributions]
                  .filter((c) => c.normalizedWeight > 0.005)
                  .sort((a, b) => b.contribution - a.contribution)
                return (
                  <Card as="li" key={result.candidate.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="tabular text-[1.1rem] font-semibold text-muted"
                        // Un rang partagé est signalé : sans cela, deux « 1 » à
                        // la suite se lisent comme une erreur d'affichage.
                        title={tied.has(result.rank) ? 'Ex æquo' : undefined}
                      >
                        {result.rank}
                        {tied.has(result.rank) && (
                          <span className="ml-0.5 text-[0.7rem] font-normal">ex æq.</span>
                        )}
                      </span>
                      <Chip candidate={result.candidate} size="petite" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                          <Link to={`/candidats/${result.candidate.id}`} className="hover:underline">
                            {result.candidate.firstName} {result.candidate.lastName}
                          </Link>
                        </h3>
                        <p className="text-[0.78rem] text-ink-2">{result.candidate.partyShort}</p>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-[1.3rem] font-semibold leading-none text-ink">
                          {Math.round(result.finalScore)}
                        </p>
                        <p className="text-[0.72rem] text-muted">score /100</p>
                      </div>
                      <Button
                        variant="discret"
                        size="petite"
                        onClick={() => toggleExcluded(result.candidate.id)}
                        title="Retirer ce candidat du classement"
                      >
                        Écarter
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Gauge
                        value={result.affinity.score}
                        label="Accord programmatique"
                        tier={`${result.affinity.countedIn} proposition(s) prise(s) en compte`}
                      />
                      <Gauge
                        value={result.criteriaScore}
                        label="Note pondérée sur vos critères"
                        tier={`${contributions.filter((c) => c.criterionId !== AFFINITY_COLUMN).length} critère(s) actif(s)`}
                      />
                    </div>

                    <Disclosure summary="Décomposition du score, critère par critère" className="mt-4">
                      <div className="pqc-scroll-x">
                        <table className="w-full border-collapse text-left text-[0.8rem]">
                          <thead>
                            <tr className="border-b border-line">
                              <th scope="col" className="py-1.5 pr-3 font-semibold text-muted">
                                Critère
                              </th>
                              <th scope="col" className="py-1.5 px-2 text-right font-semibold text-muted">
                                Note
                              </th>
                              <th scope="col" className="py-1.5 px-2 text-right font-semibold text-muted">
                                Poids
                              </th>
                              <th scope="col" className="py-1.5 pl-2 text-right font-semibold text-muted">
                                Apport
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {contributions.map((contribution) => {
                              const criterion = criterionById.get(contribution.criterionId)
                              return (
                                <tr key={contribution.criterionId} className="border-b border-line last:border-0">
                                  <td className="py-1.5 pr-3 text-ink">
                                    {contribution.criterionId === AFFINITY_COLUMN
                                      ? 'Accord programmatique'
                                      : (criterion?.lastName ?? contribution.criterionId)}
                                    {contribution.missing && (
                                      <span className="ml-1.5 text-[0.72rem] text-muted">
                                        (non documenté, valeur neutre)
                                      </span>
                                    )}
                                  </td>
                                  <td className="tabular py-1.5 px-2 text-right text-ink">
                                    {Math.round(contribution.rating)}
                                  </td>
                                  <td className="tabular py-1.5 px-2 text-right text-ink-2">
                                    {percent(contribution.normalizedWeight * 100)}
                                  </td>
                                  <td className="tabular py-1.5 pl-2 text-right font-medium text-ink">
                                    {contribution.contribution.toFixed(1)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-muted">
                        L’apport est le produit de la note par le poids. La somme des apports donne
                        le score de la méthode « somme pondérée » ; les trois autres méthodes
                        combinent ces mêmes notes autrement, ce tableau reste donc une lecture
                        indicative pour elles.
                      </p>
                    </Disclosure>

                    {result.affinity.majorDisagreements.length > 0 && (
                      <Disclosure
                        summary={`${result.affinity.majorDisagreements.length} désaccord(s) sur des sujets que vous jugez importants`}
                        className="mt-3"
                      >
                        <ul className="list-disc space-y-1 pl-5">
                          {result.affinity.majorDisagreements.slice(0, 5).map((disagreement) => (
                            <li key={disagreement.propositionId}>
                              {themeById.get(disagreement.themeId)?.lastName} — accord{' '}
                              {percent(disagreement.agreement * 100)}
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    )}
                  </Card>
                )
              })}
            </ol>
          </section>

          {(dropped.length > 0 || excluded.length > 0) && (
            <Card>
              <CardHeader
                title="Candidats hors classement"
                subtitle="Écartés par un seuil rédhibitoire, ou retirés par vous."
              />
              <ul className="divide-y divide-[color:var(--pqc-line)]">
                {dropped.map((dropped) => (
                  <li key={dropped.candidate.id} className="flex flex-wrap items-center gap-3 p-4">
                    <Chip candidate={dropped.candidate} size="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        {dropped.candidate.firstName} {dropped.candidate.lastName}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-2">
                        {dropped.reasons
                          .map(
                            (reason) =>
                              `${criterionById.get(reason.criterionId)?.lastName ?? reason.criterionId} : ${Math.round(reason.rating)}/100, sous votre seuil de ${reason.threshold}`,
                          )
                          .join(' · ')}
                      </p>
                    </div>
                    <Badge tone="serious" icon="✕">
                      Seuil non atteint
                    </Badge>
                  </li>
                ))}
                {excluded.map((candidate) => (
                  <li key={candidate.id} className="flex flex-wrap items-center gap-3 p-4">
                    <Chip candidate={candidate} size="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] text-ink-2">Retiré manuellement.</p>
                    </div>
                    <Button variant="secondaire" size="petite" onClick={() => toggleExcluded(candidate.id)}>
                      Réintégrer
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
