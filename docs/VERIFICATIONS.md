# Vérification des déclarations

Comment les citations arrivent sur le site, comment elles sont vérifiées, et pourquoi
l'architecture est celle-là.

## Les sources

Toutes les sources activées par défaut sont **publiques, gratuites et sans clé d'accès**.

| Source | Nature | Découverte | Licence |
|---|---|---|---|
| **Sites officiels** | Publications des candidats et de leurs mouvements | Flux de syndication, chemin trouvé automatiquement | Propos de leurs auteurs, cités avec lien |
| **Bluesky** | Messages publics, API de lecture ouverte | Compte déclaré par fiche | Propos de leurs auteurs, cités avec lien |
| **Veille RSS** | Vérifications déjà publiées | Flux fixes | Titre et lien seuls, avec attribution |
| **X** *(optionnel, désactivé)* | Messages publics | Compte déclaré par fiche | Lecture authentifiée et facturée |

**Les flux des sites officiels sont le socle.** Ce sont des paroles publiées par les intéressés
eux-mêmes, avec un lien vers l'original. Aucun annuaire ne recense les flux des sites politiques
français, et plutôt que d'inventer quinze adresses le collecteur les découvre en deux temps :

1. **il demande au site.** Une page qui publie un flux l'annonce dans son en-tête par un
   `<link rel="alternate" type="application/rss+xml">`. C'est le mécanisme normalisé, et le seul
   qui trouve une adresse ne suivant aucune convention ;
2. **à défaut, il sonde les conventions** (`/feed/`, `/rss`, `/feed`, `/rss.xml`, `/atom.xml`,
   `/index.php/feed/`) — un site peut servir un flux sans le déclarer.

La première adresse qui renvoie un flux exploitable est retenue, et le journal dit par quelle voie.
La découverte remplace la configuration : un site qui change de moteur reste couvert sans
intervention. Les sondes n'ont ni reprise ni délai long — une adresse spéculative est le plus
souvent absente, et le coût de la recherche doit rester proportionné. Un site partagé par deux
candidats n'est sondé qu'une fois.

**Qui parle est affiché.** Un communiqué de mouvement n'est pas la parole personnelle du candidat,
même lorsqu'il en porte la ligne. Le site personnel passe donc avant celui du parti, et chaque
citation porte la mention `porteParole`, visible dans l'interface.

Les réseaux sociaux complètent, mais seulement ceux dont la lecture est ouverte. Dans les faits, la
plupart des responsables politiques français sont restés sur X : la couverture sociale est donc
partielle, et le site le dit plutôt que de le masquer.

### NosDéputés.fr et NosSénateurs.fr, retirés

Ces deux sources ont d'abord été retenues : une intervention en séance est verbatim, horodatée,
rattachée à un débat identifié et publiée sous licence ouverte, ce qui en fait la meilleure matière
première imaginable. Elles ont été retirées le 4 septembre 2026 — **le service ne répond plus**,
constaté depuis un exécuteur d'intégration continue puis depuis un poste personnel, avec un délai
de connexion dépassé au port 443 sur les deux hôtes.

L'open data officiel de l'Assemblée nationale publie bien les comptes rendus, mais sous forme
d'archives volumineuses dont l'exploitation demande un adaptateur d'un tout autre ordre : téléchargement
de plusieurs centaines de mégaoctets, décompression, analyse XML. Cet adaptateur n'a pas été écrit,
faute de pouvoir l'exécuter depuis l'environnement de développement — l'écrire à l'aveugle
reproduirait l'erreur qui a coûté deux collectes. C'est le prochain chantier identifié.

**X n'est pas utilisé par défaut.** Son API exige un jeton et facture chaque lecture depuis
février 2026 — environ 0,005 $ par message et 0,010 $ par compte, le palier gratuit étant fermé aux
nouveaux développeurs. La source reste disponible pour qui y a souscrit (`--sources=…,x` avec
`X_BEARER_TOKEN`), mais rien n'en dépend.

## Pourquoi la collecte n'a pas lieu dans le navigateur

Le site charge les citations à l'ouverture de la page et propose un bouton d'actualisation — c'est
ce que voit le visiteur. Mais ce qu'il charge est un **fichier publié**, pas une réponse des
sources. Deux obstacles valent quelle que soit la source :

1. **CORS.** La plupart de ces services ne renvoient pas les en-têtes qui autoriseraient une page
   web à lire leur réponse. Le navigateur la refuserait.
2. **Redondance.** Une collecte à chaque ouverture referait le même travail des milliers de fois
   pour un contenu identique, aux frais des serveurs interrogés.

Pour X s'y ajoute un troisième obstacle, dirimant : le jeton livré dans le paquet JavaScript serait
lisible par quiconque ouvre les outils de développement — et chaque lecture étant facturée, un
jeton exposé se traduit en facture.

D'où la séparation en deux temps :

```
   collecte programmée              publication              consultation
  ┌───────────────────┐        ┌──────────────────┐     ┌──────────────────┐
  │ collecter-        │  écrit │ public/donnees/  │ lit │ le site, à       │
  │ citations.ts      │ ─────▶ │ factcheck.json   │ ───▶│ l'ouverture et   │
  │ (détient le jeton)│        │ (fichier statique)│     │ à l'actualisation│
  └───────────────────┘        └──────────────────┘     └──────────────────┘
```

## Lancer une collecte

```bash
npm run collecte:citations -- --essai            # montre ce qui serait fait, sans appel réseau
npm run collecte:citations                       # sources gratuites, aucune clé requise
npm run collecte:citations -- --sources=bluesky  # une source en particulier
```

Aucun jeton n'est nécessaire. `--sources=` accepte `sites`, `bluesky`, `veille` et `x` ; sans ce
drapeau, tout est collecté **sauf** X.

Le script :

- découvre le flux de chaque site officiel **sans configuration**, en lisant d'abord le flux que la
  page d'accueil déclare, puis à défaut en sondant les conventions courantes ;
- n'interroge des comptes sociaux que ceux déclarés dans `comptesSociaux`, et **liste les candidats
  qui n'en ont pas** — un identifiant deviné ferait citer la mauvaise personne, et un compte de
  soutien tenu par une équipe ne serait pas la parole du candidat ;
- ne retient que les messages contenant une affirmation vérifiable (une quantité, ou un chiffre
  accompagné d'un comparatif). Le filtre penche volontairement vers l'inclusion : mieux vaut
  collecter une citation qui se révélera invérifiable que d'écarter en amont, par une règle opaque,
  une déclaration qui méritait examen ;
- **n'écrase jamais une vérification existante** et ne supprime aucune citation ;
- **refuse un nom de source inconnu** plutôt que de l'ignorer : un `--sources` périmé désactivait
  silencieusement le reste, et la collecte réussissait en n'ayant rien collecté ;
- affiche un bilan par source, avec le motif exact de chaque échec — et, quand un flux répond sans
  qu'aucun article soit retenu, le décompte de ce qui a été écarté (trop court, ou sans chiffre) :
  sans cela, un flux muet et un flux d'annonces d'événements se ressemblent dans le journal.

> **État des adresses.** Les collectes réelles du 4 septembre 2026 ont confirmé les **quatre flux
> de veille** (Les Décodeurs, AFP Factuel, Vrai ou Faux, CheckNews) et l'**API publique de
> Bluesky**. Les flux des sites officiels n'ont pas d'adresse fixe : ils sont découverts à chaque
> exécution, et le collecteur indique pour chaque site la voie retenue ou l'absence de flux.
>
> Le sondage par conventions seules avait trouvé **4 flux sur 11 sites** : Mélenchon
> (`melenchon2027.fr/feed/`), Les Écologistes, Place publique et Les Républicains. Sept sites
> publient pourtant des actualités — signe que la liste de chemins était la mauvaise question à
> poser en premier, d'où la lecture du flux déclaré.

## Rétention

L'instantané est rechargé par chaque visiteur : il doit rester petit. À chaque collecte :

- **une citation portant une vérification n'est jamais écartée** — ce serait perdre du travail
  humain ;
- les citations en attente sont ramenées aux 400 plus récentes ;
- la veille est ramenée aux 300 entrées les plus récentes.

Le nombre de citations écartées est affiché à chaque exécution.

## La veille des vérifications publiées

Les flux RSS des rédactions spécialisées sont relevés en parallèle. **Ils ne produisent aucun
verdict** : un titre d'article ne dit pas de façon fiable qui a dit quoi ni ce qui a été conclu.
Chaque entrée conserve le titre, le lien, l'éditeur, la date, et la liste des candidats dont le nom
apparaît dans le titre — à confirmer à la main.

Seuls le titre et le lien sont repris, avec attribution : le texte des articles appartient à leurs
auteurs.

C'est ce qui rend le travail de vérification tenable. Plutôt que de partir de zéro sur chaque
citation, le vérificateur dispose d'un flux de vérifications déjà faites, qu'il rattache quand elles
correspondent — en s'appuyant sur le champ `reprise`.

## Vérifier une citation

La collecte est automatique, la vérification ne l'est pas. Une affirmation politique se vérifie en
allant chercher la donnée et en la lisant. Une citation reste au verdict `en-attente` tant que ce
travail n'a pas été fait, et le site l'affiche comme telle : masquer les messages retenus mais non
traités reviendrait à cacher le tri.

Pour rendre un verdict, ajouter une entrée dans `verifications` du fichier
`public/donnees/factcheck.json` :

```json
{
  "citationId": "x-1234567890",
  "verdict": "trompeur",
  "constat": "Le chiffre cité est exact mais porte sur une autre période.",
  "explication": "La série publiée par l'Insee donne 3,2 % pour 2025 et non pour 2026.",
  "sourceIds": ["insee"],
  "liens": [{ "label": "Série Insee 001234567", "url": "https://www.insee.fr/..." }],
  "verifiePar": "Prénom Nom",
  "dateVerification": "2026-08-29"
}
```

Les sept verdicts possibles :

| Verdict | Sens | Compte dans la note |
|---|---|---|
| `exact` | Conforme aux données disponibles | oui |
| `plutot-exact` | Exact pour l'essentiel | oui |
| `trompeur` | Chiffre juste, contexte faussé | oui |
| `plutot-faux` | Contredit pour l'essentiel | oui |
| `faux` | Contredit | oui |
| `invérifiable` | Aucune donnée publique ne tranche | non |
| `en-attente` | Collectée, pas encore examinée | non |

Deux marqueurs facultatifs déclenchent le bonus et le malus prévus au barème :
`rectificationPublique` et `repriseApresDementi`.

## Effet sur le classement

Ces vérifications alimentent le critère **« rapport aux faits »**, selon le barème publié :

```
note      = part des affirmations exactes ou plutôt exactes, sur celles qui tranchent
          + 5   si une rectification publique est documentée
          − 10  par reprise d'une affirmation déjà démentie
confiance = faible sous 10 vérifications, moyenne sous 20, haute au-delà
```

**En dessous de dix vérifications pour un candidat, aucune note n'est produite** : le critère reste
« non documenté » et le moteur lui substitue sa valeur neutre. Publier une note calculée sur trois
vérifications serait plus trompeur que de n'en publier aucune.

La note est calculée hors des fiches et superposée aux notes statiques, ce qui laisse le moteur de
notation pur : il reçoit ces valeurs en entrée plutôt que d'aller les chercher.

## Point d'accès direct, en option

Un exploitant qui veut que le bouton « Actualiser » interroge un service vivant peut déployer un
petit service — son propre serveur, une fonction en périphérie — et le déclarer au build :

```bash
VITE_FACTCHECK_ENDPOINT=https://exemple.test/factcheck npm run build
```

Le contrat est minimal : répondre en `application/json` avec un instantané au même format, et
autoriser le site par CORS. **Le service met le résultat en cache et n'expose que l'instantané** —
il ne relaie pas les API source requête par requête, sans quoi la redondance reviendrait par la
fenêtre.

Si le service est absent, lent ou en panne, le site retombe automatiquement sur l'instantané publié
et le signale. Sans point d'accès configuré, tout fonctionne : c'est le mode par défaut.

## Ce qui n'est pas publié

Aucune citation d'exemple n'est fournie, et le fichier livré est vide. Une citation inventée
attribuée à une personne réelle serait exactement ce que cet outil cherche à combattre. Un test
échoue si l'instantané publié contient des marqueurs de démonstration ou un identifiant de message
qui n'est pas numérique.

## Données personnelles

Le site ne charge aucun script tiers et n'incorpore aucun message : les textes sont affichés depuis
le fichier publié, en texte brut. Le visiteur n'est donc pas exposé aux traceurs des plateformes, et
le lien vers la source d'origine porte `rel="noopener noreferrer nofollow"`.

Une citation ne peut renvoyer que vers le domaine de sa propre plateforme : une intervention
parlementaire dont le lien pointerait vers un réseau social est rejetée à la validation. Sans cette
contrainte, un instantané compromis pourrait faire passer n'importe quoi pour un compte rendu de
séance.
