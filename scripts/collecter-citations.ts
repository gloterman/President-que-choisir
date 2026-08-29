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
 *  — l'open data parlementaire, qui donne des interventions verbatim,
 *    horodatées, rattachées à un débat identifié et publiées sous licence
 *    ouverte. C'est le socle : contrairement à un message sur un réseau
 *    social, une intervention en séance ne disparaît pas si son auteur
 *    l'efface ;
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
  SOURCES_PARLEMENTAIRES,
  SOURCES_VEILLE,
  SOURCE_BLUESKY,
} from '../src/data/sources-citations'
import { lireFlux, normaliserNom } from '../src/lib/factcheck/rss'

const FICHIER = 'public/donnees/factcheck.json'
const DELAI_MS = 20000
const MESSAGES_PAR_COMPTE = 50
const INTERVENTIONS_PAR_ELU = 40

const args = process.argv.slice(2)
const essai = args.includes('--essai')
const filtre = args.find((a) => a.startsWith('--sources='))?.slice('--sources='.length)
const sourcesDemandees = filtre ? new Set(filtre.split(',')) : null
const actif = (id: string) => (sourcesDemandees ? sourcesDemandees.has(id) : id !== 'x')

const jetonX = process.env.X_BEARER_TOKEN ?? process.env.X_API_BEARER_TOKEN ?? ''

const journal: { source: string; statut: 'ok' | 'ignorée' | 'échec'; detail: string }[] = []

async function recuperer(url: string, entetes: Record<string, string> = {}): Promise<Response> {
  const abandon = new AbortController()
  const minuterie = setTimeout(() => abandon.abort(), DELAI_MS)
  try {
    return await fetch(url, {
      signal: abandon.signal,
      headers: { 'User-Agent': 'president-que-choisir/1.0 (+collecte citations)', ...entetes },
    })
  } finally {
    clearTimeout(minuterie)
  }
}

async function json<T>(url: string, entetes?: Record<string, string>): Promise<T> {
  const reponse = await recuperer(url, entetes)
  if (!reponse.ok) throw new Error(`réponse ${reponse.status} sur ${url}`)
  return (await reponse.json()) as T
}

/**
 * Retient les déclarations qui contiennent une affirmation vérifiable.
 *
 * Le filtre penche volontairement vers l'inclusion : mieux vaut collecter une
 * citation qui se révélera invérifiable que d'écarter en amont, par une règle
 * opaque, une déclaration qui méritait examen.
 */
function contientUneAffirmationVerifiable(texte: string): boolean {
  const sansLiens = texte.replace(/https?:\/\/\S+/g, '').trim()
  if (sansLiens.length < 80) return false
  const quantite = /\b(?:%|pour cent|milliards?|millions?|milliers?|euros?|points?)\b/i.test(texte)
  const chiffre = /\d/.test(texte)
  const comparatif =
    /\b(?:plus|moins|jamais|toujours|premier|première|record|multiplié|divisé|augment|baiss|diminu)\w*/i.test(
      texte,
    )
  return quantite || (chiffre && comparatif)
}

/** Lit une valeur imbriquée sans présumer de la forme exacte de la réponse. */
function champ(objet: unknown, ...cles: string[]): string | undefined {
  if (typeof objet !== 'object' || objet === null) return undefined
  const source = objet as Record<string, unknown>
  for (const cle of cles) {
    const valeur = source[cle]
    if (typeof valeur === 'string' && valeur.trim()) return valeur.trim()
    if (typeof valeur === 'number') return String(valeur)
  }
  return undefined
}

/** Déballe les enveloppes du type `{ depute: {…} }` utilisées par ces API. */
function deballer(element: unknown): Record<string, unknown> {
  if (typeof element !== 'object' || element === null) return {}
  const objet = element as Record<string, unknown>
  const cles = Object.keys(objet)
  if (cles.length === 1 && typeof objet[cles[0]] === 'object' && objet[cles[0]] !== null) {
    return objet[cles[0]] as Record<string, unknown>
  }
  return objet
}

function listeDe(charge: unknown): unknown[] {
  if (Array.isArray(charge)) return charge
  if (typeof charge !== 'object' || charge === null) return []
  for (const valeur of Object.values(charge as Record<string, unknown>)) {
    if (Array.isArray(valeur)) return valeur
  }
  return []
}

// ---------------------------------------------------------------------------
// Open data parlementaire
// ---------------------------------------------------------------------------

async function collecterParlementaire(
  source: (typeof SOURCES_PARLEMENTAIRES)[number],
  ajouter: (c: Citation) => void,
  comptes: CompteSuivi[],
) {
  const annuaire = listeDe(await json(`${source.racine}${source.cheminAnnuaire}`)).map(deballer)
  if (annuaire.length === 0) throw new Error('annuaire vide ou de forme inattendue')

  const parNom = new Map<string, Record<string, unknown>>()
  for (const elu of annuaire) {
    const nom = champ(elu, 'nom')
    const slug = champ(elu, 'slug')
    if (nom && slug) parNom.set(normaliserNom(nom), elu)
  }

  let trouves = 0
  for (const candidat of candidats) {
    const cle = normaliserNom(`${candidat.prenom} ${candidat.nom}`)
    const elu = parNom.get(cle)
    if (!elu) continue
    trouves++
    const slug = champ(elu, 'slug')!

    try {
      const brut = await json(
        `${source.racine}${source.cheminInterventions.replace('{slug}', slug)}`,
      )
      const interventions = listeDe(brut).map(deballer).slice(0, INTERVENTIONS_PAR_ELU)
      let retenues = 0
      for (const intervention of interventions) {
        const texte = champ(intervention, 'intervention', 'texte', 'contenu')
        const id = champ(intervention, 'id', 'intervention_id')
        const date = champ(intervention, 'date', 'date_seance')
        if (!texte || !id || !date) continue
        if (!contientUneAffirmationVerifiable(texte)) continue
        ajouter({
          id: `${source.plateforme}-${id}`,
          candidatId: candidat.id,
          plateforme: source.plateforme,
          compte: slug,
          postId: id,
          url: `${source.racine}/${slug}/interventions`,
          texte,
          affirmation: texte,
          datePublication: new Date(date).toISOString(),
          collecteLe: new Date().toISOString(),
          contexte: champ(intervention, 'seance', 'titre', 'sujet'),
        })
        retenues++
      }
      comptes.push({
        candidatId: candidat.id,
        plateforme: source.plateforme,
        compte: slug,
        messagesExamines: interventions.length,
      })
      console.log(
        `    · ${candidat.nom.padEnd(14)} ${slug.padEnd(28)} ${interventions.length} intervention(s), ${retenues} retenue(s)`,
      )
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      comptes.push({ candidatId: candidat.id, plateforme: source.plateforme, compte: slug, erreur: message })
      console.error(`    ✗ ${candidat.nom.padEnd(14)} ${slug} — ${message}`)
    }
  }
  journal.push({
    source: source.nom,
    statut: 'ok',
    detail: `${trouves} candidat(s) retrouvé(s) dans l’annuaire sur ${candidats.length}`,
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
      const message = e instanceof Error ? e.message : String(e)
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
      const message = e instanceof Error ? e.message : String(e)
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
      const reponse = await recuperer(source.url)
      if (!reponse.ok) throw new Error(`réponse ${reponse.status}`)
      const articles = lireFlux(await reponse.text())
      let ajoutes = 0
      for (const article of articles) {
        const id = `veille-${source.id}-${Buffer.from(article.lien).toString('base64url').slice(0, 24)}`
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
      const message = e instanceof Error ? e.message : String(e)
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
        'Ils restent couverts par les sources parlementaires s’ils ont un mandat.',
    )
  }

  if (essai) {
    console.log('\nEssai : sources qui seraient interrogées, sans aucun appel réseau.')
    for (const source of SOURCES_PARLEMENTAIRES) {
      if (actif(source.id)) console.log(`  · ${source.nom} — ${source.racine} (${source.licence})`)
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

  for (const source of SOURCES_PARLEMENTAIRES) {
    if (!actif(source.id)) continue
    console.log(`\n  ${source.nom} — ${source.editeur}, licence ${source.licence}`)
    try {
      await collecterParlementaire(source, ajouter, comptes)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      journal.push({ source: source.nom, statut: 'échec', detail: message })
      console.error(
        `    ✗ ${message}` +
          (source.urlConfirmee ? '' : ' — adresse non confirmée, à corriger dans src/data/sources-citations.ts'),
      )
    }
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

  const instantane: InstantaneFactCheck = {
    version: VERSION_INSTANTANE,
    genereLe: new Date().toISOString(),
    comptes,
    citations: [...citations.values()].sort((a, b) =>
      b.datePublication.localeCompare(a.datePublication),
    ),
    verifications: existant.verifications,
    veille: [...veille.values()].sort((a, b) => b.datePublication.localeCompare(a.datePublication)),
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
  console.log(
    `\n${instantane.citations.length} citation(s), dont ${instantane.citations.length - avant} nouvelle(s) : ` +
      [...parPlateforme].map(([p, n]) => `${n} ${p}`).join(', ') +
      `\n${instantane.verifications.length} vérification(s) conservée(s).` +
      `\n${instantane.veille.length} publication(s) en veille.` +
      `\nÉcrit dans ${FICHIER}.\n`,
  )
}

collecter().catch((erreur) => {
  console.error(`\nÉchec de la collecte : ${erreur instanceof Error ? erreur.message : erreur}\n`)
  process.exit(1)
})
