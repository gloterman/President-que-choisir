import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SNAPSHOT_VERSION, type FactCheckSnapshot } from '@/data/factcheck'
import { candidates } from '@/data/candidats'
import { validateSnapshot, LIMITS } from './schema'
import { accuracyReport, dynamicAccuracyRatings, MINIMUM_SAMPLE } from './veracite'

/**
 * Forme des identifiants produits par chaque plateforme.
 *
 * X et les comptes rendus parlementaires numérotent ; Bluesky utilise un TID,
 * treize caractères d'un alphabet base32 trié.
 */
const ID_SHAPE: Record<string, RegExp> = {
  x: /^\d+$/,
  bluesky: /^[2-7a-z]{13}$/,
  'site-officiel': /^[0-9a-f]{16}$/,
}

const quote = (id: string, candidateId = 'melenchon') => ({
  id,
  candidateId,
  platform: 'bluesky',
  account: 'compte.bsky.social',
  postId: id,
  url: 'https://bsky.app/profile/compte.bsky.social/post/abc',
  text: 'Un texte de test suffisamment long pour être exploitable.',
  claim: 'Un texte de test.',
  publishedAt: '2026-08-01T10:00:00.000Z',
  collectedAt: '2026-08-02T10:00:00.000Z',
})

const verification = (quoteId: string, verdict: string, extra: object = {}) => ({
  quoteId,
  verdict,
  finding: 'Constat de test.',
  explanation: 'Explication de test.',
  sourceIds: ['insee'],
  links: [],
  verifiedBy: 'Test',
  verificationDate: '2026-08-03',
  ...extra,
})

// Les fabriques produisent volontairement des objets non typés : la moitié des
// tests portent justement sur des charges malformées, que le type interdirait.
const snapshot = (partial: Record<string, unknown> = {}) => ({
  version: SNAPSHOT_VERSION,
  generatedAt: '2026-08-03T10:00:00.000Z',
  accounts: [],
  quotes: [],
  verifications: [],
  watch: [],
  ...partial,
})

describe('validation de l’instantané', () => {
  it('refuse une version qu’elle ne sait pas interpréter', () => {
    expect(() => validateSnapshot({ ...snapshot(), version: 99 })).toThrow(/version/)
  })

  it('refuse une charge qui n’est pas un objet', () => {
    expect(() => validateSnapshot('bonjour')).toThrow()
    expect(() => validateSnapshot(null)).toThrow()
  })

  it('écarte une URL de message qui n’est pas https', () => {
    const { snapshot: valid, rejected } = validateSnapshot(
      snapshot({
        quotes: [{ ...quote('a'), url: 'http://bsky.app/profile/compte.bsky.social/post/abc' }],
      }),
    )
    expect(valid.quotes).toHaveLength(0)
    expect(rejected).toBe(1)
  })

  it('écarte une URL de message hébergée ailleurs que sur la plateforme', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({ quotes: [{ ...quote('a'), url: 'https://exemple.test/faux' }] }),
    )
    expect(valid.quotes).toHaveLength(0)
  })

  it('refuse une citation dont l’URL appartient à une autre plateforme que la sienne', () => {
    // Un message de réseau social présenté comme une publication de site
    // officiel lui emprunterait une autorité qu'il n'a pas.
    const { snapshot: valid } = validateSnapshot(
      snapshot({
        quotes: [
          { ...quote('a'), platform: 'site-officiel', url: 'https://bsky.app/profile/x/post/a' },
        ],
      }),
    )
    expect(valid.quotes).toHaveLength(0)
  })

  it('n’accepte une publication de site officiel que sur un domaine déclaré dans les fiches', () => {
    // Sans cette contrainte, un instantané compromis pourrait faire passer
    // n'importe quel site pour la parole officielle d'un candidat.
    const unknown = validateSnapshot(
      snapshot({
        quotes: [
          {
            ...quote('a'),
            platform: 'site-officiel',
            postId: '0123456789abcdef',
            url: 'https://site-inconnu.test/billet',
          },
        ],
      }),
    )
    expect(unknown.snapshot.quotes).toHaveLength(0)

    const declared = validateSnapshot(
      snapshot({
        quotes: [
          {
            ...quote('a'),
            platform: 'site-officiel',
            postId: '0123456789abcdef',
            url: 'https://melenchon2027.fr/un-billet',
            speaker: 'candidat',
          },
        ],
      }),
    )
    expect(declared.snapshot.quotes).toHaveLength(1)
    expect(declared.snapshot.quotes[0].speaker).toBe('candidat')
  })

  it('écarte un porte-parole qui n’est ni le candidat ni son mouvement', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({ quotes: [{ ...quote('a'), speaker: 'comité de soutien' }] }),
    )
    expect(valid.quotes).toHaveLength(0)
  })

  it('écarte une plateforme inconnue', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({ quotes: [{ ...quote('a'), platform: 'facebook' }] }),
    )
    expect(valid.quotes).toHaveLength(0)
  })

  it('écarte une entrée de veille dont le lien n’est pas https', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({
        watch: [
          {
            id: 'v1',
            title: 'Un titre',
            url: 'http://exemple.test/article',
            publisher: 'Rédaction',
            publishedAt: '2026-08-01',
            collectedAt: '2026-08-02T10:00:00.000Z',
            likelyCandidates: [],
          },
        ],
      }),
    )
    expect(valid.watch).toHaveLength(0)
  })

  it('accepte une entrée de veille bien formée', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({
        watch: [
          {
            id: 'v1',
            title: 'Un titre',
            url: 'https://exemple.test/article',
            publisher: 'Rédaction',
            publishedAt: '2026-08-01',
            collectedAt: '2026-08-02T10:00:00.000Z',
            likelyCandidates: ['melenchon'],
          },
        ],
      }),
    )
    expect(valid.watch).toHaveLength(1)
  })

  it('écarte un lien de source en javascript:, qui serait exécuté dans un href', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({
        quotes: [quote('a')],
        verifications: [
          verification('a', 'exact', {
            // eslint-disable-next-line no-script-url
            links: [{ label: 'piège', url: 'javascript:alert(1)' }],
          }),
        ],
      }),
    )
    expect(valid.verifications[0].links).toHaveLength(0)
  })

  it('écarte un verdict inconnu', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({ quotes: [quote('a')], verifications: [verification('a', 'excellent')] }),
    )
    expect(valid.verifications).toHaveLength(0)
  })

  it('écarte une vérification orpheline, dont on ignorerait de quoi elle parle', () => {
    const { snapshot: valid, rejected } = validateSnapshot(
      snapshot({ quotes: [], verifications: [verification('inconnue', 'exact')] }),
    )
    expect(valid.verifications).toHaveLength(0)
    expect(rejected).toBe(1)
  })

  it('borne le nombre d’entrées pour qu’un instantané énorme ne bloque pas la page', () => {
    const many = Array.from({ length: LIMITS.quotes + 50 }, (_, i) => quote(`c${i}`))
    const { snapshot: valid } = validateSnapshot(snapshot({ quotes: many }))
    expect(valid.quotes).toHaveLength(LIMITS.quotes)
  })

  it('tronque un texte anormalement long plutôt que de l’afficher', () => {
    const { snapshot: valid } = validateSnapshot(
      snapshot({ quotes: [{ ...quote('a'), text: 'x'.repeat(LIMITS.text + 1) }] }),
    )
    expect(valid.quotes).toHaveLength(0)
  })

  it('accepte un instantané bien formé', () => {
    const { snapshot: valid, rejected } = validateSnapshot(
      snapshot({ quotes: [quote('a')], verifications: [verification('a', 'exact')] }),
    )
    expect(rejected).toBe(0)
    expect(valid.quotes).toHaveLength(1)
    expect(valid.verifications).toHaveLength(1)
  })
})

describe('note « rapport aux faits »', () => {
  const including = (verdicts: string[], extra: object[] = []) =>
    snapshot({
      quotes: verdicts.map((_, i) => quote(`c${i}`)),
      verifications: verdicts.map((v, i) => verification(`c${i}`, v, extra[i] ?? {})),
    }) as unknown as FactCheckSnapshot

  it('applique le barème : part des affirmations exactes ou plutôt exactes', () => {
    const report = accuracyReport(including(['exact', 'exact', 'plutot-exact', 'faux']), 'melenchon')
    expect(report!.rating).toBe(75)
    expect(report!.effective).toBe(4)
  })

  it('exclut du dénominateur les verdicts qui ne tranchent pas', () => {
    const report = accuracyReport(
      including(['exact', 'faux', 'invérifiable', 'en-attente']),
      'melenchon',
    )
    // Seuls « exact » et « faux » comptent : 1 sur 2.
    expect(report!.effective).toBe(2)
    expect(report!.rating).toBe(50)
  })

  it('ajoute le bonus de rectification publique prévu au barème', () => {
    const report = accuracyReport(
      including(['exact', 'faux'], [{}, { publicCorrection: true }]),
      'melenchon',
    )
    expect(report!.rating).toBe(55)
  })

  it('retire dix points par reprise d’une affirmation déjà démentie', () => {
    const report = accuracyReport(
      including(['exact', 'faux'], [{}, { repeatedAfterDenial: true }]),
      'melenchon',
    )
    expect(report!.rating).toBe(40)
  })

  it('reste borné à l’intervalle 0–100', () => {
    const report = accuracyReport(
      including(['faux', 'faux'], [{ repeatedAfterDenial: true }, { repeatedAfterDenial: true }]),
      'melenchon',
    )
    expect(report!.rating).toBe(0)
  })

  it('ne produit aucune note en dessous de l’échantillon minimal', () => {
    const small = including(Array.from({ length: MINIMUM_SAMPLE - 1 }, () => 'exact'))
    expect(Object.keys(dynamicAccuracyRatings(small, ['melenchon']))).toEqual([])
  })

  it('produit une note dès que l’échantillon minimal est atteint', () => {
    const sufficient = including(Array.from({ length: MINIMUM_SAMPLE }, () => 'exact'))
    const ratings = dynamicAccuracyRatings(sufficient, ['melenchon'])
    expect(ratings.melenchon?.[0]).toMatchObject({ criterionId: 'veracite', rating: 100 })
    expect(ratings.melenchon?.[0].confidence).toBe('moyenne')
  })

  it('renvoie null pour un candidat sans citation', () => {
    expect(accuracyReport(snapshot() as unknown as FactCheckSnapshot, 'melenchon')).toBeNull()
  })
})

describe('instantané publié avec le site', () => {
  const published = JSON.parse(readFileSync('public/donnees/factcheck.json', 'utf8'))

  it('est valide au regard du schéma', () => {
    const { rejected } = validateSnapshot(published)
    expect(rejected).toBe(0)
  })

  it('n’accepte que des identifiants de message conformes à leur plateforme', () => {
    // Un identifiant fabriqué ne prend pas la forme de ceux que produit la
    // plateforme : c'est le signal le plus fiable pour repérer une citation
    // inventée, plus sûr qu'un mot-clé dans le texte.
    for (const quote of published.quotes ?? []) {
      expect(ID_SHAPE[quote.platform], `plateforme ${quote.platform}`).toBeDefined()
      expect(quote.postId, `${quote.id} (${quote.platform})`).toMatch(
        ID_SHAPE[quote.platform],
      )
    }
  })

  it('ne contient aucune donnée de démonstration dans les champs que nous rédigeons', () => {
    // Le contrôle porte sur ce que le site écrit lui-même — identifiants,
    // constats, auteurs de vérification — et non sur le texte des citations.
    // Un propos authentique peut contenir « par exemple » : chercher ce mot
    // dans une citation ferait échouer la collecte sur une donnée valide.
    const nôtres = [
      ...(published.quotes ?? []).map((c: { id: string }) => c.id),
      ...(published.watch ?? []).map((v: { id: string; publisher: string }) => `${v.id} ${v.publisher}`),
      ...(published.verifications ?? []).map(
        (v: { finding: string; explanation: string; verifiedBy: string }) =>
          `${v.finding} ${v.explanation} ${v.verifiedBy}`,
      ),
    ]
      .join(' ')
      .toLowerCase()
    for (const forbidden of ['démonstration', 'demonstration', 'lorem', 'placeholder', 'demo']) {
      expect(nôtres, `« ${forbidden} » trouvé dans un champ rédigé par le site`).not.toContain(
        forbidden,
      )
    }
  })
})

describe('comptes sociaux des candidats', () => {
  it('n’accepte que des identifiants plausibles pour chaque plateforme', () => {
    for (const candidate of candidates) {
      for (const account of candidate.socialAccounts) {
        if (account.platform === 'x') {
          expect(account.handle, candidate.id).toMatch(/^[A-Za-z0-9_]{1,15}$/)
        } else {
          expect(account.handle, candidate.id).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/)
        }
      }
    }
  })

  it('déclare la liste des comptes plutôt que de l’omettre', () => {
    for (const candidate of candidates) {
      expect(Array.isArray(candidate.socialAccounts), candidate.id).toBe(true)
    }
  })

  it('ne déclare pas deux fois la même plateforme pour un candidat', () => {
    for (const candidate of candidates) {
      const platforms = candidate.socialAccounts.map((c) => c.platform)
      expect(new Set(platforms).size, candidate.id).toBe(platforms.length)
    }
  })
})
