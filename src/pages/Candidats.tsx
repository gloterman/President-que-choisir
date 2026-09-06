import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/EnTetePage'
import { Button, Card } from '@/components/ui/base'
import { SegmentedGroup } from '@/components/ui/controles'
import { Compass } from '@/components/charts/Boussole'
import { DataBanner } from '@/components/BandeauDonnees'
import { CandidateCard } from '@/components/candidat/CarteCandidat'
import { candidates, FAMILIES } from '@/data/candidats'
import { candidateCompass, userCompass, computeAffinity } from '@/lib/scoring'
import { MAX_COMPARISON, usePreferences } from '@/lib/store'
import type { PoliticalFamily } from '@/data/types'

type Sort = 'affinite' | 'spectre' | 'alphabetique'

export function Candidates() {
  const { preferences, toggleComparison, answerCount } = usePreferences()
  const [tri, setTri] = useState<Sort>(answerCount > 0 ? 'affinite' : 'spectre')
  const [family, setFamille] = useState<PoliticalFamily | 'toutes'>('toutes')

  const affinities = useMemo(
    () => new Map(candidates.map((c) => [c.id, computeAffinity(c, preferences.answers).score])),
    [preferences.answers],
  )

  const userPoint = useMemo(
    () => userCompass(preferences.answers),
    [preferences.answers],
  )

  const list = useMemo(() => {
    const filters = candidates.filter((c) => family === 'toutes' || c.family === family)
    const copy = [...filters]
    if (tri === 'affinite') {
      copy.sort((a, b) => (affinities.get(b.id) ?? 0) - (affinities.get(a.id) ?? 0))
    } else if (tri === 'alphabetique') {
      copy.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'))
    } else {
      copy.sort((a, b) => FAMILIES[a.family].order - FAMILIES[b.family].order)
    }
    return copy
  }, [family, tri, affinities])

  const presentFamilies = useMemo(
    () =>
      (Object.keys(FAMILIES) as PoliticalFamily[])
        .filter((f) => candidates.some((c) => c.family === f))
        .sort((a, b) => FAMILIES[a].order - FAMILIES[b].order),
    [],
  )

  return (
    <div>
      <PageHeader
        title="Les candidats"
        summary={
          <>
            {candidates.length} personnalités déclarées, pressenties ou envisagées pour avril 2027.
            Chaque fiche présente le parcours, les mesures, les faits marquants et, le cas échéant,
            la situation judiciaire — avec, à chaque fois, le statut de vérification de la donnée.
          </>
        }
      />

      <div className="mb-6">
        <DataBanner />
      </div>

      <Card className="mb-6 p-4 sm:p-5">
        <Compass
          title="Où se situent les candidats"
          subtitle={
            userPoint
              ? 'Votre position est calculée à partir de vos réponses au questionnaire.'
              : 'Répondez au questionnaire pour voir votre propre position apparaître sur la carte.'
          }
          candidates={candidates.map((candidate) => {
            const point = candidateCompass(candidate)
            return {
              id: candidate.id,
              label: `${candidate.firstName} ${candidate.lastName}`,
              initials: candidate.initials,
              eco: point.eco,
              soc: point.soc,
            }
          })}
          user={userPoint}
          rating="Chaque point est étiqueté par ses initiales : l’identité ne repose jamais sur la couleur seule. Les deux dimensions sont des combinaisons pondérées des seize axes, décrites dans la méthodologie."
        />
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
            Trier par
          </p>
          <SegmentedGroup
            lastName="tri"
            legend="Trier les candidats"
            size="petite"
            options={[
              { value: 'affinite' as Sort, label: 'Affinité' },
              { value: 'spectre' as Sort, label: 'Spectre politique' },
              { value: 'alphabetique' as Sort, label: 'Nom' },
            ]}
            value={tri}
            onChange={setTri}
          />
        </div>
        <div>
          <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
            Famille politique
          </p>
          <select
            value={family}
            onChange={(e) => setFamille(e.target.value as PoliticalFamily | 'toutes')}
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.82rem] text-ink"
            aria-label="Filtrer par famille politique"
          >
            <option value="toutes">Toutes les familles</option>
            {presentFamilies.map((f) => (
              <option key={f} value={f}>
                {FAMILIES[f].lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((candidate) => {
          const inComparison = preferences.comparison.includes(candidate.id)
          return (
            <li key={candidate.id} className="contents">
              <CandidateCard
                candidate={candidate}
                affinity={answerCount > 0 ? affinities.get(candidate.id) : undefined}
                actions={
                  <Button
                    variant={inComparison ? 'primaire' : 'secondaire'}
                    size="petite"
                    onClick={() => toggleComparison(candidate.id)}
                    title={`Comparateur — ${MAX_COMPARISON} candidats au maximum`}
                  >
                    {inComparison ? 'Dans le comparateur' : 'Comparer'}
                  </Button>
                }
              />
            </li>
          )
        })}
      </ul>

      {list.length === 0 && (
        <p className="py-12 text-center text-[0.88rem] text-muted">
          Aucun candidat dans cette famille politique.
        </p>
      )}
    </div>
  )
}
