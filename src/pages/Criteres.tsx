import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/EnTetePage'
import { Notice, Badge, Button, Card, Disclosure, CardHeader } from '@/components/ui/base'
import { Slider, SegmentedGroup } from '@/components/ui/controles'
import { Gauge } from '@/components/charts/Jauge'
import { criteriaByFamily } from '@/data/criteres'
import { METHODS } from '@/lib/scoring'
import { useRanking } from '@/hooks/useClassement'
import { usePreferences } from '@/lib/store'
import { percent } from '@/lib/format'
import type { AggregationMethod } from '@/data/types'

const WEIGHT_LABELS = ['Ignoré', 'Marginal', 'Faible', 'Moyen', 'Fort', 'Décisif']

export function Criteria() {
  const { preferences, setWeight, setThreshold, setProgramShare, setMethod, resetWeights } =
    usePreferences()
  const ranking = useRanking()

  const criteriaShare = Math.round((1 - preferences.programShare) * 100)

  return (
    <div>
      <PageHeader
        eyebrow="Étape 2 sur 3"
        title="Qu’attendez-vous d’un président ?"
        summary={
          <>
            Chacun applique déjà des critères — un casier vierge, de l’expérience, un programme
            chiffré, une capacité à gouverner. Ici, vous les écrivez et vous leur donnez un poids.
            Chaque critère affiche le barème qui produit sa note, et ce que cette note ne dit pas.
          </>
        }
        actions={
          <Button variant="discret" size="petite" onClick={resetWeights}>
            Rétablir les poids par défaut
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Programme ou personne ?"
              subtitle="Ce que vous regardez en premier : ce qu’un candidat propose, ou ce qu’il est et ce qu’il a fait."
            />
            <div className="p-4 sm:p-5">
              <Slider
                id="part-programme"
                label="Poids de l’accord programmatique dans le score final"
                value={Math.round(preferences.programShare * 100)}
                min={0}
                max={100}
                step={5}
                displayValue={`${Math.round(preferences.programShare * 100)} % programme · ${criteriaShare} % critères`}
                onChange={(v) => setProgramShare(v / 100)}
                help="À 100 %, seul compte l’accord avec vos réponses au questionnaire. À 0 %, seuls comptent les critères ci-dessous."
              />
              {ranking.programShare === 1 && preferences.programShare < 1 && (
                <div className="mt-4">
                  <Notice title="Tous les critères sont à zéro" tone="neutre" icon="·">
                    Le score repose donc entièrement sur l’affinité programmatique, quel que soit le
                    réglage de ce curseur.
                  </Notice>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Méthode d’agrégation"
              subtitle="Comment les notes des différents critères se combinent en un score unique."
            />
            <div className="p-4 sm:p-5">
              <SegmentedGroup
                lastName="methode"
                legend="Méthode d’agrégation multicritère"
                columns="grid-cols-2 sm:grid-cols-4"
                options={(Object.keys(METHODS) as AggregationMethod[]).map((id) => ({
                  value: id,
                  label: METHODS[id].lastName,
                  title: METHODS[id].summary,
                }))}
                value={preferences.method}
                onChange={setMethod}
              />
              <div className="mt-4 rounded-xl bg-surface-2 p-4">
                <p className="text-[0.85rem] leading-relaxed text-ink">
                  {METHODS[preferences.method].summary}
                </p>
                <dl className="mt-3 space-y-1.5 text-[0.8rem]">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-ink-2">Quand l’utiliser :</dt>
                    <dd className="text-ink-2">{METHODS[preferences.method].whenToUse}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-ink-2">Compensation :</dt>
                    <dd className="text-ink-2">{METHODS[preferences.method].compensatory}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>

          {criteriaByFamily.map((family) => (
            <Card key={family.id}>
              <CardHeader title={family.lastName} subtitle={family.summary} />
              <ul className="divide-y divide-[color:var(--pqc-line)]">
                {family.criteria.map((criterion) => {
                  const weight = preferences.weight[criterion.id] ?? 0
                  const threshold = preferences.thresholds[criterion.id] ?? 0
                  return (
                    <li key={criterion.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                            {criterion.lastName}
                          </h3>
                          <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">
                            {criterion.summary}
                          </p>
                        </div>
                        {criterion.debatable && (
                          <Badge
                            tone="serious"
                            icon="≈"
                            title="Ce critère repose sur un jugement de valeur que l’on peut refuser."
                          >
                            Contestable
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Slider
                          id={`poids-${criterion.id}`}
                          label="Poids"
                          value={weight}
                          displayValue={WEIGHT_LABELS[weight] ?? String(weight)}
                          onChange={(v) => setWeight(criterion.id, v)}
                        />
                        <Slider
                          id={`seuil-${criterion.id}`}
                          label="Seuil rédhibitoire"
                          value={threshold}
                          min={0}
                          max={90}
                          step={5}
                          displayValue={threshold === 0 ? 'aucun' : `écarte sous ${threshold}/100`}
                          onChange={(v) => setThreshold(criterion.id, v)}
                          help={
                            threshold > 0
                              ? 'Les candidats sous ce seuil sortent du classement, quels que soient leurs autres résultats.'
                              : undefined
                          }
                        />
                      </div>

                      <Disclosure summary="Barème, indicateurs et limites" className="mt-4">
                        <p className="font-medium text-ink">{criterion.question}</p>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Indicateurs utilisés
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {criterion.indicators.map((indicator) => (
                            <li key={indicator}>{indicator}</li>
                          ))}
                        </ul>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Barème appliqué
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {criterion.scale.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Ce que la note ne dit pas
                        </p>
                        <p className="mt-1">{criterion.limits}</p>
                        <p className="mt-2 italic text-muted">{criterion.readingDirection}</p>
                      </Disclosure>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>

        {/* Aperçu vivant : le classement se recalcule à chaque mouvement de curseur. */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader
              title="Aperçu en direct"
              subtitle="Recalculé à chaque réglage."
              level={2}
            />
            <div className="p-4">
              {ranking.results.length === 0 ? (
                <p className="text-[0.82rem] text-ink-2">
                  Vos seuils écartent tous les candidats. Abaissez-en un pour voir un classement.
                </p>
              ) : (
                <ol className="space-y-3">
                  {ranking.results.slice(0, 5).map((result) => (
                    <li key={result.candidate.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[0.85rem] font-medium text-ink">
                          <span className="tabular mr-1.5 text-muted">{result.rank}.</span>
                          {result.candidate.lastName}
                        </span>
                        <span className="tabular shrink-0 text-[0.8rem] font-semibold text-ink">
                          {Math.round(result.finalScore)}
                        </span>
                      </div>
                      <Gauge value={result.finalScore} compact />
                    </li>
                  ))}
                </ol>
              )}

              {ranking.dropped.length > 0 && (
                <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                  {ranking.dropped.length} candidat(s) écarté(s) par vos seuils rédhibitoires.
                </p>
              )}

              <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                Concordance entre les quatre méthodes :{' '}
                <strong className="font-semibold text-ink-2">
                  {percent(((ranking.methodAgreement + 1) / 2) * 100)}
                </strong>
                . Plus elle est haute, moins le choix de la méthode change le résultat.
              </p>

              <Link
                to="/classement"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-[0.85rem] font-semibold text-[var(--pqc-accent-ink)] hover:opacity-90"
              >
                Voir le classement détaillé →
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
