/**
 * Collecte des déclarations publiques des candidats.
 *
 *   npm run collect:quotes -- --essai            # sans appel réseau
 *   npm run collect:quotes                       # sources gratuites
 *   npm run collect:quotes -- --sources=bluesky
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
import { candidates } from '../src/data/candidates/index'
import {
  SNAPSHOT_VERSION,
  type Quote,
  type TrackedAccount,
  type FactCheckSnapshot,
  type Platform,
  type WatchPublication,
} from '../src/data/factcheck'
import {
  COMMON_FEED_PATHS,
  WATCH_SOURCES,
  BLUESKY_SOURCE,
  type Speaker,
} from '../src/data/collection-sources'
import {
  urlDigest,
  watchId,
  declaredFeedLinks,
  readFeed,
  normalizeName,
} from '../src/lib/factcheck/rss'
import { PROBE_TIMEOUT_MS, json, read, reason } from '../src/lib/factcheck/network'

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

const FILE = 'public/data/factcheck.json'
/** Au-delà, un site déclare des flux de catégorie sans intérêt pour nous. */
const DECLARED_FEEDS_TRIED = 3
const MESSAGES_PER_ACCOUNT = 50
const ARTICLES_PER_SITE = 30
/** En deçà, un texte est un intitulé, pas une déclaration à vérifier. */
const MINIMUM_LENGTH = 80
/**
 * Rétention.
 *
 * L'instantané est rechargé par chaque visiteur : il doit rester petit. Une
 * citation portant une vérification n'est jamais écartée — ce serait perdre du
 * travail humain — mais les citations en attente et la veille sont ramenées aux
 * plus récentes.
 */
const PENDING_QUOTES_KEPT = 400
const WATCH_KEPT = 300

const args = process.argv.slice(2)
const attempt = args.includes('--essai')
const filter = args.find((a) => a.startsWith('--sources='))?.slice('--sources='.length)
const requestedSources = filter ? new Set(filter.split(',')) : null
const KNOWN_SOURCES = ['sites', 'bluesky', 'veille', 'x'] as const
// Un nom inconnu désactivait silencieusement tout le reste : la collecte
// réussissait en n'ayant rien collecté. Le cas s'est produit — le déclencheur
// nommait encore deux sources retirées — et n'a été vu qu'en lisant le journal.
const unknown = [...(requestedSources ?? [])].filter(
  (id) => !(KNOWN_SOURCES as readonly string[]).includes(id),
)
if (unknown.length > 0) {
  console.error(
    `Source(s) inconnue(s) : ${unknown.join(', ')}. Valeurs acceptées : ${KNOWN_SOURCES.join(', ')}.`,
  )
  process.exit(1)
}
const isActive = (id: string) => (requestedSources ? requestedSources.has(id) : id !== 'x')

const xToken = process.env.X_BEARER_TOKEN ?? process.env.X_API_BEARER_TOKEN ?? ''

const log: { source: string; status: 'ok' | 'ignorée' | 'échec'; detail: string }[] = []
const startMs = Date.now()

/**
 * Retient les déclarations qui contiennent une affirmation vérifiable.
 *
 * Le filtre penche volontairement vers l'inclusion : mieux vaut collecter une
 * citation qui se révélera invérifiable que d'écarter en amont, par une règle
 * opaque, une déclaration qui méritait examen.
 */
function containsCheckableClaim(text: string): boolean {
  const withoutLinks = text.replace(/https?:\/\/\S+/g, '').trim()
  if (withoutLinks.length < MINIMUM_LENGTH) return false
  const quantity = /\b(?:%|pour cent|milliards?|millions?|milliers?|euros?|points?)\b/i.test(text)
  const digit = /\d/.test(text)
  const comparison =
    /\b(?:plus|moins|jamais|toujours|premier|première|record|multiplié|divisé|augment|baiss|diminu)\w*/i.test(
      text,
    )
  return quantity || (digit && comparison)
}

// ---------------------------------------------------------------------------
// Sites officiels des candidats et de leurs mouvements
// ---------------------------------------------------------------------------

interface FoundFeed {
  url: string
  articles: ReturnType<typeof readFeed>
  /** Comment l'adresse a été obtenue, pour le dire dans le journal. */
  via: 'déclaré' | 'convention'
}

/** Un flux, ou le motif circonstancié de son absence. */
type Discovery = { feed: FoundFeed } | { feed: null; diagnostic: string }

/** Lit une adresse candidate et n'y voit un flux que s'il produit un article. */
async function readIfFeed(url: string): Promise<ReturnType<typeof readFeed> | null> {
  try {
    // Sonde : ni reprise ni délai long. Un chemin absent est le cas normal.
    const answer = await read(url, { retry: false, timeoutMs: PROBE_TIMEOUT_MS })
    if (!answer.ok) return null
    const articles = readFeed(answer.text)
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
const feedBySite = new Map<string, Promise<Discovery>>()

function findFeed(root: string): Promise<Discovery> {
  const key = root.replace(/\/$/, '')
  const known = feedBySite.get(key)
  if (known) return known
  const search = discoverFeed(key)
  feedBySite.set(key, search)
  return search
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
async function discoverFeed(base: string): Promise<Discovery> {
  // « Aucun flux » recouvre deux situations qu'il ne faut pas confondre : un
  // site qui n'en publie pas, et un site qui nous a refusé sa page. La
  // première se documente, la seconde se corrige. Le journal doit les
  // distinguer, faute de quoi on cherche une source à remplacer là où il
  // suffisait de se présenter autrement.
  let homeStatus = ''
  let declared = 0
  try {
    const home = await read(base, { retry: false, timeoutMs: PROBE_TIMEOUT_MS })
    homeStatus = home.ok ? 'accueil lu' : `accueil ${home.status}`
    if (home.ok) {
      const links = declaredFeedLinks(home.text, base)
      declared = links.length
      for (const url of links.slice(0, DECLARED_FEEDS_TRIED)) {
        const articles = await readIfFeed(url)
        if (articles) return { feed: { url, articles, via: 'déclaré' } }
      }
    }
  } catch (error) {
    // Une page d'accueil illisible ne condamne pas le site : on sonde quand même.
    homeStatus = `accueil injoignable (${reason(error)})`
  }

  for (const path of COMMON_FEED_PATHS) {
    const articles = await readIfFeed(`${base}${path}`)
    if (articles) return { feed: { url: `${base}${path}`, articles, via: 'convention' } }
  }

  const declaration =
    declared === 0 ? 'aucun flux déclaré' : `${declared} flux déclaré(s), aucun exploitable`
  return { feed: null, diagnostic: `${homeStatus}, ${declaration}` }
}

async function collectOfficialSites(add: (c: Quote) => void, accounts: TrackedAccount[]) {
  let sitesFound = 0
  let sitesTried = 0

  for (const candidate of candidates) {
    // Le site personnel passe avant celui du mouvement : quand les deux
    // existent, la parole propre du candidat prime sur le communiqué de parti.
    const sites = [
      ...candidate.officialLinks.filter((l) => l.type === 'candidat'),
      ...candidate.officialLinks.filter((l) => l.type === 'parti'),
    ]
    if (sites.length === 0) continue

    for (const site of sites) {
      sitesTried++
      const speaker: Speaker = site.type === 'candidat' ? 'candidat' : 'parti'
      const discovery = await findFeed(site.url)
      if (!discovery.feed) {
        accounts.push({
          candidateId: candidate.id,
          platform: 'site-officiel',
          account: site.url,
          error: `aucun flux : ${discovery.diagnostic}`,
        })
        console.log(
          `    – ${candidate.lastName.padEnd(14)} ${site.url.padEnd(38)} aucun flux — ${discovery.diagnostic}`,
        )
        continue
      }
      const feed = discovery.feed

      sitesFound++
      let kept = 0
      let tooShort = 0
      let withoutFigure = 0
      for (const article of feed.articles.slice(0, ARTICLES_PER_SITE)) {
        // Titre et corps sont examinés ensemble : le titre porte souvent le
        // chiffre et le corps le contexte, et n'en lire qu'un revenait à
        // écarter des déclarations sur la seule mise en page du flux.
        const text = article.description
          ? `${article.title} — ${article.description}`
          : article.title
        if (!containsCheckableClaim(text)) {
          if (text.replace(/https?:\/\/\S+/g, '').trim().length < MINIMUM_LENGTH) tooShort++
          else withoutFigure++
          continue
        }
        const key = urlDigest(article.link)
        add({
          id: `site-${key}`,
          candidateId: candidate.id,
          platform: 'site-officiel',
          account: new URL(site.url).hostname,
          postId: key,
          url: article.link,
          text: text.slice(0, 3500),
          claim: article.title,
          publishedAt: article.date || new Date().toISOString(),
          collectedAt: new Date().toISOString(),
          context: article.date ? undefined : 'date de publication absente du flux',
          speaker,
        })
        kept++
      }
      accounts.push({
        candidateId: candidate.id,
        platform: 'site-officiel',
        account: new URL(site.url).hostname,
        messagesExamined: feed.articles.length,
      })
      // Quand rien n'est retenu, dire pourquoi : sans cela, un flux muet et un
      // flux d'annonces d'événements se ressemblent dans le journal, et on ne
      // sait pas s'il faut corriger le filtre ou changer de source.
      const cause =
        kept > 0 ? '' : ` — ${tooShort} trop court(s), ${withoutFigure} sans chiffre`
      console.log(
        `    · ${candidate.lastName.padEnd(14)} ${feed.url.padEnd(38)} [${feed.via}] ${feed.articles.length} article(s), ${kept} retenue(s)${cause}`,
      )
      // Un seul flux par candidat : le premier trouvé fait foi, et interroger
      // aussi le parti doublonnerait la ligne d'un mouvement sur ses candidats.
      break
    }
  }

  log.push({
    source: 'Sites officiels',
    status: sitesFound > 0 ? 'ok' : 'échec',
    detail: `${sitesFound} flux trouvé(s) sur ${sitesTried} site(s) essayé(s)`,
  })
}

// ---------------------------------------------------------------------------
// Bluesky
// ---------------------------------------------------------------------------

interface BlueskyFeed {
  feed?: { post?: { uri?: string; record?: { text?: string; createdAt?: string } } }[]
}

async function collectBluesky(add: (c: Quote) => void, accounts: TrackedAccount[]) {
  const tracked = candidates.flatMap((candidate) =>
    candidate.socialAccounts
      .filter((c) => c.platform === 'bluesky')
      .map((c) => ({ candidate, handle: c.handle })),
  )
  if (tracked.length === 0) {
    log.push({
      source: 'Bluesky',
      status: 'ignorée',
      detail: 'aucun compte Bluesky officiel confirmé parmi les candidats',
    })
    return
  }

  for (const { candidate, handle } of tracked) {
    try {
      const feed = await json<BlueskyFeed>(
        `${BLUESKY_SOURCE.root}${BLUESKY_SOURCE.cheminFil}` +
          `?actor=${encodeURIComponent(handle)}&limit=${MESSAGES_PER_ACCOUNT}&filter=posts_no_replies`,
      )
      const messages = feed.feed ?? []
      let kept = 0
      for (const element of messages) {
        const text = element.post?.record?.text
        const uri = element.post?.uri
        const date = element.post?.record?.createdAt
        if (!text || !uri || !date) continue
        if (!containsCheckableClaim(text)) continue
        // at://did:plc:xxx/app.bsky.feed.post/CLE → dernier segment.
        const key = uri.split('/').pop()!
        add({
          id: `bluesky-${key}`,
          candidateId: candidate.id,
          platform: 'bluesky',
          account: handle,
          postId: key,
          url: `https://bsky.app/profile/${handle}/post/${key}`,
          text,
          claim: text,
          publishedAt: new Date(date).toISOString(),
          collectedAt: new Date().toISOString(),
        })
        kept++
      }
      accounts.push({
        candidateId: candidate.id,
        platform: 'bluesky',
        account: handle,
        messagesExamined: messages.length,
      })
      console.log(
        `    · ${candidate.lastName.padEnd(14)} ${handle.padEnd(28)} ${messages.length} message(s), ${kept} retenue(s)`,
      )
    } catch (e) {
      const message = reason(e)
      accounts.push({ candidateId: candidate.id, platform: 'bluesky', account: handle, error: message })
      console.error(`    ✗ ${candidate.lastName.padEnd(14)} ${handle} — ${message}`)
    }
  }
  log.push({ source: 'Bluesky', status: 'ok', detail: `${tracked.length} compte(s) interrogé(s)` })
}

// ---------------------------------------------------------------------------
// X, optionnel
// ---------------------------------------------------------------------------

async function collectX(add: (c: Quote) => void, accounts: TrackedAccount[]) {
  if (!xToken) {
    log.push({
      source: 'X',
      status: 'ignorée',
      detail: 'aucun jeton X_BEARER_TOKEN — source payante, non requise',
    })
    return
  }
  const tracked = candidates.flatMap((candidate) =>
    candidate.socialAccounts
      .filter((c) => c.platform === 'x')
      .map((c) => ({ candidate, handle: c.handle })),
  )
  let reads = 0
  for (const { candidate, handle } of tracked) {
    try {
      const headers = { Authorization: `Bearer ${xToken}` }
      const user = await json<{ data?: { id: string } }>(
        `https://api.x.com/2/users/by/username/${handle}`,
        headers,
      )
      if (!user.data) throw new Error('compte introuvable')
      const messages = await json<{ data?: { id: string; text: string; created_at: string }[] }>(
        `https://api.x.com/2/users/${user.data.id}/tweets` +
          `?max_results=${MESSAGES_PER_ACCOUNT}&exclude=retweets,replies&tweet.fields=created_at`,
        headers,
      )
      const list = messages.data ?? []
      reads += list.length
      for (const message of list) {
        if (!containsCheckableClaim(message.text)) continue
        add({
          id: `x-${message.id}`,
          candidateId: candidate.id,
          platform: 'x',
          account: handle,
          postId: message.id,
          url: `https://x.com/${handle}/status/${message.id}`,
          text: message.text,
          claim: message.text,
          publishedAt: message.created_at,
          collectedAt: new Date().toISOString(),
        })
      }
      accounts.push({
        candidateId: candidate.id,
        platform: 'x',
        account: handle,
        messagesExamined: list.length,
      })
    } catch (e) {
      const message = reason(e)
      accounts.push({ candidateId: candidate.id, platform: 'x', account: handle, error: message })
    }
  }
  log.push({
    source: 'X',
    status: 'ok',
    detail: `${reads} lecture(s) facturée(s), environ ${(reads * 0.005 + tracked.length * 0.01).toFixed(2)} $`,
  })
}

// ---------------------------------------------------------------------------
// Veille des vérifications publiées
// ---------------------------------------------------------------------------

async function collectWatch(existing: Map<string, WatchPublication>) {
  const candidateNames = candidates.map((c) => ({
    id: c.id,
    cles: [normalizeName(`${c.firstName} ${c.lastName}`), normalizeName(c.lastName)],
  }))

  for (const source of WATCH_SOURCES) {
    try {
      const answer = await read(source.url)
      if (!answer.ok) throw new Error(`réponse ${answer.status}`)
      const articles = readFeed(answer.text)
      let added = 0
      for (const article of articles) {
        const id = watchId(source.id, article.link)
        if (existing.has(id)) continue
        const normalizedTitle = normalizeName(article.title)
        const likely = candidateNames
          .filter((c) => c.cles.some((key) => key.length > 4 && normalizedTitle.includes(key)))
          .map((c) => c.id)
        existing.set(id, {
          id,
          title: article.title,
          url: article.link,
          publisher: source.publisher,
          publishedAt: article.date,
          collectedAt: new Date().toISOString(),
          likelyCandidates: likely,
        })
        added++
      }
      log.push({
        source: `${source.lastName} (${source.publisher})`,
        status: 'ok',
        detail: `${articles.length} article(s) lu(s), ${added} nouveau(x)`,
      })
      console.log(`    · ${source.lastName.padEnd(18)} ${articles.length} article(s), ${added} nouveau(x)`)
    } catch (e) {
      const message = reason(e)
      log.push({ source: `${source.lastName} (${source.publisher})`, status: 'échec', detail: message })
      console.error(
        `    ✗ ${source.lastName.padEnd(18)} ${message}` +
          (source.urlConfirmed ? '' : ' — adresse de flux non confirmée, à corriger dans src/data/sources-citations.ts'),
      )
    }
  }
}

// ---------------------------------------------------------------------------

function loadExisting(): FactCheckSnapshot {
  if (!existsSync(FILE)) {
    return {
      version: SNAPSHOT_VERSION,
      generatedAt: '',
      accounts: [],
      quotes: [],
      verifications: [],
      watch: [],
    }
  }
  const raw = JSON.parse(readFileSync(FILE, 'utf8')) as FactCheckSnapshot
  if (raw.version !== SNAPSHOT_VERSION) {
    throw new Error(
      `L’instantané existant est en version ${raw.version}, le script écrit en version ${SNAPSHOT_VERSION}. Migration manuelle requise.`,
    )
  }
  return { ...raw, watch: raw.watch ?? [] }
}

async function collect() {
  const existing = loadExisting()
  const quotes = new Map(existing.quotes.map((c) => [c.id, c]))
  const watch = new Map((existing.watch ?? []).map((v) => [v.id, v]))
  const accounts: TrackedAccount[] = []
  const before = quotes.size
  const add = (c: Quote) => {
    if (!quotes.has(c.id)) quotes.set(c.id, c)
  }

  const withoutSocialAccount = candidates.filter((c) => c.socialAccounts.length === 0)
  console.log(`\n${candidates.length} candidat(s) au total.`)
  if (withoutSocialAccount.length > 0) {
    console.log(
      `Sans compte social confirmé : ${withoutSocialAccount.map((c) => c.lastName).join(', ')}. ` +
        'Ils restent couverts par le flux de leur site officiel s’il en publie un.',
    )
  }

  if (attempt) {
    console.log('\nEssai : sources qui seraient interrogées, sans aucun appel réseau.')
    if (isActive('sites')) {
      const withSite = candidates.filter((c) =>
        c.officialLinks.some((l) => l.type === 'candidat' || l.type === 'parti'),
      ).length
      console.log(
        `  · Sites officiels — ${withSite} site(s) à sonder, flux déclaré d'abord, puis ${COMMON_FEED_PATHS.length} chemins conventionnels`,
      )
    }
    if (isActive('bluesky')) {
      const n = candidates.filter((c) => c.socialAccounts.some((s) => s.platform === 'bluesky')).length
      console.log(`  · Bluesky — API publique, ${n} compte(s) déclaré(s)`)
    }
    for (const source of WATCH_SOURCES) {
      if (isActive('veille')) console.log(`  · Veille ${source.lastName} — ${source.url}`)
    }
    if (isActive('x')) console.log(`  · X — ${xToken ? 'jeton présent' : 'aucun jeton, serait ignorée'}`)
    console.log('\nAucun fichier écrit.\n')
    return
  }

  if (isActive('sites')) {
    console.log('\n  Sites officiels — flux de syndication, découverte automatique')
    await collectOfficialSites(add, accounts)
  }

  if (isActive('bluesky')) {
    console.log('\n  Bluesky — API publique, sans compte ni jeton')
    await collectBluesky(add, accounts)
  }

  if (isActive('x')) {
    console.log('\n  X — source payante')
    await collectX(add, accounts)
  }

  if (isActive('veille')) {
    console.log('\n  Veille des vérifications publiées')
    await collectWatch(watch)
  }

  const verified = new Set(existing.verifications.map((v) => v.quoteId))
  const byDateDesc = [...quotes.values()].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  )
  const kept = [
    ...byDateDesc.filter((c) => verified.has(c.id)),
    ...byDateDesc.filter((c) => !verified.has(c.id)).slice(0, PENDING_QUOTES_KEPT),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const dropped = byDateDesc.length - kept.length

  const snapshot: FactCheckSnapshot = {
    version: SNAPSHOT_VERSION,
    generatedAt: new Date().toISOString(),
    accounts,
    quotes: kept,
    verifications: existing.verifications,
    watch: [...watch.values()]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, WATCH_KEPT),
  }
  writeFileSync(FILE, `${JSON.stringify(snapshot, null, 2)}\n`)

  console.log('\n  Bilan par source')
  for (const row of log) {
    const marker = row.status === 'ok' ? '·' : row.status === 'ignorée' ? '–' : '✗'
    console.log(`    ${marker} ${row.source.padEnd(32)} ${row.detail}`)
  }
  const byPlatform = new Map<Platform, number>()
  for (const quote of snapshot.quotes) {
    byPlatform.set(quote.platform, (byPlatform.get(quote.platform) ?? 0) + 1)
  }
  const succeeded = log.filter((l) => l.status === 'ok').length
  console.log(
    `\n${snapshot.quotes.length} citation(s), dont ${snapshot.quotes.length - before} nouvelle(s) : ` +
      [...byPlatform].map(([p, n]) => `${n} ${p}`).join(', ') +
      `\n${snapshot.verifications.length} vérification(s) conservée(s).` +
      `\n${snapshot.watch.length} publication(s) en veille.` +
      (dropped > 0
        ? `\n${dropped} citation(s) en attente écartée(s) par la rétention ; aucune citation vérifiée n’est perdue.`
        : '') +
      `\nÉcrit dans ${FILE}.` +
      // L'écart entre cette ligne et la fin du pas d'intégration continue dit
      // s'il reste des connexions non libérées : le journal doit permettre de
      // le voir sans relire les horodatages du déclencheur.
      `\nCollecte faite en ${Math.round((Date.now() - startMs) / 1000)} s.\n`,
  )

  if (succeeded === 0) {
    throw new Error(
      'aucune source n’a abouti. L’instantané précédent est conservé tel quel ; ' +
        'voir le bilan ci-dessus pour le motif de chaque échec.',
    )
  }
}

collect().catch((error) => {
  console.error(`\nÉchec de la collecte : ${error instanceof Error ? error.message : error}\n`)
  process.exit(1)
})
