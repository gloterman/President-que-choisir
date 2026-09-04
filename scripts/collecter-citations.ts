/**
 * Collecte des déclarations publiques des candidats.
 *
 *   npm run collecte:citations -- --essai            # sans appel réseau
 *   npm run collecte:citations                       # sources gratuites
 *   npm run collecte:citations -- --sources=bluesky
 *
 * Toutes les sources activées par défaut sont publiques, gratuites et sans
 * clé. Elles sont de deux natures :
 *
 *  — les flux de syndication des sites officiels des candidats et de leurs
 *    mouvements. C'est le socle : le texte y est publié par l'intéressé
 *    lui-même, daté, et reste consultable à son adresse d'origine. Le chemin
 *    du flux n'est pas configuré mais découvert, d'abord par la déclaration
 *    `<link rel="alternate">` de la page d'accueil, puis à défaut par les
 *    conventions les plus répandues ;
 *  — Bluesky, dont l'API de lecture est publique et ne demande ni compte ni
 *    paiement.
 *
 * S'y ajoute une veille des vérifications déjà publiées, lue par flux RSS.
 * Elle ne produit aucun verdict : un titre d'article ne dit pas de façon
 * fiable qui a dit quoi ni ce qui a été conclu. Elle fournit des pistes au
 * travail humain de vérification.
 *
 * X reste disponible mais désactivé par défaut : son API exige un jeton et
 * facture chaque lecture. `--sources=x` avec X_BEARER_TOKEN l'active.
 *
 * Le script n'écrase jamais une vérification et ne supprime aucune citation.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { setDefaultResultOrder } from 'node:dns'
import { candidats } from '../src/data/candidats'
import {
  VERSION_INSTANTANE,
  type Citation,
  type CompteSuivi,
  type InstantaneFactCheck,
  type Plateforme,
  type VeillePublication,
} from '../src/data/factcheck'
import {
  CHEMINS_FLUX_COURANTS,
  SOURCES_VEILLE,
  SOURCE_BLUESKY,
  type PorteParole,
} from '../src/data/sources-citations'
import {
  condenseUrl,
  identifiantVeille,
  liensFluxDeclares,
  lireFlux,
  normaliserNom,
} from '../src/lib/factcheck/rss'
import { DELAI_SONDE_MS, json, lire, motif } from '../src/lib/factcheck/reseau'

/**
 * Résolution IPv4 en premier.
 *
 * Les exécuteurs d'intégration continue n'ont généralement pas de route IPv6.
 * Quand un hôte publie un enregistrement AAAA, Node tente cette adresse
 * d'abord et la connexion reste suspendue jusqu'à expiration — le symptôme
 * observé sur les deux API parlementaires : un délai de connexion dépassé sur
 * le port 443, sans réponse HTTP, alors que le nom se résout correctement.
 */
setDefaultResultOrder('ipv4first')

const FICHIER = 'public/donnees/factcheck.json'
/** Au-delà, un site déclare des flux de catégorie sans intérêt pour nous. */
const FLUX_DECLARES_ESSAYES = 3
const MESSAGES_PAR_COMPTE = 50
const ARTICLES_PAR_SITE = 30
/** En deçà, un texte est un intitulé, pas une déclaration à vérifier. */
const LONGUEUR_MINIMALE = 80
/**
 * Rétention.
 *
 * L'instantané est rechargé par chaque visiteur : il doit rester petit. Une
 * citation portant une vérification n'est jamais écartée — ce serait perdre du
 * travail humain — mais les citations en attente et la veille sont ramenées aux
 * plus récentes.
 */
const CITATIONS_EN_ATTENTE_CONSERVEES = 400
const VEILLE_CONSERVEE = 300

const args = process.argv.slice(2)
const essai = args.includes('--essai')
const filtre = args.find((a) => a.startsWith('--sources='))?.slice('--sources='.length)
const sourcesDemandees = filtre ? new Set(filtre.split(',')) : null
const SOURCES_CONNUES = ['sites', 'bluesky', 'veille', 'x'] as const
// Un nom inconnu désactivait silencieusement tout le reste : la collecte
// réussissait en n'ayant rien collecté. Le cas s'est produit — le déclencheur
// nommait encore deux sources retirées — et n'a été vu qu'en lisant le journal.
const inconnues = [...(sourcesDemandees ?? [])].filter(
  (id) => !(SOURCES_CONNUES as readonly string[]).includes(id),
)
if (inconnues.length > 0) {
  console.error(
    `Source(s) inconnue(s) : ${inconnues.join(', ')}. Valeurs acceptées : ${SOURCES_CONNUES.join(', ')}.`,
  )
  process.exit(1)
}
const actif = (id: string) => (sourcesDemandees ? sourcesDemandees.has(id) : id !== 'x')

const jetonX = process.env.X_BEARER_TOKEN ?? process.env.X_API_BEARER_TOKEN ?? ''

const journal: { source: string; statut: 'ok' | 'ignorée' | 'échec'; detail: string }[] = []
const departMs = Date.now()

/**
 * Retient les déclarations qui contiennent une affirmation vérifiable.
 *
 * Le filtre penche volontairement vers l'inclusion : mieux vaut collecter une
 * citation qui se révélera invérifiable que d'écarter en amont, par une règle
 * opaque, une déclaration qui méritait examen.
 */
function contientUneAffirmationVerifiable(texte: string): boolean {
  const sansLiens = texte.replace(/https?:\/\/\S+/g, '').trim()
  if (sansLiens.length < LONGUEUR_MINIMALE) return false
  const quantite = /\b(?:%|pour cent|milliards?|millions?|milliers?|euros?|points?)\b/i.test(texte)
  const chiffre = /\d/.test(texte)
  const comparatif =
    /\b(?:plus|moins|jamais|toujours|premier|première|record|multiplié|divisé|augment|baiss|diminu)\w*/i.test(
      texte,
    )
  return quantite || (chiffre && comparatif)
}

// ---------------------------------------------------------------------------
// Sites officiels des candidats et de leurs mouvements
// ---------------------------------------------------------------------------

interface FluxTrouve {
  url: string
  articles: ReturnType<typeof lireFlux>
  /** Comment l'adresse a été obtenue, pour le dire dans le journal. */
  voie: 'déclaré' | 'convention'
}

/** Lit une adresse candidate et n'y voit un flux que s'il produit un article. */
async function lireSiFlux(url: string): Promise<ReturnType<typeof lireFlux> | null> {
  try {
    // Sonde : ni reprise ni délai long. Un chemin absent est le cas normal.
    const reponse = await lire(url, { reprise: false, delaiMs: DELAI_SONDE_MS })
    if (!reponse.ok) return null
    const articles = lireFlux(reponse.texte)
    // Un flux est reconnu au fait qu'il produit au moins un article : c'est
    // plus fiable que de se fier au type de contenu déclaré, que beaucoup de
    // sites renseignent mal.
    return articles.length > 0 ? articles : null
  } catch {
    return null
  }
}

/**
 * Un site n'est sondé qu'une fois par exécution.
 *
 * Deux candidats peuvent partager un mouvement — c'est le cas de
 * rassemblementnational.fr — et la découverte est la partie coûteuse : la
 * refaire reviendrait à doubler les requêtes sur un serveur qui nous héberge
 * gracieusement.
 */
const fluxParSite = new Map<string, Promise<FluxTrouve | null>>()

function trouverFlux(racine: string): Promise<FluxTrouve | null> {
  const cle = racine.replace(/\/$/, '')
  const connu = fluxParSite.get(cle)
  if (connu) return connu
  const recherche = decouvrirFlux(cle)
  fluxParSite.set(cle, recherche)
  return recherche
}

/**
 * Découvre le flux de syndication d'un site.
 *
 * On demande d'abord au site lui-même : la page d'accueil déclare ses flux par
 * `<link rel="alternate">`, et c'est le seul moyen de trouver une adresse qui
 * ne suit aucune convention. Sept sites sur onze n'ont rien rendu au sondage
 * par chemins seuls, alors qu'ils publient des actualités — signe que la liste
 * de chemins était la mauvaise question à poser en premier.
 *
 * Les conventions restent en second : un site peut servir un flux sans le
 * déclarer.
 */
async function decouvrirFlux(base: string): Promise<FluxTrouve | null> {
  try {
    const accueil = await lire(base, { reprise: false, delaiMs: DELAI_SONDE_MS })
    if (accueil.ok) {
      for (const url of liensFluxDeclares(accueil.texte, base).slice(0, FLUX_DECLARES_ESSAYES)) {
        const articles = await lireSiFlux(url)
        if (articles) return { url, articles, voie: 'déclaré' }
      }
    }
  } catch {
    // Une page d'accueil illisible ne condamne pas le site : on sonde quand même.
  }

  for (const chemin of CHEMINS_FLUX_COURANTS) {
    const articles = await lireSiFlux(`${base}${chemin}`)
    if (articles) return { url: `${base}${chemin}`, articles, voie: 'convention' }
  }
  return null
}

async function collecterSitesOfficiels(ajouter: (c: Citation) => void, comptes: CompteSuivi[]) {
  let sitesTrouves = 0
  let sitesEssayes = 0

  for (const candidat of candidats) {
    // Le site personnel passe avant celui du mouvement : quand les deux
    // existent, la parole propre du candidat prime sur le communiqué de parti.
    const sites = [
      ...candidat.liensOfficiels.filter((l) => l.type === 'candidat'),
      ...candidat.liensOfficiels.filter((l) => l.type === 'parti'),
    ]
    if (sites.length === 0) continue

    for (const site of sites) {
      sitesEssayes++
      const porteParole: PorteParole = site.type === 'candidat' ? 'candidat' : 'parti'
      const flux = await trouverFlux(site.url)
      if (!flux) {
        comptes.push({
          candidatId: candidat.id,
          plateforme: 'site-officiel',
          compte: site.url,
          erreur: `aucun flux trouvé (aucun déclaré, ${CHEMINS_FLUX_COURANTS.length} chemins essayés)`,
        })
        console.log(`    – ${candidat.nom.padEnd(14)} ${site.url.padEnd(38)} aucun flux`)
        continue
      }

      sitesTrouves++
      let retenues = 0
      let tropCourts = 0
      let sansAffirmation = 0
      for (const article of flux.articles.slice(0, ARTICLES_PAR_SITE)) {
        // Titre et corps sont examinés ensemble : le titre porte souvent le
        // chiffre et le corps le contexte, et n'en lire qu'un revenait à
        // écarter des déclarations sur la seule mise en page du flux.
        const texte = article.description
          ? `${article.titre} — ${article.description}`
          : article.titre
        if (!contientUneAffirmationVerifiable(texte)) {
          if (texte.replace(/https?:\/\/\S+/g, '').trim().length < LONGUEUR_MINIMALE) tropCourts++
          else sansAffirmation++
          continue
        }
        const cle = condenseUrl(article.lien)
        ajouter({
          id: `site-${cle}`,
          candidatId: candidat.id,
          plateforme: 'site-officiel',
          compte: new URL(site.url).hostname,
          postId: cle,
          url: article.lien,
          texte: texte.slice(0, 3500),
          affirmation: article.titre,
          datePublication: article.date || new Date().toISOString(),
          collecteLe: new Date().toISOString(),
          contexte: article.date ? undefined : 'date de publication absente du flux',
          porteParole,
        })
        retenues++
      }
      comptes.push({
        candidatId: candidat.id,
        plateforme: 'site-officiel',
        compte: new URL(site.url).hostname,
        messagesExamines: flux.articles.length,
      })
      // Quand rien n'est retenu, dire pourquoi : sans cela, un flux muet et un
      // flux d'annonces d'événements se ressemblent dans le journal, et on ne
      // sait pas s'il faut corriger le filtre ou changer de source.
      const cause =
        retenues > 0 ? '' : ` — ${tropCourts} trop court(s), ${sansAffirmation} sans chiffre`
      console.log(
        `    · ${candidat.nom.padEnd(14)} ${flux.url.padEnd(38)} [${flux.voie}] ${flux.articles.length} article(s), ${retenues} retenue(s)${cause}`,
      )
      // Un seul flux par candidat : le premier trouvé fait foi, et interroger
      // aussi le parti doublonnerait la ligne d'un mouvement sur ses candidats.
      break
    }
  }

  journal.push({
    source: 'Sites officiels',
    statut: sitesTrouves > 0 ? 'ok' : 'échec',
    detail: `${sitesTrouves} flux trouvé(s) sur ${sitesEssayes} site(s) essayé(s)`,
  })
}

// ---------------------------------------------------------------------------
// Bluesky
// ---------------------------------------------------------------------------

interface FilBluesky {
  feed?: { post?: { uri?: string; record?: { text?: string; createdAt?: string } } }[]
}

async function collecterBluesky(ajouter: (c: Citation) => void, comptes: CompteSuivi[]) {
  const suivis = candidats.flatMap((candidat) =>
    candidat.comptesSociaux
      .filter((c) => c.plateforme === 'bluesky')
      .map((c) => ({ candidat, identifiant: c.identifiant })),
  )
  if (suivis.length === 0) {
    journal.push({
      source: 'Bluesky',
      statut: 'ignorée',
      detail: 'aucun compte Bluesky officiel confirmé parmi les candidats',
    })
    return
  }

  for (const { candidat, identifiant } of suivis) {
    try {
      const fil = await json<FilBluesky>(
        `${SOURCE_BLUESKY.racine}${SOURCE_BLUESKY.cheminFil}` +
          `?actor=${encodeURIComponent(identifiant)}&limit=${MESSAGES_PAR_COMPTE}&filter=posts_no_replies`,
      )
      const messages = fil.feed ?? []
      let retenues = 0
      for (const element of messages) {
        const texte = element.post?.record?.text
        const uri = element.post?.uri
        const date = element.post?.record?.createdAt
        if (!texte || !uri || !date) continue
        if (!contientUneAffirmationVerifiable(texte)) continue
        // at://did:plc:xxx/app.bsky.feed.post/CLE → dernier segment.
        const cle = uri.split('/').pop()!
        ajouter({
          id: `bluesky-${cle}`,
          candidatId: candidat.id,
          plateforme: 'bluesky',
          compte: identifiant,
          postId: cle,
          url: `https://bsky.app/profile/${identifiant}/post/${cle}`,
          texte,
          affirmation: texte,
          datePublication: new Date(date).toISOString(),
          collecteLe: new Date().toISOString(),
        })
        retenues++
      }
      comptes.push({
        candidatId: candidat.id,
        plateforme: 'bluesky',
        compte: identifiant,
        messagesExamines: messages.length,
      })
      console.log(
        `    · ${candidat.nom.padEnd(14)} ${identifiant.padEnd(28)} ${messages.length} message(s), ${retenues} retenue(s)`,
      )
    } catch (e) {
      const message = motif(e)
      comptes.push({ candidatId: candidat.id, plateforme: 'bluesky', compte: identifiant, erreur: message })
      console.error(`    ✗ ${candidat.nom.padEnd(14)} ${identifiant} — ${message}`)
    }
  }
  journal.push({ source: 'Bluesky', statut: 'ok', detail: `${suivis.length} compte(s) interrogé(s)` })
}

// ---------------------------------------------------------------------------
// X, optionnel
// ---------------------------------------------------------------------------

async function collecterX(ajouter: (c: Citation) => void, comptes: CompteSuivi[]) {
  if (!jetonX) {
    journal.push({
      source: 'X',
      statut: 'ignorée',
      detail: 'aucun jeton X_BEARER_TOKEN — source payante, non requise',
    })
    return
  }
  const suivis = candidats.flatMap((candidat) =>
    candidat.comptesSociaux
      .filter((c) => c.plateforme === 'x')
      .map((c) => ({ candidat, identifiant: c.identifiant })),
  )
  let lectures = 0
  for (const { candidat, identifiant } of suivis) {
    try {
      const entetes = { Authorization: `Bearer ${jetonX}` }
      const utilisateur = await json<{ data?: { id: string } }>(
        `https://api.x.com/2/users/by/username/${identifiant}`,
        entetes,
      )
      if (!utilisateur.data) throw new Error('compte introuvable')
      const messages = await json<{ data?: { id: string; text: string; created_at: string }[] }>(
        `https://api.x.com/2/users/${utilisateur.data.id}/tweets` +
          `?max_results=${MESSAGES_PAR_COMPTE}&exclude=retweets,replies&tweet.fields=created_at`,
        entetes,
      )
      const liste = messages.data ?? []
      lectures += liste.length
      for (const message of liste) {
        if (!contientUneAffirmationVerifiable(message.text)) continue
        ajouter({
          id: `x-${message.id}`,
          candidatId: candidat.id,
          plateforme: 'x',
          compte: identifiant,
          postId: message.id,
          url: `https://x.com/${identifiant}/status/${message.id}`,
          texte: message.text,
          affirmation: message.text,
          datePublication: message.created_at,
          collecteLe: new Date().toISOString(),
        })
      }
      comptes.push({
        candidatId: candidat.id,
        plateforme: 'x',
        compte: identifiant,
        messagesExamines: liste.length,
      })
    } catch (e) {
      const message = motif(e)
      comptes.push({ candidatId: candidat.id, plateforme: 'x', compte: identifiant, erreur: message })
    }
  }
  journal.push({
    source: 'X',
    statut: 'ok',
    detail: `${lectures} lecture(s) facturée(s), environ ${(lectures * 0.005 + suivis.length * 0.01).toFixed(2)} $`,
  })
}

// ---------------------------------------------------------------------------
// Veille des vérifications publiées
// ---------------------------------------------------------------------------

async function collecterVeille(existants: Map<string, VeillePublication>) {
  const nomsCandidats = candidats.map((c) => ({
    id: c.id,
    cles: [normaliserNom(`${c.prenom} ${c.nom}`), normaliserNom(c.nom)],
  }))

  for (const source of SOURCES_VEILLE) {
    try {
      const reponse = await lire(source.url)
      if (!reponse.ok) throw new Error(`réponse ${reponse.statut}`)
      const articles = lireFlux(reponse.texte)
      let ajoutes = 0
      for (const article of articles) {
        const id = identifiantVeille(source.id, article.lien)
        if (existants.has(id)) continue
        const titreNormalise = normaliserNom(article.titre)
        const pressentis = nomsCandidats
          .filter((c) => c.cles.some((cle) => cle.length > 4 && titreNormalise.includes(cle)))
          .map((c) => c.id)
        existants.set(id, {
          id,
          titre: article.titre,
          url: article.lien,
          editeur: source.editeur,
          datePublication: article.date,
          collecteLe: new Date().toISOString(),
          candidatsPressentis: pressentis,
        })
        ajoutes++
      }
      journal.push({
        source: `${source.nom} (${source.editeur})`,
        statut: 'ok',
        detail: `${articles.length} article(s) lu(s), ${ajoutes} nouveau(x)`,
      })
      console.log(`    · ${source.nom.padEnd(18)} ${articles.length} article(s), ${ajoutes} nouveau(x)`)
    } catch (e) {
      const message = motif(e)
      journal.push({ source: `${source.nom} (${source.editeur})`, statut: 'échec', detail: message })
      console.error(
        `    ✗ ${source.nom.padEnd(18)} ${message}` +
          (source.urlConfirmee ? '' : ' — adresse de flux non confirmée, à corriger dans src/data/sources-citations.ts'),
      )
    }
  }
}

// ---------------------------------------------------------------------------

function chargerExistant(): InstantaneFactCheck {
  if (!existsSync(FICHIER)) {
    return {
      version: VERSION_INSTANTANE,
      genereLe: '',
      comptes: [],
      citations: [],
      verifications: [],
      veille: [],
    }
  }
  const brut = JSON.parse(readFileSync(FICHIER, 'utf8')) as InstantaneFactCheck
  if (brut.version !== VERSION_INSTANTANE) {
    throw new Error(
      `L’instantané existant est en version ${brut.version}, le script écrit en version ${VERSION_INSTANTANE}. Migration manuelle requise.`,
    )
  }
  return { ...brut, veille: brut.veille ?? [] }
}

async function collecter() {
  const existant = chargerExistant()
  const citations = new Map(existant.citations.map((c) => [c.id, c]))
  const veille = new Map((existant.veille ?? []).map((v) => [v.id, v]))
  const comptes: CompteSuivi[] = []
  const avant = citations.size
  const ajouter = (c: Citation) => {
    if (!citations.has(c.id)) citations.set(c.id, c)
  }

  const sansCompteSocial = candidats.filter((c) => c.comptesSociaux.length === 0)
  console.log(`\n${candidats.length} candidat(s) au total.`)
  if (sansCompteSocial.length > 0) {
    console.log(
      `Sans compte social confirmé : ${sansCompteSocial.map((c) => c.nom).join(', ')}. ` +
        'Ils restent couverts par le flux de leur site officiel s’il en publie un.',
    )
  }

  if (essai) {
    console.log('\nEssai : sources qui seraient interrogées, sans aucun appel réseau.')
    if (actif('sites')) {
      const avecSite = candidats.filter((c) =>
        c.liensOfficiels.some((l) => l.type === 'candidat' || l.type === 'parti'),
      ).length
      console.log(
        `  · Sites officiels — ${avecSite} site(s) à sonder, flux déclaré d'abord, puis ${CHEMINS_FLUX_COURANTS.length} chemins conventionnels`,
      )
    }
    if (actif('bluesky')) {
      const n = candidats.filter((c) => c.comptesSociaux.some((s) => s.plateforme === 'bluesky')).length
      console.log(`  · Bluesky — API publique, ${n} compte(s) déclaré(s)`)
    }
    for (const source of SOURCES_VEILLE) {
      if (actif('veille')) console.log(`  · Veille ${source.nom} — ${source.url}`)
    }
    if (actif('x')) console.log(`  · X — ${jetonX ? 'jeton présent' : 'aucun jeton, serait ignorée'}`)
    console.log('\nAucun fichier écrit.\n')
    return
  }

  if (actif('sites')) {
    console.log('\n  Sites officiels — flux de syndication, découverte automatique')
    await collecterSitesOfficiels(ajouter, comptes)
  }

  if (actif('bluesky')) {
    console.log('\n  Bluesky — API publique, sans compte ni jeton')
    await collecterBluesky(ajouter, comptes)
  }

  if (actif('x')) {
    console.log('\n  X — source payante')
    await collecterX(ajouter, comptes)
  }

  if (actif('veille')) {
    console.log('\n  Veille des vérifications publiées')
    await collecterVeille(veille)
  }

  const verifiees = new Set(existant.verifications.map((v) => v.citationId))
  const parDateDecroissante = [...citations.values()].sort((a, b) =>
    b.datePublication.localeCompare(a.datePublication),
  )
  const conservees = [
    ...parDateDecroissante.filter((c) => verifiees.has(c.id)),
    ...parDateDecroissante.filter((c) => !verifiees.has(c.id)).slice(0, CITATIONS_EN_ATTENTE_CONSERVEES),
  ].sort((a, b) => b.datePublication.localeCompare(a.datePublication))
  const ecartees = parDateDecroissante.length - conservees.length

  const instantane: InstantaneFactCheck = {
    version: VERSION_INSTANTANE,
    genereLe: new Date().toISOString(),
    comptes,
    citations: conservees,
    verifications: existant.verifications,
    veille: [...veille.values()]
      .sort((a, b) => b.datePublication.localeCompare(a.datePublication))
      .slice(0, VEILLE_CONSERVEE),
  }
  writeFileSync(FICHIER, `${JSON.stringify(instantane, null, 2)}\n`)

  console.log('\n  Bilan par source')
  for (const ligne of journal) {
    const marque = ligne.statut === 'ok' ? '·' : ligne.statut === 'ignorée' ? '–' : '✗'
    console.log(`    ${marque} ${ligne.source.padEnd(32)} ${ligne.detail}`)
  }
  const parPlateforme = new Map<Plateforme, number>()
  for (const citation of instantane.citations) {
    parPlateforme.set(citation.plateforme, (parPlateforme.get(citation.plateforme) ?? 0) + 1)
  }
  const abouties = journal.filter((l) => l.statut === 'ok').length
  console.log(
    `\n${instantane.citations.length} citation(s), dont ${instantane.citations.length - avant} nouvelle(s) : ` +
      [...parPlateforme].map(([p, n]) => `${n} ${p}`).join(', ') +
      `\n${instantane.verifications.length} vérification(s) conservée(s).` +
      `\n${instantane.veille.length} publication(s) en veille.` +
      (ecartees > 0
        ? `\n${ecartees} citation(s) en attente écartée(s) par la rétention ; aucune citation vérifiée n’est perdue.`
        : '') +
      `\nÉcrit dans ${FICHIER}.` +
      // L'écart entre cette ligne et la fin du pas d'intégration continue dit
      // s'il reste des connexions non libérées : le journal doit permettre de
      // le voir sans relire les horodatages du déclencheur.
      `\nCollecte faite en ${Math.round((Date.now() - departMs) / 1000)} s.\n`,
  )

  if (abouties === 0) {
    throw new Error(
      'aucune source n’a abouti. L’instantané précédent est conservé tel quel ; ' +
        'voir le bilan ci-dessus pour le motif de chaque échec.',
    )
  }
}

collecter().catch((erreur) => {
  console.error(`\nÉchec de la collecte : ${erreur instanceof Error ? erreur.message : erreur}\n`)
  process.exit(1)
})
