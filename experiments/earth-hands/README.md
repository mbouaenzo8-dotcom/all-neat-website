# Terre 3D pilotée aux mains — `experiments/earth-hands`

Une simulation 3D de la Terre, en temps réel, **pilotée par les gestes de la main devant la webcam**.
Tout tourne dans le navigateur : pas de serveur d'inférence, aucune image transmise, aucun compte à créer.

> Ce dossier est une **expérience à part**, indépendante du site All Neat Cleaning Services.
> Elle n'est pas incluse dans le build du site (`npm run build` à la racine l'ignore).

```bash
cd experiments/earth-hands
npm install
npm run dev      # puis http://localhost:5199 (ou le port affiché)
```

| Commande           | Rôle                                                       |
| ------------------ | ---------------------------------------------------------- |
| `npm run dev`      | serveur de développement                                    |
| `npm run build`    | vérification des types (`tsc -b`) puis build dans `dist/`   |
| `npm test`         | 56 tests (gestes, astronomie, vols, interface, données, assets) |
| `npm run preview`  | sert le build de production                                 |

---

## 1. Les gestes

| Geste | Effet |
| --- | --- |
| 🤏 **Pincement** (pouce + index) puis déplacement | Faire tourner le globe : la Terre suit votre main |
| ✊ **Poing fermé** puis déplacement | Identique — et rapprocher/éloigner la main **zoome** |
| 👐 **Deux mains pincées**, écartées/rapprochées | Zoom (distance inter-mains) |
| 👐 **Deux mains tournées** | Inclinaison (roulis) de la caméra |
| ☝️ **Index tendu**, autres doigts repliés | Viseur : un réticule apparaît au bout du doigt |
| ☝️🤏 **Pincer pendant la visée** | Clic : la caméra vole vers le point visé |
| ✋ **Main ouverte** près du centre | Joystick : l'écart au centre impose la vitesse de rotation |

Souris et clavier fonctionnent toujours, en secours ou en complément :
glisser pour tourner, molette pour zoomer, clic pour viser un lieu,
`Espace` (couper les mains), `R` (recentrer), `N` (cadrage suivant),
`Q`/`E` (roulis), `H` (réglages), flèches, `+`/`-`.

La sensibilité des gestes se règle dans **Réglages** (30 % → 220 %).

## 2. Ce que l'on voit (et pourquoi c'est honnête)

- **Carte du jour / carte de nuit** : images NASA (Blue Marble et « Black Marble »),
  reprises du dépôt `mrdoob/three.js` (voir `THIRD-PARTY.md`).
- **Terminateur jour/nuit réel** : la position du Soleil est calculée pour l'instant présent
  (déclinaison solaire + équation du temps), les lumières des villes ne s'allument que du côté nuit.
- **Nuages**, **relief** (carte de normales), **reflets sur les océans** (carte spéculaire océan/terre),
  **halo d'atmosphère**, **étoiles**.
- **Lune** : position et phase calculées (éphémérides simplifiées de Meeus).
  Sa taille et sa distance sont en revanche **volontairement exagérées** (sinon : un point).
- **Interface** : altitude de la caméra, largeur du champ couvert, hauteur du Soleil et phase lunaire
  au lieu visé, cadrage courant, nombre d'appels de rendu.

Limite assumée : la carte fait **4 096 × 2 048 pixels**, soit environ **10 km par pixel** au sol.
À la vue la plus rapprochée, on couvre ~2 000 km de large : une ville n'y fait que quelques pixels.
C'est une simulation de **planète**, pas de quartier — l'interface affiche cette résolution en clair.

## 3. Architecture

```
src/
  main.ts              boucle d'animation, collage scène ↔ gestes ↔ interface, raccourcis
  style.css            thème sombre, HUD, widget caméra, étiquettes
  earth/
    textures.ts        chargement des cartes locales (public/textures)
    sun.ts             point subsolaire, déclinaison, altitude du Soleil   (pur)
    moon.ts            position et phase de la Lune                        (pur)
    earthScene.ts      scène three.js : Terre, nuages, atmosphère, étoiles, Lune, repères, bloom
  orbit/
    celestial.ts       cadrages, distances, champ visible, détail de la carte (pur)
    orientation.ts     rotation du globe pour amener un lieu face caméra      (pur)
    orbitController.ts cible ↔ état affiché, vols animés, roulis              (pur)
  vision/
    landmarks.ts       géométrie de la main : pincement, ouverture, repère paume (pur)
    oneEuro.ts         filtre 1€ (lissage fort à l'arrêt, faible en mouvement)  (pur)
    gestureFsm.ts      machine à états des gestes                              (pur)
    handTracker.ts     MediaPipe Hands : 21 points par main, identité stable, anti-clignotement
    testHands.ts       mains synthétiques pour les tests
  control/
    handControl.ts     gestes → commandes de caméra (différentiel, sans saut)   (pur)
    pointerInput.ts    souris, molette, pincement à deux doigts
  ui/
    hud.ts             interface complète (chips, réglages, fiche du lieu, messages)
    cameraView.ts      aperçu caméra + squelette lumineux des mains
    labels.ts          étiquettes HTML projetées sur les lieux
  data/locations.ts    30 merveilles + 50 villes, recherche par mots-clés
public/
  textures/            cartes NASA (jour, nuit, spéculaire, normales, nuages, Lune, ciel étoilé)
  hands/               moteur MediaPipe Hands, modèles de main, graphe et wasm, servis en local
```

Principes :

1. **La caméra ne bouge pas, le globe tourne.** La caméra reste sur l'axe `+x` ; c'est le globe qui
   s'oriente pour amener le lieu visé face à elle (`orientation.ts`). Pousser le globe est alors direct,
   et l'axe des pôles s'incline naturellement quand on regarde une haute latitude.
2. **Le pilotage est différentiel.** La référence est prise au moment où la prise commence :
   une main qui entre dans le champ ne fait jamais sauter la vue (`handControl.ts`).
3. **Les seuils de gestes sont des fonctions pures**, testées sans navigateur (`gestureFsm.ts`),
   avec hystérésis (accroche à 0,60 / relâche à 0,34 pour le pincement) et délai de grâce.
4. **Le rendu passe par `RenderPass → UnrealBloomPass → OutputPass`.** L'`OutputPass` est
   indispensable : three.js n'applique le tone mapping que pour un rendu direct à l'écran, donc
   dans une chaîne de passes c'est lui qui s'en charge — une seule fois, à la fin.
5. **Qualité adaptative** : si la machine descend sous 26 i/s, le rendu s'allège tout seul
   (puis se règle à la main dans Réglages : automatique / haute / moyenne / basse).

## 4. Confidentialité

- La vidéo ne quitte jamais l'appareil : elle est lue par un `<video>` local, analysée par un
  modèle exécuté dans le même onglet, puis oubliée.
- Le modèle MediaPipe (wasm + graphe) est servi **depuis ce site** (`public/hands/`), pas depuis un CDN.
- Aucune analyse d'audience, aucun cookie, aucun appel réseau après le chargement.

## 5. Tests

```bash
npm test
```

56 tests, sans navigateur ni carte graphique (`node --test` + `jsdom`), couvrant :

- la géométrie des mains (pincement, ouverture, extension maximale, miroir) ;
- la machine à états : prise, relâchement, poing, visée, clic, zoom à deux mains, grâce anti-scintillement ;
- l'astronomie : déclinaison solaire aux solstices, point subsolaire, jour/nuit, phase de la Lune,
  et un contrôle croisé (point subsolaire ↔ écliptique + heure sidérale) à moins de 0,6° ;
- l'orientation du globe (le lieu visé passe exactement face caméra, déterminant +1 — pas de miroir) ;
- les vols (arrivée au bon endroit, surélévation à mi-parcours, bornes de zoom) ;
- l'interface dans un DOM simulé (chips, fiche, curseurs, étiquettes, viseur, squelette caméra) ;
- les données de lieux (unicité, bornes géographiques, recherche sans accents) ;
- la présence des modèles MediaPipe, du graphe et des deux variantes wasm.

## 6. Limites connues

- **Caméra dans une iframe restreinte** : si l'aperçu en ligne bloque `getUserMedia`,
  l'application l'explique et propose d'ouvrir la page dans un onglet ; tout le reste
  (souris, clavier, recherche de lieux) continue de fonctionner.
- **Premier chargement du suivi** : les modèles TFLite et les moteurs WebAssembly SIMD / standard
  sont embarqués localement. Le téléchargement initial est donc plus lourd, puis les fichiers
  restent en cache dans le navigateur.
- **Pas de rendu hors écran** : la 3D n'est pas testable en Node (pas de carte graphique) ;
  les tests couvrent la logique, les données et le DOM.

## 7. Pistes (non faites)

- Nuages animés (défilement lent) ; ombre portée de la Lune lors des éclipses.
- Relief réel par déplacement de sommets (une carte d'élévation de 2 km/px).
- Recherche vocale (« va à Paris ») via `SpeechRecognition`.
- Vue « rue » : impossible avec cette carte — il faudrait un service de tuiles, donc du réseau.
