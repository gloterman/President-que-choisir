/**
 * Couche réseau de la collecte.
 *
 * Isolée du collecteur pour être testable : les défauts qui ont coûté le plus
 * cher ici n'étaient pas dans le choix des sources mais dans la conduite des
 * requêtes — un délai qui ne couvrait pas la lecture du corps, un corps non
 * consommé qui retenait sa connexion. Ces cas se reproduisent contre un
 * serveur local, et le sont.
 */

/**
 * Déplie la chaîne des causes.
 *
 * `fetch` échoue avec le message générique « fetch failed » et range la cause
 * réelle — DNS, TLS, connexion refusée, expiration — dans `cause`. Sans ce
 * dépliage, un journal de collecte ne dit rien d'exploitable.
 */
export function reason(error: unknown): string {
  const shares: string[] = []
  let current: unknown = error
  let codes = ''
  for (let depth = 0; current instanceof Error && depth < 4; depth++) {
    const code = (current as { code?: string }).code
    if (code) codes += ` ${code}`
    shares.push(code ? `${current.message} (${code})` : current.message)
    current = (current as { cause?: unknown }).cause
  }
  const text = shares.length > 0 ? shares.join(' ← ') : String(error)
  // Un délai de connexion dépassé ne vient jamais du chemin d'API : le nom se
  // résout, mais rien n'écoute ou le trajet est coupé. Le dire évite de partir
  // corriger une adresse qui est peut-être juste.
  if (codes.includes('UND_ERR_CONNECT_TIMEOUT') || codes.includes('ETIMEDOUT')) {
    return `${text} — la connexion n’aboutit pas ; le service est injoignable depuis cet exécuteur, ce n’est pas un chemin d’API erroné`
  }
  return text
}

/**
 * Options de récupération.
 *
 * La reprise et le délai long conviennent à une adresse dont on attend une
 * réponse. Ils sont ruineux pour une adresse spéculative : sonder six chemins
 * sur un hôte injoignable coûterait 2 minutes par site, et une demi-heure sur
 * l'ensemble. Le sondage les désactive donc.
 */
/** Délai par défaut, pour une adresse dont on attend une réponse. */
export const TIMEOUT_MS = 20000
/**
 * Délai d'une sonde de découverte.
 *
 * Court, parce qu'une adresse spéculative est le plus souvent absente : le
 * coût du sondage doit rester proportionné à ce qu'on espère y trouver.
 */
export const PROBE_TIMEOUT_MS = 6000
/** Plafond de lecture d'un corps : un flux légitime tient largement dedans. */
export const MAX_BODY = 4 * 1024 * 1024

export interface FetchOptions {
  headers?: Record<string, string>
  retry?: boolean
  timeoutMs?: number
}

/** Ce qu'une lecture rapporte : le statut, et le corps déjà lu en entier. */
export interface Answer {
  ok: boolean
  status: number
  text: string
}

/**
 * Lit une adresse, en-têtes **et corps**, sous un même délai.
 *
 * Le délai doit couvrir la lecture du corps, pas seulement l'arrivée des
 * en-têtes. Une version antérieure arrêtait la minuterie en rendant la
 * réponse : le corps se lisait ensuite sans aucune limite, et un serveur qui
 * répondait puis n'envoyait plus rien suspendait la collecte indéfiniment.
 * C'est ce qui a bloqué l'exécution du 4 septembre à 21:27, ajoutée aux onze
 * pages d'accueil que la découverte lit désormais.
 *
 * Le corps est lu jusqu'à une taille plafond : un flux légitime tient
 * largement dedans, et rien n'oblige à ingérer ce qu'un serveur voudrait
 * envoyer sans fin.
 */
export async function read(url: string, options: FetchOptions = {}): Promise<Answer> {
  const { headers = {}, retry = true, timeoutMs = TIMEOUT_MS } = options
  // Une seule reprise : un échec de connexion est souvent passager, mais
  // insister davantage sur un service public gratuit serait discourtois.
  let last: unknown
  const attempts = retry ? 2 : 1
  for (let attemptNumber = 0; attemptNumber < attempts; attemptNumber++) {
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), timeoutMs)
    try {
      const answer = await fetch(url, {
        signal: abort.signal,
        headers: {
          'User-Agent': 'president-que-choisir/1.0 (+collecte citations)',
          Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8',
          ...headers,
        },
      })
      // Un statut d'erreur n'a pas de corps qui nous intéresse, mais le laisser
      // non consommé retiendrait la connexion et empêcherait le processus de
      // se terminer.
      if (!answer.ok) {
        await answer.body?.cancel().catch(() => {})
        return { ok: false, status: answer.status, text: '' }
      }
      return { ok: true, status: answer.status, text: await boundedBody(answer) }
    } catch (e) {
      last = e
      if (attemptNumber < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 1500))
    } finally {
      clearTimeout(timer)
    }
  }
  throw new Error(reason(last))
}

/** Lit le corps par morceaux et s'arrête au plafond. */
async function boundedBody(answer: Response): Promise<string> {
  if (!answer.body) return ''
  const decode = new TextDecoder('utf-8')
  const reader = answer.body.getReader()
  let text = ''
  let bytes = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      text += decode.decode(value, { stream: true })
      if (bytes >= MAX_BODY) break
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
  return text + decode.decode()
}

export async function json<T>(url: string, headers?: Record<string, string>): Promise<T> {
  const answer = await read(url, { headers })
  if (!answer.ok) throw new Error(`réponse ${answer.status} sur ${url}`)
  return JSON.parse(answer.text) as T
}
