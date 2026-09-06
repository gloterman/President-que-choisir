import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, Disclosure, CardHeader } from '@/components/ui/base'
import { criteria, criteriaByFamily } from '@/data/criteria'
import { axes, propositions, themes } from '@/data/questionnaire'
import { candidates } from '@/data/candidates'
import { METHODS } from '@/lib/scoring'
import type { AggregationMethod } from '@/data/types'

const LIMITS = [
  {
    title: 'Les positions sont des synthèses, pas des citations',
    text:
      "Placer un candidat sur un axe suppose de résumer une ligne politique en un chiffre entre −2 et +2. Ce résumé est un acte éditorial : deux personnes de bonne foi peuvent le faire différemment. Chaque position porte donc le statut « estimation » et, quand c'est utile, une note explicative.",
  },
  {
    title: 'Un barème transparent reste un barème arbitraire',
    text:
      "Retirer 45 points pour une condamnation définitive et 25 pour une condamnation frappée d'appel, c'est un choix. Il est écrit, donc discutable — mais il n'est pas neutre. Le seul remède honnête est de le publier, ce que fait chaque fiche de critère.",
  },
  {
    title: 'Ce qui n’est pas mesuré n’apparaît pas',
    text:
      "Le charisme, la capacité à décider dans l'urgence, la qualité de l'entourage, la solidité psychologique : rien de tout cela n'est ici, faute d'indicateur défendable. L'outil éclaire une partie de la décision, pas la décision.",
  },
  {
    title: 'Les personnes les plus exposées sont les plus contrôlées',
    text:
      "Un candidat très médiatisé fait l'objet de plus d'enquêtes journalistiques, de plus de vérifications factuelles et de plus de signalements. Une base de données sur ce sujet reflète autant l'attention portée aux personnes que leurs actes.",
  },
  {
    title: 'Certains critères pénalisent structurellement des profils entiers',
    text:
      "L'expérience désavantage les nouveaux venus ; la capacité à gouverner désavantage les petits partis ; l'assiduité n'a aucun sens pour qui n'a jamais eu de mandat. Ces effets sont signalés critère par critère, et chaque poids peut être mis à zéro.",
  },
]

export function Methodology() {
  const methods = Object.keys(METHODS) as AggregationMethod[]

  return (
    <div>
      <PageHeader
        title="Méthodologie"
        summary={
          <>
            Tout ce que l’outil calcule est décrit ici : les formules, les barèmes, les choix
            discutables et ce qui n’est pas mesuré. Un outil d’aide au vote qui garde sa méthode
            pour lui demande une confiance qu’il n’a pas méritée.
          </>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Deux familles d’information, jamais mélangées"
            subtitle="C’est le choix structurant de tout l’outil."
          />
          <div className="grid gap-5 p-4 sm:p-5 md:grid-cols-2">
            <div>
              <h3 className="text-[0.95rem] font-semibold text-ink">
                1. Les orientations — on les compare, on ne les note pas
              </h3>
              <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-2">
                {axes.length} axes répartis en {themes.length} thèmes, renseignés par{' '}
                {propositions.length} propositions. Vouloir la retraite à 60 ans ou à 65 ans ne
                rapporte aucun point : ces positions n’ont pas de bonne valeur. La seule chose
                mesurée est la distance entre votre position et celle du candidat.
              </p>
            </div>
            <div>
              <h3 className="text-[0.95rem] font-semibold text-ink">
                2. Les critères — ils produisent une note 0–100
              </h3>
              <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-2">
                {criteria.length} critères portant sur des faits vérifiables : situation judiciaire,
                obligations déclaratives, mandats exercés, précision du programme, base
                parlementaire. Chacun déclare ses indicateurs, son barème, ses paliers et ses
                limites.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Comment les questions sont rédigées"
            subtitle="Une proposition mal formulée fabrique le résultat qu’elle prétend mesurer."
          />
          <div className="space-y-4 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              C’est le point le plus facile à truquer dans un outil de ce genre, et le plus difficile
              à repérer pour qui répond. Huit règles s’appliquent donc à chaque énoncé, et les six
              premières sont vérifiées par un contrôle automatique à chaque modification du
              questionnaire.
            </p>
            <ol className="space-y-2.5">
              {[
                [
                  'Pas de justification intégrée',
                  '« Assouplir les licenciements pour encourager l’embauche » fait accepter une thèse économique contestée en même temps que la mesure. On énonce la mesure, pas son bénéfice supposé.',
                ],
                [
                  'Pas de superlatif ni d’adverbe d’appréciation',
                  '« Le meilleur levier », « massivement », « fortement » demandent d’adhérer à une intensité autant qu’à une idée.',
                ],
                [
                  'Une seule chose par proposition',
                  '« Poursuivi et amplifié » mélange deux questions dont on ne peut plus séparer les réponses.',
                ],
                [
                  'Pas de fausse alternative dans une mesure',
                  'Construire des prisons et développer les peines alternatives ne s’excluent pas : ce sont deux énoncés distincts. L’arbitrage n’est admis que dans une question de principe, où les deux termes sont nommés symétriquement.',
                ],
                [
                  'Pas de « il faut »',
                  'La formule installe une nécessité avant même la réponse. On écrit qui doit faire quoi.',
                ],
                [
                  'Pas de vocabulaire militant repris tel quel',
                  '« Préférence nationale », « assistanat », « ultra-riches » : on décrit le mécanisme, pas le slogan.',
                ],
                [
                  'Pas de présupposé dans le verbe',
                  '« Rétablir » suppose qu’un état antérieur était légitime. On écrit « instaurer », ou on décrit.',
                ],
                [
                  'Polarités mélangées dans chaque thème',
                  'Si tous les énoncés d’un thème vont dans le même sens, la tendance à approuver quoi qu’on demande se transforme en résultat politique.',
                ],
              ].map(([title, text], i) => (
                <li key={title} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-[0.72rem] font-bold text-ink-2"
                  >
                    R{i + 1}
                  </span>
                  <span>
                    <strong className="font-semibold text-ink">{title}.</strong> {text}
                  </span>
                </li>
              ))}
            </ol>
            <p>
              Les rares cas où un motif se déclenche sans que la règle soit enfreinte font l’objet
              d’une dérogation écrite dans le code, avec sa raison : une exception assumée n’est pas
              un oubli.
            </p>
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-[0.85rem] font-semibold text-ink">
                Questions de principe et questions de mesure
              </p>
              <p className="mt-2">
                {propositions.filter((p) => p.nature === 'principe').length} des{' '}
                {propositions.length} propositions sont des{' '}
                <strong className="font-medium text-ink">arbitrages de principe</strong> — « entre la
                stabilité de l’emploi et la souplesse des entreprises, laquelle doit primer ? » —
                rédigés pour survivre au cycle médiatique. Les autres sont des mesures concrètes,
                telles qu’elles se discutent aujourd’hui.
              </p>
              <p className="mt-2">
                La distinction n’est pas décorative : un questionnaire composé uniquement de mesures
                d’actualité mesure surtout la position de chacun dans le débat du moment, et devient
                faux dès que le débat se déplace. Le questionnaire propose donc une version courte,
                limitée aux questions de principe.
              </p>
            </div>
            <p className="text-muted">
              Ces règles ont été soumises à une relecture indépendante, dont les corrections
              retenues sont intégrées. Si une formulation vous paraît encore orientée, elle est
              contestable comme le reste : le texte de chaque proposition est dans le dépôt public.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Comment l’affinité programmatique est calculée"
            subtitle="La partie « boussole » de l’outil."
          />
          <div className="space-y-4 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              Vous répondez sur une échelle de −2 (pas du tout d’accord) à +2 (tout à fait
              d’accord), et vous déclarez séparément l’importance du sujet, de 0 à 3.
            </p>
            <div className="rounded-xl bg-surface-2 p-4">
              <p className="text-[0.82rem] text-ink">
                <strong className="font-semibold">Accord sur une proposition</strong> = 1 − |votre
                réponse − position du candidat| ÷ 4
              </p>
              <p className="mt-2 text-[0.82rem] text-ink">
                <strong className="font-semibold">Affinité globale</strong> = moyenne de ces accords,
                pondérée par l’importance que vous avez déclarée
              </p>
            </div>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Une proposition marquée « peu importe » (importance 0) est{' '}
                <strong className="font-medium text-ink">retirée du calcul</strong>. Elle ne compte
                pas comme un accord neutre : elle ne compte pas du tout.
              </li>
              <li>
                Une proposition sans réponse est également ignorée. Répondre à dix propositions
                donne un résultat, mais un résultat que le petit nombre rend instable.
              </li>
              <li>
                L’affinité par thème applique la même formule aux seules propositions du thème.
              </li>
            </ul>
            <p>
              La boussole en deux dimensions est une projection des seize axes : chaque axe déclare
              sa contribution à un axe économique (interventionnisme ↔ libéralisme) et à un axe
              culturel (progressiste ↔ conservateur). Les axes sans contribution — le mix
              énergétique, par exemple — n’entrent dans aucune des deux dimensions.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Les quatre méthodes d’agrégation"
            subtitle="Elles ne classent pas toujours pareil, et c’est le point."
          />
          <div className="p-4 sm:p-5">
            <p className="mb-4 text-[0.86rem] leading-relaxed text-ink-2">
              L’affinité programmatique n’est pas ajoutée après coup : elle entre dans la matrice de
              décision comme une colonne supplémentaire, dont le poids est le curseur « programme
              contre critères ». Les quatre méthodes s’appliquent donc à la même matrice, et « 70 %
              de programme » signifie la même chose quelle que soit la méthode.
            </p>
            <ul className="space-y-4">
              {methods.map((id) => (
                <li key={id} className="rounded-xl bg-surface-2 p-4">
                  <h3 className="text-[0.92rem] font-semibold text-ink">{METHODS[id].lastName}</h3>
                  <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-2">
                    {METHODS[id].summary}
                  </p>
                  <dl className="mt-2.5 space-y-1 text-[0.8rem]">
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-ink-2">Quand l’utiliser :</dt>
                      <dd className="text-ink-2">{METHODS[id].whenToUse}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-semibold text-ink-2">Compensation :</dt>
                      <dd className="text-ink-2">{METHODS[id].compensatory}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="D’où vient la note « rapport aux faits »"
            subtitle="Le seul critère dont la valeur change sans que les fiches soient modifiées."
          />
          <div className="space-y-3 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              Ce critère n’est pas saisi à la main sur les fiches : il est calculé à partir des
              vérifications publiées sur la page{' '}
              <Link to="/verifications" className="font-medium text-accent hover:underline">
                Vérification des déclarations
              </Link>
              . Les déclarations publiées par les candidats sur X sont collectées par un script
              authentifié, puis confrontées une à une aux données disponibles.
            </p>
            <div className="rounded-xl bg-surface-2 p-4 text-[0.82rem]">
              <p className="text-ink">
                <strong className="font-semibold">Note</strong> = part des affirmations jugées
                exactes ou plutôt exactes, parmi celles qui tranchent
              </p>
              <p className="mt-1.5 text-ink">
                <strong className="font-semibold">+ 5</strong> si une rectification publique a suivi
                une erreur · <strong className="font-semibold">− 10</strong> par reprise d’une
                affirmation déjà démentie
              </p>
            </div>
            <p>
              Les verdicts « invérifiable » et « en attente » sont exclus du calcul : le premier
              signale qu’aucune donnée publique ne permet de trancher, le second qu’aucun examen n’a
              encore eu lieu. Ni l’un ni l’autre ne dit quoi que ce soit de l’exactitude.
            </p>
            <p>
              <strong className="font-medium text-ink">
                En dessous de dix vérifications pour un candidat, aucune note n’est produite
              </strong>{' '}
              et le critère reste non documenté. Une note calculée sur trois vérifications serait
              plus trompeuse qu’une absence de note — et la limite figure déjà dans le barème publié
              du critère.
            </p>
            <p className="text-muted">
              Cette mécanique ne corrige pas le biais de sélection signalé dans les limites du
              critère : les personnalités les plus exposées sont les plus vérifiées. Le nombre de
              vérifications par candidat est affiché à côté de chaque note pour que l’écart soit
              visible.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="L’analyse de sensibilité"
            subtitle="La fonctionnalité la plus utile de l’outil, et la moins spectaculaire."
          />
          <div className="space-y-3 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              Un classement multicritère produit toujours un vainqueur. La question qui compte est
              de savoir si ce vainqueur résiste à un léger changement d’avis sur les pondérations.
            </p>
            <p>
              L’outil tire donc mille jeux de poids autour des vôtres, selon une loi de Dirichlet
              centrée sur vos réglages, recalcule le classement à chaque fois et compte les
              victoires. Le tirage est déterministe : à réglages identiques, les chiffres sont
              identiques.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-medium text-ink">Au-dessus de 70 %</strong> de victoires : le
                classement est robuste.
              </li>
              <li>
                <strong className="font-medium text-ink">Entre 45 et 70 %</strong> : les premiers
                sont proches, traitez-les comme un groupe.
              </li>
              <li>
                <strong className="font-medium text-ink">En dessous de 45 %</strong> : le classement
                est fragile, votre premier n’est premier que par accident de réglage.
              </li>
            </ul>
            <p>
              La <strong className="font-medium text-ink">concordance entre méthodes</strong>, affichée
              sur la page de classement, mesure la même idée autrement : c’est la moyenne des tau de
              Kendall entre les quatre classements produits par les quatre méthodes.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Les barèmes, critère par critère"
            subtitle="Les mêmes fiches que sur la page « Mes critères », rassemblées ici."
          />
          <div className="divide-y divide-[color:var(--pqc-line)]">
            {criteriaByFamily.map((family) => (
              <section key={family.id} className="p-4 sm:p-5">
                <h3 className="text-[0.95rem] font-semibold text-ink">{family.lastName}</h3>
                <p className="mt-0.5 text-[0.82rem] text-ink-2">{family.summary}</p>
                <ul className="mt-3 space-y-2">
                  {family.criteria.map((criterion) => (
                    <li key={criterion.id}>
                      <Disclosure
                        summary={
                          <>
                            {criterion.lastName}
                            {criterion.debatable && (
                              <span className="ml-1.5 text-muted">(contestable)</span>
                            )}
                          </>
                        }
                      >
                        <p className="font-medium text-ink">{criterion.question}</p>
                        <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Indicateurs
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {criterion.indicators.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Barème
                        </p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5">
                          {criterion.scale.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted">
                          Limites
                        </p>
                        <p className="mt-1">{criterion.limits}</p>
                        <p className="mt-2 italic text-muted">{criterion.readingDirection}</p>
                      </Disclosure>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Ce que cet outil ne peut pas faire"
            subtitle="Écrit ici plutôt que découvert plus tard."
          />
          <ul className="divide-y divide-[color:var(--pqc-line)]">
            {LIMITS.map((limit) => (
              <li key={limit.title} className="p-4 sm:p-5">
                <h3 className="text-[0.92rem] font-semibold text-ink">{limit.title}</h3>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-2">{limit.text}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Probité et antécédents judiciaires : deux critères, deux questions"
            subtitle="La distinction la plus importante du référentiel, et la plus facile à mal lire."
          />
          <div className="space-y-4 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              <strong className="font-semibold text-ink">Probité</strong> répond à une question
              étroite : cette personne a-t-elle été sanctionnée pour un manquement à la probité ?
              Son barème ne connaît que la corruption, le détournement de fonds publics, la prise
              illégale d’intérêts et la fraude fiscale. Une condamnation pour propos publics, pour
              rébellion ou pour diffamation ne lui retire aucun point.
            </p>
            <p>
              <strong className="font-semibold text-ink">Antécédents judiciaires</strong> répond à
              la question large : cette personne a-t-elle déjà été condamnée, pour quoi que ce
              soit ? Son barème compte toutes les condamnations sans les hiérarchiser.
            </p>
            <p>
              Conséquence assumée : un candidat peut afficher 100 en probité et 40 en antécédents.
              Ce n’est pas une incohérence, c’est la traduction d’une réalité juridique — une
              infraction de presse et une atteinte aux deniers publics ne sont pas la même chose.
              Le poids relatif des deux vous appartient. Une condamnation pour atteinte à la probité
              fait baisser les deux notes : ce double décompte est voulu, et signalé.
            </p>
            <div className="pqc-scroll-x rounded-xl border border-line">
              <table className="w-full border-collapse text-left text-[0.82rem]">
                <caption className="sr-only">
                  Points retirés par le barème de probité selon l’état procédural
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th scope="col" className="px-3 py-2 font-semibold text-ink-2">
                      État procédural
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold text-ink-2">
                      Points retirés
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Condamnation définitive', '−45'],
                    ['Condamnation confirmée en appel, pourvoi en cours', '−35'],
                    ['Condamnation de première instance frappée d’appel', '−25'],
                    ['Mise en examen en cours', '−12'],
                    ['Enquête sans mise en examen', '0'],
                    ['Relaxe, non-lieu, classement sans suite', '0'],
                  ].map(([state, points]) => (
                    <tr key={state} className="border-b border-line last:border-0">
                      <th scope="row" className="px-3 py-2 font-normal text-ink">
                        {state}
                      </th>
                      <td className="tabular px-3 py-2 text-right font-medium text-ink">{points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Une enquête ne retire rien, parce qu’elle n’établit aucune culpabilité. Un test
              automatique le vérifie sur le jeu de données, dans les deux sens : il refuse une note
              de probité maximale en face d’une condamnation pour détournement de fonds, et il
              refuse tout autant que le barème soit détourné pour sanctionner des faits qu’il ne
              prétend pas mesurer.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="État du jeu de données"
            subtitle={`${candidates.length} candidats, ${criteria.length} critères, ${propositions.length} propositions.`}
          />
          <div className="space-y-3 p-4 text-[0.86rem] leading-relaxed text-ink-2 sm:p-5">
            <p>
              Chaque affirmation factuelle porte l’un de quatre statuts :{' '}
              <strong className="font-medium text-ink">vérifié</strong> (source primaire ouverte et
              lue — Légifrance, HATVP, Journal officiel, décision de justice),{' '}
              <strong className="font-medium text-ink">recoupé</strong> (au moins deux sources
              indépendantes et concordantes, référence primaire identifiée mais document non
              ouvert), <strong className="font-medium text-ink">à vérifier</strong> (source
              secondaire unique), <strong className="font-medium text-ink">estimation</strong>{' '}
              (synthèse éditoriale). Le volet judiciaire est aujourd’hui au statut « recoupé » ; les
              positions programmatiques restent des estimations. Le détail par candidat figure sur
              la page{' '}
              <Link to="/sources" className="font-medium text-accent hover:underline">
                Sources
              </Link>
              .
            </p>
            <p>
              Un contrôle d’intégrité automatique (<code className="rounded bg-surface-3 px-1 py-0.5 text-[0.8em]">npm run lint:data</code>)
              vérifie l’absence d’identifiants dupliqués, de sources fantômes, d’axes non renseignés
              et de condamnation sans qualification pénale. Il ne dit évidemment rien de
              l’exactitude des faits, qui relève de la vérification humaine.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
