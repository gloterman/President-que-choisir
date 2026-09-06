/**
 * Contrôle que l'archive produite est hébergeable partout.
 *
 * Un chemin absolu dans `dist/` fige l'emplacement du site : l'archive ne
 * fonctionne plus qu'à l'adresse prévue au moment de la compilation, et
 * changer d'hébergeur oblige à recompiler. Le défaut est silencieux — la page
 * s'affiche parfaitement à la racine et ne montre qu'un écran blanc ailleurs —
 * donc il se vérifie mécaniquement plutôt qu'à l'œil.
 *
 *   npm run verifier:portabilite
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((entree) => {
    const chemin = join(dossier, entree)
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin]
  })
}

const problemes: string[] = []

const index = readFileSync(join(DIST, 'index.html'), 'utf8')
// Les data-URI sont exclues : elles ne désignent aucun emplacement.
for (const [, attribut, valeur] of index.matchAll(/\b(src|href)="(\/[^"]*)"/g)) {
  problemes.push(`index.html : ${attribut}="${valeur}" est un chemin absolu`)
}

// Le chargement de l'instantané passe par BASE_URL ; s'il est absolu, le
// fichier de données sera cherché à la racine du domaine.
for (const chemin of fichiers(DIST).filter((f) => f.endsWith('.js'))) {
  const source = readFileSync(chemin, 'utf8')
  if (/["']\/donnees\/factcheck\.json["']/.test(source)) {
    problemes.push(`${chemin} : l'instantané est référencé par un chemin absolu`)
  }
}

if (problemes.length > 0) {
  console.error('Archive non portable :\n  ' + problemes.join('\n  '))
  console.error(
    '\nLe site ne fonctionnerait qu’à l’adresse prévue à la compilation.' +
      '\nVérifier `base` dans vite.config.ts (défaut : "./") et la variable BASE_PATH.',
  )
  process.exit(1)
}

console.log(`Archive portable : ${fichiers(DIST).length} fichier(s), aucun chemin absolu.`)
