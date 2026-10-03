/* =========================================================================
   celestial — placement de la caméra autour du globe (code pur).

   Le rayon de la Terre vaut 1 dans la scène : les distances sont exprimées en
   rayons terrestres (1 + altitude / 6371 km).
   ========================================================================= */

import { latLonToVector3, solarAltitude, subsolarPoint, type LonLat, type Vec3Like } from '../earth/sun.ts'

export const EARTH_RADIUS_KM = 6371

/** Cadrages disponibles (distances en rayons terrestres). */
export const VIEWS = {
  /** Le globe entier, comme depuis l'espace lointain. */
  globe: { distance: 2.75, fov: 30, label: 'Globe entier' },
  /** Un demi-globe : un continent ou un océan. */
  hemisphere: { distance: 1.9, fov: 34, label: 'Continent' },
  /** Une grande région (l'Europe de l'Ouest, par exemple). */
  region: { distance: 1.4, fov: 40, label: 'Région' },
  /** Le plus près possible : la carte satellite elle-même devient floue. */
  close: { distance: 1.16, fov: 55, label: 'Vue rapprochée' },
} as const

/** Carte du jour utilisée dans public/textures (4096 × 2048). */
export const MAP_WIDTH_PX = 4096
export const MAP_HEIGHT_PX = 2048

export type ViewName = keyof typeof VIEWS

/** Cadrage le plus proche d'une distance donnée (pour l'affichage). */
export function viewOfDistance(distance: number): ViewName {
  let best: ViewName = 'globe'
  let bestDelta = Number.POSITIVE_INFINITY
  for (const name of Object.keys(VIEWS) as ViewName[]) {
    const delta = Math.abs(VIEWS[name].distance - distance)
    if (delta < bestDelta) {
      bestDelta = delta
      best = name
    }
  }
  return best
}

export interface OrbitPose extends LonLat {
  /** Distance au centre de la Terre, en rayons terrestres. */
  distance: number
}

export const DEFAULT_POSE: OrbitPose = { lat: 20, lon: 0, distance: VIEWS.globe.distance }

export function altitudeKm(distance: number): number {
  return Math.max(0, (distance - 1) * EARTH_RADIUS_KM)
}

/** Position d'un point de la surface (ou de la caméra) dans le repère terrestre. */
export function surfacePoint(place: LonLat, radius = 1, out?: Vec3Like): Vec3Like {
  return latLonToVector3(place.lat, place.lon, radius, out)
}

/** Position de la caméra pour un lieu et une distance donnés. */
export function cameraPosition(pose: OrbitPose, out?: Vec3Like): Vec3Like {
  return latLonToVector3(pose.lat, pose.lon, pose.distance, out)
}

/**
 * Nord et est locaux d'un lieu : ils servent à incliner la caméra pour que
 * « le haut de l'écran » soit le nord géographique.
 */
export function localFrame(place: LonLat): { up: Vec3Like; north: Vec3Like; east: Vec3Like } {
  const up = latLonToVector3(place.lat, place.lon, 1)
  const lat = (place.lat * Math.PI) / 180
  const lon = (place.lon * Math.PI) / 180
  return {
    up,
    north: { x: -Math.sin(lat) * Math.cos(lon), y: Math.cos(lat), z: Math.sin(lat) * Math.sin(lon) },
    east: { x: -Math.sin(lon), y: 0, z: -Math.cos(lon) },
  }
}

/**
 * Demi-arc couvert sur le globe, pour un rayon à l'angle `alpha` de l'axe de
 * visée (radiants). Loi des sinus dans le triangle caméra–centre–point touché,
 * bornée par l'horizon.
 */
export function arcForRayAngle(distance: number, alpha: number): number {
  const d = Math.max(1.0001, distance)
  const sinBeta = Math.min(1, d * Math.sin(alpha))
  const beta = Math.asin(sinBeta)
  const gamma = beta - alpha
  const horizon = Math.acos(1 / d)
  return Math.max(0, Math.min(gamma, horizon))
}

/** Largeur (km) et hauteur (km) de la zone visible au centre de l'écran. */
export function visibleField(
  distance: number,
  fovDeg: number,
  aspect: number,
): { widthKm: number; heightKm: number } {
  const halfV = (fovDeg * Math.PI) / 180 / 2
  const halfH = Math.atan(Math.tan(halfV) * aspect)
  const arcV = arcForRayAngle(distance, halfV)
  const arcH = arcForRayAngle(distance, halfH)
  // Les arcs sont en radians : 1 radian d'arc vaut 6371 km à la surface.
  const kmPerRadian = EARTH_RADIUS_KM
  return {
    heightKm: 2 * arcV * kmPerRadian,
    widthKm: 2 * arcH * kmPerRadian,
  }
}

/** Détail réel de la carte satellite, en kilomètres par pixel. */
export function mapKilometersPerPixel(latDeg: number): number {
  const equatorial = 2 * Math.PI * EARTH_RADIUS_KM
  const perPixelLon = equatorial / MAP_WIDTH_PX
  const perPixelLat = equatorial / 2 / MAP_HEIGHT_PX
  const cosLat = Math.max(Math.cos((latDeg * Math.PI) / 180), 0.05)
  return Math.max(perPixelLon * cosLat, perPixelLat)
}

/** Résolution au sol approchée, en mètres par pixel. */
export function metersPerPixel(distance: number, fovDeg: number, viewportHeightPx: number): number {
  if (viewportHeightPx <= 0) return 0
  const altitude = altitudeKm(distance) * 1000
  const anglePerPixel = (fovDeg * Math.PI) / 180 / viewportHeightPx
  return altitude * anglePerPixel
}

export interface ShotInfo extends LonLat {
  altitude: number
  metersPerPixel: number
  /** Hauteur du Soleil au-dessus de l'horizon (degrés). */
  sunAltitude: number
  isDay: boolean
  subsolar: LonLat
}

/** Caractéristiques de la prise de vue en cours (affichées par l'interface). */
export function shotInfo(pose: OrbitPose, date: Date, fovDeg: number, viewportHeightPx: number): ShotInfo {
  const sunAltitude = solarAltitude(pose.lat, pose.lon, date)
  return {
    lat: pose.lat,
    lon: pose.lon,
    altitude: altitudeKm(pose.distance),
    metersPerPixel: metersPerPixel(pose.distance, fovDeg, viewportHeightPx),
    sunAltitude,
    isDay: sunAltitude > 0,
    subsolar: subsolarPoint(date),
  }
}
