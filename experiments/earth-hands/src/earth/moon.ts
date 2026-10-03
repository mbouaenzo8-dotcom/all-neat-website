/* =========================================================================
   moon — direction et phase de la Lune (approximation Meeus simplifiée).

   Suffisant pour placer la Lune au bon endroit dans le ciel (à quelques
   degrés) et pour afficher la bonne phase. Position et phase sont réelles ;
   en revanche la scène exagère volontairement sa taille et sa distance.
   ========================================================================= */

import { julianDay, normalize360, sunTrueLongitude, type Vec3Like } from './sun.ts'

const DEG = Math.PI / 180
const OBLIQUITY = 23.4393

export interface MoonState {
  /** Direction de la Lune dans le repère terrestre (vecteur unitaire). */
  direction: Vec3Like
  /** Fraction éclairée : 0 = nouvelle Lune, 1 = pleine Lune. */
  phase: number
  /** 0 = nouvelle, 1 = premier quartier, 2 = pleine, 3 = dernier quartier. */
  phaseName: string
}

/** Ascension droite de Greenwich (angle de rotation de la Terre), en degrés. */
export function greenwichSiderealAngle(date: Date): number {
  const jd = julianDay(date)
  const T = (jd - 2_451_545) / 36_525
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2_451_545) +
    0.000387933 * T * T -
    (T * T * T) / 38_710_000
  return normalize360(gmst)
}

/** Coordonnées écliptiques de la Lune (longitude, latitude), en degrés. */
export function moonEcliptic(date: Date): { longitude: number; latitude: number } {
  const d = julianDay(date) - 2_451_545
  const L = 218.316 + 13.176396 * d
  const M = 134.963 + 13.064993 * d
  const F = 93.272 + 13.22935 * d
  return {
    longitude: normalize360(L + 6.289 * Math.sin(M * DEG)),
    latitude: 5.128 * Math.sin(F * DEG),
  }
}

/** Passage écliptique → équatorial (J2000), puis → repère terrestre tournant. */
export function eclipticToEarthFixed(
  longitudeDeg: number,
  latitudeDeg: number,
  date: Date,
  out: Vec3Like = { x: 0, y: 0, z: 0 },
): Vec3Like {
  const lon = longitudeDeg * DEG
  const lat = latitudeDeg * DEG
  const eps = OBLIQUITY * DEG

  // Repère équatorial : x vers le point vernal, z vers le pôle céleste nord.
  const xEq = Math.cos(lat) * Math.cos(lon)
  const yEq = Math.cos(eps) * Math.cos(lat) * Math.sin(lon) - Math.sin(eps) * Math.sin(lat)
  const zEq = Math.sin(eps) * Math.cos(lat) * Math.sin(lon) + Math.cos(eps) * Math.sin(lat)

  // Rotation de la Terre : le méridien de Greenwich tourne avec l'heure sidérale.
  const theta = greenwichSiderealAngle(date) * DEG
  const cosT = Math.cos(theta)
  const sinT = Math.sin(theta)
  const xFixed = cosT * xEq + sinT * yEq
  const yFixed = -sinT * xEq + cosT * yEq

  // Repère de la scène (y vers le pôle nord, z = -y_fixe).
  out.x = xFixed
  out.y = zEq
  out.z = -yFixed
  return out
}

/** État complet de la Lune à un instant donné. */
export function moonState(date: Date): MoonState {
  const { longitude, latitude } = moonEcliptic(date)
  const direction = eclipticToEarthFixed(longitude, latitude, date)

  // Élongation soleil–Lune : elle donne la phase.
  const elongation = normalize360(longitude - sunTrueLongitude(date))
  const phase = (1 - Math.cos(elongation * DEG)) / 2

  // Nom de la phase à partir de l'élongation (0° = nouvelle, 180° = pleine).
  const names = ['nouvelle Lune', 'premier croissant', 'premier quartier', 'gibbeuse croissante',
    'pleine Lune', 'gibbeuse décroissante', 'dernier quartier', 'dernier croissant']
  const phaseName = names[Math.round(elongation / 45) % 8]

  return { direction, phase, phaseName }
}
