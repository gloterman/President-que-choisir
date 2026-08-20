import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Bouton, Carte, Depliant } from '@/components/ui/base'
import { GroupeSegmente } from '@/components/ui/controles'
import { axeById, propositions, propositionsParTheme, themes } from '@/data/referentiel'
import { IMPORTANCE, LIKERT, clsx } from '@/lib/format'
import { usePreferences } from '@/lib/store'
import type { Importance, Likert, NatureProposition } from '@/data/types'

type Mode = 'tout' | 'principe'

const NB_PRINCIPES = propositions.filter((p) => p.nature === 'principe').length

export function Questionnaire() {
  const { preferences, repondre, reinitialiserQuestionnaire, nbReponses, nbPropositions } =
    usePreferences()
  const [indexTheme, setIndexTheme] = useState(0)
  const [mode, setMode] = useState<Mode>('tout')

  // La version courte ne retire rien du calcul : elle masque les mesures
  // d'actualité pour ne garder que les arbitrages de valeurs.
  const visible = (nature: NatureProposition) => mode === 'tout' || nature === 'principe'

  const groupes = useMemo(
    () =>
      propositionsParTheme.map((g) => ({
        ...g,
        propositions: g.propositions.filter((p) => visible(p.nature)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  )

  const groupe = groupes[indexTheme]
  const dernier = indexTheme === groupes.length - 1

  const repondusParTheme = useMemo(
    () => groupes.map((g) => g.propositions.filter((p) => preferences.reponses[p.id] !== undefined).length),
    [groupes, preferences.reponses],
  )

  return (
    <div>
      <EnTetePage
        surtitre="Étape 1 sur 3"
        titre="Où vous situez-vous ?"
        chapo={
          <>
            Répondez à ce qui vous parle, sautez le reste. Ce qui compte n’est pas de tout remplir
            mais de dire, pour chaque sujet, <strong className="font-semibold text-ink">à quel point il pèse</strong> dans
            votre décision. Une proposition marquée « peu importe » est retirée du calcul, elle ne
            joue ni pour ni contre.
          </>
        }
        actions={
          nbReponses > 0 ? (
            <Bouton variante="discret" taille="petite" onClick={reinitialiserQuestionnaire}>
              Tout effacer
            </Bouton>
          ) : undefined
        }
      />

      <Carte className="mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.85rem] font-medium text-ink">Longueur du questionnaire</p>
            <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-2">
              La version courte ne garde que les arbitrages de principe, ceux qui ne dépendent pas
              de l’actualité. Vos réponses sont conservées si vous changez d’avis.
            </p>
          </div>
          <div className="w-full sm:w-[22rem]">
            <GroupeSegmente
              nom="mode-questionnaire"
              legende="Longueur du questionnaire"
              taille="petite"
              options={[
                { valeur: 'tout' as Mode, label: `Complet · ${nbPropositions}` },
                { valeur: 'principe' as Mode, label: `Principes · ${NB_PRINCIPES}` },
              ]}
              valeur={mode}
              onChange={(v) => {
                setMode(v)
                setIndexTheme(0)
              }}
            />
          </div>
        </div>
      </Carte>

      {/* Sommaire des thèmes : sert de progression et de navigation directe. */}
      <nav aria-label="Thèmes du questionnaire" className="pqc-scroll-x -mx-4 mb-6 px-4 sm:mx-0 sm:px-0">
        <ol className="flex gap-2">
          {themes.map((theme, i) => {
            const total = groupes[i].propositions.length
            const faits = repondusParTheme[i]
            const actif = i === indexTheme
            return (
              <li key={theme.id}>
                <button
                  type="button"
                  onClick={() => setIndexTheme(i)}
                  aria-current={actif ? 'step' : undefined}
                  className={clsx(
                    'flex min-w-[9.5rem] flex-col rounded-xl border px-3 py-2 text-left transition-colors',
                    actif
                      ? 'border-accent bg-accent-soft'
                      : 'border-line bg-surface hover:border-line-strong',
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-ink">
                    <span aria-hidden="true" className="text-accent">
                      {theme.icone}
                    </span>
                    <span className="truncate">{theme.nom}</span>
                  </span>
                  <span className="tabular mt-0.5 text-[0.7rem] text-muted">
                    {faits} / {total} répondues
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <section aria-labelledby="theme-courant">
        <h2 id="theme-courant" className="text-[1.25rem] font-semibold tracking-tight text-ink">
          {groupe.theme.nom}
        </h2>
        <p className="mt-1 max-w-2xl text-[0.88rem] leading-relaxed text-ink-2">
          {groupe.theme.resume}
        </p>

        <ol className="mt-6 space-y-4">
          {groupe.propositions.map((proposition, i) => {
            const reponse = preferences.reponses[proposition.id]
            const axe = axeById.get(proposition.axeId)
            return (
              <Carte as="li" key={proposition.id} className="p-4 sm:p-5">
                <div className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="tabular mt-0.5 shrink-0 text-[0.8rem] font-semibold text-muted"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.98rem] font-medium leading-snug text-ink">
                      {proposition.texte}
                    </p>
                    {proposition.nature === 'principe' && (
                      <Badge
                        ton="accent"
                        className="mt-2"
                        titre="Arbitrage de valeurs, rédigé pour ne pas dépendre de l’actualité."
                      >
                        Question de principe
                      </Badge>
                    )}

                    <Depliant resume="Contexte" className="mt-2">
                      <p>{proposition.contexte}</p>
                      {axe && (
                        <p className="mt-2 text-muted">
                          Axe mesuré : <strong className="font-medium text-ink-2">{axe.nom}</strong>{' '}
                          — de « {axe.poleNegatif} » à « {axe.polePositif} ».
                        </p>
                      )}
                    </Depliant>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div>
                        <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Votre avis
                        </p>
                        <GroupeSegmente
                          nom={`avis-${proposition.id}`}
                          legende={`Votre avis sur : ${proposition.texte}`}
                          options={LIKERT.map((l) => ({
                            valeur: l.valeur,
                            label: <span className="leading-tight">{l.court}</span>,
                            titre: l.label,
                          }))}
                          valeur={reponse?.valeur}
                          onChange={(v) =>
                            repondre(proposition.id, v as Likert, reponse?.importance ?? 2)
                          }
                        />
                      </div>
                      <div className="lg:w-[19rem]">
                        <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Ce sujet compte-t-il pour vous ?
                        </p>
                        <GroupeSegmente
                          nom={`importance-${proposition.id}`}
                          legende={`Importance du sujet : ${proposition.texte}`}
                          taille="petite"
                          options={IMPORTANCE.map((imp) => ({
                            valeur: imp.valeur,
                            label: imp.court,
                            titre: imp.label,
                          }))}
                          valeur={reponse?.importance}
                          onChange={(v) =>
                            repondre(proposition.id, reponse?.valeur ?? 0, v as Importance)
                          }
                        />
                      </div>
                    </div>

                    {reponse?.importance === 0 && (
                      <p className="mt-2.5 text-[0.75rem] text-muted">
                        Retirée du calcul d’affinité : cette réponse ne compte ni pour ni contre.
                      </p>
                    )}
                  </div>
                </div>
              </Carte>
            )
          })}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Bouton
            variante="secondaire"
            disabled={indexTheme === 0}
            onClick={() => setIndexTheme((i) => Math.max(0, i - 1))}
          >
            ← Thème précédent
          </Bouton>
          <p className="tabular order-last w-full text-center text-[0.8rem] text-muted sm:order-none sm:w-auto">
            {nbReponses} / {nbPropositions} propositions renseignées
          </p>
          {dernier ? (
            <Link
              to="/criteres"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[0.85rem] font-semibold text-[var(--pqc-accent-ink)] hover:opacity-90"
            >
              Régler mes critères →
            </Link>
          ) : (
            <Bouton
              variante="primaire"
              onClick={() => setIndexTheme((i) => Math.min(groupes.length - 1, i + 1))}
            >
              Thème suivant →
            </Bouton>
          )}
        </div>

        {nbReponses > 0 && nbReponses < 10 && (
          <div className="mt-6">
            <Alerte titre="Peu de réponses pour l’instant" ton="neutre" icone="·">
              L’affinité se calcule sur ce que vous avez renseigné. En dessous d’une dizaine de
              réponses, les écarts entre candidats tiennent surtout au hasard du petit nombre.
            </Alerte>
          </div>
        )}
      </section>
    </div>
  )
}
