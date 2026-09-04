import { candidats } from '@/data/candidats'
import {
  PLATEFORMES,
  VERDICTS,
  VERSION_INSTANTANE,
  type Citation,
  type CompteSuivi,
  type InstantaneFactCheck,
  type LienVerification,
  type Plateforme,
  type Verdict,
  type Verification,
  type VeillePublication,
} from '@/data/factcheck'

/**
 * Validation d'un instantané reçu de l'extérieur.
 *
 * Le fichier peut provenir d'un point d'accès distant configuré par
 * l'exploitant, et son contenu — le texte des messages — est écrit par des
 * tiers. Il est donc traité comme une donnée hostile jusqu'à preuve du
 * contraire : structure vérifiée champ par champ, tailles bornées, protocoles
 * d'URL restreints. Une entrée malformée est écartée, elle ne fait pas tomber
 * la page ; c'est ce qui permet d'afficher un instantané partiellement abîmé
 * plutôt que rien.
 */

/** Bornes de sécurité : un instantané anormalement gros est tronqué, pas rendu. */
export const LIMITES = {
  citations: 2000,
  veille: 500,
  verifications: 2000,
  comptes: 200,
  texte: 4000,
  champCourt: 500,
  liensParVerification: 20,
} as const

const estChaine = (v: unknown, max: number = LIMITES.champCourt): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max

const estChaineFacultative = (v: unknown, max: number = LIMITES.champCourt): boolean =>
  v === undefined || (typeof v === 'string' && v.length <= max)

/** ISO 8601, au moins l'année-mois-jour, et analysable par `Date`. */
const estDateIso = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v))

/**
 * N'accepte que `https`. Écarte notamment `javascript:` et `data:`, qui
 * deviendraient une exécution de code si l'URL atterrissait dans un `href`.
 */
function estUrlSure(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > LIMITES.champCourt) return false
  try {
    return new URL(v).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Domaines admis par plateforme.
 *
 * Une citation doit renvoyer vers la source qui l'a publiée, et vers elle
 * seule : sans cette contrainte, un instantané compromis pourrait faire pointer
 * « le message d'origine » vers n'importe quoi.
 */
const HOTES_PAR_PLATEFORME: Record<Exclude<Plateforme, 'site-officiel'>, string[]> = {
  bluesky: ['bsky.app', 'staging.bsky.app'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
}

/**
 * Domaines officiels déclarés dans les fiches.
 *
 * Chaque candidat ayant son propre domaine, la liste ne peut pas être écrite
 * en dur — mais elle ne doit pas non plus être ouverte à tout vent. Elle est
 * donc dérivée des liens officiels des fiches : une citation ne peut renvoyer
 * qu'à un domaine que le site a lui-même déclaré comme officiel.
 */
const HOTES_OFFICIELS = new Set(
  candidats.flatMap((candidat) =>
    candidat.liensOfficiels
      .filter((lien) => lien.type === 'candidat' || lien.type === 'parti')
      .flatMap((lien) => {
        try {
          const hote = new URL(lien.url).hostname.toLowerCase()
          // Le flux d'un site peut vivre sur le domaine avec ou sans « www ».
          return hote.startsWith('www.') ? [hote, hote.slice(4)] : [hote, `www.${hote}`]
        } catch {
          return []
        }
      }),
  ),
)

function estUrlDeMessage(v: unknown, plateforme: Plateforme): v is string {
  if (!estUrlSure(v)) return false
  const hote = new URL(v).hostname.toLowerCase()
  if (plateforme === 'site-officiel') return HOTES_OFFICIELS.has(hote)
  return HOTES_PAR_PLATEFORME[plateforme].includes(hote)
}

const PLATEFORMES_CONNUES = new Set(Object.keys(PLATEFORMES))

const VERDICTS_CONNUS = new Set(Object.keys(VERDICTS))

function validerCitation(brut: unknown): Citation | null {
  if (typeof brut !== 'object' || brut === null) return null
  const c = brut as Record<string, unknown>
  if (!estChaine(c.id)) return null
  if (!estChaine(c.candidatId)) return null
  if (!estChaine(c.compte)) return null
  if (!estChaine(c.postId)) return null
  if (typeof c.plateforme !== 'string' || !PLATEFORMES_CONNUES.has(c.plateforme)) return null
  if (!estUrlDeMessage(c.url, c.plateforme as Plateforme)) return null
  if (!estChaine(c.texte, LIMITES.texte)) return null
  if (!estChaine(c.affirmation, LIMITES.texte)) return null
  if (!estDateIso(c.datePublication)) return null
  if (!estDateIso(c.collecteLe)) return null
  if (!estChaineFacultative(c.themeId)) return null
  if (!estChaineFacultative(c.contexte)) return null
  if (c.porteParole !== undefined && c.porteParole !== 'candidat' && c.porteParole !== 'parti') {
    return null
  }
  return {
    id: c.id,
    candidatId: c.candidatId,
    plateforme: c.plateforme as Plateforme,
    compte: c.compte,
    postId: c.postId,
    url: c.url,
    texte: c.texte,
    affirmation: c.affirmation,
    datePublication: c.datePublication,
    collecteLe: c.collecteLe,
    themeId: c.themeId as string | undefined,
    contexte: c.contexte as string | undefined,
    porteParole: c.porteParole as 'candidat' | 'parti' | undefined,
  }
}

function validerVeille(brut: unknown): VeillePublication | null {
  if (typeof brut !== 'object' || brut === null) return null
  const v = brut as Record<string, unknown>
  if (!estChaine(v.id)) return null
  if (!estChaine(v.titre, LIMITES.texte)) return null
  if (!estUrlSure(v.url)) return null
  if (!estChaine(v.editeur)) return null
  if (!estDateIso(v.collecteLe)) return null
  return {
    id: v.id,
    titre: v.titre,
    url: v.url,
    editeur: v.editeur,
    datePublication: estDateIso(v.datePublication) ? (v.datePublication as string) : '',
    collecteLe: v.collecteLe,
    candidatsPressentis: Array.isArray(v.candidatsPressentis)
      ? v.candidatsPressentis.filter((c): c is string => estChaine(c))
      : [],
  }
}

function validerLiens(brut: unknown): LienVerification[] {
  if (!Array.isArray(brut)) return []
  return brut
    .slice(0, LIMITES.liensParVerification)
    .filter(
      (l): l is LienVerification =>
        typeof l === 'object' &&
        l !== null &&
        estChaine((l as Record<string, unknown>).label) &&
        estUrlSure((l as Record<string, unknown>).url),
    )
    .map((l) => ({ label: l.label, url: l.url }))
}

function validerVerification(brut: unknown): Verification | null {
  if (typeof brut !== 'object' || brut === null) return null
  const v = brut as Record<string, unknown>
  if (!estChaine(v.citationId)) return null
  if (typeof v.verdict !== 'string' || !VERDICTS_CONNUS.has(v.verdict)) return null
  if (!estChaine(v.constat, LIMITES.texte)) return null
  if (!estChaine(v.explication, LIMITES.texte)) return null
  if (!estChaine(v.verifiePar)) return null
  if (!estDateIso(v.dateVerification)) return null

  let reprise: Verification['reprise']
  if (typeof v.reprise === 'object' && v.reprise !== null) {
    const r = v.reprise as Record<string, unknown>
    if (estChaine(r.editeur) && estUrlSure(r.url)) reprise = { editeur: r.editeur, url: r.url }
  }

  return {
    citationId: v.citationId,
    verdict: v.verdict as Verdict,
    constat: v.constat,
    explication: v.explication,
    sourceIds: Array.isArray(v.sourceIds) ? v.sourceIds.filter((s): s is string => estChaine(s)) : [],
    liens: validerLiens(v.liens),
    verifiePar: v.verifiePar,
    dateVerification: v.dateVerification,
    reprise,
    rectificationPublique: v.rectificationPublique === true,
    repriseApresDementi: v.repriseApresDementi === true,
  }
}

function validerCompte(brut: unknown): CompteSuivi | null {
  if (typeof brut !== 'object' || brut === null) return null
  const c = brut as Record<string, unknown>
  if (!estChaine(c.candidatId) || !estChaine(c.compte)) return null
  if (typeof c.plateforme !== 'string' || !PLATEFORMES_CONNUES.has(c.plateforme)) return null
  return {
    candidatId: c.candidatId,
    plateforme: c.plateforme as Plateforme,
    compte: c.compte,
    messagesExamines: typeof c.messagesExamines === 'number' ? c.messagesExamines : undefined,
    erreur: typeof c.erreur === 'string' ? c.erreur.slice(0, LIMITES.champCourt) : undefined,
  }
}

export interface ResultatValidation {
  instantane: InstantaneFactCheck
  /** Entrées écartées parce qu'elles ne respectaient pas le format. */
  rejets: number
}

export function validerInstantane(brut: unknown): ResultatValidation {
  if (typeof brut !== 'object' || brut === null) {
    throw new Error('Instantané illisible : la réponse n’est pas un objet JSON.')
  }
  const i = brut as Record<string, unknown>
  if (i.version !== VERSION_INSTANTANE) {
    throw new Error(
      `Instantané en version ${String(i.version)}, alors que le site attend la version ${VERSION_INSTANTANE}.`,
    )
  }

  let rejets = 0
  const garder = <T>(source: unknown, limite: number, valider: (x: unknown) => T | null): T[] => {
    if (!Array.isArray(source)) return []
    const sortie: T[] = []
    for (const element of source.slice(0, limite)) {
      const valide = valider(element)
      if (valide) sortie.push(valide)
      else rejets++
    }
    return sortie
  }

  const citations = garder(i.citations, LIMITES.citations, validerCitation)
  const idsCitations = new Set(citations.map((c) => c.id))
  const verifications = garder(i.verifications, LIMITES.verifications, validerVerification)
    // Une vérification orpheline ne peut pas être affichée : sans sa citation,
    // on ne saurait pas de quelle déclaration on parle.
    .filter((v) => {
      const rattachee = idsCitations.has(v.citationId)
      if (!rattachee) rejets++
      return rattachee
    })

  return {
    instantane: {
      version: VERSION_INSTANTANE,
      genereLe: estDateIso(i.genereLe) ? (i.genereLe as string) : '',
      comptes: garder(i.comptes, LIMITES.comptes, validerCompte),
      citations,
      verifications,
      veille: garder(i.veille, LIMITES.veille, validerVeille),
    },
    rejets,
  }
}
