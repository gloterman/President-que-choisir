import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Notice, Badge, Button, Card, Disclosure } from '@/components/ui/base'
import { SegmentedGroup } from '@/components/ui/controls'
import { axisById, propositions, propositionsByTheme, themes } from '@/data/questionnaire'
import { IMPORTANCE, LIKERT, clsx } from '@/lib/format'
import { usePreferences } from '@/lib/store'
import type { Importance, Likert, PropositionNature } from '@/data/types'

type Mode = 'tout' | 'principe'

const PRINCIPLE_COUNT = propositions.filter((p) => p.nature === 'principe').length

export function Questionnaire() {
  const { preferences, setAnswer, resetQuestionnaire, answerCount, propositionCount } =
    usePreferences()
  const [indexTheme, setIndexTheme] = useState(0)
  const [mode, setMode] = useState<Mode>('tout')

  // La version courte ne retire rien du calcul : elle masque les mesures
  // d'actualité pour ne garder que les arbitrages de valeurs.
  const visible = (nature: PropositionNature) => mode === 'tout' || nature === 'principe'

  const groups = useMemo(
    () =>
      propositionsByTheme.map((g) => ({
        ...g,
        propositions: g.propositions.filter((p) => visible(p.nature)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  )

  const group = groups[indexTheme]
  const last = indexTheme === groups.length - 1

  const answeredByTheme = useMemo(
    () => groups.map((g) => g.propositions.filter((p) => preferences.answers[p.id] !== undefined).length),
    [groups, preferences.answers],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Étape 1 sur 3"
        title="Où vous situez-vous ?"
        summary={
          <>
            Répondez à ce qui vous parle, sautez le reste. Ce qui compte n’est pas de tout remplir
            mais de dire, pour chaque sujet, <strong className="font-semibold text-ink">à quel point il pèse</strong> dans
            votre décision. Une proposition marquée « peu importe » est retirée du calcul, elle ne
            joue ni pour ni contre.
          </>
        }
        actions={
          answerCount > 0 ? (
            <Button variant="discret" size="petite" onClick={resetQuestionnaire}>
              Tout effacer
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.85rem] font-medium text-ink">Longueur du questionnaire</p>
            <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-2">
              La version courte ne garde que les arbitrages de principe, ceux qui ne dépendent pas
              de l’actualité. Vos réponses sont conservées si vous changez d’avis.
            </p>
          </div>
          <div className="w-full sm:w-[22rem]">
            <SegmentedGroup
              lastName="mode-questionnaire"
              legend="Longueur du questionnaire"
              size="petite"
              options={[
                { value: 'tout' as Mode, label: `Complet · ${propositionCount}` },
                { value: 'principe' as Mode, label: `Principes · ${PRINCIPLE_COUNT}` },
              ]}
              value={mode}
              onChange={(v) => {
                setMode(v)
                setIndexTheme(0)
              }}
            />
          </div>
        </div>
      </Card>

      {/* Sommaire des thèmes : sert de progression et de navigation directe. */}
      <nav aria-label="Thèmes du questionnaire" className="pqc-scroll-x -mx-4 mb-6 px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2">
          {themes.map((theme, i) => {
            const total = groups[i].propositions.length
            const facts = answeredByTheme[i]
            const isActive = i === indexTheme
            return (
              <li key={theme.id}>
                <button
                  type="button"
                  onClick={() => setIndexTheme(i)}
                  aria-current={isActive ? 'step' : undefined}
                  className={clsx(
                    'flex min-w-[9.5rem] flex-col rounded-xl border px-3 py-2 text-left transition-colors',
                    isActive
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-ink">
                    <span aria-hidden="true" className="text-accent">
                      {theme.icon}
                    </span>
                    <span className="truncate">{theme.lastName}</span>
                  </span>
                  <span className="tabular mt-0.5 text-[0.7rem] text-muted">
                    {facts} / {total} répondues
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <section aria-labelledby="theme-courant">
        <h2 id="theme-courant" className="text-[1.25rem] font-semibold tracking-tight text-ink">
          {group.theme.lastName}
        </h2>
        <p className="mt-1 max-w-2xl text-[0.88rem] leading-relaxed text-ink-2">
          {group.theme.summary}
        </p>

        <ol className="mt-6 space-y-4">
          {group.propositions.map((proposition, i) => {
            const answer = preferences.answers[proposition.id]
            const axis = axisById.get(proposition.axisId)
            return (
              <Card as="li" key={proposition.id} className="p-4 sm:p-5">
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="tabular mt-0.5 shrink-0 text-[0.8rem] font-semibold text-muted"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.98rem] font-medium leading-snug text-ink">
                      {proposition.text}
                    </p>
                    {proposition.nature === 'principe' && (
                      <Badge
                        tone="accent"
                        className="mt-2"
                        title="Arbitrage de valeurs, rédigé pour ne pas dépendre de l’actualité."
                      >
                        Question de principe
                      </Badge>
                    )}

                    <Disclosure summary="Contexte" className="mt-2">
                      <p>{proposition.context}</p>
                      {axis && (
                        <p className="mt-2 text-muted">
                          Axe mesuré : <strong className="font-medium text-ink-2">{axis.lastName}</strong>{' '}
                          — de « {axis.negativePole} » à « {axis.positivePole} ».
                        </p>
                      )}
                    </Disclosure>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div>
                        <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Votre avis
                        </p>
                        <SegmentedGroup
                          lastName={`avis-${proposition.id}`}
                          legend={`Votre avis sur : ${proposition.text}`}
                          options={LIKERT.map((l) => ({
                            value: l.value,
                            label: <span className="leading-tight">{l.short}</span>,
                            title: l.label,
                          }))}
                          value={answer?.value}
                          onChange={(v) =>
                            setAnswer(proposition.id, v as Likert, answer?.importance ?? 2)
                          }
                        />
                      </div>
                      <div className="lg:w-[19rem]">
                        <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Ce sujet compte-t-il pour vous ?
                        </p>
                        <SegmentedGroup
                          lastName={`importance-${proposition.id}`}
                          legend={`Importance du sujet : ${proposition.text}`}
                          size="petite"
                          options={IMPORTANCE.map((importanceOf) => ({
                            value: importanceOf.value,
                            label: importanceOf.short,
                            title: importanceOf.label,
                          }))}
                          value={answer?.importance}
                          onChange={(v) =>
                            setAnswer(proposition.id, answer?.value ?? 0, v as Importance)
                          }
                        />
                      </div>
                    </div>

                    {answer?.importance === 0 && (
                      <p className="mt-2.5 text-[0.75rem] text-muted">
                        Retirée du calcul d’affinité : cette réponse ne compte ni pour ni contre.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondaire"
            disabled={indexTheme === 0}
            onClick={() => setIndexTheme((i) => Math.max(0, i - 1))}
          >
            ← Thème précédent
          </Button>
          <p className="tabular order-last w-full text-center text-[0.8rem] text-muted sm:order-none sm:w-auto">
            {answerCount} / {propositionCount} propositions renseignées
          </p>
          {last ? (
            <Link
              to="/criteres"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[0.85rem] font-semibold text-[var(--pqc-accent-ink)] hover:opacity-90"
            >
              Régler mes critères →
            </Link>
          ) : (
            <Button
              variant="primaire"
              onClick={() => setIndexTheme((i) => Math.min(groups.length - 1, i + 1))}
            >
              Thème suivant →
            </Button>
          )}
        </div>

        {answerCount > 0 && answerCount < 10 && (
          <div className="mt-6">
            <Notice title="Peu de réponses pour l’instant" tone="neutre" icon="·">
              L’affinité se calcule sur ce que vous avez renseigné. En dessous d’une dizaine de
              réponses, les écarts entre candidats tiennent surtout au hasard du petit nombre.
            </Notice>
          </div>
        )}
      </section>
    </div>
  )
}
