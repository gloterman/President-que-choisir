import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alerte, Badge, Bouton, Carte, Depliant, EnteteCarte, ValeurCle } from '@/components/ui/base'
import { Jauge } from '@/components/charts/Jauge'
import { Radar } from '@/components/charts/Radar'
import { BandeauDonnees } from '@/components/BandeauDonnees'
import { Pastille } from '@/components/candidat/Pastille'
import { BadgeConfiance, BadgeVerification } from '@/components/candidat/BadgeVerification'
import { BlocJudiciaire } from '@/components/candidat/BlocJudiciaire'
import { candidatById, FAMILLES, STATUTS_CANDIDATURE } from '@/data/candidats'
import { criteres, criteresParFamille, critereById } from '@/data/criteres'
import { axes, themeById, themes } from '@/data/referentiel'
import { sourceById } from '@/data/sources'
import { calculerAffinite } from '@/lib/scoring'
import { usePreferences } from '@/lib/store'
import { age, formatDate, LIKERT, milliards, palierDe, pourcent } from '@/lib/format'

function ListeSources({ sourceIds }: { sourceIds: string[] }) {
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
                {source.editeur}
              </a>
            ) : (
              source.editeur
            )}
          </span>
        )
      })}
    </p>
  )
}

export function FicheCandidat() {
  const { id } = useParams<{ id: string }>()
  const candidat = id ? candidatById.get(id) : undefined
  const { preferences, basculerComparaison, nbReponses } = usePreferences()

  const affinite = useMemo(
    () => (candidat ? calculerAffinite(candidat, preferences.reponses) : null),
    [candidat, preferences.reponses],
  )

  if (!candidat) {
    return (
      <div className="py-16 text-center">
        <p className="text-[1rem] text-ink">Cette fiche n’existe pas.</p>
        <Link to="/candidats" className="mt-3 inline-block text-[0.85rem] text-accent hover:underline">
          ← Retour à la liste des candidats
        </Link>
      </div>
    )
  }

  const statut = STATUTS_CANDIDATURE[candidat.statutCandidature]
  const faitsTries = [...candidat.faits].sort((a, b) => b.date.localeCompare(a.date))
  const enComparaison = preferences.comparaison.includes(candidat.id)

  return (
    <div>
      <Link to="/candidats" className="text-[0.8rem] text-accent hover:underline">
        ← Tous les candidats
      </Link>

      <header className="mt-4 mb-6 flex flex-wrap items-start gap-5">
        <Pastille candidat={candidat} taille="grande" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.9rem] font-semibold leading-tight tracking-tight text-ink sm:text-[2.3rem]">
            {candidat.prenom} {candidat.nom}
          </h1>
          <p className="mt-1 text-[0.95rem] text-ink-2">
            {candidat.parti} · {candidat.fonctionActuelle}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge ton={candidat.statutCandidature === 'declare' ? 'accent' : 'neutre'} titre={statut.resume}>
              {statut.nom}
            </Badge>
            <Badge ton="neutre">{FAMILLES[candidat.famille].nom}</Badge>
            <Badge ton="neutre">{age(candidat.naissance)} ans</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Bouton
            variante={enComparaison ? 'primaire' : 'secondaire'}
            onClick={() => basculerComparaison(candidat.id)}
          >
            {enComparaison ? 'Dans le comparateur' : 'Ajouter au comparateur'}
          </Bouton>
        </div>
      </header>

      <p className="mb-6 max-w-3xl text-[0.95rem] leading-relaxed text-ink-2">
        {candidat.presentation}
      </p>

      <div className="mb-6">
        <BandeauDonnees />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_19rem]">
        <div className="space-y-6">
          <Carte>
            <EnteteCarte
              titre="Situation judiciaire"
              soustitre="États procéduraux distingués : enquête, mise en examen, condamnation non définitive, condamnation définitive."
            />
            <div className="p-4 sm:p-5">
              <BlocJudiciaire affaires={candidat.judiciaire} />
            </div>
          </Carte>

          <Carte>
            <EnteteCarte
              titre="Notes sur les critères d’évaluation"
              soustitre="Chaque note affiche le barème qui l’a produite, son niveau de confiance et ses sources."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {criteresParFamille.map((famille) => (
                <section key={famille.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    {famille.nom}
                  </h3>
                  <ul className="mt-3 space-y-4">
                    {famille.criteres.map((critere) => {
                      const note = candidat.notes.find((n) => n.critereId === critere.id)
                      return (
                        <li key={critere.id}>
                          {note ? (
                            <>
                              <Jauge
                                valeur={note.note}
                                label={critere.nom}
                                palier={palierDe(critere.paliers, note.note)}
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <BadgeConfiance confiance={note.confiance} />
                                <BadgeVerification verification={note.verification} />
                                {critere.contestable && (
                                  <Badge ton="serious" icone="≈">
                                    Critère contestable
                                  </Badge>
                                )}
                              </div>
                              <Depliant resume="Pourquoi cette note ?" className="mt-2">
                                <p>{note.justification}</p>
                                <p className="mt-2 text-muted">
                                  <strong className="font-medium text-ink-2">Limites :</strong>{' '}
                                  {critere.limites}
                                </p>
                                <ListeSources sourceIds={note.sourceIds} />
                              </Depliant>
                            </>
                          ) : (
                            <>
                              <Jauge valeur={50} label={critere.nom} palier="Non documenté" attenuee />
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
          </Carte>

          <Carte className="p-5">
            <Radar
              titre="Profil sur les onze critères"
              soustitre="Notes brutes, avant application de vos pondérations."
              axes={criteres.map((c) => c.nomCourt)}
              series={[
                {
                  id: candidat.id,
                  label: `${candidat.prenom} ${candidat.nom}`,
                  valeurs: criteres.map(
                    (critere) => candidat.notes.find((n) => n.critereId === critere.id)?.note ?? 50,
                  ),
                },
              ]}
              note="Les sommets à 50 peuvent signaler une note moyenne ou une donnée manquante — le détail est dans la liste ci-dessus."
            />
          </Carte>

          <Carte>
            <EnteteCarte
              titre="Mesures annoncées"
              soustitre={`${candidat.mesures.length} mesure(s) renseignée(s), réparties par thème.`}
            />
            <ul className="divide-y divide-[color:var(--pqc-line)]">
              {candidat.mesures.map((mesure) => (
                <li key={mesure.id} className="p-4 sm:p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                    {themeById.get(mesure.themeId)?.nom}
                  </p>
                  <h4 className="mt-1 text-[0.92rem] font-semibold leading-snug text-ink">
                    {mesure.titre}
                  </h4>
                  <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-2">{mesure.detail}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <BadgeVerification verification={mesure.verification} />
                    {mesure.chiffrage && (
                      <Badge ton="neutre" titre={`Origine du chiffrage : ${mesure.chiffrage.origine}`}>
                        {mesure.chiffrage.sens === 'recette' ? 'Recette' : 'Dépense'} ·{' '}
                        {milliards(mesure.chiffrage.montantMdEurosAn)}/an
                      </Badge>
                    )}
                    {mesure.horizon && <Badge ton="neutre">{mesure.horizon}</Badge>}
                  </div>
                  <ListeSources sourceIds={mesure.sourceIds} />
                </li>
              ))}
            </ul>
          </Carte>

          <Carte>
            <EnteteCarte titre="Faits marquants" soustitre="Du plus récent au plus ancien." />
            <ol className="divide-y divide-[color:var(--pqc-line)]">
              {faitsTries.map((fait) => (
                <li key={fait.id} className="flex gap-4 p-4 sm:p-5">
                  <div className="w-24 shrink-0">
                    <p className="tabular text-[0.78rem] font-semibold text-ink-2">
                      {formatDate(fait.date)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-line pl-4">
                    <h4 className="text-[0.9rem] font-semibold leading-snug text-ink">
                      {fait.titre}
                    </h4>
                    <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-2">
                      {fait.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <BadgeVerification verification={fait.verification} />
                      {fait.portee === 'majeur' && <Badge ton="accent">Fait majeur</Badge>}
                    </div>
                    <ListeSources sourceIds={fait.sourceIds} />
                  </div>
                </li>
              ))}
            </ol>
          </Carte>

          <Carte>
            <EnteteCarte
              titre="Positions programmatiques"
              soustitre="Seize axes, regroupés par thème. Ces positions sont des synthèses éditoriales, pas des citations."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {themes.map((theme) => (
                <section key={theme.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.85rem] font-semibold text-ink">{theme.nom}</h3>
                  <ul className="mt-3 space-y-3">
                    {axes
                      .filter((axe) => axe.themeId === theme.id)
                      .map((axe) => {
                        const position = candidat.positions[axe.id]
                        const pourcentage = ((position + 2) / 4) * 100
                        return (
                          <li key={axe.id}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-[0.82rem] font-medium text-ink">{axe.nom}</span>
                              <span className="text-[0.75rem] text-muted">
                                {LIKERT.find((l) => l.valeur === position)?.label}
                              </span>
                            </div>
                            <div
                              className="relative mt-2 h-1.5 rounded-full"
                              style={{ background: 'var(--pqc-surface-3)' }}
                            >
                              <span
                                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                                style={{
                                  left: `${pourcentage}%`,
                                  background: 'var(--pqc-series-1)',
                                  borderColor: 'var(--pqc-surface)',
                                }}
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between gap-3 text-[0.7rem] leading-snug text-muted">
                              <span className="max-w-[45%]">{axe.poleNegatif}</span>
                              <span className="max-w-[45%] text-right">{axe.polePositif}</span>
                            </div>
                            {candidat.positionsNotes?.[axe.id] && (
                              <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-2">
                                {candidat.positionsNotes[axe.id]}
                              </p>
                            )}
                          </li>
                        )
                      })}
                  </ul>
                </section>
              ))}
            </div>
          </Carte>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {affinite && (
            <Carte className="p-4">
              {nbReponses === 0 ? (
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
                  <ValeurCle
                    label="Affinité avec vos réponses"
                    valeur={pourcent(affinite.score)}
                    precision={`${affinite.nbPrisesEnCompte} proposition(s) prise(s) en compte`}
                  />
                  <ul className="mt-4 space-y-2.5">
                    {affinite.parTheme
                      .filter((t) => t.score !== null)
                      .map((t) => (
                        <li key={t.themeId}>
                          <Jauge
                            valeur={t.score!}
                            label={themeById.get(t.themeId)?.nom ?? t.themeId}
                            compact
                          />
                        </li>
                      ))}
                  </ul>
                  {affinite.desaccordsMajeurs.length > 0 && (
                    <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                      {affinite.desaccordsMajeurs.length} désaccord(s) marqué(s) sur des sujets que
                      vous jugez importants.
                    </p>
                  )}
                </>
              )}
            </Carte>
          )}

          <Carte className="p-4">
            <p className="text-[0.85rem] font-semibold text-ink">Indicateurs</p>
            <dl className="mt-3 space-y-3">
              {candidat.indicateurs.map((indicateur) => (
                <div key={indicateur.id}>
                  <dt className="text-[0.75rem] leading-snug text-ink-2">{indicateur.label}</dt>
                  <dd className="mt-0.5 text-[0.9rem] font-semibold text-ink">
                    {indicateur.valeur}
                  </dd>
                  {indicateur.periode && (
                    <p className="text-[0.7rem] text-muted">{indicateur.periode}</p>
                  )}
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-line pt-3 text-[0.72rem] text-muted">
              Fiche revue le {formatDate(candidat.derniereMaj)}.
            </p>
          </Carte>

          <Alerte titre="Ce que cette fiche n’est pas" ton="neutre" icone="·">
            Ni un portrait, ni un jugement. Un ensemble d’éléments vérifiables — ou en cours de
            vérification — assortis de barèmes explicites. Les critères marqués « contestable »
            peuvent être neutralisés sur la page{' '}
            <Link to="/criteres" className="font-medium text-accent hover:underline">
              Mes critères
            </Link>
            .
          </Alerte>

          {critereById.get('probite') && (
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
