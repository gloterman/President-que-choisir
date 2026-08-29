/**
 * Collecte des déclarations publiées sur X par les candidats.
 *
 *   npm run collecte:citations -- --essai        # sans appel réseau
 *   X_BEARER_TOKEN=… npm run collecte:citations
 *
 * Pourquoi ce script existe côté serveur et non dans le navigateur, alors que
 * la page charge bien les citations à l'ouverture :
 *
 *  1. L'API X exige un jeton porteur. Un jeton livré dans le paquet
 *     JavaScript est lisible par n'importe qui ouvre les outils de
 *     développement — et depuis février 2026 chaque lecture est facturée à
 *     l'usage, donc un jeton exposé se traduit en facture.
 *  2. L'API X ne renvoie pas d'en-têtes CORS permettant l'appel depuis une
 *     page web : le navigateur refuserait la réponse.
 *  3. Une collecte à chaque ouverture de page facturerait une lecture par
 *     visiteur, pour un contenu identique.
 *
 * La collecte est donc programmée, son résultat est publié comme fichier
 * statique, et le site charge ce fichier à l'ouverture puis à la demande.
 *
 * Le script ne supprime jamais une citation déjà vérifiée et n'écrase jamais
 * une vérification : il ajoute.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { candidats } from '../src/data/candidats'
import {
  VERSION_INSTANTANE,
  type Citation,
  type CompteSuivi,
  type InstantaneFactCheck,
} from '../src/data/factcheck'

const FICHIER = 'public/donnees/factcheck.json'
const RACINE_API = 'https://api.x.com/2'
/** Nombre de messages demandés par compte. Chaque lecture est facturée. */
const MESSAGES_PAR_COMPTE = 50

const essai = process.argv.includes('--essai')
const jeton = process.env.X_BEARER_TOKEN ?? process.env.X_API_BEARER_TOKEN ?? ''

/**
 * Retient les messages qui contiennent une affirmation vérifiable.
 *
 * Le filtre est délibérément grossier et penche vers l'inclusion : il vaut
 * mieux collecter une citation qui se révélera invérifiable que d'écarter en
 * amont, par une règle opaque, une déclaration qui méritait examen. Le tri fin
 * est un travail humain, fait à l'étape de vérification.
 */
function contientUneAffirmationVerifiable(texte: string): boolean {
  const chiffre = /\d/.test(texte)
  const comparatif =
    /\b(?:plus|moins|jamais|toujours|premier|première|record|multiplié|divisé|augment|baiss|diminu)\w*\b/i.test(
      texte,
    )
  const quantite = /\b(?:%|pour cent|milliards?|millions?|milliers?|euros?|points?)\b/i.test(texte)
  // Un message purement déclaratif — un remerciement, une annonce d'agenda —
  // n'a rien à vérifier.
  const tropCourt = texte.replace(/https?:\/\/\S+/g, '').trim().length < 60
  return !tropCourt && (quantite || (chiffre && comparatif))
}

async function appeler<T>(chemin: string): Promise<T> {
  const reponse = await fetch(`${RACINE_API}${chemin}`, {
    headers: { Authorization: `Bearer ${jeton}`, 'User-Agent': 'president-que-choisir/1.0' },
  })
  if (reponse.status === 401) {
    throw new Error('Jeton refusé (401). Vérifier X_BEARER_TOKEN.')
  }
  if (reponse.status === 403) {
    throw new Error(
      'Accès refusé (403). Le palier de l’application ne donne pas accès à la lecture des messages.',
    )
  }
  if (reponse.status === 429) {
    const reprise = reponse.headers.get('x-rate-limit-reset')
    throw new Error(
      `Quota atteint (429).${reprise ? ` Réinitialisation à ${new Date(Number(reprise) * 1000).toISOString()}.` : ''}`,
    )
  }
  if (!reponse.ok) {
    throw new Error(`Réponse ${reponse.status} de l’API X sur ${chemin}.`)
  }
  return (await reponse.json()) as T
}

interface ReponseUtilisateur {
  data?: { id: string; username: string; name: string }
}
interface ReponseMessages {
  data?: { id: string; text: string; created_at: string }[]
  meta?: { result_count: number }
}

function chargerExistant(): InstantaneFactCheck {
  if (!existsSync(FICHIER)) {
    return { version: VERSION_INSTANTANE, genereLe: '', comptes: [], citations: [], verifications: [] }
  }
  const brut = JSON.parse(readFileSync(FICHIER, 'utf8')) as InstantaneFactCheck
  if (brut.version !== VERSION_INSTANTANE) {
    throw new Error(
      `L’instantané existant est en version ${brut.version}, le script écrit en version ${VERSION_INSTANTANE}. Migration manuelle requise.`,
    )
  }
  return brut
}

async function collecter() {
  const existant = chargerExistant()
  const citationsParId = new Map(existant.citations.map((c) => [c.id, c]))
  const comptes: CompteSuivi[] = []
  let lecturesUtilisateur = 0
  let lecturesMessages = 0
  let nouvelles = 0

  const suivis = candidats.filter((c) => c.compteX)
  const sansCompte = candidats.filter((c) => !c.compteX)

  console.log(`\nComptes renseignés : ${suivis.length} sur ${candidats.length}`)
  if (sansCompte.length > 0) {
    console.log(
      `Sans compte X confirmé : ${sansCompte.map((c) => c.nom).join(', ')}. ` +
        'Ces candidats sont absents de la collecte tant qu’un compte n’est pas vérifié et renseigné.',
    )
  }

  for (const candidat of suivis) {
    const compte = candidat.compteX!
    if (essai) {
      comptes.push({ candidatId: candidat.id, compte })
      console.log(`  · ${candidat.nom.padEnd(14)} @${compte} — essai, aucun appel réseau`)
      continue
    }

    try {
      const utilisateur = await appeler<ReponseUtilisateur>(`/users/by/username/${compte}`)
      lecturesUtilisateur++
      if (!utilisateur.data) throw new Error(`Compte @${compte} introuvable.`)

      const messages = await appeler<ReponseMessages>(
        `/users/${utilisateur.data.id}/tweets` +
          `?max_results=${MESSAGES_PAR_COMPTE}&exclude=retweets,replies&tweet.fields=created_at`,
      )
      const liste = messages.data ?? []
      lecturesMessages += liste.length

      let retenues = 0
      for (const message of liste) {
        if (!contientUneAffirmationVerifiable(message.text)) continue
        const id = `x-${message.id}`
        if (citationsParId.has(id)) continue
        const citation: Citation = {
          id,
          candidatId: candidat.id,
          compte,
          postId: message.id,
          url: `https://x.com/${compte}/status/${message.id}`,
          texte: message.text,
          datePublication: message.created_at,
          // L'extrait vérifié est renseigné à la main : découper une phrase
          // automatiquement, c'est risquer de faire dire autre chose.
          affirmation: message.text,
          collecteLe: new Date().toISOString(),
        }
        citationsParId.set(id, citation)
        nouvelles++
        retenues++
      }
      comptes.push({ candidatId: candidat.id, compte, messagesExamines: liste.length })
      console.log(
        `  · ${candidat.nom.padEnd(14)} @${compte.padEnd(18)} ${liste.length} message(s) examiné(s), ${retenues} retenue(s)`,
      )
    } catch (erreur) {
      const message = erreur instanceof Error ? erreur.message : String(erreur)
      comptes.push({ candidatId: candidat.id, compte, erreur: message })
      console.error(`  ✗ ${candidat.nom.padEnd(14)} @${compte} — ${message}`)
    }
  }

  const instantane: InstantaneFactCheck = {
    version: VERSION_INSTANTANE,
    genereLe: new Date().toISOString(),
    comptes,
    citations: [...citationsParId.values()].sort((a, b) =>
      b.datePublication.localeCompare(a.datePublication),
    ),
    // Les vérifications existantes sont reportées telles quelles : la collecte
    // n'a pas à toucher au travail de vérification.
    verifications: existant.verifications,
  }

  if (essai) {
    console.log('\nEssai : aucun fichier écrit.\n')
    return
  }

  writeFileSync(FICHIER, `${JSON.stringify(instantane, null, 2)}\n`)

  // La lecture est facturée à l'usage depuis février 2026 : afficher le volume
  // évite les mauvaises surprises sur une collecte programmée.
  const cout = lecturesUtilisateur * 0.01 + lecturesMessages * 0.005
  console.log(
    `\n${instantane.citations.length} citation(s) au total, dont ${nouvelles} nouvelle(s).` +
      `\n${instantane.verifications.length} vérification(s) conservée(s).` +
      `\nVolume facturable : ${lecturesUtilisateur} lecture(s) de compte, ${lecturesMessages} lecture(s) de message` +
      ` — environ ${cout.toFixed(2)} $ au tarif public.` +
      `\nÉcrit dans ${FICHIER}.\n`,
  )
}

if (!essai && !jeton) {
  console.error(
    '\nAucun jeton trouvé dans X_BEARER_TOKEN.\n' +
      'La lecture des messages sur X est authentifiée et facturée à l’usage : il n’existe pas\n' +
      'd’accès anonyme, et le jeton ne doit jamais être placé dans le code du site.\n' +
      'Pour voir ce que ferait le script sans appeler l’API : npm run collecte:citations -- --essai\n',
  )
  process.exit(1)
}

collecter().catch((erreur) => {
  console.error(`\nÉchec de la collecte : ${erreur instanceof Error ? erreur.message : erreur}\n`)
  process.exit(1)
})
