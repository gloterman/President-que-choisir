# Renseigner et vérifier les données

Ce document décrit comment une information entre dans le jeu de données, et à quelles conditions
elle peut être affichée comme établie. C'est la partie la plus importante du projet : le moteur de
notation ne vaut que ce que valent les données qu'il agrège.

## Le contrat de vérification

Chaque élément factuel — mesure, fait marquant, affaire judiciaire, indicateur, note de critère —
porte un champ `verification` :

| Statut | Signification | Ce qu'affiche l'interface |
|---|---|---|
| `verifie` | Recoupé sur une **source primaire**. | Pastille verte « Vérifié » |
| `a-verifier` | Saisi depuis une source secondaire, en attente de recoupement. | Pastille orange « À vérifier » |
| `estimation` | Synthèse éditoriale d'une ligne politique, pas une citation. | Pastille « Estimation » |

Un élément ne passe **jamais** à `verifie` sans que les quatre étapes ci-dessous aient été
franchies. En cas de doute, il reste `a-verifier` ou il est retiré.

## La procédure, en quatre temps

### 1. Retrouver la source primaire

- Décision de justice : Légifrance, site de la juridiction, ou copie de la décision.
- Patrimoine et intérêts : [HATVP](https://www.hatvp.fr/consulter-les-declarations/).
- Nomination, décret : Journal officiel.
- Scrutin, présence, texte déposé : site de l'Assemblée nationale, du Sénat ou du Parlement européen.
- Comptes de campagne : CNCCFP.

Un article de presse relatant un fait **n'est pas** une source primaire : c'est un point de départ
pour retrouver le document.

### 2. Vérifier la qualification exacte

Pour une affaire judiciaire, quatre éléments doivent être établis séparément :

- le **chef** retenu (la qualification pénale) ;
- la **juridiction** et la **date** de la décision ;
- la **peine** prononcée ;
- l'**état des voies de recours**.

C'est ici que se joue la différence entre « visé par une enquête », « mis en examen », « condamné en
première instance » et « condamné définitivement ». Le modèle de données impose ce vocabulaire :
le champ `statut` n'accepte que les valeurs de `StatutJudiciaire`, et le contrôle d'intégrité refuse
une condamnation sans `qualification`.

### 3. Recouper avec une seconde source indépendante

Deux rédactions distinctes, ou une rédaction et un document officiel. Dix médias reprenant la même
dépêche comptent pour **une** source.

### 4. Consigner et basculer le statut

- Ajouter la source au registre `src/data/sources.ts` si elle n'y est pas, avec son URL exacte.
- Référencer son `id` dans le champ `sourceIds` de l'élément.
- Passer `verification` à `verifie`.
- Mettre à jour `derniereMaj` sur la fiche du candidat.

> **Convention sur les URL.** Le registre ne contient aujourd'hui que des portails et des rubriques
> dont l'adresse est stable. Le lien profond vers la décision, la déclaration ou l'article précis
> s'ajoute au moment de la vérification — c'est précisément ce qui distingue `a-verifier` de
> `verifie`. Ne jamais inventer une URL pour « faire propre ».

## Ajouter un candidat

Créer `src/data/candidats/<id>.ts` sur le modèle des fiches existantes, puis l'ajouter à
`src/data/candidats/index.ts`.

```ts
import type { Candidat } from '../types'
import { note, positions } from './_helpers'

export const exemple: Candidat = {
  id: 'exemple',
  prenom: 'Prénom',
  nom: 'Nom',
  initiales: 'PN',
  parti: 'Nom complet du parti',
  partiCourt: 'SIGLE',
  famille: 'centre',
  couleurParti: '#888888',
  naissance: '1970-01-01',
  fonctionActuelle: '…',
  statutCandidature: 'pressenti',
  presentation: '…',
  // Seize positions, dans l'ordre de ORDRE_AXES. L'aide lève une exception
  // si le compte n'y est pas.
  positions: positions([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  notes: [note('probite', 100, 'moyenne', 'Justification citant les faits retenus.', ['legifrance'])],
  mesures: [],
  faits: [],
  judiciaire: [],
  indicateurs: [],
  derniereMaj: '2026-08-20',
}
```

Puis :

```bash
npm run lint:data
```

Le contrôle vérifie l'absence d'identifiant dupliqué, la présence des seize positions, la validité
des références de thèmes, d'axes, de critères et de sources, le format des dates, les bornes des
notes, la présence d'une justification, et l'existence d'une qualification pénale sur toute
condamnation. Il signale aussi, sans bloquer, les critères non documentés et les éléments sans
source.

## Un critère non documenté n'est pas une note à zéro

Si un candidat n'a pas de note sur un critère, le moteur lui substitue **50 sur 100** — une valeur
neutre qui ne le favorise ni ne le pénalise — et l'interface affiche « non documenté ». C'est
volontaire : l'absence de donnée ne doit jamais se lire comme un mauvais résultat.

C'est le cas aujourd'hui de deux critères pour tous les candidats :

- **Rapport aux faits** — suppose de compiler les vérifications d'au moins deux rédactions de
  fact-checking, avec un échantillon minimal de dix vérifications par personne.
- **Assiduité dans les mandats** — suppose d'extraire les taux de présence et l'activité législative
  depuis NosDéputés.fr, Datan ou les sites des assemblées.

Ce sont les deux chantiers de données les plus utiles à mener en premier.

## Rédiger une proposition de questionnaire

Les règles appliquées, vérifiables dans `src/data/referentiel.ts` :

- affirmative, sans négation ni double négation ;
- sans adverbe d'appréciation (« enfin », « évidemment », « scandaleux ») ;
- les deux pôles de l'axe sont rédigés pour être **également défendables** ;
- au sein d'un thème, les polarités sont mélangées, pour limiter le biais d'acquiescement — le
  contrôle d'intégrité émet un avertissement si un thème n'a qu'une seule polarité ;
- le champ `contexte` donne un élément factuel utile à la décision, sans prendre parti.

## Rédiger un barème de critère

Un barème est utilisable s'il satisfait trois conditions :

1. **Reproductible** : deux personnes appliquant la règle aux mêmes indicateurs obtiennent la même
   note, à un ou deux points près.
2. **Auditable** : la règle est écrite dans le champ `bareme` et affichée à côté de la note.
3. **Honnête sur ses angles morts** : le champ `limites` dit ce que la note ne mesure pas, et
   `contestable` est mis à `true` dès que la règle repose sur un jugement de valeur qu'on peut
   raisonnablement refuser.

Un critère `contestable` reste dans l'outil — le supprimer ne le rendrait pas plus neutre, cela
masquerait simplement le choix. L'interface le signale et permet de le neutraliser.
