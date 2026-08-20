import { Link } from 'react-router-dom'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Bouton, Carte, Depliant, EnteteCarte } from '@/components/ui/base'
import { Curseur, GroupeSegmente } from '@/components/ui/controles'
import { Jauge } from '@/components/charts/Jauge'
import { criteresParFamille } from '@/data/criteres'
import { METHODES } from '@/lib/scoring'
import { useClassement } from '@/hooks/useClassement'
import { usePreferences } from '@/lib/store'
import { pourcent } from '@/lib/format'
import type { MethodeAgregation } from '@/data/types'

const LIBELLES_POIDS = ['Ignoré', 'Marginal', 'Faible', 'Moyen', 'Fort', 'Décisif']

export function Criteres() {
  const { preferences, definirPoids, definirSeuil, definirPartProgramme, definirMethode, reinitialiserPoids } =
    usePreferences()
  const classement = useClassement()

  const partCriteres = Math.round((1 - preferences.partProgramme) * 100)

  return (
    <div>
      <EnTetePage
        surtitre="Étape 2 sur 3"
        titre="Qu’attendez-vous d’un président ?"
        chapo={
          <>
            Chacun applique déjà des critères — un casier vierge, de l’expérience, un programme
            chiffré, une capacité à gouverner. Ici, vous les écrivez et vous leur donnez un poids.
            Chaque critère affiche le barème qui produit sa note, et ce que cette note ne dit pas.
          </>
        }
        actions={
          <Bouton variante="discret" taille="petite" onClick={reinitialiserPoids}>
            Rétablir les poids par défaut
          </Bouton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Carte>
            <EnteteCarte
              titre="Programme ou personne ?"
              soustitre="Ce que vous regardez en premier : ce qu’un candidat propose, ou ce qu’il est et ce qu’il a fait."
            />
            <div className="p-4 sm:p-5">
              <Curseur
                id="part-programme"
                label="Poids de l’accord programmatique dans le score final"
                valeur={Math.round(preferences.partProgramme * 100)}
                min={0}
                max={100}
                pas={5}
                valeurAffichee={`${Math.round(preferences.partProgramme * 100)} % programme · ${partCriteres} % critères`}
                onChange={(v) => definirPartProgramme(v / 100)}
                aide="À 100 %, seul compte l’accord avec vos réponses au questionnaire. À 0 %, seuls comptent les critères ci-dessous."
              />
              {classement.partProgramme === 1 && preferences.partProgramme < 1 && (
                <div className="mt-4">
                  <Alerte titre="Tous les critères sont à zéro" ton="neutre" icone="·">
                    Le score repose donc entièrement sur l’affinité programmatique, quel que soit le
                    réglage de ce curseur.
                  </Alerte>
                </div>
              )}
            </div>
          </Carte>

          <Carte>
            <EnteteCarte
              titre="Méthode d’agrégation"
              soustitre="Comment les notes des différents critères se combinent en un score unique."
            />
            <div className="p-4 sm:p-5">
              <GroupeSegmente
                nom="methode"
                legende="Méthode d’agrégation multicritère"
                colonnes="grid-cols-2 sm:grid-cols-4"
                options={(Object.keys(METHODES) as MethodeAgregation[]).map((id) => ({
                  valeur: id,
                  label: METHODES[id].nom,
                  titre: METHODES[id].resume,
                }))}
                valeur={preferences.methode}
                onChange={definirMethode}
              />
              <div className="mt-4 rounded-xl bg-surface-2 p-4">
                <p className="text-[0.85rem] leading-relaxed text-ink">
                  {METHODES[preferences.methode].resume}
                </p>
                <dl className="mt-3 space-y-1.5 text-[0.8rem]">
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-ink-2">Quand l’utiliser :</dt>
                    <dd className="text-ink-2">{METHODES[preferences.methode].quandLUtiliser}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-semibold text-ink-2">Compensation :</dt>
                    <dd className="text-ink-2">{METHODES[preferences.methode].compensatoire}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Carte>

          {criteresParFamille.map((famille) => (
            <Carte key={famille.id}>
              <EnteteCarte titre={famille.nom} soustitre={famille.resume} />
              <ul className="divide-y divide-[color:var(--pqc-line)]">
                {famille.criteres.map((critere) => {
                  const poids = preferences.poids[critere.id] ?? 0
                  const seuil = preferences.seuils[critere.id] ?? 0
                  return (
                    <li key={critere.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                            {critere.nom}
                          </h3>
                          <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">
                            {critere.resume}
                          </p>
                        </div>
                        {critere.contestable && (
                          <Badge
                            ton="serious"
                            icone="≈"
                            titre="Ce critère repose sur un jugement de valeur que l’on peut refuser."
                          >
                            Contestable
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Curseur
                          id={`poids-${critere.id}`}
                          label="Poids"
                          valeur={poids}
                          valeurAffichee={LIBELLES_POIDS[poids] ?? String(poids)}
                          onChange={(v) => definirPoids(critere.id, v)}
                        />
                        <Curseur
                          id={`seuil-${critere.id}`}
                          label="Seuil rédhibitoire"
                          valeur={seuil}
                          min={0}
                          max={90}
                          pas={5}
                          valeurAffichee={seuil === 0 ? 'aucun' : `écarte sous ${seuil}/100`}
                          onChange={(v) => definirSeuil(critere.id, v)}
                          aide={
                            seuil > 0
                              ? 'Les candidats sous ce seuil sortent du classement, quels que soient leurs autres résultats.'
                              : undefined
                          }
                        />
                      </div>

                      <Depliant resume="Barème, indicateurs et limites" className="mt-4">
                        <p className="font-medium text-ink">{critere.question}</p>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Indicateurs utilisés
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {critere.indicateurs.map((indicateur) => (
                            <li key={indicateur}>{indicateur}</li>
                          ))}
                        </ul>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Barème appliqué
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {critere.bareme.map((regle) => (
                            <li key={regle}>{regle}</li>
                          ))}
                        </ul>

                        <p className="mt-3 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Ce que la note ne dit pas
                        </p>
                        <p className="mt-1">{critere.limites}</p>
                        <p className="mt-2 italic text-muted">{critere.sensLecture}</p>
                      </Depliant>
                    </li>
                  )
                })}
              </ul>
            </Carte>
          ))}
        </div>

        {/* Aperçu vivant : le classement se recalcule à chaque mouvement de curseur. */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Carte>
            <EnteteCarte
              titre="Aperçu en direct"
              soustitre="Recalculé à chaque réglage."
              niveau={2}
            />
            <div className="p-4">
              {classement.resultats.length === 0 ? (
                <p className="text-[0.82rem] text-ink-2">
                  Vos seuils écartent tous les candidats. Abaissez-en un pour voir un classement.
                </p>
              ) : (
                <ol className="space-y-3">
                  {classement.resultats.slice(0, 5).map((resultat) => (
                    <li key={resultat.candidat.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[0.85rem] font-medium text-ink">
                          <span className="tabular mr-1.5 text-muted">{resultat.rang}.</span>
                          {resultat.candidat.nom}
                        </span>
                        <span className="tabular shrink-0 text-[0.8rem] font-semibold text-ink">
                          {Math.round(resultat.scoreFinal)}
                        </span>
                      </div>
                      <Jauge valeur={resultat.scoreFinal} compact />
                    </li>
                  ))}
                </ol>
              )}

              {classement.ecartes.length > 0 && (
                <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                  {classement.ecartes.length} candidat(s) écarté(s) par vos seuils rédhibitoires.
                </p>
              )}

              <p className="mt-4 border-t border-line pt-3 text-[0.75rem] leading-snug text-muted">
                Concordance entre les quatre méthodes :{' '}
                <strong className="font-semibold text-ink-2">
                  {pourcent(((classement.concordanceMethodes + 1) / 2) * 100)}
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
          </Carte>
        </aside>
      </div>
    </div>
  )
}
