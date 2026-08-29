import { describe, expect, it } from 'vitest'
import type { Candidat, Likert, Preferences, ReponseUtilisateur } from '@/data/types'
import { propositions } from '@/data/referentiel'
import { criteres } from '@/data/criteres'
import {
  boussoleUtilisateur,
  calculerAffinite,
  calculerClassement,
  copeland,
  kendallTau,
  normaliserMinMax,
  normaliserPoids,
  produitPondere,
  sommePonderee,
  topsis,
  type MatriceDecision,
} from './index'
import { analyserSensibilite } from './sensibilite'

const matrice = (valeurs: number[][], poids: number[]): MatriceDecision => ({
  alternatives: valeurs.map((_, i) => `a${i}`),
  criteres: poids.map((_, j) => `c${j}`),
  valeurs,
  poids,
})

describe('normalisation', () => {
  it('ramène les poids à une somme de 1', () => {
    expect(normaliserPoids([1, 3]).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
    expect(normaliserPoids([2, 2])).toEqual([0.5, 0.5])
  })

  it('remplace un vecteur de poids nul par un vecteur uniforme', () => {
    expect(normaliserPoids([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3])
  })

  it('ignore les poids négatifs', () => {
    expect(normaliserPoids([-5, 1, 1])).toEqual([0, 0.5, 0.5])
  })

  it('neutralise une colonne constante au lieu de la mettre à 0 ou 1', () => {
    const sortie = normaliserMinMax([
      [50, 10],
      [50, 90],
    ])
    expect(sortie[0][0]).toBe(0.5)
    expect(sortie[1][0]).toBe(0.5)
    expect(sortie[0][1]).toBe(0)
    expect(sortie[1][1]).toBe(1)
  })
})

describe('somme pondérée', () => {
  it('respecte la pondération', () => {
    const m = matrice(
      [
        [100, 0],
        [0, 100],
      ],
      [3, 1],
    )
    const scores = sommePonderee(m)
    expect(scores[0]).toBeCloseTo(0.75)
    expect(scores[1]).toBeCloseTo(0.25)
  })

  it('donne 1 à un candidat parfait sur tous les critères', () => {
    expect(sommePonderee(matrice([[100, 100, 100]], [1, 1, 1]))[0]).toBeCloseTo(1)
  })
})

describe('produit pondéré', () => {
  it('pénalise plus durement une note très basse que la somme pondérée', () => {
    const m = matrice(
      [
        [100, 12],
        [54, 52],
      ],
      [1, 1],
    )
    const somme = sommePonderee(m)
    const produit = produitPondere(m)
    // La somme pondérée place le profil déséquilibré devant…
    expect(somme[0]).toBeGreaterThan(somme[1])
    // …le produit pondéré l'inverse : la faiblesse n'est plus compensée.
    expect(produit[0]).toBeLessThan(produit[1])
  })

  it('ne renvoie jamais exactement zéro grâce au plancher', () => {
    expect(produitPondere(matrice([[0, 100]], [1, 1]))[0]).toBeGreaterThan(0)
  })
})

describe('TOPSIS', () => {
  it('classe en tête le candidat qui domine sur tous les critères', () => {
    const scores = topsis(
      matrice(
        [
          [90, 90],
          [50, 50],
          [10, 10],
        ],
        [1, 1],
      ),
    )
    expect(scores[0]).toBeGreaterThan(scores[1])
    expect(scores[1]).toBeGreaterThan(scores[2])
    expect(scores[0]).toBeCloseTo(1)
    expect(scores[2]).toBeCloseTo(0)
  })
})

describe('Copeland', () => {
  it('compte les duels gagnés, sans tenir compte de l’ampleur des écarts', () => {
    const scores = copeland(
      matrice(
        [
          [100, 100],
          [60, 60],
          [20, 20],
        ],
        [1, 1],
      ),
    )
    expect(scores).toEqual([1, 0.5, 0])
  })

  it('traite comme indifférents deux candidats séparés par moins du seuil', () => {
    const scores = copeland(
      matrice(
        [
          [51, 51],
          [50, 50],
        ],
        [1, 1],
      ),
    )
    expect(scores).toEqual([0.5, 0.5])
  })
})

describe('tau de Kendall', () => {
  it('vaut 1 pour deux classements identiques et −1 pour deux classements inverses', () => {
    expect(kendallTau([3, 2, 1], [30, 20, 10])).toBe(1)
    expect(kendallTau([3, 2, 1], [10, 20, 30])).toBe(-1)
  })
})

// ---------------------------------------------------------------------------

const candidatTest = (id: string, positions: Record<string, number>): Candidat =>
  ({
    id,
    prenom: id,
    nom: id.toUpperCase(),
    initiales: id.slice(0, 2).toUpperCase(),
    parti: 'Parti test',
    partiCourt: 'PT',
    famille: 'divers',
    couleurParti: '#888888',
    naissance: '1970-01-01',
    fonctionActuelle: '—',
    statutCandidature: 'hypothetique',
    comptesSociaux: [],
    liensOfficiels: [],
    presentation: '—',
    positions: positions as Record<string, Likert>,
    notes: criteres.map((c) => ({
      critereId: c.id,
      note: 50,
      confiance: 'moyenne' as const,
      justification: '—',
      sourceIds: [],
      verification: 'estimation' as const,
    })),
    mesures: [],
    faits: [],
    judiciaire: [],
    indicateurs: [],
    derniereMaj: '2026-01-01',
  }) satisfies Candidat

const reponse = (valeur: number, importance: number): ReponseUtilisateur =>
  ({ valeur, importance }) as ReponseUtilisateur

describe('affinité programmatique', () => {
  const premiere = propositions[0]

  it('donne 100 % quand la position du candidat coïncide avec la réponse', () => {
    const candidat = candidatTest('a', { [premiere.axeId]: 2 * premiere.polarite })
    const affinite = calculerAffinite(candidat, { [premiere.id]: reponse(2, 3) })
    expect(affinite.score).toBeCloseTo(100)
    expect(affinite.accordsMajeurs).toHaveLength(1)
  })

  it('donne 0 % en cas d’opposition frontale', () => {
    const candidat = candidatTest('a', { [premiere.axeId]: -2 * premiere.polarite })
    const affinite = calculerAffinite(candidat, { [premiere.id]: reponse(2, 3) })
    expect(affinite.score).toBeCloseTo(0)
    expect(affinite.desaccordsMajeurs).toHaveLength(1)
  })

  it('exclut du calcul les propositions marquées « peu importe »', () => {
    const candidat = candidatTest('a', { [premiere.axeId]: -2 * premiere.polarite })
    const affinite = calculerAffinite(candidat, { [premiere.id]: reponse(2, 0) })
    expect(affinite.nbPrisesEnCompte).toBe(0)
    expect(affinite.score).toBe(50)
  })

  it('pondère par l’importance déclarée', () => {
    // Deux propositions portant sur des axes distincts, sinon la seconde
    // position écraserait la première dans le candidat de test.
    const p1 = propositions[0]
    const p2 = propositions.find((p) => p.axeId !== p1.axeId)!
    const candidat = candidatTest('a', {
      [p1.axeId]: 2 * p1.polarite,
      [p2.axeId]: -2 * p2.polarite,
    })
    const surPondere = calculerAffinite(candidat, {
      [p1.id]: reponse(2, 3),
      [p2.id]: reponse(2, 1),
    })
    const equilibre = calculerAffinite(candidat, {
      [p1.id]: reponse(2, 1),
      [p2.id]: reponse(2, 1),
    })
    expect(surPondere.score).toBeGreaterThan(equilibre.score)
    expect(equilibre.score).toBeCloseTo(50)
  })

  it('place l’utilisateur sur la boussole seulement s’il a répondu', () => {
    expect(boussoleUtilisateur({})).toBeNull()
    const point = boussoleUtilisateur({ [premiere.id]: reponse(2, 3) })
    expect(point).not.toBeNull()
    expect(point!.eco).toBeGreaterThanOrEqual(-1)
    expect(point!.eco).toBeLessThanOrEqual(1)
  })
})

describe('analyse de sensibilité', () => {
  it('est déterministe à réglages identiques', () => {
    const m = matrice(
      [
        [80, 40],
        [45, 85],
        [60, 60],
      ],
      [1, 1],
    )
    const a = analyserSensibilite(m, 'somme-ponderee', { tirages: 200 })
    const b = analyserSensibilite(m, 'somme-ponderee', { tirages: 200 })
    expect(a.resultats).toEqual(b.resultats)
  })

  it('juge robuste un vainqueur qui domine tous les critères', () => {
    const analyse = analyserSensibilite(
      matrice(
        [
          [95, 95],
          [40, 45],
        ],
        [1, 1],
      ),
      'somme-ponderee',
      { tirages: 200 },
    )
    expect(analyse.stabiliteVainqueur).toBe(1)
    expect(analyse.verdict).toBe('robuste')
  })

  it('juge fragile un classement où deux profils s’échangent la tête', () => {
    const analyse = analyserSensibilite(
      matrice(
        [
          [90, 30],
          [30, 90],
        ],
        [1, 1],
      ),
      'somme-ponderee',
      { tirages: 400 },
    )
    expect(analyse.stabiliteVainqueur).toBeLessThan(0.7)
    expect(analyse.verdict).not.toBe('robuste')
  })

  it('additionne les probabilités de tête à 1', () => {
    const analyse = analyserSensibilite(
      matrice(
        [
          [70, 30],
          [30, 70],
          [55, 55],
        ],
        [1, 1],
      ),
      'topsis',
      { tirages: 300 },
    )
    const total = analyse.resultats.reduce((a, r) => a + r.probabiliteTete, 0)
    expect(total).toBeCloseTo(1)
  })
})

describe('classement complet', () => {
  const preferences = (partiel: Partial<Preferences> = {}): Preferences => ({
    reponses: {},
    poids: Object.fromEntries(criteres.map((c) => [c.id, 1])),
    seuils: {},
    partProgramme: 0.5,
    methode: 'somme-ponderee',
    exclus: [],
    comparaison: [],
    ...partiel,
  })

  const alpha = candidatTest('alpha', {})
  const beta = candidatTest('beta', {})

  it('classe et attribue des rangs contigus', () => {
    const meilleur: Candidat = {
      ...alpha,
      notes: alpha.notes.map((n) => ({ ...n, note: 90 })),
    }
    const classement = calculerClassement([beta, meilleur], preferences())
    expect(classement.resultats.map((r) => r.rang)).toEqual([1, 2])
    expect(classement.resultats[0].candidat.id).toBe('alpha')
  })

  it('écarte un candidat sous un seuil rédhibitoire, sans le supprimer', () => {
    const fragile: Candidat = {
      ...beta,
      notes: beta.notes.map((n) => (n.critereId === 'probite' ? { ...n, note: 20 } : n)),
    }
    const classement = calculerClassement([alpha, fragile], preferences({ seuils: { probite: 50 } }))
    expect(classement.resultats).toHaveLength(1)
    expect(classement.ecartes).toHaveLength(1)
    expect(classement.ecartes[0].candidat.id).toBe('beta')
    expect(classement.ecartes[0].motifs[0]).toMatchObject({ critereId: 'probite', seuil: 50 })
  })

  it('retire du calcul les candidats exclus à la main', () => {
    const classement = calculerClassement([alpha, beta], preferences({ exclus: ['beta'] }))
    expect(classement.resultats).toHaveLength(1)
    expect(classement.exclus.map((c) => c.id)).toEqual(['beta'])
  })

  it('bascule sur 100 % de programme quand tous les poids sont à zéro', () => {
    const classement = calculerClassement(
      [alpha, beta],
      preferences({ poids: Object.fromEntries(criteres.map((c) => [c.id, 0])), partProgramme: 0.2 }),
    )
    expect(classement.partProgramme).toBe(1)
  })

  it('compte les notes manquantes remplacées par la valeur neutre', () => {
    const sansNotes: Candidat = { ...beta, notes: [] }
    const classement = calculerClassement([sansNotes], preferences())
    expect(classement.notesManquantes).toBe(criteres.length)
  })

  it('répartit les poids entre critères et affinité selon partProgramme', () => {
    const classement = calculerClassement([alpha, beta], preferences({ partProgramme: 0.7 }))
    const affinite = classement.resultats[0].contributions.find(
      (c) => c.critereId === '__affinite',
    )
    expect(affinite!.poidsNormalise).toBeCloseTo(0.7)
  })
})
