# Contribuer

## Le principe qui prime sur tous les autres

Cet outil porte sur des personnes réelles, dont certaines font l'objet de procédures judiciaires.
**Une affirmation inexacte n'est pas un bug, c'est un tort causé à quelqu'un.** En cas de doute sur
un fait, la bonne action est de le retirer ou de le laisser au statut « à vérifier », jamais de
l'affirmer et de corriger plus tard.

La procédure de vérification est décrite dans [`docs/DONNEES.md`](docs/DONNEES.md). Elle n'est pas
facultative.

## Avant d'ouvrir une pull request

```bash
npm run typecheck    # types
npm test             # moteur de notation
npm run lint:data    # intégrité du jeu de données
npm run build        # build de production
```

## Contributions particulièrement utiles

1. **Vérifier des faits déjà saisis.** Faire passer des éléments de `a-verifier` à `verifie`, avec
   le lien profond vers la source primaire. C'est le besoin numéro un.
2. **Renseigner les deux critères non documentés** : le rapport aux faits et l'assiduité dans les
   mandats. Voir `docs/DONNEES.md`.
3. **Contester un barème.** Un barème qu'on trouve injuste se discute dans une issue, arguments à
   l'appui. Le champ `limites` de chaque critère est fait pour accueillir ces objections.
4. **Signaler une position mal résumée.** Les positions sur les axes sont des synthèses éditoriales.
   Si l'une d'elles trahit la ligne d'un candidat, ouvrir une issue avec une citation sourcée.

## Ce qui sera refusé

- Une note modifiée sans modification du barème ou des indicateurs qui la produisent.
- Un fait sans source, ou avec une source inventée pour « faire propre ».
- Une proposition de questionnaire rédigée pour orienter la réponse.
- Un critère ajouté sans barème reproductible, sans limites déclarées, ou dont l'effet réel serait
  de favoriser un camp.
- La suppression d'un critère au motif qu'il est contestable : le marquer `contestable: true` et
  laisser l'utilisateur le neutraliser est plus honnête que de trancher à sa place.

## Style de code

Le projet suit les conventions déjà en place : français pour les identifiants du domaine et les
commentaires, TypeScript strict, aucune dépendance ajoutée sans nécessité. Le moteur de notation
(`src/lib/scoring/`) reste pur : ni React, ni DOM, ni accès réseau.

Les graphiques suivent des règles fixes, décrites en commentaire dans
`src/components/charts/primitives.tsx` : trois séries au maximum sur une figure superposée, légende
dès deux séries, libellés directs plutôt qu'identité par la couleur, et vue tableau sous chaque
figure.
