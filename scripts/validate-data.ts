/**
 * Contrôle d'intégrité du jeu de données.
 *
 *   npm run lint:data
 *
 * Vérifie ce qu'une relecture humaine rate : identifiants dupliqués, axes
 * manquants, sources fantômes, critères inconnus, dates mal formées. Ne dit
 * évidemment rien de l'exactitude des faits — c'est le rôle de la procédure de
 * vérification décrite dans docs/DONNEES.md.
 */
import { candidates } from '../src/data/candidates/index'
import { criteria } from '../src/data/criteria'
import { axes, propositions, themes } from '../src/data/questionnaire'
import { sources } from '../src/data/sources'

const errors: string[] = []
const warnings: string[] = []

const axisIds = new Set(axes.map((a) => a.id))
const themeIds = new Set(themes.map((t) => t.id))
const criterionIds = new Set(criteria.map((c) => c.id))
const sourceIds = new Set(sources.map((s) => s.id))

const ISO = /^\d{4}(-\d{2})?(-\d{2})?$/

function unique(label: string, ids: string[]) {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) errors.push(`${label} : identifiant dupliqué « ${id} »`)
    seen.add(id)
  }
}

unique('Thèmes', themes.map((t) => t.id))
unique('Axes', axes.map((a) => a.id))
unique('Propositions', propositions.map((p) => p.id))
unique('Critères', criteria.map((c) => c.id))
unique('Sources', sources.map((s) => s.id))
unique('Candidats', candidates.map((c) => c.id))

for (const axis of axes) {
  if (!themeIds.has(axis.themeId)) errors.push(`Axe « ${axis.id} » : thème inconnu « ${axis.themeId} »`)
}

for (const proposition of propositions) {
  if (!axisIds.has(proposition.axisId)) {
    errors.push(`Proposition « ${proposition.id} » : axe inconnu « ${proposition.axisId} »`)
  }
  if (!themeIds.has(proposition.themeId)) {
    errors.push(`Proposition « ${proposition.id} » : thème inconnu « ${proposition.themeId} »`)
  }
  const axis = axes.find((a) => a.id === proposition.axisId)
  if (axis && axis.themeId !== proposition.themeId) {
    errors.push(`Proposition « ${proposition.id} » : le thème ne correspond pas à celui de son axe.`)
  }
}

// Chaque axe doit porter au moins deux propositions, sinon la position de
// l'utilisateur sur cet axe repose sur une seule réponse.
for (const axis of axes) {
  const count = propositions.filter((p) => p.axisId === axis.id).length
  if (count === 0) errors.push(`Axe « ${axis.id} » : aucune proposition rattachée.`)
  else if (count < 2) warnings.push(`Axe « ${axis.id} » : une seule proposition rattachée.`)
}

/**
 * R8 — équilibre des polarités.
 *
 * Le contrôle porte sur l'AXE, pas seulement sur le thème. C'est la leçon d'une
 * relecture externe : un thème pouvait sembler équilibré alors que l'un de ses
 * deux axes n'avait aucune proposition à contre-sens, et c'est bien la position
 * sur l'axe que le calcul d'affinité utilise. Sans cette vérification, la
 * tendance à approuver quoi qu'on demande — le biais d'acquiescement, cinq à
 * dix points selon la littérature — se transforme en résultat politique sur cet
 * axe précis.
 */
function polarityBalance(
  set: typeof propositions,
  tag: string,
  blockingThreshold: number,
) {
  if (set.length < 3) return
  const positive = set.filter((p) => p.polarity === 1).length
  const minority = Math.min(positive, set.length - positive)
  const share = minority / set.length
  if (share < blockingThreshold) {
    errors.push(
      `${tag} : ${minority} proposition(s) de polarité minoritaire sur ${set.length} (R8). ` +
        'Inverser le sens d’un énoncé, ou en ajouter un rédigé depuis le pôle opposé.',
    )
  } else if (share < 0.3) {
    warnings.push(
      `${tag} : équilibre de polarité tout juste atteint, ${minority} sur ${set.length} (R8).`,
    )
  }
}

for (const axis of axes) {
  polarityBalance(
    propositions.filter((p) => p.axisId === axis.id),
    `Axe « ${axis.id} »`,
    0.25,
  )
}
for (const theme of themes) {
  polarityBalance(
    propositions.filter((p) => p.themeId === theme.id),
    `Thème « ${theme.id} »`,
    0.25,
  )
}

/**
 * Cohérence des modaux au sein d'un axe.
 *
 * « doit pouvoir » demande d'approuver une possibilité, « doit » une
 * obligation : la première est nettement plus facile à accepter. Mélanger les
 * deux à l'intérieur d'un même axe rend les propositions non comparables entre
 * elles. L'écart est signalé, pas interdit : autoriser quelque chose s'énonce
 * légitimement au permissif.
 */
for (const axis of axes) {
  const ofAxis = propositions.filter((p) => p.axisId === axis.id)
  const permissive = ofAxis.filter((p) => /\b(?:doit|doivent)\s+pouvoir\b|\b(?:peut|peuvent)\b/.test(p.text))
  if (permissive.length > 0 && permissive.length < ofAxis.length) {
    warnings.push(
      `Axe « ${axis.id} » : ${permissive.length} énoncé(s) au modal permissif sur ${ofAxis.length}. ` +
        'Un « doit pouvoir » s’approuve plus facilement qu’un « doit » ; vérifier que le mélange est justifié.',
    )
  }
}

for (const source of sources) {
  if (source.url && !/^https?:\/\//.test(source.url)) {
    errors.push(`Source « ${source.id} » : URL invalide.`)
  }
  if (!ISO.test(source.date)) errors.push(`Source « ${source.id} » : date « ${source.date} » mal formée.`)
}

for (const candidate of candidates) {
  const prefix = `Candidat « ${candidate.id} »`

  for (const axis of axes) {
    if (candidate.positions[axis.id] === undefined) {
      errors.push(`${prefix} : position manquante sur l'axe « ${axis.id} ».`)
    }
  }
  for (const axisId of Object.keys(candidate.positions)) {
    if (!axisIds.has(axisId)) errors.push(`${prefix} : axe inconnu « ${axisId} » dans les positions.`)
  }
  for (const axisId of Object.keys(candidate.ratedPositions ?? {})) {
    if (!axisIds.has(axisId)) errors.push(`${prefix} : axe inconnu « ${axisId} » dans les notes de position.`)
  }

  if (candidate.officialLinks.length === 0) {
    warnings.push(`${prefix} : aucun lien officiel renseigné.`)
  }
  for (const link of candidate.officialLinks) {
    if (!/^https:\/\//.test(link.url)) {
      errors.push(`${prefix} : lien officiel « ${link.label} » — URL invalide ou non sécurisée.`)
    }
  }
  if (!candidate.officialLinks.some((l) => l.type === 'institution')) {
    warnings.push(`${prefix} : aucun lien institutionnel, la vérification n'a pas de point d'entrée public.`)
  }

  const rated = new Set<string>()
  for (const rating of candidate.ratings) {
    if (!criterionIds.has(rating.criterionId)) {
      errors.push(`${prefix} : critère inconnu « ${rating.criterionId} ».`)
    }
    if (rated.has(rating.criterionId)) errors.push(`${prefix} : critère noté deux fois « ${rating.criterionId} ».`)
    rated.add(rating.criterionId)
    if (rating.rating < 0 || rating.rating > 100) errors.push(`${prefix} : note hors bornes sur « ${rating.criterionId} ».`)
    if (!rating.rationale.trim()) errors.push(`${prefix} : justification vide sur « ${rating.criterionId} ».`)
    for (const sourceId of rating.sourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`${prefix} : source inconnue « ${sourceId} ».`)
    }
  }
  for (const criterion of criteria) {
    if (!rated.has(criterion.id)) {
      warnings.push(`${prefix} : critère « ${criterion.id} » non documenté (note neutre appliquée).`)
    }
  }

  const documents = [...candidate.measures, ...candidate.facts, ...candidate.legal, ...candidate.indicators]
  for (const doc of documents) {
    for (const sourceId of doc.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`${prefix} : source inconnue « ${sourceId} » sur « ${doc.id} ».`)
      }
    }
    if (doc.sourceIds.length === 0) {
      warnings.push(`${prefix} : aucune source sur « ${doc.id} ».`)
    }
  }

  for (const measure of candidate.measures) {
    if (!themeIds.has(measure.themeId)) errors.push(`${prefix} : thème inconnu sur la mesure « ${measure.id} ».`)
  }
  for (const fact of candidate.facts) {
    if (!ISO.test(fact.date)) errors.push(`${prefix} : date « ${fact.date} » mal formée sur « ${fact.id} ».`)
  }
  for (const legalCase of candidate.legal) {
    if (legalCase.decisionDate && !ISO.test(legalCase.decisionDate)) {
      errors.push(`${prefix} : date de décision mal formée sur « ${legalCase.id} ».`)
    }
    if (legalCase.status.startsWith('condamnation') && !legalCase.charge) {
      errors.push(`${prefix} : condamnation sans qualification pénale sur « ${legalCase.id} ».`)
    }
  }
  if (!ISO.test(candidate.lastUpdated)) errors.push(`${prefix} : date de dernière mise à jour mal formée.`)
}


// ---------------------------------------------------------------------------
// Contrôle de formulation des propositions
// ---------------------------------------------------------------------------

/**
 * Les règles de rédaction (R1 à R8, documentées en tête de `referentiel.ts`)
 * sont ici rendues exécutables. Une règle écrite dans un commentaire finit
 * toujours par être oubliée ; une règle testée, non.
 *
 * Les motifs sont volontairement larges : ils signalent des candidats, pas des
 * fautes certaines. Toute exception doit être inscrite ci-dessous avec sa
 * raison — c'est ce qui distingue une dérogation assumée d'un oubli.
 */
const RULES: { code: string; label: string; reason: RegExp; natures?: string[] }[] = [
  {
    code: 'R1',
    label: 'justification intégrée (« pour + infinitif »)',
    reason: /\bpour\s+(?:[a-zà-öø-ÿ]{3,}(?:er|ir|re)|que)\b/i,
  },
  {
    code: 'R2',
    label: 'superlatif ou adverbe d’appréciation',
    reason:
      /\b(?:le meilleur|la meilleure|le pire|massivement|fortement|drastiquement|évidemment|scandaleu|indispensable|urgent|véritable|simplement)\w*/i,
  },
  {
    code: 'R3',
    label: 'proposition double',
    reason:
      /\b(?:doit|doivent|peut|peuvent)\s+(?:être\s+)?[a-zà-öø-ÿ]+(?:é|ée|és|ées|er|ir)\s+et\s+[a-zà-öø-ÿ]+(?:é|ée|és|ées|er|ir)\b/i,
  },
  {
    code: 'R4',
    label: 'fausse alternative dans une mesure',
    reason: /\bplut[oô]t qu/i,
    natures: ['mesure'],
  },
  { code: 'R5', label: '« il faut »', reason: /\bil faut\b/i },
  {
    code: 'R6',
    label: 'vocabulaire militant repris tel quel',
    reason:
      /\b(?:préférence nationale|assistanat|ultra-riches|grand remplacement|ensauvagement|wokisme|immigrationniste)\b/i,
  },
  {
    code: 'R7',
    label: 'présupposé dans le verbe (« rétablir », « restaurer »)',
    reason: /\b(?:rétabli|restaur)(?:r|e|es|s|é|ée|ées|és|er)?\b/i,
  },
]

/**
 * Dérogations assumées. Chaque entrée dit pourquoi le motif est déclenché sans
 * que la règle soit enfreinte. Une proposition absente de cette liste et qui
 * déclenche un motif fait échouer le contrôle.
 */
const EXEMPTIONS: Record<string, { rule: string; reason: string }[]> = {
  'p-int-3': [
    {
      rule: 'R1',
      reason:
        '« pour financer des dépenses communes » décrit l’objet de l’emprunt, pas un bénéfice attendu : sans ce complément, la proposition ne dit pas de quoi on parle.',
    },
  ],
  'p-ecolo-2': [
    {
      rule: 'R1',
      reason:
        '« Pour réduire les émissions » pose l’objectif commun aux deux branches de l’arbitrage ; il ne plaide pour aucune des deux.',
    },
  ],
  'p-soc-1': [
    {
      rule: 'R1',
      reason:
        '« Pour équilibrer le système de retraite » pose l’objectif commun aux trois leviers mis en balance ; il ne plaide pour aucun d’entre eux.',
    },
  ],
  'p-soc-3': [
    {
      rule: 'R1',
      reason:
        '« pour une retraite à taux plein » est le nom du dispositif visé, pas une justification.',
    },
  ],
}

for (const proposition of propositions) {
  for (const rule of RULES) {
    if (rule.natures && !rule.natures.includes(proposition.nature)) continue
    const found = proposition.text.match(rule.reason)
    if (!found) continue
    const exemption = (EXEMPTIONS[proposition.id] ?? []).find((d) => d.rule === rule.code)
    if (exemption) continue
    errors.push(
      `Proposition « ${proposition.id} » : ${rule.code} — ${rule.label}. Extrait : « ${found[0]} ». ` +
        'Reformuler, ou inscrire une dérogation motivée dans scripts/validate-data.ts.',
    )
  }

  if (proposition.text.length > 190) {
    warnings.push(
      `Proposition « ${proposition.id} » : énoncé de ${proposition.text.length} caractères, difficile à trancher d’un seul regard.`,
    )
  }
}

// Chaque thème doit poser au moins un arbitrage de principe, sinon il ne mesure
// que la position de l'utilisateur dans le débat du moment.
for (const theme of themes) {
  const ofTheme = propositions.filter((p) => p.themeId === theme.id)
  if (!ofTheme.some((p) => p.nature === 'principe')) {
    errors.push(`Thème « ${theme.id} » : aucune proposition de principe, uniquement des mesures d’actualité.`)
  }
}

const principleCount = propositions.filter((p) => p.nature === 'principe').length
if (principleCount / propositions.length < 0.2) {
  warnings.push(
    `Propositions de principe : ${principleCount} sur ${propositions.length}, soit moins d’un cinquième du questionnaire.`,
  )
}

// Bilan de vérification, affiché à chaque exécution : c'est l'indicateur de
// maturité du jeu de données.
const allFacts = candidates.flatMap((c) => [...c.measures, ...c.facts, ...c.legal, ...c.indicators])
const byStatus = allFacts.reduce<Record<string, number>>((acc, f) => {
  acc[f.verification] = (acc[f.verification] ?? 0) + 1
  return acc
}, {})

console.log(
  `\nCandidats : ${candidates.length} · Critères : ${criteria.length} · ` +
    `Propositions : ${propositions.length} (${principleCount} de principe, ${propositions.length - principleCount} de mesure)`,
)
console.log(
  `Éléments factuels : ${allFacts.length} — vérifiés ${byStatus.verifie ?? 0}, ` +
    `recoupés ${byStatus.recoupe ?? 0}, à vérifier ${byStatus['a-verifier'] ?? 0}, ` +
    `estimations ${byStatus.estimation ?? 0}`,
)

if (warnings.length > 0) {
  console.log(`\n${warnings.length} avertissement(s) :`)
  for (const a of warnings.slice(0, 15)) console.log(`  · ${a}`)
  if (warnings.length > 15) console.log(`  · … et ${warnings.length - 15} autres`)
}

if (errors.length > 0) {
  console.error(`\n${errors.length} erreur(s) bloquante(s) :`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}

console.log('\nIntégrité du jeu de données : OK\n')
