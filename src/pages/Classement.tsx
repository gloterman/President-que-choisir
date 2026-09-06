import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Bouton, Carte, Depliant, EnteteCarte } from '@/components/ui/base'
import { BarresClassement } from '@/components/charts/BarresClassement'
import { Radar } from '@/components/charts/Radar'
import { Jauge } from '@/components/charts/Jauge'
import { BandeauDonnees } from '@/components/BandeauDonnees'
import { Pastille } from '@/components/candidat/Pastille'
import { critereById } from '@/data/criteres'
import { themeById } from '@/data/referentiel'
import { COLONNE_AFFINITE, METHODES } from '@/lib/scoring'
import { useClassement } from '@/hooks/useClassement'
import { usePreferences } from '@/lib/store'
import { pourcent } from '@/lib/format'
import type { MethodeAgregation } from '@/data/types'

const VERDICTS = {
  robuste: {
    ton: 'good' as const,
    icone: '✓',
    titre: 'Classement robuste',
    texte:
      "Le premier reste premier dans la grande majorité des variantes de pondération testées. Votre tête de classement ne tient pas à un réglage particulier.",
  },
  nuance: {
    ton: 'warning' as const,
    icone: '!',
    titre: 'Classement à nuancer',
    texte:
      "Le premier change dans une part notable des simulations. Les candidats de tête sont proches : traitez-les comme un groupe plutôt que comme un ordre.",
  },
  fragile: {
    ton: 'serious' as const,
    icone: '≈',
    titre: 'Classement fragile',
    texte:
      "Une variation modeste de vos pondérations suffit à changer le vainqueur. Ce que ce classement établit, c’est un peloton de tête — pas un gagnant.",
  },
}

export function Classement() {
  const classement = useClassement()
  const { preferences, basculerExclu, nbReponses } = usePreferences()
  const { resultats, sensibilite, ecartes, exclus } = classement

  const premier = resultats[0]
  // Rangs occupés par plus d'un candidat : ce sont eux qu'il faut annoter,
  // sans quoi deux « 1 » consécutifs passent pour un défaut d'affichage.
  const exAequo = useMemo(() => {
    const compte = new Map<number, number>()
    for (const r of resultats) compte.set(r.rang, (compte.get(r.rang) ?? 0) + 1)
    return new Set([...compte].filter(([, n]) => n > 1).map(([rang]) => rang))
  }, [resultats])
  const verdict = VERDICTS[sensibilite.verdict]
  const methodes = Object.keys(METHODES) as MethodeAgregation[]

  const criteresPonderes = premier
    ? premier.contributions
        .filter((c) => c.critereId !== COLONNE_AFFINITE && c.poidsNormalise > 0.01)
        .map((c) => critereById.get(c.critereId)!)
        .filter(Boolean)
    : []

  const trioTete = resultats.slice(0, 3)

  return (
    <div>
      <EnTetePage
        surtitre="Étape 3 sur 3"
        titre="Votre classement"
        chapo={
          <>
            Construit à partir de vos {nbReponses} réponses et de vos pondérations, avec la méthode{' '}
            « {METHODES[preferences.methode].nom} ». Il est recalculé en direct : revenez sur{' '}
            <Link to="/criteres" className="font-medium text-accent hover:underline">
              vos critères
            </Link>{' '}
            pour voir l’effet de chaque réglage.
          </>
        }
        actions={
          <Bouton variante="secondaire" taille="petite" onClick={() => window.print()}>
            Imprimer
          </Bouton>
        }
      />

      <div className="mb-6">
        <BandeauDonnees />
      </div>

      {resultats.length === 0 ? (
        <Alerte titre="Aucun candidat ne franchit vos seuils" ton="serious" icone="≈">
          Vos seuils rédhibitoires écartent tout le monde. C’est une information en soi, mais pour
          obtenir un classement il faut en abaisser au moins un sur la page{' '}
          <Link to="/criteres" className="font-medium text-accent hover:underline">
            Mes critères
          </Link>
          .
        </Alerte>
      ) : (
        <div className="space-y-6">
          {classement.classementIndetermine && (
            <Alerte titre="Ce classement n’ordonne rien" ton="serious" icone="=">
              Tous les candidats obtiennent le même score : aucun critère n’est pondéré et le
              questionnaire ne départage pas non plus. Les candidats sont donc affichés{' '}
              <strong>ex æquo</strong>, par ordre alphabétique — cet ordre ne veut rien dire.{' '}
              <Link to="/criteres" className="font-medium text-accent hover:underline">
                Donner du poids à au moins un critère
              </Link>{' '}
              ou répondre au questionnaire fera apparaître un ordre qui, lui, en aura un.
            </Alerte>
          )}

          {nbReponses === 0 && (
            <Alerte titre="Le questionnaire n’a pas encore été rempli">
              L’affinité programmatique est neutralisée à 50 % pour tout le monde : le classement ne
              reflète donc que les critères de notation.{' '}
              <Link to="/questionnaire" className="font-medium text-accent hover:underline">
                Répondre au questionnaire
              </Link>{' '}
              change généralement l’ordre du tout au tout.
            </Alerte>
          )}

          {/* Tête de classement : un seul chiffre mis en avant, pas huit couleurs. */}
          <Carte className="overflow-hidden">
            <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex items-start gap-4">
                <Pastille candidat={premier.candidat} taille="grande" />
                <div className="min-w-0">
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-accent">
                    En tête de votre classement
                  </p>
                  <h2 className="mt-1 text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">
                    {premier.candidat.prenom} {premier.candidat.nom}
                  </h2>
                  <p className="mt-1 text-[0.85rem] text-ink-2">{premier.candidat.parti}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {premier.pointsForts.slice(0, 3).map((contribution) => (
                      <Badge key={contribution.critereId} ton="neutre">
                        {contribution.critereId === COLONNE_AFFINITE
                          ? 'Accord programmatique'
                          : (critereById.get(contribution.critereId)?.nomCourt ?? '')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="md:text-right">
                <p className="text-[0.78rem] text-ink-2">Score pondéré</p>
                <p className="text-[3.2rem] font-semibold leading-none tracking-tight text-ink">
                  {Math.round(premier.scoreFinal)}
                </p>
                <p className="mt-1 text-[0.78rem] text-muted">
                  sur 100 · en tête dans {pourcent(sensibilite.stabiliteVainqueur * 100)} des
                  simulations
                </p>
              </div>
            </div>
          </Carte>

          <Alerte titre={verdict.titre} ton={verdict.ton} icone={verdict.icone}>
            {verdict.texte} Sur {sensibilite.tirages} tirages où vos pondérations sont légèrement
            perturbées, {premier.candidat.nom} arrive en tête dans{' '}
            {pourcent(sensibilite.stabiliteVainqueur * 100)} des cas.
          </Alerte>

          <div className="grid gap-6 lg:grid-cols-2">
            <Carte className="p-5">
              <BarresClassement
                titre="Score final pondéré"
                soustitre={`Méthode « ${METHODES[preferences.methode].nom} », affinité programmatique comptée pour ${Math.round(classement.partProgramme * 100)} %.`}
                donnees={resultats.map((r) => ({
                  id: r.candidat.id,
                  label: `${r.candidat.prenom} ${r.candidat.nom}`,
                  valeur: r.scoreFinal,
                  detail: `${r.candidat.partiCourt} · affinité ${pourcent(r.affinite.score)}`,
                }))}
                enteteValeur="Score /100"
                note="Une seule série, donc une seule couleur : la longueur de la barre porte déjà l’information."
              />
            </Carte>

            <Carte className="p-5">
              <BarresClassement
                titre="Probabilité d’arriver en tête"
                soustitre={`${sensibilite.tirages} tirages avec des pondérations légèrement perturbées autour des vôtres.`}
                donnees={[...sensibilite.resultats]
                  .sort((a, b) => b.probabiliteTete - a.probabiliteTete)
                  .map((r) => {
                    const candidat = resultats.find((x) => x.candidat.id === r.alternativeId)!.candidat
                    return {
                      id: r.alternativeId,
                      label: `${candidat.prenom} ${candidat.nom}`,
                      valeur: r.probabiliteTete * 100,
                      valeurAffichee: pourcent(r.probabiliteTete * 100),
                      detail: `rang moyen ${r.rangMoyen.toFixed(1)} · de ${r.rangMin} à ${r.rangMax}`,
                    }
                  })}
                unite=""
                enteteValeur="Probabilité"
                note="C’est l’indicateur le plus utile de la page : il dit si votre premier est vraiment premier, ou seulement premier ex æquo."
              />
            </Carte>
          </div>

          {trioTete.length >= 2 && criteresPonderes.length >= 3 && (
            <Carte className="p-5">
              <Radar
                titre="Profil comparé des trois premiers"
                soustitre="Notes sur les critères auxquels vous avez donné un poids non nul."
                axes={criteresPonderes.map((c) => c.nomCourt)}
                series={trioTete.map((r) => ({
                  id: r.candidat.id,
                  label: `${r.candidat.prenom} ${r.candidat.nom}`,
                  valeurs: criteresPonderes.map(
                    (critere) =>
                      r.contributions.find((c) => c.critereId === critere.id)?.note ?? 50,
                  ),
                }))}
                note="Trois séries au maximum : au-delà, deux couleurs superposées deviennent indiscernables pour une partie des lecteurs. Le tableau sous la figure porte toutes les valeurs."
              />
            </Carte>
          )}

          <Carte>
            <EnteteCarte
              titre="Le classement change-t-il selon la méthode ?"
              soustitre="Rang obtenu avec chacune des quatre règles d’agrégation, sur les mêmes données et les mêmes poids."
            />
            <div className="pqc-scroll-x">
              <table className="w-full border-collapse text-left text-[0.82rem]">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th scope="col" className="px-4 py-2.5 font-semibold text-ink-2">
                      Candidat
                    </th>
                    {methodes.map((methode) => (
                      <th
                        key={methode}
                        scope="col"
                        className="px-3 py-2.5 text-center font-semibold text-ink-2 whitespace-nowrap"
                        title={METHODES[methode].resume}
                      >
                        {METHODES[methode].nom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resultats.map((resultat) => (
                    <tr key={resultat.candidat.id} className="border-b border-line last:border-0">
                      <th scope="row" className="px-4 py-2 font-medium text-ink whitespace-nowrap">
                        {resultat.candidat.prenom} {resultat.candidat.nom}
                      </th>
                      {methodes.map((methode) => {
                        const rang = resultat.rangsParMethode[methode]
                        return (
                          <td key={methode} className="tabular px-3 py-2 text-center text-ink-2">
                            <span
                              className={
                                rang === 1 ? 'font-semibold text-ink' : undefined
                              }
                            >
                              {rang}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-4 py-3 text-[0.78rem] leading-relaxed text-ink-2">
              Concordance moyenne entre méthodes :{' '}
              <strong className="font-semibold text-ink">
                {pourcent(((classement.concordanceMethodes + 1) / 2) * 100)}
              </strong>
              . Une colonne qui s’écarte des autres n’est pas une erreur : elle indique un profil
              déséquilibré, que certaines méthodes pénalisent et d’autres non.
            </p>
          </Carte>

          <section aria-labelledby="detail">
            <h2 id="detail" className="mb-4 text-[1.35rem] font-semibold tracking-tight text-ink">
              D’où vient chaque score
            </h2>
            <ol className="space-y-3">
              {resultats.map((resultat) => {
                const contributions = [...resultat.contributions]
                  .filter((c) => c.poidsNormalise > 0.005)
                  .sort((a, b) => b.apport - a.apport)
                return (
                  <Carte as="li" key={resultat.candidat.id} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="tabular text-[1.1rem] font-semibold text-muted"
                        // Un rang partagé est signalé : sans cela, deux « 1 » à
                        // la suite se lisent comme une erreur d'affichage.
                        title={exAequo.has(resultat.rang) ? 'Ex æquo' : undefined}
                      >
                        {resultat.rang}
                        {exAequo.has(resultat.rang) && (
                          <span className="ml-0.5 text-[0.7rem] font-normal">ex æq.</span>
                        )}
                      </span>
                      <Pastille candidat={resultat.candidat} taille="petite" />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                          <Link to={`/candidats/${resultat.candidat.id}`} className="hover:underline">
                            {resultat.candidat.prenom} {resultat.candidat.nom}
                          </Link>
                        </h3>
                        <p className="text-[0.78rem] text-ink-2">{resultat.candidat.partiCourt}</p>
                      </div>
                      <div className="text-right">
                        <p className="tabular text-[1.3rem] font-semibold leading-none text-ink">
                          {Math.round(resultat.scoreFinal)}
                        </p>
                        <p className="text-[0.72rem] text-muted">score /100</p>
                      </div>
                      <Bouton
                        variante="discret"
                        taille="petite"
                        onClick={() => basculerExclu(resultat.candidat.id)}
                        title="Retirer ce candidat du classement"
                      >
                        Écarter
                      </Bouton>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <Jauge
                        valeur={resultat.affinite.score}
                        label="Accord programmatique"
                        palier={`${resultat.affinite.nbPrisesEnCompte} proposition(s) prise(s) en compte`}
                      />
                      <Jauge
                        valeur={resultat.scoreCriteres}
                        label="Note pondérée sur vos critères"
                        palier={`${contributions.filter((c) => c.critereId !== COLONNE_AFFINITE).length} critère(s) actif(s)`}
                      />
                    </div>

                    <Depliant resume="Décomposition du score, critère par critère" className="mt-4">
                      <div className="pqc-scroll-x">
                        <table className="w-full border-collapse text-left text-[0.8rem]">
                          <thead>
                            <tr className="border-b border-line">
                              <th scope="col" className="py-1.5 pr-3 font-semibold text-muted">
                                Critère
                              </th>
                              <th scope="col" className="py-1.5 px-2 text-right font-semibold text-muted">
                                Note
                              </th>
                              <th scope="col" className="py-1.5 px-2 text-right font-semibold text-muted">
                                Poids
                              </th>
                              <th scope="col" className="py-1.5 pl-2 text-right font-semibold text-muted">
                                Apport
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {contributions.map((contribution) => {
                              const critere = critereById.get(contribution.critereId)
                              return (
                                <tr key={contribution.critereId} className="border-b border-line last:border-0">
                                  <td className="py-1.5 pr-3 text-ink">
                                    {contribution.critereId === COLONNE_AFFINITE
                                      ? 'Accord programmatique'
                                      : (critere?.nom ?? contribution.critereId)}
                                    {contribution.manquante && (
                                      <span className="ml-1.5 text-[0.72rem] text-muted">
                                        (non documenté, valeur neutre)
                                      </span>
                                    )}
                                  </td>
                                  <td className="tabular py-1.5 px-2 text-right text-ink">
                                    {Math.round(contribution.note)}
                                  </td>
                                  <td className="tabular py-1.5 px-2 text-right text-ink-2">
                                    {pourcent(contribution.poidsNormalise * 100)}
                                  </td>
                                  <td className="tabular py-1.5 pl-2 text-right font-medium text-ink">
                                    {contribution.apport.toFixed(1)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-muted">
                        L’apport est le produit de la note par le poids. La somme des apports donne
                        le score de la méthode « somme pondérée » ; les trois autres méthodes
                        combinent ces mêmes notes autrement, ce tableau reste donc une lecture
                        indicative pour elles.
                      </p>
                    </Depliant>

                    {resultat.affinite.desaccordsMajeurs.length > 0 && (
                      <Depliant
                        resume={`${resultat.affinite.desaccordsMajeurs.length} désaccord(s) sur des sujets que vous jugez importants`}
                        className="mt-3"
                      >
                        <ul className="list-disc space-y-1 pl-5">
                          {resultat.affinite.desaccordsMajeurs.slice(0, 5).map((desaccord) => (
                            <li key={desaccord.propositionId}>
                              {themeById.get(desaccord.themeId)?.nom} — accord{' '}
                              {pourcent(desaccord.accord * 100)}
                            </li>
                          ))}
                        </ul>
                      </Depliant>
                    )}
                  </Carte>
                )
              })}
            </ol>
          </section>

          {(ecartes.length > 0 || exclus.length > 0) && (
            <Carte>
              <EnteteCarte
                titre="Candidats hors classement"
                soustitre="Écartés par un seuil rédhibitoire, ou retirés par vous."
              />
              <ul className="divide-y divide-[color:var(--pqc-line)]">
                {ecartes.map((ecarte) => (
                  <li key={ecarte.candidat.id} className="flex flex-wrap items-center gap-3 p-4">
                    <Pastille candidat={ecarte.candidat} taille="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        {ecarte.candidat.prenom} {ecarte.candidat.nom}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-2">
                        {ecarte.motifs
                          .map(
                            (motif) =>
                              `${critereById.get(motif.critereId)?.nom ?? motif.critereId} : ${Math.round(motif.note)}/100, sous votre seuil de ${motif.seuil}`,
                          )
                          .join(' · ')}
                      </p>
                    </div>
                    <Badge ton="serious" icone="✕">
                      Seuil non atteint
                    </Badge>
                  </li>
                ))}
                {exclus.map((candidat) => (
                  <li key={candidat.id} className="flex flex-wrap items-center gap-3 p-4">
                    <Pastille candidat={candidat} taille="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        {candidat.prenom} {candidat.nom}
                      </p>
                      <p className="mt-0.5 text-[0.78rem] text-ink-2">Retiré manuellement.</p>
                    </div>
                    <Bouton variante="secondaire" taille="petite" onClick={() => basculerExclu(candidat.id)}>
                      Réintégrer
                    </Bouton>
                  </li>
                ))}
              </ul>
            </Carte>
          )}
        </div>
      )}
    </div>
  )
}
