/* =========================================================================
   testHands — fabrique de mains synthétiques pour les tests.

   Un gabarit de main réaliste (21 points) que l'on peut poser en cinq poses
   (ouverte, poing, pincement, doigt pointé, pincement de précision) et placer
   où l'on veut dans l'image. Cela permet de tester toute la logique de gestes
   sans caméra, donc sans navigateur.
   ========================================================================= */

import {
  handOpenness,
  isPointingPose,
  maxFingerExtension,
  pinchAmount,
  type Landmark,
} from './landmarks.ts'
import type { HandFrame, HandId } from './handTracker.ts'

export type Pose = 'open' | 'fist' | 'pinch' | 'point'

export interface HandOptions {
  x?: number
  y?: number
  scale?: number
  z?: number
}

/** Gabarit en unités relatives (x vers la droite de l'écran, y vers le bas). */
const TEMPLATE: [number, number][] = [
  [0.0, 0.3], // 0  poignet
  [0.09, 0.2], // 1  pouce : base
  [0.16, 0.08], // 2  pouce : articulation
  [0.22, 0.0], // 3  pouce : entre-nœud
  [0.26, -0.05], // 4  pouce : bout
  [-0.08, -0.05], // 5  index : base
  [-0.09, -0.22], // 6  index : pli
  [-0.09, -0.3], // 7  index : 2e pli
  [-0.09, -0.38], // 8  index : bout
  [0.0, -0.07], // 9  majeur : base
  [0.0, -0.25], // 10
  [0.0, -0.33], // 11
  [0.0, -0.42], // 12 majeur : bout
  [0.08, -0.05], // 13 annulaire : base
  [0.08, -0.22], // 14
  [0.08, -0.29], // 15
  [0.08, -0.37], // 16 annulaire : bout
  [0.15, 0.0], // 17 auriculaire : base
  [0.15, -0.15], // 18
  [0.15, -0.21], // 19
  [0.15, -0.28], // 20 auriculaire : bout
]

/** Replie un doigt sur lui-même (les deux dernières phalanges reviennent en arrière). */
function fold(points: Landmark[], base: number): void {
  const pip = points[base + 1]
  points[base + 2] = { x: pip.x + 0.012, y: pip.y + 0.06, z: pip.z }
  points[base + 3] = { x: pip.x + 0.022, y: pip.y + 0.1, z: pip.z }
}

export function makeHand(pose: Pose, options: HandOptions = {}): Landmark[] {
  const { x = 0.5, y = 0.5, scale = 0.22, z = 0 } = options
  const points: Landmark[] = TEMPLATE.map(([tx, ty]) => ({
    x: x + tx * scale,
    y: y + ty * scale,
    z,
  }))

  if (pose === 'fist') {
    for (const base of [5, 9, 13, 17]) fold(points, base)
    points[4] = { x: points[5].x - 0.02 * scale, y: points[5].y + 0.04 * scale, z }
  }

  if (pose === 'point') {
    for (const base of [9, 13, 17]) fold(points, base)
    // Le pouce reste écarté : sinon ce serait un pincement, pas un doigt pointé.
    points[4] = { x: points[4].x + 0.06 * scale, y: points[4].y - 0.02 * scale, z }
  }

  if (pose === 'pinch') {
    fold(points, 13)
    fold(points, 17)
    points[4] = { ...points[8], x: points[8].x - 0.004, y: points[8].y - 0.004 }
  }

  return points
}

let counter = 0

/** Construit une HandFrame complète (valeurs de repos surchargeables). */
export function makeFrame(overrides: Partial<HandFrame> = {}): HandFrame {
  counter++
  const landmarks = overrides.landmarks ?? makeHand('open')
  return {
    id: 'gauche',
    side: 'gauche',
    score: 1,
    landmarks,
    world: [],
    center: { x: 0.4, y: 0.5 },
    center3: { x: 0.4, y: 0.5, z: 0 },
    pinch: 0,
    spread: 1,
    maxExtension: 1,
    span: 0.2,
    basis: {
      forward: { x: 0, y: -1, z: 0 },
      across: { x: 1, y: 0, z: 0 },
      normal: { x: 0, y: 0, z: -1 },
    },
    pointing: false,
    pointDir: { x: 0, y: -1, z: 0 },
    stale: false,
    ...overrides,
  }
}

/** HandFrame dont les mesures sont calculées à partir d'une pose. */
export function handFromPose(
  pose: Pose,
  overrides: Partial<HandFrame> = {},
  options: HandOptions = {},
): HandFrame {
  const landmarks = makeHand(pose, options)
  return makeFrame({
    landmarks,
    pinch: pinchAmount(landmarks),
    spread: handOpenness(landmarks),
    maxExtension: maxFingerExtension(landmarks),
    pointing: isPointingPose(landmarks),
    ...overrides,
  })
}

/** Paire de mains pincées, écartées d'une distance donnée. */
export function pinchPair(separation: number, center = { x: 0.5, y: 0.5 }): [HandFrame, HandFrame] {
  const a = handFromPose('pinch', {
    id: 'gauche' as HandId,
    side: 'gauche',
    center: { x: center.x - separation / 2, y: center.y },
  })
  const b = handFromPose('pinch', {
    id: 'droite' as HandId,
    side: 'droite',
    center: { x: center.x + separation / 2, y: center.y },
  })
  return [a, b]
}
