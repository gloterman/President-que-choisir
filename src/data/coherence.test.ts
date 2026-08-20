import { describe, expect, it } from 'vitest'
import { candidats } from './candidats'
import { criteres } from './criteres'
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

const STATUTS_CONDAMNATION = [
  'condamnation-definitive',
  'condamnation-appel-pourvoi',
  'condamnation-non-definitive',
] as const

const noteDe = (candidatId: string, critereId: string) =>
  candidats.find((c) => c.id === candidatId)?.notes.find((n) => n.critereId === critereId)

describe('contrat de vérification', () => {
  it('exige au moins deux sources pour tout élément marqué « recoupé »', () => {
    const manquants = candidats.flatMap((candidat) =>
      [...candidat.judiciaire, ...candidat.faits, ...candidat.mesures, ...candidat.indicateurs]
        .filter((e) => e.verification === 'recoupe' && e.sourceIds.length < 2)
        .map((e) => `${candidat.id}/${e.id}`),
    )
    // « Recoupé » veut dire recoupé : une seule source ne suffit pas à le
    // revendiquer, l'élément doit alors rester « à vérifier ».
    expect(manquants).toEqual([])
  })

  it('n’autorise aucune source fantôme', () => {
    const inconnues = candidats.flatMap((candidat) =>
      [
        ...candidat.judiciaire,
        ...candidat.faits,
        ...candidat.mesures,
        ...candidat.indicateurs,
        ...candidat.notes,
      ]
        .flatMap((e) => e.sourceIds)
        .filter((id) => !sourceById.has(id)),
    )
    expect(inconnues).toEqual([])
  })

  it('impose une qualification pénale à toute condamnation', () => {
    const sansQualification = candidats.flatMap((candidat) =>
      candidat.judiciaire
        .filter((a) => STATUTS_CONDAMNATION.includes(a.statut as never) && !a.qualification)
        .map((a) => `${candidat.id}/${a.id}`),
    )
    expect(sansQualification).toEqual([])
  })

  it('impose une date de décision à toute condamnation', () => {
    const sansDate = candidats.flatMap((candidat) =>
      candidat.judiciaire
        .filter((a) => STATUTS_CONDAMNATION.includes(a.statut as never) && !a.dateDecision)
        .map((a) => `${candidat.id}/${a.id}`),
    )
    expect(sansDate).toEqual([])
  })
})

describe('cohérence entre les affaires et les notes', () => {
  it('fait baisser les antécédents judiciaires dès qu’une condamnation existe', () => {
    for (const candidat of candidats) {
      const aUneCondamnation = candidat.judiciaire.some((a) =>
        STATUTS_CONDAMNATION.includes(a.statut as never),
      )
      const note = noteDe(candidat.id, 'antecedents-judiciaires')
      if (!aUneCondamnation || !note) continue
      expect(note.note, `${candidat.id} : condamnation connue mais antécédents à 100`).toBeLessThan(
        100,
      )
    }
  })

  it('n’attribue jamais 100 en probité à qui est condamné pour atteinte à la probité', () => {
    for (const candidat of candidats) {
      const atteinteProbite = candidat.judiciaire.some(
        (a) =>
          STATUTS_CONDAMNATION.includes(a.statut as never) &&
          /détournement|corruption|prise illégale|fraude fiscale/i.test(a.qualification ?? ''),
      )
      const note = noteDe(candidat.id, 'probite')
      if (!atteinteProbite || !note) continue
      expect(note.note, `${candidat.id} : probité maximale malgré une condamnation`).toBeLessThan(100)
    }
  })

  it('laisse la probité intacte quand la condamnation est hors du champ du barème', () => {
    // C'est le pendant du test précédent, et il est tout aussi important :
    // le barème de probité ne doit pas être détourné pour sanctionner
    // des faits qu'il ne prétend pas mesurer.
    const zemmour = candidats.find((c) => c.id === 'zemmour')!
    expect(zemmour.judiciaire.every((a) => !/détournement|corruption/i.test(a.qualification ?? ''))).toBe(
      true,
    )
    expect(noteDe('zemmour', 'probite')?.note).toBe(100)
    expect(noteDe('zemmour', 'antecedents-judiciaires')?.note).toBeLessThan(60)
  })

  it('ne retire aucun point pour une enquête sans mise en examen', () => {
    const bardella = candidats.find((c) => c.id === 'bardella')!
    expect(bardella.judiciaire.some((a) => a.statut === 'enquete')).toBe(true)
    expect(bardella.judiciaire.some((a) => a.statut === 'mise-en-examen')).toBe(false)
    expect(noteDe('bardella', 'probite')?.note).toBe(100)
  })
})

describe('liens officiels', () => {
  it('donne à chaque candidat au moins un point d’entrée institutionnel', () => {
    for (const candidat of candidats) {
      expect(
        candidat.liensOfficiels.some((l) => l.type === 'institution'),
        `${candidat.id} : aucun lien institutionnel`,
      ).toBe(true)
    }
  })

  it('n’accepte que des URL https', () => {
    for (const candidat of candidats) {
      for (const lien of candidat.liensOfficiels) {
        expect(lien.url, `${candidat.id}/${lien.label}`).toMatch(/^https:\/\//)
      }
    }
  })
})

describe('référentiel des critères', () => {
  it('déclare pour chaque critère un barème, des paliers et des limites', () => {
    for (const critere of criteres) {
      expect(critere.bareme.length, critere.id).toBeGreaterThan(0)
      expect(critere.paliers.length, critere.id).toBeGreaterThan(0)
      expect(critere.limites.length, critere.id).toBeGreaterThan(80)
      expect(critere.indicateurs.length, critere.id).toBeGreaterThan(0)
    }
  })

  it('couvre toute l’échelle de notes par ses paliers', () => {
    for (const critere of criteres) {
      expect(Math.min(...critere.paliers.map((p) => p.min)), critere.id).toBe(0)
    }
  })
})

describe('formulation du questionnaire', () => {
  it('ne répète aucun énoncé', () => {
    const vus = new Map<string, string>()
    for (const proposition of propositions) {
      const cle = proposition.texte.toLowerCase().replace(/\s+/g, ' ').trim()
      expect(vus.get(cle), `doublon avec ${vus.get(cle)}`).toBeUndefined()
      vus.set(cle, proposition.id)
    }
  })

  it('pose au moins un arbitrage de principe par thème', () => {
    for (const theme of themes) {
      const duTheme = propositions.filter((p) => p.themeId === theme.id)
      expect(
        duTheme.some((p) => p.nature === 'principe'),
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
    for (const axe of axes) {
      const duAxe = propositions.filter((p) => p.axeId === axe.id)
      if (duAxe.length < 3) continue
      const positives = duAxe.filter((p) => p.polarite === 1).length
      const minoritaire = Math.min(positives, duAxe.length - positives)
      expect(minoritaire / duAxe.length, `axe ${axe.id}`).toBeGreaterThanOrEqual(0.25)
    }
  })

  it('mélange les polarités au sein de chaque thème', () => {
    for (const theme of themes) {
      const duTheme = propositions.filter((p) => p.themeId === theme.id)
      const positives = duTheme.filter((p) => p.polarite === 1).length
      const minoritaire = Math.min(positives, duTheme.length - positives)
      expect(minoritaire / duTheme.length, `thème ${theme.id}`).toBeGreaterThanOrEqual(0.25)
    }
  })

  it('ne penche pas globalement d’un côté', () => {
    // Le biais d'acquiescement joue aussi au niveau du questionnaire entier.
    const positives = propositions.filter((p) => p.polarite === 1).length
    const part = positives / propositions.length
    expect(part).toBeGreaterThan(0.35)
    expect(part).toBeLessThan(0.65)
  })

  it('rattache chaque proposition à un axe du thème annoncé', () => {
    for (const proposition of propositions) {
      const axe = axes.find((a) => a.id === proposition.axeId)
      expect(axe, proposition.id).toBeDefined()
      expect(axe!.themeId, proposition.id).toBe(proposition.themeId)
    }
  })

  it('donne à chaque proposition un énoncé et un contexte exploitables', () => {
    for (const proposition of propositions) {
      expect(proposition.texte, proposition.id).toMatch(/^[A-ZÀ-Ý«]/)
      expect(proposition.texte, proposition.id).toMatch(/\.$/)
      expect(proposition.texte.length, proposition.id).toBeLessThanOrEqual(190)
      expect(proposition.contexte.length, proposition.id).toBeGreaterThan(40)
      // Le contexte informe, il ne prescrit pas.
      expect(proposition.contexte, proposition.id).not.toMatch(/\bil faut\b/i)
    }
  })

  it('couvre chaque axe par au moins deux propositions', () => {
    for (const axe of axes) {
      const nb = propositions.filter((p) => p.axeId === axe.id).length
      expect(nb, `${axe.id} : ${nb} proposition(s)`).toBeGreaterThanOrEqual(2)
    }
  })
})
