# Vérification des déclarations

Comment les citations arrivent sur le site, comment elles sont vérifiées, et pourquoi
l'architecture est celle-là.

## Pourquoi la collecte n'a pas lieu dans le navigateur

Le site charge les citations à l'ouverture de la page et propose un bouton d'actualisation — c'est
ce que voit le visiteur. Mais ce qu'il charge est un **fichier publié**, pas une réponse de X.
Trois obstacles rendent l'appel direct impossible :

1. **Authentification.** L'API X exige un jeton porteur. Un jeton livré dans le paquet JavaScript
   est lisible par quiconque ouvre les outils de développement.
2. **CORS.** L'API X ne renvoie pas les en-têtes qui autoriseraient une page web à lire la réponse.
   Le navigateur refuserait la réponse même avec un jeton valide.
3. **Coût.** Depuis février 2026, X facture à l'usage : environ 0,005 $ par message lu et 0,010 $
   par lecture de compte, le palier gratuit étant fermé aux nouveaux développeurs. Une collecte à
   chaque ouverture de page ferait payer une lecture par visiteur, pour un contenu identique.

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
npm run collecte:citations -- --essai     # montre ce qui serait fait, sans appel réseau
X_BEARER_TOKEN=…  npm run collecte:citations
```

Le script :

- n'interroge que les candidats dont le champ `compteX` est renseigné, et **liste ceux qui ne le
  sont pas** — un identifiant deviné ferait citer la mauvaise personne ;
- ne retient que les messages contenant une affirmation vérifiable (une quantité, ou un chiffre
  accompagné d'un comparatif). Le filtre penche volontairement vers l'inclusion : mieux vaut
  collecter une citation qui se révélera invérifiable que d'écarter en amont, par une règle opaque,
  une déclaration qui méritait examen ;
- **n'écrase jamais une vérification existante** et ne supprime aucune citation ;
- affiche le volume facturable de la collecte.

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
autoriser le site par CORS. **Le service détient le jeton, met le résultat en cache et n'expose que
l'instantané** — il ne relaie pas l'API X message par message, sans quoi le problème de coût
reviendrait par la fenêtre.

Si le service est absent, lent ou en panne, le site retombe automatiquement sur l'instantané publié
et le signale. Sans point d'accès configuré, tout fonctionne : c'est le mode par défaut.

## Ce qui n'est pas publié

Aucune citation d'exemple n'est fournie, et le fichier livré est vide. Une citation inventée
attribuée à une personne réelle serait exactement ce que cet outil cherche à combattre. Un test
échoue si l'instantané publié contient des marqueurs de démonstration ou un identifiant de message
qui n'est pas numérique.

## Données personnelles

Le site ne charge aucun script de X et n'incorpore aucun message : les textes sont affichés depuis
le fichier publié, en texte brut. Le visiteur n'est donc pas exposé aux traceurs de la plateforme,
et le lien vers le message d'origine porte `rel="noopener noreferrer nofollow"`.
