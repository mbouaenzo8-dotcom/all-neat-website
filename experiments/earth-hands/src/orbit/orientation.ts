/* =========================================================================
   orientation — comment tourner le globe pour qu'un lieu passe face caméra.

   Code pur (testé) : la caméra reste fixe sur +x, c'est la Terre qui tourne.
   C'est le modèle le plus intuitif : pousser « fait tourner le globe », et
   l'axe des pôles s'incline naturellement quand on regarde une haute latitude.

   Convention du repère terrestre (voir earth/sun.ts) :
     x = cos(lat)·cos(lon), y = sin(lat), z = -cos(lat)·sin(lon)
   La caméra est en (distance, 0, 0), regarde l'origine, avec +y vers le haut.
   L'écran a donc pour droite le vecteur (0, 0, -1) du monde.
   ========================================================================= */

import { latLonToVector3, type Vec3Like } from '../earth/sun.ts'

/** Matrice 3×3 en colonnes : [colonne0, colonne1, colonne2]. */
export type Mat3 = [number, number, number, number, number, number, number, number, number]

export const IDENTITY3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1]

/** Applique une matrice (colonnes) à un vecteur. */
export function applyMat3(m: Mat3, v: Vec3Like): Vec3Like {
  return {
    x: m[0] * v.x + m[3] * v.y + m[6] * v.z,
    y: m[1] * v.x + m[4] * v.y + m[7] * v.z,
    z: m[2] * v.x + m[5] * v.y + m[8] * v.z,
  }
}

export function determinant(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[7] * m[5]) -
    m[3] * (m[1] * m[8] - m[7] * m[2]) +
    m[6] * (m[1] * m[5] - m[4] * m[2])
  )
}

export function multiplyMat3(a: Mat3, b: Mat3): Mat3 {
  const out = new Array(9).fill(0) as number[]
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      let sum = 0
      for (let k = 0; k < 3; k++) sum += a[k * 3 + row] * b[column * 3 + k]
      out[column * 3 + row] = sum
    }
  }
  return out as unknown as Mat3
}

/** Repère local d'un lieu : (up, north, east) en colonnes. */
export function localFrameColumns(latDeg: number, lonDeg: number): Mat3 {
  const up = latLonToVector3(latDeg, lonDeg, 1)
  const lat = (latDeg * Math.PI) / 180
  const lon = (lonDeg * Math.PI) / 180
  const north = {
    x: -Math.sin(lat) * Math.cos(lon),
    y: Math.cos(lat),
    z: Math.sin(lat) * Math.sin(lon),
  }
  const east = { x: -Math.sin(lon), y: 0, z: -Math.cos(lon) }
  return [up.x, up.y, up.z, north.x, north.y, north.z, east.x, east.y, east.z]
}

/** Rotation du globe pour amener (lat, lon) face caméra, nord vers le haut. */
export function earthOrientation(latDeg: number, lonDeg: number, rollDeg = 0): Mat3 {
  // M : repère local du lieu.  D : repère écran (droite, haut, arrière).
  const m = localFrameColumns(latDeg, lonDeg)
  const d: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, -1]
  // d · mᵀ  → rotation cherchée (produit de deux réflexions : déterminant +1).
  const mt: Mat3 = [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]
  const orientation = multiplyMat3(d, mt)
  if (!rollDeg) return orientation
  // Roulis : rotation autour de l'axe de visée (+x), appliquée après.
  const r = (rollDeg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  const roll: Mat3 = [1, 0, 0, 0, c, s, 0, -s, c]
  return multiplyMat3(roll, orientation)
}

/** Version ligne par ligne, directement utilisable par THREE.Matrix4.set(). */
export function toRowMajor(m: Mat3): [number, number, number, number, number, number, number, number, number] {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]
}

/** Repère local d'un lieu (nord, est, haut) en tableau. */
export function localFrame(latDeg: number, lonDeg: number): { north: Vec3Like; east: Vec3Like; up: Vec3Like } {
  const columns = localFrameColumns(latDeg, lonDeg)
  return {
    up: { x: columns[0], y: columns[1], z: columns[2] },
    north: { x: columns[3], y: columns[4], z: columns[5] },
    east: { x: columns[6], y: columns[7], z: columns[8] },
  }
}
