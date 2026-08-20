import { Link } from 'react-router-dom'
import { Carte, Badge } from '@/components/ui/base'
import { BandeauDonnees } from '@/components/BandeauDonnees'
import { candidats } from '@/data/candidats'
import { criteres } from '@/data/criteres'
import { propositions, themes } from '@/data/referentiel'
import { METHODES } from '@/lib/scoring'
import { usePreferences } from '@/lib/store'

const ETAPES = [
  {
    numero: 1,
    titre: 'Vous vous situez',
    texte:
      "Quarante-sept propositions concrètes, réparties en huit thèmes. Pour chacune, vous dites si vous êtes d’accord et surtout à quel point le sujet compte pour vous. Un sujet marqué « peu importe » sort entièrement du calcul.",
    lien: '/questionnaire',
    libelleLien: 'Commencer le questionnaire',
  },
  {
    numero: 2,
    titre: 'Vous fixez vos exigences',
    texte:
      "Onze critères d’évaluation — probité, clarté du programme, expérience, respect des institutions… Vous décidez du poids de chacun, et vous pouvez poser des seuils rédhibitoires qui écartent d’office un candidat.",
    lien: '/criteres',
    libelleLien: 'Régler mes critères',
  },
  {
    numero: 3,
    titre: 'Vous obtenez un classement, et sa fragilité',
    texte:
      "Quatre méthodes d’agrégation différentes, mille simulations sur vos pondérations, et le décompte honnête de ce qui sépare vraiment les premiers. Un classement qui bascule au moindre réglage, l’outil vous le dit.",
    lien: '/classement',
    libelleLien: 'Voir mon classement',
  },
]

export function Accueil() {
  const { progression, nbReponses, nbPropositions } = usePreferences()
  const commence = nbReponses > 0

  return (
    <div>
      <section className="py-6 sm:py-10">
        <Badge ton="accent">Élection présidentielle française · avril 2027</Badge>
        <h1 className="mt-4 max-w-3xl text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[3rem]">
          Un outil qui ne vous dit pas pour qui voter.
        </h1>
        <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-ink-2">
          Il fait autre chose, et c’est plus utile : il rend explicites les critères que vous
          appliquez déjà sans les formuler, il les confronte à ce que les candidats disent et à ce
          qu’ils ont fait, puis il vous montre ce que cela donne — y compris quand le résultat ne
          tient qu’à un fil.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to={commence ? '/questionnaire' : '/questionnaire'}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[0.9rem] font-semibold text-[var(--pqc-accent-ink)] hover:opacity-90"
          >
            {commence ? 'Reprendre le questionnaire' : 'Commencer'} →
          </Link>
          <Link
            to="/methodologie"
            className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-5 py-2.5 text-[0.9rem] font-medium text-ink hover:bg-surface-2"
          >
            Comment les notes sont calculées
          </Link>
          {commence && (
            <span className="text-[0.8rem] text-muted">
              {nbReponses} / {nbPropositions} réponses · {Math.round(progression * 100)} %
            </span>
          )}
        </div>
      </section>

      <div className="my-8">
        <BandeauDonnees />
      </div>

      <section aria-labelledby="chiffres" className="mb-12">
        <h2 id="chiffres" className="sr-only">
          Ce que contient l’outil
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { valeur: candidats.length, label: 'candidats documentés' },
            { valeur: propositions.length, label: 'propositions du questionnaire' },
            { valeur: criteres.length, label: 'critères d’évaluation' },
            { valeur: Object.keys(METHODES).length, label: 'méthodes d’agrégation' },
          ].map((chiffre) => (
            <Carte key={chiffre.label} className="p-4">
              <dt className="text-[0.75rem] leading-snug text-ink-2">{chiffre.label}</dt>
              <dd className="mt-1 text-[1.9rem] font-semibold leading-none tracking-tight text-ink">
                {chiffre.valeur}
              </dd>
            </Carte>
          ))}
        </dl>
      </section>

      <section aria-labelledby="etapes" className="mb-14">
        <h2 id="etapes" className="text-[1.35rem] font-semibold tracking-tight text-ink">
          Trois étapes, dans cet ordre
        </h2>
        <p className="mt-2 max-w-2xl text-[0.9rem] leading-relaxed text-ink-2">
          L’ordre compte : on se situe d’abord, on fixe ses exigences ensuite, on regarde le
          classement en dernier. L’inverse revient à choisir un candidat puis à fabriquer les
          critères qui le font gagner.
        </p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {ETAPES.map((etape) => (
            <Carte as="li" key={etape.numero} className="flex flex-col p-5">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-[0.9rem] font-bold text-ink"
              >
                {etape.numero}
              </span>
              <h3 className="mt-3.5 text-[1rem] font-semibold tracking-tight text-ink">
                {etape.titre}
              </h3>
              <p className="mt-2 flex-1 text-[0.85rem] leading-relaxed text-ink-2">{etape.texte}</p>
              <Link
                to={etape.lien}
                className="mt-4 text-[0.83rem] font-medium text-accent hover:underline"
              >
                {etape.libelleLien} →
              </Link>
            </Carte>
          ))}
        </ol>
      </section>

      <section aria-labelledby="themes" className="mb-14">
        <h2 id="themes" className="text-[1.35rem] font-semibold tracking-tight text-ink">
          Les huit thèmes couverts
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((theme) => (
            <Carte as="li" key={theme.id} className="p-4">
              <span aria-hidden="true" className="text-[1.1rem] text-accent">
                {theme.icone}
              </span>
              <h3 className="mt-1.5 text-[0.9rem] font-semibold text-ink">{theme.nom}</h3>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-ink-2">{theme.resume}</p>
            </Carte>
          ))}
        </ul>
      </section>

      <section aria-labelledby="principes" className="mb-6">
        <h2 id="principes" className="text-[1.35rem] font-semibold tracking-tight text-ink">
          Ce que l’outil s’interdit
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              titre: 'Noter des opinions',
              texte:
                "Aucune position programmatique n’est notée. Vouloir la retraite à 60 ans ou à 65 ans ne rapporte ni ne coûte de points : c’est votre propre position qui sert de référence, pas la nôtre.",
            },
            {
              titre: 'Cacher son barème',
              texte:
                "Chaque note affiche la règle qui l’a produite, les indicateurs utilisés, le niveau de confiance et ce que la note ne dit pas. Les critères discutables sont signalés comme tels et peuvent être mis à zéro.",
            },
            {
              titre: 'Faire passer une procédure pour une condamnation',
              texte:
                "Enquête, mise en examen, condamnation frappée d’appel et condamnation définitive sont quatre états distincts, affichés distinctement, avec un rappel systématique de la présomption d’innocence.",
            },
          ].map((principe) => (
            <Carte key={principe.titre} className="p-5">
              <h3 className="text-[0.95rem] font-semibold tracking-tight text-ink">
                {principe.titre}
              </h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-2">{principe.texte}</p>
            </Carte>
          ))}
        </div>
      </section>
    </div>
  )
}
