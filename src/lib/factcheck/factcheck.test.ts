import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { VERSION_INSTANTANE, type InstantaneFactCheck } from '@/data/factcheck'
import { candidats } from '@/data/candidats'
import { validerInstantane, LIMITES } from './schema'
import { bilanVeracite, notesVeraciteDynamiques, ECHANTILLON_MINIMAL } from './veracite'

/**
 * Forme des identifiants produits par chaque plateforme.
 *
 * X et les comptes rendus parlementaires numérotent ; Bluesky utilise un TID,
 * treize caractères d'un alphabet base32 trié.
 */
const FORME_IDENTIFIANT: Record<string, RegExp> = {
  x: /^\d+$/,
  bluesky: /^[2-7a-z]{13}$/,
  'site-officiel': /^[0-9a-f]{16}$/,
}

const citation = (id: string, candidatId = 'melenchon') => ({
  id,
  candidatId,
  plateforme: 'bluesky',
  compte: 'compte.bsky.social',
  postId: id,
  url: 'https://bsky.app/profile/compte.bsky.social/post/abc',
  texte: 'Un texte de test suffisamment long pour être exploitable.',
  affirmation: 'Un texte de test.',
  datePublication: '2026-08-01T10:00:00.000Z',
  collecteLe: '2026-08-02T10:00:00.000Z',
})

const verification = (citationId: string, verdict: string, extra: object = {}) => ({
  citationId,
  verdict,
  constat: 'Constat de test.',
  explication: 'Explication de test.',
  sourceIds: ['insee'],
  liens: [],
  verifiePar: 'Test',
  dateVerification: '2026-08-03',
  ...extra,
})

// Les fabriques produisent volontairement des objets non typés : la moitié des
// tests portent justement sur des charges malformées, que le type interdirait.
const instantane = (partiel: Record<string, unknown> = {}) => ({
  version: VERSION_INSTANTANE,
  genereLe: '2026-08-03T10:00:00.000Z',
  comptes: [],
  citations: [],
  verifications: [],
  veille: [],
  ...partiel,
})

describe('validation de l’instantané', () => {
  it('refuse une version qu’elle ne sait pas interpréter', () => {
    expect(() => validerInstantane({ ...instantane(), version: 99 })).toThrow(/version/)
  })

  it('refuse une charge qui n’est pas un objet', () => {
    expect(() => validerInstantane('bonjour')).toThrow()
    expect(() => validerInstantane(null)).toThrow()
  })

  it('écarte une URL de message qui n’est pas https', () => {
    const { instantane: valide, rejets } = validerInstantane(
      instantane({
        citations: [{ ...citation('a'), url: 'http://bsky.app/profile/compte.bsky.social/post/abc' }],
      }),
    )
    expect(valide.citations).toHaveLength(0)
    expect(rejets).toBe(1)
  })

  it('écarte une URL de message hébergée ailleurs que sur la plateforme', () => {
    const { instantane: valide } = validerInstantane(
      instantane({ citations: [{ ...citation('a'), url: 'https://exemple.test/faux' }] }),
    )
    expect(valide.citations).toHaveLength(0)
  })

  it('refuse une citation dont l’URL appartient à une autre plateforme que la sienne', () => {
    // Un message de réseau social présenté comme une publication de site
    // officiel lui emprunterait une autorité qu'il n'a pas.
    const { instantane: valide } = validerInstantane(
      instantane({
        citations: [
          { ...citation('a'), plateforme: 'site-officiel', url: 'https://bsky.app/profile/x/post/a' },
        ],
      }),
    )
    expect(valide.citations).toHaveLength(0)
  })

  it('n’accepte une publication de site officiel que sur un domaine déclaré dans les fiches', () => {
    // Sans cette contrainte, un instantané compromis pourrait faire passer
    // n'importe quel site pour la parole officielle d'un candidat.
    const inconnu = validerInstantane(
      instantane({
        citations: [
          {
            ...citation('a'),
            plateforme: 'site-officiel',
            postId: '0123456789abcdef',
            url: 'https://site-inconnu.test/billet',
          },
        ],
      }),
    )
    expect(inconnu.instantane.citations).toHaveLength(0)

    const declare = validerInstantane(
      instantane({
        citations: [
          {
            ...citation('a'),
            plateforme: 'site-officiel',
            postId: '0123456789abcdef',
            url: 'https://melenchon2027.fr/un-billet',
            porteParole: 'candidat',
          },
        ],
      }),
    )
    expect(declare.instantane.citations).toHaveLength(1)
    expect(declare.instantane.citations[0].porteParole).toBe('candidat')
  })

  it('écarte un porte-parole qui n’est ni le candidat ni son mouvement', () => {
    const { instantane: valide } = validerInstantane(
      instantane({ citations: [{ ...citation('a'), porteParole: 'comité de soutien' }] }),
    )
    expect(valide.citations).toHaveLength(0)
  })

  it('écarte une plateforme inconnue', () => {
    const { instantane: valide } = validerInstantane(
      instantane({ citations: [{ ...citation('a'), plateforme: 'facebook' }] }),
    )
    expect(valide.citations).toHaveLength(0)
  })

  it('écarte une entrée de veille dont le lien n’est pas https', () => {
    const { instantane: valide } = validerInstantane(
      instantane({
        veille: [
          {
            id: 'v1',
            titre: 'Un titre',
            url: 'http://exemple.test/article',
            editeur: 'Rédaction',
            datePublication: '2026-08-01',
            collecteLe: '2026-08-02T10:00:00.000Z',
            candidatsPressentis: [],
          },
        ],
      }),
    )
    expect(valide.veille).toHaveLength(0)
  })

  it('accepte une entrée de veille bien formée', () => {
    const { instantane: valide } = validerInstantane(
      instantane({
        veille: [
          {
            id: 'v1',
            titre: 'Un titre',
            url: 'https://exemple.test/article',
            editeur: 'Rédaction',
            datePublication: '2026-08-01',
            collecteLe: '2026-08-02T10:00:00.000Z',
            candidatsPressentis: ['melenchon'],
          },
        ],
      }),
    )
    expect(valide.veille).toHaveLength(1)
  })

  it('écarte un lien de source en javascript:, qui serait exécuté dans un href', () => {
    const { instantane: valide } = validerInstantane(
      instantane({
        citations: [citation('a')],
        verifications: [
          verification('a', 'exact', {
            // eslint-disable-next-line no-script-url
            liens: [{ label: 'piège', url: 'javascript:alert(1)' }],
          }),
        ],
      }),
    )
    expect(valide.verifications[0].liens).toHaveLength(0)
  })

  it('écarte un verdict inconnu', () => {
    const { instantane: valide } = validerInstantane(
      instantane({ citations: [citation('a')], verifications: [verification('a', 'excellent')] }),
    )
    expect(valide.verifications).toHaveLength(0)
  })

  it('écarte une vérification orpheline, dont on ignorerait de quoi elle parle', () => {
    const { instantane: valide, rejets } = validerInstantane(
      instantane({ citations: [], verifications: [verification('inconnue', 'exact')] }),
    )
    expect(valide.verifications).toHaveLength(0)
    expect(rejets).toBe(1)
  })

  it('borne le nombre d’entrées pour qu’un instantané énorme ne bloque pas la page', () => {
    const beaucoup = Array.from({ length: LIMITES.citations + 50 }, (_, i) => citation(`c${i}`))
    const { instantane: valide } = validerInstantane(instantane({ citations: beaucoup }))
    expect(valide.citations).toHaveLength(LIMITES.citations)
  })

  it('tronque un texte anormalement long plutôt que de l’afficher', () => {
    const { instantane: valide } = validerInstantane(
      instantane({ citations: [{ ...citation('a'), texte: 'x'.repeat(LIMITES.texte + 1) }] }),
    )
    expect(valide.citations).toHaveLength(0)
  })

  it('accepte un instantané bien formé', () => {
    const { instantane: valide, rejets } = validerInstantane(
      instantane({ citations: [citation('a')], verifications: [verification('a', 'exact')] }),
    )
    expect(rejets).toBe(0)
    expect(valide.citations).toHaveLength(1)
    expect(valide.verifications).toHaveLength(1)
  })
})

describe('note « rapport aux faits »', () => {
  const avec = (verdicts: string[], extra: object[] = []) =>
    instantane({
      citations: verdicts.map((_, i) => citation(`c${i}`)),
      verifications: verdicts.map((v, i) => verification(`c${i}`, v, extra[i] ?? {})),
    }) as unknown as InstantaneFactCheck

  it('applique le barème : part des affirmations exactes ou plutôt exactes', () => {
    const bilan = bilanVeracite(avec(['exact', 'exact', 'plutot-exact', 'faux']), 'melenchon')
    expect(bilan!.note).toBe(75)
    expect(bilan!.effectif).toBe(4)
  })

  it('exclut du dénominateur les verdicts qui ne tranchent pas', () => {
    const bilan = bilanVeracite(
      avec(['exact', 'faux', 'invérifiable', 'en-attente']),
      'melenchon',
    )
    // Seuls « exact » et « faux » comptent : 1 sur 2.
    expect(bilan!.effectif).toBe(2)
    expect(bilan!.note).toBe(50)
  })

  it('ajoute le bonus de rectification publique prévu au barème', () => {
    const bilan = bilanVeracite(
      avec(['exact', 'faux'], [{}, { rectificationPublique: true }]),
      'melenchon',
    )
    expect(bilan!.note).toBe(55)
  })

  it('retire dix points par reprise d’une affirmation déjà démentie', () => {
    const bilan = bilanVeracite(
      avec(['exact', 'faux'], [{}, { repriseApresDementi: true }]),
      'melenchon',
    )
    expect(bilan!.note).toBe(40)
  })

  it('reste borné à l’intervalle 0–100', () => {
    const bilan = bilanVeracite(
      avec(['faux', 'faux'], [{ repriseApresDementi: true }, { repriseApresDementi: true }]),
      'melenchon',
    )
    expect(bilan!.note).toBe(0)
  })

  it('ne produit aucune note en dessous de l’échantillon minimal', () => {
    const petit = avec(Array.from({ length: ECHANTILLON_MINIMAL - 1 }, () => 'exact'))
    expect(Object.keys(notesVeraciteDynamiques(petit, ['melenchon']))).toEqual([])
  })

  it('produit une note dès que l’échantillon minimal est atteint', () => {
    const suffisant = avec(Array.from({ length: ECHANTILLON_MINIMAL }, () => 'exact'))
    const notes = notesVeraciteDynamiques(suffisant, ['melenchon'])
    expect(notes.melenchon?.[0]).toMatchObject({ critereId: 'veracite', note: 100 })
    expect(notes.melenchon?.[0].confiance).toBe('moyenne')
  })

  it('renvoie null pour un candidat sans citation', () => {
    expect(bilanVeracite(instantane() as unknown as InstantaneFactCheck, 'melenchon')).toBeNull()
  })
})

describe('instantané publié avec le site', () => {
  const publie = JSON.parse(readFileSync('public/donnees/factcheck.json', 'utf8'))

  it('est valide au regard du schéma', () => {
    const { rejets } = validerInstantane(publie)
    expect(rejets).toBe(0)
  })

  it('n’accepte que des identifiants de message conformes à leur plateforme', () => {
    // Un identifiant fabriqué ne prend pas la forme de ceux que produit la
    // plateforme : c'est le signal le plus fiable pour repérer une citation
    // inventée, plus sûr qu'un mot-clé dans le texte.
    for (const citation of publie.citations ?? []) {
      expect(FORME_IDENTIFIANT[citation.plateforme], `plateforme ${citation.plateforme}`).toBeDefined()
      expect(citation.postId, `${citation.id} (${citation.plateforme})`).toMatch(
        FORME_IDENTIFIANT[citation.plateforme],
      )
    }
  })

  it('ne contient aucune donnée de démonstration dans les champs que nous rédigeons', () => {
    // Le contrôle porte sur ce que le site écrit lui-même — identifiants,
    // constats, auteurs de vérification — et non sur le texte des citations.
    // Un propos authentique peut contenir « par exemple » : chercher ce mot
    // dans une citation ferait échouer la collecte sur une donnée valide.
    const nôtres = [
      ...(publie.citations ?? []).map((c: { id: string }) => c.id),
      ...(publie.veille ?? []).map((v: { id: string; editeur: string }) => `${v.id} ${v.editeur}`),
      ...(publie.verifications ?? []).map(
        (v: { constat: string; explication: string; verifiePar: string }) =>
          `${v.constat} ${v.explication} ${v.verifiePar}`,
      ),
    ]
      .join(' ')
      .toLowerCase()
    for (const interdit of ['démonstration', 'demonstration', 'lorem', 'placeholder', 'demo']) {
      expect(nôtres, `« ${interdit} » trouvé dans un champ rédigé par le site`).not.toContain(
        interdit,
      )
    }
  })
})

describe('comptes sociaux des candidats', () => {
  it('n’accepte que des identifiants plausibles pour chaque plateforme', () => {
    for (const candidat of candidats) {
      for (const compte of candidat.comptesSociaux) {
        if (compte.plateforme === 'x') {
          expect(compte.identifiant, candidat.id).toMatch(/^[A-Za-z0-9_]{1,15}$/)
        } else {
          expect(compte.identifiant, candidat.id).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/)
        }
      }
    }
  })

  it('déclare la liste des comptes plutôt que de l’omettre', () => {
    for (const candidat of candidats) {
      expect(Array.isArray(candidat.comptesSociaux), candidat.id).toBe(true)
    }
  })

  it('ne déclare pas deux fois la même plateforme pour un candidat', () => {
    for (const candidat of candidats) {
      const plateformes = candidat.comptesSociaux.map((c) => c.plateforme)
      expect(new Set(plateformes).size, candidat.id).toBe(plateformes.length)
    }
  })
})
