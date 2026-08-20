import { useMemo, useState } from 'react'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Bouton, Carte } from '@/components/ui/base'
import { GroupeSegmente } from '@/components/ui/controles'
import { Boussole } from '@/components/charts/Boussole'
import { BandeauDonnees } from '@/components/BandeauDonnees'
import { CarteCandidat } from '@/components/candidat/CarteCandidat'
import { candidats, FAMILLES } from '@/data/candidats'
import { boussoleCandidat, boussoleUtilisateur, calculerAffinite } from '@/lib/scoring'
import { MAX_COMPARAISON, usePreferences } from '@/lib/store'
import type { FamillePolitique } from '@/data/types'

type Tri = 'affinite' | 'spectre' | 'alphabetique'

export function Candidats() {
  const { preferences, basculerComparaison, nbReponses } = usePreferences()
  const [tri, setTri] = useState<Tri>(nbReponses > 0 ? 'affinite' : 'spectre')
  const [famille, setFamille] = useState<FamillePolitique | 'toutes'>('toutes')

  const affinites = useMemo(
    () => new Map(candidats.map((c) => [c.id, calculerAffinite(c, preferences.reponses).score])),
    [preferences.reponses],
  )

  const pointUtilisateur = useMemo(
    () => boussoleUtilisateur(preferences.reponses),
    [preferences.reponses],
  )

  const liste = useMemo(() => {
    const filtres = candidats.filter((c) => famille === 'toutes' || c.famille === famille)
    const copie = [...filtres]
    if (tri === 'affinite') {
      copie.sort((a, b) => (affinites.get(b.id) ?? 0) - (affinites.get(a.id) ?? 0))
    } else if (tri === 'alphabetique') {
      copie.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    } else {
      copie.sort((a, b) => FAMILLES[a.famille].ordre - FAMILLES[b.famille].ordre)
    }
    return copie
  }, [famille, tri, affinites])

  const famillesPresentes = useMemo(
    () =>
      (Object.keys(FAMILLES) as FamillePolitique[])
        .filter((f) => candidats.some((c) => c.famille === f))
        .sort((a, b) => FAMILLES[a].ordre - FAMILLES[b].ordre),
    [],
  )

  return (
    <div>
      <EnTetePage
        titre="Les candidats"
        chapo={
          <>
            {candidats.length} personnalités déclarées, pressenties ou envisagées pour avril 2027.
            Chaque fiche présente le parcours, les mesures, les faits marquants et, le cas échéant,
            la situation judiciaire — avec, à chaque fois, le statut de vérification de la donnée.
          </>
        }
      />

      <div className="mb-6">
        <BandeauDonnees />
      </div>

      <Carte className="mb-6 p-4 sm:p-5">
        <Boussole
          titre="Où se situent les candidats"
          soustitre={
            pointUtilisateur
              ? 'Votre position est calculée à partir de vos réponses au questionnaire.'
              : 'Répondez au questionnaire pour voir votre propre position apparaître sur la carte.'
          }
          candidats={candidats.map((candidat) => {
            const point = boussoleCandidat(candidat)
            return {
              id: candidat.id,
              label: `${candidat.prenom} ${candidat.nom}`,
              initiales: candidat.initiales,
              eco: point.eco,
              soc: point.soc,
            }
          })}
          utilisateur={pointUtilisateur}
          note="Chaque point est étiqueté par ses initiales : l’identité ne repose jamais sur la couleur seule. Les deux dimensions sont des combinaisons pondérées des seize axes, décrites dans la méthodologie."
        />
      </Carte>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
            Trier par
          </p>
          <GroupeSegmente
            nom="tri"
            legende="Trier les candidats"
            taille="petite"
            options={[
              { valeur: 'affinite' as Tri, label: 'Affinité' },
              { valeur: 'spectre' as Tri, label: 'Spectre politique' },
              { valeur: 'alphabetique' as Tri, label: 'Nom' },
            ]}
            valeur={tri}
            onChange={setTri}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
            Famille politique
          </p>
          <select
            value={famille}
            onChange={(e) => setFamille(e.target.value as FamillePolitique | 'toutes')}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.82rem] text-ink"
            aria-label="Filtrer par famille politique"
          >
            <option value="toutes">Toutes les familles</option>
            {famillesPresentes.map((f) => (
              <option key={f} value={f}>
                {FAMILLES[f].nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((candidat) => {
          const enComparaison = preferences.comparaison.includes(candidat.id)
          return (
            <li key={candidat.id} className="contents">
              <CarteCandidat
                candidat={candidat}
                affinite={nbReponses > 0 ? affinites.get(candidat.id) : undefined}
                actions={
                  <Bouton
                    variante={enComparaison ? 'primaire' : 'secondaire'}
                    taille="petite"
                    onClick={() => basculerComparaison(candidat.id)}
                    title={`Comparateur — ${MAX_COMPARAISON} candidats au maximum`}
                  >
                    {enComparaison ? 'Dans le comparateur' : 'Comparer'}
                  </Bouton>
                }
              />
            </li>
          )
        })}
      </ul>

      {liste.length === 0 && (
        <p className="py-12 text-center text-[0.88rem] text-muted">
          Aucun candidat dans cette famille politique.
        </p>
      )}
    </div>
  )
}
