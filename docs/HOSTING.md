# Hébergement

Le site est statique : quatre fichiers, 174 Ko servis à la première visite une
fois compressés. Il n'exige aucun serveur d'application, aucune base de
données, et ne collecte rien côté serveur — les préférences restent dans le
navigateur du visiteur.

## Une décision réversible

L'archive produite par `npm run build` est en **chemins relatifs**. Elle
fonctionne à la racine d'un domaine, dans un sous-répertoire quelconque, ou
ouverte depuis un disque. Changer d'hébergeur ne demande donc aucune
recompilation : c'est un changement DNS.

`npm run check:portability` refuse toute adresse absolue dans l'archive et
tourne à chaque intégration continue. Le défaut serait sinon invisible — le
site s'afficherait parfaitement à la racine et ne montrerait qu'un écran blanc
ailleurs.

**Le seul engagement réel est le nom de domaine.** C'est lui qu'il faut prendre
en premier, et lui seul qu'on ne peut pas changer sans casser les liens
partagés.

## Choix retenu : Scaleway

Object Storage pour les fichiers, Edge Services pour la diffusion. Entreprise
française, données en France, CDN et certificat Let's Encrypt inclus.

### Ce que ça coûte

Le poids réel du site est de **174 Ko** à la première visite (brotli), et de
**35 Ko** ensuite — les fichiers d'assets portent une empreinte dans leur nom
et restent en cache un an, seul l'instantané des vérifications est rechargé.

| Visites/mois | Trafic | Formule | Coût/mois |
| ---: | ---: | --- | ---: |
| 100 k | 18 Go | Starter | 0,99 € |
| 500 k | 89 Go | Starter | 0,99 € |
| 1 M | 178 Go | Starter + dépassement | 2,05 € |
| 5 M | 891 Go | Starter + dépassement | 11,67 € |
| 10 M | 1 782 Go | Professional | 23,54 € |

La formule Starter (0,99 €/mois, 100 Go de cache) couvre **561 000 premières
visites par mois**. Le dépassement est facturé 0,0135 €/Go ; il ne devient
rentable de passer à Professional (12,99 €) qu'au-delà de **989 Go par mois**.

Deux points de la grille tarifaire méritent attention :

- **« Frais de sortie : offert »** — les frais de sortie de l'Object Storage
  sont annulés quand le contenu passe par Edge Services. On ne paie donc que le
  cache, pas deux fois. Le stockage lui-même, 736 Ko, coûte une fraction de
  centime.
- **« Certificat SSL »** — Let's Encrypt est offert. La mention d'une
  facturation par Secret Manager ne concerne que le cas où l'on apporte son
  propre certificat. Choisir Let's Encrypt à la configuration.

## Mise en place

### 1. Le domaine

À prendre en premier, chez le registrar de votre choix. C'est ce qui rend tout
le reste interchangeable.

### 2. Le bucket

Console Scaleway → **Object Storage** → créer un bucket, région `fr-par`.

- Activer l'**hébergement de site statique** sur le bucket, avec `index.html`
  comme document d'index.
- Le site utilise un routage par fragment (`#/candidats`), donc **aucune règle
  de réécriture n'est nécessaire** : le serveur ne voit jamais que `/`.

### 3. Les clés d'API

Console → **Identifiants et Accès** (IAM) → créer une clé d'API dédiée au
déploiement, avec la seule permission d'écrire dans ce bucket. Ne pas réutiliser
une clé personnelle : celle-ci vivra dans GitHub.

### 4. Edge Services

Console → **Edge Services** → créer un pipeline pointant vers le bucket.

- Formule **Starter**.
- Domaine personnalisé : votre domaine, certificat **Let's Encrypt**.
- Suivre les instructions DNS affichées (enregistrement `CNAME`).
- Durée de vie du cache : laisser Edge Services **respecter les en-têtes
  `Cache-Control`** envoyés par l'origine. C'est le déploiement qui les pose,
  fichier par fichier (voir plus bas).

### 5. GitHub

Dépôt → *Settings* → *Secrets and variables* → *Actions*.

| Nom | Type | Valeur |
| --- | --- | --- |
| `SCW_ACCESS_KEY` | secret | clé d'accès de l'étape 3 |
| `SCW_SECRET_KEY` | secret | clé secrète de l'étape 3 |
| `SCW_BUCKET` | variable | nom du bucket |
| `SCW_REGION` | variable | `fr-par` (facultatif, valeur par défaut) |

Tant que ces valeurs sont absentes, le workflow s'exécute, annonce ce qui manque
et s'arrête **sans échouer** : le dépôt n'affiche pas une croix rouge à chaque
poussée pour une configuration qui n'existe pas encore.

## Comment la publication se déroule

`.github/workflows/scaleway.yml`, déclenché à chaque poussée sur `main` et
manuellement. L'ordre des quatre étapes n'est pas indifférent :

1. **Les assets d'abord.** Ils portent une empreinte dans leur nom et sont
   envoyés avec un cache d'un an (`immutable`). Quand le nouvel `index.html`
   arrivera, les fichiers qu'il référence seront déjà en place.
2. **L'instantané des vérifications**, avec un cache de **5 minutes**. Il change
   à chaque collecte quotidienne ; un cache court évite d'avoir à purger le CDN.
3. **`index.html` en dernier.** C'est lui qui fait basculer le site sur la
   nouvelle version. Cache de 60 secondes : une publication devient visible
   rapidement sans être rechargée à chaque navigation.
4. **Retrait des assets périmés**, une fois la bascule faite. Le faire avant
   aurait supprimé des fichiers que l'ancien `index.html` sert encore aux
   visiteurs en cours de chargement.

### Pourquoi aucune purge automatique

La fraîcheur est assurée par les en-têtes ci-dessus, qu'Edge Services respecte.
Une purge automatique aurait supposé d'installer la CLI Scaleway dans le job qui
détient les clés de déploiement, pour une commande dont la syntaxe n'a pas pu
être vérifiée depuis l'environnement de développement. Le gain — quelques
minutes de fraîcheur sur un site dont les données changent une fois par jour —
ne valait ni ce risque d'approvisionnement ni cette incertitude.

Pour forcer une purge à la main, la commande est de la forme suivante ; **en
vérifier la syntaxe** avec `scw edge-services purge-request create --help`, elle
n'a pas été exécutée :

```sh
scw edge-services purge-request create pipeline-id=<ID> all=true
```

## Enchaînement avec la collecte

`collect.yml` s'exécute chaque nuit, met à jour `public/data/factcheck.json`
et le pousse. Sur `main`, cette poussée déclenche `scaleway.yml` : le site est
donc republié automatiquement après chaque collecte, sans intervention.

Les exécutions planifiées de GitHub Actions ont toujours lieu sur la branche par
défaut. Tant que le travail vit sur une branche de fonctionnalité, la collecte
et le déploiement ne s'enchaînent pas — c'est la fusion sur `main` qui met la
chaîne en route.

## GitHub Pages

`pages.yml` est **conservé volontairement**. Il publie la même archive sur
GitHub Pages, ce qui donne un second exemplaire du site sans effort : si le
bucket ou le pipeline Edge Services tombe, l'adresse GitHub reste debout. La
portabilité de l'archive rend ce doublon gratuit — c'est le même `dist/`, sans
recompilation ni réglage propre à l'un ou l'autre.

Le point à surveiller n'est pas technique mais éditorial : **deux adresses
publiques posent la question de celle qui fait foi**. Le domaine personnalisé
pointe sur Scaleway et c'est lui qu'on communique ; l'adresse GitHub reste un
filet, pas une publication. Si le site est diffusé largement, mieux vaut que les
liens partagés portent tous le domaine propre — sans quoi une partie du public
se retrouverait sur un exemplaire dont personne ne surveille la fraîcheur.

## Migrer ailleurs

L'archive étant portable, changer d'hébergeur revient à envoyer le contenu de
`dist/` ailleurs et à faire pointer le domaine dessus. Les options étudiées :

| Hébergeur | Coût annuel | Remarque |
| --- | ---: | --- |
| **Scaleway** Object + Edge Starter | ~12 € | Retenu |
| Cloudflare Pages | 0 € | Bande passante illimitée, anti-DDoS ; société américaine |
| OVH Start 10M | domaine seul | 10 Mo suffisent, mais mutualisé et sans CDN |
| OVH Perso | ~47 € | Mutualisé ; tarifs relevés en mai 2026 |
| OVH Object Storage | élevé | Sortie gratuite depuis 2026, mais HTTPS exige un Load Balancer payant |
| Infomaniak | ~69 € | Trafic illimité, suisse ; sans CDN |
