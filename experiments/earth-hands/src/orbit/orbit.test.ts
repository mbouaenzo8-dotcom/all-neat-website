/* =========================================================================
   Tests du contrôleur d'orbite et du pilotage à la main (code pur).
   ========================================================================= */

import test from 'node:test'
import assert from 'node:assert/strict'

import { OrbitController, angularDistance, easeInOut, shortestDelta } from './orbitController.ts'
import { HandControl } from '../control/handControl.ts'
import { GestureFsm } from '../vision/gestureFsm.ts'
import { handFromPose, makeFrame } from '../vision/testHands.ts'
import type { HandFrame } from '../vision/handTracker.ts'

/* ---------------------------------------------------------------- orbite */

test('shortestDelta prend toujours le chemin le plus court', () => {
  assert.equal(shortestDelta(170, -170), 20)
  assert.equal(shortestDelta(-170, 170), -20)
  assert.ok(Math.abs(shortestDelta(10, 20) - 10) < 1e-9)
})

test('easeInOut part de 0, finit à 1 et reste borné', () => {
  assert.equal(easeInOut(0), 0)
  assert.equal(easeInOut(1), 1)
  assert.equal(easeInOut(-5), 0)
  assert.equal(easeInOut(12), 1)
  assert.ok(Math.abs(easeInOut(0.5) - 0.5) < 1e-9)
})

test('angularDistance mesure la distance entre deux lieux', () => {
  const paris = { lat: 48.85, lon: 2.35, distance: 2 }
  const sydney = { lat: -33.87, lon: 151.21, distance: 2 }
  const distance = angularDistance(paris, sydney)
  // Distance réelle Paris–Sydney : ~16 960 km, soit ~152,5° d'arc.
  assert.ok(Math.abs(distance - 152.5) < 1.5, `Paris–Sydney = ${distance.toFixed(1)}°`)
  assert.ok(angularDistance(paris, paris) < 1e-9)
})

test('le lissage rapproche la cible sans la dépasser', () => {
  const orbit = new OrbitController({ initial: { lat: 0, lon: 0, distance: 2.5 } })
  orbit.rotateBy(10, 20)
  for (let i = 0; i < 60; i++) orbit.update(1 / 60, i * (1000 / 60))
  assert.ok(Math.abs(orbit.pose.lat - 10) < 0.05, `lat = ${orbit.pose.lat}`)
  assert.ok(Math.abs(orbit.pose.lon - 20) < 0.05, `lon = ${orbit.pose.lon}`)
})

test('le zoom reste dans les bornes', () => {
  const orbit = new OrbitController({ initial: { lat: 0, lon: 0, distance: 2.5 } })
  for (let i = 0; i < 200; i++) orbit.zoomBy(0.8)
  assert.ok(orbit.target.distance >= 1.045, `distance mini = ${orbit.target.distance}`)
  for (let i = 0; i < 400; i++) orbit.zoomBy(1.3)
  assert.ok(orbit.target.distance <= 9, `distance maxi = ${orbit.target.distance}`)
})

test('un vol vers Sydney traverse le Pacifique et se termine à Sydney', () => {
  const orbit = new OrbitController({ initial: { lat: 48.85, lon: 2.35, distance: 2.65 } })
  orbit.update(0.016, 0)
  orbit.flyTo(-33.87, 151.21, { distance: 1.32, durationMs: 1000 })

  // À mi-parcours, le globe est vu de plus loin (surélévation du survol).
  orbit.update(0.016, 500)
  const mid = orbit.pose
  assert.ok(mid.distance > 1.6, `distance à mi-vol = ${mid.distance}`)

  orbit.update(0.016, 1000)
  assert.equal(orbit.flying, false)
  assert.ok(Math.abs(orbit.pose.lat + 33.87) < 0.6, `lat = ${orbit.pose.lat}`)
  assert.ok(Math.abs(shortestDelta(orbit.pose.lon, 151.21)) < 0.6, `lon = ${orbit.pose.lon}`)
  assert.ok(Math.abs(orbit.pose.distance - 1.32) < 1e-6)

  // La longitude intermédiaire ne fait pas le tour « par l'ouest ».
  const arrival = orbit.consumeArrival()
  assert.ok(arrival)
})

test('jumpTo place la vue instantanément', () => {
  const orbit = new OrbitController()
  orbit.jumpTo({ lat: 35.68, lon: 139.69, distance: 1.5 })
  assert.ok(Math.abs(orbit.pose.lat - 35.68) < 1e-9)
  assert.ok(Math.abs(orbit.pose.distance - 1.5) < 1e-9)
})

/* ------------------------------------------------------- pilotage à la main */

/** Main serrée (prise) par défaut : c'est le cas d'usage du pilotage. */
function hand(overrides: Partial<HandFrame> = {}): HandFrame {
  return makeFrame({ pinch: 0.9, spread: 0.2, maxExtension: 0.1, ...overrides })
}

test('la prise suit la main : pousser à droite fait tourner le globe vers l\'ouest', () => {
  const control = new HandControl()
  const fsm = new GestureFsm()
  const context = { lat: 0, distance: 2.65 }

  fsm.update(0, [hand({ center: { x: 0.5, y: 0.5 } })])
  assert.equal(control.update(fsm.update(16, [hand({ center: { x: 0.5, y: 0.5 } })]), [hand()], 1 / 60, context).rotate, null)

  // La main part de 0,5 → on note la référence, puis on pousse de 0,1 vers la droite.
  control.update(fsm.update(32, [hand({ center: { x: 0.6, y: 0.5 } })]), [hand({ center: { x: 0.6, y: 0.5 } })], 1 / 60, context)
  const moved = control.update(
    fsm.update(48, [hand({ center: { x: 0.7, y: 0.5 } })]),
    [hand({ center: { x: 0.7, y: 0.5 } })],
    1 / 60,
    context,
  )
  assert.ok(moved.rotate, 'un déplacement doit produire une rotation')
  assert.ok(moved.rotate!.dLon < 0, `la longitude doit diminuer (vers l'ouest) : ${moved.rotate!.dLon}`)
  assert.ok(moved.rotate!.dLat === 0 || Math.abs(moved.rotate!.dLat) < 1e-9)
})

test('deux mains qui s\'écartent zooment en avant', () => {
  const control = new HandControl()
  const fsm = new GestureFsm()
  const context = { lat: 0, distance: 2.65 }
  const a = () => handFromPose('pinch', { id: 'gauche', side: 'gauche', center: { x: 0.35, y: 0.5 } })
  const b = (x: number) => handFromPose('pinch', { id: 'droite', side: 'droite', center: { x, y: 0.5 } })

  const state = fsm.update(0, [a(), b(0.65)])
  assert.equal(state.mode, 'zoom')
  const first = control.update(state, [a(), b(0.65)], 1 / 60, context)
  assert.equal(first.zoom, null, 'la première image note seulement la référence')

  const wider = control.update(fsm.update(16, [a(), b(0.75)]), [a(), b(0.75)], 1 / 60, context)
  assert.ok(wider.zoom && wider.zoom < 1, `facteur = ${wider.zoom} (doit être < 1 pour se rapprocher)`)
})

test('le viseur donne une position écran et un clic', () => {
  const control = new HandControl()
  const fsm = new GestureFsm()
  const context = { lat: 0, distance: 2.65 }
  const pointing = handFromPose('point', { center: { x: 0.25, y: 0.6 } }, { x: 0.25, y: 0.75 })

  const state = fsm.update(0, [pointing])
  assert.equal(state.mode, 'point')
  const aimed = control.update(state, [pointing], 1 / 60, context)
  assert.ok(aimed.aim, 'le viseur doit fournir une position')
  assert.ok(aimed.aim!.x < 0, `x = ${aimed.aim!.x} (main à gauche de l'image → NDC négatif)`)
  assert.ok(aimed.aim!.y < 0, `y = ${aimed.aim!.y} (main en bas → NDC négatif)`)

  const clicking = { ...pointing, pinch: 0.85 }
  const clickState = fsm.update(100, [clicking])
  assert.equal(clickState.click, true)
  assert.equal(control.update(clickState, [clicking], 1 / 60, context).click, true)
})
