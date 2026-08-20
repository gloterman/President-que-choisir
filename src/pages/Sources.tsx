import { useMemo } from 'react'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Carte, EnteteCarte } from '@/components/ui/base'
import { BarresClassement } from '@/components/charts/BarresClassement'
import { BadgeVerification } from '@/components/candidat/BadgeVerification'
import { candidats } from '@/data/candidats'
import { sources } from '@/data/sources'
import { pourcent, VERIFICATION } from '@/lib/format'
import type { SourceType, Verification } from '@/data/types'

const TYPES: Record<SourceType, string> = {
  officiel: 'Source officielle',
  institution: 'Institution',
  presse: 'Presse et vérification factuelle',
  programme: 'Programme du candidat',
  ong: 'Association et société civile',
  universitaire: 'Recherche',
}

export function Sources() {
  const bilan = useMemo(() => {
    const parCandidat = candidats.map((candidat) => {
      const elements = [
        ...candidat.mesures,
        ...candidat.faits,
        ...candidat.judiciaire,
        ...candidat.indicateurs,
      ]
      const verifies = elements.filter((e) => e.verification === 'verifie').length
      return {
        candidat,
        total: elements.length,
        verifies,
        part: elements.length > 0 ? (verifies / elements.length) * 100 : 0,
      }
    })

    const tous = candidats.flatMap((c) => [
      ...c.mesures,
      ...c.faits,
      ...c.judiciaire,
      ...c.indicateurs,
    ])
    const parStatut = (['verifie', 'a-verifier', 'estimation'] as Verification[]).map((statut) => ({
      statut,
      nombre: tous.filter((e) => e.verification === statut).length,
    }))

    return { parCandidat, parStatut, total: tous.length }
  }, [])

  const parType = useMemo(
    () =>
      (Object.keys(TYPES) as SourceType[])
        .map((type) => ({ type, sources: sources.filter((s) => s.type === type) }))
        .filter((groupe) => groupe.sources.length > 0),
    [],
  )

  return (
    <div>
      <EnTetePage
        titre="Sources et état de vérification"
        chapo={
          <>
            Cette page dit exactement ce que vaut le jeu de données à ce jour. Elle est volontairement
            placée au même niveau que les résultats : une note ne vaut que ce que vaut la donnée
            qu’elle résume.
          </>
        }
      />

      <div className="mb-6">
        <Alerte titre="Le jeu de données n’est pas encore consolidé">
          Les fiches sont structurées, sourcées au niveau des portails et cohérentes entre elles,
          mais le recoupement fait par fait sur les sources primaires reste à conduire. Concrètement :
          les barèmes et les calculs sont opérationnels, les valeurs qu’ils digèrent sont
          provisoires. Rien de ce qui est affiché ne doit être cité comme un fait établi sans
          vérification indépendante.
        </Alerte>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte className="p-5">
          <h2 className="text-[0.95rem] font-semibold tracking-tight text-ink">
            Répartition des {bilan.total} éléments factuels
          </h2>
          <ul className="mt-4 space-y-3">
            {bilan.parStatut.map(({ statut, nombre }) => {
              const meta = VERIFICATION[statut]
              return (
                <li key={statut}>
                  <div className="flex items-center justify-between gap-3">
                    <BadgeVerification verification={statut} />
                    <span className="tabular text-[0.85rem] font-semibold text-ink">
                      {nombre}{' '}
                      <span className="text-[0.75rem] font-normal text-muted">
                        ({pourcent(bilan.total > 0 ? (nombre / bilan.total) * 100 : 0)})
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-[0.76rem] leading-snug text-muted">{meta.explication}</p>
                </li>
              )
            })}
          </ul>
        </Carte>

        <Carte className="p-5">
          <BarresClassement
            titre="Éléments recoupés sur source primaire"
            soustitre="Part des faits, mesures, décisions et indicateurs passés au statut « vérifié », par fiche."
            donnees={bilan.parCandidat.map((ligne) => ({
              id: ligne.candidat.id,
              label: `${ligne.candidat.prenom} ${ligne.candidat.nom}`,
              valeur: ligne.part,
              valeurAffichee: `${ligne.verifies}/${ligne.total}`,
            }))}
            enteteValeur="Vérifiés"
            note="Cet indicateur est la mesure la plus honnête de la maturité de l’outil. Tant qu’il est bas, les notes sont des démonstrations de méthode."
          />
        </Carte>
      </div>

      <Carte className="mt-6">
        <EnteteCarte
          titre="Registre des sources"
          soustitre="Portails et rubriques référencés. Le lien profond vers la décision ou la déclaration précise est ajouté au moment de la vérification de chaque fait."
        />
        <div className="divide-y divide-[color:var(--pqc-line)]">
          {parType.map((groupe) => (
            <section key={groupe.type} className="p-4 sm:p-5">
              <h3 className="text-[0.8rem] font-semibold uppercase tracking-[0.06em] text-muted">
                {TYPES[groupe.type]}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {groupe.sources.map((source) => (
                  <li key={source.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[0.87rem] font-medium text-ink">{source.editeur}</span>
                    <span className="text-[0.82rem] text-ink-2">— {source.titre}</span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.78rem] text-accent hover:underline"
                      >
                        consulter ↗
                      </a>
                    ) : (
                      <Badge ton="neutre">à renseigner par candidat</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Carte>

      <Carte className="mt-6">
        <EnteteCarte
          titre="Comment un fait passe de « à vérifier » à « vérifié »"
          soustitre="La procédure appliquée, en quatre temps."
        />
        <ol className="divide-y divide-[color:var(--pqc-line)]">
          {[
            {
              titre: 'Retrouver la source primaire',
              texte:
                "Décision de justice sur Légifrance ou sur le site de la juridiction, déclaration sur le site de la HATVP, nomination au Journal officiel, scrutin sur le site de l’assemblée concernée. Un article de presse relatant un fait n’est pas une source primaire : c’est un point de départ.",
            },
            {
              titre: 'Vérifier la qualification exacte',
              texte:
                "Le chef retenu, la juridiction, la date, la peine, l’état des voies de recours. C’est là que se joue la différence entre « mis en examen », « condamné en première instance » et « condamné définitivement ».",
            },
            {
              titre: 'Recouper avec une seconde source indépendante',
              texte:
                "Deux rédactions distinctes, ou une rédaction et un document officiel. Un fait relayé par dix médias reprenant la même dépêche compte pour une source.",
            },
            {
              titre: 'Consigner le lien et basculer le statut',
              texte:
                "Le lien profond est ajouté au registre des sources, l’élément passe au statut « vérifié » et la date de revue de la fiche est mise à jour. Un fait qui ne franchit pas ces quatre étapes reste affiché avec sa mention « à vérifier », ou est retiré.",
            },
          ].map((etape, i) => (
            <li key={etape.titre} className="flex gap-4 p-4 sm:p-5">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-[0.8rem] font-bold text-ink"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-ink">{etape.titre}</h3>
                <p className="mt-1 text-[0.84rem] leading-relaxed text-ink-2">{etape.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      </Carte>
    </div>
  )
}
