/* =========================================================================
   main — point d'entrée : assemble la scène, le suivi des mains et l'interface,
   puis fait tourner la boucle d'animation.
   ========================================================================= */

import './style.css'

import { EarthScene, type SceneQuality } from './earth/earthScene.ts'
import { loadEarthTextures } from './earth/textures.ts'
import { solarAltitude } from './earth/sun.ts'
import { HandTracker, type HandFrame } from './vision/handTracker.ts'
import { GestureFsm, type GestureState } from './vision/gestureFsm.ts'
import { HandControl } from './control/handControl.ts'
import { PointerInput } from './control/pointerInput.ts'
import { OrbitController } from './orbit/orbitController.ts'
import {
  mapKilometersPerPixel,
  viewOfDistance,
  visibleField,
  VIEWS,
  type ViewName,
} from './orbit/celestial.ts'
import { Hud, type LayerName } from './ui/hud.ts'
import { CameraView } from './ui/cameraView.ts'
import { LabelLayer } from './ui/labels.ts'
import { MARVELS, placeById, randomPlace, searchPlaces, type Place } from './data/locations.ts'

const app = document.getElementById('app')
if (!app) throw new Error('Élément #app introuvable.')

/* ------------------------------------------------------------- structure */

const canvas = document.createElement('canvas')
canvas.className = 'scene'
app.append(canvas)

const labels = new LabelLayer(app, (id) => {
  const place = placeById(id)
  if (place) flyToPlace(place)
})

const tracker = new HandTracker({ maxNumHands: 2, modelComplexity: 1 })
const fsm = new GestureFsm()
const handControl = new HandControl()
const orbit = new OrbitController({ initial: { lat: 18, lon: 8, distance: VIEWS.globe.distance } })

const hud = new Hud(app, {
  onStart: () => void startCamera(),
  onStartWithoutCamera: () => {
    hud.hideOverlay()
    hud.toast('Mode souris : cliquez-glissez pour tourner, molette pour zoomer, clic pour viser un lieu.')
  },
  onToggleHands: () => setHandsEnabled(!handsEnabled),
  onRandom: () => flyToPlace(randomPlace([currentPlace?.id ?? ''])),
  onResetView: () => {
    orbit.reset()
    setView('globe')
  },
  onPlace: (place) => flyToPlace(place),
  onSearch: (query) => {
    const [first] = searchPlaces(query)
    if (first) flyToPlace(first)
    else hud.toast(`Aucun lieu ne correspond à « ${query} ».`, 'error')
  },
  onQuality: (quality) => scene?.setQuality(quality),
  onSensitivity: (value) => {
    handControl.rotationGain = value
  },
  onToggleLayer: (layer, value) => applyLayer(layer, value),
  onNightLights: (value) => scene?.setNightLights(value),
  onCameraVisible: (value) => camera.setVisible(value),
  onToggleSettings: () => {
    settingsVisible = !settingsVisible
    hud.setSettingsVisible(settingsVisible)
  },
})

const camera = new CameraView(hud.cameraSlot)
let scene: EarthScene | null = null

/* ------------------------------------------------------------------ état */

let handsEnabled = true
let settingsVisible = false
let currentPlace: Place | null = null
let currentView: ViewName = 'globe'
let cameraStream: MediaStream | null = null
let cameraRunning = false
let cameraStartedAt = 0
let noHandHintShown = false
let targetFov: number = VIEWS.globe.fov
let currentFov: number = VIEWS.globe.fov
let lastSunUpdate = 0
let lastFrameTime = performance.now()
let smoothedFps = 60
let qualityChecks = 0
let qualityLevel: SceneQuality = 'moyenne'
let ready = false

/* ------------------------------------------------------- entrée pointeur */

new PointerInput(canvas, {
  onRotate: (dx, dy) => {
    const span = visibleSpanDegreesForHand()
    const aspect = canvas.clientHeight || 1
    const scale = span / Math.max(aspect, 1)
    orbit.rotateBy(dy * scale * 0.55, (-dx * scale * 0.55) / Math.max(Math.cos((orbit.target.lat * Math.PI) / 180), 0.25))
  },
  onZoom: (factor) => orbit.zoomBy(factor),
  onTap: (ndcX, ndcY) => {
    if (!scene) return
    const hit = scene.pick(ndcX, ndcY)
    if (!hit) return
    orbit.flyTo(hit.lat, hit.lon, flightOptions(currentView))
    currentPlace = null
  },
})

function visibleSpanDegreesForHand(): number {
  const distance = orbit.target.distance
  return (2 * Math.acos(1 / Math.max(distance, 1.001)) * 180) / Math.PI
}

/* ------------------------------------------------------------ raccourcis */

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return
  const step = event.shiftKey ? 12 : 4
  switch (event.key.toLowerCase()) {
    case ' ':
      event.preventDefault()
      setHandsEnabled(!handsEnabled)
      break
    case 'r':
      orbit.reset()
      setView('globe')
      break
    case 'n':
      nextView()
      break
    case 'h':
      settingsVisible = !settingsVisible
      hud.setSettingsVisible(settingsVisible)
      break
    case 'q':
      orbit.rollBy(-step)
      break
    case 'e':
      orbit.rollBy(step)
      break
    case 'arrowup':
      orbit.rotateBy(step, 0)
      break
    case 'arrowdown':
      orbit.rotateBy(-step, 0)
      break
    case 'arrowleft':
      orbit.rotateBy(0, step)
      break
    case 'arrowright':
      orbit.rotateBy(0, -step)
      break
    case '+':
    case '=':
      orbit.zoomBy(0.9)
      break
    case '-':
      orbit.zoomBy(1.1)
      break
    default:
      return
  }
})

/* ------------------------------------------------------------ caméra */

async function startCamera(): Promise<void> {
  const startButton = document.querySelector<HTMLButtonElement>('#btn-start')
  if (startButton) startButton.disabled = true
  hud.showStatus('Ouverture de la caméra…')

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Ce navigateur (ou cet aperçu) ne donne pas accès à la caméra. Ouvrez la page dans un onglet normal, en HTTPS.',
      )
    }
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 60 } },
      audio: false,
    })
    cameraRunning = true
    cameraStartedAt = performance.now()
    noHandHintShown = false
    await camera.attach(cameraStream)
    hud.hideOverlay()
    hud.showStatus('Chargement du modèle de suivi des mains…')

    await tracker.initialize()
    hud.hideStatus()
    hud.toast('Suivi actif : pincez pouce et index, puis déplacez la main pour faire tourner la Terre.')
  } catch (error) {
    const message = explainCameraError(error)
    hud.hideStatus()
    hud.hideOverlay()
    hud.toast(message, 'error', 12000)
    if (startButton) startButton.disabled = false
  }
}

function explainCameraError(error: unknown): string {
  const name = (error as { name?: string })?.name ?? ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Accès à la caméra refusé. Autorisez la caméra pour ce site (icône dans la barre d’adresse), puis rechargez la page. Dans un aperçu en cadre restreint, ouvrez plutôt la page dans un onglet.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'Aucune caméra trouvée. Branchez une webcam (ou utilisez la caméra arrière du téléphone) puis réessayez.'
    case 'NotReadableError':
      return 'La caméra est déjà utilisée par une autre application. Fermez-la et réessayez.'
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Impossible d’accéder à la caméra. Vous pouvez explorer le globe à la souris.'
  }
}

/* ------------------------------------------------------- aides de commande */

function setHandsEnabled(enabled: boolean): void {
  handsEnabled = enabled
  if (!enabled) {
    fsm.reset()
    handControl.reset()
    hud.setAim(null)
  }
  hud.update({ handsEnabled: enabled, gesture: fsm.current })
}

function applyLayer(layer: LayerName, value: boolean): void {
  if (!scene) return
  switch (layer) {
    case 'clouds':
      scene.setClouds(value)
      break
    case 'atmosphere':
      scene.setAtmosphere(value)
      break
    case 'stars':
      scene.setStars(value)
      break
    case 'moon':
      scene.setMoonVisible(value)
      break
    case 'bloom':
      scene.setBloom(value)
      break
  }
}

function flightOptions(view: ViewName) {
  return { distance: VIEWS[view].distance, fov: VIEWS[view].fov }
}

function setView(view: ViewName): void {
  currentView = view
  targetFov = VIEWS[view].fov
  orbit.setDistance(VIEWS[view].distance)
  if (scene) scene.setDistance(orbit.target.distance)
}

function nextView(): void {
  const order: ViewName[] = ['globe', 'hemisphere', 'region', 'close']
  const index = order.indexOf(currentView)
  const next = order[(index + 1) % order.length]
  setView(next)
  hud.toast(`Cadrage : ${VIEWS[next].label}`)
}

function flyToPlace(place: Place): void {
  currentPlace = place
  currentView = place.view
  targetFov = VIEWS[place.view].fov
  orbit.flyTo(place.lat, place.lon, { distance: VIEWS[place.view].distance })
  hud.setSearchValue(place.name)
  scene?.setMarkerActive(place.id, true)
  for (const marvel of MARVELS) if (marvel.id !== place.id) scene?.setMarkerActive(marvel.id, false)
  if (scene) hud.toast(`${place.name} — ${place.country} : ${place.note}`, 'info', 8000)
}

/* -------------------------------------------------------- boucle principale */

function frame(now: number): void {
  const dtRaw = (now - lastFrameTime) / 1000
  lastFrameTime = now
  const dt = Math.min(0.05, Math.max(0.001, dtRaw))
  smoothedFps = smoothedFps * 0.92 + (1 / dt) * 0.08

  // Le suivi des mains démarre avant même que les cartes soient chargées.
  if (cameraRunning && handsEnabled) tracker.send(camera.video)
  const hands = tracker.getHands(now)
  const gesture = handsEnabled ? fsm.update(now, hands) : fsm.current

  if (
    cameraRunning &&
    handsEnabled &&
    tracker.currentStatus === 'ready' &&
    hands.length === 0 &&
    !noHandHintShown &&
    now - cameraStartedAt > 2500
  ) {
    noHandHintShown = true
    hud.toast('Le suivi est prêt, mais ne détecte pas encore de main. Placez la main entière au centre, paume vers la caméra et dans une bonne lumière.', 'info', 9000)
  }

  if (!ready || !scene) {
    camera.draw(hands, (id) => fsm.roleOf(id), now)
    requestAnimationFrame(frame)
    return
  }

  {
    const control = handsEnabled
      ? handControl.update(gesture, hands, dt, { lat: orbit.target.lat, distance: orbit.target.distance })
      : null

    if (control) {
      if (control.rotate) orbit.rotateBy(control.rotate.dLat, control.rotate.dLon)
      if (control.zoom) orbit.zoomBy(control.zoom)
      if (control.roll) orbit.rollBy(control.roll)
      if (control.aim) hud.setAim(control.aim)
      else if (gesture.mode !== 'point') hud.setAim(null)

      if (control.click && control.aim) {
        const hit = scene.pickOrClosest(control.aim.x, control.aim.y)
        orbit.flyTo(hit.lat, hit.lon, flightOptions('region'))
        currentView = 'region'
        targetFov = VIEWS.region.fov
        currentPlace = null
        hud.toast(`Cap sur ${formatPoint(hit.lat, hit.lon)}`)
      }
    }

    // Lissage du champ de vision (le zoom au clic change aussi le cadrage).
    if (Math.abs(targetFov - currentFov) > 0.01) {
      currentFov += (targetFov - currentFov) * (1 - Math.exp(-dt / 0.25))
      scene.setFov(currentFov)
    }

    orbit.update(dt, now)
    const pose = orbit.pose
    scene.setOrientation(pose.lat, pose.lon, orbit.roll)
    scene.setDistance(pose.distance)

    // Le Soleil bouge lentement : une mise à jour toutes les deux secondes suffit.
    if (now - lastSunUpdate > 2000) {
      lastSunUpdate = now
      scene.setSun(new Date())
    }

    // Étiquettes des merveilles visibles.
    if (hud) updateLabels(pose.lat, pose.lon)

    // Aperçu caméra (squelette) et état du suivi.
    camera.draw(hands, (id) => fsm.roleOf(id), now)
    camera.setDimmed(gesture.mode !== 'idle' && hands.length > 0)
    camera.setStatus(
      tracker.currentStatus === 'ready'
        ? hands.length === 0
          ? 'aucune main'
          : `${hands.length} main${hands.length > 1 ? 's' : ''} · ${tracker.fps} i/s`
        : tracker.currentStatus === 'loading'
          ? 'chargement…'
          : tracker.currentStatus === 'error'
            ? 'erreur'
            : 'en attente',
    )

    updateHud(pose.lat, pose.lon, pose.distance, hands, gesture)

    scene.render(dt)
    autoQuality()
  }

  requestAnimationFrame(frame)
}

let lastLabelUpdate = 0

function updateLabels(lat: number, lon: number): void {
  if (!scene) return
  const now = performance.now()
  if (now - lastLabelUpdate < 60) return
  lastLabelUpdate = now

  const targets = MARVELS.map((place) => {
    const projected = scene!.project(place.lat, place.lon, 1.01)
    // Visible seulement si le point est de notre côté du globe.
    const facing = isFacing(place.lat, place.lon, lat, lon)
    scene!.setMarkerVisible(place.id, facing)
    return {
      id: place.id,
      name: place.name,
      x: projected.x,
      y: projected.y,
      visible: facing && projected.visible && projected.x > 24 && projected.x < scene!.renderer.domElement.clientWidth - 60,
      active: currentPlace?.id === place.id,
    }
  })
  labels.update(targets)
  labels.prune(new Set(MARVELS.map((place) => place.id)))
}

/** Le lieu est-il sur la face visible du globe (et pas au-delà du limbe) ? */
function isFacing(latA: number, lonA: number, latB: number, lonB: number): boolean {
  const toRad = Math.PI / 180
  const cos =
    Math.sin(latA * toRad) * Math.sin(latB * toRad) +
    Math.cos(latA * toRad) * Math.cos(latB * toRad) * Math.cos((lonA - lonB) * toRad)
  return cos > 0.1
}

let lastHudUpdate = 0

function updateHud(
  lat: number,
  lon: number,
  distance: number,
  hands: HandFrame[],
  gesture: GestureState,
): void {
  if (!scene) return
  const now = performance.now()
  if (now - lastHudUpdate < 200) return
  lastHudUpdate = now

  const view = viewOfDistance(distance)
  const field = visibleField(distance, currentFov, (canvas.clientWidth || 16) / (canvas.clientHeight || 9))
  const moon = scene.getMoon()
  const sunAltitude = solarAltitude(lat, lon, new Date())

  hud.update({
    trackerStatus: tracker.currentStatus,
    fps: tracker.fps || smoothedFps,
    hands,
    gesture,
    handsEnabled,
    cameraOn: cameraRunning,
    stats: scene.stats(),
    info: {
      place: currentPlace,
      lat,
      lon,
      altitudeKm: Math.max(0, (distance - 1) * 6371),
      fieldWidthKm: field.widthKm,
      mapKmPerPixel: mapKilometersPerPixel(lat),
      sunAltitude,
      isDay: sunAltitude > 0,
      moonPhase: moon?.phase ?? 0,
      moonPhaseName: moon?.phaseName ?? '—',
      viewLabel: VIEWS[view].label,
    },
  })
}

function formatPoint(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'O'
  return `${Math.abs(lat).toFixed(1)}° ${ns}, ${Math.abs(lon).toFixed(1)}° ${ew}`
}

/** Baisse automatiquement la qualité si la machine n'arrive pas à suivre. */
function autoQuality(): void {
  if (qualityChecks >= 2 || !scene) return
  if (smoothedFps > 26) return
  qualityChecks++
  const next: SceneQuality = qualityLevel === 'haute' ? 'moyenne' : 'basse'
  qualityLevel = next
  scene.setQuality(next)
  hud.toast(
    `Rendu allégé automatiquement (${Math.round(smoothedFps)} i/s). Vous pouvez forcer la qualité dans les réglages.`,
    'info',
    7000,
  )
}

/* ------------------------------------------------------------ démarrage */

hud.showStatus('Chargement des cartes de la Terre…')

loadEarthTextures({
  quality: 'moyenne',
  onProgress: (loaded, total) => hud.showStatus(`Chargement des cartes de la Terre… ${loaded}/${total}`),
})
  .then((textures) => {
    try {
      scene = new EarthScene(canvas, textures, { quality: qualityLevel, bloom: true, nightLights: 1.1 })
    } catch (error) {
      throw new Error(
        `Rendu 3D impossible (WebGL indisponible ou désactivé). ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
    scene.setDistance(orbit.pose.distance)
    scene.setFov(currentFov)
    scene.setOrientation(orbit.pose.lat, orbit.pose.lon, 0)
    scene.setSun(new Date())
    for (const marvel of MARVELS) scene.addMarker(marvel.id, marvel.lat, marvel.lon, 0x4fd1c5)

    const resize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      scene?.resize(width, height)
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('orientationchange', () => window.setTimeout(resize, 250))

    hud.hideStatus()
    hud.update({ handsEnabled, gesture: fsm.current })
    ready = true
    hud.toast('Cartes NASA chargées : 4 096 × 2 048 pixels (environ 10 km par pixel au sol).', 'info', 7000)
  })
  .catch((error: unknown) => {
    hud.hideStatus()
    const message = error instanceof Error ? error.message : String(error)
    hud.toast(`Impossible de charger les cartes de la Terre. ${message}`, 'error', 15000)
  })

tracker.onStatus((status) => {
  hud.update({ trackerStatus: status })
  if (status === 'error' && tracker.error) {
    hud.toast(`Suivi des mains indisponible : ${tracker.error}. Le reste de l'application fonctionne.`, 'error', 12000)
  }
})

window.addEventListener('beforeunload', () => {
  for (const track of cameraStream?.getTracks() ?? []) track.stop()
  tracker.close()
})

requestAnimationFrame(frame)
