# Legato - appli de piano

## Quoi

Projet d'une PWA de piano « à la Simply Piano » **pour Simon**, adulte qui connaît la théorie et
vient de la guitare (son point faible déclaré : savoir quel doigté mettre au piano). Nom :
« Legato » (choisi par Simon le 2026-11-06, à la place de « Déchiffre »). Un projet original, pas un clone : nom, look et cours sont à lui.

Matériel cible (confirmé par Simon le 2026-11-06) : **Yamaha P-145** branché en USB sur son
**téléphone Android**, téléphone posé en paysage sur le pupitre.

## Statut

**v13 prête en local, pas encore commitée (2026-11-10)** : doigtés calculés revus (Sarabande mes. 2 et 10 en 1-2-4, mes. 14-15 dans une seule position) ; 120 / 120 en local en 800 x 360, Sarabande perso comprise ; **v12 vérifiée en ligne (2026-11-10, `66818e1`** : 5 niveaux, tri ; worker `v=12`, 117 / 117 sur kkjsf.github.io en 800 x 360) ; **v11 vérifiée en ligne (2026-11-10, `7c85238`** : catalogue PDMX ; worker `v=11`, cache `legato-v11`, 116 / 116 sur kkjsf.github.io en 800 x 360) ; **v10 vérifiée en ligne (2026-11-10, `bffd6d1`** : import MusicXML, lecture ; worker `v=10`, cache `legato-v10`, 110 / 110 sur kkjsf.github.io en 800 x 360, Sarabande perso absente) ; **v9 vérifiée en ligne (2026-11-09, `2ad76b7`** : worker `v=9`, cache `legato-v9`, 88 / 89 sur kkjsf.github.io, Sarabande perso absente, seul échec le métronome en temps réel bridé par le volet) ; v8 en ligne ; v7 vérifiée en ligne (`36971fe`) ; v6 vérifiée en ligne (`78240ec` : worker `v=6`, cache `legato-v6`, 62 / 62 sur kkjsf.github.io, la Sarabande perso n'y étant pas), v2 = la première vraie version : https://kkjsf.github.io/legato/, dépôt
public `git@github.com:kkjsf/legato.git`, Pages sur `main`, racine. Historique : `7af8a49`
prototype v1, `a0bfb8c` palette de Harmonic Atlas (or = main droite, violet = main gauche, crème
des touches, titre en Playfair Display), puis `72b5781` v2 (partition qui défile, métronome, démo). Le premier déploiement Pages
de la v2 a échoué à l'étape « Deploy » (build correct, bloqué 11 min côté GitHub) : le push suivant
(`9c0aa84`) l'a relancé. v3 (accueil de la maquette, `19bb06e`) le même soir :
même panne de déploiement (délai dépassé, puis relance restée « Queued » 1 h 30), publiée par un commit
vide (`bd60920`). **v3 vérifiée en ligne** : worker `v=3`, caches `legato-v3` et `legato-fonts`, 38 / 38.
Si Pages recoince : pousser un commit vide plutôt qu'attendre la relance. **Vérifié en ligne le 2026-11-06** : v2 servie, worker `sw.js?v=2`, cache
`legato-v2`, `tools/test_engine.js` lancé sur kkjsf.github.io : 38 / 38, partition affichée en 800 x 360.
`maquettes.html` est exclu par `.gitignore` (ne pas le publier). **Essayé sur le vrai
P-145 en v9 : « ça marche bien sur P145 » (Simon, 2026-11-10)**, sans plus de détail (latence mesurée, son par l'audio USB : pas précisé). Le lien avec Harmonic Atlas est mis de côté à la demande de Simon. Livraison : bumper
`APP_VERSION` (le worker en dérive son cache `legato-v<N>`), lancer les tests, commit, push.

### v13 (2026-11-10) : doigtés calculés, main serrée et accords

Simon a demandé la méthode de calcul du doigté, puis de corriger les deux passages de la Sarabande que la
relecture jugeait jouables mais peu naturels. Trois règles changées dans le calcul (`SPAN`, `squeeze`,
`fingCands`, `fingTrans` dans `index.html`) :
- **Main serrée** (`squeeze`) : plus de doigts que de demi-tons entre deux notes. Avec le pouce, toujours 0,6 par
  cran ; sans lui, **3** (un demi-changement de position). Avant, Ré au 4 puis Do♯ au 2 ne coûtait que 0,6.
- **Accord : deux doigts voisins sans le pouce tiennent un ton sans effort, pas une tierce** (2-3 sur une tierce
  mineure : +1,5, comme le « relâché » de Parncutt). La-Do♯-Mi passe de 1-2-3 à 1-2-4.
- **Accord qui garde une extrémité** : la main ne bouge pas si une extrémité reste en place (même note, même
  doigt). Si elle se place seulement sans effort, l'autre peut encore s'écarter, se resserrer ou glisser d'un ton
  au plus avec le même doigt. Avant, toute extrémité « sans coût » plafonnait le passage à 2, même un 5 qui
  saute une tierce (Sol au 5 puis Mi au 5) ou un croisement à 20. La version stricte (même note seulement) a été
  essayée puis écartée : elle cassait les tierces doublées (pouce qui glisse d'un demi-ton).

Effet sur la Sarabande, main droite seulement : mes. 2 et 10 La-Do♯-Mi en **1-2-4** ; mes. 4 et 12 Do-Mi-Sol en
1-2-4 puis Fa♯-La en 3-5 (la main ne bouge plus avant la mes. 5) ; mes. 14-15 **La 1, Ré 3, Do♯ 2 | Ré 3, Mi 4,
Fa 5, Mi 4, Ré 3**, une seule position (avant La 2, Ré 4, Do♯ 2, la main se recalait). Main gauche inchangée.

Vérification :
- Gammes inchangées (22 / 24 en une octave, 17 / 24 en deux) ; accord avec les doigtés écrits du répertoire
  inchangé sauf Menuet en sol mineur 71 -> 70 % (MG mes. 5-6 en 5-4-3 au lieu de 2-3, l'écrit met le pouce)
  et Mélodie 57 -> 58 %.
- **Banc d'essai plus large, sur les doigtés écrits du catalogue PDMX** : 82 pièces avec au moins 20 doigts
  écrits et 2 500 notes au plus, 12 584 doigts écrits ; on retire les doigts écrits, on calcule, on compare.
  **56,10 % -> 56,52 %** (30 pièces mieux, 22 moins bien, 30 pareil). Plus fort recul : études de Chopin et
  Album pour enfants de Tchaïkovski (un motif MG Do-Mi♭ en 3-2 que l'éditeur met sur une tierce mineure).
  Recette : page servie en local, `zipIndex` / `zipEntry` sur `perso/legato-catalogue.zip`, `unzipMxl` +
  `parseMusicXml`, `autoFinger` sur des notes sans `fx`, et l'ancien calcul extrait par `new Function` d'une
  copie de l'ancien `index.html` posée dans `perso/` (ignoré par git, à effacer après).
- Tests : 120 (2 nouveaux : Sarabande mes. 1-3 et 14-16 recopiées dans le test, donc vérifiées aussi en ligne ;
  le contrôle du fichier perso vérifie en plus mes. 2 = 1-2-4 et le La de la mes. 14 au pouce). En 800 x 360 :
  120 / 120. Hors de cette taille ou volet masqué, les tests d'affichage (barre, partition sans clavier,
  métronome en temps réel) échouent : ce n'est pas le calcul.

### v12 (2026-11-10) : catalogue en 5 niveaux, tri

Demande de Simon : au moins 5 niveaux de difficulté, trier par note / étoiles, et « à quoi servent les mes. ? »
(c'étaient les mesures : écrit en entier désormais).
- `level()` de `tools/build_catalog.py` : densité = notes par temps (`n_notes / song_length.beats`), seuils
  1,2 / 2,2 / 3,5 / 5,5, un cran de moins pour une seule portée ; difficulté MuseScore 1 = au plus 3, 2 = entre 2
  et 4, 3 = au moins 4. Répartition : 426 / 574 / 714 / 658 / 232 (niveau 1 : versions simples, Gnossienne
  n° 1, El Condor Pasa ; niveau 5 : Rachmaninov, concertos de Tchaïkovski et Grieg). Noms : débutant,
  facile, moyen, avancé, virtuose. Un ancien catalogue en 3 niveaux reste lisible (points sur le maximum).
- Vue catalogue : filtre Tous / 1 à 5, « Trier par » : mieux notés, difficulté croissante ou décroissante,
  plus courts, plus longs, titre (à égalité, l'ordre de l'index). Tests : 118. **Recopier le nouveau
  `perso/legato-catalogue.zip` sur le téléphone** (« Remplacer le catalogue ») pour avoir les 5 niveaux.
- Limite connue : la sélection repose sur ce que déclare la personne qui publie sur MuseScore ; un morceau
  marqué traditionnel peut être récent (vu : « Mi General Augusto Pinochet », arr. b3cquerel).

### v11 (2026-11-10) : catalogue PDMX sur le téléphone

Demande de Simon : « je pourrais mettre ce catalogue sur mon tel aussi et l'appli piochera dedans ? ok prépare le catalogue ».

- **Fichier catalogue** `perso/legato-catalogue.zip` (**2 604 pièces, 47 Mo** ; ignoré par git, jamais publié), fait par
  `tools/build_catalog.py` depuis PDMX v9 (Zenodo 15571083 : `PDMX.csv` 225 Mo + `mxl.tar.gz` 1,9 Go,
  téléchargés dans `perso/pdmx/`, lus en flux). Zip **stocké** (sans recompression) : `index.json`
  (colonnes `id, titre, compositeur, niveau 1-3, mesures, notes, doigtés écrits, note x10, licence`,
  classé des mieux notés aux autres) + `mxl/<id>.mxl` (id = 16 premiers caractères du hash PDMX).
- **Sélection** : piano seul (pistes MIDI 0 à 7, une ou deux), `subset:no_license_conflict`,
  `subset:all_valid`, `is_best_unique_arrangement`, ni brouillon ni payant, au moins 24 notes ; puis noté
  3,5 ou plus, ou deux portées avec un compositeur nommé (60 notes au moins), ou deux portées et 3 favoris ;
  avec des notes à hauteur (pas de batterie). **Liste blanche** : compositeur mort avant 1956 (`PD_COMPOSERS`),
  traditionnel ou anonyme (`TRAD`), ou composition de l'auteur sans signe de reprise (`MODERN` : arr, cover, OST, Disney...).
  Un 1er essai qui excluait seulement des genres laissait passer « Toss a Coin to your Witcher », « Le festin »,
  « Patience » (genre non renseigné) : ne pas revenir à une liste noire.
  **Pop, rock, musique de film, jazz... exclus sauf composition de l'auteur** (`is_original`) : marqués
  domaine public, ce sont souvent des arrangements d'œuvres protégées. Niveau : `complexity` de MuseScore
  (1 à 3), relevé d'un cran si les notes par mesure le disent, sinon estimé (< 7, < 16, au-delà).
- **Dans l'appli** : bouton « Catalogue » (carte Répertoire), vue `v-cat`. Le fichier est ouvert une fois
  (`#f-cat`), gardé dans **IndexedDB** (base `legato`, magasin `files`, clé `catalogue`,
  `navigator.storage.persist()`), puis lu **à la demande** sur le Blob (`zipIndex` lit la fin du zip,
  `zipEntry` un fichier ; `unzipMxl` passe aussi par eux). Recherche titre / compositeur sans accents ni
  majuscules, filtres difficulté et « avec doigtés écrits », 80 résultats affichés. Toucher un morceau =
  import MusicXML (`cat` = id, pas de doublon) et ouverture. Les morceaux ajoutés vont dans « Mes
  fichiers » (localStorage, quelques Mo : à surveiller si on en ajoute beaucoup).
- Tests : 117 (6 catalogue : zip fabriqué, ouvert par le champ fichier, gardé et relu d'IndexedDB,
  recherche, filtres, ajout avec doigté écrit, pas de doublon ; le catalogue déjà gardé est remis après).

### v10 (2026-11-10) : import MusicXML et lecture des notes

Demande de Simon : « ok pour le music xml et lecture clé de fa », « et déploie ».

- **Import MusicXML** (`importFile` reconnaît le contenu : `MThd` = MIDI, `PK` = .mxl, sinon texte
  `score-partwise`) : le bouton « Importer MIDI ou MusicXML » n'a plus de filtre `accept` (Android grise
  les extensions qu'il ne connaît pas). `.mxl` = zip lu à la main (répertoire central, `META-INF/container.xml`,
  `DecompressionStream('deflate-raw')`). `parseMusicXml` : `divisions`, `backup` / `forward` (voix),
  accords, notes d'agrément ignorées, **liaisons fondues** en une note (même portée, même hauteur, qui se
  suivent), **doigtés écrits** (`notations/technical/fingering`), armure, mesure, tempo (`sound tempo`
  sinon `metronome`), titre (`work-title`, `movement-title`, sinon 1er `credit-words`), compositeur.
  **Reprises dépliées** (barres de reprise, 1re / 2e fois ; D.C., D.S. et coda ignorés), **anacrouse** calée
  sur la fin de la 1re mesure. Mains : une partie de piano à deux portées est seule gardée (chant et autres
  parties ignorés, dit dans `warn`), portée 1 = MD, portée 2 = MG ; sinon la règle du MIDI. Clé de sol en
  portée 2 = `clefL: 'G'`. Un changement de mesure est signalé (les barres suivent la 1re mesure).
  Données `data` : `[midi, on, dur, main, doigt écrit]`.
- **Doigtés** : `build` met le doigt écrit en `fx` ; `autoFinger` ne garde, pour un groupe qui en a, que
  les solutions qui le respectent, et calcule le reste autour (positions, passages du pouce, `ch`).
- Essayé sur le corpus de test d'OpenSheetMusicDisplay (lu depuis GitHub, rien enregistré) : sonatines
  de Clementi op. 36 n° 1 et 3, Prélude en do BWV 846 (35 mes.), Cavalier sauvage de Schumann (.mxl,
  6/8, anacrouse d'une croche), Entertainer, An Chloe (piano gardé, voix ignorée), 17 fichiers de
  doigtés : **tous les doigts écrits gardés** (13 / 13, 27 / 27...), dessin sans erreur.
- **Lecture** (écran 5 des maquettes ; carte « Lecture » à l'accueil, à la place de « Mes fichiers »,
  dont la liste et le bouton d'import passent dans la carte Répertoire) : vue `v-read` en SVG. Clé de fa
  ou clé de sol, **6 niveaux** par place sur la portée (`RD_LVLS`, `rel` = degrés au-dessus de la 1re
  ligne) : repères (fa : les deux Do, Sol 1re ligne, Fa 4e ligne ; sol : Do central, Sol 2e ligne, Do
  3e interligne, Sol au-dessus), lignes, interlignes (avec dessous / dessus), toute la portée, deux
  lignes supplémentaires, dièses et bémols. Rondes sur papier ivoire, note en cours entourée, les deux
  suivantes en gris, les deux d'avant avec ✓ / ✗. Il faut la **hauteur exacte** : une fausse note est
  notée ratée, la bonne touche s'allume en or et le nom s'affiche, on attend la bonne ; une octave à
  côté le dit (« bonne note, mauvaise octave »). Séries de 40 ; réussi = 90 % du premier coup et
  2,5 s par note en moyenne, « Niveau suivant » proposé, ✓ dans la liste des niveaux (`legato-read-best`).
- **Répétition espacée** : 10 derniers essais par note (`legato-read` = { clé : { h, t } }, clé =
  clef + degré + altération, par place et non par hauteur). Tirage pondéré : jamais vue 2,5 ; sinon
  1 + 3 x taux d'erreur, + 1 au-delà de 2,5 s (médiane), au plus 4 ; jamais deux fois la même d'affilée.
  « Tes notes à revoir » : au moins 3 essais, moins de 90 % ou plus de 2 s ; petit clavier rougi selon
  les erreurs. Le temps de lecture compte dans le temps joué du jour. Option « Noms » sous les notes.
- Tests : 111 (16 import MusicXML et lecture : anacrouse, liaison, accord, reprise 1re / 2e fois,
  doigtés écrits gardés, .mxl, format refusé, morceau joué en entier ; niveaux, places, fausse note,
  octave, tirage pondéré, fin de série, niveau suivant, clé de sol, carte d'accueil).
- **Catalogue PDMX** (question de Simon) : pas d'accès fichier par fichier (Zenodo ne sert les
  250 000 MXL que dans `mxl.tar.gz`, 1,9 Go) ; piste : un catalogue choisi (piano, sans conflit de
  licence) publié à part, que l'appli parcourt et importe. Pas commencé.

### v9 (2026-11-09) : se déplacer dans le morceau

Demande de Simon : « se rendre facilement à un endroit de la partition, revenir en arrière, etc ».

- **Moteur** : `P.seek(b, run)` repart du temps `b` (borné au passage, au plus au début de sa dernière
  mesure). Les notes à partir de `b` redeviennent `pend` ; celles d'avant encore `pend` passent à
  **`skip`** (ni attendues, ni jouées par l'appli, ni comptées dans le bilan, dessinées estompées) ; les
  notes déjà jouées avant `b` gardent leur état. `P.cue` = le temps de départ (remplace `t0` pour le
  décompte et le métronome du décompte). En tempo, une mesure de décompte avant `b` ; en attente et en
  démo, un demi-temps d'avance.
- **Barre des mesures** (`.nav`, 28 px, sous la barre d'outils) : une case par mesure, numéros 1, 3,
  5... quand elles sont étroites (`navLabels`), mesure en cours remplie au fil des temps (`--p`), cases
  du passage pleines et les autres estompées, trait vert (mesure toute juste) ou rouge (erreur) sous
  chaque case (`navSync`, au plus toutes les 200 ms). **Toucher** une case = y aller (`goMeasure` ; hors
  du passage choisi, retour au morceau entier) ; **glisser** sur plusieurs = les boucler (`setLoop`) ;
  pastille « ⟳ mes. a-b ✕ » pour revenir au morceau entier. Les menus « De la mesure / à la mesure /
  Boucler » des réglages restent en phase (`syncBar`).
- **⏮ / ⏭** (et flèches ← → du clavier d'ordinateur) : ⏮ revient au début de la mesure en cours, ou à la
  précédente si on y est déjà (à moins d'un demi-temps) ; ⏭ va à la suivante ; jamais hors du passage.
- **Glisser la partition** (ou les notes qui tombent) au-dessus du clavier : le morceau suit le doigt, en
  pause (`SCR`, seuil 10 px, après quoi l'appui long est annulé) ; au relâché, on repart du temps le plus
  proche. Partition : glisser vers la gauche avance ; notes qui tombent : glisser vers le haut recule.
- **Reprise** : en tempo, on ne relance que si ça jouait (sinon « ▶ Lancer à la mes. N ») ; en attente et
  en démo, ça repart, même depuis le bilan. Changer de mode ou de main **garde la mesure** (`keepPlace`).
- Le voile « Lancer » laisse passer le doigt (`pointer-events`), sauf sur son bouton : on peut glisser la
  partition à l'arrêt.
- Place : barre d'outils 48 → 44 px (boutons 36 px) pour que la barre des mesures ne rétrécisse pas la
  partition (interligne 13 px sans clavier à 800 x 360, comme avant).
- Tests : 90 (25 nouveaux : sauts, ⏮ ⏭, flèche, bilan sans les notes sautées, barre touchée et glissée,
  passage bouclé, décompte en tempo sans accompagnement, mode et main qui gardent la mesure, glisser la
  partition et les notes qui tombent). Vérifié à l'œil en 800 x 360 (partition, boucle 5-8 ; Menuet en
  sol mineur, 32 cases).

### v8 (2026-11-09) : doigtés de la Sarabande revus

Relecture du doigté calculé de la Sarabande (fichier perso), mesure par mesure. Trois règles en plus :
**un même accord garde le même doigté partout** (le plus fréquent, à égalité celui d'usage : La-Ré-Fa
de la mes. 9 en 1-3-5 comme la mes. 1) et un accord répété ne change pas de doigts (mes. 8) ;
**pas de passage du pouce dans une broderie** (la ligne repart aussitôt, sans venir d'un trait par degrés
conjoints : +2) ; passer le 2 par-dessus le pouce coûte 4,5. MG mes. 2 et 10 : La 2, Si♭ 1, La 2, Sol 4 (était
1-2-3-4 avec un croisement). Reste discutable : mes. 14, Ré 4 puis Do♯ 2 (serré, jouable). Gammes inchangées
(22 / 24 et 17 / 24). Tests : 65.

### v7 (2026-11-09) : doigtés calculés vérifiés sur les 12 gammes majeures

Question de Simon : « comment peux-tu être sûr des doigtés ? ». Réponse honnête : on ne peut pas l'être, le
calcul est un modèle de coût ; on le confronte donc au doigté qu'on enseigne pour les 12 gammes majeures
(montée et descente, chaque note gardant son doigt). La v6 était juste sur 15 / 22 en une octave et
**3 / 24 en deux octaves** : à égalité de coût, elle tranchait au hasard (pouce sur Sol en Do) et
ratait les gammes à bémols (Si♭ en 2-3-1 au lieu de 4-1-2-3). Trois règles ajoutées :

- **Passage du pouce plus facile sur un demi-ton** (+0,3 par demi-ton au-delà) **et d'une touche noire
  vers une blanche** (-1,5 : Si♭ au 4 puis Do au pouce) ; passer depuis le 4 coûte 3,5 (était 4).
- **Extrémités** : un trait commence par le doigt du bout dans le sens où il va (pouce s'il monte, 5
  s'il descend, dans le repère de la main) et finit de même (0,4 par doigt d'écart).
- **Même note, même doigt** pour la première et la dernière note : elles reprennent le doigt de la
  même note la plus proche dans le passage (16 groupes au plus), +1 sinon. Deux passes de calcul.

Résultat : **une octave 22 / 24** (écarts : Si MG commence par 5 au lieu de 4 ; Fa♯ MD finit en haut
par 3-4-5 sans repasser le pouce), **deux octaves 17 / 24** : les quatre gammes à bémols justes aux deux
mains, la MD juste partout sauf Fa♯, mais la **MG de Do, Sol, Ré, La, Si et Fa reste à part** (Mi
juste). Là, le doigté enseigné est une convention (le 5 sur la tonique, le pouce sur la tonique et la
dominante, passages sur des tons) que les règles générales ne retrouvent pas : en Do MG à la descente
le calcul met le pouce sur Fa et Do (passages sur des demi-tons, jouable), en Fa et Sol il passe vers la
touche noire. Essayé et abandonné (sur-ajustement, ou sans effet) : un pouce attiré par la tonique de
l'armure, une préférence MG pour les passages sur un ton, un vote « même doigt » sur tout le passage.
Accords inchangés (1-3-5, 5-3-1, 1-5) ; accord avec les doigtés écrits : Menuet 50 %, Mélodie 57 %, Menuet en
sol mineur 71 %, Ode 67 %, Clair de lune 76 %. Tests : 64 (les 12 gammes en une et deux octaves).

### v6 (2026-11-09) : doigtés calculés, correction par appui long, latence, icône

- **Doigtés calculés pour les MIDI importés** (`autoFinger`, appelé dans `build()` quand le morceau
  vient de `data`) : programmation dynamique, main par main, sur les doigts 1 à 5. La main gauche est
  calculée comme une main droite en miroir (hauteur `q = -midi`, pouce côté aigu). Groupes = notes de
  même attaque. Coût d'une note à l'autre (`fingStep`) : écart en demi-tons contre écart de doigts
  (table `SPAN` confortable / possible par paire, ex. 1-5 jusqu'à 10 / 12), main serrée pénalisée,
  passage du pouce permis seulement pouce sur la note aiguë et 2/3/4 sur la grave (`CROSS` : coût 3 à 4 +
  surcoût au-delà de 2 / 4 / 5 demi-tons), même doigt sur deux hauteurs = déplacement, autres
  croisements quasi interdits ; pouce sur touche noire +2,5 (5e doigt +0,5). Accords : toutes les suites
  croissantes de doigts (`fingCands`), modèle préféré selon l'écart (`chordTpl` : 1-5 / 1-4 / 1-3 / 1-2
  pour deux notes, 1-2-3 / 1-3-5 / 1-2-4 pour trois). D'un groupe à l'autre (`fingTrans`) : moyenne
  graves / aigus ; si une extrémité d'un accord reste en place, la main ne change pas de position ; un
  déplacement coûte moitié moins après un silence. `ch` (changement de position) = première note,
  passage du pouce, déplacement ou écart au-delà du possible. Vérifié : gamme de Do MD 12312345 /
  4321321 et MG 54321321 / 2312345, Do-Mi-Sol 1-3-5 et 5-3-1, octave 1-5 ; Sarabande perso : 164 notes,
  accords 1-3-5. Sur le Menuet et la Mélodie passés comme imports, 51 et 57 % des doigts tombent comme
  ceux écrits à la main (le reste : autres choix d'une même position, pas des erreurs flagrantes).
- **Correction par appui long** (500 ms, `LONG_MS`) sur un chiffre, une touche qui montre un doigt
  ou une note (qui tombe ou de la partition) : petite fenêtre 1 à 5 + « Auto » (doigté écrit ou
  calculé). Zones touchables refaites à chaque image (`HITS`, priorité chiffre > touche > note). Le
  mode tempo s'arrête pendant le choix et reprend après. Gardé en `localStorage`
  `legato-fing-<id>` = { indice de la note dans `pc.notes` : doigt }, appliqué dans le constructeur
  de `Player`, aussi pour les morceaux intégrés ; effacé avec l'import.
- **Latence** (diagnostic, encadré « Latence », lien aussi dans les réglages du passage) : 16 clics
  à 80 bpm, Simon joue sur les 12 derniers ; décalage appui - clic (horodatage de l'événement MIDI,
  `evTime`, contre l'heure du clic programmé sur l'horloge de sortie), un appui par clic, médiane après
  avoir écarté ce qui s'éloigne de plus de max(25 ms, 3 MAD), bornée de -80 à 300 ms, gardée en
  `SET.latency`. Le mode tempo la retire de l'instant d'appui (`P.input`) et attend d'autant avant de
  compter une note ratée ; le bilan « en avance / en retard » le dit (« latence de N ms déduite »).
- **Nouvelle icône** (demande de Simon) : trois noires or qui montent, liées par une liaison violette,
  sans portée, sur le fond sombre (`tools/build_icons.py`, SVG et PNG depuis la même géométrie).
- Tests : 63 (17 nouveaux : doigtés calculés sur gamme, accords et imports, Sarabande si le fichier perso
  est servi, appui long réel par `PointerEvent` puis reprise, latence de 40 ms simulée mesurée à 39 ms
  avec deux appuis aberrants écartés, bilan « plutôt en retard » sans correction et « bien en place »
  avec). Vue partition et encadré latence vérifiés en 800 x 360. **Pas essayé sur le vrai P-145**,
  donc la vraie latence reste à mesurer.

### v5 (2026-11-09) : son de l'appli et partition plein écran

- **Bouton son** (haut-parleur, `SET.sound`) : « autre main » (comme avant), « tout » (l'appli joue
  aussi les notes de l'élève, toujours sur le **téléphone** : envoyées au piano, elles retrigeraient
  sa touche et la garde anti-écho de 80 ms avalerait son vrai appui) ou « coupé » (on n'entend que
  le piano). Le métronome garde son propre bouton ; la démo joue toujours.
- **Masquer le clavier en vue partition** (bouton clavier barré, `SET.kbd`, visible seulement en
  partition) : la portée prend toute la hauteur, interligne jusqu'à 17 px (13 avec le clavier).
- Barre compactée pour tenir en 800 px : « Doigtés / Positions / Sans doigtés ». Tests : 46.

### v4 (2026-11-09) : vrai piano, répertoire étoffé

- **Son de piano échantillonné** pour tout ce que joue le téléphone (démo, autre main sans sortie
  MIDI, touches à l'écran) : **Salamander Grand Piano V3** (Alexander Holm, **CC BY 3.0**), les
  mêmes MP3 que Harmonic Atlas (qui les charge par Tone.js depuis `tonejs.github.io/audio/salamander/`),
  copiés dans `samples/piano/` (30 fichiers, La0 à Do8 toutes les tierces mineures, 2 Mo,
  `LICENCE.txt`). Chargés sans Tone.js à l'ouverture du 1er morceau (`loadPiano`, `decodeAudioData`),
  note intermédiaire transposée depuis l'échantillon le plus proche (`pianoNote`), synthèse en
  secours tant qu'ils ne sont pas prêts. Le worker les garde dans `legato-samples` (survit aux
  versions). Le métronome garde son clic.
- **Répertoire classé par difficulté** (`lvl` 1 à 3, points sur l'accueil) : Au clair de la lune et
  Ode à la joie (1), Menuet en sol (2), **Menuet en sol mineur** BWV Anh. 115 (2, 32 mes., notes
  Mutopia, Bach-Gesellschaft, saisie Allen Garvin, domaine public), **Mélodie** de Schumann op. 68
  n° 1 (3, 24 mes., notes Mutopia, édition Peters, saisie Philippe Hézaine, CC BY-SA 2.5 ; l'œuvre est
  du domaine public). Notes extraites des MIDI Mutopia (nombre de notes vérifié par les tests),
  doigtés proposés par un calcul de positions puis repris à la main mesure par mesure (passages du
  pouce, phrases répétées, MG de la Mélodie en position de Do 5-4-3-2-1, déplacements marqués). Une
  note tenue sous des croches (Fa de la Mélodie, mes. 12 et 20) est raccourcie en croche : le format
  des voix est séquentiel.
- **Portée du bas en clé de sol** quand un morceau le demande (`clefL: 'G'`, portée `BT`) : la MG
  de la Mélodie reste au-dessus du Do central.
- **Épellation** : à égalité sur la ligne des quintes, le dièse (Do♯ en ré mineur, Fa♯ en sol mineur).
- **Ha Sara** (`0_PERSO/Musique/PIANO/Ha_Sara.pdf`) = la Sarabande de la Suite en ré mineur
  HWV 437 de Haendel (thème de *Barry Lyndon*) **dans l'arrangement 8notes.com « © 2018 Red
  Balloon Technology Ltd »** : œuvre du domaine public, arrangement protégé, donc **pas dans le dépôt
  public**. Transcrite (16 mesures, 3/2, ré mineur, accords MD + basse) en MIDI **personnel**
  `perso/Sarabande_Haendel_HWV437_8notes.mid`, dossier `perso/` ignoré par git : à copier sur le
  téléphone et à ouvrir par « Importer un MIDI » (reste sur l'appareil, sans doigtés).
- Tests : 43 contrôles (répertoire : nombre de notes, fin sur la barre, doigtés partout). Dans le
  volet navigateur bridé à 1 image/s, le contrôle de régularité du métronome en temps réel échoue
  (un à-coup au-delà de 250 ms) : bridage du volet, pas de l'appli (passé en v2 / v3).

### v3 (2026-11-06) : l'accueil de la maquette

Accueil refait sur l'écran 1 de `maquettes.html`, sans rien défiler en paysage (800 x 360) : panneau
de gauche (logo, pastille du piano, anneau du temps joué aujourd'hui sur 20 min, série de jours
d'affilée, bouton « Reprendre · <dernier morceau> », lien vers le diagnostic) et quatre cartes :
**Doigtés** (mini clavier de la prochaine gamme à réussir avec ses doigts, puces des 4 gammes, ✓ à
90 % et plus), **Répertoire** (barre du meilleur score par morceau), **Mes fichiers** (imports +
bouton), **Réglages** (autre main, doigtés, vue, métronome, mains dessinées). En portrait ou sous
700 px : une seule colonne qui défile. Temps joué : compté dans la boucle d'images quand un morceau
tourne (pas en démo), `localStorage` `legato-practice` = { 'AAAA-MM-JJ': secondes }, un jour compte
dans la série à partir d'une minute. Dernier morceau : `legato-last`. L'aide « Brancher le P-145 »
est passée dans le diagnostic. Les cartes « Lecture clé de fa » et « Accords » de la maquette
attendent leurs fonctions.

### v2 (2026-11-06) : ce qui s'ajoute au prototype

- **Deux vues au choix**, mémorisées (`SET.view`, bouton icône dans la barre, réglages du passage
  et de l'accueil) : les notes qui tombent, ou la **partition qui défile** (canvas, comme le reste) :
  grand-portée sur papier ivoire, tête de lecture fixe, espacement proportionnel au temps
  (`SC.ppb`, au moins 6 interlignes par temps, plus si le morceau a des doubles croches), clé,
  armure et chiffrage collés à gauche (les notes passées s'y effacent), barres de mesure et numéros
  au-dessus de la portée, doigtés MD au-dessus de la portée et MG contre les notes, têtes vertes
  (juste) / rouges (faux ou raté) / or (groupe attendu), l'autre main estompée. Clavier en bas dans
  les deux vues. Pas de silences ni de liaisons dessinés (l'espacement montre la durée).
- **Gravure** (`engrave`, une fois par `Player`, sur ses copies de notes, en temps et en degrés) :
  accords par main et attaque, figures depuis la durée (ronde, blanche, noire, croche, double,
  pointées), hampes selon la note la plus éloignée de la ligne du milieu, ligatures par temps (par
  mesure en 3/4, par demi-mesure en 4/4), secondes décalées, altérations accidentelles valables
  jusqu'à la barre, bécarres. Chaque note porte `step` (place sur la portée, Do0 = 0) et `alt`.
- **Armure** : `key` (dièses > 0, bémols < 0) sur chaque morceau ; pour un import, l'armure du
  fichier (méta `0x59`) sinon `guessKey` (celle qui demande le moins d'altérations) ; `spell` épelle
  une hauteur MIDI par la ligne des quintes (Fa♯ plutôt que Sol♭ en Fa majeur). Les imports gardent
  aussi le chiffrage d'origine (`tn` / `td`).
- **Métronome** (`SET.metro`, icône dans la barre) : clic Web Audio accentué sur le 1er temps,
  programmé 250 ms à l'avance sur l'horloge audio (`acAt` passe par `getOutputTimestamp`), calé sur
  le temps du moteur, donc il suit le tempo %. Se tait en pause et pendant une attente (les clics
  déjà programmés sont annulés). Le décompte du mode tempo clique toujours, métronome coupé ou non.
- **Mode démo** (3e mode : Attente, Tempo, Démo ; jamais mémorisé comme mode du morceau) : Legato
  joue les deux mains, sur le piano par la sortie MIDI (MD vélocité 72, MG 56), sinon (ou si
  « le téléphone » est choisi) par le synthé ; les touches s'allument avec le doigté, pas de score
  ni de bilan, boucle possible.
- **Horloge** : les notes jouées par l'appli (autre main, démo) partent 100 ms en avance,
  horodatées (`send` avec horodatage Web MIDI, `synth` avec `acAt`). La boucle d'images ne bride
  plus le pas du moteur qu'au-delà de 250 ms : à 50 ms, le moindre à-coup faisait décrocher le
  métronome de l'horloge. Le mode tempo démarre 0,3 s avant le décompte pour que le 1er clic soit
  programmé à l'avance comme les autres.
- Hors ligne : le worker garde les polices Google (Noto Music dessine les clés) dans `legato-fonts`,
  qui survit aux changements de version.

### Prototype v1 : la base

- `index.html` (fichier unique, vanilla JS, canvas), `sw.js` (cache `legato-v<APP_VERSION>`, ne
  touche qu'à ses caches), `manifest.json` (`id` `/legato/app`), `icons/` (`tools/build_icons.py`).
  Version : `APP_VERSION` en tête du script, une seule source (le worker dérive son cache du `?v=`).
- **MIDI** : `requestMIDIAccess` au chargement, branchement à chaud (`onstatechange`), Active
  Sensing (`0xFE`) et horloge filtrés, pédale CC64. Sortie : l'autre main est envoyée au piano
  (canal 1, vélocité 58) ; garde de 80 ms qui ignore une note reçue juste après l'avoir envoyée
  (au cas où le piano renverrait ce qu'il joue).
- **Jeu** (notes qui tombent) : mode attente (s'arrête sur chaque groupe, accords compris ; une
  note jouée un peu en avance compte), mode tempo (fenêtre -180 / +250 ms, décompte d'une mesure),
  MG / 2 mains / MD, tempo 50 à 100 %, mesures de / à + boucle, doigtés (affichés / changements de
  position / masqués), mains dessinées qui allument les doigts du prochain groupe, écran toujours
  allumé (Wake Lock), plein écran + paysage.
- **Bilan** : justesse, fausses notes, rythme en ms (mode tempo), équilibre des mains par la
  vélocité (2 mains), barres par mesure, « Boucler les mesures faibles » 10 % plus lent. Meilleur
  score par morceau en `localStorage`.
- **Répertoire** : Menuet en sol (16 mesures, deux mains, notes de Mutopia), Ode à la joie, Au
  clair de la lune, gammes de Do, Sol, Ré, Fa majeur. Format des voix : `NOTE:doigt`, `!` =
  changement de position, accords avec `+`, `/durée` en temps reportée sur les notes suivantes.
- **Import MIDI** (format 0/1, statut courant, tempo et mesure du fichier) : mains par piste (la
  plus aiguë = MD), sinon coupure au Do central. Gardé sur l'appareil, sans doigtés.
- **Diagnostic** : entrées / sorties, dernière note, vélocité, pédale, journal, clavier 88 touches,
  « Envoyer un Do au piano ».
- Claviers de secours : touches à l'écran, et l'ordinateur (rangée A W S E D F T G Y H U J K = Do à
  Do, Z / X changent d'octave).

### Testé (2026-11-06, sans piano)

**`tools/test_engine.js`**, à lancer dans la page servie en local (pas en `file://`), console :
`(await import('./tools/test_engine.js?' + Date.now())).run()`. Faux piano MIDI injecté
(`requestMIDIAccess` remplacé, entrée dont on appelle `onmidimessage`, sortie qui enregistre `send`
et son horodatage), moteur piloté à la main, réglages et `localStorage` remis comme avant. **38
contrôles, tous verts en v2** : mode attente MD sur tout le Menuet (64 groupes, une fausse note
voulue, 63 / 64, les 37 notes de MG envoyées au piano), tempo 2 mains à ± 30 ms (101 / 101, ± 14,5
ms, équilibre lu), tempo MD (MG programmée 0 à 100 ms à l'avance), démo (101 notes au piano, ou au
téléphone sans sortie, jeu de l'élève ignoré, pas de bilan, pas mémorisée), métronome (décompte,
un clic par temps, accents en 3/4, pause, changement de tempo, régularité mesurée en temps réel :
±1 ms), gravure (armure, accord, ligatures, blanche pointée, altérations accidentelles et bécarres,
armure devinée, épellation), import d'un MIDI fabriqué (120 bpm, 3/4, 3 bémols, statut courant),
1 236 images dessinées dans les deux vues pour tous les morceaux sans erreur, clés mesurées.
Vérifié aussi à l'œil en 800 x 360 (partition du Menuet, gamme de Fa, démo). **Pas vérifié** : le
vrai P-145 (reconnaissance sur Android, notes envoyées jouées par le piano, son du téléphone par
l'audio USB, latence), le métronome entendu sur le téléphone.

### Maquettes

- `maquettes.html` : 8 écrans à la taille d'un téléphone en paysage (800 x 360, mis à l'échelle),
  dont 2 jouables (notes qui tombent, partition qui défile : mode attente, mains séparées, clic sur
  les touches) et 4 animés. Publiée en Artifact privé :
  https://claude.ai/artifact/1yRbuNLCGjsknsjLJsBRVN (republier = même chemin de fichier).
- Serveur local : entrée `legato` de `.claude/launch.json` (port 8133), ou
  `python -m http.server 8133` dans le dossier.

Écrans : 1 accueil, 2 notes qui tombent, 3 partition qui défile, 4 doigtés expliqués (gamme de Ré
majeur, passage du pouce, repère guitariste « 1 = pouce »), 5 lecture en clé de fa (répétition
espacée), 6 accords envoyés par Harmonic Atlas (ii-V-I en Si♭, voicings sans fondamentale),
7 bilan (justesse, rythme en ms, équilibre des mains par la vélocité), 8 diagnostic MIDI.

## Décisions et faits établis (conversation du 2026-11-06)

- **Web MIDI** : Chrome Android le gère en USB OTG. **iPhone / iPad impossible** (Safari n'a pas
  Web MIDI, bug WebKit 107250 ouvert depuis 2013). HTTPS obligatoire, d'où un déploiement sur
  kkjsf.github.io pour tester sur le téléphone.
- **P-145** : port USB TO HOST, MIDI et audio. Câble USB-C vers USB-B (câble de données, < 3 m).
  Deux bonus à vérifier sur le prototype : le piano doit jouer les notes reçues (accompagnement
  par le piano, sans latence), et le son de l'appli doit sortir par ses haut-parleurs (audio USB).
- **Doigtés = pilier** : affichés dans la note qui tombe, sur la touche, sur la partition (MD
  au-dessus, MG contre les notes) et sur des mains dessinées. Modes : masqués / clavier / partout /
  changements de position seulement. Venus du fichier sinon calculés (coût des positions de main),
  corrigeables par appui long. **Limite à ne pas oublier : le piano ne sait pas quel doigt joue**,
  l'appli montre le doigté mais ne le vérifie pas (pas de score de doigté).
- **Partitions** : rendu maison à espacement proportionnel au temps (défilement continu), pas
  OpenSheetMusicDisplay (curseur note à note seulement). Sources : exercices générés (lecture,
  gammes, accords d'Harmonic Atlas), Mutopia (domaine public / CC BY / CC BY-SA, MIDI calé par
  portée), PDMX (MusicXML domaine public / CC0, filtrer les compositeurs morts depuis 70 ans),
  OpenScore Lieder (CC0) ; ses propres MIDI / MusicXML restent sur le téléphone, jamais dans le
  dépôt public.
- **Octaves** : ne pas afficher de numéro d'octave (Do3 en France = C4 ailleurs) ; nommer par la
  place sur la portée.
- Réutilisable depuis `harmonic-atlas/` : échantillons de piano A0-C8 et `playMidiNote`, détection
  de hauteur de l'accordeur (mode micro monophonique), portée SVG.

## Estimation (2026-11-06)

Prototype : 2 sessions (socle MIDI + diagnostic, moteur de jeu + notes qui tombent). Appli
complète : 7 à 8 sessions (détail par lot dans la section « Ce que ça change à l'estimation » de
`maquettes.html`).

## Pièges

- Volet navigateur masqué : `requestAnimationFrame` ne tourne pas, donc pour tester, piloter le
  moteur à la main (`P.step(1/60)` en boucle) et appeler `draw()`.
- Le navigateur de test refuse Web MIDI : injecter un faux `navigator.requestMIDIAccess` (entrée
  dont on appelle `onmidimessage`, sortie qui enregistre `send`) puis `midiInit()`.
- Les fonctions du script sont globales (`noteOn`, `P`, `MIDI`...), pratique pour les tests.
- Le volet navigateur visible fait tourner la boucle d'images de l'appli : un test qui avance le
  moteur en temps réel (`await`) le ferait avancer deux fois. `test_engine.js` compte les images
  et laisse alors la boucle de l'appli travailler.
- Garde anti-écho de 80 ms (`MIDI.recent`) : en test, les scénarios s'enchaînent en quelques ms,
  une note jouée juste après qu'une autre de même hauteur a été envoyée est ignorée. La vider entre
  deux scénarios.
- Partition : les clés reprennent la solution des maquettes (encre du glyphe mesurée au canvas par
  `measureText`, `measureClefs` relancée quand Noto Music est chargée), dièses / bémols / bécarres
  dessinés en chemins (`drawAcc`). Noto Music n'est que dans la pile `MUSIC_FONT`, jamais dans la
  police de l'interface.
- Corrections de doigté rangées par **indice de note** : retoucher les notes d'un morceau intégré
  (ajout, suppression) décale les corrections gardées sur le téléphone.
- Latence : un appui de test sans `timeStamp` prend `performance.now()` ; le moteur retire `SET.latency`
  de `P.t` (pas l'heure de l'événement), comme avant la v6.
- Les clics du calibrage passent par `beep`, pas `metroClick` : `metroRun` annule tout clic de
  `METRO.nodes` hors d'un morceau en cours.
- Métronome : ne jamais programmer un clic avec un retard négatif (il part tout de suite, en
  retard de la latence de sortie). D'où les 250 ms d'avance et les 0,3 s avant le décompte.

## Pièges des maquettes

- Les clés (Noto Music, Google Fonts) sont placées par mesure de l'encre au canvas
  (`measureText` : `actualBoundingBoxAscent/Descent`), relancée après chargement de la police : le
  glyphe de la police ne suit pas la convention « ligne de base sur la ligne de la clé ».
- Dièses et bémols dessinés en SVG (`sharp()`, `flat()`), pas en caractères : mal placés sinon.
- Ne pas mettre Noto Music dans la pile de la police d'interface : son ♭ déborde dans le texte.
- Le fichier garde `<meta charset>` et `<meta viewport>` pour s'ouvrir correctement en local (le
  serveur Python n'envoie pas de charset).
- Le volet navigateur masqué rend un `file://` à 0 px de large : vérifier via le serveur local.
