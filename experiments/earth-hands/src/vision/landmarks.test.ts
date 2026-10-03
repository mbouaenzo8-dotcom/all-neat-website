/* =========================================================================
   Tests de la logique de gestes — exécutables sans navigateur :
       npm test        (node --test, typescript retiré à la volée)
   On y vérifie la géométrie des mains et la machine à états.
   ========================================================================= */

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  handOpenness,
  isPointingPose,
  maxFingerExtension,
  mirrorLandmarks,
  palmCenter,
  pinchAmount,
} from './landmarks.ts'
import { GestureFsm } from './gestureFsm.ts'

import { handFromPose, makeFrame as frame, makeHand } from './testHands.ts'

/* --------------------------------------------------------------- géométrie */

test('palmCenter trouve le milieu de la paume', () => {
  const hand = makeHand('open', { x: 0.4, y: 0.6, scale: 0.2 })
  const center = palmCenter(hand)
  assert.ok(Math.abs(center.x - 0.4) < 0.02, `x=${center.x}`)
  assert.ok(Math.abs(center.y - 0.576) < 0.03, `y=${center.y}`)
})

test('mirrorLandmarks inverse x et z (image miroir)', () => {
  const hand = makeHand('open')
  const mirrored = mirrorLandmarks(hand)
  assert.equal(mirrored[0].x, 1 - hand[0].x)
  assert.equal(mirrored[0].z, -hand[0].z)
  assert.equal(mirrored[0].y, hand[0].y)
})

test('l\'ouverture distingue poing, main ouverte et doigt pointé', () => {
  const open = handOpenness(makeHand('open'))
  const fist = handOpenness(makeHand('fist'))
  const point = handOpenness(makeHand('point'))

  assert.ok(open > 0.9, `ouvert = ${open}`)
  assert.ok(fist < 0.25, `poing = ${fist}`)
  assert.ok(point > 0.15 && point < 0.45, `pointé = ${point}`)
})

test('l\'extension maximale sépare le poing du doigt pointé', () => {
  // C'est le point clé : la moyenne ne les distingue pas (0,25 dans les deux cas),
  // le maximum oui.
  assert.ok(maxFingerExtension(makeHand('fist')) < 0.25)
  assert.ok(maxFingerExtension(makeHand('point')) > 0.9)
  assert.ok(maxFingerExtension(makeHand('open')) > 0.9)
})

test('pinchAmount : 1 quand les doigts se touchent, 0 quand ils sont écartés', () => {
  const pinched = pinchAmount(makeHand('pinch'))
  const open = pinchAmount(makeHand('open'))
  const point = pinchAmount(makeHand('point'))

  assert.ok(pinched > 0.9, `pincé = ${pinched}`)
  assert.ok(open < 0.2, `ouvert = ${open}`)
  assert.ok(point < 0.2, `pointé = ${point}`)
})

test('isPointingPose : vrai pour un doigt tendu, faux pour les autres poses', () => {
  assert.equal(isPointingPose(makeHand('point')), true)
  assert.equal(isPointingPose(makeHand('open')), false)
  assert.equal(isPointingPose(makeHand('fist')), false)
  // Un pincement « de précision » garde l'index tendu : on reste en visée.
  assert.equal(isPointingPose(makeHand('pinch')), false, 'le majeur tendu exclut la visée')
})

/* ----------------------------------------------------------- machine à états */

test('main ouverte : mode « move » (rotation libre)', () => {
  const fsm = new GestureFsm()
  const state = fsm.update(0, [handFromPose('open')])
  assert.equal(state.mode, 'move')
})

test('pincement : mode « grab », relâchement : retour au repos', () => {
  const fsm = new GestureFsm()
  const pinched = handFromPose('pinch')
  assert.equal(fsm.update(0, [pinched]).mode, 'grab')
  assert.equal(fsm.update(400, [pinched]).mode, 'grab')

  // Doigts écartés : l'accroche tombe.
  const open = handFromPose('open')
  assert.notEqual(fsm.update(500, [open]).mode, 'grab')
})

test('poing : « grab », puis un doigt pointé doit relâcher le poing', () => {
  const fsm = new GestureFsm()
  assert.equal(fsm.update(0, [handFromPose('fist')]).mode, 'grab')

  // Le bug classique : un poing qui s'ouvre en doigt pointé garde l'ouverture
  // moyenne à 0,25, donc resterait accroché si l'on se basait sur la moyenne.
  const pointing = handFromPose('point')
  const state = fsm.update(500, [pointing])
  assert.equal(state.mode, 'point')
})

test('hystérésis du pincement : une valeur limite ne déclenche pas, puis tient', () => {
  const fsm = new GestureFsm()
  // 0,45 est entre le seuil d'accroche (0,6) et celui de relâchement (0,34).
  assert.notEqual(fsm.update(0, [frame({ pinch: 0.45 })]).mode, 'grab')
  assert.equal(fsm.update(100, [frame({ pinch: 0.7 })]).mode, 'grab')
  assert.equal(fsm.update(200, [frame({ pinch: 0.45 })]).mode, 'grab')
})

test('deux mains pincées : « zoom », maintenu après une disparition brève', () => {
  const fsm = new GestureFsm()
  const left = frame({ id: 'gauche', side: 'gauche', pinch: 0.8, center: { x: 0.3, y: 0.5 } })
  const right = frame({ id: 'droite', side: 'droite', pinch: 0.8, center: { x: 0.7, y: 0.5 } })

  const state = fsm.update(0, [left, right])
  assert.equal(state.mode, 'zoom')
  assert.ok(state.zoom)
  assert.equal(state.zoom?.a.id, 'gauche')
  assert.equal(state.zoom?.b.id, 'droite')

  // Une main passe derrière l'autre : on garde le zoom pendant la grâce.
  const grace = fsm.update(100, [{ ...left, stale: true }, right])
  assert.equal(grace.mode, 'zoom')

  // Après la grâce, le zoom est abandonné au profit de la main encore serrée.
  const after = fsm.update(500, [{ ...left, stale: true }, right])
  assert.equal(after.mode, 'grab')
})

test('les mains perdues de vue ne démarrent pas de geste', () => {
  const fsm = new GestureFsm()
  const stale = frame({ pinch: 0.9, stale: true })
  assert.equal(fsm.update(0, [stale]).mode, 'idle')
})

test('rôle des mains pour l\'affichage', () => {
  const fsm = new GestureFsm()
  const left = frame({ id: 'gauche', side: 'gauche', pinch: 0.8 })
  const right = frame({ id: 'droite', side: 'droite', pinch: 0.8, center: { x: 0.7, y: 0.5 } })
  assert.equal(fsm.update(0, [left, right]).mode, 'zoom')
  assert.equal(fsm.roleOf('gauche'), 'zoom')
  assert.equal(fsm.roleOf('droite'), 'zoom')

  // En mode « point », seule la main qui vise a un rôle.
  const fsm2 = new GestureFsm()
  const pointing = handFromPose('point', { id: 'gauche' })
  const other = handFromPose('open', { id: 'droite', center: { x: 0.7, y: 0.5 } })
  assert.equal(fsm2.update(0, [pointing, other]).mode, 'point')
  assert.equal(fsm2.roleOf('gauche'), 'point')
  assert.equal(fsm2.roleOf('droite'), null)
})

test('reset remet la machine à zéro', () => {
  const fsm = new GestureFsm()
  fsm.update(0, [handFromPose('pinch')])
  fsm.reset()
  assert.equal(fsm.current.mode, 'idle')
  assert.equal(fsm.update(1000, []).mode, 'idle')
})

test('viser puis pincer : un clic, pas une prise', () => {
  const fsm = new GestureFsm()
  const pointing = handFromPose('point')
  assert.equal(fsm.update(0, [pointing]).mode, 'point')
  assert.equal(fsm.update(100, [pointing]).click, false)

  // Le pouce vient toucher l'index : la visée tient, un clic part.
  const clicking = handFromPose('point', { pinch: 0.85 })
  const clickFrame = fsm.update(200, [clicking])
  assert.equal(clickFrame.mode, 'point', 'le clic ne doit pas devenir une prise')
  assert.equal(clickFrame.click, true)

  // L'impulsion ne dure qu'une image.
  assert.equal(fsm.update(260, [clicking]).click, false)
  assert.equal(fsm.update(320, [clicking]).mode, 'point')

  // Relâchement puis nouveau clic.
  const released = handFromPose('point', { pinch: 0.05 })
  assert.equal(fsm.update(400, [released]).click, false)
  assert.equal(fsm.update(500, [clicking]).click, true)
})

test('un pincement hors visée reste une prise', () => {
  const fsm = new GestureFsm()
  const pinch = handFromPose('pinch')
  assert.equal(fsm.update(0, [pinch]).mode, 'grab')
  assert.equal(fsm.update(50, [pinch]).click, false)
})
