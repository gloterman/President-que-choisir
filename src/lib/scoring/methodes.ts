import type { MatriceDecision } from './matrice'
import { normaliserAbsolu, normaliserPoids, normaliserVectoriel } from './matrice'
import type { MethodeAgregation } from '@/data/types'

/**
 * Les quatre familles d'agrégation multicritère proposées.
 *
 * Elles ne classent pas toujours dans le même ordre, et c'est le point : un
 * classement qui résiste au changement de méthode est robuste, un classement
 * qui bascule dès qu'on change de règle mérite d'être regardé de plus près.
 * L'application affiche systématiquement les quatre résultats côte à côte.
 *
 * Chaque fonction renvoie un score sur [0, 1], dans l'ordre des lignes.
 */

/**
 * Somme pondérée (Weighted Sum Model).
 *
 * La méthode de référence, et la plus lisible : « chaque critère apporte des
 * points, proportionnellement à son poids ». Entièrement compensatoire — une
 * excellence sur un critère peut effacer une faiblesse sur un autre.
 */
export function sommePonderee(m: MatriceDecision): number[] {
  const poids = normaliserPoids(m.poids)
  const notes = normaliserAbsolu(m.valeurs)
  return notes.map((ligne) => ligne.reduce((acc, v, j) => acc + v * poids[j], 0))
}

/**
 * Produit pondéré (Weighted Product Model), c'est-à-dire une moyenne
 * géométrique pondérée.
 *
 * Faiblement compensatoire : une note très basse tire tout le résultat vers le
 * bas, quelles que soient les autres. C'est la méthode à choisir quand on
 * considère qu'un critère peut être rédhibitoire sans être éliminatoire —
 * typiquement la probité.
 *
 * Les valeurs nulles sont ramenées à un plancher, sinon un seul zéro annule
 * mécaniquement le score entier.
 */
export function produitPondere(m: MatriceDecision, plancher = 0.02): number[] {
  const poids = normaliserPoids(m.poids)
  const notes = normaliserAbsolu(m.valeurs)
  return notes.map((ligne) =>
    Math.exp(
      ligne.reduce((acc, v, j) => acc + poids[j] * Math.log(Math.max(plancher, v)), 0),
    ),
  )
}

/**
 * TOPSIS — Technique for Order Preference by Similarity to Ideal Solution.
 *
 * Construit deux repères : le candidat idéal (le meilleur sur chaque critère)
 * et le candidat anti-idéal (le pire sur chaque critère), tous deux fictifs et
 * composés à partir des candidats réels. Le score est la proximité relative à
 * l'idéal. Sensible au contexte : ajouter ou retirer un candidat peut modifier
 * le classement des autres.
 */
export function topsis(m: MatriceDecision): number[] {
  if (m.alternatives.length === 0) return []
  if (m.alternatives.length === 1) return [1]
  const poids = normaliserPoids(m.poids)
  const normalisee = normaliserVectoriel(m.valeurs)
  const ponderee = normalisee.map((ligne) => ligne.map((v, j) => v * poids[j]))

  const nbCriteres = ponderee[0].length
  const ideal: number[] = []
  const antiIdeal: number[] = []
  for (let j = 0; j < nbCriteres; j++) {
    const colonne = ponderee.map((l) => l[j])
    ideal.push(Math.max(...colonne))
    antiIdeal.push(Math.min(...colonne))
  }

  return ponderee.map((ligne) => {
    let dPlus = 0
    let dMoins = 0
    for (let j = 0; j < nbCriteres; j++) {
      dPlus += (ligne[j] - ideal[j]) ** 2
      dMoins += (ligne[j] - antiIdeal[j]) ** 2
    }
    dPlus = Math.sqrt(dPlus)
    dMoins = Math.sqrt(dMoins)
    const total = dPlus + dMoins
    return total < 1e-12 ? 0.5 : dMoins / total
  })
}

/**
 * Copeland — agrégation par duels, dans l'esprit de la méthode de Condorcet.
 *
 * Chaque paire de candidats est comparée critère par critère : celui qui gagne
 * sur le plus de poids cumulé remporte le duel. Le score final est le bilan des
 * duels. Non compensatoire au sens des échelles : seul compte, sur chaque
 * critère, l'ordre entre deux candidats, pas l'ampleur de l'écart. Cela rend la
 * méthode robuste aux notes mal calibrées.
 */
export function copeland(m: MatriceDecision, indifference = 2): number[] {
  const n = m.alternatives.length
  if (n === 0) return []
  if (n === 1) return [1]
  const poids = normaliserPoids(m.poids)
  const bilans = new Array<number>(n).fill(0)

  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      let pourA = 0
      let pourB = 0
      for (let j = 0; j < m.criteres.length; j++) {
        const ecart = m.valeurs[a][j] - m.valeurs[b][j]
        // En deçà du seuil d'indifférence, l'écart de note n'est pas
        // considéré comme significatif : le critère ne départage pas.
        if (ecart > indifference) pourA += poids[j]
        else if (ecart < -indifference) pourB += poids[j]
      }
      if (pourA > pourB) bilans[a] += 1
      else if (pourB > pourA) bilans[b] += 1
      else {
        bilans[a] += 0.5
        bilans[b] += 0.5
      }
    }
  }
  // Bilan sur [0, 1] : nombre de duels gagnés rapporté au nombre de duels joués.
  return bilans.map((v) => v / (n - 1))
}

export function agreger(m: MatriceDecision, methode: MethodeAgregation): number[] {
  switch (methode) {
    case 'somme-ponderee':
      return sommePonderee(m)
    case 'produit-pondere':
      return produitPondere(m)
    case 'topsis':
      return topsis(m)
    case 'copeland':
      return copeland(m)
  }
}

export const METHODES: Record<
  MethodeAgregation,
  { nom: string; resume: string; quandLUtiliser: string; compensatoire: string }
> = {
  'somme-ponderee': {
    nom: 'Somme pondérée',
    resume:
      'Chaque critère rapporte des points au prorata de son poids. La méthode la plus simple à relire et à contester.',
    quandLUtiliser: 'Par défaut, et à chaque fois que vous voulez comprendre exactement d’où vient un écart.',
    compensatoire: 'Totalement compensatoire : un point fort peut effacer un point faible.',
  },
  'produit-pondere': {
    nom: 'Produit pondéré',
    resume:
      'Moyenne géométrique des notes. Une note très basse pèse lourd et n’est pas rattrapée par le reste.',
    quandLUtiliser:
      'Quand un critère est presque rédhibitoire pour vous — la probité, par exemple — sans que vous vouliez éliminer d’office.',
    compensatoire: 'Faiblement compensatoire : les faiblesses ne se compensent pas.',
  },
  topsis: {
    nom: 'TOPSIS',
    resume:
      'Mesure la distance au candidat idéal et au candidat le moins bon, tous deux reconstitués à partir du champ réel.',
    quandLUtiliser: 'Pour raisonner en termes relatifs : « qui se rapproche le plus du meilleur possible ici ? »',
    compensatoire: 'Compensatoire, mais dépendante du champ : retirer un candidat peut modifier le classement.',
  },
  copeland: {
    nom: 'Duels (Condorcet)',
    resume:
      'Compare les candidats deux à deux et compte les duels gagnés. Seul l’ordre compte, pas l’ampleur des écarts.',
    quandLUtiliser: 'Quand vous vous méfiez de la précision des notes mais faites confiance à leur ordre.',
    compensatoire: 'Insensible à l’échelle des notes : robuste aux notes mal calibrées.',
  },
}
