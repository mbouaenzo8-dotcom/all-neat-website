/* =========================================================================
   Géométrie des mains (code pur, sans DOM) — utilisé par handTracker.ts
   et testé par landmarkLogic.test.ts.

   Conventions :
   - les coordonnées sont *normalisées* (x, y dans [0, 1]) ;
   - x a déjà été remis dans le repère de l'écran (image miroir, comme la
     vidéo affichée) : x = 0 à gauche de l'écran, x = 1 à droite ;
   - z est relatif (la tête de MediaPipe) : plus z est grand, plus le point
     est loin de la caméra.
   ========================================================================= */

export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Chaîne articulaire d'une main (21 points), ordre MediaPipe. */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // pouce
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [5, 9], [9, 10], [10, 11], [11, 12],      // majeur
  [9, 13], [13, 14], [14, 15], [15, 16],    // annulaire
  [13, 17], [17, 18], [18, 19], [19, 20],   // auriculaire
  [0, 17],                                   // bord de la paume
]

/** Indices MediaPipe des articulations. */
export const LM = {
  wrist: 0,
  thumbMcp: 2,
  thumb: 4,
  indexMcp: 5,
  indexPip: 6,
  index: 8,
  middleMcp: 9,
  middle: 12,
  ringMcp: 13,
  ring: 16,
  pinkyMcp: 17,
  pinky: 20,
} as const

export const FINGER_BASE = [5, 9, 13, 17] as const // index, majeur, annulaire, auriculaire

export interface PalmBasis {
  /** du poignet vers les doigts (axe long de la paume) */
  forward: Vec3
  /** du bord auriculaire vers le bord de l'index */
  across: Vec3
  /** normale à la paume (approximative : la paume n'est pas plane) */
  normal: Vec3
}

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x
}

/** Interpolation lisse de 0 (x ≤ e0) à 1 (x ≥ e1), avec une courbe douce. */
export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

export function sub(a: Landmark, b: Landmark): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

export function length(a: Vec3): number {
  return Math.hypot(a.x, a.y, a.z)
}

export function normalize(a: Vec3): Vec3 {
  const n = length(a)
  if (n < 1e-9) return { x: 0, y: 0, z: 0 }
  return { x: a.x / n, y: a.y / n, z: a.z / n }
}

export function dist2D(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function dist3D(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Centre de la paume : moyenne des points fixes de la main (poignet + bases). */
export function palmCenter(lm: readonly Landmark[]): { x: number; y: number } {
  const idx = [LM.wrist, LM.indexMcp, LM.middleMcp, LM.ringMcp, LM.pinkyMcp]
  let x = 0
  let y = 0
  for (const i of idx) {
    x += lm[i].x
    y += lm[i].y
  }
  return { x: x / idx.length, y: y / idx.length }
}

/** Centre 3D de la paume (z compris) — sert à ordonner les mains en profondeur. */
export function palmCenter3(lm: readonly Landmark[]): Vec3 {
  const idx = [LM.wrist, LM.indexMcp, LM.middleMcp, LM.ringMcp, LM.pinkyMcp]
  let x = 0
  let y = 0
  let z = 0
  for (const i of idx) {
    x += lm[i].x
    y += lm[i].y
    z += lm[i].z
  }
  return { x: x / idx.length, y: y / idx.length, z: z / idx.length }
}

/** Envergure apparente de la main (fraction de la largeur de l'image). */
export function handSpan(lm: readonly Landmark[]): number {
  const c = palmCenter(lm)
  let sum = 0
  for (const p of lm) sum += Math.hypot(p.x - c.x, p.y - c.y)
  return sum / lm.length
}

/**
 * État d'extension d'un doigt : 1 = tendu, 0 = replié.
 * On mesure l'alignement des deux dernières phalanges (angle au pli).
 */
export function fingerExtension(lm: readonly Landmark[], base: number): number {
  const a = lm[base]
  const b = lm[base + 1]
  const tip = lm[base + 3]
  const u = sub(b, a)
  const v = sub(tip, b)
  const nu = length(u)
  const nv = length(v)
  if (nu < 1e-6 || nv < 1e-6) return 0
  const cosAngle = dot(u, v) / (nu * nv)
  return smoothstep(-0.15, 0.72, cosAngle)
}

/** Extension du pouce (il se replie en travers de la paume, d'où un seuil différent). */
export function thumbExtension(lm: readonly Landmark[]): number {
  const u = sub(lm[LM.thumbMcp], lm[1])
  const v = sub(lm[LM.thumb], lm[LM.thumbMcp])
  const nu = length(u)
  const nv = length(v)
  if (nu < 1e-6 || nv < 1e-6) return 0
  return smoothstep(-0.55, 0.45, dot(u, v) / (nu * nv))
}

/**
 * Quantité de pincement pouce/index : 1 = doigts collés, 0 = largement écartés.
 * Le rapport est normalisé par la taille de la main, ce qui le rend indépendant
 * de la distance à la caméra.
 */
export function pinchAmount(lm: readonly Landmark[]): number {
  const gap = dist3D(lm[LM.thumb], lm[LM.index])
  const ref = Math.max(dist3D(lm[LM.wrist], lm[LM.middleMcp]), 1e-4)
  const ratio = gap / ref
  // Seuils mesurés empiriquement : ~0.2 doigts collés, ~0.75 doigts écartés.
  return clamp01(1 - smoothstep(0.22, 0.72, ratio))
}

/** Ouverture globale : 0 = poing fermé, 1 = main grande ouverte. */
export function handOpenness(lm: readonly Landmark[]): number {
  const fingers = FINGER_BASE.map((b) => fingerExtension(lm, b))
  return clamp01(fingers.reduce((a, b) => a + b, 0) / fingers.length)
}

/**
 * Extension du doigt le plus tendu.
 * Sert à reconnaître un poing : dans un poing *tous* les doigts sont repliés,
 * alors qu'un doigt pointé a un doigt tendu. La moyenne, elle, ne distingue
 * pas un poing d'un doigt pointé (0,25 dans les deux cas).
 */
export function maxFingerExtension(lm: readonly Landmark[]): number {
  return FINGER_BASE.reduce((best, base) => Math.max(best, fingerExtension(lm, base)), 0)
}

/** Repère de la paume, exprimé dans l'espace image (x écran, y vers le bas, z vers la caméra négatif). */
export function palmBasis(lm: readonly Landmark[]): PalmBasis {
  const wrist = lm[LM.wrist]
  const forward = normalize(sub(lm[LM.middleMcp], wrist))
  const across = normalize(sub(lm[LM.indexMcp], lm[LM.pinkyMcp]))
  const normal = normalize(cross(across, forward))
  // Ré-orthogonalisation pour que « across » reste parfaitement perpendiculaire.
  const acrossOrtho = normalize(cross(forward, normal))
  return { forward, across: acrossOrtho, normal }
}

/** Direction du doigt qui pointe (de la base vers la pointe de l'index). */
export function pointDirection(lm: readonly Landmark[]): Vec3 {
  return normalize(sub(lm[LM.index], lm[LM.indexMcp]))
}

/** Position du bout du doigt pointé, en pixels écran. */
export function pointedPixel(
  lm: readonly Landmark[],
  width: number,
  height: number,
): { x: number; y: number } {
  return { x: lm[LM.index].x * width, y: lm[LM.index].y * height }
}

/**
 * Pose « viseur » : index tendu, les trois autres doigts repliés.
 * Le pincement n'entre volontairement pas en compte : on reste en visée même
 * quand le pouce vient toucher l'index — c'est justement le geste du clic.
 * Le signe « peace » est exclu (majeur replié exigé).
 */
export function isPointingPose(lm: readonly Landmark[]): boolean {
  return (
    fingerExtension(lm, LM.indexMcp) > 0.72 &&
    fingerExtension(lm, LM.middleMcp) < 0.4 &&
    fingerExtension(lm, LM.ringMcp) < 0.5 &&
    fingerExtension(lm, LM.pinkyMcp) < 0.5
  )
}

/**
 * Bascule un landmark dans le repère écran (image miroir) :
 * l'utilisateur voit ce qu'il fait, donc la gauche de l'image devient la droite.
 */
export function mirrorLandmarks(lm: readonly Landmark[]): Landmark[] {
  return lm.map((p) => ({ x: 1 - p.x, y: p.y, z: -p.z, visibility: p.visibility }))
}
