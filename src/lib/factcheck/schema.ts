import { candidates } from '@/data/candidates'
import {
  PLATFORMS,
  VERDICTS,
  SNAPSHOT_VERSION,
  type Quote,
  type TrackedAccount,
  type FactCheckSnapshot,
  type VerificationLink,
  type Platform,
  type Verdict,
  type Verification,
  type WatchPublication,
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
export const LIMITS = {
  quotes: 2000,
  watch: 500,
  verifications: 2000,
  accounts: 200,
  text: 4000,
  champCourt: 500,
  liensParVerification: 20,
} as const

const isString = (v: unknown, max: number = LIMITS.champCourt): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max

const isOptionalString = (v: unknown, max: number = LIMITS.champCourt): boolean =>
  v === undefined || (typeof v === 'string' && v.length <= max)

/** ISO 8601, au moins l'année-mois-jour, et analysable par `Date`. */
const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) && !Number.isNaN(Date.parse(v))

/**
 * N'accepte que `https`. Écarte notamment `javascript:` et `data:`, qui
 * deviendraient une exécution de code si l'URL atterrissait dans un `href`.
 */
function isSafeUrl(v: unknown): v is string {
  if (typeof v !== 'string' || v.length > LIMITS.champCourt) return false
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
const HOSTS_BY_PLATFORM: Record<Exclude<Platform, 'site-officiel'>, string[]> = {
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
const OFFICIAL_HOSTS = new Set(
  candidates.flatMap((candidate) =>
    candidate.officialLinks
      .filter((link) => link.type === 'candidat' || link.type === 'parti')
      .flatMap((link) => {
        try {
          const host = new URL(link.url).hostname.toLowerCase()
          // Le flux d'un site peut vivre sur le domaine avec ou sans « www ».
          return host.startsWith('www.') ? [host, host.slice(4)] : [host, `www.${host}`]
        } catch {
          return []
        }
      }),
  ),
)

function isMessageUrl(v: unknown, platform: Platform): v is string {
  if (!isSafeUrl(v)) return false
  const host = new URL(v).hostname.toLowerCase()
  if (platform === 'site-officiel') return OFFICIAL_HOSTS.has(host)
  return HOSTS_BY_PLATFORM[platform].includes(host)
}

const KNOWN_PLATFORMS = new Set(Object.keys(PLATFORMS))

const KNOWN_VERDICTS = new Set(Object.keys(VERDICTS))

function validateQuote(raw: unknown): Quote | null {
  if (typeof raw !== 'object' || raw === null) return null
  const c = raw as Record<string, unknown>
  if (!isString(c.id)) return null
  if (!isString(c.candidateId)) return null
  if (!isString(c.account)) return null
  if (!isString(c.postId)) return null
  if (typeof c.platform !== 'string' || !KNOWN_PLATFORMS.has(c.platform)) return null
  if (!isMessageUrl(c.url, c.platform as Platform)) return null
  if (!isString(c.text, LIMITS.text)) return null
  if (!isString(c.claim, LIMITS.text)) return null
  if (!isIsoDate(c.publishedAt)) return null
  if (!isIsoDate(c.collectedAt)) return null
  if (!isOptionalString(c.themeId)) return null
  if (!isOptionalString(c.context)) return null
  if (c.speaker !== undefined && c.speaker !== 'candidat' && c.speaker !== 'parti') {
    return null
  }
  return {
    id: c.id,
    candidateId: c.candidateId,
    platform: c.platform as Platform,
    account: c.account,
    postId: c.postId,
    url: c.url,
    text: c.text,
    claim: c.claim,
    publishedAt: c.publishedAt,
    collectedAt: c.collectedAt,
    themeId: c.themeId as string | undefined,
    context: c.context as string | undefined,
    speaker: c.speaker as 'candidat' | 'parti' | undefined,
  }
}

function validateWatch(raw: unknown): WatchPublication | null {
  if (typeof raw !== 'object' || raw === null) return null
  const v = raw as Record<string, unknown>
  if (!isString(v.id)) return null
  if (!isString(v.title, LIMITS.text)) return null
  if (!isSafeUrl(v.url)) return null
  if (!isString(v.publisher)) return null
  if (!isIsoDate(v.collectedAt)) return null
  return {
    id: v.id,
    title: v.title,
    url: v.url,
    publisher: v.publisher,
    publishedAt: isIsoDate(v.publishedAt) ? (v.publishedAt as string) : '',
    collectedAt: v.collectedAt,
    likelyCandidates: Array.isArray(v.likelyCandidates)
      ? v.likelyCandidates.filter((c): c is string => isString(c))
      : [],
  }
}

function validateLinks(raw: unknown): VerificationLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, LIMITS.liensParVerification)
    .filter(
      (l): l is VerificationLink =>
        typeof l === 'object' &&
        l !== null &&
        isString((l as Record<string, unknown>).label) &&
        isSafeUrl((l as Record<string, unknown>).url),
    )
    .map((l) => ({ label: l.label, url: l.url }))
}

function validateVerification(raw: unknown): Verification | null {
  if (typeof raw !== 'object' || raw === null) return null
  const v = raw as Record<string, unknown>
  if (!isString(v.quoteId)) return null
  if (typeof v.verdict !== 'string' || !KNOWN_VERDICTS.has(v.verdict)) return null
  if (!isString(v.finding, LIMITS.text)) return null
  if (!isString(v.explanation, LIMITS.text)) return null
  if (!isString(v.verifiedBy)) return null
  if (!isIsoDate(v.verificationDate)) return null

  let retry: Verification['retry']
  if (typeof v.retry === 'object' && v.retry !== null) {
    const r = v.retry as Record<string, unknown>
    if (isString(r.publisher) && isSafeUrl(r.url)) retry = { publisher: r.publisher, url: r.url }
  }

  return {
    quoteId: v.quoteId,
    verdict: v.verdict as Verdict,
    finding: v.finding,
    explanation: v.explanation,
    sourceIds: Array.isArray(v.sourceIds) ? v.sourceIds.filter((s): s is string => isString(s)) : [],
    links: validateLinks(v.links),
    verifiedBy: v.verifiedBy,
    verificationDate: v.verificationDate,
    retry,
    publicCorrection: v.rectificationPublique === true,
    repeatedAfterDenial: v.repriseApresDementi === true,
  }
}

function validateAccount(raw: unknown): TrackedAccount | null {
  if (typeof raw !== 'object' || raw === null) return null
  const c = raw as Record<string, unknown>
  if (!isString(c.candidateId) || !isString(c.account)) return null
  if (typeof c.platform !== 'string' || !KNOWN_PLATFORMS.has(c.platform)) return null
  return {
    candidateId: c.candidateId,
    platform: c.platform as Platform,
    account: c.account,
    messagesExamined: typeof c.messagesExamined === 'number' ? c.messagesExamined : undefined,
    error: typeof c.error === 'string' ? c.error.slice(0, LIMITS.champCourt) : undefined,
  }
}

export interface ValidationResult {
  snapshot: FactCheckSnapshot
  /** Entrées écartées parce qu'elles ne respectaient pas le format. */
  rejected: number
}

export function validateSnapshot(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Instantané illisible : la réponse n’est pas un objet JSON.')
  }
  const i = raw as Record<string, unknown>
  if (i.version !== SNAPSHOT_VERSION) {
    throw new Error(
      `Instantané en version ${String(i.version)}, alors que le site attend la version ${SNAPSHOT_VERSION}.`,
    )
  }

  let rejected = 0
  const keep = <T>(source: unknown, limit: number, validate: (x: unknown) => T | null): T[] => {
    if (!Array.isArray(source)) return []
    const output: T[] = []
    for (const element of source.slice(0, limit)) {
      const valid = validate(element)
      if (valid) output.push(valid)
      else rejected++
    }
    return output
  }

  const quotes = keep(i.quotes, LIMITS.quotes, validateQuote)
  const quoteIds = new Set(quotes.map((c) => c.id))
  const verifications = keep(i.verifications, LIMITS.verifications, validateVerification)
    // Une vérification orpheline ne peut pas être affichée : sans sa citation,
    // on ne saurait pas de quelle déclaration on parle.
    .filter((v) => {
      const linkedTo = quoteIds.has(v.quoteId)
      if (!linkedTo) rejected++
      return linkedTo
    })

  return {
    snapshot: {
      version: SNAPSHOT_VERSION,
      generatedAt: isIsoDate(i.generatedAt) ? (i.generatedAt as string) : '',
      accounts: keep(i.accounts, LIMITS.accounts, validateAccount),
      quotes,
      verifications,
      watch: keep(i.watch, LIMITS.watch, validateWatch),
    },
    rejected,
  }
}
