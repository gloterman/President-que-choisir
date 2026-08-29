# Président, que choisir ?

Un outil d'aide à la décision pour l'élection présidentielle française d'avril 2027.

Il ne recommande personne. Il fait autre chose : il rend explicites les critères que chacun
applique déjà sans les formuler, les confronte à ce que les candidats disent et à ce qu'ils ont
fait, puis montre ce que cela donne — **y compris quand le résultat ne tient qu'à un fil**.

## Ce que fait l'outil

| | |
|---|---|
| **Boussole programmatique** | 64 propositions réparties en 8 thèmes et 16 axes, dont 17 arbitrages de principe indépendants de l'actualité. Pour chacune, l'utilisateur donne son avis *et* l'importance qu'il y accorde. Une proposition marquée « peu importe » est retirée du calcul, pas comptée comme un accord neutre. Une version courte limitée aux questions de principe est proposée. |
| **Notation multicritère** | 12 critères — probité, antécédents judiciaires, transparence, rapport aux faits, respect des institutions, expérience, assiduité, constance, clarté du programme, crédibilité budgétaire, capacité à gouverner, engagement public. Chacun déclare ses indicateurs, son barème, ses paliers et ses limites. |
| **Quatre méthodes d'agrégation** | Somme pondérée, produit pondéré (moyenne géométrique), TOPSIS, duels de Condorcet (Copeland). Elles ne classent pas toujours pareil — l'écart est une information, pas un bug. |
| **Seuils rédhibitoires** | Une note minimale exigée sur n'importe quel critère écarte d'office les candidats qui ne l'atteignent pas. |
| **Analyse de sensibilité** | 1 000 tirages de pondérations autour des réglages de l'utilisateur, par une loi de Dirichlet, pour mesurer si le vainqueur en est vraiment un. Déterministe : mêmes réglages, mêmes chiffres. |
| **Comparateur** | Trois candidats côte à côte : positions axe par axe, mesures thème par thème, notes critère par critère. |
| **Vérification des déclarations** | Les déclarations sont collectées depuis des sources **publiques, gratuites et sans clé** — open data parlementaire (NosDéputés.fr, NosSénateurs.fr, ODbL) et réseaux sociaux à lecture ouverte — puis vérifiées à la main avec constat, raisonnement et sources. Une veille RSS relève en parallèle les vérifications déjà publiées. Le site charge l'instantané à l'ouverture et propose une actualisation. Ces verdicts alimentent le critère « rapport aux faits ». Voir [`docs/VERIFICATIONS.md`](docs/VERIFICATIONS.md). |
| **Fiches candidats** | Parcours, mesures chiffrées, faits marquants, situation judiciaire, indicateurs — chaque élément avec son statut de vérification et ses sources. |

## Neutralité de formulation

C'est le point le plus facile à truquer dans un outil de ce genre. Huit règles s'appliquent donc à
chaque énoncé — pas de justification intégrée, pas de superlatif, une seule idée par proposition,
pas de fausse alternative, pas de « il faut », pas de vocabulaire militant, pas de présupposé dans
le verbe, polarités mélangées dans chaque thème.

Les six premières sont **exécutables** : `npm run lint:data` échoue si un énoncé les enfreint, et
toute exception doit être inscrite dans le code avec sa raison.

Les formulations ont été soumises à une relecture indépendante en août 2026, qui a signalé
31 propositions sur 64 et une faille dans la règle R8 elle-même : elle vérifiait l'équilibre des
polarités par thème, alors que c'est la position sur l'*axe* qui alimente le calcul. Deux axes
avaient quatre énoncés sur quatre dans le même sens. R8 contrôle désormais les deux niveaux, et la
distribution globale est passée de 69/31 à 56/44. Le détail des corrections est dans
[`docs/DONNEES.md`](docs/DONNEES.md).

## Deux principes de conception

**1. Les orientations ne sont jamais notées.** Vouloir la retraite à 60 ans ou à 65 ans ne rapporte
ni ne coûte de points. Seule est mesurée la distance entre la position de l'utilisateur et celle du
candidat. Les notes 0–100 portent exclusivement sur des faits vérifiables.

**2. Aucune note sans son barème.** Chaque note affiche la règle qui l'a produite, son niveau de
confiance, ses sources et ce qu'elle ne dit pas. Les critères qui reposent sur un jugement de valeur
sont marqués « contestable » et peuvent être mis à zéro d'un clic.

## État du jeu de données

> Les barèmes et les calculs sont opérationnels et testés. **Les données qu'ils digèrent sont
> provisoires** : les fiches sont structurées et sourcées au niveau des portails officiels, mais le
> recoupement fait par fait sur les sources primaires reste à conduire. Rien de ce qui est affiché
> ne doit être cité comme un fait établi sans vérification indépendante.

Chaque élément factuel porte l'un de quatre statuts, affiché dans l'interface :

- **vérifié** — source primaire ouverte et lue (Légifrance, HATVP, Journal officiel, décision de justice) ;
- **recoupé** — au moins deux sources indépendantes et concordantes, référence primaire identifiée mais document non ouvert ; ce statut est vérifié par un test automatique qui refuse toute mention « recoupé » appuyée sur une seule source ;
- **à vérifier** — saisi depuis une source secondaire unique ;
- **estimation** — synthèse éditoriale d'une ligne politique, pas une citation.

Le volet judiciaire est aujourd'hui au statut **recoupé** : les décisions ont été croisées sur plusieurs
rédactions et leurs références sont indiquées, y compris le communiqué de la juridiction lorsqu'il
existe. Les positions programmatiques restent des **estimations** par construction.

La procédure de passage de l'un à l'autre est décrite dans [`docs/DONNEES.md`](docs/DONNEES.md).

## Démarrer

```bash
npm install
npm run dev          # serveur de développement
npm run build        # typecheck + build de production
npm test             # tests du moteur de notation
npm run lint:data    # contrôle d'intégrité du jeu de données

npm run collecte:citations -- --essai   # ce que ferait la collecte, sans appel réseau
npm run collecte:citations              # sources gratuites, aucune clé requise
```

Node 20 ou supérieur.

## Architecture

```
src/
  data/           Modèle et jeu de données — aucune logique
    types.ts        Le contrat : positions, critères, faits, affaires judiciaires
    referentiel.ts  Thèmes, axes et propositions du questionnaire
    criteres.ts     Les 12 critères, leurs indicateurs et leurs barèmes
    sources.ts      Registre des sources
    candidats/      Un fichier par candidat
    factcheck.ts    Citations, verdicts et format de l'instantané
    sources-citations.ts  Sources de collecte et leurs licences
  lib/
    scoring/        Moteur de notation — pur, testé, sans dépendance à React
      matrice.ts      Matrice de décision et normalisations
      methodes.ts     Les quatre méthodes d'agrégation
      affinite.ts     Affinité programmatique et boussole 2D
      sensibilite.ts  Analyse de sensibilité par Monte-Carlo
      index.ts        Orchestration du classement complet
    factcheck/      Chargement, validation défensive, lecture RSS, calcul de la véracité
    store.tsx       Préférences utilisateur, persistées en localStorage
    format.ts       Formatage et libellés
  components/
    ui/             Primitives d'interface
    charts/         Graphiques SVG et HTML
    candidat/       Blocs propres aux fiches
    layout/         En-tête, pied de page, navigation
  pages/            Une page par route
public/
  donnees/
    factcheck.json  Instantané des citations et vérifications, publié avec le site
scripts/
  validate-data.ts       Contrôle d'intégrité exécuté par `npm run lint:data`
  collecter-citations.ts Collecte multi-sources des déclarations publiques
```

Le moteur de notation ne dépend ni de React ni du DOM : il se teste comme une bibliothèque et
pourrait alimenter un autre client sans modification.

## Vie privée

Aucun compte, aucune mesure d'audience, aucun cookie. Les réponses et les pondérations vivent dans
le `localStorage` du navigateur et n'en sortent jamais.

Le site télécharge un fichier de vérifications au chargement — l'instantané publié avec lui, ou le
point d'accès que l'exploitant a configuré. Aucun script tiers n'est chargé et aucun message n'est
incorporé : les citations sont affichées en texte brut depuis ce fichier, ce qui évite d'exposer le
visiteur aux traceurs des plateformes.

## Accessibilité et rendu

- Thème clair et sombre, avec bascule manuelle qui l'emporte sur la préférence système.
- Palette de graphiques validée pour les déficiences de la vision des couleurs, en clair comme en
  sombre. L'identité d'une série ne repose jamais sur la couleur seule : légende systématique,
  libellés directs, et vue tableau sous chaque figure.
- Navigation au clavier, lien d'évitement, respect de `prefers-reduced-motion`.

## Avertissement

Les notes produites par cet outil sont des indicateurs construits sur des barèmes publics appliqués
à des données perfectibles. Elles ne constituent ni une expertise juridique ni une consigne de vote.
Toute personne citée bénéficie de la présomption d'innocence tant qu'une condamnation n'est pas
définitive.
