# Contenus et bibliothèques tiers — `experiments/earth-hands`

Tout est servi **depuis ce dossier** : rien n'est chargé depuis un CDN à l'exécution.
Les fichiers sont conservés tels quels, avec leurs licences d'origine.

## Bibliothèques

| Paquet | Version | Licence | Usage |
| --- | --- | --- | --- |
| [`three`](https://github.com/mrdoob/three.js) | 0.183.2 | MIT | rendu 3D, post-traitement (EffectComposer, UnrealBloomPass, OutputPass) |
| [`@mediapipe/hands`](https://www.npmjs.com/package/@mediapipe/hands) | 0.4.1675469240 | Apache-2.0 | détection des 21 points de chaque main |

Le texte de la licence MIT de three.js est fourni par le paquet (`node_modules/three/LICENSE`) ;
la licence Apache-2.0 de MediaPipe est indiquée dans son `package.json`
(`node_modules/@mediapipe/hands/package.json`) et disponible sur
<https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE>.

## Moteur de suivi embarqué (`public/hands/`)

Copie du paquet npm `@mediapipe/hands` (Apache-2.0) : graphe `hands.binarypb`,
runtime WebAssembly SIMD et standard, modèles TFLite de main (`hand_landmark_full.tflite`
et `hand_landmark_lite.tflite`), données du modèle de paume (`hands_solution_packed_assets.data`
+ chargeur), et définitions de types (`index.d.ts`).
Ces fichiers sont chargés localement par la page, via `locateFile`.

## Cartes de la Terre (`public/textures/`)

| Fichier | Source | Origine des données |
| --- | --- | --- |
| `earth_day_4096.jpg` | `mrdoob/three.js` → `examples/textures/planets/` (MIT pour le dépôt) | NASA « Blue Marble » |
| `earth_night_4096.jpg` | idem | NASA « Black Marble » (lumières nocturnes) |
| `earth_specular_2048.jpg` | idem | masque océan / terre |
| `earth_normal_2048.jpg` | idem | carte de relief (normales) |
| `earth_clouds_1024.png` | idem | couverture nuageuse avec canal alpha |
| `moon_1024.jpg` | idem | LRO / NASA |
| `night-sky.png` | `vasturiano/three-globe` → `example/img/` (MIT pour le dépôt) | ciel étoilé |

Les images d'origine de la NASA sont dans le domaine public
(<https://earthobservatory.nasa.gov/features/BlueMarble>, <https://earthobservatory.nasa.gov/features/NightLights>).
Elles ont été reprises depuis les dépôts cités (praticité, formats prêts à l'emploi), pas depuis les sites NASA.

## Polices

Aucune : l'application utilise uniquement les polices système
(`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`).

## Données astronomiques

Aucune donnée externe : les positions du Soleil et de la Lune sont calculées à l'exécution
à partir d'algorithmes classiques (éléments moyens de Meeus, déclinaison solaire et équation du temps).
Les lieux (`src/data/locations.ts`) sont des coordonnées géographiques de référence,
saisies à la main et arrondies au centième de degré (≈ 1 km).
