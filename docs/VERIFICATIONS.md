# Vérification des déclarations

Comment les citations arrivent sur le site, comment elles sont vérifiées, et pourquoi
l'architecture est celle-là.

## Les sources

Toutes les sources activées par défaut sont **publiques, gratuites et sans clé d'accès**.

| Source | Nature | Éditeur | Licence |
|---|---|---|---|
| **NosDéputés.fr** | Interventions en séance, verbatim | Regards Citoyens | ODbL |
| **NosSénateurs.fr** | Interventions en séance, verbatim | Regards Citoyens | ODbL |
| **Bluesky** | Messages publics, API de lecture ouverte | — | Propos de leurs auteurs, cités avec lien |
| **Veille RSS** | Vérifications déjà publiées | Le Monde, AFP, franceinfo, Libération | Titre et lien seuls, avec attribution |
| **X** *(optionnel, désactivé)* | Messages publics | — | Lecture authentifiée et facturée |

**L'open data parlementaire est le socle.** Une intervention en séance est verbatim, horodatée,
rattachée à un débat identifié, publiée sous licence ouverte — et elle ne disparaît pas si son
auteur l'efface. C'est une bien meilleure matière première qu'un message de réseau social, et elle
ne coûte rien.

Les réseaux sociaux complètent, mais seulement ceux dont la lecture est ouverte. Dans les faits, la
plupart des responsables politiques français sont restés sur X : la couverture sociale est donc
partielle, et le site le dit plutôt que de le masquer.

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

Aucun jeton n'est nécessaire. `--sources=` accepte `nosdeputes`, `nossenateurs`, `bluesky`,
`veille` et `x` ; sans ce drapeau, tout est collecté **sauf** X.

Le script :

- retrouve les candidats dans l'annuaire parlementaire **par leur nom**, sans configuration : aucun
  identifiant à renseigner à la main ;
- n'interroge des comptes sociaux que ceux déclarés dans `comptesSociaux`, et **liste les candidats
  qui n'en ont pas** — un identifiant deviné ferait citer la mauvaise personne, et un compte de
  soutien tenu par une équipe ne serait pas la parole du candidat ;
- ne retient que les messages contenant une affirmation vérifiable (une quantité, ou un chiffre
  accompagné d'un comparatif). Le filtre penche volontairement vers l'inclusion : mieux vaut
  collecter une citation qui se révélera invérifiable que d'écarter en amont, par une règle opaque,
  une déclaration qui méritait examen ;
- **n'écrase jamais une vérification existante** et ne supprime aucune citation ;
- affiche un bilan par source, avec le motif exact de chaque échec.

> **Adresses à confirmer.** L'environnement de développement de ce dépôt n'a pas d'accès sortant
> vers ces domaines : les chemins d'API et les adresses de flux ont été écrits d'après la
> documentation publique mais **n'ont pas pu être appelés**. Ils portent `urlConfirmee: false` dans
> `src/data/sources-citations.ts`, et le collecteur le rappelle à chaque échec. Corriger une adresse
> fautive tient en une chaîne de caractères ; la première exécution réelle dira lesquelles.

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
