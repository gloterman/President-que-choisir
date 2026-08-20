/**
 * Générateur pseudo-aléatoire déterministe.
 *
 * L'analyse de sensibilité doit être reproductible : deux visites avec les
 * mêmes réglages doivent produire exactement les mêmes probabilités, sinon
 * l'utilisateur voit des chiffres bouger sans avoir rien changé.
 */
export function creerRng(graine = 0x9e3779b9): () => number {
  let etat = graine >>> 0
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Loi normale centrée réduite, par la transformation de Box-Muller. */
export function normale(rng: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Loi Gamma(forme, 1), algorithme de Marsaglia-Tsang. */
export function gamma(rng: () => number, forme: number): number {
  if (forme < 1) {
    // Transformation de Johnk pour les formes inférieures à 1.
    return gamma(rng, forme + 1) * Math.pow(rng(), 1 / forme)
  }
  const d = forme - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    const x = normale(rng)
    const v = (1 + c * x) ** 3
    if (v <= 0) continue
    const u = rng()
    if (u < 1 - 0.0331 * x ** 4) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

/**
 * Tirage dans une loi de Dirichlet centrée sur `poids`.
 *
 * `concentration` règle la dispersion : plus elle est élevée, plus les poids
 * tirés restent proches des poids d'origine. C'est le paramètre qui définit
 * « une petite variation de mes priorités ».
 */
export function dirichlet(
  rng: () => number,
  poids: number[],
  concentration: number,
): number[] {
  const somme = poids.reduce((a, b) => a + b, 0)
  if (somme <= 0) return poids.map(() => 1 / Math.max(1, poids.length))
  const tirages = poids.map((p) => gamma(rng, Math.max(0.05, (p / somme) * concentration)))
  const total = tirages.reduce((a, b) => a + b, 0)
  return total > 0 ? tirages.map((t) => t / total) : poids.map((p) => p / somme)
}
