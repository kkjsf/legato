# Legato - appli de piano

## Quoi

Projet d'une PWA de piano « à la Simply Piano » **pour Simon**, adulte qui connaît la théorie et
vient de la guitare (son point faible déclaré : savoir quel doigté mettre au piano). Nom :
« Legato » (choisi par Simon le 2026-11-06, à la place de « Déchiffre »). Un projet original, pas un clone : nom, look et cours sont à lui.

Matériel cible (confirmé par Simon le 2026-11-06) : **Yamaha P-145** branché en USB sur son
**téléphone Android**, téléphone posé en paysage sur le pupitre.

## Statut

**Prototype v1 en ligne (2026-11-06)** : https://kkjsf.github.io/legato/, dépôt public
`git@github.com:kkjsf/legato.git` (`7af8a49` v1, `a0bfb8c` palette de Harmonic Atlas : or = main
droite, violet = main gauche, crème des touches, titre en Playfair Display). Pages sur `main`,
racine. `maquettes.html` est exclu par `.gitignore` (ne pas le publier). Vérifié en ligne : page,
manifeste, worker (cache `legato-v1`), icônes. **Pas encore essayé avec le vrai P-145.** Le lien avec
Harmonic Atlas est mis de côté à la demande de Simon. Livraison : bumper `APP_VERSION` (le worker
en dérive son cache), commit, push.

### Prototype v1 : ce qu'il y a

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

Avec un faux `requestMIDIAccess` injecté dans la page : mode attente sur tout le Menuet main
droite (64 groupes, une fausse note voulue, 98 %, les 37 notes de main gauche envoyées à la
sortie), mode tempo 2 mains (100 / 101, rythme ± 32 ms « plutôt en retard », équilibre MG 90 / MD
65), import d'un MIDI fabriqué (120 bpm, 3/4, statut courant, mains par piste), diagnostic, clic
sur les touches, rendu en 800 x 360. **Pas vérifié** : le vrai P-145 (reconnaissance sur Android,
notes envoyées jouées par le piano, son du téléphone par l'audio USB, latence).

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

## Pièges des maquettes

- Les clés (Noto Music, Google Fonts) sont placées par mesure de l'encre au canvas
  (`measureText` : `actualBoundingBoxAscent/Descent`), relancée après chargement de la police : le
  glyphe de la police ne suit pas la convention « ligne de base sur la ligne de la clé ».
- Dièses et bémols dessinés en SVG (`sharp()`, `flat()`), pas en caractères : mal placés sinon.
- Ne pas mettre Noto Music dans la pile de la police d'interface : son ♭ déborde dans le texte.
- Le fichier garde `<meta charset>` et `<meta viewport>` pour s'ouvrir correctement en local (le
  serveur Python n'envoie pas de charset).
- Le volet navigateur masqué rend un `file://` à 0 px de large : vérifier via le serveur local.
