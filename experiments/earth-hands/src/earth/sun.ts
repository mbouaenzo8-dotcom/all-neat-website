/* =========================================================================
   sun — position du Soleil, côté jour / côté nuit.

   Code pur (testable dans Node) : aucune dépendance à three.js ni au DOM.

   Repère de la Terre dans la scène (repère de three.js) :
     - y vers le pôle Nord, rayon 1 pour la sphère unité ;
     - l'origine des longitudes (méridien de Greenwich) est sur +x ;
     - x = cos(lat)·cos(lon), y = sin(lat), z = -cos(lat)·sin(lon).
   (Vérifié sur le code source de SphereGeometry de three.js : la première
   colonne de la texture équirectangulaire, u = 0, correspond à lon = -180°.)
   ========================================================================= */

const DEG = Math.PI / 180

export interface LonLat {
  lat: number
  lon: number
}

export interface Vec3Like {
  x: number
  y: number
  z: number
}

/** Ramène un angle en degrés dans [0, 360). */
export function normalize360(deg: number): number {
  const value = deg % 360
  return value < 0 ? value + 360 : value
}

/** Ramène une longitude en degrés dans [-180, 180). */
export function normalizeLon(deg: number): number {
  const value = ((deg + 180) % 360 + 360) % 360 - 180
  return value
}

/** Jour julien d'un instant (peut être fractionnaire). */
export function julianDay(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5
}

/** Numéro du jour dans l'année (1 = 1er janvier). */
export function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1)
  return Math.floor((date.getTime() - start) / 86_400_000) + 1
}

/**
 * Longitude écliptique vraie du Soleil, en degrés.
 * C'est la référence qui permet de calculer la déclinaison et la phase de la Lune.
 */
export function sunTrueLongitude(date: Date): number {
  const T = (julianDay(date) - 2_451_545) / 36_525
  const L = normalize360(280.46646 + 36_000.76983 * T + 0.0003032 * T * T)
  const M = 357.52911 + 35_999.05029 * T - 0.0001537 * T * T
  const C =
    Math.sin(M * DEG) * (1.914602 - 0.004817 * T - 0.000014 * T * T) +
    Math.sin(2 * M * DEG) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * DEG) * 0.000289
  return normalize360(L + C)
}

/** Déclinaison solaire (latitude du point subsolaire), en degrés. */
export function solarDeclination(date: Date): number {
  const T = (julianDay(date) - 2_451_545) / 36_525
  const omega = 125.04 - 1934.136 * T
  // Correction de nutation / aberration : le Soleil « apparent ».
  const apparentLong = sunTrueLongitude(date) - 0.00569 - 0.00478 * Math.sin(omega * DEG)
  const obliquity = 23.439291 - 0.0130042 * T
  return Math.asin(Math.sin(obliquity * DEG) * Math.sin(apparentLong * DEG)) / DEG
}

/** Équation du temps, en minutes (écart entre le Soleil vrai et le Soleil moyen). */
export function equationOfTime(date: Date): number {
  const B = ((2 * Math.PI) / 365) * (dayOfYear(date) - 81)
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/**
 * Point subsolaire : l'endroit de la Terre où le Soleil est exactement au zénith.
 * C'est lui qui détermine le terminateur (la frontière jour/nuit).
 */
export function subsolarPoint(date: Date): LonLat {
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3_600_000
  const lon = -15 * (utcHours - 12) - equationOfTime(date) / 4
  return { lat: solarDeclination(date), lon: normalizeLon(lon) }
}

/** Convertit une latitude / longitude en vecteur 3D unitaire du repère terrestre. */
export function latLonToVector3(latDeg: number, lonDeg: number, radius = 1, out: Vec3Like = { x: 0, y: 0, z: 0 }): Vec3Like {
  const lat = latDeg * DEG
  const lon = lonDeg * DEG
  const cosLat = Math.cos(lat)
  out.x = radius * cosLat * Math.cos(lon)
  out.y = radius * Math.sin(lat)
  out.z = -radius * cosLat * Math.sin(lon)
  return out
}

/** Latitude / longitude d'un point du repère terrestre. */
export function vector3ToLatLon(point: Vec3Like): LonLat {
  const radius = Math.hypot(point.x, point.y, point.z)
  if (radius < 1e-9) return { lat: 0, lon: 0 }
  return {
    lat: Math.asin(point.y / radius) / DEG,
    lon: normalizeLon(Math.atan2(-point.z, point.x) / DEG),
  }
}

/** Direction du Soleil dans le repère terrestre (vecteur unitaire). */
export function sunDirection(date: Date, out: Vec3Like = { x: 0, y: 0, z: 0 }): Vec3Like {
  const subsolar = subsolarPoint(date)
  return latLonToVector3(subsolar.lat, subsolar.lon, 1, out)
}

/**
 * Hauteur du Soleil au-dessus de l'horizon d'un lieu, en degrés.
 * Négatif = nuit, positif = jour.
 */
export function solarAltitude(latDeg: number, lonDeg: number, date: Date): number {
  const place = latLonToVector3(latDeg, lonDeg, 1)
  const sun = sunDirection(date)
  const dot = place.x * sun.x + place.y * sun.y + place.z * sun.z
  return Math.asin(Math.max(-1, Math.min(1, dot))) / DEG
}

/** Le lieu est-il éclairé par le Soleil ? */
export function isDaylight(latDeg: number, lonDeg: number, date: Date): boolean {
  return solarAltitude(latDeg, lonDeg, date) > 0
}

/** Instant du midi solaire vrai d'un lieu (pour l'observation « heure locale »). */
export function solarNoon(date: Date, lonDeg: number): Date {
  const utcHours = 12 - lonDeg / 15 - equationOfTime(date) / 60
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return new Date(dayStart + utcHours * 3_600_000)
}
