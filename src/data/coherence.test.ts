import { describe, expect, it } from 'vitest'
import { candidates } from './candidats'
import { criteria } from './criteres'
import { axes, propositions, themes } from './referentiel'
import { sourceById } from './sources'

/**
 * Tests de cohérence du jeu de données.
 *
 * Le contrôle d'intégrité (`npm run lint:data`) vérifie la structure. Ces tests
 * vérifient autre chose : que les affirmations tiennent ensemble. Une note de
 * probité à 100 en face d'une condamnation pour détournement de fonds publics
 * est structurellement valide et factuellement absurde — c'est ce genre de
 * contradiction que l'on attrape ici.
 */

const CONVICTION_STATUSES = [
  'condamnation-definitive',
  'condamnation-appel-pourvoi',
  'condamnation-non-definitive',
] as const

const ratingOf = (candidateId: string, criterionId: string) =>
  candidates.find((c) => c.id === candidateId)?.ratings.find((n) => n.criterionId === criterionId)

describe('contrat de vérification', () => {
  it('exige au moins deux sources pour tout élément marqué « recoupé »', () => {
    const missing = candidates.flatMap((candidate) =>
      [...candidate.legal, ...candidate.facts, ...candidate.measures, ...candidate.indicators]
        .filter((e) => e.verification === 'recoupe' && e.sourceIds.length < 2)
        .map((e) => `${candidate.id}/${e.id}`),
    )
    // « Recoupé » veut dire recoupé : une seule source ne suffit pas à le
    // revendiquer, l'élément doit alors rester « à vérifier ».
    expect(missing).toEqual([])
  })

  it('n’autorise aucune source fantôme', () => {
    const unknown = candidates.flatMap((candidate) =>
      [
        ...candidate.legal,
        ...candidate.facts,
        ...candidate.measures,
        ...candidate.indicators,
        ...candidate.ratings,
      ]
        .flatMap((e) => e.sourceIds)
        .filter((id) => !sourceById.has(id)),
    )
    expect(unknown).toEqual([])
  })

  it('impose une qualification pénale à toute condamnation', () => {
    const withoutCharge = candidates.flatMap((candidate) =>
      candidate.legal
        .filter((a) => CONVICTION_STATUSES.includes(a.status as never) && !a.charge)
        .map((a) => `${candidate.id}/${a.id}`),
    )
    expect(withoutCharge).toEqual([])
  })

  it('impose une date de décision à toute condamnation', () => {
    const withoutDate = candidates.flatMap((candidate) =>
      candidate.legal
        .filter((a) => CONVICTION_STATUSES.includes(a.status as never) && !a.decisionDate)
        .map((a) => `${candidate.id}/${a.id}`),
    )
    expect(withoutDate).toEqual([])
  })
})

describe('cohérence entre les affaires et les notes', () => {
  it('fait baisser les antécédents judiciaires dès qu’une condamnation existe', () => {
    for (const candidate of candidates) {
      const hasConviction = candidate.legal.some((a) =>
        CONVICTION_STATUSES.includes(a.status as never),
      )
      const rating = ratingOf(candidate.id, 'antecedents-judiciaires')
      if (!hasConviction || !rating) continue
      expect(rating.rating, `${candidate.id} : condamnation connue mais antécédents à 100`).toBeLessThan(
        100,
      )
    }
  })

  it('n’attribue jamais 100 en probité à qui est condamné pour atteinte à la probité', () => {
    for (const candidate of candidates) {
      const integrityOffence = candidate.legal.some(
        (a) =>
          CONVICTION_STATUSES.includes(a.status as never) &&
          /détournement|corruption|prise illégale|fraude fiscale/i.test(a.charge ?? ''),
      )
      const rating = ratingOf(candidate.id, 'probite')
      if (!integrityOffence || !rating) continue
      expect(rating.rating, `${candidate.id} : probité maximale malgré une condamnation`).toBeLessThan(100)
    }
  })

  it('laisse la probité intacte quand la condamnation est hors du champ du barème', () => {
    // C'est le pendant du test précédent, et il est tout aussi important :
    // le barème de probité ne doit pas être détourné pour sanctionner
    // des faits qu'il ne prétend pas mesurer.
    const zemmour = candidates.find((c) => c.id === 'zemmour')!
    expect(zemmour.legal.every((a) => !/détournement|corruption/i.test(a.charge ?? ''))).toBe(
      true,
    )
    expect(ratingOf('zemmour', 'probite')?.rating).toBe(100)
    expect(ratingOf('zemmour', 'antecedents-judiciaires')?.rating).toBeLessThan(60)
  })

  it('ne retire aucun point pour une enquête sans mise en examen', () => {
    const bardella = candidates.find((c) => c.id === 'bardella')!
    expect(bardella.legal.some((a) => a.status === 'enquete')).toBe(true)
    expect(bardella.legal.some((a) => a.status === 'mise-en-examen')).toBe(false)
    expect(ratingOf('bardella', 'probite')?.rating).toBe(100)
  })
})

describe('liens officiels', () => {
  it('donne à chaque candidat au moins un point d’entrée institutionnel', () => {
    for (const candidate of candidates) {
      expect(
        candidate.officialLinks.some((l) => l.type === 'institution'),
        `${candidate.id} : aucun lien institutionnel`,
      ).toBe(true)
    }
  })

  it('n’accepte que des URL https', () => {
    for (const candidate of candidates) {
      for (const link of candidate.officialLinks) {
        expect(link.url, `${candidate.id}/${link.label}`).toMatch(/^https:\/\//)
      }
    }
  })
})

describe('référentiel des critères', () => {
  it('déclare pour chaque critère un barème, des paliers et des limites', () => {
    for (const criterion of criteria) {
      expect(criterion.scale.length, criterion.id).toBeGreaterThan(0)
      expect(criterion.tiers.length, criterion.id).toBeGreaterThan(0)
      expect(criterion.limits.length, criterion.id).toBeGreaterThan(80)
      expect(criterion.indicators.length, criterion.id).toBeGreaterThan(0)
    }
  })

  it('couvre toute l’échelle de notes par ses paliers', () => {
    for (const criterion of criteria) {
      expect(Math.min(...criterion.tiers.map((p) => p.min)), criterion.id).toBe(0)
    }
  })
})

describe('formulation du questionnaire', () => {
  it('ne répète aucun énoncé', () => {
    const seen = new Map<string, string>()
    for (const proposition of propositions) {
      const key = proposition.text.toLowerCase().replace(/\s+/g, ' ').trim()
      expect(seen.get(key), `doublon avec ${seen.get(key)}`).toBeUndefined()
      seen.set(key, proposition.id)
    }
  })

  it('pose au moins un arbitrage de principe par thème', () => {
    for (const theme of themes) {
      const ofTheme = propositions.filter((p) => p.themeId === theme.id)
      expect(
        ofTheme.some((p) => p.nature === 'principe'),
        `${theme.id} : uniquement des mesures d’actualité`,
      ).toBe(true)
    }
  })

  it('mélange les polarités au sein de chaque axe', () => {
    // C'est l'axe qui compte, pas seulement le thème : c'est la position sur
    // l'axe que le calcul d'affinité utilise. Un thème peut sembler équilibré
    // alors que l'un de ses deux axes n'a aucun énoncé à contre-sens, et la
    // tendance à approuver quoi qu'on demande devient alors un résultat
    // politique sur cet axe précis.
    for (const axis of axes) {
      const ofAxis = propositions.filter((p) => p.axisId === axis.id)
      if (ofAxis.length < 3) continue
      const positive = ofAxis.filter((p) => p.polarity === 1).length
      const minority = Math.min(positive, ofAxis.length - positive)
      expect(minority / ofAxis.length, `axe ${axis.id}`).toBeGreaterThanOrEqual(0.25)
    }
  })

  it('mélange les polarités au sein de chaque thème', () => {
    for (const theme of themes) {
      const ofTheme = propositions.filter((p) => p.themeId === theme.id)
      const positive = ofTheme.filter((p) => p.polarity === 1).length
      const minority = Math.min(positive, ofTheme.length - positive)
      expect(minority / ofTheme.length, `thème ${theme.id}`).toBeGreaterThanOrEqual(0.25)
    }
  })

  it('ne penche pas globalement d’un côté', () => {
    // Le biais d'acquiescement joue aussi au niveau du questionnaire entier.
    const positive = propositions.filter((p) => p.polarity === 1).length
    const share = positive / propositions.length
    expect(share).toBeGreaterThan(0.35)
    expect(share).toBeLessThan(0.65)
  })

  it('rattache chaque proposition à un axe du thème annoncé', () => {
    for (const proposition of propositions) {
      const axis = axes.find((a) => a.id === proposition.axisId)
      expect(axis, proposition.id).toBeDefined()
      expect(axis!.themeId, proposition.id).toBe(proposition.themeId)
    }
  })

  it('donne à chaque proposition un énoncé et un contexte exploitables', () => {
    for (const proposition of propositions) {
      expect(proposition.text, proposition.id).toMatch(/^[A-ZÀ-Ý«]/)
      expect(proposition.text, proposition.id).toMatch(/\.$/)
      expect(proposition.text.length, proposition.id).toBeLessThanOrEqual(190)
      expect(proposition.context.length, proposition.id).toBeGreaterThan(40)
      // Le contexte informe, il ne prescrit pas.
      expect(proposition.context, proposition.id).not.toMatch(/\bil faut\b/i)
    }
  })

  it('couvre chaque axe par au moins deux propositions', () => {
    for (const axis of axes) {
      const count = propositions.filter((p) => p.axisId === axis.id).length
      expect(count, `${axis.id} : ${count} proposition(s)`).toBeGreaterThanOrEqual(2)
    }
  })
})
