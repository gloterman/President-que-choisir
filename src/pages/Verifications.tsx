import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EnTetePage } from '@/components/layout/EnTetePage'
import { Alerte, Badge, Bouton, Carte, Depliant, EnteteCarte } from '@/components/ui/base'
import { Pastille } from '@/components/candidat/Pastille'
import { candidats, candidatById } from '@/data/candidats'
import { PLATEFORMES, VERDICTS, type Verdict } from '@/data/factcheck'
import { SOURCES_VEILLE } from '@/data/sources-citations'
import { sourceById } from '@/data/sources'
import { themeById } from '@/data/referentiel'
import { useFactCheck } from '@/lib/factcheck/store'
import { bilanVeracite, ECHANTILLON_MINIMAL } from '@/lib/factcheck/veracite'
import { clsx, formatDate } from '@/lib/format'

type FiltreVerdict = Verdict | 'tous'

/** Citations affichées d'un coup ; le reste vient à la demande. */
const PAR_PAGE = 20

function horodatage(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function Verifications() {
  const {
    instantane,
    etat,
    erreur,
    origine,
    rejets,
    replisurInstantane,
    chargeLe,
    actualiser,
    actualisationEnCours,
  } = useFactCheck()
  const [candidatFiltre, setCandidatFiltre] = useState<string>('tous')
  const [verdictFiltre, setVerdictFiltre] = useState<FiltreVerdict>('tous')
  /**
   * Affichage progressif.
   *
   * L'instantané conserve jusqu'à 400 citations en attente. Les rendre toutes
   * d'un coup ferait une page qu'on ne parcourt pas : on en montre une page à
   * la fois, et le total reste affiché pour que personne ne croie la liste
   * plus courte qu'elle n'est.
   */
  const [affichees, setAffichees] = useState(PAR_PAGE)

  // Changer de filtre remet la liste à sa première page : rester à la
  // trentième d'une sélection qu'on vient de restreindre n'a pas de sens.
  const changerCandidat = (valeur: string) => {
    setCandidatFiltre(valeur)
    setAffichees(PAR_PAGE)
  }
  const changerVerdict = (valeur: FiltreVerdict) => {
    setVerdictFiltre(valeur)
    setAffichees(PAR_PAGE)
  }

  const verificationParCitation = useMemo(
    () => new Map(instantane.verifications.map((v) => [v.citationId, v])),
    [instantane.verifications],
  )

  const lignes = useMemo(() => {
    return instantane.citations
      .map((citation) => ({
        citation,
        verification: verificationParCitation.get(citation.id) ?? null,
        candidat: candidatById.get(citation.candidatId) ?? null,
      }))
      .filter((ligne) => ligne.candidat !== null)
      .filter((ligne) => candidatFiltre === 'tous' || ligne.citation.candidatId === candidatFiltre)
      .filter((ligne) => {
        if (verdictFiltre === 'tous') return true
        const verdict = ligne.verification?.verdict ?? 'en-attente'
        return verdict === verdictFiltre
      })
      .sort((a, b) => b.citation.datePublication.localeCompare(a.citation.datePublication))
  }, [instantane.citations, verificationParCitation, candidatFiltre, verdictFiltre])

  const compteurs = useMemo(() => {
    const total = instantane.citations.length
    const verifiees = instantane.verifications.filter((v) => v.verdict !== 'en-attente').length
    return { total, verifiees, enAttente: total - verifiees }
  }, [instantane])

  // Un candidat est « couvert » dès qu'au moins une de ses déclarations a été
  // relevée, quelle que soit la source : le compte social n'est plus le seul
  // point d'entrée depuis que la collecte s'appuie sur l'open data parlementaire.
  const candidatsCouverts = candidats.filter((c) =>
    instantane.citations.some((cit) => cit.candidatId === c.id),
  )
  const candidatsSansSource = candidats.filter(
    (c) => c.comptesSociaux.every((s) => !PLATEFORMES[s.plateforme].gratuite),
  )

  return (
    <div>
      <EnTetePage
        titre="Vérification des déclarations"
        chapo={
          <>
            Les déclarations publiques des candidats sont collectées depuis des sources ouvertes et
            gratuites — comptes rendus de séance et réseaux sociaux à lecture libre — puis
            confrontées aux données disponibles. Chaque verdict affiche son raisonnement et ses
            sources, et renvoie à l’original pour que vous puissiez lire la déclaration entière.
          </>
        }
        actions={
          <Bouton
            variante="secondaire"
            onClick={actualiser}
            disabled={actualisationEnCours}
            title="Recharger les vérifications publiées"
          >
            <span aria-hidden="true" className={clsx(actualisationEnCours && 'animate-spin')}>
              ↻
            </span>
            {actualisationEnCours ? 'Actualisation…' : 'Actualiser'}
          </Bouton>
        }
      />

      {/* Bandeau d'état : d'où viennent les données et de quand elles datent. */}
      <Carte className="mb-6 p-4">
        <dl className="grid gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Dernière collecte
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {instantane.genereLe ? formatDate(instantane.genereLe.slice(0, 10)) : 'jamais'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Chargé dans le navigateur
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {chargeLe ? `à ${horodatage(chargeLe)}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Origine
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {origine === 'direct' ? 'service de collecte' : 'instantané publié'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Citations
            </dt>
            <dd className="tabular mt-0.5 text-[0.85rem] text-ink">
              {compteurs.verifiees} vérifiée(s) · {compteurs.enAttente} en attente
            </dd>
          </div>
        </dl>
        {replisurInstantane && (
          <p className="mt-3 border-t border-line pt-3 text-[0.78rem] text-muted">
            Le service de collecte n’a pas répondu : l’instantané publié avec le site a pris le
            relais.
          </p>
        )}
        {rejets > 0 && (
          <p className="mt-3 border-t border-line pt-3 text-[0.78rem] text-muted">
            {rejets} entrée(s) écartée(s) par la validation, parce qu’elles ne respectaient pas le
            format attendu.
          </p>
        )}
      </Carte>

      {etat === 'chargement' && (
        <p className="py-12 text-center text-[0.88rem] text-muted">Chargement des vérifications…</p>
      )}

      {etat === 'erreur' && (
        <Alerte titre="Les vérifications n’ont pas pu être chargées" ton="serious" icone="≈">
          {erreur} Le reste du site fonctionne normalement : seules les vérifications sont
          indisponibles.
        </Alerte>
      )}

      {etat === 'pret' && compteurs.total === 0 && (
        <Alerte titre="Aucune citation publiée pour le moment" ton="neutre" icone="·">
          <p>
            Le dispositif est en place mais la base est vide : rien n’est affiché tant qu’aucune
            déclaration n’a été collectée et vérifiée. Aucune citation d’exemple n’est fournie —
            afficher une fausse citation attribuée à une personne réelle serait exactement ce que
            cet outil cherche à combattre.
          </p>
          <p className="mt-2">
            Pour alimenter la page, l’exploitant lance la collecte avec un jeton d’API X, puis
            renseigne les verdicts. La marche à suivre est décrite dans la documentation du dépôt.
          </p>
        </Alerte>
      )}

      {etat === 'pret' && compteurs.total > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                Candidat
              </p>
              <select
                value={candidatFiltre}
                onChange={(e) => changerCandidat(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.82rem] text-ink"
                aria-label="Filtrer par candidat"
              >
                <option value="tous">Tous les candidats</option>
                {candidatsCouverts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.prenom} {c.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                Verdict
              </p>
              <select
                value={verdictFiltre}
                onChange={(e) => changerVerdict(e.target.value as FiltreVerdict)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.82rem] text-ink"
                aria-label="Filtrer par verdict"
              >
                <option value="tous">Tous les verdicts</option>
                {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
                  <option key={v} value={v}>
                    {VERDICTS[v].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ol className="space-y-4">
            {lignes.slice(0, affichees).map(({ citation, verification, candidat }) => {
              const verdict = verification?.verdict ?? 'en-attente'
              const meta = VERDICTS[verdict]
              return (
                <Carte as="li" key={citation.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Pastille candidat={candidat!} taille="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        <Link to={`/candidats/${candidat!.id}`} className="hover:underline">
                          {candidat!.prenom} {candidat!.nom}
                        </Link>
                      </p>
                      <p className="text-[0.75rem] text-muted">
                        {formatDate(citation.datePublication.slice(0, 10))}
                        {citation.contexte ? ` · ${citation.contexte}` : ''}
                      </p>
                    </div>
                    <Badge ton="neutre" titre={PLATEFORMES[citation.plateforme].explication}>
                      {PLATEFORMES[citation.plateforme].court}
                    </Badge>
                    {citation.porteParole === 'parti' && (
                      <Badge
                        ton="neutre"
                        icone="§"
                        titre="Publication du mouvement, et non parole personnelle du candidat."
                      >
                        Communiqué du mouvement
                      </Badge>
                    )}
                    <Badge ton={meta.ton} icone={meta.icone} titre={meta.explication}>
                      {meta.label}
                    </Badge>
                  </div>

                  {/* Texte publié par un tiers : affiché comme donnée, jamais interprété. */}
                  <blockquote className="mt-3 border-l-2 border-line-strong pl-3 text-[0.9rem] leading-relaxed text-ink">
                    {citation.texte}
                  </blockquote>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[0.78rem] text-accent hover:underline"
                    >
                      {citation.plateforme === 'site-officiel'
                        ? 'Voir la publication d’origine ↗'
                        : 'Voir le message d’origine ↗'}
                    </a>
                    {citation.themeId && (
                      <span className="text-[0.75rem] text-muted">
                        {themeById.get(citation.themeId)?.nom}
                      </span>
                    )}
                  </div>

                  {verification ? (
                    <div className="mt-4 rounded-xl bg-surface-2 p-4">
                      <p className="text-[0.85rem] font-semibold text-ink">{verification.constat}</p>
                      <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
                        {verification.explication}
                      </p>
                      <Depliant resume="Sources et auteur de la vérification" className="mt-3">
                        <ul className="list-disc space-y-1 pl-5">
                          {verification.sourceIds.map((id) => {
                            const source = sourceById.get(id)
                            if (!source) return null
                            return (
                              <li key={id}>
                                {source.url ? (
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline"
                                  >
                                    {source.editeur} — {source.titre}
                                  </a>
                                ) : (
                                  `${source.editeur} — ${source.titre}`
                                )}
                              </li>
                            )
                          })}
                          {verification.liens.map((lien) => (
                            <li key={lien.url}>
                              <a
                                href={lien.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {lien.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-muted">
                          Vérifié par {verification.verifiePar}, le{' '}
                          {formatDate(verification.dateVerification.slice(0, 10))}.
                          {verification.reprise && (
                            <>
                              {' '}
                              Reprise d’une vérification publiée par{' '}
                              <a
                                href={verification.reprise.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {verification.reprise.editeur}
                              </a>
                              .
                            </>
                          )}
                        </p>
                      </Depliant>
                    </div>
                  ) : (
                    <p className="mt-3 text-[0.78rem] text-muted">
                      Citation collectée, pas encore examinée. Elle est affichée pour que la
                      sélection soit visible : ne rien montrer des messages retenus mais non traités
                      reviendrait à cacher le tri.
                    </p>
                  )}
                </Carte>
              )
            })}
          </ol>

          {lignes.length > affichees && (
            <div className="mt-6 text-center">
              <Bouton onClick={() => setAffichees((n) => n + PAR_PAGE)}>
                Afficher {Math.min(PAR_PAGE, lignes.length - affichees)} citation(s) de plus
              </Bouton>
              <p className="mt-2 text-[0.8rem] text-muted">
                {affichees} sur {lignes.length} affichées.
              </p>
            </div>
          )}

          {lignes.length === 0 && (
            <p className="py-12 text-center text-[0.88rem] text-muted">
              Aucune citation ne correspond à ces filtres.
            </p>
          )}
        </>
      )}

      {instantane.veille.length > 0 && (
        <Carte className="mt-8">
          <EnteteCarte
            titre="Vérifications publiées ailleurs"
            soustitre="Relevées par flux RSS chez les rédactions spécialisées. Ce sont des pistes, pas des verdicts de ce site."
          />
          <ul className="divide-y divide-[color:var(--pqc-line)]">
            {instantane.veille.slice(0, 25).map((publication) => (
              <li key={publication.id} className="p-4">
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.85rem] font-medium leading-snug text-accent hover:underline"
                >
                  {publication.titre} ↗
                </a>
                <p className="mt-1 text-[0.75rem] text-muted">
                  {publication.editeur}
                  {publication.datePublication
                    ? ` · ${formatDate(publication.datePublication.slice(0, 10))}`
                    : ''}
                  {publication.candidatsPressentis.length > 0 &&
                    ` · mentionne ${publication.candidatsPressentis
                      .map((id) => candidatById.get(id)?.nom)
                      .filter(Boolean)
                      .join(', ')}`}
                </p>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-4 py-3 text-[0.75rem] leading-relaxed text-muted">
            Seuls le titre et le lien sont repris, avec attribution : le texte des articles
            appartient à leurs auteurs. Rattacher une de ces publications à une citation et à un
            verdict reste un travail humain — un titre ne dit pas de façon fiable qui a dit quoi ni
            ce qui a été conclu.
          </p>
        </Carte>
      )}

      <Carte className="mt-8">
        <EnteteCarte
          titre="Comment cette page fonctionne"
          soustitre="D’où viennent les citations, et pourquoi la collecte n’a pas lieu dans votre navigateur."
        />
        <div className="space-y-3 p-4 text-[0.85rem] leading-relaxed text-ink-2 sm:p-5">
          <p>
            La page charge les vérifications à son ouverture, et le bouton « Actualiser » les
            recharge sans passer par le cache. Ce que vous voyez vient d’un fichier publié avec le
            site, ou d’un service de collecte si l’exploitant en a mis un en place.
          </p>
          <p>
            Les déclarations viennent de sources <strong className="font-medium text-ink">publiques,
            gratuites et sans clé d’accès</strong> : les flux de syndication des sites officiels des
            candidats et de leurs mouvements, et les réseaux sociaux dont la lecture est ouverte,
            Bluesky en particulier. Ce sont des paroles publiées par les intéressés eux-mêmes, avec
            un lien vers la publication d’origine.
          </p>
          <p>
            Une distinction est faite et affichée : un communiqué de mouvement n’est pas la parole
            personnelle du candidat, même lorsqu’il en porte la ligne. Chaque citation indique
            laquelle des deux vous lisez.
          </p>
          <p>
            La collecte a lieu en amont plutôt que dans votre navigateur, pour deux raisons qui
            valent quelle que soit la source : la plupart de ces services ne renvoient pas les
            en-têtes qui autoriseraient une page web à lire leur réponse, et une collecte par
            visiteur referait le même travail des milliers de fois pour un contenu identique.
          </p>
          <p>
            X n’est pas utilisé par défaut : son API exige un jeton et facture chaque lecture depuis
            février 2026. La source reste disponible pour qui y a souscrit, mais rien n’en dépend.
          </p>
          <p>
            Les verdicts ne sont pas automatiques. Une affirmation politique se vérifie en allant
            chercher la donnée et en la lisant — c’est un travail humain, et c’est pourquoi une
            citation peut rester longtemps « en attente ». Pour l’outiller, les flux des rédactions
            spécialisées sont relevés en parallèle —{' '}
            {SOURCES_VEILLE.map((s) => `${s.nom} (${s.editeur})`).join(', ')} — mais leurs articles
            servent de pistes, jamais de verdicts repris tels quels.
          </p>
          {candidatsSansSource.length > 0 && (
            <p>
              La couverture par les réseaux sociaux est partielle, et ce n’est pas un défaut de
              l’outil : la plupart des responsables politiques français publient sur X, dont la
              lecture est payante. {candidatsSansSource.length} des {candidats.length} candidats
              n’ont donc aucun compte à lecture gratuite confirmé. Ils restent couverts par les
              comptes rendus de séance s’ils exercent un mandat parlementaire — une source à la fois
              plus fiable et plus durable, puisqu’une intervention en séance ne s’efface pas.
            </p>
          )}
          <p className="text-muted">
            Le critère « rapport aux faits » du classement est alimenté par ces vérifications, selon
            le barème publié dans la{' '}
            <Link to="/methodologie" className="font-medium text-accent hover:underline">
              méthodologie
            </Link>
            . En dessous de {ECHANTILLON_MINIMAL} vérifications pour un candidat, aucune note n’est
            produite : le critère reste non documenté plutôt que calculé sur un échantillon trop
            petit.
          </p>
        </div>
      </Carte>

      {compteurs.total > 0 && (
        <Carte className="mt-6">
          <EnteteCarte
            titre="Effet sur le critère « rapport aux faits »"
            soustitre={`Une note n’est produite qu’à partir de ${ECHANTILLON_MINIMAL} vérifications.`}
          />
          <ul className="divide-y divide-[color:var(--pqc-line)]">
            {candidatsCouverts.map((candidat) => {
              const bilan = bilanVeracite(instantane, candidat.id)
              return (
                <li key={candidat.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Pastille candidat={candidat} taille="petite" />
                  <span className="min-w-0 flex-1 text-[0.85rem] font-medium text-ink">
                    {candidat.prenom} {candidat.nom}
                  </span>
                  {bilan && bilan.effectif >= ECHANTILLON_MINIMAL ? (
                    <span className="tabular text-[0.85rem] font-semibold text-ink">
                      {bilan.note}
                      <span className="text-[0.72rem] font-normal text-muted">
                        /100 · {bilan.effectif} vérifications
                      </span>
                    </span>
                  ) : (
                    <span className="text-[0.78rem] text-muted">
                      {bilan ? `${bilan.effectif} vérification(s)` : 'aucune vérification'} —
                      échantillon insuffisant
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </Carte>
      )}
    </div>
  )
}
