/* =========================================================================
   Tests de l'interface dans un DOM simulé (jsdom).

   La 3D ne peut pas être testée sans carte graphique, mais tout le DOM, lui,
   peut l'être : c'est là que se cachent les erreurs du type « élément
   introuvable » ou « pastille effacée par une mise à jour ».
   ========================================================================= */

import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

import { handFromPose, pinchPair } from '../vision/testHands.ts'
import { GestureFsm } from '../vision/gestureFsm.ts'
import type { HudHandlers } from './hud.ts'

/* --------------------------------------------------------------- outils DOM */

interface DomEnvironment {
  window: JSDOM['window']
  document: Document
  app: HTMLElement
  /** Journal des appels de dessin sur les canvas. */
  calls: string[]
}

function setupDom(): DomEnvironment {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
  })
  const { window } = dom
  const calls: string[] = []

  const context = {
    clearRect: (...args: number[]) => calls.push(`clearRect:${args.join(',')}`),
    save: () => calls.push('save'),
    restore: () => calls.push('restore'),
    beginPath: () => calls.push('beginPath'),
    moveTo: () => calls.push('moveTo'),
    lineTo: () => calls.push('lineTo'),
    stroke: () => calls.push('stroke'),
    fill: () => calls.push('fill'),
    arc: () => calls.push('arc'),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    lineCap: '',
    shadowColor: '',
    shadowBlur: 0,
    globalAlpha: 1,
  }

  window.HTMLCanvasElement.prototype.getContext = (() => context) as never
  window.HTMLMediaElement.prototype.play = (() => Promise.resolve()) as never

  const globals = globalThis as unknown as Record<string, unknown>
  globals.window = window
  globals.document = window.document

  return {
    window,
    document: window.document as unknown as Document,
    app: window.document.getElementById('app') as unknown as HTMLElement,
    calls,
  }
}

function makeHandlers(): HudHandlers & { log: string[] } {
  const log: string[] = []
  return {
    log,
    onStart: () => log.push('start'),
    onStartWithoutCamera: () => log.push('skip'),
    onToggleHands: () => log.push('hands'),
    onRandom: () => log.push('random'),
    onResetView: () => log.push('reset'),
    onPlace: (place) => log.push(`place:${place.id}`),
    onSearch: (query) => log.push(`search:${query}`),
    onQuality: (quality) => log.push(`quality:${quality}`),
    onSensitivity: (value) => log.push(`sensitivity:${value}`),
    onToggleLayer: (layer, value) => log.push(`layer:${layer}:${value}`),
    onNightLights: (value) => log.push(`lights:${value.toFixed(2)}`),
    onCameraVisible: (value) => log.push(`camera:${value}`),
    onToggleSettings: () => log.push('settings'),
  }
}

/* ------------------------------------------------------------------- tests */

test('l\'interface se construit et se met à jour sans perdre ses pastilles', async () => {
  const env = setupDom()
  const { Hud } = await import('./hud.ts')
  const handlers = makeHandlers()
  const hud = new Hud(env.app, handlers)

  // Tous les éléments du gabarit sont là (must() aurait levé une exception).
  assert.ok(env.app.querySelector('#chip-camera'))
  assert.ok(env.app.querySelector('#start-overlay'))
  assert.ok(env.app.querySelector('#place-card'))

  const fsm = new GestureFsm()
  const [left, right] = pinchPair(0.4)
  const gesture = fsm.update(0, [left, right])
  assert.equal(gesture.mode, 'zoom')

  hud.update({
    trackerStatus: 'ready',
    fps: 31.6,
    hands: [left, right],
    gesture,
    handsEnabled: true,
    stats: { drawCalls: 12, triangles: 45000, programs: 4 },
    info: {
      place: null,
      lat: 48.85,
      lon: 2.35,
      altitudeKm: 11150,
      fieldWidthKm: 14350,
      mapKmPerPixel: 9.8,
      sunAltitude: 12.4,
      isDay: true,
      moonPhase: 0.5,
      moonPhaseName: 'pleine Lune',
      viewLabel: 'Globe entier',
    },
  })

  const label = env.app.querySelector('#chip-camera .chip-label')
  assert.equal(label?.textContent, 'suivi actif')
  assert.ok(env.app.querySelector('#chip-camera .dot'), 'la pastille du chip doit survivre')
  assert.equal(env.app.querySelector('#chip-hands .chip-label')?.textContent, '2 mains')
  assert.equal(env.app.querySelector('#chip-gesture .chip-label')?.textContent, 'zoom')
  assert.equal(env.app.querySelector('#chip-fps .chip-label')?.textContent, '32 i/s')
  assert.equal(env.app.querySelector('#chip-camera')?.getAttribute('data-state'), 'live')

  // Les statistiques de la fiche sont renseignées.
  const stats = env.app.querySelector('#stats-grid')
  assert.ok(stats && stats.children.length >= 12, 'la grille de statistiques doit être remplie')
  assert.match(stats.textContent ?? '', /48\.85° N/)
  assert.match(stats.textContent ?? '', /9\.8 km\/pixel/)
})

test('la fiche du lieu affiche le lieu choisi et son texte', async () => {
  const env = setupDom()
  const { Hud } = await import('./hud.ts')
  const hud = new Hud(env.app, makeHandlers())

  const place = {
    id: 'tour-eiffel',
    name: 'Tour Eiffel',
    country: 'France',
    lat: 48.86,
    lon: 2.29,
    view: 'close' as const,
    note: '330 m de haut, achevée en 1889.',
    keywords: [],
    marvel: true,
  }

  hud.update({
    info: {
      place,
      lat: place.lat,
      lon: place.lon,
      altitudeKm: 1019,
      fieldWidthKm: 2047,
      mapKmPerPixel: 12.4,
      sunAltitude: -3.2,
      isDay: false,
      moonPhase: 0.12,
      moonPhaseName: 'premier croissant',
      viewLabel: 'Vue rapprochée',
    },
  })

  assert.equal(env.app.querySelector('#place-name')?.textContent, 'Tour Eiffel')
  const country = env.app.querySelector('#place-country')?.textContent ?? ''
  assert.match(country, /France — 330 m de haut, achevée en 1889\./)
})

test('les commandes de l\'interface déclenchent les bons rappels', async () => {
  const env = setupDom()
  const { Hud } = await import('./hud.ts')
  const handlers = makeHandlers()
  const hud = new Hud(env.app, handlers)

  env.app.querySelector<HTMLElement>('#btn-random')?.click()
  env.app.querySelector<HTMLElement>('#btn-reset')?.click()
  env.app.querySelector<HTMLElement>('#btn-settings')?.click()
  env.app.querySelector<HTMLElement>('#btn-hands')?.click()
  env.app.querySelector<HTMLElement>('#btn-start')?.click()

  assert.deepEqual(handlers.log, ['random', 'reset', 'settings', 'hands', 'start'])

  // Sensibilité : le curseur est en pourcentage, le rappel reçoit un facteur.
  const sensitivity = env.app.querySelector<HTMLInputElement>('#sensitivity')
  assert.ok(sensitivity)
  sensitivity.value = '150'
  sensitivity.dispatchEvent(new env.window.Event('input', { bubbles: true }))
  assert.ok(handlers.log.includes('sensitivity:1.5'), `journal : ${handlers.log.join(', ')}`)

  // Recherche : Entrée valide le champ.
  const search = env.app.querySelector<HTMLInputElement>('#place-search')
  assert.ok(search)
  search.value = 'Everest'
  search.dispatchEvent(new env.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  assert.ok(handlers.log.includes('search:Everest'))

  // Interrupteur de couche.
  const clouds = env.app.querySelector<HTMLInputElement>('input[data-layer="clouds"]')
  assert.ok(clouds)
  clouds.checked = false
  clouds.dispatchEvent(new env.window.Event('change', { bubbles: true }))
  assert.ok(handlers.log.includes('layer:clouds:false'))

  // Recherche interne de lieux (utilisée par le champ et l'API de recherche).
  const suggestions = hud.suggestPlaces('machu')
  assert.equal(suggestions[0]?.id, 'machu-picchu')
})

test('le viseur, les messages et les panneaux réagissent', async () => {
  const env = setupDom()
  const { Hud } = await import('./hud.ts')
  const hud = new Hud(env.app, makeHandlers())

  hud.setAim({ x: -0.5, y: 0.25 })
  const crosshair = env.app.querySelector<HTMLElement>('#crosshair')
  assert.equal(crosshair?.dataset.visible, 'true')
  assert.match(crosshair?.style.transform ?? '', /translate/)

  hud.setAim(null)
  assert.equal(crosshair?.dataset.visible, 'false')

  hud.toast('Bonjour')
  assert.equal(env.app.querySelectorAll('.toast').length, 1)

  hud.setSettingsVisible(true)
  assert.equal(env.app.querySelector('#settings')?.classList.contains('hidden'), false)
  hud.setSettingsVisible(false)
  assert.equal(env.app.querySelector('#settings')?.classList.contains('hidden'), true)

  hud.showStatus('Chargement…')
  assert.equal(env.app.querySelector('#status-bar')?.hasAttribute('hidden'), false)
  hud.hideStatus()
  assert.equal(env.app.querySelector('#status-bar')?.hasAttribute('hidden'), true)
})

test('l\'aperçu caméra se construit, dessine un squelette et s\'arrête', async () => {
  const env = setupDom()
  const { CameraView } = await import('./cameraView.ts')
  const host = env.document.createElement('div')
  env.app.append(host as unknown as HTMLElement)

  const view = new CameraView(host as unknown as HTMLElement)
  assert.ok(host.querySelector('video'))
  assert.ok(host.querySelector('canvas'))

  const fakeStream = { getTracks: () => [] } as unknown as MediaStream
  await view.attach(fakeStream)
  assert.equal(host.querySelector('video')?.hidden, false)

  const hand = handFromPose('pinch')
  env.calls.length = 0
  view.draw([hand], () => 'grab', 1000)
  assert.ok(env.calls.includes('beginPath'), 'le squelette doit être tracé')
  assert.ok(env.calls.filter((call) => call === 'stroke').length >= 2, 'liaisons + pincement')
  assert.ok(env.calls.includes('clearRect:0,0,320,240'))

  // Le dessin est limité en cadence : un appel trop rapproché ne redessine pas.
  const before = env.calls.length
  view.draw([hand], () => 'grab', 1005)
  assert.equal(env.calls.length, before)

  view.setDimmed(true)
  assert.equal(host.querySelector('.camera-widget')?.getAttribute('data-offset'), 'true')
  view.setVisible(false)
  assert.equal(host.querySelector('.camera-widget')?.getAttribute('data-visible'), 'false')

  view.stop()
  assert.equal(host.querySelector('video')?.hidden, true)
})

test('les étiquettes de lieux se posent, se cachent et réagissent au clic', async () => {
  const env = setupDom()
  const { LabelLayer } = await import('./labels.ts')
  const clicked: string[] = []
  const layer = new LabelLayer(env.app, (id) => clicked.push(id))

  layer.update([
    { id: 'paris', name: 'Tour Eiffel', x: 100, y: 200, visible: true, active: false },
    { id: 'sydney', name: 'Sydney', x: -50, y: 900, visible: false, active: false },
  ])

  const labels = env.app.querySelectorAll<HTMLButtonElement>('.label')
  assert.equal(labels.length, 2)
  assert.equal(labels[0].textContent, 'Tour Eiffel')
  assert.equal(labels[0].dataset.visible, 'true')
  assert.equal(labels[0].style.transform, 'translate(100.0px, 200.0px)')
  assert.equal(labels[1].dataset.visible, 'false')
  assert.equal(labels[1].tabIndex, -1)

  labels[0].click()
  assert.deepEqual(clicked, ['paris'])

  layer.prune(new Set(['paris']))
  assert.equal(env.app.querySelectorAll('.label').length, 1)
})
