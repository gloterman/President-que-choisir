/**
 * Matrice de décision et normalisations.
 *
 * Toutes les méthodes d'agrégation partagent la même entrée : une matrice
 * `alternatives × critères` de valeurs brutes 0–100, plus un vecteur de poids.
 * Les critères sont tous « à maximiser » : c'est une propriété du référentiel
 * (une note haute est toujours la valeur souhaitable du critère), ce qui évite
 * d'avoir à gérer des critères à minimiser.
 */

export interface DecisionMatrix {
  /** Identifiants des alternatives, dans l'ordre des lignes. */
  alternatives: string[]
  /** Identifiants des critères, dans l'ordre des colonnes. */
  criteria: string[]
  /** `valeurs[i][j]` = note brute 0–100 de l'alternative `i` sur le critère `j`. */
  values: number[][]
  /** Poids par critère, non normalisés. */
  weight: number[]
}

/** Ramène un vecteur de poids à une somme de 1. Un vecteur nul devient uniforme. */
export function normalizeWeights(weight: number[]): number[] {
  const positive = weight.map((p) => Math.max(0, p))
  const sum = positive.reduce((a, b) => a + b, 0)
  if (sum <= 0) return positive.map(() => 1 / Math.max(1, positive.length))
  return positive.map((p) => p / sum)
}

/**
 * Normalisation min-max par colonne, sur [0, 1].
 *
 * Quand toutes les alternatives ont la même valeur sur un critère, la colonne
 * n'apporte aucune information discriminante : on renvoie 0,5 partout plutôt
 * que 0 ou 1, afin que le critère ne fasse ni gagner ni perdre personne.
 */
export function normalizeMinMax(values: number[][]): number[][] {
  if (values.length === 0) return []
  const criteriaCount = values[0].length
  const min: number[] = []
  const max: number[] = []
  for (let j = 0; j < criteriaCount; j++) {
    let mn = Infinity
    let mx = -Infinity
    for (const row of values) {
      mn = Math.min(mn, row[j])
      mx = Math.max(mx, row[j])
    }
    min.push(mn)
    max.push(mx)
  }
  return values.map((row) =>
    row.map((v, j) => (max[j] - min[j] < 1e-9 ? 0.5 : (v - min[j]) / (max[j] - min[j]))),
  )
}

/**
 * Normalisation par l'échelle absolue 0–100.
 *
 * Contrairement au min-max, elle préserve les écarts réels : deux candidats
 * notés 82 et 84 restent presque identiques au lieu d'être étirés sur 0 et 1.
 * C'est la normalisation utilisée par défaut pour la somme pondérée, parce que
 * les notes du référentiel ont déjà une signification absolue.
 */
export function normalizeAbsolute(values: number[][]): number[][] {
  return values.map((row) => row.map((v) => Math.min(1, Math.max(0, v / 100))))
}

/** Normalisation vectorielle (euclidienne) par colonne, requise par TOPSIS. */
export function normalizeVector(values: number[][]): number[][] {
  if (values.length === 0) return []
  const criteriaCount = values[0].length
  const norms: number[] = []
  for (let j = 0; j < criteriaCount; j++) {
    let sum = 0
    for (const row of values) sum += row[j] * row[j]
    norms.push(Math.sqrt(sum))
  }
  return values.map((row) => row.map((v, j) => (norms[j] < 1e-9 ? 0 : v / norms[j])))
}
