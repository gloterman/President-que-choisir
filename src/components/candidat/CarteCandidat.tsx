import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Carte } from '@/components/ui/base'
import { Pastille } from './Pastille'
import { Jauge } from '@/components/charts/Jauge'
import { STATUTS_CANDIDATURE } from '@/data/candidats'
import { clsx, pourcent, STATUT_JUDICIAIRE } from '@/lib/format'
import type { Candidat, StatutJudiciaire } from '@/data/types'

/** Du plus grave au moins grave : la pastille annonce l'état le plus lourd de la fiche. */
const GRAVITE: StatutJudiciaire[] = [
  'condamnation-definitive',
  'condamnation-appel-pourvoi',
  'condamnation-non-definitive',
  'mise-en-examen',
  'enquete',
  'prescription',
  'classement-sans-suite',
  'non-lieu',
  'relaxe',
]

function statutLePlusGrave(candidat: Candidat): StatutJudiciaire | null {
  return GRAVITE.find((statut) => candidat.judiciaire.some((a) => a.statut === statut)) ?? null
}

export function CarteCandidat({
  candidat,
  affinite,
  rang,
  actions,
  className,
}: {
  candidat: Candidat
  affinite?: number
  rang?: number
  actions?: ReactNode
  className?: string
}) {
  const statut = STATUTS_CANDIDATURE[candidat.statutCandidature]
  return (
    <Carte as="article" className={clsx('flex flex-col p-4', className)}>
      <div className="flex items-start gap-3">
        <Pastille candidat={candidat} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {rang !== undefined && (
              <span className="tabular text-[0.78rem] font-semibold text-muted">#{rang}</span>
            )}
            <h3 className="truncate text-[0.95rem] font-semibold tracking-tight text-ink">
              <Link to={`/candidats/${candidat.id}`} className="hover:underline">
                {candidat.prenom} {candidat.nom}
              </Link>
            </h3>
          </div>
          <p className="mt-0.5 truncate text-[0.8rem] text-ink-2">{candidat.parti}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge
          ton={candidat.statutCandidature === 'declare' ? 'accent' : 'neutre'}
          titre={statut.resume}
        >
          {statut.nom}
        </Badge>
        {(() => {
          // Un simple compteur d'affaires met sur le même plan une relaxe et une
          // condamnation définitive. La pastille nomme donc l'état le plus lourd.
          const statut = statutLePlusGrave(candidat)
          if (!statut) return null
          const meta = STATUT_JUDICIAIRE[statut]
          return (
            <Badge ton={meta.ton} icone={meta.icone} titre={meta.explication}>
              {meta.label}
              {candidat.judiciaire.length > 1 && ` · ${candidat.judiciaire.length} affaires`}
            </Badge>
          )
        })()}
      </div>

      {affinite !== undefined && (
        <div className="mt-4">
          <Jauge valeur={affinite} label="Affinité avec vos réponses" compact />
          <p className="mt-1 text-[0.72rem] text-muted">{pourcent(affinite)} d’accord pondéré</p>
        </div>
      )}

      <p className="mt-3 line-clamp-3 text-[0.8rem] leading-relaxed text-ink-2">
        {candidat.presentation}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Link
          to={`/candidats/${candidat.id}`}
          className="text-[0.8rem] font-medium text-accent hover:underline"
        >
          Voir la fiche →
        </Link>
        {actions}
      </div>
    </Carte>
  )
}
