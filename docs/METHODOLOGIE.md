# Méthodologie de calcul

Référence technique des formules. La version destinée aux utilisateurs est la page
« Méthodologie » de l'application ; ce document s'adresse à qui veut relire le code.

## Affinité programmatique

Pour chaque proposition `p` à laquelle l'utilisateur a répondu, avec une réponse `u ∈ [−2, +2]` et
une importance `w ∈ {0, 1, 2, 3}` :

```
position_candidat = position[axe(p)] × polarité(p)          ∈ [−2, +2]
accord(p)         = 1 − |u − position_candidat| / 4          ∈ [0, 1]

affinité = 100 × Σ (accord(p) × w) / Σ w        sur les p tels que w > 0
```

- `w = 0` retire la proposition du numérateur **et** du dénominateur.
- Sans aucune réponse pondérée, l'affinité vaut 50 — neutre, pas favorable.
- L'affinité par thème applique la même formule aux seules propositions du thème.

Implémentation : `src/lib/scoring/affinite.ts`.

## Boussole en deux dimensions

Chaque axe déclare sa contribution `boussole.eco` et `boussole.soc`. La projection est une moyenne
pondérée normalisée sur `[−1, +1]` :

```
eco = Σ (position[axe] × boussole.eco) / Σ (|boussole.eco| × 2)
soc = Σ (position[axe] × boussole.soc) / Σ (|boussole.soc| × 2)
```

Un axe dont les deux contributions sont nulles — le mix énergétique, par exemple — n'entre dans
aucune dimension. Les positions de l'utilisateur sont d'abord reconstituées axe par axe, en
pondérant chaque réponse par `importance + 1` : une réponse « peu importe » renseigne tout de même
une position, elle ne devait simplement pas peser sur l'affinité.

## Matrice de décision

L'affinité n'est pas mélangée après coup au score des critères. Elle entre dans la matrice comme une
colonne supplémentaire :

```
colonnes = [critères de poids > 0] + [affinité]
poids    = [poids_i / Σ poids × (1 − α)] + [α]        où α = partProgramme
```

Conséquence : les quatre méthodes s'appliquent à la même matrice, et « 60 % de programme » signifie
la même chose quelle que soit la méthode retenue. Quand tous les poids de critères sont nuls, `α`
est forcé à 1.

Les seuils rédhibitoires sont appliqués **avant** la construction de la matrice : un candidat écarté
ne fausse pas les normalisations relatives de TOPSIS et de Copeland.

## Les quatre méthodes

Toutes renvoient un score sur `[0, 1]`.

| Méthode | Formule | Propriété |
|---|---|---|
| **Somme pondérée** | `Σ wⱼ × vᵢⱼ/100` | Totalement compensatoire |
| **Produit pondéré** | `exp(Σ wⱼ × ln(max(0,02 ; vᵢⱼ/100)))` | Faiblement compensatoire : une note basse n'est pas rattrapée |
| **TOPSIS** | `d⁻ / (d⁺ + d⁻)` après normalisation vectorielle et pondération | Relative au champ : retirer un candidat modifie les autres |
| **Copeland** | Duels deux à deux, victoire au poids cumulé, seuil d'indifférence de 2 points | Insensible à l'échelle des notes |

Le plancher de 0,02 dans le produit pondéré évite qu'une seule note nulle annule mécaniquement le
score entier. Le seuil d'indifférence de Copeland évite qu'un écart d'un point sur une note
approximative décide d'un duel.

Implémentation : `src/lib/scoring/methodes.ts`.

## Normalisations

- **Absolue** (`v / 100`) — utilisée par la somme et le produit pondérés, parce que les notes du
  référentiel ont déjà une signification absolue : 82 et 84 doivent rester presque identiques.
- **Vectorielle** (`v / ‖colonne‖`) — requise par TOPSIS.
- **Min-max** — disponible et testée, non utilisée par défaut : elle étire artificiellement des
  écarts faibles. Une colonne constante y est ramenée à 0,5 partout plutôt qu'à 0 ou 1, pour qu'un
  critère non discriminant ne fasse ni gagner ni perdre personne.

## Analyse de sensibilité

```
pour t de 1 à 1000 :
    w' ← Dirichlet(concentration × w)      concentration = 40
    classement ← agréger(matrice, w', méthode)
    compter la victoire et le rang de chacun

stabilité = victoires du vainqueur de référence / 1000
```

Lecture : ≥ 70 % robuste · 45–70 % à nuancer · < 45 % fragile.

Le générateur pseudo-aléatoire est déterministe et initialisé sur une graine fixe : à réglages
identiques, les chiffres sont identiques d'une visite à l'autre. Les lois Gamma suivent
Marsaglia-Tsang, la loi normale Box-Muller.

Implémentation : `src/lib/scoring/aleatoire.ts` et `sensibilite.ts`.

## Concordance entre méthodes

Moyenne des tau de Kendall entre les six paires de classements produits par les quatre méthodes.
Affichée ramenée sur `[0, 100 %]` par `(τ + 1) / 2`. Une valeur élevée signifie que le choix de la
méthode ne change rien ; une valeur basse signale un champ de candidats aux profils déséquilibrés,
que certaines méthodes pénalisent et d'autres non.

## Probité et antécédents judiciaires : deux critères, deux questions

La distinction est le point méthodologique le plus important du référentiel.

- **Probité** répond à « cette personne a-t-elle été sanctionnée pour un manquement à la probité ? ».
  Son barème ne connaît que les atteintes à la probité : corruption, détournement de fonds publics,
  prise illégale d'intérêts, fraude fiscale. Une condamnation pour propos publics, pour rébellion ou
  pour diffamation ne lui retire aucun point.
- **Antécédents judiciaires** répond à « cette personne a-t-elle déjà été condamnée, pour quoi que
  ce soit ? ». Son barème compte toutes les condamnations sans les hiérarchiser.

Conséquence assumée : un candidat peut afficher 100 en probité et 40 en antécédents. Ce n'est pas
une incohérence, c'est la traduction chiffrée d'une réalité juridique — les infractions de presse et
les atteintes aux deniers publics ne sont pas la même chose. Le poids relatif des deux critères est
un choix politique, et il appartient à l'utilisateur, pas au barème.

Le double décompte est volontaire : une condamnation pour atteinte à la probité fait baisser les
deux notes. Il est signalé dans le champ `limites` du critère.

Degrés de juridiction, dans le barème de probité :

| État | Points retirés |
|---|---|
| Condamnation définitive | −45 |
| Condamnation confirmée en appel, pourvoi en cassation pendant | −35 |
| Condamnation de première instance frappée d'appel | −25 |
| Mise en examen en cours | −12 |
| Enquête sans mise en examen | 0 |
| Relaxe, non-lieu, classement sans suite | 0 |

Une enquête ne retire rien : elle n'établit pas de culpabilité. Un test le vérifie.

## Tests

`src/lib/scoring/scoring.test.ts` couvre les normalisations, les quatre méthodes, le tau de Kendall,
l'affinité (accord parfait, opposition frontale, exclusion des importances nulles, pondération), le
déterminisme et la calibration de l'analyse de sensibilité, et le classement complet (rangs, seuils
rédhibitoires, exclusions, bascule à 100 % de programme, décompte des notes manquantes).

`src/data/coherence.test.ts` teste le jeu de données lui-même : contrat de vérification (deux
sources minimum pour un élément « recoupé », qualification et date obligatoires sur toute
condamnation, sources existantes), cohérence entre les affaires et les notes dans les deux sens, et
validité des liens officiels.

```bash
npm test
```
