import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Bouton, Carte, EnteteCarte } from '@/components/ui/base'
import { BarresGroupees } from '@/components/charts/BarresGroupees'
import { Radar } from '@/components/charts/Radar'
import { BandeauDonnees } from '@/components/BandeauDonnees'
import { Pastille } from '@/components/candidat/Pastille'
import { BadgeVerification } from '@/components/candidat/BadgeVerification'
import { candidats, candidatById } from '@/data/candidats'
import { criteres } from '@/data/criteres'
import { axes, themes } from '@/data/referentiel'
import { calculerAffinite } from '@/lib/scoring'
import { couleurSerie } from '@/components/charts/primitives'
import { MAX_COMPARAISON, usePreferences } from '@/lib/store'
import { clsx, milliards, pourcent } from '@/lib/format'
import { LIKERT } from '@/lib/format'
import type { Likert } from '@/data/types'

const ECHELLE: Likert[] = [-2, -1, 0, 1, 2]

/** Une colonne sur téléphone, puis deux, puis autant que de candidats comparés. */
const COLONNES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

/** Petite frise de position : cinq crans, le cran retenu est plein. */
function Position({ valeur, couleur }: { valeur: Likert | undefined; couleur: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {ECHELLE.map((cran) => (
        <span
          key={cran}
          className={clsx('block h-3 w-1.5 rounded-[2px]')}
          style={{
            background: valeur === cran ? couleur : 'var(--pqc-surface-3)',
          }}
        />
      ))}
    </span>
  )
}

export function Comparateur() {
  const { preferences, basculerComparaison } = usePreferences()
  const [themeActif, setThemeActif] = useState<string>('tous')

  const selection = preferences.comparaison
    .map((id) => candidatById.get(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))

  const affinites = useMemo(
    () => new Map(selection.map((c) => [c.id, calculerAffinite(c, preferences.reponses)])),
    [selection, preferences.reponses],
  )

  const themesAffiches = themeActif === 'tous' ? themes : themes.filter((t) => t.id === themeActif)

  return (
    <div>
      <EnTetePage
        titre="Comparateur de programmes"
        chapo={
          <>
            Trois candidats côte à côte, position par position et mesure par mesure. La limite de
            trois n’est pas décorative : au-delà, deux couleurs de série deviennent indiscernables
            pour une partie des lecteurs, et une comparaison illisible ne compare rien.
          </>
        }
      />

      <div className="mb-6">
        <BandeauDonnees />
      </div>

      <Carte className="mb-6">
        <EnteteCarte
          titre="Choisir les candidats"
          soustitre={`${selection.length} sur ${MAX_COMPARAISON} sélectionné(s). Au-delà de trois, le plus ancien sort de la comparaison.`}
        />
        <div className="flex flex-wrap gap-2 p-4">
          {candidats.map((candidat) => {
            const index = preferences.comparaison.indexOf(candidat.id)
            const actif = index >= 0
            return (
              <button
                key={candidat.id}
                type="button"
                onClick={() => basculerComparaison(candidat.id)}
                aria-pressed={actif}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[0.8rem] font-medium transition-colors',
                  actif
                    ? 'border-transparent text-ink shadow-[inset_0_0_0_2px_currentColor]'
                    : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                )}
                style={actif ? { color: couleurSerie(index) } : undefined}
              >
                {actif && (
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: couleurSerie(index) }}
                  />
                )}
                <span className="text-ink">{candidat.nom}</span>
                <span className="text-muted">{candidat.partiCourt}</span>
              </button>
            )
          })}
        </div>
      </Carte>

      {selection.length === 0 ? (
        <Alerte titre="Sélectionnez au moins un candidat" ton="neutre" icone="·">
          Choisissez-en deux ou trois pour que la comparaison soit utile.
        </Alerte>
      ) : (
        <div className="space-y-6">
          <div className={clsx('grid gap-4', COLONNES[selection.length] ?? COLONNES[3])}>
            {selection.map((candidat, index) => (
              <Carte key={candidat.id} className="p-4">
                <div
                  className="mb-3 h-1 w-10 rounded-full"
                  style={{ background: couleurSerie(index) }}
                  aria-hidden="true"
                />
                <div className="flex items-start gap-2.5">
                  <Pastille candidat={candidat} taille="petite" />
                  <div className="min-w-0">
                    <h2 className="truncate text-[0.9rem] font-semibold tracking-tight text-ink">
                      <Link to={`/candidats/${candidat.id}`} className="hover:underline">
                        {candidat.prenom} {candidat.nom}
                      </Link>
                    </h2>
                    <p className="truncate text-[0.75rem] text-ink-2">{candidat.partiCourt}</p>
                  </div>
                </div>
                <p className="tabular mt-3 text-[1.5rem] font-semibold leading-none text-ink">
                  {Math.round(affinites.get(candidat.id)?.score ?? 50)}
                  <span className="text-[0.8rem] font-normal text-muted"> % d’affinité</span>
                </p>
                <Bouton
                  variante="discret"
                  taille="petite"
                  className="mt-3"
                  onClick={() => basculerComparaison(candidat.id)}
                >
                  Retirer
                </Bouton>
              </Carte>
            ))}
          </div>

          {selection.length >= 2 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Carte className="p-5">
                <BarresGroupees
                  titre="Affinité par thème"
                  soustitre="Accord pondéré avec vos réponses, thème par thème."
                  series={selection.map((c) => ({ id: c.id, label: c.nom }))}
                  groupes={themes.map((theme) => ({
                    categorie: theme.nom,
                    valeurs: selection.map(
                      (c) => affinites.get(c.id)?.parTheme.find((t) => t.themeId === theme.id)?.score ?? null,
                    ),
                  }))}
                  note="Un tiret signale un thème sur lequel vous n’avez exprimé aucune importance : il est retiré du calcul."
                />
              </Carte>

              <Carte className="p-5">
                <Radar
                  titre="Profil sur les critères d’évaluation"
                  soustitre="Notes issues des barèmes publics, indépendamment de vos pondérations."
                  axes={criteres.map((c) => c.nomCourt)}
                  series={selection.map((candidat) => ({
                    id: candidat.id,
                    label: candidat.nom,
                    valeurs: criteres.map(
                      (critere) =>
                        candidat.notes.find((n) => n.critereId === critere.id)?.note ?? 50,
                    ),
                  }))}
                  note="Une valeur à 50 peut signifier « moyen » ou « non documenté » : le détail figure sur chaque fiche."
                />
              </Carte>
            </div>
          )}

          <Carte>
            <EnteteCarte
              titre="Positions, axe par axe"
              soustitre="Chaque ligne va du pôle de gauche au pôle de droite indiqués en en-tête."
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
                      {theme.nom}
                    </option>
                  ))}
                </select>
              }
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {themesAffiches.map((theme) => (
                <section key={theme.id} className="p-4 sm:p-5">
                  <h3 className="text-[0.88rem] font-semibold text-ink">{theme.nom}</h3>
                  <ul className="mt-3 space-y-4">
                    {axes
                      .filter((axe) => axe.themeId === theme.id)
                      .map((axe) => (
                        <li key={axe.id}>
                          <p className="text-[0.8rem] font-medium text-ink-2">{axe.nom}</p>
                          <p className="mt-0.5 text-[0.72rem] leading-snug text-muted">
                            {axe.poleNegatif} <span aria-hidden="true">↔</span> {axe.polePositif}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {selection.map((candidat, index) => (
                              <li key={candidat.id} className="flex items-center gap-3">
                                <Position valeur={candidat.positions[axe.id]} couleur={couleurSerie(index)} />
                                <span className="min-w-0 flex-1 text-[0.78rem] leading-snug text-ink-2">
                                  {candidat.nom}
                                  {candidat.positionsNotes?.[axe.id] && (
                                    <span className="ml-2 text-muted">
                                      — {candidat.positionsNotes[axe.id]}
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 text-[0.72rem] text-muted">
                                  {LIKERT.find((l) => l.valeur === candidat.positions[axe.id])?.court}
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
          </Carte>

          <Carte>
            <EnteteCarte
              titre="Mesures annoncées"
              soustitre="Ce que chaque candidat propose sur les thèmes sélectionnés."
            />
            <div className="divide-y divide-[color:var(--pqc-line)]">
              {themesAffiches.map((theme) => {
                const parCandidat = selection.map((candidat) => ({
                  candidat,
                  mesures: candidat.mesures.filter((m) => m.themeId === theme.id),
                }))
                if (parCandidat.every((p) => p.mesures.length === 0)) return null
                return (
                  <section key={theme.id} className="p-4 sm:p-5">
                    <h3 className="text-[0.88rem] font-semibold text-ink">{theme.nom}</h3>
                    <div className={clsx('mt-3 grid gap-4', COLONNES[selection.length] ?? COLONNES[3])}>
                      {parCandidat.map(({ candidat, mesures }, index) => (
                        <div key={candidat.id}>
                          <p className="flex items-center gap-1.5 text-[0.78rem] font-medium text-ink-2">
                            <span
                              aria-hidden="true"
                              className="h-2 w-2 rounded-full"
                              style={{ background: couleurSerie(index) }}
                            />
                            {candidat.nom}
                          </p>
                          {mesures.length === 0 ? (
                            <p className="mt-2 text-[0.78rem] text-muted">Aucune mesure renseignée.</p>
                          ) : (
                            <ul className="mt-2 space-y-3">
                              {mesures.map((mesure) => (
                                <li key={mesure.id} className="rounded-lg bg-surface-2 p-3">
                                  <p className="text-[0.82rem] font-medium leading-snug text-ink">
                                    {mesure.titre}
                                  </p>
                                  <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-2">
                                    {mesure.detail}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    <BadgeVerification verification={mesure.verification} />
                                    {mesure.chiffrage && (
                                      <Badge
                                        ton="neutre"
                                        titre={`Origine du chiffrage : ${mesure.chiffrage.origine}`}
                                      >
                                        {mesure.chiffrage.sens === 'recette' ? '+' : '−'}
                                        {milliards(mesure.chiffrage.montantMdEurosAn)}/an
                                      </Badge>
                                    )}
                                    {mesure.horizon && <Badge ton="neutre">{mesure.horizon}</Badge>}
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
          </Carte>

          {selection.length >= 2 && (
            <Carte>
              <EnteteCarte
                titre={`Notes sur les ${criteres.length} critères`}
                soustitre="Valeurs brutes issues des barèmes, avant application de vos pondérations."
              />
              <div className="pqc-scroll-x">
                <table className="w-full border-collapse text-left text-[0.82rem]">
                  <thead>
                    <tr className="border-b border-line bg-surface-2">
                      <th scope="col" className="px-4 py-2.5 font-semibold text-ink-2">
                        Critère
                      </th>
                      {selection.map((candidat) => (
                        <th
                          key={candidat.id}
                          scope="col"
                          className="px-3 py-2.5 text-right font-semibold text-ink-2 whitespace-nowrap"
                        >
                          {candidat.nom}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteres.map((critere) => (
                      <tr key={critere.id} className="border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-2 font-medium text-ink">
                          {critere.nom}
                          {critere.contestable && (
                            <span className="ml-1.5 text-[0.7rem] text-muted">(contestable)</span>
                          )}
                        </th>
                        {selection.map((candidat) => {
                          const note = candidat.notes.find((n) => n.critereId === critere.id)
                          return (
                            <td
                              key={candidat.id}
                              className="tabular px-3 py-2 text-right text-ink"
                              title={note?.justification}
                            >
                              {note ? Math.round(note.note) : <span className="text-muted">n. d.</span>}
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
            </Carte>
          )}

          {selection.length === 1 && (
            <Alerte titre="Ajoutez un second candidat" ton="neutre" icone="·">
              La comparaison prend tout son sens à partir de deux profils.{' '}
              {pourcent(affinites.get(selection[0].id)?.score ?? 50)} d’affinité, seul, ne dit pas
              grand-chose.
            </Alerte>
          )}
        </div>
      )}
    </div>
  )
}
