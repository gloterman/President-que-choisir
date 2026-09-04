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
export function motif(erreur: unknown): string {
  const parties: string[] = []
  let courant: unknown = erreur
  let codes = ''
  for (let profondeur = 0; courant instanceof Error && profondeur < 4; profondeur++) {
    const code = (courant as { code?: string }).code
    if (code) codes += ` ${code}`
    parties.push(code ? `${courant.message} (${code})` : courant.message)
    courant = (courant as { cause?: unknown }).cause
  }
  const texte = parties.length > 0 ? parties.join(' ← ') : String(erreur)
  // Un délai de connexion dépassé ne vient jamais du chemin d'API : le nom se
  // résout, mais rien n'écoute ou le trajet est coupé. Le dire évite de partir
  // corriger une adresse qui est peut-être juste.
  if (codes.includes('UND_ERR_CONNECT_TIMEOUT') || codes.includes('ETIMEDOUT')) {
    return `${texte} — la connexion n’aboutit pas ; le service est injoignable depuis cet exécuteur, ce n’est pas un chemin d’API erroné`
  }
  return texte
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
export const DELAI_MS = 20000
/**
 * Délai d'une sonde de découverte.
 *
 * Court, parce qu'une adresse spéculative est le plus souvent absente : le
 * coût du sondage doit rester proportionné à ce qu'on espère y trouver.
 */
export const DELAI_SONDE_MS = 6000
/** Plafond de lecture d'un corps : un flux légitime tient largement dedans. */
export const CORPS_MAXIMAL = 4 * 1024 * 1024

export interface OptionsRecuperation {
  entetes?: Record<string, string>
  reprise?: boolean
  delaiMs?: number
}

/** Ce qu'une lecture rapporte : le statut, et le corps déjà lu en entier. */
export interface Reponse {
  ok: boolean
  statut: number
  texte: string
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
export async function lire(url: string, options: OptionsRecuperation = {}): Promise<Reponse> {
  const { entetes = {}, reprise = true, delaiMs = DELAI_MS } = options
  // Une seule reprise : un échec de connexion est souvent passager, mais
  // insister davantage sur un service public gratuit serait discourtois.
  let derniere: unknown
  const essais = reprise ? 2 : 1
  for (let essaiNumero = 0; essaiNumero < essais; essaiNumero++) {
    const abandon = new AbortController()
    const minuterie = setTimeout(() => abandon.abort(), delaiMs)
    try {
      const reponse = await fetch(url, {
        signal: abandon.signal,
        headers: {
          'User-Agent': 'president-que-choisir/1.0 (+collecte citations)',
          Accept: 'application/json, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8',
          ...entetes,
        },
      })
      // Un statut d'erreur n'a pas de corps qui nous intéresse, mais le laisser
      // non consommé retiendrait la connexion et empêcherait le processus de
      // se terminer.
      if (!reponse.ok) {
        await reponse.body?.cancel().catch(() => {})
        return { ok: false, statut: reponse.status, texte: '' }
      }
      return { ok: true, statut: reponse.status, texte: await corpsBorne(reponse) }
    } catch (e) {
      derniere = e
      if (essaiNumero < essais - 1) await new Promise((suite) => setTimeout(suite, 1500))
    } finally {
      clearTimeout(minuterie)
    }
  }
  throw new Error(motif(derniere))
}

/** Lit le corps par morceaux et s'arrête au plafond. */
async function corpsBorne(reponse: Response): Promise<string> {
  if (!reponse.body) return ''
  const decodeur = new TextDecoder('utf-8')
  const lecteur = reponse.body.getReader()
  let texte = ''
  let octets = 0
  try {
    for (;;) {
      const { done, value } = await lecteur.read()
      if (done) break
      octets += value.byteLength
      texte += decodeur.decode(value, { stream: true })
      if (octets >= CORPS_MAXIMAL) break
    }
  } finally {
    await lecteur.cancel().catch(() => {})
  }
  return texte + decodeur.decode()
}

export async function json<T>(url: string, entetes?: Record<string, string>): Promise<T> {
  const reponse = await lire(url, { entetes })
  if (!reponse.ok) throw new Error(`réponse ${reponse.statut} sur ${url}`)
  return JSON.parse(reponse.texte) as T
}
