/**
 * Matrice de décision et normalisations.
 *
 * Toutes les méthodes d'agrégation partagent la même entrée : une matrice
 * `alternatives × critères` de valeurs brutes 0–100, plus un vecteur de poids.
 * Les critères sont tous « à maximiser » : c'est une propriété du référentiel
 * (une note haute est toujours la valeur souhaitable du critère), ce qui évite
 * d'avoir à gérer des critères à minimiser.
 */

export interface MatriceDecision {
  /** Identifiants des alternatives, dans l'ordre des lignes. */
  alternatives: string[]
  /** Identifiants des critères, dans l'ordre des colonnes. */
  criteres: string[]
  /** `valeurs[i][j]` = note brute 0–100 de l'alternative `i` sur le critère `j`. */
  valeurs: number[][]
  /** Poids par critère, non normalisés. */
  poids: number[]
}

/** Ramène un vecteur de poids à une somme de 1. Un vecteur nul devient uniforme. */
export function normaliserPoids(poids: number[]): number[] {
  const positifs = poids.map((p) => Math.max(0, p))
  const somme = positifs.reduce((a, b) => a + b, 0)
  if (somme <= 0) return positifs.map(() => 1 / Math.max(1, positifs.length))
  return positifs.map((p) => p / somme)
}

/**
 * Normalisation min-max par colonne, sur [0, 1].
 *
 * Quand toutes les alternatives ont la même valeur sur un critère, la colonne
 * n'apporte aucune information discriminante : on renvoie 0,5 partout plutôt
 * que 0 ou 1, afin que le critère ne fasse ni gagner ni perdre personne.
 */
export function normaliserMinMax(valeurs: number[][]): number[][] {
  if (valeurs.length === 0) return []
  const nbCriteres = valeurs[0].length
  const min: number[] = []
  const max: number[] = []
  for (let j = 0; j < nbCriteres; j++) {
    let mn = Infinity
    let mx = -Infinity
    for (const ligne of valeurs) {
      mn = Math.min(mn, ligne[j])
      mx = Math.max(mx, ligne[j])
    }
    min.push(mn)
    max.push(mx)
  }
  return valeurs.map((ligne) =>
    ligne.map((v, j) => (max[j] - min[j] < 1e-9 ? 0.5 : (v - min[j]) / (max[j] - min[j]))),
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
export function normaliserAbsolu(valeurs: number[][]): number[][] {
  return valeurs.map((ligne) => ligne.map((v) => Math.min(1, Math.max(0, v / 100))))
}

/** Normalisation vectorielle (euclidienne) par colonne, requise par TOPSIS. */
export function normaliserVectoriel(valeurs: number[][]): number[][] {
  if (valeurs.length === 0) return []
  const nbCriteres = valeurs[0].length
  const normes: number[] = []
  for (let j = 0; j < nbCriteres; j++) {
    let somme = 0
    for (const ligne of valeurs) somme += ligne[j] * ligne[j]
    normes.push(Math.sqrt(somme))
  }
  return valeurs.map((ligne) => ligne.map((v, j) => (normes[j] < 1e-9 ? 0 : v / normes[j])))
}
