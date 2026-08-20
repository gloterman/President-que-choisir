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

// Équilibre des polarités : un thème dont toutes les propositions vont dans le
// même sens expose au biais d'acquiescement.
for (const theme of themes) {
  const duTheme = propositions.filter((p) => p.themeId === theme.id)
  if (duTheme.length >= 3 && duTheme.every((p) => p.polarite === duTheme[0].polarite)) {
    avertissements.push(
      `Thème « ${theme.id} » : toutes les propositions ont la même polarité (biais d'acquiescement).`,
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

// Bilan de vérification, affiché à chaque exécution : c'est l'indicateur de
// maturité du jeu de données.
const tousFaits = candidats.flatMap((c) => [...c.mesures, ...c.faits, ...c.judiciaire, ...c.indicateurs])
const parStatut = tousFaits.reduce<Record<string, number>>((acc, f) => {
  acc[f.verification] = (acc[f.verification] ?? 0) + 1
  return acc
}, {})

console.log(`\nCandidats : ${candidats.length} · Critères : ${criteres.length} · Propositions : ${propositions.length}`)
console.log(
  `Éléments factuels : ${tousFaits.length} — vérifiés ${parStatut.verifie ?? 0}, ` +
    `à vérifier ${parStatut['a-verifier'] ?? 0}, estimations ${parStatut.estimation ?? 0}`,
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
