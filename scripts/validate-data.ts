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
import { candidats } from '../src/data/candidats'
import { criteres } from '../src/data/criteres'
import { axes, propositions, themes } from '../src/data/referentiel'
import { sources } from '../src/data/sources'

const erreurs: string[] = []
const avertissements: string[] = []

const idsAxes = new Set(axes.map((a) => a.id))
const idsThemes = new Set(themes.map((t) => t.id))
const idsCriteres = new Set(criteres.map((c) => c.id))
const idsSources = new Set(sources.map((s) => s.id))

const ISO = /^\d{4}(-\d{2})?(-\d{2})?$/

function uniques(label: string, ids: string[]) {
  const vus = new Set<string>()
  for (const id of ids) {
    if (vus.has(id)) erreurs.push(`${label} : identifiant dupliqué « ${id} »`)
    vus.add(id)
  }
}

uniques('Thèmes', themes.map((t) => t.id))
uniques('Axes', axes.map((a) => a.id))
uniques('Propositions', propositions.map((p) => p.id))
uniques('Critères', criteres.map((c) => c.id))
uniques('Sources', sources.map((s) => s.id))
uniques('Candidats', candidats.map((c) => c.id))

for (const axe of axes) {
  if (!idsThemes.has(axe.themeId)) erreurs.push(`Axe « ${axe.id} » : thème inconnu « ${axe.themeId} »`)
}

for (const proposition of propositions) {
  if (!idsAxes.has(proposition.axeId)) {
    erreurs.push(`Proposition « ${proposition.id} » : axe inconnu « ${proposition.axeId} »`)
  }
  if (!idsThemes.has(proposition.themeId)) {
    erreurs.push(`Proposition « ${proposition.id} » : thème inconnu « ${proposition.themeId} »`)
  }
  const axe = axes.find((a) => a.id === proposition.axeId)
  if (axe && axe.themeId !== proposition.themeId) {
    erreurs.push(`Proposition « ${proposition.id} » : le thème ne correspond pas à celui de son axe.`)
  }
}

// Chaque axe doit porter au moins deux propositions, sinon la position de
// l'utilisateur sur cet axe repose sur une seule réponse.
for (const axe of axes) {
  const nb = propositions.filter((p) => p.axeId === axe.id).length
  if (nb === 0) erreurs.push(`Axe « ${axe.id} » : aucune proposition rattachée.`)
  else if (nb < 2) avertissements.push(`Axe « ${axe.id} » : une seule proposition rattachée.`)
}

// R8 — équilibre des polarités. Un thème dont les propositions vont toutes dans
// le même sens transforme la tendance à approuver en résultat politique.
for (const theme of themes) {
  const duTheme = propositions.filter((p) => p.themeId === theme.id)
  if (duTheme.length < 3) continue
  const positives = duTheme.filter((p) => p.polarite === 1).length
  const minoritaire = Math.min(positives, duTheme.length - positives)
  if (minoritaire === 0) {
    erreurs.push(`Thème « ${theme.id} » : toutes les propositions ont la même polarité (R8).`)
  } else if (minoritaire / duTheme.length < 0.25) {
    avertissements.push(
      `Thème « ${theme.id} » : ${minoritaire} proposition(s) de polarité minoritaire sur ${duTheme.length} (R8).`,
    )
  }
}

for (const source of sources) {
  if (source.url && !/^https?:\/\//.test(source.url)) {
    erreurs.push(`Source « ${source.id} » : URL invalide.`)
  }
  if (!ISO.test(source.date)) erreurs.push(`Source « ${source.id} » : date « ${source.date} » mal formée.`)
}

for (const candidat of candidats) {
  const prefixe = `Candidat « ${candidat.id} »`

  for (const axe of axes) {
    if (candidat.positions[axe.id] === undefined) {
      erreurs.push(`${prefixe} : position manquante sur l'axe « ${axe.id} ».`)
    }
  }
  for (const axeId of Object.keys(candidat.positions)) {
    if (!idsAxes.has(axeId)) erreurs.push(`${prefixe} : axe inconnu « ${axeId} » dans les positions.`)
  }
  for (const axeId of Object.keys(candidat.positionsNotes ?? {})) {
    if (!idsAxes.has(axeId)) erreurs.push(`${prefixe} : axe inconnu « ${axeId} » dans les notes de position.`)
  }

  if (candidat.liensOfficiels.length === 0) {
    avertissements.push(`${prefixe} : aucun lien officiel renseigné.`)
  }
  for (const lien of candidat.liensOfficiels) {
    if (!/^https:\/\//.test(lien.url)) {
      erreurs.push(`${prefixe} : lien officiel « ${lien.label} » — URL invalide ou non sécurisée.`)
    }
  }
  if (!candidat.liensOfficiels.some((l) => l.type === 'institution')) {
    avertissements.push(`${prefixe} : aucun lien institutionnel, la vérification n'a pas de point d'entrée public.`)
  }

  const notees = new Set<string>()
  for (const note of candidat.notes) {
    if (!idsCriteres.has(note.critereId)) {
      erreurs.push(`${prefixe} : critère inconnu « ${note.critereId} ».`)
    }
    if (notees.has(note.critereId)) erreurs.push(`${prefixe} : critère noté deux fois « ${note.critereId} ».`)
    notees.add(note.critereId)
    if (note.note < 0 || note.note > 100) erreurs.push(`${prefixe} : note hors bornes sur « ${note.critereId} ».`)
    if (!note.justification.trim()) erreurs.push(`${prefixe} : justification vide sur « ${note.critereId} ».`)
    for (const sourceId of note.sourceIds) {
      if (!idsSources.has(sourceId)) erreurs.push(`${prefixe} : source inconnue « ${sourceId} ».`)
    }
  }
  for (const critere of criteres) {
    if (!notees.has(critere.id)) {
      avertissements.push(`${prefixe} : critère « ${critere.id} » non documenté (note neutre appliquée).`)
    }
  }

  const documents = [...candidat.mesures, ...candidat.faits, ...candidat.judiciaire, ...candidat.indicateurs]
  for (const doc of documents) {
    for (const sourceId of doc.sourceIds) {
      if (!idsSources.has(sourceId)) {
        erreurs.push(`${prefixe} : source inconnue « ${sourceId} » sur « ${doc.id} ».`)
      }
    }
    if (doc.sourceIds.length === 0) {
      avertissements.push(`${prefixe} : aucune source sur « ${doc.id} ».`)
    }
  }

  for (const mesure of candidat.mesures) {
    if (!idsThemes.has(mesure.themeId)) erreurs.push(`${prefixe} : thème inconnu sur la mesure « ${mesure.id} ».`)
  }
  for (const fait of candidat.faits) {
    if (!ISO.test(fait.date)) erreurs.push(`${prefixe} : date « ${fait.date} » mal formée sur « ${fait.id} ».`)
  }
  for (const affaire of candidat.judiciaire) {
    if (affaire.dateDecision && !ISO.test(affaire.dateDecision)) {
      erreurs.push(`${prefixe} : date de décision mal formée sur « ${affaire.id} ».`)
    }
    if (affaire.statut.startsWith('condamnation') && !affaire.qualification) {
      erreurs.push(`${prefixe} : condamnation sans qualification pénale sur « ${affaire.id} ».`)
    }
  }
  if (!ISO.test(candidat.derniereMaj)) erreurs.push(`${prefixe} : date de dernière mise à jour mal formée.`)
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
const REGLES: { code: string; libelle: string; motif: RegExp; natures?: string[] }[] = [
  {
    code: 'R1',
    libelle: 'justification intégrée (« pour + infinitif »)',
    motif: /\bpour\s+(?:[a-zà-öø-ÿ]{3,}(?:er|ir|re)|que)\b/i,
  },
  {
    code: 'R2',
    libelle: 'superlatif ou adverbe d’appréciation',
    motif:
      /\b(?:le meilleur|la meilleure|le pire|massivement|fortement|drastiquement|évidemment|scandaleu|indispensable|urgent|véritable|simplement)\w*/i,
  },
  {
    code: 'R3',
    libelle: 'proposition double',
    motif:
      /\b(?:doit|doivent|peut|peuvent)\s+(?:être\s+)?[a-zà-öø-ÿ]+(?:é|ée|és|ées|er|ir)\s+et\s+[a-zà-öø-ÿ]+(?:é|ée|és|ées|er|ir)\b/i,
  },
  {
    code: 'R4',
    libelle: 'fausse alternative dans une mesure',
    motif: /\bplut[oô]t qu/i,
    natures: ['mesure'],
  },
  { code: 'R5', libelle: '« il faut »', motif: /\bil faut\b/i },
  {
    code: 'R6',
    libelle: 'vocabulaire militant repris tel quel',
    motif:
      /\b(?:préférence nationale|assistanat|ultra-riches|grand remplacement|ensauvagement|wokisme|immigrationniste)\b/i,
  },
  {
    code: 'R7',
    libelle: 'présupposé dans le verbe (« rétablir », « restaurer »)',
    motif: /\b(?:rétabli|restaur)(?:r|e|es|s|é|ée|ées|és|er)?\b/i,
  },
]

/**
 * Dérogations assumées. Chaque entrée dit pourquoi le motif est déclenché sans
 * que la règle soit enfreinte. Une proposition absente de cette liste et qui
 * déclenche un motif fait échouer le contrôle.
 */
const DEROGATIONS: Record<string, { regle: string; raison: string }[]> = {
  'p-int-3': [
    {
      regle: 'R1',
      raison:
        '« pour financer des dépenses communes » décrit l’objet de l’emprunt, pas un bénéfice attendu : sans ce complément, la proposition ne dit pas de quoi on parle.',
    },
  ],
  'p-ecolo-2': [
    {
      regle: 'R1',
      raison:
        '« Pour réduire les émissions » pose l’objectif commun aux deux branches de l’arbitrage ; il ne plaide pour aucune des deux.',
    },
  ],
  'p-soc-3': [
    {
      regle: 'R1',
      raison:
        '« pour une retraite à taux plein » est le nom du dispositif visé, pas une justification.',
    },
  ],
}

for (const proposition of propositions) {
  for (const regle of REGLES) {
    if (regle.natures && !regle.natures.includes(proposition.nature)) continue
    const trouve = proposition.texte.match(regle.motif)
    if (!trouve) continue
    const derogation = (DEROGATIONS[proposition.id] ?? []).find((d) => d.regle === regle.code)
    if (derogation) continue
    erreurs.push(
      `Proposition « ${proposition.id} » : ${regle.code} — ${regle.libelle}. Extrait : « ${trouve[0]} ». ` +
        'Reformuler, ou inscrire une dérogation motivée dans scripts/validate-data.ts.',
    )
  }

  if (proposition.texte.length > 190) {
    avertissements.push(
      `Proposition « ${proposition.id} » : énoncé de ${proposition.texte.length} caractères, difficile à trancher d’un seul regard.`,
    )
  }
}

// Chaque thème doit poser au moins un arbitrage de principe, sinon il ne mesure
// que la position de l'utilisateur dans le débat du moment.
for (const theme of themes) {
  const duTheme = propositions.filter((p) => p.themeId === theme.id)
  if (!duTheme.some((p) => p.nature === 'principe')) {
    erreurs.push(`Thème « ${theme.id} » : aucune proposition de principe, uniquement des mesures d’actualité.`)
  }
}

const nbPrincipes = propositions.filter((p) => p.nature === 'principe').length
if (nbPrincipes / propositions.length < 0.2) {
  avertissements.push(
    `Propositions de principe : ${nbPrincipes} sur ${propositions.length}, soit moins d’un cinquième du questionnaire.`,
  )
}

// Bilan de vérification, affiché à chaque exécution : c'est l'indicateur de
// maturité du jeu de données.
const tousFaits = candidats.flatMap((c) => [...c.mesures, ...c.faits, ...c.judiciaire, ...c.indicateurs])
const parStatut = tousFaits.reduce<Record<string, number>>((acc, f) => {
  acc[f.verification] = (acc[f.verification] ?? 0) + 1
  return acc
}, {})

console.log(
  `\nCandidats : ${candidats.length} · Critères : ${criteres.length} · ` +
    `Propositions : ${propositions.length} (${nbPrincipes} de principe, ${propositions.length - nbPrincipes} de mesure)`,
)
console.log(
  `Éléments factuels : ${tousFaits.length} — vérifiés ${parStatut.verifie ?? 0}, ` +
    `recoupés ${parStatut.recoupe ?? 0}, à vérifier ${parStatut['a-verifier'] ?? 0}, ` +
    `estimations ${parStatut.estimation ?? 0}`,
)

if (avertissements.length > 0) {
  console.log(`\n${avertissements.length} avertissement(s) :`)
  for (const a of avertissements.slice(0, 15)) console.log(`  · ${a}`)
  if (avertissements.length > 15) console.log(`  · … et ${avertissements.length - 15} autres`)
}

if (erreurs.length > 0) {
  console.error(`\n${erreurs.length} erreur(s) bloquante(s) :`)
  for (const e of erreurs) console.error(`  ✗ ${e}`)
  process.exit(1)
}

console.log('\nIntégrité du jeu de données : OK\n')
