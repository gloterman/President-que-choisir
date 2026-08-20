# Renseigner et vérifier les données

Ce document décrit comment une information entre dans le jeu de données, et à quelles conditions
elle peut être affichée comme établie. C'est la partie la plus importante du projet : le moteur de
notation ne vaut que ce que valent les données qu'il agrège.

## Le contrat de vérification

Chaque élément factuel — mesure, fait marquant, affaire judiciaire, indicateur, note de critère —
porte un champ `verification` :

| Statut | Signification | Ce qu'affiche l'interface |
|---|---|---|
| `verifie` | **Source primaire ouverte et lue.** | Pastille verte « Vérifié » |
| `recoupe` | Au moins **deux sources indépendantes et concordantes**, référence primaire identifiée mais document non ouvert. | Pastille bleue « Recoupé » |
| `a-verifier` | Saisi depuis une source secondaire unique. | Pastille orange « À vérifier » |
| `estimation` | Synthèse éditoriale d'une ligne politique, pas une citation. | Pastille « Estimation » |

Un élément ne passe **jamais** à `verifie` sans que les quatre étapes ci-dessous aient été
franchies. En cas de doute, il reste `a-verifier` ou il est retiré.

`recoupe` n'est pas un `verifie` au rabais : c'est un état réel et utile, celui d'un fait solide
dont il reste à lire le document source. La règle des deux sources n'est pas déclarative, elle est
**testée** : `src/data/coherence.test.ts` fait échouer la suite si un élément marqué `recoupe`
s'appuie sur une seule source.

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

## La passe de vérification du 20 août 2026

Une revue complète du volet judiciaire a été conduite à cette date. Ce qu'elle a établi, et ce
qu'elle n'a pas pu faire, dans l'ordre.

### Corrections de fond apportées

| Candidat | Ce que disait la fiche | Ce que la vérification a établi |
|---|---|---|
| Marine Le Pen | Condamnée en première instance le 31 mars 2025, appel en cours, inéligibilité de cinq ans avec exécution provisoire | **Arrêt de la cour d'appel de Paris du 7 juillet 2026** : culpabilité confirmée, peine réduite à trois ans dont deux avec sursis, 100 000 € d'amende, 45 mois d'inéligibilité dont 30 avec sursis. Les quinze mois fermes étant purgés au 30 juin 2026, **elle est éligible pour 2027**. Pourvoi en cassation formé. |
| Jean-Luc Mélenchon | Condamnation de 2019 « non définitive », suites en appel à vérifier | Il **n'a pas fait appel** : la condamnation de décembre 2019 est **définitive**. Par ailleurs, l'instruction sur les assistants européens a été close en mai 2026 **sans mise en examen** le concernant, et dans l'affaire des comptes de campagne de 2017 il n'est **pas personnellement mis en examen**. |
| Éric Zemmour | Une entrée générique « plusieurs condamnations, à établir » | **Trois condamnations distinctes, toutes devenues définitives en 2025** : propos de la « Convention de la droite » de 2019 (15 000 €, pourvoi rejeté le 16 septembre 2025), propos de 2020 sur les mineurs isolés (100 jours-amende de 100 €, pourvoi rejeté le 2 décembre 2025), diffamation (1 000 €, même date). |
| Jordan Bardella | Aucune affaire renseignée | **Enquête du Parquet européen** sur des soupçons de fraude autour de formations aux médias, **sans mise en examen**. |
| Les sept autres | Aucune affaire renseignée | Recherche conduite, aucun élément trouvé. L'absence est désormais **datée et documentée** plutôt que silencieuse. |

### Un piège évité

La clôture de l'instruction visant Jean-Luc Mélenchon avait d'abord été saisie comme un `non-lieu`.
C'est faux : l'instruction est close sans mise en examen, mais **le parquet doit encore prendre ses
réquisitions**, après quoi les juges décideront d'un non-lieu ou d'un renvoi. La fiche porte donc
`enquete`, pas `non-lieu`. C'est exactement le type d'erreur que la procédure sert à attraper — et
elle serait passée inaperçue sans recoupement, les deux formulations se ressemblant beaucoup.

### Ce qui n'a pas pu être fait

L'environnement de travail utilisé pour cette passe n'avait pas d'accès sortant vers
`legifrance.gouv.fr`, `courdecassation.fr`, `cours-appel.justice.fr` ni `hatvp.fr` : le proxy réseau
bloquait ces domaines. Les décisions ont donc été établies par recoupement de plusieurs rédactions
et leurs références primaires ont été consignées — dont le communiqué de la cour d'appel de Paris
du 7 juillet 2026, dont l'URL exacte figure dans le registre des sources — mais **aucun de ces
documents n'a été ouvert**. C'est précisément pourquoi ces éléments portent `recoupe` et non
`verifie`.

Pour terminer le travail : ouvrir chacune des références primaires du registre, vérifier la
qualification, la date et l'état des recours, puis basculer le statut. C'est la seule étape
manquante.

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
npm run lint:data   # structure et références
npm test            # cohérence entre les affaires et les notes
```

Le contrôle vérifie l'absence d'identifiant dupliqué, la présence des seize positions, la validité
des références de thèmes, d'axes, de critères et de sources, le format des dates, les bornes des
notes, la présence d'une justification, et l'existence d'une qualification pénale sur toute
condamnation. Il signale aussi, sans bloquer, les critères non documentés, les éléments sans source et les
candidats dépourvus de lien institutionnel.

Les tests de `src/data/coherence.test.ts` vont plus loin : ils refusent une note de probité maximale
en face d'une condamnation pour détournement de fonds, une note d'antécédents à 100 en face d'une
condamnation, un élément « recoupé » à source unique, une condamnation sans qualification pénale ou
sans date, un lien officiel non `https`. Ils vérifient aussi le pendant, tout aussi important : que
le barème de probité **n'est pas** détourné pour sanctionner des faits qu'il ne prétend pas mesurer.

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

Huit règles, documentées en tête de `src/data/referentiel.ts`. Les six premières sont **contrôlées
automatiquement** par `npm run lint:data`, qui échoue si un énoncé les enfreint.

| | Règle | Pourquoi |
|---|---|---|
| R1 | Pas de justification intégrée | « Assouplir X pour encourager Y » fait accepter une thèse contestée en même temps que la mesure. |
| R2 | Pas de superlatif ni d'adverbe d'appréciation | « Le meilleur levier », « massivement » : on demande d'adhérer à une intensité autant qu'à une idée. |
| R3 | Une seule chose par proposition | « Poursuivi et amplifié » mélange deux questions dont on ne peut plus séparer les réponses. |
| R4 | Pas de fausse alternative dans une mesure | Construire des prisons et développer les peines alternatives ne s'excluent pas. Admis en question de principe si les deux termes sont nommés symétriquement. |
| R5 | Pas de « il faut » | La formule installe une nécessité avant la réponse. |
| R6 | Pas de vocabulaire militant repris tel quel | On décrit le mécanisme, pas le slogan. |
| R7 | Pas de présupposé dans le verbe | « Rétablir » suppose qu'un état antérieur était légitime. |
| R8 | Polarités mélangées dans chaque thème | Sinon le biais d'acquiescement devient un résultat politique. Au moins un quart de polarité minoritaire. |

Le champ `contexte` donne un élément factuel utile à la décision, sans prendre parti — il est lui
aussi testé (il ne peut pas contenir « il faut »).

**Dérogations.** Un motif peut se déclencher sans que la règle soit enfreinte : « emprunter pour
financer des dépenses communes » décrit l'objet de l'emprunt, pas un bénéfice attendu. Ces cas
s'inscrivent dans la table `DEROGATIONS` de `scripts/validate-data.ts`, **avec leur raison**. Une
proposition qui déclenche un motif sans dérogation écrite fait échouer le contrôle.

### Principe ou mesure ?

Le champ `nature` distingue deux familles :

- `principe` — un arbitrage de valeurs, rédigé pour survivre au cycle médiatique : « entre la
  stabilité de l'emploi et la souplesse des entreprises, laquelle doit primer ? » ;
- `mesure` — une mesure concrète, telle qu'elle se discute aujourd'hui.

Un questionnaire composé uniquement de mesures d'actualité mesure surtout la position d'une personne
dans le débat du moment, et devient faux dès que le débat se déplace. Chaque thème doit porter au
moins une question de principe — c'est une erreur bloquante, pas un avertissement.

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
