# État de l'art

Ce que font les autres, ce qu'on leur emprunte, et ce qu'on en a tiré. Relevé le
6 septembre 2026 ; ces sites n'ont pas été audités, la liste dit qu'ils existent,
pas qu'ils sont bons.

## Comparateurs français pour 2027

| Site | Approche |
| --- | --- |
| [MonVote2027](https://monvote2027.fr/comparer) | Deux candidats face à face, thème par thème |
| [France-Vote](https://www.france-vote.fr/) | Test de 20 questions, sans données personnelles |
| [PourQuiTuVotes](https://pourquituvotes.fr/presidentielle/2027/) | Programmes décryptés proposition par proposition |
| [candidatspresidentielles2027.fr](https://www.candidatspresidentielles2027.fr/) | Synthèse des positions |
| [SP2027](https://sondages-presidentielle2027.fr/comparateur.html) | Comparateur sur 15 thèmes |
| [presidentielles-2027](https://scoly-oss.github.io/presidentielles-2027/) | Projet libre, sur GitHub Pages |
| [Fondation iFRAP](https://www.ifrap.org/comparateurs/presidentielles-2027) | Comparateur d'un *think tank* libéral assumé |

Le dernier rappelle utilement que **le format ne fait pas la neutralité** : un
comparateur reste l'œuvre de qui le publie, et afficher des colonnes ne suffit
pas à être impartial. C'est vrai de celui-ci comme des autres, d'où la
méthodologie exposée et le code ouvert.

## Le précédent qui compte : Elyze (2022)

Application « Tinder de la politique », **plus d'un million de téléchargements**
et première place de l'App Store en quelques jours. Puis deux critiques l'ont
emportée : la CNIL sur le traitement des données, et surtout un **biais
algorithmique** — à égalité entre candidats, le président sortant apparaissait
premier. L'explication de ses auteurs : il était déclaré en premier dans le code.
L'application a fini par supprimer les données collectées et ouvrir son code.

**Ce projet avait exactement le même défaut**, découvert en écrivant cette page.
Voir « Ce que ça nous a coûté » plus bas.

Autres antécédents français : Voxe (2012, 2017), La Boussole présidentielle
(*Le Monde*, avec Kieskompas).

## Les références sérieuses sont institutionnelles

Le [Wahl-O-Mat](https://www.sozwiss.hhu.de/en/institut/abteilungen/politikwissenschaft/politik-ii/prof-dr-stefan-marschall/forschungsprojekte/wahl-o-mat-research/facts-about-the-wahl-o-mat)
allemand est porté par l'agence fédérale d'éducation civique ; le StemWijzer
néerlandais existe depuis **1985**, d'abord sur papier ; [Smartvote](https://en.wikipedia.org/wiki/Smartvote)
couvre la Suisse. Deux enseignements valent d'être retenus.

**L'usage est massif.** En Suisse, en Finlande et aux Pays-Bas, **30 à 40 % des
électeurs** consultent un tel outil avant de voter. Ce n'est pas un gadget de
niche, et le dimensionnement de l'hébergement en tient compte (voir
[`HEBERGEMENT.md`](HEBERGEMENT.md)).

**Leur sourçage est meilleur que le nôtre.** Le Wahl-O-Mat ne déduit pas les
positions des programmes : il **soumet le questionnaire aux partis**, qui se
positionnent eux-mêmes, sur le compte rendu. C'est bien plus défendable que
d'interpréter des textes, et cela met le désaccord éventuel à la charge du parti
plutôt qu'à celle de l'outil. Nos positions sont aujourd'hui établies à la main
depuis les programmes, avec sources et statut de vérification. **Écrire aux
équipes de campagne pour faire valider ou corriger les positions est le progrès
méthodologique le plus rentable qui reste à faire.**

Les méthodes d'appariement diffèrent : le StemWijzer accorde un point par
position identique, le Wahl-O-Mat emploie une distance de Manhattan. Aucun ne
propose plusieurs méthodes en parallèle.

## Ce que ce projet fait de différent

Les outils recensés font **une** de ces choses. Celui-ci les combine :

- pondération des critères par l'utilisateur, et non un questionnaire fixe ;
- **quatre méthodes d'agrégation** appliquées à la même matrice, avec mesure de
  concordance et analyse de sensibilité — le lecteur voit si sa conclusion tient
  au choix de la méthode ou aux données ;
- situation judiciaire sourcée, avec un vocabulaire distinguant condamnation
  définitive, appel, mise en examen, relaxe et non-lieu ;
- vérification des déclarations depuis des sources publiques et gratuites.

## Ce que ça nous a coûté

Relever le biais d'Elyze a conduit à vérifier le nôtre. Il était là.

Le classement triait sur le score sans départage, puis numérotait 1, 2, 3. Le tri
de JavaScript étant stable, **à égalité c'était l'ordre du fichier de données qui
tranchait** — c'est-à-dire, ici, le spectre politique. Avec tous les poids à
zéro, cas qu'un utilisateur atteint en deux clics, les quinze candidats
obtenaient 50 et s'affichaient numérotés de 1 à 15, de Mélenchon à Zemmour. Le
fichier portait pourtant le commentaire « cet ordre est une convention de
lecture, pas un classement ».

Corrigé sur trois plans :

- **rangs ex æquo** (1, 1, 3), avec une tolérance de 1e-9 pour ne pas départager
  sur du bruit de calcul flottant ;
- **ordre alphabétique** entre candidats à égalité : arbitraire lui aussi, mais
  non corrélé à la position politique ;
- **signalement explicite** quand tous les scores sont égaux : l'interface dit
  que le classement n'ordonne rien, au lieu d'afficher une liste qui se lirait
  comme un résultat.

Vérifié par des tests unitaires et, dans un navigateur, sur le site compilé.
