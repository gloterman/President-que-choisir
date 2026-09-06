import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Notice, Badge, Button, Card, Disclosure, CardHeader } from '@/components/ui/base'
import { Chip } from '@/components/candidate/Chip'
import { candidates, candidateById } from '@/data/candidates'
import { PLATFORMS, VERDICTS, type Verdict } from '@/data/factcheck'
import { WATCH_SOURCES } from '@/data/collection-sources'
import { sourceById } from '@/data/sources'
import { themeById } from '@/data/questionnaire'
import { useFactCheck } from '@/lib/factcheck/store'
import { accuracyReport, MINIMUM_SAMPLE } from '@/lib/factcheck/accuracy'
import { clsx, formatDate } from '@/lib/format'

type VerdictFilter = Verdict | 'tous'

/** Citations affichées d'un coup ; le reste vient à la demande. */
const PER_PAGE = 20

function timestamp(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function Verifications() {
  const {
    snapshot,
    state,
    error,
    origin,
    rejected,
    fellBackToSnapshot,
    loadedAt,
    refresh,
    refreshInProgress,
  } = useFactCheck()
  const [candidatFiltre, setCandidatFiltre] = useState<string>('tous')
  const [verdictFiltre, setVerdictFiltre] = useState<VerdictFilter>('tous')
  /**
   * Affichage progressif.
   *
   * L'instantané conserve jusqu'à 400 citations en attente. Les rendre toutes
   * d'un coup ferait une page qu'on ne parcourt pas : on en montre une page à
   * la fois, et le total reste affiché pour que personne ne croie la liste
   * plus courte qu'elle n'est.
   */
  const [affichees, setAffichees] = useState(PER_PAGE)

  // Changer de filtre remet la liste à sa première page : rester à la
  // trentième d'une sélection qu'on vient de restreindre n'a pas de sens.
  const changeCandidate = (value: string) => {
    setCandidatFiltre(value)
    setAffichees(PER_PAGE)
  }
  const changeVerdict = (value: VerdictFilter) => {
    setVerdictFiltre(value)
    setAffichees(PER_PAGE)
  }

  const verificationByQuote = useMemo(
    () => new Map(snapshot.verifications.map((v) => [v.quoteId, v])),
    [snapshot.verifications],
  )

  const rows = useMemo(() => {
    return snapshot.quotes
      .map((quote) => ({
        quote,
        verification: verificationByQuote.get(quote.id) ?? null,
        candidate: candidateById.get(quote.candidateId) ?? null,
      }))
      .filter((row) => row.candidate !== null)
      .filter((row) => candidatFiltre === 'tous' || row.quote.candidateId === candidatFiltre)
      .filter((row) => {
        if (verdictFiltre === 'tous') return true
        const verdict = row.verification?.verdict ?? 'en-attente'
        return verdict === verdictFiltre
      })
      .sort((a, b) => b.quote.publishedAt.localeCompare(a.quote.publishedAt))
  }, [snapshot.quotes, verificationByQuote, candidatFiltre, verdictFiltre])

  const counters = useMemo(() => {
    const total = snapshot.quotes.length
    const verified = snapshot.verifications.filter((v) => v.verdict !== 'en-attente').length
    return { total, verified, pending: total - verified }
  }, [snapshot])

  // Un candidat est « couvert » dès qu'au moins une de ses déclarations a été
  // relevée, quelle que soit la source : le compte social n'est plus le seul
  // point d'entrée depuis que la collecte s'appuie sur l'open data parlementaire.
  const coveredCandidates = candidates.filter((c) =>
    snapshot.quotes.some((quote) => quote.candidateId === c.id),
  )
  const candidatesWithoutSource = candidates.filter(
    (c) => c.socialAccounts.every((s) => !PLATFORMS[s.platform].free),
  )

  return (
    <div>
      <PageHeader
        title="Vérification des déclarations"
        summary={
          <>
            Les déclarations publiques des candidats sont collectées depuis des sources ouvertes et
            gratuites — comptes rendus de séance et réseaux sociaux à lecture libre — puis
            confrontées aux données disponibles. Chaque verdict affiche son raisonnement et ses
            sources, et renvoie à l’original pour que vous puissiez lire la déclaration entière.
          </>
        }
        actions={
          <Button
            variant="secondaire"
            onClick={refresh}
            disabled={refreshInProgress}
            title="Recharger les vérifications publiées"
          >
            <span aria-hidden="true" className={clsx(refreshInProgress && 'animate-spin')}>
              ↻
            </span>
            {refreshInProgress ? 'Actualisation…' : 'Actualiser'}
          </Button>
        }
      />

      {/* Bandeau d'état : d'où viennent les données et de quand elles datent. */}
      <Card className="mb-6 p-4">
        <dl className="grid gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Dernière collecte
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {snapshot.generatedAt ? formatDate(snapshot.generatedAt.slice(0, 10)) : 'jamais'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Chargé dans le navigateur
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {loadedAt ? `à ${timestamp(loadedAt)}` : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Origine
            </dt>
            <dd className="mt-0.5 text-[0.85rem] text-ink">
              {origin === 'direct' ? 'service de collecte' : 'instantané publié'}
            </dd>
          </div>
          <div>
            <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
              Citations
            </dt>
            <dd className="tabular mt-0.5 text-[0.85rem] text-ink">
              {counters.verified} vérifiée(s) · {counters.pending} en attente
            </dd>
          </div>
        </dl>
        {fellBackToSnapshot && (
          <p className="mt-3 border-t border-line pt-3 text-[0.78rem] text-muted">
            Le service de collecte n’a pas répondu : l’instantané publié avec le site a pris le
            relais.
          </p>
        )}
        {rejected > 0 && (
          <p className="mt-3 border-t border-line pt-3 text-[0.78rem] text-muted">
            {rejected} entrée(s) écartée(s) par la validation, parce qu’elles ne respectaient pas le
            format attendu.
          </p>
        )}
      </Card>

      {state === 'chargement' && (
        <p className="py-12 text-center text-[0.88rem] text-muted">Chargement des vérifications…</p>
      )}

      {state === 'erreur' && (
        <Notice title="Les vérifications n’ont pas pu être chargées" tone="serious" icon="≈">
          {error} Le reste du site fonctionne normalement : seules les vérifications sont
          indisponibles.
        </Notice>
      )}

      {state === 'pret' && counters.total === 0 && (
        <Notice title="Aucune citation publiée pour le moment" tone="neutre" icon="·">
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
        </Notice>
      )}

      {state === 'pret' && counters.total > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                Candidat
              </p>
              <select
                value={candidatFiltre}
                onChange={(e) => changeCandidate(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[0.82rem] text-ink"
                aria-label="Filtrer par candidat"
              >
                <option value="tous">Tous les candidats</option>
                {coveredCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
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
                onChange={(e) => changeVerdict(e.target.value as VerdictFilter)}
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
            {rows.slice(0, affichees).map(({ quote, verification, candidate }) => {
              const verdict = verification?.verdict ?? 'en-attente'
              const meta = VERDICTS[verdict]
              return (
                <Card as="li" key={quote.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Chip candidate={candidate!} size="petite" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.88rem] font-medium text-ink">
                        <Link to={`/candidats/${candidate!.id}`} className="hover:underline">
                          {candidate!.firstName} {candidate!.lastName}
                        </Link>
                      </p>
                      <p className="text-[0.75rem] text-muted">
                        {formatDate(quote.publishedAt.slice(0, 10))}
                        {quote.context ? ` · ${quote.context}` : ''}
                      </p>
                    </div>
                    <Badge tone="neutre" title={PLATFORMS[quote.platform].explanation}>
                      {PLATFORMS[quote.platform].short}
                    </Badge>
                    {quote.speaker === 'parti' && (
                      <Badge
                        tone="neutre"
                        icon="§"
                        title="Publication du mouvement, et non parole personnelle du candidat."
                      >
                        Communiqué du mouvement
                      </Badge>
                    )}
                    <Badge tone={meta.tone} icon={meta.icon} title={meta.explanation}>
                      {meta.label}
                    </Badge>
                  </div>

                  {/* Texte publié par un tiers : affiché comme donnée, jamais interprété. */}
                  <blockquote className="mt-3 border-l-2 border-line-strong pl-3 text-[0.9rem] leading-relaxed text-ink">
                    {quote.text}
                  </blockquote>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a
                      href={quote.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-[0.78rem] text-accent hover:underline"
                    >
                      {quote.platform === 'site-officiel'
                        ? 'Voir la publication d’origine ↗'
                        : 'Voir le message d’origine ↗'}
                    </a>
                    {quote.themeId && (
                      <span className="text-[0.75rem] text-muted">
                        {themeById.get(quote.themeId)?.lastName}
                      </span>
                    )}
                  </div>

                  {verification ? (
                    <div className="mt-4 rounded-xl bg-surface-2 p-4">
                      <p className="text-[0.85rem] font-semibold text-ink">{verification.finding}</p>
                      <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
                        {verification.explanation}
                      </p>
                      <Disclosure summary="Sources et auteur de la vérification" className="mt-3">
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
                                    {source.publisher} — {source.title}
                                  </a>
                                ) : (
                                  `${source.publisher} — ${source.title}`
                                )}
                              </li>
                            )
                          })}
                          {verification.links.map((link) => (
                            <li key={link.url}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-muted">
                          Vérifié par {verification.verifiedBy}, le{' '}
                          {formatDate(verification.verificationDate.slice(0, 10))}.
                          {verification.retry && (
                            <>
                              {' '}
                              Reprise d’une vérification publiée par{' '}
                              <a
                                href={verification.retry.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {verification.retry.publisher}
                              </a>
                              .
                            </>
                          )}
                        </p>
                      </Disclosure>
                    </div>
                  ) : (
                    <p className="mt-3 text-[0.78rem] text-muted">
                      Citation collectée, pas encore examinée. Elle est affichée pour que la
                      sélection soit visible : ne rien montrer des messages retenus mais non traités
                      reviendrait à cacher le tri.
                    </p>
                  )}
                </Card>
              )
            })}
          </ol>

          {rows.length > affichees && (
            <div className="mt-6 text-center">
              <Button onClick={() => setAffichees((n) => n + PER_PAGE)}>
                Afficher {Math.min(PER_PAGE, rows.length - affichees)} citation(s) de plus
              </Button>
              <p className="mt-2 text-[0.8rem] text-muted">
                {affichees} sur {rows.length} affichées.
              </p>
            </div>
          )}

          {rows.length === 0 && (
            <p className="py-12 text-center text-[0.88rem] text-muted">
              Aucune citation ne correspond à ces filtres.
            </p>
          )}
        </>
      )}

      {snapshot.watch.length > 0 && (
        <Card className="mt-8">
          <CardHeader
            title="Vérifications publiées ailleurs"
            subtitle="Relevées par flux RSS chez les rédactions spécialisées. Ce sont des pistes, pas des verdicts de ce site."
          />
          <ul className="divide-y divide-[color:var(--pqc-line)]">
            {snapshot.watch.slice(0, 25).map((publication) => (
              <li key={publication.id} className="p-4">
                <a
                  href={publication.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[0.85rem] font-medium leading-snug text-accent hover:underline"
                >
                  {publication.title} ↗
                </a>
                <p className="mt-1 text-[0.75rem] text-muted">
                  {publication.publisher}
                  {publication.publishedAt
                    ? ` · ${formatDate(publication.publishedAt.slice(0, 10))}`
                    : ''}
                  {publication.likelyCandidates.length > 0 &&
                    ` · mentionne ${publication.likelyCandidates
                      .map((id) => candidateById.get(id)?.lastName)
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
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader
          title="Comment cette page fonctionne"
          subtitle="D’où viennent les citations, et pourquoi la collecte n’a pas lieu dans votre navigateur."
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
            {WATCH_SOURCES.map((s) => `${s.lastName} (${s.publisher})`).join(', ')} — mais leurs articles
            servent de pistes, jamais de verdicts repris tels quels.
          </p>
          {candidatesWithoutSource.length > 0 && (
            <p>
              La couverture par les réseaux sociaux est partielle, et ce n’est pas un défaut de
              l’outil : la plupart des responsables politiques français publient sur X, dont la
              lecture est payante. {candidatesWithoutSource.length} des {candidates.length} candidats
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
            . En dessous de {MINIMUM_SAMPLE} vérifications pour un candidat, aucune note n’est
            produite : le critère reste non documenté plutôt que calculé sur un échantillon trop
            petit.
          </p>
        </div>
      </Card>

      {counters.total > 0 && (
        <Card className="mt-6">
          <CardHeader
            title="Effet sur le critère « rapport aux faits »"
            subtitle={`Une note n’est produite qu’à partir de ${MINIMUM_SAMPLE} vérifications.`}
          />
          <ul className="divide-y divide-[color:var(--pqc-line)]">
            {coveredCandidates.map((candidate) => {
              const report = accuracyReport(snapshot, candidate.id)
              return (
                <li key={candidate.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Chip candidate={candidate} size="petite" />
                  <span className="min-w-0 flex-1 text-[0.85rem] font-medium text-ink">
                    {candidate.firstName} {candidate.lastName}
                  </span>
                  {report && report.effective >= MINIMUM_SAMPLE ? (
                    <span className="tabular text-[0.85rem] font-semibold text-ink">
                      {report.rating}
                      <span className="text-[0.72rem] font-normal text-muted">
                        /100 · {report.effective} vérifications
                      </span>
                    </span>
                  ) : (
                    <span className="text-[0.78rem] text-muted">
                      {report ? `${report.effective} vérification(s)` : 'aucune vérification'} —
                      échantillon insuffisant
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
